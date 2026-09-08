from fastapi import FastAPI, Request, Response, HTTPException, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, ForeignKey, Boolean, inspect as sa_inspect, text, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel
from datetime import datetime, timedelta
from math import radians, sin, cos, sqrt, atan2
import uuid
import json
import os
import re
import base64

# --- Database ---
SQLALCHEMY_DATABASE_URL = os.environ.get("INZENITY_DB_URL", "sqlite:///./inzenity.db")
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- Models ---
class Chapter(Base):
    __tablename__ = "chapters"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    logo = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class VehicleModel(Base):
    __tablename__ = "vehicle_models"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False)
    label = Column(String, nullable=False)
    sort_order = Column(Integer, default=0)

class VehiclePowertrain(Base):
    __tablename__ = "vehicle_powertrains"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False)
    label = Column(String, nullable=False)

class VehicleYear(Base):
    __tablename__ = "vehicle_years"
    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, unique=True, nullable=False)
    sort_order = Column(Integer, default=0)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    phone = Column(String)
    role = Column(String, default="member")
    city = Column(String)
    # Phase 1 profile fields
    email = Column(String)
    address = Column(Text)
    postal_code = Column(String)
    social_media = Column(String)
    tshirt_size = Column(String)
    chapter_id = Column(Integer, ForeignKey("chapters.id"), nullable=True)
    language = Column(String, default="id")
    member_number = Column(String)
    points_balance = Column(Integer, default=0)
    merchant_partner_id = Column(Integer, ForeignKey("merchant_partners.id"), nullable=True)
    chapter = relationship("Chapter")

class SessionModel(Base):
    __tablename__ = "sessions"
    token = Column(String, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    nickname = Column(String)
    plate_number = Column(String)
    model = Column(String)
    powertrain = Column(String)
    year = Column(Integer)
    color = Column(String)
    stnk_expiry_date = Column(DateTime)
    last_maintenance_date = Column(DateTime)
    next_maintenance_date = Column(DateTime)
    last_maintenance_km = Column(Integer)
    next_maintenance_km = Column(Integer)
    maintenance_reminder_days = Column(Integer, default=14)
    maintenance_reminder_enabled = Column(Boolean, default=True)
    stnk_reminder_days = Column(Integer, default=30)
    stnk_reminder_enabled = Column(Boolean, default=True)

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
    # Phase 2 event fields
    points = Column(Integer, default=0)
    qr_token = Column(String, unique=True, index=True)
    check_in_enabled = Column(Boolean, default=False)
    check_in_start = Column(DateTime)
    check_in_end = Column(DateTime)
    geo_validation_enabled = Column(Boolean, default=False)
    geo_radius_meters = Column(Integer, default=500)
    location_lat = Column(String)
    location_lon = Column(String)
    rsvps = relationship("RSVP", back_populates="event", cascade="all, delete-orphan")
    check_ins = relationship("CheckIn", back_populates="event", cascade="all, delete-orphan")

class RSVP(Base):
    __tablename__ = "rsvps"
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String)
    event = relationship("Event", back_populates="rsvps")

class CheckIn(Base):
    __tablename__ = "check_ins"
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    checked_in_at = Column(DateTime, default=datetime.utcnow)
    method = Column(String, default="qr")  # qr, geo
    lat = Column(String)
    lon = Column(String)
    distance_meters = Column(Integer)
    status = Column(String, default="present")  # present, late
    event = relationship("Event", back_populates="check_ins")
    user = relationship("User")
    photos = relationship("AttendancePhoto", back_populates="check_in", cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint("event_id", "user_id", name="uq_checkin_event_user"),)

class AttendancePhoto(Base):
    __tablename__ = "attendance_photos"
    id = Column(Integer, primary_key=True, index=True)
    check_in_id = Column(Integer, ForeignKey("check_ins.id"), nullable=False)
    path = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    check_in = relationship("CheckIn", back_populates="photos")

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
    subtitle = Column(String, nullable=True)
    image = Column(String)
    link = Column(String, nullable=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, default=5000)
    active = Column(Boolean, default=True)
    partner_type = Column(String, nullable=True)  # official, merchant, sponsor
    partner_id = Column(Integer, nullable=True)
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
    points = Column(Integer, default=0)

# --- Phase 3 models: partners, products, orders, chat ---
class OfficialPartner(Base):
    __tablename__ = "official_partners"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    logo = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    contact = Column(String, nullable=True)
    link = Column(String, nullable=True)
    active_period_start = Column(DateTime, nullable=True)
    active_period_end = Column(DateTime, nullable=True)
    status = Column(String, default="active")  # active, inactive
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class MerchantPartner(Base):
    __tablename__ = "merchant_partners"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    logo = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    contact = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending, active, inactive
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    owner = relationship("User", foreign_keys=[owner_user_id])

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    image = Column(String, nullable=True)
    price = Column(String, nullable=False)
    points = Column(Integer, default=0)
    category = Column(String, nullable=True)
    merchant_partner_id = Column(Integer, ForeignKey("merchant_partners.id"), nullable=True)
    is_official_merchandise = Column(Boolean, default=True)
    active = Column(Boolean, default=True)
    allow_preorder = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    merchant = relationship("MerchantPartner")
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")

class ProductVariant(Base):
    __tablename__ = "product_variants"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    label = Column(String, nullable=False)  # e.g. S, M, L or Black
    price_adjustment = Column(Integer, default=0)
    stock = Column(Integer, default=0)
    allow_preorder = Column(Boolean, default=False)
    product = relationship("Product", back_populates="variants")

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)
    merchant_partner_id = Column(Integer, ForeignKey("merchant_partners.id"), nullable=True)
    quantity = Column(Integer, default=1)
    unit_price = Column(String, nullable=False)
    total_price = Column(String, nullable=False)
    points_used = Column(Integer, default=0)
    points_earned = Column(Integer, default=0)
    status = Column(String, default="pending")  # pending, paid, processing, shipped, completed, cancelled, refunded
    payment_proof_image = Column(String, nullable=True)
    recipient_name = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    postal_code = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = relationship("User", foreign_keys=[user_id])
    product = relationship("Product")
    variant = relationship("ProductVariant")
    merchant = relationship("MerchantPartner")
    status_history = relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan", order_by="OrderStatusHistory.created_at")

class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    status = Column(String, nullable=False)
    note = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    order = relationship("Order", back_populates="status_history")
    creator = relationship("User")

class ChatRoom(Base):
    __tablename__ = "chat_rooms"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    member_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    merchant_id = Column(Integer, ForeignKey("merchant_partners.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

User.merchant_partner = relationship("MerchantPartner", foreign_keys=[User.merchant_partner_id])

# Phase 2 registration, points, rewards
class Registration(Base):
    __tablename__ = "registrations"
    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, default="pending")  # pending, approved, rejected
    full_name = Column(String, nullable=False)
    email = Column(String)
    phone = Column(String)
    address = Column(Text)
    postal_code = Column(String)
    tshirt_size = Column(String)
    chapter_id = Column(Integer, ForeignKey("chapters.id"), nullable=True)
    vehicle_model = Column(String)
    vehicle_powertrain = Column(String)
    vehicle_year = Column(Integer)
    vehicle_color = Column(String)
    plate_number = Column(String)
    stnk_image = Column(String)
    payment_proof_image = Column(String)
    location_lat = Column(String)
    location_lon = Column(String)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime)
    reviewer_id = Column(Integer, ForeignKey("users.id"))
    rejection_reason = Column(Text)
    chapter = relationship("Chapter")
    reviewer = relationship("User", foreign_keys=[reviewer_id])

class PointTransaction(Base):
    __tablename__ = "point_transactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=True)
    redemption_id = Column(Integer, ForeignKey("redemptions.id"), nullable=True)
    amount = Column(Integer, nullable=False)
    source = Column(String)  # event, merchandise, partner, manual, redemption, bonus
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    user = relationship("User", foreign_keys=[user_id])

class Reward(Base):
    __tablename__ = "rewards"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(Text)
    points_required = Column(Integer, default=0)
    image = Column(String)
    active = Column(Boolean, default=True)
    stock = Column(Integer)
    sort_order = Column(Integer, default=0)

class Redemption(Base):
    __tablename__ = "redemptions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reward_id = Column(Integer, ForeignKey("rewards.id"), nullable=False)
    status = Column(String, default="pending")  # pending, approved, rejected, completed
    points_cost = Column(Integer)
    requested_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime)
    processed_by = Column(Integer, ForeignKey("users.id"))
    rejection_reason = Column(Text)
    user = relationship("User", foreign_keys=[user_id])
    reward = relationship("Reward")

# --- Migration ---
def migrate_database(engine):
    inspector = sa_inspect(engine)
    with engine.connect() as conn:
        if "users" in inspector.get_table_names():
            columns = inspector.get_columns("users")
            col_names = {c["name"] for c in columns}
            additions = [
                ("email", String()),
                ("address", Text()),
                ("postal_code", String()),
                ("social_media", String()),
                ("tshirt_size", String()),
                ("chapter_id", Integer()),
                ("language", String()),
                ("member_number", String()),
                ("points_balance", Integer()),
            ]
            for col_name, col_type in additions:
                if col_name not in col_names:
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type.compile(engine.dialect)}"))
        if "events" in inspector.get_table_names():
            columns = inspector.get_columns("events")
            col_names = {c["name"] for c in columns}
            event_additions = [
                ("points", Integer()),
                ("qr_token", String()),
                ("check_in_enabled", Integer()),  # sqlite bool stored as int
                ("check_in_start", DateTime()),
                ("check_in_end", DateTime()),
                ("geo_validation_enabled", Integer()),
                ("geo_radius_meters", Integer()),
                ("location_lat", String()),
                ("location_lon", String()),
            ]
            for col_name, col_type in event_additions:
                if col_name not in col_names:
                    conn.execute(text(f"ALTER TABLE events ADD COLUMN {col_name} {col_type.compile(engine.dialect)}"))
        if "merchandise" in inspector.get_table_names():
            columns = inspector.get_columns("merchandise")
            col_names = {c["name"] for c in columns}
            if "points" not in col_names:
                conn.execute(text(f"ALTER TABLE merchandise ADD COLUMN points {Integer().compile(engine.dialect)}"))
        if "users" in inspector.get_table_names():
            columns = inspector.get_columns("users")
            col_names = {c["name"] for c in columns}
            if "merchant_partner_id" not in col_names:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN merchant_partner_id {Integer().compile(engine.dialect)}"))
        if "banners" in inspector.get_table_names():
            columns = inspector.get_columns("banners")
            col_names = {c["name"] for c in columns}
            banner_additions = [
                ("subtitle", String()),
                ("link", String()),
                ("start_date", DateTime()),
                ("end_date", DateTime()),
                ("duration_ms", Integer()),
                ("active", Integer()),
                ("partner_type", String()),
                ("partner_id", Integer()),
            ]
            for col_name, col_type in banner_additions:
                if col_name not in col_names:
                    conn.execute(text(f"ALTER TABLE banners ADD COLUMN {col_name} {col_type.compile(engine.dialect)}"))
        conn.commit()

Base.metadata.create_all(bind=engine)
migrate_database(engine)

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
    # Prefer explicit API token header over cookie so mobile/API clients
    # can override any existing browser cookie session.
    token = request.headers.get("x-api-token")
    if not token:
        token = request.cookies.get(SESSION_COOKIE)
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

def require_merchant(request: Request, db: Session = Depends(get_db)):
    session = get_session(request, db)
    if not session:
        raise HTTPException(status_code=401, detail="Authentication required")
    if session["user"].role != "merchant":
        raise HTTPException(status_code=403, detail="Merchant access required")
    return session

def require_merchant_or_admin(request: Request, db: Session = Depends(get_db)):
    session = get_session(request, db)
    if not session:
        raise HTTPException(status_code=401, detail="Authentication required")
    if session["user"].role not in ("merchant", "admin"):
        raise HTTPException(status_code=403, detail="Access required")
    return session

def allow_public(request: Request, db: Session = Depends(get_db)):
    return {"db": db}

# --- Serialization ---
def sanitize_user(user: User):
    return {
        "id": user.id,
        "name": user.name,
        "username": user.username,
        "role": user.role,
        "phone": user.phone,
        "city": user.city,
        "email": user.email,
        "address": user.address,
        "postalCode": user.postal_code,
        "socialMedia": user.social_media,
        "tshirtSize": user.tshirt_size,
        "chapterId": str(user.chapter_id) if user.chapter_id else None,
        "chapter": user.chapter.name if user.chapter else None,
        "language": user.language,
        "memberNumber": user.member_number,
        "pointsBalance": user.points_balance or 0,
        "merchantPartnerId": user.merchant_partner_id,
        "merchantName": user.merchant_partner.name if user.merchant_partner else None,
    }

def chapter_to_dict(chapter: Chapter):
    if not chapter:
        return None
    return {"id": chapter.id, "name": chapter.name, "logo": chapter.logo, "createdAt": chapter.created_at.isoformat() if chapter.created_at else None}

def vehicle_to_dict(vehicle: Vehicle):
    if not vehicle:
        return None
    return {
        "id": vehicle.id,
        "nickname": vehicle.nickname,
        "plateNumber": vehicle.plate_number,
        "model": vehicle.model,
        "powertrain": vehicle.powertrain,
        "year": vehicle.year,
        "color": vehicle.color,
        "stnkExpiryDate": vehicle.stnk_expiry_date.isoformat() if vehicle.stnk_expiry_date else None,
        "lastMaintenanceDate": vehicle.last_maintenance_date.isoformat() if vehicle.last_maintenance_date else None,
        "nextMaintenanceDate": vehicle.next_maintenance_date.isoformat() if vehicle.next_maintenance_date else None,
        "lastMaintenanceKm": vehicle.last_maintenance_km,
        "nextMaintenanceKm": vehicle.next_maintenance_km,
        "maintenanceReminderDays": vehicle.maintenance_reminder_days,
        "maintenanceReminderEnabled": vehicle.maintenance_reminder_enabled,
        "stnkReminderDays": vehicle.stnk_reminder_days,
        "stnkReminderEnabled": vehicle.stnk_reminder_enabled,
    }

def event_to_dict(event: Event):
    d = {
        "id": event.id,
        "title": event.title,
        "date": event.date.isoformat() if event.date else None,
        "location": event.location,
        "summary": event.summary,
        "description": event.description,
        "category": event.category,
        "host": event.host,
        "meetingPoint": event.meeting_point,
        "points": event.points or 0,
        "qrToken": event.qr_token,
        "checkInEnabled": bool(event.check_in_enabled),
        "checkInStart": event.check_in_start.isoformat() if event.check_in_start else None,
        "checkInEnd": event.check_in_end.isoformat() if event.check_in_end else None,
        "geoValidationEnabled": bool(event.geo_validation_enabled),
        "geoRadiusMeters": event.geo_radius_meters or 500,
        "locationLat": event.location_lat,
        "locationLon": event.location_lon,
        "rsvps": [{"userId": r.user_id, "status": r.status} for r in event.rsvps],
        "checkInCount": len(event.check_ins),
    }
    return d

def checkin_to_dict(ci: CheckIn):
    return {
        "id": ci.id,
        "eventId": ci.event_id,
        "userId": ci.user_id,
        "memberName": ci.user.name if ci.user else None,
        "memberNumber": ci.user.member_number if ci.user else None,
        "checkedInAt": ci.checked_in_at.isoformat() if ci.checked_in_at else None,
        "method": ci.method,
        "lat": ci.lat,
        "lon": ci.lon,
        "distanceMeters": ci.distance_meters,
        "status": ci.status,
        "photos": [p.path for p in ci.photos],
    }

def transaction_to_dict(tx: PointTransaction):
    return {
        "id": tx.id,
        "userId": tx.user_id,
        "memberName": tx.user.name if tx.user else None,
        "memberNumber": tx.user.member_number if tx.user else None,
        "eventId": tx.event_id,
        "redemptionId": tx.redemption_id,
        "amount": tx.amount,
        "source": tx.source,
        "description": tx.description,
        "createdAt": tx.created_at.isoformat() if tx.created_at else None,
        "createdBy": tx.created_by,
    }

def redemption_to_dict(r: Redemption):
    return {
        "id": r.id,
        "userId": r.user_id,
        "memberName": r.user.name if r.user else None,
        "memberNumber": r.user.member_number if r.user else None,
        "rewardId": r.reward_id,
        "rewardTitle": r.reward.title if r.reward else None,
        "status": r.status,
        "pointsCost": r.points_cost,
        "requestedAt": r.requested_at.isoformat() if r.requested_at else None,
        "processedAt": r.processed_at.isoformat() if r.processed_at else None,
        "processedBy": r.processed_by,
        "rejectionReason": r.rejection_reason,
    }

def registration_to_dict(r: Registration):
    return {
        "id": r.id,
        "status": r.status,
        "fullName": r.full_name,
        "email": r.email,
        "phone": r.phone,
        "address": r.address,
        "postalCode": r.postal_code,
        "tshirtSize": r.tshirt_size,
        "chapterId": str(r.chapter_id) if r.chapter_id else None,
        "chapter": r.chapter.name if r.chapter else None,
        "vehicleModel": r.vehicle_model,
        "vehiclePowertrain": r.vehicle_powertrain,
        "vehicleYear": r.vehicle_year,
        "vehicleColor": r.vehicle_color,
        "plateNumber": r.plate_number,
        "stnkImage": r.stnk_image,
        "paymentProofImage": r.payment_proof_image,
        "locationLat": r.location_lat,
        "locationLon": r.location_lon,
        "username": r.username,
        "submittedAt": r.submitted_at.isoformat() if r.submitted_at else None,
        "reviewedAt": r.reviewed_at.isoformat() if r.reviewed_at else None,
        "reviewerId": r.reviewer_id,
        "rejectionReason": r.rejection_reason,
    }

# --- Phase 3 serialization helpers ---
def official_partner_to_dict(p: OfficialPartner):
    return {
        "id": p.id,
        "name": p.name,
        "logo": p.logo,
        "description": p.description,
        "contact": p.contact,
        "link": p.link,
        "activePeriodStart": p.active_period_start.isoformat() if p.active_period_start else None,
        "activePeriodEnd": p.active_period_end.isoformat() if p.active_period_end else None,
        "status": p.status,
        "sortOrder": p.sort_order,
        "createdAt": p.created_at.isoformat() if p.created_at else None,
    }

def merchant_partner_to_dict(m: MerchantPartner):
    return {
        "id": m.id,
        "name": m.name,
        "logo": m.logo,
        "description": m.description,
        "contact": m.contact,
        "status": m.status,
        "ownerUserId": m.owner_user_id,
        "createdAt": m.created_at.isoformat() if m.created_at else None,
    }

def product_variant_to_dict(v: ProductVariant):
    return {
        "id": v.id,
        "productId": v.product_id,
        "label": v.label,
        "priceAdjustment": v.price_adjustment or 0,
        "stock": v.stock or 0,
        "allowPreorder": v.allow_preorder,
    }

def product_to_dict(p: Product, include_variants=True):
    d = {
        "id": p.id,
        "title": p.title,
        "description": p.description,
        "image": p.image,
        "price": p.price,
        "points": p.points or 0,
        "category": p.category,
        "merchantPartnerId": p.merchant_partner_id,
        "merchantName": p.merchant.name if p.merchant else None,
        "isOfficialMerchandise": p.is_official_merchandise,
        "active": p.active,
        "allowPreorder": p.allow_preorder,
        "sortOrder": p.sort_order,
        "createdAt": p.created_at.isoformat() if p.created_at else None,
    }
    if include_variants:
        d["variants"] = [product_variant_to_dict(v) for v in (p.variants or [])]
    return d

def order_status_history_to_dict(h: OrderStatusHistory):
    return {
        "id": h.id,
        "orderId": h.order_id,
        "status": h.status,
        "note": h.note,
        "createdBy": h.created_by,
        "createdAt": h.created_at.isoformat() if h.created_at else None,
    }

def order_to_dict(o: Order, include_history=False):
    d = {
        "id": o.id,
        "orderNumber": o.order_number,
        "userId": o.user_id,
        "memberName": o.user.name if o.user else None,
        "memberNumber": o.user.member_number if o.user else None,
        "productId": o.product_id,
        "productTitle": o.product.title if o.product else None,
        "productImage": o.product.image if o.product else None,
        "variantId": o.variant_id,
        "variantLabel": o.variant.label if o.variant else None,
        "merchantPartnerId": o.merchant_partner_id,
        "merchantName": o.merchant.name if o.merchant else None,
        "quantity": o.quantity,
        "unitPrice": o.unit_price,
        "totalPrice": o.total_price,
        "pointsUsed": o.points_used,
        "pointsEarned": o.points_earned,
        "status": o.status,
        "paymentProofImage": o.payment_proof_image,
        "recipientName": o.recipient_name,
        "address": o.address,
        "postalCode": o.postal_code,
        "phone": o.phone,
        "createdAt": o.created_at.isoformat() if o.created_at else None,
        "updatedAt": o.updated_at.isoformat() if o.updated_at else None,
    }
    if include_history:
        d["statusHistory"] = [order_status_history_to_dict(h) for h in (o.status_history or [])]
    return d

def banner_to_dict(b: Banner):
    return {
        "id": b.id,
        "title": b.title,
        "subtitle": b.subtitle,
        "image": b.image,
        "link": b.link,
        "startDate": b.start_date.isoformat() if b.start_date else None,
        "endDate": b.end_date.isoformat() if b.end_date else None,
        "durationMs": b.duration_ms or 5000,
        "active": b.active,
        "partnerType": b.partner_type,
        "partnerId": b.partner_id,
        "order": b.order,
    }

def reward_to_dict(r: Reward):
    return {
        "id": r.id,
        "title": r.title,
        "description": r.description,
        "pointsRequired": r.points_required,
        "image": r.image,
        "active": r.active,
        "stock": r.stock,
        "sortOrder": r.sort_order,
    }

def item_to_dict(item):
    d = {}
    for col in item.__table__.columns:
        val = getattr(item, col.name)
        if isinstance(val, datetime):
            val = val.isoformat()
        key = col.name
        if key == "meeting_point": key = "meetingPoint"
        elif key == "created_at": key = "createdAt"
        elif key == "sort_order": key = "sortOrder"
        elif key == "points_required": key = "pointsRequired"
        elif key == "points_cost": key = "pointsCost"
        elif key == "requested_at": key = "requestedAt"
        elif key == "processed_at": key = "processedAt"
        elif key == "rejection_reason": key = "rejectionReason"
        elif key == "reviewed_at": key = "reviewedAt"
        elif key == "submitted_at": key = "submittedAt"
        elif key == "checked_in_at": key = "checkedInAt"
        elif key == "full_name": key = "fullName"
        elif key == "postal_code": key = "postalCode"
        elif key == "tshirt_size": key = "tshirtSize"
        elif key == "vehicle_model": key = "vehicleModel"
        elif key == "vehicle_powertrain": key = "vehiclePowertrain"
        elif key == "vehicle_year": key = "vehicleYear"
        elif key == "vehicle_color": key = "vehicleColor"
        elif key == "plate_number": key = "plateNumber"
        elif key == "stnk_image": key = "stnkImage"
        elif key == "payment_proof_image": key = "paymentProofImage"
        elif key == "location_lat": key = "locationLat"
        elif key == "location_lon": key = "locationLon"
        d[key] = val
    return d

def get_next_id(db, model):
    max_item = db.query(model).order_by(model.id.desc()).first()
    return (max_item.id + 1) if max_item else 1

def parse_val(field, val):
    if val is not None and field in ("date", "createdAt", "stnkExpiryDate", "lastMaintenanceDate", "nextMaintenanceDate", "checkInStart", "checkInEnd"):
        return datetime.fromisoformat(val) if isinstance(val, str) else val
    return val

def parse_int(val):
    try:
        return int(val) if val is not None and val != "" else None
    except (ValueError, TypeError):
        return None

def parse_bool(val):
    if isinstance(val, bool):
        return val
    if val is None:
        return None
    return str(val).lower() in ("true", "1", "yes", "on")

# --- File helpers ---
public_dir = os.path.join(os.path.dirname(__file__), "..", "public")
uploads_dir = os.path.join(public_dir, "uploads", "chapters")
os.makedirs(uploads_dir, exist_ok=True)

def save_base64_image(data_uri: str, folder: str, filename: str) -> str:
    if not data_uri:
        return None
    match = re.match(r"data:image/(\w+);base64,(.+)", data_uri)
    if not match:
        return None
    ext = match.group(1)
    data = match.group(2)
    folder_path = os.path.join(public_dir, "uploads", folder)
    os.makedirs(folder_path, exist_ok=True)
    file_path = os.path.join(folder_path, filename)
    with open(file_path, "wb") as f:
        f.write(base64.b64decode(data))
    return f"/uploads/{folder}/{filename}"

def delete_uploaded_image(path: str):
    if not path:
        return
    try:
        full = os.path.join(public_dir, path.lstrip("/"))
        if os.path.exists(full):
            os.remove(full)
    except Exception:
        pass

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
            db.add(User(
                id=u["id"], name=u["name"], username=u["username"], password=u["password"],
                phone=u["phone"], role=u["role"], city=u["city"],
                email=u.get("email"), member_number=u.get("memberNumber"),
                language=u.get("language", "id"), chapter_id=u.get("chapterId")
            ))
        for e in data.get("events", []):
            event = Event(
                id=e["id"], title=e["title"], date=datetime.fromisoformat(e["date"]), location=e["location"],
                summary=e["summary"], description=e["description"], category=e.get("category"),
                host=e.get("host"), meeting_point=e.get("meetingPoint"),
                points=0, qr_token=uuid.uuid4().hex[:16], check_in_enabled=False
            )
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
            db.add(Merchandise(id=m["id"], title=m["title"], image=m["image"], description=m["description"], price=m["price"], points=0))
        db.commit()
    finally:
        db.close()

def seed_reference_data():
    db = SessionLocal()
    try:
        if not db.query(Chapter).first():
            for name in ["Jabodetabek", "Jawa Timur", "Jawa Tengah", "Jawa Barat", "Bali", "Lampung"]:
                db.add(Chapter(name=name))
        if not db.query(VehicleModel).first():
            for code, label in [("G", "G"), ("V", "V"), ("Q", "Q")]:
                db.add(VehicleModel(code=code, label=label))
        if not db.query(VehiclePowertrain).first():
            for code in ["Gasoline", "Hybrid"]:
                db.add(VehiclePowertrain(code=code, label=code))
        if not db.query(VehicleYear).first():
            for year in [2023, 2024, 2025]:
                db.add(VehicleYear(year=year))
        # Fill missing member numbers, language, points for existing users
        for user in db.query(User).all():
            if not user.language:
                user.language = "id"
            if not user.member_number:
                user.member_number = f"IZ-{user.id:04d}"
            if user.points_balance is None:
                user.points_balance = 0
        # Generate qr tokens for events missing them
        for event in db.query(Event).all():
            if not event.qr_token:
                event.qr_token = uuid.uuid4().hex[:16]
            if event.points is None:
                event.points = 0
        db.commit()
    finally:
        db.close()

seed_database()
seed_reference_data()

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
    db.query(ChatMessage).delete()
    db.query(ChatRoom).delete()
    db.query(OrderStatusHistory).delete()
    db.query(Order).delete()
    db.query(ProductVariant).delete()
    db.query(Product).delete()
    db.query(MerchantPartner).delete()
    db.query(OfficialPartner).delete()
    db.query(AttendancePhoto).delete()
    db.query(CheckIn).delete()
    db.query(PointTransaction).delete()
    db.query(Redemption).delete()
    db.query(Reward).delete()
    db.query(Registration).delete()
    db.query(RSVP).delete()
    db.query(Event).delete()
    db.query(Announcement).delete()
    db.query(Vendor).delete()
    db.query(Banner).delete()
    db.query(Sponsor).delete()
    db.query(News).delete()
    db.query(Merchandise).delete()
    db.query(SessionModel).delete()
    db.query(Vehicle).delete()
    db.query(User).delete()
    db.query(Chapter).delete()
    db.query(VehicleModel).delete()
    db.query(VehiclePowertrain).delete()
    db.query(VehicleYear).delete()
    db.commit()
    seed_database()
    seed_reference_data()
    return {"success": True}

# --- Public data (no auth required) ---
@app.get("/api/public/chapters")
def public_chapters(db: Session = Depends(get_db)):
    return [chapter_to_dict(c) for c in db.query(Chapter).order_by(Chapter.name).all()]

@app.get("/api/public/vehicle-options")
def public_vehicle_options(db: Session = Depends(get_db)):
    models = [{"code": m.code, "label": m.label} for m in db.query(VehicleModel).order_by(VehicleModel.sort_order, VehicleModel.code).all()]
    powertrains = [{"code": p.code, "label": p.label} for p in db.query(VehiclePowertrain).order_by(VehiclePowertrain.id).all()]
    years = [y.year for y in db.query(VehicleYear).order_by(VehicleYear.sort_order, VehicleYear.year).all()]
    return {
        "models": models,
        "powertrains": powertrains,
        "years": years,
        "tshirtSizes": ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    }

# --- Registration (public submission + admin management) ---
@app.post("/api/register")
def register(body: dict = Body(default={}), db: Session = Depends(get_db)):
    username = (body.get("username") or "").strip()
    email = (body.get("email") or "").strip()
    if not username or not body.get("password") or not body.get("fullName"):
        raise HTTPException(status_code=400, detail="Username, password, and full name are required")
    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    if db.query(Registration).filter(Registration.username == username, Registration.status == "pending").first():
        raise HTTPException(status_code=400, detail="Username is already pending approval")

    reg = Registration(
        id=get_next_id(db, Registration),
        full_name=body.get("fullName"),
        email=email,
        phone=body.get("phone"),
        address=body.get("address"),
        postal_code=body.get("postalCode"),
        tshirt_size=body.get("tshirtSize"),
        chapter_id=parse_int(body.get("chapterId")),
        vehicle_model=body.get("vehicleModel"),
        vehicle_powertrain=body.get("vehiclePowertrain"),
        vehicle_year=parse_int(body.get("vehicleYear")),
        vehicle_color=body.get("vehicleColor"),
        plate_number=body.get("plateNumber"),
        username=username,
        password=body.get("password"),
        location_lat=body.get("locationLat"),
        location_lon=body.get("locationLon"),
    )
    if body.get("stnkImage"):
        reg.stnk_image = save_base64_image(body["stnkImage"], "registrations", f"stnk_{reg.id}.png")
    if body.get("paymentProofImage"):
        reg.payment_proof_image = save_base64_image(body["paymentProofImage"], "registrations", f"payment_{reg.id}.png")
    db.add(reg)
    db.commit()
    return {"success": True, "id": reg.id, "status": reg.status}

@app.get("/api/registrations")
def get_registrations(status: str = None, session = Depends(require_admin)):
    db = session["db"]
    q = db.query(Registration)
    if status:
        q = q.filter(Registration.status == status)
    return [registration_to_dict(r) for r in q.order_by(Registration.submitted_at.desc()).all()]

@app.get("/api/registrations/{reg_id}")
def get_registration(reg_id: int, session = Depends(require_admin)):
    db = session["db"]
    reg = db.query(Registration).filter(Registration.id == reg_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Not found")
    return registration_to_dict(reg)

@app.put("/api/registrations/{reg_id}")
def update_registration(reg_id: int, body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    admin_user = session["user"]
    reg = db.query(Registration).filter(Registration.id == reg_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Not found")

    old_status = reg.status
    new_status = body.get("status", old_status)

    # Update editable fields
    for json_key, db_field in [
        ("fullName", "full_name"), ("email", "email"), ("phone", "phone"),
        ("address", "address"), ("postalCode", "postal_code"), ("tshirtSize", "tshirt_size"),
        ("vehicleModel", "vehicle_model"), ("vehiclePowertrain", "vehicle_powertrain"),
        ("vehicleYear", "vehicle_year"), ("vehicleColor", "vehicle_color"), ("plateNumber", "plate_number"),
        ("username", "username"), ("password", "password"), ("rejectionReason", "rejection_reason"),
        ("locationLat", "location_lat"), ("locationLon", "location_lon"),
    ]:
        if json_key in body:
            setattr(reg, db_field, body[json_key])
    if "chapterId" in body:
        reg.chapter_id = parse_int(body["chapterId"])

    # File updates
    if "stnkImage" in body:
        if body["stnkImage"]:
            delete_uploaded_image(reg.stnk_image)
            reg.stnk_image = save_base64_image(body["stnkImage"], "registrations", f"stnk_{reg.id}.png")
        else:
            delete_uploaded_image(reg.stnk_image)
            reg.stnk_image = None
    if "paymentProofImage" in body:
        if body["paymentProofImage"]:
            delete_uploaded_image(reg.payment_proof_image)
            reg.payment_proof_image = save_base64_image(body["paymentProofImage"], "registrations", f"payment_{reg.id}.png")
        else:
            delete_uploaded_image(reg.payment_proof_image)
            reg.payment_proof_image = None

    if new_status != old_status:
        reg.status = new_status
        reg.reviewed_at = datetime.utcnow()
        reg.reviewer_id = admin_user.id
        if new_status == "approved":
            # Create user
            existing = db.query(User).filter(User.username == reg.username).first()
            if existing:
                raise HTTPException(status_code=400, detail="Username already exists in users")
            new_user = User(
                id=get_next_id(db, User),
                name=reg.full_name,
                username=reg.username,
                password=reg.password,
                phone=reg.phone,
                role="member",
                city=None,
                email=reg.email,
                address=reg.address,
                postal_code=reg.postal_code,
                tshirt_size=reg.tshirt_size,
                chapter_id=reg.chapter_id,
                language="id",
                member_number=f"IZ-{get_next_id(db, User):04d}",
                points_balance=0,
            )
            db.add(new_user)
            db.flush()
            vehicle = Vehicle(
                id=get_next_id(db, Vehicle),
                user_id=new_user.id,
                nickname=None,
                plate_number=reg.plate_number,
                model=reg.vehicle_model,
                powertrain=reg.vehicle_powertrain,
                year=reg.vehicle_year,
                color=reg.vehicle_color,
            )
            db.add(vehicle)

    db.commit()
    return registration_to_dict(reg)

@app.delete("/api/registrations/{reg_id}")
def delete_registration(reg_id: int, session = Depends(require_admin)):
    db = session["db"]
    reg = db.query(Registration).filter(Registration.id == reg_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Not found")
    delete_uploaded_image(reg.stnk_image)
    delete_uploaded_image(reg.payment_proof_image)
    db.delete(reg)
    db.commit()
    return {"success": True}

# --- Users ---
@app.get("/api/users")
def get_users(session = Depends(require_admin)):
    db = session["db"]
    users = db.query(User).all()
    return [{
        "id": u.id,
        "name": u.name,
        "username": u.username,
        "password": u.password,
        "phone": u.phone,
        "role": u.role,
        "city": u.city,
        "email": u.email,
        "address": u.address,
        "postalCode": u.postal_code,
        "socialMedia": u.social_media,
        "tshirtSize": u.tshirt_size,
        "chapterId": str(u.chapter_id) if u.chapter_id else None,
        "chapter": u.chapter.name if u.chapter else None,
        "language": u.language,
        "memberNumber": u.member_number,
        "pointsBalance": u.points_balance or 0,
    } for u in users]

@app.post("/api/users")
def create_user(body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    user = User(
        id=get_next_id(db, User),
        name=body.get("name"),
        username=body.get("username"),
        password=body.get("password"),
        phone=body.get("phone"),
        role=body.get("role", "member"),
        city=body.get("city"),
        email=body.get("email"),
        address=body.get("address"),
        postal_code=body.get("postalCode"),
        social_media=body.get("socialMedia"),
        tshirt_size=body.get("tshirtSize"),
        chapter_id=parse_int(body.get("chapterId")),
        language=body.get("language", "id"),
        member_number=body.get("memberNumber"),
        points_balance=0,
    )
    if not user.member_number:
        user.member_number = f"IZ-{user.id:04d}"
    db.add(user)
    db.commit()
    return sanitize_user(user)

@app.get("/api/users/{user_id}")
def get_user(user_id: int, session = Depends(require_admin)):
    db = session["db"]
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Not found")
    return sanitize_user(user)

@app.put("/api/users/{user_id}")
def update_user(user_id: int, body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Not found")
    field_map = {
        "name": "name", "username": "username", "phone": "phone", "role": "role", "city": "city",
        "email": "email", "address": "address", "postalCode": "postal_code",
        "socialMedia": "social_media", "tshirtSize": "tshirt_size", "language": "language",
        "memberNumber": "member_number",
    }
    for json_key, db_field in field_map.items():
        if json_key in body:
            setattr(user, db_field, body[json_key])
    if "password" in body and body["password"]:
        user.password = body["password"]
    if "chapterId" in body:
        cid = parse_int(body["chapterId"])
        if cid:
            chapter = db.query(Chapter).filter(Chapter.id == cid).first()
            if not chapter:
                raise HTTPException(status_code=400, detail="Invalid chapter")
        user.chapter_id = cid
    if "pointsBalance" in body:
        user.points_balance = parse_int(body["pointsBalance"]) or 0
    if not user.member_number:
        user.member_number = f"IZ-{user.id:04d}"
    db.commit()
    return sanitize_user(user)

@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, session = Depends(require_admin)):
    db = session["db"]
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(user)
    db.query(SessionModel).filter(SessionModel.user_id == user_id).delete()
    db.query(RSVP).filter(RSVP.user_id == user_id).delete()
    db.query(Vehicle).filter(Vehicle.user_id == user_id).delete()
    db.query(PointTransaction).filter(PointTransaction.user_id == user_id).delete()
    db.query(Redemption).filter(Redemption.user_id == user_id).delete()
    db.query(CheckIn).filter(CheckIn.user_id == user_id).delete()
    db.commit()
    return {"success": True}

# --- Profile (member) ---
@app.get("/api/profile")
def get_profile(session = Depends(require_member)):
    db = session["db"]
    user = session["user"]
    vehicle = db.query(Vehicle).filter(Vehicle.user_id == user.id).first()
    chapter = user.chapter
    reminders = compute_reminders(vehicle)
    return {
        "user": sanitize_user(user),
        "vehicle": vehicle_to_dict(vehicle),
        "chapter": chapter_to_dict(chapter),
        "reminders": reminders,
    }

@app.get("/api/me/points")
def get_my_points(session = Depends(require_member)):
    db = session["db"]
    user = session["user"]
    txs = db.query(PointTransaction).filter(PointTransaction.user_id == user.id).order_by(PointTransaction.created_at.desc()).all()
    return {
        "balance": user.points_balance or 0,
        "transactions": [transaction_to_dict(tx) for tx in txs],
    }

@app.get("/api/me/check-ins")
def get_my_checkins(session = Depends(require_member)):
    db = session["db"]
    user = session["user"]
    cis = db.query(CheckIn).filter(CheckIn.user_id == user.id).order_by(CheckIn.checked_in_at.desc()).all()
    return [checkin_to_dict(ci) for ci in cis]

@app.get("/api/me/redemptions")
def get_my_redemptions(session = Depends(require_member)):
    db = session["db"]
    user = session["user"]
    rs = db.query(Redemption).filter(Redemption.user_id == user.id).order_by(Redemption.requested_at.desc()).all()
    return [redemption_to_dict(r) for r in rs]

def compute_reminders(vehicle: Vehicle):
    reminders = []
    today = datetime.utcnow().date()
    if vehicle and vehicle.maintenance_reminder_enabled and vehicle.next_maintenance_date:
        due = vehicle.next_maintenance_date.date()
        remind_at = due - timedelta(days=vehicle.maintenance_reminder_days or 0)
        if today >= remind_at:
            reminders.append({
                "type": "maintenance",
                "title": "Maintenance due soon",
                "dueDate": vehicle.next_maintenance_date.isoformat(),
                "daysRemaining": max(0, (due - today).days),
            })
    if vehicle and vehicle.stnk_reminder_enabled and vehicle.stnk_expiry_date:
        due = vehicle.stnk_expiry_date.date()
        remind_at = due - timedelta(days=vehicle.stnk_reminder_days or 0)
        if today >= remind_at:
            reminders.append({
                "type": "stnk",
                "title": "STNK expiry reminder",
                "dueDate": vehicle.stnk_expiry_date.isoformat(),
                "daysRemaining": max(0, (due - today).days),
            })
    return reminders

@app.put("/api/profile")
def update_profile(body: dict = Body(default={}), session = Depends(require_member)):
    db = session["db"]
    user = session["user"]
    person = body.get("person", {})
    vehicle_data = body.get("vehicle", {})

    # Update person
    field_map = {
        "name": "name", "email": "email", "phone": "phone",
        "address": "address", "postalCode": "postal_code",
        "socialMedia": "social_media", "tshirtSize": "tshirt_size",
        "language": "language",
    }
    for key, db_field in field_map.items():
        if key in person:
            setattr(user, db_field, person[key])
    if "chapterId" in person:
        cid = parse_int(person["chapterId"])
        if cid:
            chapter = db.query(Chapter).filter(Chapter.id == cid).first()
            if not chapter:
                raise HTTPException(status_code=400, detail="Invalid chapter")
        user.chapter_id = cid
    if not user.member_number:
        user.member_number = f"IZ-{user.id:04d}"

    # Update or create vehicle
    vehicle = db.query(Vehicle).filter(Vehicle.user_id == user.id).first()
    if not vehicle:
        vehicle = Vehicle(id=get_next_id(db, Vehicle), user_id=user.id)
        db.add(vehicle)

    vmap = {
        "nickname": "nickname", "plateNumber": "plate_number", "model": "model",
        "powertrain": "powertrain", "year": "year", "color": "color",
        "lastMaintenanceKm": "last_maintenance_km", "nextMaintenanceKm": "next_maintenance_km",
        "maintenanceReminderDays": "maintenance_reminder_days",
        "maintenanceReminderEnabled": "maintenance_reminder_enabled",
        "stnkReminderDays": "stnk_reminder_days",
        "stnkReminderEnabled": "stnk_reminder_enabled",
    }
    for key, db_field in vmap.items():
        if key in vehicle_data:
            val = vehicle_data[key]
            if db_field in ("year", "last_maintenance_km", "next_maintenance_km", "maintenance_reminder_days", "stnk_reminder_days"):
                val = parse_int(val)
            elif db_field in ("maintenance_reminder_enabled", "stnk_reminder_enabled"):
                val = parse_bool(val)
            elif db_field in ("stnk_expiry_date", "last_maintenance_date", "next_maintenance_date"):
                val = parse_val("date", val)
            setattr(vehicle, db_field, val)

    for date_field, json_field in [("stnk_expiry_date", "stnkExpiryDate"), ("last_maintenance_date", "lastMaintenanceDate"), ("next_maintenance_date", "nextMaintenanceDate")]:
        if json_field in vehicle_data:
            setattr(vehicle, date_field, parse_val("date", vehicle_data[json_field]))

    db.commit()
    return get_profile(session)

@app.put("/api/me/language")
def update_language(body: dict = Body(default={}), session = Depends(require_member)):
    db = session["db"]
    user = session["user"]
    lang = body.get("language")
    if lang not in ("id", "en"):
        raise HTTPException(status_code=400, detail="Unsupported language")
    user.language = lang
    db.commit()
    return {"language": user.language}

# --- Chapters ---
@app.get("/api/chapters")
def get_chapters(session = Depends(require_any)):
    db = session["db"]
    return [chapter_to_dict(c) for c in db.query(Chapter).order_by(Chapter.name).all()]

@app.post("/api/chapters")
def create_chapter(body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    name = (body.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Chapter name required")
    chapter = Chapter(id=get_next_id(db, Chapter), name=name)
    db.add(chapter)
    db.commit()
    db.refresh(chapter)
    logo = body.get("logo")
    if logo:
        chapter.logo = save_base64_image(logo, "chapters", f"{chapter.id}.png")
        db.commit()
    return chapter_to_dict(chapter)

@app.get("/api/chapters/{chapter_id}")
def get_chapter(chapter_id: int, session = Depends(require_any)):
    db = session["db"]
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Not found")
    return chapter_to_dict(chapter)

@app.put("/api/chapters/{chapter_id}")
def update_chapter(chapter_id: int, body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Not found")
    name = (body.get("name") or "").strip()
    if name:
        chapter.name = name
    logo = body.get("logo")
    if logo:
        delete_uploaded_image(chapter.logo)
        chapter.logo = save_base64_image(logo, "chapters", f"{chapter.id}.png")
    elif "logo" in body and not logo:
        delete_uploaded_image(chapter.logo)
        chapter.logo = None
    db.commit()
    return chapter_to_dict(chapter)

@app.delete("/api/chapters/{chapter_id}")
def delete_chapter(chapter_id: int, session = Depends(require_admin)):
    db = session["db"]
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Not found")
    db.query(User).filter(User.chapter_id == chapter_id).update({"chapter_id": None})
    delete_uploaded_image(chapter.logo)
    db.delete(chapter)
    db.commit()
    return {"success": True}

# --- Vehicle options ---
@app.get("/api/vehicle-options")
def get_vehicle_options(session = Depends(require_any)):
    db = session["db"]
    models = [{"code": m.code, "label": m.label} for m in db.query(VehicleModel).order_by(VehicleModel.sort_order, VehicleModel.code).all()]
    powertrains = [{"code": p.code, "label": p.label} for p in db.query(VehiclePowertrain).order_by(VehiclePowertrain.id).all()]
    years = [y.year for y in db.query(VehicleYear).order_by(VehicleYear.sort_order, VehicleYear.year).all()]
    return {
        "models": models,
        "powertrains": powertrains,
        "years": years,
        "tshirtSizes": ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
        "reminderOptions": [
            {"days": 30, "labelEn": "1 month before", "labelId": "1 bulan sebelum"},
            {"days": 14, "labelEn": "2 weeks before", "labelId": "2 minggu sebelum"},
            {"days": 7, "labelEn": "1 week before", "labelId": "1 minggu sebelum"},
        ],
    }

# Admin vehicle options CRUD
@app.get("/api/vehicle-models")
def get_vehicle_models(session = Depends(require_admin)):
    db = session["db"]
    return [item_to_dict(m) for m in db.query(VehicleModel).order_by(VehicleModel.sort_order, VehicleModel.code).all()]

@app.post("/api/vehicle-models")
def create_vehicle_model(body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    item = VehicleModel(id=get_next_id(db, VehicleModel), code=body.get("code"), label=body.get("label"), sort_order=parse_int(body.get("sortOrder")) or 0)
    db.add(item)
    db.commit()
    return item_to_dict(item)

@app.put("/api/vehicle-models/{item_id}")
def update_vehicle_model(item_id: int, body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    item = db.query(VehicleModel).filter(VehicleModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    for field in ["code", "label"]:
        if field in body:
            setattr(item, field, body[field])
    if "sortOrder" in body:
        item.sort_order = parse_int(body["sortOrder"]) or 0
    db.commit()
    return item_to_dict(item)

@app.delete("/api/vehicle-models/{item_id}")
def delete_vehicle_model(item_id: int, session = Depends(require_admin)):
    db = session["db"]
    item = db.query(VehicleModel).filter(VehicleModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"success": True}

@app.get("/api/vehicle-years")
def get_vehicle_years(session = Depends(require_admin)):
    db = session["db"]
    return [item_to_dict(y) for y in db.query(VehicleYear).order_by(VehicleYear.sort_order, VehicleYear.year).all()]

@app.post("/api/vehicle-years")
def create_vehicle_year(body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    item = VehicleYear(id=get_next_id(db, VehicleYear), year=parse_int(body.get("year")) or 0, sort_order=parse_int(body.get("sortOrder")) or 0)
    db.add(item)
    db.commit()
    return item_to_dict(item)

@app.put("/api/vehicle-years/{item_id}")
def update_vehicle_year(item_id: int, body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    item = db.query(VehicleYear).filter(VehicleYear.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    if "year" in body:
        item.year = parse_int(body["year"]) or 0
    if "sortOrder" in body:
        item.sort_order = parse_int(body["sortOrder"]) or 0
    db.commit()
    return item_to_dict(item)

@app.delete("/api/vehicle-years/{item_id}")
def delete_vehicle_year(item_id: int, session = Depends(require_admin)):
    db = session["db"]
    item = db.query(VehicleYear).filter(VehicleYear.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"success": True}

@app.get("/api/vehicle-powertrains")
def get_vehicle_powertrains(session = Depends(require_admin)):
    db = session["db"]
    return [item_to_dict(p) for p in db.query(VehiclePowertrain).order_by(VehiclePowertrain.id).all()]

@app.post("/api/vehicle-powertrains")
def create_vehicle_powertrain(body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    item = VehiclePowertrain(id=get_next_id(db, VehiclePowertrain), code=body.get("code"), label=body.get("label"))
    db.add(item)
    db.commit()
    return item_to_dict(item)

@app.put("/api/vehicle-powertrains/{item_id}")
def update_vehicle_powertrain(item_id: int, body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    item = db.query(VehiclePowertrain).filter(VehiclePowertrain.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    for field in ["code", "label"]:
        if field in body:
            setattr(item, field, body[field])
    db.commit()
    return item_to_dict(item)

@app.delete("/api/vehicle-powertrains/{item_id}")
def delete_vehicle_powertrain(item_id: int, session = Depends(require_admin)):
    db = session["db"]
    item = db.query(VehiclePowertrain).filter(VehiclePowertrain.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
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
    event = Event(
        id=get_next_id(db, Event),
        title=body.get("title"),
        date=parse_val("date", body.get("date")),
        location=body.get("location"),
        summary=body.get("summary"),
        description=body.get("description"),
        category=body.get("category"),
        host=body.get("host"),
        meeting_point=body.get("meetingPoint"),
        points=parse_int(body.get("points")) or 0,
        qr_token=uuid.uuid4().hex[:16],
        check_in_enabled=parse_bool(body.get("checkInEnabled")) or False,
        check_in_start=parse_val("checkInStart", body.get("checkInStart")),
        check_in_end=parse_val("checkInEnd", body.get("checkInEnd")),
        geo_validation_enabled=parse_bool(body.get("geoValidationEnabled")) or False,
        geo_radius_meters=parse_int(body.get("geoRadiusMeters")) or 500,
        location_lat=body.get("locationLat"),
        location_lon=body.get("locationLon"),
    )
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
    for field, db_field in [
        ("title", "title"), ("date", "date"), ("location", "location"),
        ("summary", "summary"), ("description", "description"), ("category", "category"),
        ("host", "host"), ("meetingPoint", "meeting_point"), ("locationLat", "location_lat"),
        ("locationLon", "location_lon"),
    ]:
        if field in body:
            setattr(event, db_field, parse_val("date" if field == "date" else field, body[field]))
    if "points" in body:
        event.points = parse_int(body["points"]) or 0
    if "checkInEnabled" in body:
        event.check_in_enabled = parse_bool(body["checkInEnabled"]) or False
    if "checkInStart" in body:
        event.check_in_start = parse_val("checkInStart", body["checkInStart"])
    if "checkInEnd" in body:
        event.check_in_end = parse_val("checkInEnd", body["checkInEnd"])
    if "geoValidationEnabled" in body:
        event.geo_validation_enabled = parse_bool(body["geoValidationEnabled"]) or False
    if "geoRadiusMeters" in body:
        event.geo_radius_meters = parse_int(body["geoRadiusMeters"]) or 500
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

# --- Check-in & attendance ---
def haversine(lat1, lon1, lat2, lon2):
    try:
        R = 6371000  # meters
        phi1 = radians(float(lat1))
        phi2 = radians(float(lat2))
        dphi = radians(float(lat2) - float(lat1))
        dlambda = radians(float(lon2) - float(lon1))
        a = sin(dphi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(dlambda / 2) ** 2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return int(R * c)
    except Exception:
        return None

@app.post("/api/events/{event_id}/check-in")
def check_in(event_id: int, body: dict = Body(default={}), session = Depends(require_member)):
    db = session["db"]
    user = session["user"]
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if not event.check_in_enabled:
        raise HTTPException(status_code=400, detail="Check-in not enabled for this event")
    if body.get("qrToken") != event.qr_token:
        raise HTTPException(status_code=400, detail="Invalid QR token")

    rsvp = db.query(RSVP).filter(RSVP.event_id == event_id, RSVP.user_id == user.id, RSVP.status == "Going").first()
    if not rsvp:
        raise HTTPException(status_code=400, detail="You must RSVP as Going to check in")

    method = body.get("method", "qr")
    lat = body.get("lat")
    lon = body.get("lon")
    distance = None

    if method == "geo":
        if not lat or not lon:
            raise HTTPException(status_code=400, detail="Location required for geo check-in")
        if event.geo_validation_enabled and event.location_lat and event.location_lon:
            distance = haversine(lat, lon, event.location_lat, event.location_lon)
            if distance is None or distance > (event.geo_radius_meters or 500):
                raise HTTPException(status_code=400, detail="You are outside the allowed check-in radius")

    try:
        ci = CheckIn(
            id=get_next_id(db, CheckIn),
            event_id=event_id,
            user_id=user.id,
            method=method,
            lat=lat,
            lon=lon,
            distance_meters=distance,
            status="present",
        )
        db.add(ci)
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Already checked in to this event")

    # Award event points
    if event.points and event.points > 0:
        db.add(PointTransaction(
            id=get_next_id(db, PointTransaction),
            user_id=user.id,
            event_id=event.id,
            amount=event.points,
            source="event",
            description=f"Points for attending {event.title}",
        ))
        user.points_balance = (user.points_balance or 0) + event.points

    db.commit()
    db.refresh(ci)
    return checkin_to_dict(ci)

@app.post("/api/check-ins/{check_in_id}/photos")
def upload_checkin_photos(check_in_id: int, body: dict = Body(default={}), session = Depends(require_member)):
    db = session["db"]
    user = session["user"]
    ci = db.query(CheckIn).filter(CheckIn.id == check_in_id, CheckIn.user_id == user.id).first()
    if not ci:
        raise HTTPException(status_code=404, detail="Check-in not found")
    photos = body.get("photos", []) or []
    if len(photos) > 3:
        raise HTTPException(status_code=400, detail="Maximum 3 photos allowed")
    saved_paths = []
    for i, data_uri in enumerate(photos):
        path = save_base64_image(data_uri, "attendance", f"{ci.id}_{i+1}.png")
        if path:
            db.add(AttendancePhoto(id=get_next_id(db, AttendancePhoto), check_in_id=ci.id, path=path))
            saved_paths.append(path)
    db.commit()
    return checkin_to_dict(ci)

@app.get("/api/events/{event_id}/check-ins")
def get_event_checkins(event_id: int, session = Depends(require_admin)):
    db = session["db"]
    cis = db.query(CheckIn).filter(CheckIn.event_id == event_id).order_by(CheckIn.checked_in_at.desc()).all()
    return [checkin_to_dict(ci) for ci in cis]

# --- Points (admin) ---
@app.get("/api/point-transactions")
def get_point_transactions(user_id: int = None, session = Depends(require_admin)):
    db = session["db"]
    q = db.query(PointTransaction)
    if user_id:
        q = q.filter(PointTransaction.user_id == user_id)
    return [transaction_to_dict(tx) for tx in q.order_by(PointTransaction.created_at.desc()).all()]

@app.post("/api/point-transactions")
def create_point_transaction(body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    admin_user = session["user"]
    user_id = parse_int(body.get("userId"))
    amount = parse_int(body.get("amount")) or 0
    if not user_id:
        raise HTTPException(status_code=400, detail="userId required")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    tx = PointTransaction(
        id=get_next_id(db, PointTransaction),
        user_id=user_id,
        amount=amount,
        source=body.get("source", "manual"),
        description=body.get("description", ""),
        created_by=admin_user.id,
    )
    db.add(tx)
    user.points_balance = (user.points_balance or 0) + amount
    if user.points_balance < 0:
        user.points_balance = 0
    db.commit()
    return transaction_to_dict(tx)

# --- Rewards (admin CRUD + member list) ---
@app.get("/api/rewards")
def get_rewards(session = Depends(require_any)):
    db = session["db"]
    return [reward_to_dict(r) for r in db.query(Reward).order_by(Reward.sort_order, Reward.title).all()]

@app.post("/api/rewards")
def create_reward(body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    reward = Reward(
        id=get_next_id(db, Reward),
        title=body.get("title"),
        description=body.get("description"),
        points_required=parse_int(body.get("pointsRequired")) or 0,
        active=parse_bool(body.get("active")) if "active" in body else True,
        stock=parse_int(body.get("stock")),
        sort_order=parse_int(body.get("sortOrder")) or 0,
    )
    if body.get("image"):
        reward.image = save_base64_image(body["image"], "rewards", f"{reward.id}.png")
    db.add(reward)
    db.commit()
    db.refresh(reward)
    return reward_to_dict(reward)

@app.put("/api/rewards/{reward_id}")
def update_reward(reward_id: int, body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    reward = db.query(Reward).filter(Reward.id == reward_id).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Not found")
    for field, db_field in [("title", "title"), ("description", "description"), ("pointsRequired", "points_required"), ("active", "active"), ("stock", "stock"), ("sortOrder", "sort_order")]:
        if field in body:
            val = body[field]
            if db_field in ("points_required", "stock", "sort_order"):
                val = parse_int(val)
            elif db_field == "active":
                val = parse_bool(val)
            setattr(reward, db_field, val)
    if "image" in body:
        if body["image"]:
            delete_uploaded_image(reward.image)
            reward.image = save_base64_image(body["image"], "rewards", f"{reward.id}.png")
        else:
            delete_uploaded_image(reward.image)
            reward.image = None
    db.commit()
    db.refresh(reward)
    return reward_to_dict(reward)

@app.delete("/api/rewards/{reward_id}")
def delete_reward(reward_id: int, session = Depends(require_admin)):
    db = session["db"]
    reward = db.query(Reward).filter(Reward.id == reward_id).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Not found")
    delete_uploaded_image(reward.image)
    db.delete(reward)
    db.commit()
    return {"success": True}

# --- Redemptions ---
@app.post("/api/redemptions")
def request_redemption(body: dict = Body(default={}), session = Depends(require_member)):
    db = session["db"]
    user = session["user"]
    reward_id = parse_int(body.get("rewardId"))
    if not reward_id:
        raise HTTPException(status_code=400, detail="rewardId required")
    reward = db.query(Reward).filter(Reward.id == reward_id, Reward.active == True).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found or inactive")
    cost = reward.points_required or 0
    if (user.points_balance or 0) < cost:
        raise HTTPException(status_code=400, detail="Insufficient points")
    redemption = Redemption(
        id=get_next_id(db, Redemption),
        user_id=user.id,
        reward_id=reward_id,
        status="pending",
        points_cost=cost,
    )
    db.add(redemption)
    db.commit()
    db.refresh(redemption)
    return redemption_to_dict(redemption)

@app.get("/api/redemptions")
def get_redemptions(status: str = None, session = Depends(require_admin)):
    db = session["db"]
    q = db.query(Redemption)
    if status:
        q = q.filter(Redemption.status == status)
    return [redemption_to_dict(r) for r in q.order_by(Redemption.requested_at.desc()).all()]

@app.put("/api/redemptions/{redemption_id}")
def update_redemption(redemption_id: int, body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    admin_user = session["user"]
    redemption = db.query(Redemption).filter(Redemption.id == redemption_id).first()
    if not redemption:
        raise HTTPException(status_code=404, detail="Not found")
    new_status = body.get("status", redemption.status)
    if new_status != redemption.status:
        redemption.status = new_status
        redemption.processed_at = datetime.utcnow()
        redemption.processed_by = admin_user.id
        if new_status == "approved":
            user = db.query(User).filter(User.id == redemption.user_id).first()
            cost = redemption.points_cost or 0
            if (user.points_balance or 0) < cost:
                raise HTTPException(status_code=400, detail="Member no longer has enough points")
            tx = PointTransaction(
                id=get_next_id(db, PointTransaction),
                user_id=user.id,
                redemption_id=redemption.id,
                amount=-cost,
                source="redemption",
                description=f"Redeemed {redemption.reward.title if redemption.reward else 'reward'}",
                created_by=admin_user.id,
            )
            db.add(tx)
            user.points_balance = (user.points_balance or 0) - cost
            if redemption.reward and redemption.reward.stock is not None:
                redemption.reward.stock = max(0, redemption.reward.stock - 1)
    if "rejectionReason" in body:
        redemption.rejection_reason = body["rejectionReason"]
    db.commit()
    db.refresh(redemption)
    return redemption_to_dict(redemption)

@app.delete("/api/redemptions/{redemption_id}")
def delete_redemption(redemption_id: int, session = Depends(require_admin)):
    db = session["db"]
    redemption = db.query(Redemption).filter(Redemption.id == redemption_id).first()
    if not redemption:
        raise HTTPException(status_code=404, detail="Not found")
    db.query(PointTransaction).filter(PointTransaction.redemption_id == redemption_id).delete()
    db.delete(redemption)
    db.commit()
    return {"success": True}

# --- Leaderboard ---
@app.get("/api/leaderboard")
def leaderboard(period: str = "monthly", date: str = None, session = Depends(require_any)):
    db = session["db"]
    if date:
        anchor = datetime.fromisoformat(date)
    else:
        anchor = datetime.utcnow()
    if period == "monthly":
        start = anchor.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if start.month == 12:
            end = start.replace(year=start.year + 1, month=1)
        else:
            end = start.replace(month=start.month + 1)
    elif period == "quarterly":
        quarter = (anchor.month - 1) // 3
        start = anchor.replace(month=quarter * 3 + 1, day=1, hour=0, minute=0, second=0, microsecond=0)
        if start.month >= 10:
            end = start.replace(year=start.year + 1, month=1)
        else:
            end = start.replace(month=start.month + 3)
    elif period == "yearly":
        start = anchor.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end = start.replace(year=start.year + 1)
    else:
        raise HTTPException(status_code=400, detail="Invalid period")

    results = db.query(
        User.id, User.name, User.member_number, User.chapter_id,
        Chapter.name.label("chapter_name"),
        func.sum(PointTransaction.amount).label("points")
    ).join(PointTransaction, PointTransaction.user_id == User.id
    ).outerjoin(Chapter, Chapter.id == User.chapter_id
    ).filter(PointTransaction.created_at >= start, PointTransaction.created_at < end
    ).group_by(User.id).order_by(func.sum(PointTransaction.amount).desc()).all()

    return {
        "period": period,
        "start": start.isoformat(),
        "end": end.isoformat(),
        "entries": [
            {
                "rank": i + 1,
                "userId": r.id,
                "name": r.name,
                "memberNumber": r.member_number,
                "chapter": r.chapter_name,
                "points": r.points or 0,
            }
            for i, r in enumerate(results)
        ],
    }

# Need func import
from sqlalchemy import func

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
    item = Merchandise(id=get_next_id(db, Merchandise), title=body.get("title"), image=body.get("image"), description=body.get("description"), price=body.get("price"), points=parse_int(body.get("points")) or 0)
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
    if "points" in body:
        item.points = parse_int(body["points"]) or 0
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

# --- Banners ---
@app.get("/api/banners")
def get_banners(session = Depends(require_any)):
    return [banner_to_dict(b) for b in session["db"].query(Banner).order_by(Banner.order, Banner.id).all()]

@app.post("/api/banners")
def create_banner(body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    now = datetime.utcnow()
    item = Banner(
        id=get_next_id(db, Banner),
        title=body.get("title"),
        subtitle=body.get("subtitle"),
        image=body.get("image"),
        link=body.get("link"),
        start_date=parse_val("date", body.get("startDate")),
        end_date=parse_val("date", body.get("endDate")),
        duration_ms=parse_int(body.get("durationMs")) or 5000,
        active=parse_bool(body.get("active")) if "active" in body else True,
        partner_type=body.get("partnerType"),
        partner_id=parse_int(body.get("partnerId")),
        order=parse_int(body.get("order")) or 0,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return banner_to_dict(item)

@app.get("/api/banners/{item_id}")
def get_banner(item_id: int, session = Depends(require_any)):
    item = session["db"].query(Banner).filter(Banner.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return banner_to_dict(item)

@app.put("/api/banners/{item_id}")
def update_banner(item_id: int, body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    item = db.query(Banner).filter(Banner.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    simple_fields = ["title", "subtitle", "image", "link", "partnerType"]
    for field in simple_fields:
        if field in body:
            setattr(item, field, body[field])
    if "order" in body:
        item.order = parse_int(body["order"]) or 0
    if "durationMs" in body:
        item.duration_ms = parse_int(body["durationMs"]) or 5000
    if "active" in body:
        item.active = parse_bool(body["active"])
    if "startDate" in body:
        item.start_date = parse_val("date", body["startDate"])
    if "endDate" in body:
        item.end_date = parse_val("date", body["endDate"])
    if "partnerId" in body:
        item.partner_id = parse_int(body["partnerId"])
    db.commit()
    db.refresh(item)
    return banner_to_dict(item)

@app.delete("/api/banners/{item_id}")
def delete_banner(item_id: int, session = Depends(require_admin)):
    db = session["db"]
    item = db.query(Banner).filter(Banner.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"success": True}

# --- Public Phase 3 endpoints ---
@app.get("/api/public/banners")
def public_banners(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    q = db.query(Banner).filter(Banner.active == True)
    rows = q.order_by(Banner.order, Banner.id).all()
    result = []
    for b in rows:
        if b.start_date and now < b.start_date:
            continue
        if b.end_date and now > b.end_date:
            continue
        result.append(banner_to_dict(b))
    return result

@app.get("/api/public/official-partners")
def public_official_partners(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    q = db.query(OfficialPartner).filter(OfficialPartner.status == "active")
    rows = q.order_by(OfficialPartner.sort_order, OfficialPartner.id).all()
    result = []
    for p in rows:
        if p.active_period_end and p.active_period_end < now:
            continue
        result.append(official_partner_to_dict(p))
    return result

@app.get("/api/public/official-partners/{partner_id}")
def public_official_partner(partner_id: int, db: Session = Depends(get_db)):
    p = db.query(OfficialPartner).filter(OfficialPartner.id == partner_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    return official_partner_to_dict(p)

@app.get("/api/public/merchant-partners")
def public_merchant_partners(status: str = "active", db: Session = Depends(get_db)):
    q = db.query(MerchantPartner).filter(MerchantPartner.status == status)
    return [merchant_partner_to_dict(m) for m in q.order_by(MerchantPartner.name).all()]

@app.get("/api/public/merchant-partners/{partner_id}")
def public_merchant_partner(partner_id: int, db: Session = Depends(get_db)):
    m = db.query(MerchantPartner).filter(MerchantPartner.id == partner_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Not found")
    return merchant_partner_to_dict(m)

@app.get("/api/public/products")
def public_products(official: bool = None, merchant_id: int = None, db: Session = Depends(get_db)):
    q = db.query(Product).filter(Product.active == True)
    if official is not None:
        q = q.filter(Product.is_official_merchandise == official)
    if merchant_id:
        q = q.filter(Product.merchant_partner_id == merchant_id)
    return [product_to_dict(p) for p in q.order_by(Product.sort_order, Product.id).all()]

@app.get("/api/public/products/{product_id}")
def public_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    return product_to_dict(p)

# --- Admin: Official Partners ---
@app.get("/api/official-partners")
def get_official_partners(session = Depends(require_admin)):
    db = session["db"]
    return [official_partner_to_dict(p) for p in db.query(OfficialPartner).order_by(OfficialPartner.sort_order, OfficialPartner.id).all()]

@app.post("/api/official-partners")
def create_official_partner(body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    p = OfficialPartner(
        id=get_next_id(db, OfficialPartner),
        name=body.get("name"),
        description=body.get("description"),
        contact=body.get("contact"),
        link=body.get("link"),
        active_period_start=parse_val("date", body.get("activePeriodStart")),
        active_period_end=parse_val("date", body.get("activePeriodEnd")),
        status=body.get("status", "active"),
        sort_order=parse_int(body.get("sortOrder")) or 0,
    )
    if body.get("logo"):
        p.logo = save_base64_image(body["logo"], "official_partners", f"{p.id}.png")
    db.add(p)
    db.commit()
    db.refresh(p)
    return official_partner_to_dict(p)

@app.put("/api/official-partners/{partner_id}")
def update_official_partner(partner_id: int, body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    p = db.query(OfficialPartner).filter(OfficialPartner.id == partner_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    for field, db_field in [("name", "name"), ("description", "description"), ("contact", "contact"), ("link", "link"), ("status", "status")]:
        if field in body:
            setattr(p, db_field, body[field])
    if "activePeriodStart" in body:
        p.active_period_start = parse_val("date", body["activePeriodStart"])
    if "activePeriodEnd" in body:
        p.active_period_end = parse_val("date", body["activePeriodEnd"])
    if "sortOrder" in body:
        p.sort_order = parse_int(body["sortOrder"]) or 0
    if "logo" in body:
        if body["logo"]:
            delete_uploaded_image(p.logo)
            p.logo = save_base64_image(body["logo"], "official_partners", f"{p.id}.png")
        else:
            delete_uploaded_image(p.logo)
            p.logo = None
    db.commit()
    db.refresh(p)
    return official_partner_to_dict(p)

@app.delete("/api/official-partners/{partner_id}")
def delete_official_partner(partner_id: int, session = Depends(require_admin)):
    db = session["db"]
    p = db.query(OfficialPartner).filter(OfficialPartner.id == partner_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    delete_uploaded_image(p.logo)
    db.delete(p)
    db.commit()
    return {"success": True}

# --- Admin: Merchant Partners ---
@app.get("/api/merchant-partners")
def get_merchant_partners(session = Depends(require_admin)):
    db = session["db"]
    return [merchant_partner_to_dict(m) for m in db.query(MerchantPartner).order_by(MerchantPartner.name).all()]

@app.post("/api/merchant-partners")
def create_merchant_partner(body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    m = MerchantPartner(
        id=get_next_id(db, MerchantPartner),
        name=body.get("name"),
        description=body.get("description"),
        contact=body.get("contact"),
        status=body.get("status", "pending"),
        owner_user_id=parse_int(body.get("ownerUserId")),
    )
    if body.get("logo"):
        m.logo = save_base64_image(body["logo"], "merchant_partners", f"{m.id}.png")
    db.add(m)
    db.commit()
    db.refresh(m)
    return merchant_partner_to_dict(m)

@app.put("/api/merchant-partners/{partner_id}")
def update_merchant_partner(partner_id: int, body: dict = Body(default={}), session = Depends(require_admin)):
    db = session["db"]
    m = db.query(MerchantPartner).filter(MerchantPartner.id == partner_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Not found")
    for field, db_field in [("name", "name"), ("description", "description"), ("contact", "contact"), ("status", "status")]:
        if field in body:
            setattr(m, db_field, body[field])
    if "ownerUserId" in body:
        m.owner_user_id = parse_int(body["ownerUserId"])
    if "logo" in body:
        if body["logo"]:
            delete_uploaded_image(m.logo)
            m.logo = save_base64_image(body["logo"], "merchant_partners", f"{m.id}.png")
        else:
            delete_uploaded_image(m.logo)
            m.logo = None
    db.commit()
    db.refresh(m)
    return merchant_partner_to_dict(m)

@app.delete("/api/merchant-partners/{partner_id}")
def delete_merchant_partner(partner_id: int, session = Depends(require_admin)):
    db = session["db"]
    m = db.query(MerchantPartner).filter(MerchantPartner.id == partner_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Not found")
    delete_uploaded_image(m.logo)
    db.query(User).filter(User.merchant_partner_id == partner_id).update({"merchant_partner_id": None})
    db.delete(m)
    db.commit()
    return {"success": True}

# --- Admin / Merchant: Products ---
def _save_product_image(body: dict, product_id: int):
    if body.get("image"):
        return save_base64_image(body["image"], "products", f"{product_id}.png")
    return None

@app.get("/api/products")
def get_products(official: bool = None, merchant_id: int = None, session = Depends(require_merchant_or_admin)):
    db = session["db"]
    user = session["user"]
    q = db.query(Product)
    if user.role == "merchant":
        merchant = db.query(MerchantPartner).filter(MerchantPartner.owner_user_id == user.id).first()
        if not merchant:
            raise HTTPException(status_code=403, detail="No merchant assigned")
        q = q.filter(Product.merchant_partner_id == merchant.id)
    if official is not None:
        q = q.filter(Product.is_official_merchandise == official)
    if merchant_id:
        q = q.filter(Product.merchant_partner_id == merchant_id)
    return [product_to_dict(p) for p in q.order_by(Product.sort_order, Product.id).all()]

@app.post("/api/products")
def create_product(body: dict = Body(default={}), session = Depends(require_merchant_or_admin)):
    db = session["db"]
    user = session["user"]
    is_official = parse_bool(body.get("isOfficialMerchandise")) if "isOfficialMerchandise" in body else (user.role == "admin")
    merchant_id = parse_int(body.get("merchantPartnerId"))
    if user.role == "merchant":
        merchant = db.query(MerchantPartner).filter(MerchantPartner.owner_user_id == user.id).first()
        if not merchant:
            raise HTTPException(status_code=403, detail="No merchant assigned")
        if "merchantPartnerId" in body and parse_int(body.get("merchantPartnerId")) not in (None, merchant.id):
            raise HTTPException(status_code=403, detail="Cannot assign to another merchant")
        merchant_id = merchant.id
        is_official = False
    p = Product(
        id=get_next_id(db, Product),
        title=body.get("title"),
        description=body.get("description"),
        price=body.get("price") or "0",
        points=parse_int(body.get("points")) or 0,
        category=body.get("category"),
        merchant_partner_id=merchant_id,
        is_official_merchandise=is_official,
        active=parse_bool(body.get("active")) if "active" in body else True,
        allow_preorder=parse_bool(body.get("allowPreorder")) if "allowPreorder" in body else False,
        sort_order=parse_int(body.get("sortOrder")) or 0,
    )
    if body.get("image"):
        p.image = save_base64_image(body["image"], "products", f"{p.id}.png")
    db.add(p)
    db.flush()
    variants = body.get("variants") or []
    base_variant_id = get_next_id(db, ProductVariant)
    for i, v in enumerate(variants):
        db.add(ProductVariant(
            id=base_variant_id + i,
            product_id=p.id,
            label=v.get("label", ""),
            price_adjustment=parse_int(v.get("priceAdjustment")) or 0,
            stock=parse_int(v.get("stock")) or 0,
            allow_preorder=parse_bool(v.get("allowPreorder")) if "allowPreorder" in v else p.allow_preorder,
        ))
    db.commit()
    db.refresh(p)
    return product_to_dict(p)

@app.get("/api/products/{product_id}")
def get_product(product_id: int, session = Depends(require_merchant_or_admin)):
    db = session["db"]
    user = session["user"]
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    if user.role == "merchant":
        merchant = db.query(MerchantPartner).filter(MerchantPartner.owner_user_id == user.id).first()
        if not merchant or p.merchant_partner_id != merchant.id:
            raise HTTPException(status_code=403, detail="Access denied")
    return product_to_dict(p)

@app.put("/api/products/{product_id}")
def update_product(product_id: int, body: dict = Body(default={}), session = Depends(require_merchant_or_admin)):
    db = session["db"]
    user = session["user"]
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    if user.role == "merchant":
        merchant = db.query(MerchantPartner).filter(MerchantPartner.owner_user_id == user.id).first()
        if not merchant or p.merchant_partner_id != merchant.id:
            raise HTTPException(status_code=403, detail="Access denied")
    for field, db_field in [("title", "title"), ("description", "description"), ("category", "category"), ("price", "price")]:
        if field in body:
            setattr(p, db_field, body[field])
    if "points" in body:
        p.points = parse_int(body["points"]) or 0
    if "sortOrder" in body:
        p.sort_order = parse_int(body["sortOrder"]) or 0
    if "active" in body:
        p.active = parse_bool(body["active"])
    if "allowPreorder" in body:
        p.allow_preorder = parse_bool(body["allowPreorder"])
    if "merchantPartnerId" in body and user.role == "admin":
        p.merchant_partner_id = parse_int(body["merchantPartnerId"])
    if "isOfficialMerchandise" in body and user.role == "admin":
        p.is_official_merchandise = parse_bool(body["isOfficialMerchandise"])
    if "image" in body:
        if body["image"]:
            delete_uploaded_image(p.image)
            p.image = save_base64_image(body["image"], "products", f"{p.id}.png")
        else:
            delete_uploaded_image(p.image)
            p.image = None
    # Replace variants if supplied
    variants = body.get("variants")
    if variants is not None:
        db.query(ProductVariant).filter(ProductVariant.product_id == product_id).delete()
        base_variant_id = get_next_id(db, ProductVariant)
        for i, v in enumerate(variants):
            db.add(ProductVariant(
                id=base_variant_id + i,
                product_id=p.id,
                label=v.get("label", ""),
                price_adjustment=parse_int(v.get("priceAdjustment")) or 0,
                stock=parse_int(v.get("stock")) or 0,
                allow_preorder=parse_bool(v.get("allowPreorder")) if "allowPreorder" in v else p.allow_preorder,
            ))
    db.commit()
    db.refresh(p)
    return product_to_dict(p)

@app.delete("/api/products/{product_id}")
def delete_product(product_id: int, session = Depends(require_merchant_or_admin)):
    db = session["db"]
    user = session["user"]
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    if user.role == "merchant":
        merchant = db.query(MerchantPartner).filter(MerchantPartner.owner_user_id == user.id).first()
        if not merchant or p.merchant_partner_id != merchant.id:
            raise HTTPException(status_code=403, detail="Access denied")
    delete_uploaded_image(p.image)
    db.delete(p)
    db.commit()
    return {"success": True}

# --- Orders ---
def _create_order_number(db):
    import time
    return f"IZ-{int(time.time() * 1000) % 100000000}"

@app.post("/api/orders")
def create_order(body: dict = Body(default={}), session = Depends(require_member)):
    db = session["db"]
    user = session["user"]
    product_id = parse_int(body.get("productId"))
    variant_id = parse_int(body.get("variantId"))
    quantity = parse_int(body.get("quantity")) or 1
    points_used = parse_int(body.get("pointsUsed")) or 0
    if not product_id:
        raise HTTPException(status_code=400, detail="productId required")
    product = db.query(Product).filter(Product.id == product_id, Product.active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    variant = None
    if variant_id:
        variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id, ProductVariant.product_id == product_id).first()
        if not variant:
            raise HTTPException(status_code=404, detail="Variant not found")
    # Stock check
    available = variant.stock if variant else 0
    if available < quantity and not (variant.allow_preorder if variant else product.allow_preorder):
        raise HTTPException(status_code=400, detail="Insufficient stock")
    if points_used and (user.points_balance or 0) < points_used:
        raise HTTPException(status_code=400, detail="Insufficient points")
    unit_price = str(int(product.price or 0) + (variant.price_adjustment or 0))
    total = str(int(unit_price) * quantity)
    order = Order(
        id=get_next_id(db, Order),
        order_number=_create_order_number(db),
        user_id=user.id,
        product_id=product_id,
        variant_id=variant_id,
        merchant_partner_id=product.merchant_partner_id,
        quantity=quantity,
        unit_price=unit_price,
        total_price=total,
        points_used=points_used,
        points_earned=0,
        status="pending",
        recipient_name=body.get("recipientName", user.name),
        address=body.get("address", user.address),
        postal_code=body.get("postalCode", user.postal_code),
        phone=body.get("phone", user.phone),
    )
    db.add(order)
    db.flush()
    db.add(OrderStatusHistory(
        id=get_next_id(db, OrderStatusHistory),
        order_id=order.id,
        status="pending",
        note="Order placed",
    ))
    if points_used:
        db.add(PointTransaction(
            id=get_next_id(db, PointTransaction),
            user_id=user.id,
            amount=-points_used,
            source="redemption",
            description=f"Points used for order {order.order_number}",
        ))
        user.points_balance = (user.points_balance or 0) - points_used
    db.commit()
    db.refresh(order)
    return order_to_dict(order, include_history=True)

@app.get("/api/orders/{order_id}")
def get_order(order_id: int, session = Depends(require_member)):
    db = session["db"]
    user = session["user"]
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Not found")
    if order.user_id != user.id and user.role == "member":
        raise HTTPException(status_code=403, detail="Access denied")
    return order_to_dict(order, include_history=True)

@app.get("/api/me/orders")
def get_my_orders(session = Depends(require_member)):
    db = session["db"]
    user = session["user"]
    orders = db.query(Order).filter(Order.user_id == user.id).order_by(Order.created_at.desc()).all()
    return [order_to_dict(o) for o in orders]

@app.post("/api/orders/{order_id}/payment")
def upload_order_payment(order_id: int, body: dict = Body(default={}), session = Depends(require_member)):
    db = session["db"]
    user = session["user"]
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Not found")
    if order.status != "pending":
        raise HTTPException(status_code=400, detail="Order already processed")
    if body.get("paymentProofImage"):
        order.payment_proof_image = save_base64_image(body["paymentProofImage"], "payments", f"{order.id}.png")
    order.status = "paid"
    db.add(OrderStatusHistory(
        id=get_next_id(db, OrderStatusHistory),
        order_id=order.id,
        status="paid",
        note="Payment proof uploaded",
    ))
    # Award merchandise points on payment confirmation
    if order.product.points and order.product.points > 0:
        pts = order.product.points * order.quantity
        db.add(PointTransaction(
            id=get_next_id(db, PointTransaction),
            user_id=user.id,
            amount=pts,
            source="merchandise",
            description=f"Points from order {order.order_number}",
        ))
        user.points_balance = (user.points_balance or 0) + pts
        order.points_earned = pts
    db.commit()
    db.refresh(order)
    return order_to_dict(order, include_history=True)

@app.post("/api/orders/{order_id}/cancel")
def cancel_order(order_id: int, body: dict = Body(default={}), session = Depends(require_member)):
    db = session["db"]
    user = session["user"]
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Not found")
    if order.status not in ("pending", "paid"):
        raise HTTPException(status_code=400, detail="Cannot cancel order")
    order.status = "cancelled"
    db.add(OrderStatusHistory(
        id=get_next_id(db, OrderStatusHistory),
        order_id=order.id,
        status="cancelled",
        note=body.get("note", "Cancelled by member"),
    ))
    if order.points_used:
        db.add(PointTransaction(
            id=get_next_id(db, PointTransaction),
            user_id=user.id,
            amount=order.points_used,
            source="redemption",
            description=f"Refund points for cancelled order {order.order_number}",
        ))
        user.points_balance = (user.points_balance or 0) + order.points_used
    db.commit()
    return order_to_dict(order, include_history=True)

# --- Admin / Merchant: Order management ---
@app.get("/api/orders")
def list_orders(status: str = None, merchant_id: int = None, session = Depends(require_merchant_or_admin)):
    db = session["db"]
    user = session["user"]
    q = db.query(Order)
    if user.role == "merchant":
        merchant = db.query(MerchantPartner).filter(MerchantPartner.owner_user_id == user.id).first()
        if not merchant:
            raise HTTPException(status_code=403, detail="No merchant assigned")
        q = q.filter(Order.merchant_partner_id == merchant.id)
    elif merchant_id:
        q = q.filter(Order.merchant_partner_id == merchant_id)
    if status:
        q = q.filter(Order.status == status)
    return [order_to_dict(o) for o in q.order_by(Order.created_at.desc()).all()]

@app.put("/api/orders/{order_id}/status")
def update_order_status(order_id: int, body: dict = Body(default={}), session = Depends(require_merchant_or_admin)):
    db = session["db"]
    user = session["user"]
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Not found")
    if user.role == "merchant":
        merchant = db.query(MerchantPartner).filter(MerchantPartner.owner_user_id == user.id).first()
        if not merchant or order.merchant_partner_id != merchant.id:
            raise HTTPException(status_code=403, detail="Access denied")
    new_status = body.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="status required")
    order.status = new_status
    order.updated_at = datetime.utcnow()
    note = body.get("note", f"Status updated to {new_status}")
    db.add(OrderStatusHistory(
        id=get_next_id(db, OrderStatusHistory),
        order_id=order.id,
        status=new_status,
        note=note,
        created_by=user.id,
    ))
    # Decrement stock when moving to processing or beyond (if not already)
    if new_status in ("processing", "shipped", "completed") and order.variant_id:
        variant = db.query(ProductVariant).filter(ProductVariant.id == order.variant_id).first()
        if variant and variant.stock is not None and variant.stock > 0:
            variant.stock = max(0, variant.stock - order.quantity)
    db.commit()
    db.refresh(order)
    return order_to_dict(order, include_history=True)

# --- Merchant profile ---
@app.get("/api/merchant/me")
def merchant_me(session = Depends(require_merchant)):
    db = session["db"]
    user = session["user"]
    merchant = db.query(MerchantPartner).filter(MerchantPartner.owner_user_id == user.id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="No merchant assigned")
    return merchant_partner_to_dict(merchant)

# --- Chat placeholder endpoints ---
@app.get("/api/chat/rooms")
def list_chat_rooms(session = Depends(require_merchant_or_admin)):
    db = session["db"]
    user = session["user"]
    q = db.query(ChatRoom)
    if user.role == "merchant":
        merchant = db.query(MerchantPartner).filter(MerchantPartner.owner_user_id == user.id).first()
        if not merchant:
            raise HTTPException(status_code=403, detail="No merchant assigned")
        q = q.filter(ChatRoom.merchant_id == merchant.id)
    return [{"id": r.id, "orderId": r.order_id, "memberId": r.member_id, "merchantId": r.merchant_id, "createdAt": r.created_at.isoformat() if r.created_at else None} for r in q.order_by(ChatRoom.created_at.desc()).all()]

@app.post("/api/chat/rooms")
def create_chat_room(body: dict = Body(default={}), session = Depends(require_member)):
    db = session["db"]
    user = session["user"]
    merchant_id = parse_int(body.get("merchantId"))
    order_id = parse_int(body.get("orderId"))
    if not merchant_id:
        raise HTTPException(status_code=400, detail="merchantId required")
    merchant = db.query(MerchantPartner).filter(MerchantPartner.id == merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    existing = db.query(ChatRoom).filter(ChatRoom.member_id == user.id, ChatRoom.merchant_id == merchant_id)
    if order_id:
        existing = existing.filter(ChatRoom.order_id == order_id)
    existing = existing.first()
    if existing:
        return {"id": existing.id}
    room = ChatRoom(id=get_next_id(db, ChatRoom), order_id=order_id, member_id=user.id, merchant_id=merchant_id)
    db.add(room)
    db.commit()
    return {"id": room.id}

@app.get("/api/chat/rooms/{room_id}/messages")
def get_chat_messages(room_id: int, session = Depends(require_any)):
    db = session["db"]
    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Not found")
    user = session["user"]
    if user.role == "member" and room.member_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if user.role == "merchant":
        merchant = db.query(MerchantPartner).filter(MerchantPartner.owner_user_id == user.id).first()
        if not merchant or room.merchant_id != merchant.id:
            raise HTTPException(status_code=403, detail="Access denied")
    messages = db.query(ChatMessage).filter(ChatMessage.room_id == room_id).order_by(ChatMessage.created_at).all()
    return [{"id": m.id, "senderId": m.sender_id, "message": m.message, "createdAt": m.created_at.isoformat() if m.created_at else None} for m in messages]

@app.post("/api/chat/rooms/{room_id}/messages")
def post_chat_message(room_id: int, body: dict = Body(default={}), session = Depends(require_any)):
    db = session["db"]
    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Not found")
    user = session["user"]
    if user.role == "member" and room.member_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if user.role == "merchant":
        merchant = db.query(MerchantPartner).filter(MerchantPartner.owner_user_id == user.id).first()
        if not merchant or room.merchant_id != merchant.id:
            raise HTTPException(status_code=403, detail="Access denied")
    msg = body.get("message", "").strip()
    if not msg:
        raise HTTPException(status_code=400, detail="message required")
    cm = ChatMessage(id=get_next_id(db, ChatMessage), room_id=room_id, sender_id=user.id, message=msg)
    db.add(cm)
    db.commit()
    return {"id": cm.id}

# --- Static Files ---
app.mount("/", StaticFiles(directory=public_dir, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
