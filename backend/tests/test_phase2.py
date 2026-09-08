from datetime import datetime, timedelta
import pytest

ADMIN_CREDS = {"username": "admin", "password": "admin123", "scope": "admin"}
MEMBER_CREDS = {"username": "raka", "password": "member123", "scope": "member"}


def h(token):
    return {"x-api-token": token}


def create_event(client, admin_token, *, points=100, geo=False, lat="-6.2", lon="106.8"):
    now = datetime.utcnow()
    payload = {
        "title": "Phase2 Test Event",
        "date": (now + timedelta(days=1)).isoformat(),
        "location": "Test Lokasi",
        "summary": "Test summary",
        "description": "Test description",
        "category": "meetup",
        "points": points,
        "checkInEnabled": True,
        "checkInStart": (now - timedelta(hours=1)).isoformat(),
        "checkInEnd": (now + timedelta(hours=2)).isoformat(),
        "geoValidationEnabled": geo,
        "geoRadiusMeters": 500,
        "locationLat": lat,
        "locationLon": lon,
    }
    r = client.post("/api/events", json=payload, headers=h(admin_token))
    assert r.status_code == 200, r.text
    return r.json()


def create_reward(client, admin_token, **overrides):
    payload = {
        "title": "Test Reward",
        "description": "For testing",
        "pointsRequired": 50,
        "stock": 10,
        "active": True,
    }
    payload.update(overrides)
    r = client.post("/api/rewards", json=payload, headers=h(admin_token))
    assert r.status_code == 200, r.text
    return r.json()


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_public_vehicle_options(client):
    r = client.get("/api/public/vehicle-options")
    assert r.status_code == 200
    data = r.json()
    assert "models" in data and "powertrains" in data and "years" in data


def test_member_login_and_profile(client, member_token):
    r = client.get("/api/auth/me", headers=h(member_token))
    assert r.status_code == 200
    assert r.json()["user"]["role"] == "member"

    r = client.get("/api/profile", headers=h(member_token))
    assert r.status_code == 200
    assert "user" in r.json()


def test_registration_approval_flow(client, admin_token):
    chapters = client.get("/api/public/chapters").json()
    assert chapters
    chapter_id = chapters[0]["id"]

    reg_payload = {
        "username": "newmember_p2",
        "password": "newpass123",
        "fullName": "New Member Phase2",
        "email": "newmember@example.com",
        "phone": "081234567899",
        "chapterId": chapter_id,
        "vehicleModel": "G",
        "vehiclePowertrain": "Gasoline",
        "vehicleYear": 2024,
        "vehicleColor": "Red",
        "plateNumber": "B 1 NEW",
    }

    r = client.post("/api/register", json=reg_payload)
    assert r.status_code == 200, r.text
    data = r.json()
    reg_id = data["id"]
    assert data["status"] == "pending"

    # Admin sees pending registration
    r = client.get("/api/registrations?status=pending", headers=h(admin_token))
    assert r.status_code == 200
    assert any(reg["id"] == reg_id for reg in r.json())

    # Approve
    r = client.put(f"/api/registrations/{reg_id}", json={"status": "approved"}, headers=h(admin_token))
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "approved"

    # New member can login
    r = client.post("/api/auth/login", json={
        "username": "newmember_p2",
        "password": "newpass123",
        "scope": "member",
    })
    assert r.status_code == 200
    assert "token" in r.json()


def test_member_cannot_access_admin_endpoints(client, member_token):
    r = client.get("/api/users", headers=h(member_token))
    assert r.status_code == 403

    r = client.post("/api/events", json={"title": "Hacked"}, headers=h(member_token))
    assert r.status_code == 403


def test_event_rsvp_and_checkin_awards_points(client, admin_token, member_token):
    event = create_event(client, admin_token)
    event_id = event["id"]
    qr_token = event["qrToken"]

    # RSVP Going
    r = client.post(f"/api/events/{event_id}/rsvp", json={"status": "Going"}, headers=h(member_token))
    assert r.status_code == 200, r.text
    assert any(x["userId"] == 1 and x["status"] == "Going" for x in r.json()["rsvps"])

    # Check-in via QR
    r = client.post(f"/api/events/{event_id}/check-in", json={"qrToken": qr_token, "method": "qr"}, headers=h(member_token))
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["method"] == "qr"
    assert data["status"] == "present"

    # Points awarded
    r = client.get("/api/profile", headers=h(member_token))
    assert r.status_code == 200
    assert r.json()["user"]["pointsBalance"] == 100

    # Duplicate check-in rejected
    r = client.post(f"/api/events/{event_id}/check-in", json={"qrToken": qr_token, "method": "qr"}, headers=h(member_token))
    assert r.status_code == 409


def test_checkin_without_rsvp_fails(client, admin_token, member_token):
    event = create_event(client, admin_token)
    r = client.post(f"/api/events/{event['id']}/check-in", json={"qrToken": event["qrToken"], "method": "qr"}, headers=h(member_token))
    assert r.status_code == 400
    assert "RSVP" in r.json()["detail"]


def test_checkin_with_invalid_qr_fails(client, admin_token, member_token):
    event = create_event(client, admin_token)
    client.post(f"/api/events/{event['id']}/rsvp", json={"status": "Going"}, headers=h(member_token))
    r = client.post(f"/api/events/{event['id']}/check-in", json={"qrToken": "not-the-token", "method": "qr"}, headers=h(member_token))
    assert r.status_code == 400
    assert "Invalid QR" in r.json()["detail"]


def test_geo_checkin_outside_radius_fails(client, admin_token, member_token):
    event = create_event(client, admin_token, geo=True, lat="-6.2", lon="106.8")
    client.post(f"/api/events/{event['id']}/rsvp", json={"status": "Going"}, headers=h(member_token))
    r = client.post(
        f"/api/events/{event['id']}/check-in",
        json={"qrToken": event["qrToken"], "method": "geo", "lat": "-6.3", "lon": "107.0"},
        headers=h(member_token),
    )
    assert r.status_code == 400
    assert "outside" in r.json()["detail"].lower()


def test_geo_checkin_inside_radius_succeeds(client, admin_token, member_token):
    event = create_event(client, admin_token, geo=True, lat="-6.2000", lon="106.8000")
    client.post(f"/api/events/{event['id']}/rsvp", json={"status": "Going"}, headers=h(member_token))
    r = client.post(
        f"/api/events/{event['id']}/check-in",
        json={"qrToken": event["qrToken"], "method": "geo", "lat": "-6.2001", "lon": "106.8001"},
        headers=h(member_token),
    )
    assert r.status_code == 200, r.text


def test_admin_manual_point_transaction(client, admin_token, member_token):
    # Find member id
    users = client.get("/api/users", headers=h(admin_token)).json()
    member = next(u for u in users if u["username"] == "raka")

    r = client.post("/api/point-transactions", json={
        "userId": member["id"],
        "amount": 250,
        "source": "manual",
        "description": "Top up for testing",
    }, headers=h(admin_token))
    assert r.status_code == 200, r.text
    assert r.json()["amount"] == 250

    r = client.get("/api/me/points", headers=h(member_token))
    assert r.status_code == 200
    assert r.json()["balance"] == 250


def test_reward_redemption_and_approval_flow(client, admin_token, member_token):
    # Give member some points
    users = client.get("/api/users", headers=h(admin_token)).json()
    member = next(u for u in users if u["username"] == "raka")
    client.post("/api/point-transactions", json={
        "userId": member["id"],
        "amount": 200,
        "source": "manual",
        "description": "Redemption test credit",
    }, headers=h(admin_token))

    reward = create_reward(client, admin_token, title="Test Merch", pointsRequired=75, stock=5)

    # Request redemption
    r = client.post("/api/redemptions", json={"rewardId": reward["id"]}, headers=h(member_token))
    assert r.status_code == 200, r.text
    redemption = r.json()
    assert redemption["status"] == "pending"
    assert redemption["pointsCost"] == 75

    # Points not deducted until approval
    r = client.get("/api/profile", headers=h(member_token))
    assert r.json()["user"]["pointsBalance"] == 200

    # Approve redemption
    r = client.put(f"/api/redemptions/{redemption['id']}", json={"status": "approved"}, headers=h(admin_token))
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "approved"

    # Points deducted
    r = client.get("/api/profile", headers=h(member_token))
    assert r.json()["user"]["pointsBalance"] == 125

    # Stock decreased (via list)
    r = client.get("/api/rewards", headers=h(admin_token))
    updated = next(x for x in r.json() if x["id"] == reward["id"])
    assert updated["stock"] == 4


def test_redemption_rejected_keeps_points(client, admin_token, member_token):
    users = client.get("/api/users", headers=h(admin_token)).json()
    member = next(u for u in users if u["username"] == "raka")
    client.post("/api/point-transactions", json={
        "userId": member["id"],
        "amount": 100,
        "source": "manual",
        "description": "Reject test credit",
    }, headers=h(admin_token))

    reward = create_reward(client, admin_token, title="Rejectable Reward", pointsRequired=30)
    r = client.post("/api/redemptions", json={"rewardId": reward["id"]}, headers=h(member_token))
    redemption_id = r.json()["id"]

    r = client.put(f"/api/redemptions/{redemption_id}", json={"status": "rejected", "rejectionReason": "Out of stock"}, headers=h(admin_token))
    assert r.status_code == 200
    assert r.json()["status"] == "rejected"

    r = client.get("/api/me/points", headers=h(member_token))
    assert r.json()["balance"] == 100


def test_redemption_insufficient_points_fails(client, admin_token, member_token):
    reward = create_reward(client, admin_token, title="Expensive Reward", pointsRequired=9999)
    r = client.post("/api/redemptions", json={"rewardId": reward["id"]}, headers=h(member_token))
    assert r.status_code == 400
    assert "Insufficient" in r.json()["detail"]


def test_leaderboard_reflects_points(client, admin_token, member_token):
    users = client.get("/api/users", headers=h(admin_token)).json()
    member = next(u for u in users if u["username"] == "raka")
    client.post("/api/point-transactions", json={
        "userId": member["id"],
        "amount": 500,
        "source": "manual",
        "description": "Leaderboard test",
    }, headers=h(admin_token))

    r = client.get("/api/leaderboard?period=monthly", headers=h(member_token))
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["period"] == "monthly"
    assert any(entry["userId"] == member["id"] and entry["points"] == 500 for entry in data["entries"])


def test_language_update(client, member_token):
    r = client.put("/api/me/language", json={"language": "en"}, headers=h(member_token))
    assert r.status_code == 200
    assert r.json()["language"] == "en"

    r = client.put("/api/me/language", json={"language": "jp"}, headers=h(member_token))
    assert r.status_code == 400
