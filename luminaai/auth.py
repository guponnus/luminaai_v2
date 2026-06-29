from __future__ import annotations

from flask import Blueprint, flash, redirect, render_template, request, url_for
from flask_login import current_user, login_required, login_user, logout_user

from .extensions import db
from .models import User, utcnow
from .security import audit


auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard.index"))

    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        user = User.query.filter_by(email=email).one_or_none()
        if user and user.is_active and user.check_password(password):
            login_user(user)
            user.last_login_at = utcnow()
            db.session.commit()
            audit("login", "user", str(user.id))
            return redirect(request.args.get("next") or url_for("dashboard.index"))
        flash("Invalid email or password.", "danger")

    return render_template("login.html")


@auth_bp.route("/logout")
@login_required
def logout():
    audit("logout", "user", str(current_user.id))
    logout_user()
    flash("You have been signed out.", "info")
    return redirect(url_for("auth.login"))
