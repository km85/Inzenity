import os
import secrets
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from isolated import isolated

ROOT=Path(__file__).resolve().parents[1]
REPO=Path(os.environ['INZENITY_REVIEW_CHECKOUT']).resolve()
PUBLIC=ROOT/'public'
@pytest.fixture
def rig():
    with isolated(REPO,PUBLIC,candidates=os.environ.get('CHECK_CANDIDATES')=='1') as env:
        yield env

def client(env,role):
    c=TestClient(env.app,base_url="https://testserver",raise_server_exceptions=False)
    if role:
        scope='admin' if role=='admin' else 'member' if role=='member' else 'merchant'
        response=c.post('/api/auth/login',json={'username':'qa-'+role,'password':env.creds[role],'scope':scope})
        check(response,200)
    return c

def check(response,status=200):
    if response.status_code!=status:
        pytest.fail(f'{response.request.method} {response.request.url.path}: expected {status}, received {response.status_code}', pytrace=False)

def data(c,method,route,body=None):
    response=c.request(method,'/api/'+route,**({'json':body} if body is not None else {}))
    check(response)
    return response.json()

def member_id(env):return 2

def test_admin_cookie_logout_and_scope(rig):
    anon=client(rig,None)
    check(anon.get('/api/auth/me'),401)
    check(anon.post('/api/auth/login',json={'username':'qa-member','password':rig.creds['member'],'scope':'admin'}),403)
    c=client(rig,'admin')
    assert data(c,'GET','auth/me')['user']['role']=='admin'
    original=c.cookies.get('zenix_session')
    assert bool(original)
    data(c,'POST','auth/logout')
    check(c.get('/api/auth/me'),401)
    # Invalidated test cookie cannot resume the same session.
    c.cookies.set('zenix_session',original)
    check(c.get('/api/auth/me'),401)

def test_permissions(rig):
    for role,expected in [(None,401),('member',403),('merchant',403),('admin',200)]:
        c=client(rig,role)
        for path in ('users','registrations','point-transactions','vehicle-models'):
            check(c.get('/api/'+path),expected)
    check(client(rig,'member').get('/api/orders'),403)
    check(client(rig,'merchant').get('/api/orders'),403)  # no assigned merchant
    merchant=client(rig,'merchant')
    c=client(rig,'admin')
    data(c,'POST','merchant-partners',dict(name='Test merchant',status='active',ownerUserId=3))
    check(merchant.get('/api/orders'),200)
    check(merchant.get('/api/products'),200)

def test_admin_list_credential_fields_absent(rig):
    rows=data(client(rig,'admin'),'GET','users')
    # Check field names only. Never emit the row or its values.
    forbidden=any('password' in row or 'passwordHash' in row for row in rows)
    if forbidden: pytest.fail('User list contains a credential field',pytrace=False)

CRUD={
 'users':({'name':'Test account','username':'qa-new','role':'member','phone':'','city':'Test'},'city','Updated'),
 'events':({'title':'Test gathering','date':'2027-05-01T09:00:00','location':'Test venue','points':5},'title','Revised gathering'),
 'announcements':({'title':'Test notice','content':'Test content','createdAt':'2026-11-20T10:00:00'},'title','Updated notice'),
 'vendors':({'name':'Test vendor','category':'Test','description':'Test','whatsapp':''},'name','Updated vendor'),
 'sponsors':({'name':'Test sponsor','logo':'/admin-v2/club-mark.webp'},'name','Updated sponsor'),
 'banners':({'title':'Test banner','active':True,'order':1},'title','Updated banner'),
 'news':({'title':'Test news','image':'/admin-v2/club-mark.webp','category':'Test','date':'2026-11-20'},'title','Updated news'),
 'merchandise':({'title':'Test cap','price':'5000','points':2,'description':'Test','image':'/admin-v2/club-mark.webp'},'title','Updated cap'),
 'chapters':({'name':'Test chapter'},'name','Updated chapter'),
 'vehicle-models':({'code':'QA','label':'Test model','sortOrder':99},'label','Updated model'),
 'vehicle-years':({'year':2091,'sortOrder':99},'year',2092),
 'vehicle-powertrains':({'code':'QA','label':'Test powertrain'},'label','Updated powertrain'),
 'rewards':({'title':'Test reward','pointsRequired':10,'stock':3,'active':True},'title','Updated reward'),
 'official-partners':({'name':'Test partner','status':'active'},'name','Updated partner'),
 'merchant-partners':({'name':'Test merchant','status':'active'},'name','Updated merchant'),
 'products':({'title':'Test product','price':'5000','active':True,'variants':[{'label':'M','stock':5}]},'title','Updated product')
}
@pytest.mark.parametrize('module',CRUD.keys())
def test_crud_reread(rig,module):
    c=client(rig,'admin')
    entry,key,value=CRUD[module];body=dict(entry)
    if module=='users':body['password']=secrets.token_urlsafe(18)
    saved=data(c,'POST',module,body)
    rid=saved['id']
    assert any(r['id']==rid for r in data(c,'GET',module))
    data(c,'PUT',f'{module}/{rid}',{key:value})
    after=next(r for r in data(c,'GET',module) if r['id']==rid)
    assert after[key]==value
    data(c,'DELETE',f'{module}/{rid}')
    assert not any(r['id']==rid for r in data(c,'GET',module))

def test_registration_decisions_and_vehicle(rig):
    c=client(rig,'admin')
    for state in ('approved','rejected'):
        username='candidate-'+state
        saved=data(c,'POST','register',dict(username=username,fullName='Synthetic applicant',email=username+'@example.invalid',password=secrets.token_urlsafe(24),vehicleModel='V',vehicleYear=2025))
        rid=saved['id']
        data(c,'PUT',f'registrations/{rid}',{'status':state,'rejectionReason':'Test review' if state=='rejected' else ''})
        row=data(c,'GET',f'registrations/{rid}')
        assert row['status']==state
        members=[r for r in data(c,'GET','users') if r['username']==username]
        assert len(members)==int(state=='approved')
        if state=='approved':
            with rig.mod.SessionLocal() as db:
                assert db.query(rig.mod.Vehicle).filter_by(user_id=members[0]['id'],model='V').count()==1
        data(c,'DELETE',f'registrations/{rid}')
        assert all(r['id']!=rid for r in data(c,'GET','registrations'))

def test_points_redemption_and_ranking(rig):
    c=client(rig,'admin');member=client(rig,'member')
    uid=member_id(rig)
    for amount in (50,-5):
        data(c,'POST','point-transactions',dict(userId=uid,amount=amount,description='QA adjustment',source='manual'))
    assert data(c,'GET',f'users/{uid}')['pointsBalance']==45
    reward=data(c,'POST','rewards',dict(title='Test reward',pointsRequired=10,stock=3,active=True))
    redemption=data(member,'POST','redemptions',{'rewardId':reward['id']})
    for state in ('approved','completed'):
        data(c,'PUT',f"redemptions/{redemption['id']}",{'status':state})
    assert data(c,'GET','redemptions')[0]['status']=='completed'
    assert data(c,'GET',f'users/{uid}')['pointsBalance']==35
    assert data(c,'GET','rewards')[0]['stock']==2
    assert len(data(c,'GET','point-transactions'))==3
    assert data(c,'GET','leaderboard?period=monthly')['entries']

def test_order_status_and_persisted_stock(rig):
    admin=client(rig,'admin');member=client(rig,'member')
    product=data(admin,'POST','products',dict(title='QA goods',price='5000',active=True,variants=[dict(label='M',stock=5)]))
    variant=product['variants'][0]['id']
    order=data(member,'POST','orders',dict(productId=product['id'],variantId=variant,quantity=1))
    data(member,'POST',f"orders/{order['id']}/payment",dict(paymentProofImage='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC'))
    data(admin,'PUT',f"orders/{order['id']}/status",dict(status='paid',paymentReference='SYNTHETIC-1'))
    for state in ('processing','processing','shipped','completed'):
        data(admin,'PUT',f"orders/{order['id']}/status",dict(status=state,note='QA'))
    assert data(admin,'GET','orders')[0]['status']=='completed'
    remaining=data(admin,'GET',f"products/{product['id']}")['variants'][0]['stock']
    if remaining!=4: pytest.fail(f'One item ordered from 5; final stock {remaining}, expected 4',pytrace=False)

def test_21_collections(rig):
    c=client(rig,'admin')
    for module in [*CRUD,'registrations','redemptions','point-transactions','orders','leaderboard']:
        result=data(c,'GET',module)
        assert isinstance(result,dict if module=='leaderboard' else list)

def test_member_and_merchant_admin_write_permissions(rig):
    for role in ('member','merchant'):
        c=client(rig,role)
        check(c.post('/api/chapters',json={'name':'Role check'}),403)
        check(c.post('/api/point-transactions',json={'userId':2,'amount':1}),403)
    c=client(rig,'admin')
    assert all(r['name']!='Role check' for r in data(c,'GET','chapters'))
    assert data(c,'GET','point-transactions')==[]

def test_registration_attachment_survives_unrelated_edit(rig):
    c=client(rig,'admin')
    reg=data(c,'POST','register',dict(fullName='Test attachment',username='qa-attachment',password=secrets.token_urlsafe(20)))
    path=f"registrations/{reg['id']}"
    # Generated 1×1 image, unrelated to any person or document.
    pixel='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC'
    data(c,'PUT',path,dict(stnkImage=pixel,paymentProofImage=pixel))
    saved=data(c,'GET',path)
    data(c,'PUT',path,dict(fullName='Updated test attachment'))
    after=data(c,'GET',path)
    for field in ('stnkImage','paymentProofImage'):
        assert after[field]==saved[field] and after[field]
        assert c.get(after[field]).status_code == 200
        assert not (rig.root/'public'/after[field].lstrip('/')).exists()

def test_reject_pending_redemption_keeps_balance_and_stock(rig):
    admin=client(rig,'admin')
    data(admin,'POST','point-transactions',dict(userId=2,amount=20,description='Test credit',source='manual'))
    reward=data(admin,'POST','rewards',dict(title='Test item',pointsRequired=10,stock=1,active=True))
    redemption=data(client(rig,'member'),'POST','redemptions',{'rewardId':reward['id']})
    route=f"redemptions/{redemption['id']}"
    data(admin,'PUT',route,dict(status='rejected',rejectionReason='Test review'))
    assert data(admin,'GET','redemptions')[0]['status']=='rejected'
    assert data(admin,'GET','users/2')['pointsBalance']==20
    assert data(admin,'GET','rewards')[0]['stock']==1
    data(admin,'DELETE',route)
    assert data(admin,'GET','redemptions')==[]
