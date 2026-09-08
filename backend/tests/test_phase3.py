from datetime import datetime, timedelta


def h(token):
    return {"x-api-token": token}


def test_public_banners_are_filtered_by_date(client, admin_token):
    now = datetime.utcnow()
    r = client.post("/api/banners", json={
        "title": "Active Banner",
        "image": "https://example.com/banner1.png",
        "active": True,
        "startDate": (now - timedelta(days=1)).isoformat(),
        "endDate": (now + timedelta(days=1)).isoformat(),
        "durationMs": 4000,
        "order": 1,
    }, headers=h(admin_token))
    assert r.status_code == 200, r.text
    client.post("/api/banners", json={
        "title": "Expired Banner",
        "image": "https://example.com/banner2.png",
        "active": True,
        "startDate": (now - timedelta(days=5)).isoformat(),
        "endDate": (now - timedelta(days=1)).isoformat(),
        "durationMs": 4000,
        "order": 2,
    }, headers=h(admin_token))

    r = client.get("/api/public/banners")
    assert r.status_code == 200
    data = r.json()
    titles = {b["title"] for b in data}
    assert "Active Banner" in titles
    assert "Expired Banner" not in titles
    assert all(b["active"] for b in data)


def test_official_partner_lifecycle(client, admin_token):
    r = client.post("/api/official-partners", json={
        "name": "Test Partner",
        "description": "A test partner",
        "contact": "081234567890",
        "link": "https://example.com",
        "status": "active",
        "sortOrder": 1,
    }, headers=h(admin_token))
    assert r.status_code == 200, r.text
    partner = r.json()
    pid = partner["id"]

    r = client.get("/api/public/official-partners")
    assert r.status_code == 200
    assert any(p["id"] == pid for p in r.json())

    r = client.put(f"/api/official-partners/{pid}", json={"status": "inactive"}, headers=h(admin_token))
    assert r.status_code == 200
    assert r.json()["status"] == "inactive"

    r = client.get("/api/public/official-partners")
    assert not any(p["id"] == pid for p in r.json())


def test_merchant_partner_lifecycle(client, admin_token):
    # create merchant user
    r = client.post("/api/users", json={
        "name": "Merchant Owner",
        "username": "merchant1",
        "password": "***",
        "phone": "081111111111",
        "role": "merchant",
        "city": "Jakarta",
    }, headers=h(admin_token))
    assert r.status_code == 200, r.text
    user_id = r.json()["id"]

    r = client.post("/api/merchant-partners", json={
        "name": "Test Merchant",
        "description": "Merchant desc",
        "contact": "081234567890",
        "status": "active",
        "ownerUserId": user_id,
    }, headers=h(admin_token))
    assert r.status_code == 200, r.text
    merchant = r.json()
    mid = merchant["id"]

    r = client.get("/api/public/merchant-partners")
    assert r.status_code == 200
    assert any(m["id"] == mid for m in r.json())

    # merchant user can login
    r = client.post("/api/auth/login", json={"username": "merchant1", "password": "***", "scope": "merchant"})
    assert r.status_code == 200
    merchant_token = r.json()["token"]

    r = client.get("/api/merchant/me", headers=h(merchant_token))
    assert r.status_code == 200
    assert r.json()["id"] == mid


def test_product_and_variant_crud(client, admin_token):
    r = client.post("/api/products", json={
        "title": "Test Product",
        "description": "A product",
        "price": "150000",
        "points": 50,
        "isOfficialMerchandise": True,
        "active": True,
        "allowPreorder": False,
        "variants": [
            {"label": "S", "stock": 5},
            {"label": "M", "stock": 2},
        ],
    }, headers=h(admin_token))
    assert r.status_code == 200, r.text
    product = r.json()
    assert len(product["variants"]) == 2
    pid = product["id"]

    r = client.get(f"/api/products/{pid}", headers=h(admin_token))
    assert r.status_code == 200
    assert r.json()["title"] == "Test Product"

    r = client.put(f"/api/products/{pid}", json={"price": "160000", "variants": [{"label": "L", "stock": 10}]}, headers=h(admin_token))
    assert r.status_code == 200
    assert len(r.json()["variants"]) == 1
    assert r.json()["variants"][0]["label"] == "L"


def test_member_order_flow(client, admin_token, member_token):
    # create product
    r = client.post("/api/products", json={
        "title": "Orderable Product",
        "description": "Product",
        "price": "100000",
        "points": 25,
        "isOfficialMerchandise": True,
        "active": True,
        "variants": [{"label": "M", "stock": 10}],
    }, headers=h(admin_token))
    assert r.status_code == 200, r.text
    product = r.json()
    pid = product["id"]
    variant_id = product["variants"][0]["id"]

    # give member points
    users = client.get("/api/users", headers=h(admin_token)).json()
    member = next(u for u in users if u["username"] == "raka")
    client.post("/api/point-transactions", json={
        "userId": member["id"],
        "amount": 100,
        "source": "manual",
        "description": "order test",
    }, headers=h(admin_token))

    # place order using 20 points
    r = client.post("/api/orders", json={
        "productId": pid,
        "variantId": variant_id,
        "quantity": 2,
        "pointsUsed": 20,
        "address": "Jl. Mawar",
        "postalCode": "12345",
        "phone": "081234567890",
    }, headers=h(member_token))
    assert r.status_code == 200, r.text
    order = r.json()
    assert order["totalPrice"] == "200000"
    assert order["pointsUsed"] == 20
    assert order["status"] == "pending"

    # points deducted
    r = client.get("/api/profile", headers=h(member_token))
    assert r.json()["user"]["pointsBalance"] == 80

    # upload payment proof
    r = client.post(f"/api/orders/{order['id']}/payment", json={
        "paymentProofImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=",
    }, headers=h(member_token))
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "paid"
    assert r.json()["pointsEarned"] == 50

    # member balance restored + points earned
    r = client.get("/api/profile", headers=h(member_token))
    assert r.json()["user"]["pointsBalance"] == 130

    # admin moves to processing
    r = client.put(f"/api/orders/{order['id']}/status", json={"status": "processing"}, headers=h(admin_token))
    assert r.status_code == 200
    assert r.json()["status"] == "processing"

    # variant stock decreased
    r = client.get(f"/api/products/{pid}", headers=h(admin_token))
    assert r.json()["variants"][0]["stock"] == 8


def test_order_out_of_stock_fails(client, admin_token, member_token):
    r = client.post("/api/products", json={
        "title": "Limited Stock",
        "description": "Only one left",
        "price": "50000",
        "isOfficialMerchandise": True,
        "active": True,
        "allowPreorder": False,
        "variants": [{"label": "One", "stock": 1}],
    }, headers=h(admin_token))
    product = r.json()
    pid = product["id"]
    vid = product["variants"][0]["id"]

    r = client.post("/api/orders", json={"productId": pid, "variantId": vid, "quantity": 5}, headers=h(member_token))
    assert r.status_code == 400
    assert "stock" in r.json()["detail"].lower()


def test_merchant_rbac_isolation(client, admin_token):
    # create merchant user A and merchant A
    r = client.post("/api/users", json={"name": "M Owner A", "username": "merch_a", "password": "***", "phone": "1", "role": "merchant", "city": "Jakarta"}, headers=h(admin_token))
    uid_a = r.json()["id"]
    r = client.post("/api/merchant-partners", json={"name": "Merchant A", "status": "active", "ownerUserId": uid_a}, headers=h(admin_token))
    mid_a = r.json()["id"]
    r = client.post("/api/products", json={"title": "Product A", "price": "10000", "isOfficialMerchandise": False, "merchantPartnerId": mid_a, "active": True, "variants": []}, headers=h(admin_token))
    pid_a = r.json()["id"]

    # create merchant user B and merchant B
    r = client.post("/api/users", json={"name": "M Owner B", "username": "merch_b", "password": "***", "phone": "2", "role": "merchant", "city": "Jakarta"}, headers=h(admin_token))
    uid_b = r.json()["id"]
    r = client.post("/api/merchant-partners", json={"name": "Merchant B", "status": "active", "ownerUserId": uid_b}, headers=h(admin_token))
    mid_b = r.json()["id"]

    token_a = client.post("/api/auth/login", json={"username": "merch_a", "password": "***", "scope": "merchant"}).json()["token"]

    r = client.get("/api/products", headers=h(token_a))
    assert r.status_code == 200
    assert all(p["id"] == pid_a for p in r.json())

    r = client.get(f"/api/products/{pid_a}", headers=h(token_a))
    assert r.status_code == 200

    # Merchant B product should not be accessible
    r = client.post("/api/products", json={"title": "Hacked", "price": "1", "merchantPartnerId": mid_b, "isOfficialMerchandise": False, "active": True, "variants": []}, headers=h(token_a))
    assert r.status_code == 403
