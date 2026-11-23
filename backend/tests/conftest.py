import os
import secrets
import pytest

# Force in-memory DB for tests so importing main.py does not touch the real file DB.
os.environ["INZENITY_DB_URL"] = "sqlite:///:memory:"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, StaticPool
from sqlalchemy.orm import sessionmaker

import main
from main import app, Base, seed_reference_data

# Use StaticPool so the in-memory database is shared across the main thread and
# the TestClient worker thread.
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Replace the global engine/session factory so the app uses the test database.
main.engine = test_engine
main.SessionLocal = TestSessionLocal

ADMIN_CREDS = {"username": "qa-admin", "password": secrets.token_urlsafe(24), "scope": "admin"}
MEMBER_CREDS = {"username": "qa-member", "password": secrets.token_urlsafe(24), "scope": "member"}


@pytest.fixture
def client(tmp_path, monkeypatch):
    """Use a fresh schema and disposable local accounts for each test."""
    monkeypatch.setenv("INZENITY_PRIVATE_DIR", str(tmp_path / "private"))
    monkeypatch.setattr(main, "public_dir", str(tmp_path / "public"))
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    seed_reference_data()
    with TestSessionLocal() as db:
        for user_id, credentials in enumerate((MEMBER_CREDS, ADMIN_CREDS), 1):
            db.add(main.User(id=user_id, username=credentials["username"],
                             password=main.hardening.hash_password(credentials["password"]), role=credentials["scope"],
                             name=credentials["username"], phone="", city="Test"))
        db.commit()
    with TestClient(app, base_url="https://testserver") as test_client:
        yield test_client


def login_as(client: TestClient, creds: dict) -> str:
    r = client.post("/api/auth/login", json={**creds, "tokenAuth": True})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture
def admin_token(client):
    return login_as(client, ADMIN_CREDS)


@pytest.fixture
def member_token(client):
    return login_as(client, MEMBER_CREDS)
