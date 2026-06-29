from __future__ import annotations

from datetime import datetime, timezone

from flask_login import UserMixin
from werkzeug.security import check_password_hash, generate_password_hash

from .extensions import db, login_manager


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False, default="analyst", index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    is_active_flag = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)
    last_login_at = db.Column(db.DateTime(timezone=True))

    @property
    def is_active(self) -> bool:
        return bool(self.is_active_flag)

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def can(self, *roles: str) -> bool:
        return self.role in roles or self.role == "admin"


class Dataset(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sheet_name = db.Column(db.String(255), unique=True, nullable=False, index=True)
    title = db.Column(db.String(500), nullable=False)
    panel_code = db.Column(db.String(20), nullable=False, index=True)
    record_count = db.Column(db.Integer, default=0, nullable=False)
    imported_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

    records = db.relationship("PanelRecord", back_populates="dataset", cascade="all, delete-orphan")


class PanelRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    dataset_id = db.Column(db.Integer, db.ForeignKey("dataset.id"), nullable=False, index=True)
    row_number = db.Column(db.Integer, nullable=False)
    data = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

    dataset = db.relationship("Dataset", back_populates="records")


class AuditLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True, index=True)
    action = db.Column(db.String(120), nullable=False, index=True)
    entity = db.Column(db.String(120), nullable=False)
    entity_id = db.Column(db.String(120))
    detail = db.Column(db.JSON)
    ip_address = db.Column(db.String(100))
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False, index=True)

    user = db.relationship("User")


@login_manager.user_loader
def load_user(user_id: str) -> User | None:
    return db.session.get(User, int(user_id))
