from fastapi import FastAPI, Request, Response, HTTPException, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from pydantic import BaseModel
from datetime import datetime
import uuid
import json
import os

# --- Database ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./inzenity.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    phone = Column(String)
    role = Column(String, default="member")
    city = Column(String)

class SessionModel(Base):
    __tablename__ = "sessions"
    token = Column(String, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    date = Column(DateTime)
    location = Column(String)
    summary = Column(Text)
    description = Column(Text)
    category = Column(String)
    host = Column(String)
    meeting_point = Column(String)
    rsvps = relationship("RSVP", back_populates="event", cascade="all, delete-orphan")

class RSVP(Base):
    __tablename__ = "rsvps"
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String)
    event = relationship("Event", back_populates="rsvps")

class Announcement(Base):
    __tablename__ = "announcements"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(Text)
    created_at = Column(DateTime)

class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    category = Column(String)
    description = Column(Text)
    whatsapp = Column(String)

class Banner(Base):
    __tablename__ = "banners"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    image = Column(String)
    order = Column(Integer)

class Sponsor(Base):
    __tablename__ = "sponsors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    logo = Column(String)

class News(Base):
    __tablename__ = "news"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    image = Column(String)
    category = Column(String)
    date = Column(DateTime)

class Merchandise(Base):
    __tablename__ = "merchandise"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    image = Column(String)
    description = Column(Text)
    price = Column(String)

Base.metadata.create_all(bind=engine)

# --- Pydantic ---
class LoginRequest(BaseModel):
    username: str
    password: str
    scope: str = "member"

class RsvpRequest(BaseModel):
    status: str

# --- App ---
app = FastAPI(title="Inzenity Backend")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

SESSION_COOKIE = "zenix_session"

def get_session(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        token = request.headers.get("x-api-token")
    if not token:
        return None
    session = db.query(SessionModel).filter(SessionModel.token == token).first()
    if not session:
        return None
    user = db.query(User).filter(User.id == session.user_id).first()
    if not user:
        return None
    return {"token": token, "user": user, "db": db}

def require_admin(request: Request, db: Session = Depends(get_db)):
    session = get_session(request, db)
    if not session:
        raise HTTPException(status_code=401, detail="Authentication required")
    if session["user"].role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    return session

def require_member(request: Request, db: Session = Depends(get_db)):
    session = get_session(request, db)
    if not session:
        raise HTTPException(status_code=401, detail="Authentication required")
    if session["user"].role != "member":
        raise HTTPException(status_code=403, detail="Member access required")
    return session

def require_any(request: Request, db: Session = Depends(get_db)):
    session = get_session(request, db)
    if not session:
        raise HTTPException(status_code=401, detail="Authentication required")
    return session

# --- Seed ---
def seed_database():
    db = SessionLocal()
    try:
        if db.query(User).first():
            return
        seed_path = os.path.join(os.path.dirname(__file__), "..", "data", "seed.json")
        with open(seed_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        for u in data.get("users", []):
            db.add(User(id=u["id"], name=u["name"], username=u["username"], password=u["password"], phone=u["phone"], role=u["role"], city=u["city"]))
        for e in data.get("events", []):
            event = Event(id=e["id"], title=e["title"], date=datetime.fromisoformat(e["date"]), location=e["location"], summary=e["summary"], description=e["description"], category=e.get("category"), host=e.get("host"), meeting_point=e.get("meetingPoint"))
            db.add(event)
            for r in e.get("rsvps", []):
                db.add(RSVP(event_id=e["id"], user_id=r["userId"], status=r["status"]))
        for a in data.get("announcements", []):
            db.add(Announcement(id=a["id"], title=a["title"], content=a["content"], created_at=datetime.fromisoformat(a["createdAt"])))
        for v in data.get("vendors", []):
            db.add(Vendor(id=v["id"], name=v["name"], category=v["category"], description=v["description"], whatsapp=v["whatsapp"]))
        for b in data.get("banners", []):
            db.add(Banner(id=b["id"], title=b["title"], image=b["image"], order=b["order"]))
        for s in data.get("sponsors", []):
            db.add(Sponsor(id=s["id"], name=s["name"], logo=s["logo"]))
        for n in data.get("news", []):
            db.add(News(id=n["id"], title=n["title"], image=n["image"], category=n["category"], date=datetime.fromisoformat(n["date"])))
        for m in data.get("merchandise", []):
            db.add(Merchandise(id=m["id"], title=m["title"], image=m["image"], description=m["description"], price=m["price"]))
        db.commit()
    finally:
        db.close()

seed_database()

# --- Serialization ---
def sanitize_user(user: User):
    return {"id": user.id, "name": user.name, "username": user.username, "role": user.role, "phone": user.phone, "city": user.city}

def event_to_dict(event: Event):
    return {"id": event.id, "title": event.title, "date": event.date.isoformat(), "location": event.location, "summary": event.summary, "description": event.description, "category": event.category, "host": event.host, "meetingPoint": event.meeting_point, "rsvps": [{"userId": r.user_id, "status": r.status} for r in event.rsvps]}

def item_to_dict(item):
    d = {}
    for col in item.__table__.columns:
        val = getattr(item, col.name)
        if isinstance(val, datetime):
            val = val.isoformat()
        key = col.name
        if key == "meeting_point": key = "meetingPoint"
        elif key == "created_at": key = "createdAt"
        d[key] = val
    return d

def get_next_id(db, model):
    max_item = db.query(model).order_by(model.id.desc()).first()
    return (max_item.id + 1) if max_item else 1

def parse_val(field, val):
    if val is not None and field in ("date", "createdAt"):
        return datetime.fromisoformat(val) if isinstance(val, str) else val
    return val

# --- Auth ---
@app.post("/api/auth/login")
def login(body: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if not user or user.password != body.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if body.scope == "admin" and user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    if body.scope == "member" and user.role != "member":
        raise HTTPException(status_code=403, detail="Member access required")
    db.query(SessionModel).filter(SessionModel.user_id == user.id).delete()
    token = uuid.uuid4().hex
    db.add(SessionModel(token=token, user_id=user.id, role=user.role))
    db.commit()
    response.set_cookie(key=SESSION_COOKIE, value=token, httponly=True, samesite="lax")
    return {"user": sanitize_user(user), "token": token}

@app.get("/api/auth/me")
def auth_me(session = Depends(get_session)):
    if not session:
        raise HTTPException(status_code=401, detail="Authentication required")
    return {"user": sanitize_user(session["user"])}

@app.post("/api/auth/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        token = request.headers.get("x-api-token")
    if token:
        db.query(SessionModel).filter(SessionModel.token == token).delete()
        db.commit()
    response.set_cookie(key=SESSION_COOKIE, value="", max_age=0, httponly=True, samesite="lax")
    return {"success": True}

# --- Health & Reset ---
@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/reset")
def reset_db(session = Depends(require_admin)):
    db = session["db"]
    db.query(RSVP).delete()
    db.query(Event).delete()
    db.query(Announcement).delete()
    db.query(Vendor).delete()
    db.query(Banner).delete()
    db.query(Sponsor).delete()
    db.query(News).delete()
    db.query(Merchandise).delete()
    db.query(SessionModel).delete()
    db.query(User).delete()
    db.commit()
    seed_database()
    return {"success": True}

# --- Users ---
@app.get("/api/users")
def get_users(session = Depends(require_admin)):
    db = session["db"]
    users = db.query(User).all()
    return [{"id": u.id, "name": u.name, "username": u.username, "password": u.password, "phone": u.phone, "role": u.role, "city": u.city} for u in users]

@app.post("/api/users")
def create_user(body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    user = User(id=get_next_id(db, User), name=body.get("name"), username=body.get("username"), password=body.get("password"), phone=body.get("phone"), role=body.get("role"), city=body.get("city"))
    db.add(user)
    db.commit()
    return {"id": user.id, "name": user.name, "username": user.username, "password": user.password, "phone": user.phone, "role": user.role, "city": user.city}

@app.get("/api/users/{user_id}")
def get_user(user_id: int, session = Depends(require_admin)):
    db = session["db"]
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Not found")
    return {"id": user.id, "name": user.name, "username": user.username, "password": user.password, "phone": user.phone, "role": user.role, "city": user.city}

@app.put("/api/users/{user_id}")
def update_user(user_id: int, body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Not found")
    for field in ["name", "username", "password", "phone", "role", "city"]:
        if field in body:
            setattr(user, field, body[field])
    db.commit()
    return {"id": user.id, "name": user.name, "username": user.username, "password": user.password, "phone": user.phone, "role": user.role, "city": user.city}

@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, session = Depends(require_admin)):
    db = session["db"]
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(user)
    db.query(SessionModel).filter(SessionModel.user_id == user_id).delete()
    db.query(RSVP).filter(RSVP.user_id == user_id).delete()
    db.commit()
    return {"success": True}

# --- Events ---
@app.get("/api/events")
def get_events(session = Depends(require_any)):
    db = session["db"]
    return [event_to_dict(e) for e in db.query(Event).all()]

@app.post("/api/events")
def create_event(body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    event = Event(id=get_next_id(db, Event), title=body.get("title"), date=parse_val("date", body.get("date")), location=body.get("location"), summary=body.get("summary"), description=body.get("description"), category=body.get("category"), host=body.get("host"), meeting_point=body.get("meetingPoint"))
    db.add(event)
    db.commit()
    db.refresh(event)
    return event_to_dict(event)

@app.get("/api/events/{event_id}")
def get_event(event_id: int, session = Depends(require_any)):
    db = session["db"]
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Not found")
    return event_to_dict(event)

@app.put("/api/events/{event_id}")
def update_event(event_id: int, body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Not found")
    for field, db_field in [("title", "title"), ("date", "date"), ("location", "location"), ("summary", "summary"), ("description", "description"), ("category", "category"), ("host", "host"), ("meetingPoint", "meeting_point")]:
        if field in body:
            setattr(event, db_field, parse_val("date" if field == "date" else field, body[field]))
    db.commit()
    db.refresh(event)
    return event_to_dict(event)

@app.delete("/api/events/{event_id}")
def delete_event(event_id: int, session = Depends(require_admin)):
    db = session["db"]
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(event)
    db.commit()
    return {"success": True}

@app.post("/api/events/{event_id}/rsvp")
def rsvp(event_id: int, body: RsvpRequest, session = Depends(require_member)):
    db = session["db"]
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if body.status not in ("Going", "Maybe", "Not Going"):
        raise HTTPException(status_code=400, detail="Invalid RSVP")
    existing = db.query(RSVP).filter(RSVP.event_id == event_id, RSVP.user_id == session["user"].id).first()
    if existing:
        existing.status = body.status
    else:
        db.add(RSVP(event_id=event_id, user_id=session["user"].id, status=body.status))
    db.commit()
    db.refresh(event)
    return event_to_dict(event)

# --- Announcements ---
@app.get("/api/announcements")
def get_announcements(session = Depends(require_any)):
    return [item_to_dict(a) for a in session["db"].query(Announcement).all()]

@app.post("/api/announcements")
def create_announcement(body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    item = Announcement(id=get_next_id(db, Announcement), title=body.get("title"), content=body.get("content"), created_at=parse_val("createdAt", body.get("createdAt")))
    db.add(item)
    db.commit()
    db.refresh(item)
    return item_to_dict(item)

@app.get("/api/announcements/{item_id}")
def get_announcement(item_id: int, session = Depends(require_any)):
    item = session["db"].query(Announcement).filter(Announcement.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item_to_dict(item)

@app.put("/api/announcements/{item_id}")
def update_announcement(item_id: int, body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    item = db.query(Announcement).filter(Announcement.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    for field, db_field in [("title", "title"), ("content", "content"), ("createdAt", "created_at")]:
        if field in body:
            setattr(item, db_field, parse_val("createdAt" if field == "createdAt" else field, body[field]))
    db.commit()
    db.refresh(item)
    return item_to_dict(item)

@app.delete("/api/announcements/{item_id}")
def delete_announcement(item_id: int, session = Depends(require_admin)):
    db = session["db"]
    item = db.query(Announcement).filter(Announcement.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"success": True}

# --- Vendors ---
@app.get("/api/vendors")
def get_vendors(session = Depends(require_any)):
    return [item_to_dict(v) for v in session["db"].query(Vendor).all()]

@app.post("/api/vendors")
def create_vendor(body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    item = Vendor(id=get_next_id(db, Vendor), name=body.get("name"), category=body.get("category"), description=body.get("description"), whatsapp=body.get("whatsapp"))
    db.add(item)
    db.commit()
    db.refresh(item)
    return item_to_dict(item)

@app.get("/api/vendors/{item_id}")
def get_vendor(item_id: int, session = Depends(require_any)):
    item = session["db"].query(Vendor).filter(Vendor.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item_to_dict(item)

@app.put("/api/vendors/{item_id}")
def update_vendor(item_id: int, body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    item = db.query(Vendor).filter(Vendor.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    for field in ["name", "category", "description", "whatsapp"]:
        if field in body:
            setattr(item, field, body[field])
    db.commit()
    db.refresh(item)
    return item_to_dict(item)

@app.delete("/api/vendors/{item_id}")
def delete_vendor(item_id: int, session = Depends(require_admin)):
    db = session["db"]
    item = db.query(Vendor).filter(Vendor.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"success": True}

# --- Banners ---
@app.get("/api/banners")
def get_banners(session = Depends(require_any)):
    return [item_to_dict(b) for b in session["db"].query(Banner).all()]

@app.post("/api/banners")
def create_banner(body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    item = Banner(id=get_next_id(db, Banner), title=body.get("title"), image=body.get("image"), order=body.get("order"))
    db.add(item)
    db.commit()
    db.refresh(item)
    return item_to_dict(item)

@app.get("/api/banners/{item_id}")
def get_banner(item_id: int, session = Depends(require_any)):
    item = session["db"].query(Banner).filter(Banner.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item_to_dict(item)

@app.put("/api/banners/{item_id}")
def update_banner(item_id: int, body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    item = db.query(Banner).filter(Banner.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    for field in ["title", "image", "order"]:
        if field in body:
            setattr(item, field, body[field])
    db.commit()
    db.refresh(item)
    return item_to_dict(item)

@app.delete("/api/banners/{item_id}")
def delete_banner(item_id: int, session = Depends(require_admin)):
    db = session["db"]
    item = db.query(Banner).filter(Banner.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"success": True}

# --- Sponsors ---
@app.get("/api/sponsors")
def get_sponsors(session = Depends(require_any)):
    return [item_to_dict(s) for s in session["db"].query(Sponsor).all()]

@app.post("/api/sponsors")
def create_sponsor(body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    item = Sponsor(id=get_next_id(db, Sponsor), name=body.get("name"), logo=body.get("logo"))
    db.add(item)
    db.commit()
    db.refresh(item)
    return item_to_dict(item)

@app.get("/api/sponsors/{item_id}")
def get_sponsor(item_id: int, session = Depends(require_any)):
    item = session["db"].query(Sponsor).filter(Sponsor.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item_to_dict(item)

@app.put("/api/sponsors/{item_id}")
def update_sponsor(item_id: int, body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    item = db.query(Sponsor).filter(Sponsor.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    for field in ["name", "logo"]:
        if field in body:
            setattr(item, field, body[field])
    db.commit()
    db.refresh(item)
    return item_to_dict(item)

@app.delete("/api/sponsors/{item_id}")
def delete_sponsor(item_id: int, session = Depends(require_admin)):
    db = session["db"]
    item = db.query(Sponsor).filter(Sponsor.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"success": True}

# --- News ---
@app.get("/api/news")
def get_news(session = Depends(require_any)):
    return [item_to_dict(n) for n in session["db"].query(News).all()]

@app.post("/api/news")
def create_news(body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    item = News(id=get_next_id(db, News), title=body.get("title"), image=body.get("image"), category=body.get("category"), date=parse_val("date", body.get("date")))
    db.add(item)
    db.commit()
    db.refresh(item)
    return item_to_dict(item)

@app.get("/api/news/{item_id}")
def get_news_item(item_id: int, session = Depends(require_any)):
    item = session["db"].query(News).filter(News.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item_to_dict(item)

@app.put("/api/news/{item_id}")
def update_news(item_id: int, body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    item = db.query(News).filter(News.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    for field, db_field in [("title", "title"), ("image", "image"), ("category", "category"), ("date", "date")]:
        if field in body:
            setattr(item, db_field, parse_val("date" if field == "date" else field, body[field]))
    db.commit()
    db.refresh(item)
    return item_to_dict(item)

@app.delete("/api/news/{item_id}")
def delete_news(item_id: int, session = Depends(require_admin)):
    db = session["db"]
    item = db.query(News).filter(News.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"success": True}

# --- Merchandise ---
@app.get("/api/merchandise")
def get_merchandise(session = Depends(require_any)):
    return [item_to_dict(m) for m in session["db"].query(Merchandise).all()]

@app.post("/api/merchandise")
def create_merchandise(body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    item = Merchandise(id=get_next_id(db, Merchandise), title=body.get("title"), image=body.get("image"), description=body.get("description"), price=body.get("price"))
    db.add(item)
    db.commit()
    db.refresh(item)
    return item_to_dict(item)

@app.get("/api/merchandise/{item_id}")
def get_merchandise_item(item_id: int, session = Depends(require_any)):
    item = session["db"].query(Merchandise).filter(Merchandise.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item_to_dict(item)

@app.put("/api/merchandise/{item_id}")
def update_merchandise(item_id: int, body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    item = db.query(Merchandise).filter(Merchandise.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    for field in ["title", "image", "description", "price"]:
        if field in body:
            setattr(item, field, body[field])
    db.commit()
    db.refresh(item)
    return item_to_dict(item)

@app.delete("/api/merchandise/{item_id}")
def delete_merchandise(item_id: int, session = Depends(require_admin)):
    db = session["db"]
    item = db.query(Merchandise).filter(Merchandise.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"success": True}

# --- Static Files ---
public_dir = os.path.join(os.path.dirname(__file__), "..", "public")
app.mount("/", StaticFiles(directory=public_dir, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
