"""Phase 4A regressions. All requests and files use disposable identities."""
import base64
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
import io
from pathlib import Path
import secrets
from threading import Barrier

from fastapi.testclient import TestClient
from PIL import Image
import pytest
from sqlalchemy import text

from fixture import client, request
from isolated import isolated

ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture
def rig(monkeypatch):
    monkeypatch.setenv("INZENITY_CORS_ORIGINS", "https://localhost")
    with isolated(ROOT, ROOT / "public", file_backed=True) as env:
        yield env, client(env, "admin"), client(env, "member")


def pixel():
    raw = io.BytesIO()
    Image.new("RGB", (2, 2), "green").save(raw, format="PNG")
    return "data:image/png;base64," + base64.b64encode(raw.getvalue()).decode()


def applicant(member, username):
    pw = secrets.token_urlsafe(24)
    row = request(member, "POST", "register", {"username": username, "fullName": "Test member",
                  "password": pw, "stnkImage": pixel()})
    return row["id"], pw


def product(admin, stock=3, **extra):
    return request(admin, "POST", "products", {"title": "Fixture", "price": "120",
                   "points": 3, "variants": [{"label": "Test", "stock": stock}], **extra})


def order_payload(p, quantity=1, points=0):
    return {"productId": p["id"], "variantId": p["variants"][0]["id"],
            "quantity": quantity, "pointsUsed": points}


def transition(admin, order, state, ref=None):
    return admin.put(f"/api/orders/{order['id']}/status",
                     json={"status": state, "paymentReference": ref})


def submitted(member, p, quantity=1, points=0):
    order = request(member, "POST", "orders", order_payload(p, quantity, points))
    return request(member, "POST", f"orders/{order['id']}/payment", {"paymentProofImage": pixel()})


def race(work):
    barrier = Barrier(2)
    def run(i):
        barrier.wait(timeout=10)
        return work(i).status_code
    with ThreadPoolExecutor(max_workers=2) as workers:
        return sorted(workers.map(run, range(2)))


def test_document_storage_permissions_and_failed_replacement(rig):
    env, admin, member = rig
    rid, _ = applicant(member, "qa-files")
    route = f"registrations/{rid}"
    url = request(admin, "GET", route)["stnkImage"]
    response = admin.get(url)
    assert response.status_code == 200 and response.headers["content-type"] == "image/png"
    assert "no-store" in response.headers["cache-control"]
    assert (env.root / "private-uploads" / url.removeprefix("/uploads/")).is_file()
    assert not (env.root / "public" / url.lstrip("/")).exists()
    assert TestClient(env.app, base_url="https://testserver").get(url).status_code == 401
    assert member.get(url).status_code == 404
    assert admin.get("/public" + url).status_code == 404
    # A failed second attachment must roll back the first replacement too.
    res = admin.put("/api/" + route, json={"stnkImage": pixel(), "paymentProofImage": "invalid"})
    assert res.status_code == 400 and admin.get(url).status_code == 200
    assert len(list((env.root / "private-uploads/registrations").iterdir())) == 1
    request(admin, "DELETE", route)
    assert admin.get(url).status_code == 404


@pytest.mark.parametrize("uri,status", [
    ("data:image/jpeg;base64," + pixel().split(",")[1], 400),
    ("data:image/svg+xml;base64,AAAA", 400),
    ("data:image/png;base64,not base64", 400),
    ("data:image/png;base64," + base64.b64encode(b"text").decode(), 400),
    (None, 413),
], ids=["type-mismatch", "unsupported-type", "bad-encoding", "bad-file", "too-large"])
def test_upload_validation(rig, uri, status):
    _, _, member = rig
    if uri is None:
        uri = "data:image/png;base64," + "A" * (6 * 1024 * 1024)
    res = member.post("/api/register", json={"fullName":"Test","username":"qa-upload",
                      "password":secrets.token_urlsafe(20),"stnkImage":uri})
    assert res.status_code == status


def test_migrate_private_legacy_directory(rig):
    env, admin, member = rig
    rid, _ = applicant(member, "qa-old-image")
    name = "stnk_legacy.png"
    url = "/uploads/registrations/" + name
    folder = env.root / "public/uploads/registrations"
    folder.mkdir(parents=True)
    (folder / name).write_bytes(base64.b64decode(pixel().split(",")[1]))
    with env.mod.SessionLocal.begin() as db:
        db.get(env.mod.Registration, rid).stnk_image = url
    assert admin.get("/public" + url).status_code == 404
    env.mod.migrate_private_files()
    env.mod.migrate_private_files()
    assert not folder.exists() and admin.get(url).status_code == 200
    assert member.get(url).status_code == 404


def test_password_hashes_migration_and_expired_legacy_sessions(rig):
    env, admin, member = rig
    mod = env.mod
    rid, pw = applicant(member, "qa-pending")
    legacy = secrets.token_urlsafe(24)
    with mod.SessionLocal.begin() as db:
        row = db.get(mod.Registration, rid)
        assert row.password.startswith("$argon2id$") and mod.hardening.password_matches(row.password, pw)
        assert not mod.hardening.password_matches(row.password, row.password)
        assert db.get(mod.User, 2).password.startswith("$argon2id$")
        # Model a database from before Phase 4A, without retaining real credentials.
        for u in db.query(mod.User):
            u.password = legacy
        row.password = pw
        db.execute(text("DELETE FROM security_versions"))
    mod.migrate_security()
    assert member.get("/api/profile").status_code == 401
    with mod.SessionLocal() as db:
        digest = db.get(mod.Registration, rid).password
        assert mod.hardening.password_matches(digest, pw)
        assert mod.hardening.password_matches(db.get(mod.User, 2).password, legacy)
    mod.migrate_security()
    with mod.SessionLocal() as db:
        assert db.get(mod.Registration, rid).password == digest
    assert member.post("/api/auth/login", json={"username":"qa-member","password":digest}).status_code == 401


def test_tls_cors_cookie_expiry_and_password_change(rig):
    env, admin, _ = rig
    base = "https://testserver"
    web = TestClient(env.app, base_url=base)
    login = {"username":"qa-member","password":env.creds["member"]}
    assert TestClient(env.app).post("/api/auth/login", json=login,
                                   headers={"X-Forwarded-Proto":"https"}).status_code == 403
    res = web.post("/api/auth/login", json=login)
    assert res.status_code == 200 and "token" not in res.json()
    cookie = res.headers["set-cookie"].lower()
    assert all(x in cookie for x in ("secure","httponly","samesite=lax","max-age=28800"))
    assert web.get("/api/profile").status_code == 200
    for origin, status in [("https://localhost", 200), ("https://other.invalid",400)]:
        r = web.options("/api/profile", headers={"Origin":origin, "Access-Control-Request-Method":"GET"})
        assert r.status_code == status
        assert r.headers.get("access-control-allow-origin") == (origin if status == 200 else None)
    assert web.post("/api/auth/logout", headers={"Origin":"https://other.invalid"}).status_code == 403
    with env.mod.SessionLocal.begin() as db:
        row = db.query(env.mod.SessionModel).filter_by(user_id=2).one()
        assert row.token != web.cookies.get("zenix_session")
        row.created_at = datetime.utcnow() - timedelta(hours=9)
    assert web.get("/api/profile").status_code == 401
    assert web.post("/api/auth/login", json=login).status_code == 200
    request(admin, "PUT", "users/2", {"password": secrets.token_urlsafe(32)})
    assert web.get("/api/profile").status_code == 401
    assert web.post("/api/auth/login", json=login).status_code == 401


@pytest.mark.parametrize("field,value", [("quantity",0),("quantity",-1),("quantity",1.5),
                          ("quantity",True),("quantity","2.0"),("pointsUsed",-1),("pointsUsed",False)])
def test_numeric_order_validation(rig, field, value):
    _, admin, member = rig
    body = {**order_payload(product(admin)), field:value}
    assert member.post("/api/orders", json=body).status_code == 400
    assert request(member, "GET", "me/orders") == []


def test_verified_settlement_and_refund_are_exactly_once(rig):
    env, admin, member = rig
    p = product(admin)
    request(admin, "POST", "point-transactions", {"userId":2, "amount":20})
    o = request(member, "POST", "orders", order_payload(p, 2, 10))
    path = f"orders/{o['id']}/payment"
    assert member.post("/api/"+path, json={}).status_code == 400
    assert transition(admin, o, "processing").status_code == 409
    o = request(member,"POST",path,{"paymentProofImage":pixel()})
    assert o["pointsEarned"] == 0
    assert transition(member,o,"paid","TEST-TXN-001").status_code == 403
    assert transition(admin,o,"paid").status_code == 400
    assert race(lambda _: transition(admin,o,"paid","TEST-TXN-001")) == [200,200]
    assert request(member,"GET","me/points")["balance"] == 16
    duplicate = submitted(member,p)
    assert transition(admin,duplicate,"paid","test-txn-001").status_code == 409
    assert transition(admin,o,"shipped").status_code == 409
    assert transition(admin,o,"processing").status_code == 200
    assert transition(admin,o,"refunded").status_code == 200
    assert transition(admin,o,"refunded").status_code == 200
    assert request(member,"GET","me/points")["balance"] == 20
    assert request(admin,"GET",f"products/{p['id']}")["variants"][0]["stock"] == 3


def test_competing_orders_claim_only_full_quantity(rig):
    _, admin, member = rig
    p = product(admin)
    orders = [submitted(member,p,2) for _ in range(2)]
    for i, order in enumerate(orders):
        assert transition(admin, order, "paid", f"TEST-{i}").status_code == 200
    assert race(lambda i: transition(admin, orders[i], "processing")) == [200,409]
    assert sorted(o["status"] for o in request(admin,"GET","orders")) == ["paid","processing"]
    assert request(admin,"GET",f"products/{p['id']}")["variants"][0]["stock"] == 1
    winner = next(o for o in request(admin,"GET","orders") if o["status"] == "processing")
    assert race(lambda _: transition(admin,winner,"processing")) == [200,200]
    assert request(admin,"GET",f"products/{p['id']}")["variants"][0]["stock"] == 1


def test_concurrent_spending_and_cancellation(rig):
    _, admin, member = rig
    p = product(admin)
    request(admin, "POST", "point-transactions", {"userId":2, "amount":5})
    assert race(lambda _: member.post("/api/orders", json=order_payload(p,1,5))) == [200,400]
    o, = request(member,"GET","me/orders")
    assert request(member,"GET","me/points")["balance"] == 0
    assert race(lambda _: member.post(f"/api/orders/{o['id']}/cancel",json={})) == [200,200]
    assert request(member,"GET","me/points")["balance"] == 5


def test_reregistration_isolates_retained_order_and_receipt(rig):
    env, admin, member = rig
    rid, pw = applicant(member, "qa-returning")
    request(admin, "PUT", f"registrations/{rid}", {"status":"approved"})
    def sign_in(password):
        c = TestClient(env.app, base_url="https://testserver")
        out = request(c,"POST","auth/login",{"username":"qa-returning","password":password})
        return c, out["user"]["id"]
    old, original_id = sign_in(pw)
    order = submitted(old, product(admin))
    receipt = order["paymentProofImage"]
    assert old.get(receipt).status_code == 200 and admin.get(receipt).status_code == 200
    assert member.get(receipt).status_code == 404
    request(admin,"DELETE",f"users/{original_id}")
    assert old.get(receipt).status_code == 401
    rid, new_pw = applicant(member, "qa-returning")
    request(admin, "PUT", f"registrations/{rid}", {"status":"approved"})
    replacement, new_id = sign_in(new_pw)
    assert new_id > original_id and request(replacement,"GET","me/orders") == []
    assert replacement.get(f"/api/orders/{order['id']}").status_code == 403
    assert replacement.get(receipt).status_code == 404
    assert request(admin,"GET","orders")[0]["userId"] == original_id


def test_merchant_can_review_only_own_settlement(rig):
    env, admin, member = rig
    partner = request(admin,"POST","merchant-partners",{"name":"Test store","ownerUserId":3})
    mine = submitted(member, product(admin, merchantPartnerId=partner["id"], isOfficialMerchandise=False))
    other = submitted(member, product(admin))
    seller = client(env,"merchant")
    assert seller.get(mine["paymentProofImage"]).status_code == 200
    assert seller.get(other["paymentProofImage"]).status_code == 404
    assert transition(seller,other,"paid","QA-OTHER").status_code == 403
    assert transition(seller,mine,"paid","QA-MINE").status_code == 200


def test_historical_order_owner_sets_identity_floor(rig):
    env, admin, member = rig
    order = submitted(member, product(admin))
    with env.mod.SessionLocal.begin() as db:
        db.get(env.mod.Order, order["id"]).user_id = 9001
        db.query(env.mod.IdentityFloor).delete()
    env.mod.initialize_identity_floors()
    response = request(admin, "POST", "users", {"username":"qa-new-id",
                       "password":secrets.token_urlsafe(24),"role":"member","name":"Test"})
    assert response["id"] > 9001


def test_preorder_fulfillment_requires_matching_stock(rig):
    _, admin, member = rig
    p = product(admin, variants=[], allowPreorder=True)
    order = request(member, "POST", "orders", {"productId":p["id"], "quantity":2})
    request(member, "POST", f"orders/{order['id']}/payment", {"paymentProofImage":pixel()})
    assert transition(admin,order,"paid","TEST-PREORDER").status_code == 200
    path = f"/api/orders/{order['id']}/status"
    wrong = product(admin)["variants"][0]["id"]
    assert admin.put(path,json={"status":"processing","variantId":wrong}).status_code == 409
    restocked = request(admin,"PUT",f"products/{p['id']}",{"variants":[{"label":"Unit","stock":2}]})
    variant = restocked["variants"][0]["id"]
    assert admin.put(path,json={"status":"processing","variantId":variant}).status_code == 200
    assert request(admin,"GET",f"products/{p['id']}")["variants"][0]["stock"] == 0


def test_request_size_limit_counts_streamed_bytes(rig, monkeypatch):
    env, _, member = rig
    monkeypatch.setattr(env.mod.hardening,"MAX_REQUEST_BYTES",64)
    result = member.post("/api/register",content=iter((b" " * 40, b" " * 40)),
                         headers={"Content-Type":"application/json"})
    assert result.status_code == 413


def test_member_seller_and_admin_markup():
    import subprocess
    subprocess.run(["node", str(ROOT / "verification/render-security.cjs")], check=True)
