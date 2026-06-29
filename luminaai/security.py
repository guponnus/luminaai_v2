from __future__ import annotations

from functools import wraps
from typing import Callable, TypeVar

from flask import abort, flash, redirect, request, url_for
from flask_login import current_user

from .extensions import db
from .models import AuditLog

F = TypeVar("F", bound=Callable)


ROLES = ("admin", "manager", "analyst", "operator", "viewer")


def roles_required(*roles: str) -> Callable[[F], F]:
    def decorator(view: F) -> F:
        @wraps(view)
        def wrapped(*args, **kwargs):
            if not current_user.is_authenticated:
                return redirect(url_for("auth.login", next=request.full_path))
            if current_user.role != "admin" and current_user.role not in roles:
                abort(403)
            return view(*args, **kwargs)

        return wrapped  # type: ignore[return-value]

    return decorator


def audit(action: str, entity: str, entity_id: str | None = None, detail: dict | None = None) -> None:
    user_id = current_user.id if current_user.is_authenticated else None
    db.session.add(
        AuditLog(
            user_id=user_id,
            action=action,
            entity=entity,
            entity_id=entity_id,
            detail=detail or {},
            ip_address=request.headers.get("X-Forwarded-For", request.remote_addr),
        )
    )
    db.session.commit()


def flash_form_error(message: str = "Please correct the highlighted fields.") -> None:
    flash(message, "danger")
