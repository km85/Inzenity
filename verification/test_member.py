import os, secrets, base64
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from preview import laboratory
from fixture import client, request

@pytest.fixture
def rig():
    with laboratory(Path(os.environ['INZENITY_REVIEW_CHECKOUT'])) as pair:
        env,data=pair
        yield env,data,client(env,'member'),client(env,'admin')

def test_member_boundary_logout(rig):
    env,_,m,a=rig
    guest=TestClient(env.app)
    assert guest.get('/api/profile').status_code==401
    assert m.get('/api/users').status_code==403
    assert request(m,'GET','auth/me')['user']['role']=='member'
    request(m,'POST','auth/logout',{})
    assert m.get('/api/profile').status_code==401

def test_member_dashboard_reads(rig):
    _,_,m,_=rig
    for path in ('events','announcements','vendors','public/banners','news','public/products?official=true','public/official-partners','public/merchant-partners','chapters','vehicle-options','public/chapters','public/vehicle-options','me/points','me/check-ins','rewards','me/redemptions','me/orders','profile','notifications/status','leaderboard'):
        assert request(m,'GET',path) is not None

def test_registration_pending(rig):
    _,_,m,a=rig
    data=request(m,'POST','register',dict(fullName='Applicant',username='test-applicant',phone='00000000',password=secrets.token_urlsafe(18)))
    assert request(a,'GET','registrations/'+str(data['id']))['status']=='pending'

def test_reminders_and_chapter(rig):
    _,_,m,_=rig
    chapter=request(m,'GET','chapters')[0]['id']
    person={'name':'Synthetic Editor','chapterId':chapter}
    car={'plateNumber':'QA-777','nextMaintenanceDate':'2020-01-02','maintenanceReminderEnabled':True,'maintenanceReminderDays':7,'stnkExpiryDate':'2020-02-02','stnkReminderEnabled':True,'stnkReminderDays':14}
    request(m,'PUT','profile',{'person':person,'vehicle':car})
    p=request(m,'GET','profile')
    assert p['chapter']['id']==chapter and p['user']['name']==person['name']
    assert {r['type'] for r in p['reminders']}=={'maintenance','stnk'}
    assert request(m,'GET','plate-search?plate=777')['count']==1

def test_rsvp_checkin_points_and_attachments(rig):
    _,d,m,_=rig
    eid=d['event']['id']; path=f'events/{eid}'
    request(m,'POST',path+'/rsvp',{'status':'Going'})
    request(m,'POST',path+'/check-in',{'qrToken':d['event']['qrToken'],'method':'qr'})
    assert request(m,'GET','me/points')['balance']==55
    check=request(m,'GET','me/check-ins')[0]
    assert check['eventId']==eid
    image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aKuoAAAAASUVORK5CYII='
    request(m,'POST',f'check-ins/{check["id"]}/photos',{'photos':[image]})
    assert request(m,'GET','me/check-ins')[0]['photos']
    request(m,'POST','redemptions',{'rewardId':request(m,'GET','rewards')[0]['id']})
    assert request(m,'GET','me/redemptions')[0]['status']=='pending'

def test_marketplace_and_inventory_patch(rig):
    _,d,m,a=rig
    goods=request(m,'GET',f'public/products?merchant_id={d["merchant"]["id"]}')
    assert goods[0]['title']=='Garage kit'
    product=request(m,'GET','public/products?official=true')[0]; variant=product['variants'][0]
    order=request(m,'POST','orders',dict(productId=product['id'],variantId=variant['id'],quantity=1,recipientName='Synthetic',address='Test',phone='000000'))
    for status in ('processing','processing','shipped','completed'):
        request(a,'PUT',f'orders/{order["id"]}/status',dict(status=status))
    assert request(m,'GET','me/orders')[0]['status']=='completed'
    assert request(a,'GET',f'products/{product["id"]}')['variants'][0]['stock']==variant['stock']-1

def test_settings_sos_and_password_patch(rig):
    env,_,m,a=rig
    request(m,'PUT','me/language',{'language':'id'})
    assert request(m,'GET','profile')['user']['language']=='id'
    request(m,'POST','notifications/toggle',{'enabled':False})
    assert not request(m,'GET','notifications/status')['notifications_enabled']
    result=request(m,'POST','emergency/alert',{})
    with env.mod.SessionLocal() as db:
        assert db.query(env.mod.EmergencyAlert).filter_by(id=result['alert_id']).one().status=='active'
    for row in request(a,'GET','users'):
        assert not any('password' in key.lower() for key in row)
