"""Synthetic records written only inside the disposable Phase 1 test container."""
from fastapi.testclient import TestClient
from datetime import date,timedelta

def request(c, method, path, body=None):
    response=c.request(method,'/api/'+path,**({'json':body} if body is not None else {}))
    if response.status_code!=200:
        raise AssertionError(f'{method} {path.split("?")[0]} returned {response.status_code}')
    return response.json()

def client(env,role):
    c=TestClient(env.app)
    result=request(c,'POST','auth/login',dict(scope=role,username='qa-'+role,password=env.creds[role]))
    c.cookies.clear()
    c.headers['X-API-Token']=result['token']
    return c

def populate(env):
    a=client(env,'admin');m=client(env,'member')
    chapter=request(a,'POST','chapters',dict(name='Demo chapter'))
    event=request(a,'POST','events',dict(title='Community drive',summary='Morning drive',description='Synthetic event',category='Chapter gathering',date=str(date.today()+timedelta(days=8))+'T08:00:00',location='Test meeting point',checkInEnabled=True,points=5))
    request(a,'POST','rewards',dict(title='Club pin',pointsRequired=10,stock=5,active=True))
    request(a,'POST','point-transactions',dict(userId=2,amount=50,source='manual',description='Synthetic opening balance'))
    request(a,'POST','official-partners',dict(name='Demo partner',status='active'))
    partner=request(a,'POST','merchant-partners',dict(name='Demo garage',status='active'))
    request(a,'POST','products',dict(title='Club cap',price='50000',active=True,isOfficialMerchandise=True,variants=[dict(label='M',stock=7)]))
    request(a,'POST','products',dict(title='Garage kit',price='10000',merchantPartnerId=partner['id'],isOfficialMerchandise=False,active=True))
    request(a,'POST','vendors',dict(name='Demo workshop',description='Synthetic directory listing',category='Service',whatsapp=''))
    request(m,'PUT','profile',dict(person=dict(name='Demo Member',chapterId=chapter['id'],language='en'),vehicle=dict(nickname='Innova Zenix',plateNumber='QA 0001',model='Q',powertrain='Hybrid',year=2025)))
    return {'event':event,'merchant':partner}
