import os
import pytest

# Force in-memory DB for tests so importing main.py does not touch the real file DB.
os.environ["INZENITY_DB_URL"] = "sqlite:///:memory:"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, StaticPool
from sqlalchemy.orm import sessionmaker

import main
from main import app, Base, seed_database, seed_reference_data

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

# Create schema and seed reference/demo data once.
Base.metadata.create_all(bind=test_engine)
seed_database()
seed_reference_data()

ADMIN_CREDS = {"username": "admin", "password": "admin123", "scope": "admin"}
MEMBER_CREDS = {"username": "raka", "password": "member123", "scope": "member"}


@pytest.fixture(scope="function")
def client():
    """Fresh TestClient with the in-memory test DB reset before each test."""
    with TestClient(app) as c:
        # Login as admin and reset DB so each test starts from seeded state.
        r = c.post("/api/auth/login", json=ADMIN_CREDS)
        assert r.status_code == 200, r.text
        reset = c.post("/api/reset")
        assert reset.status_code == 200, reset.text
        yield c


def login_as(client: TestClient, creds: dict) -> str:
    r = client.post("/api/auth/login", json=creds)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture
def admin_token(client):
    return login_as(client, ADMIN_CREDS)


@pytest.fixture
def member_token(client):
    return login_as(client, MEMBER_CREDS)
