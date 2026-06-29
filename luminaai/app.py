from __future__ import annotations

from pathlib import Path

import click
from dotenv import load_dotenv
from flask import Flask
from jinja2 import ChoiceLoader, FileSystemLoader

from .auth import auth_bp
from .config import Config
from .data_import import import_workbook
from .extensions import db, login_manager
from .models import User
from .monitoring import configure_logging, register_monitoring
from .routes import admin_bp, dashboard_bp


def create_app(config_object: type[Config] = Config) -> Flask:
    load_dotenv()
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config_object)

    Path(app.instance_path).mkdir(parents=True, exist_ok=True)
    app.jinja_loader = ChoiceLoader(
        [
            app.jinja_loader,
            FileSystemLoader(str(Path(__file__).resolve().parent.parent / "template")),
        ]
    )
    configure_logging(app)
    db.init_app(app)
    login_manager.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(admin_bp)
    register_monitoring(app)
    register_cli(app)

    return app


def register_cli(app: Flask) -> None:
    @app.cli.command("init-db")
    def init_db_command() -> None:
        """Create database tables and the default administrator."""
        db.create_all()
        ensure_admin(app)
        click.echo("Initialized Luminaai database.")

    @app.cli.command("import-data")
    def import_data_command() -> None:
        """Import workbook data, or generate sample data if the workbook is missing."""
        db.create_all()
        ensure_admin(app)
        stats = import_workbook(app.config["EXCEL_SOURCE_PATH"])
        click.echo(f"Imported {sum(stats.values())} records across {len(stats)} datasets.")

    @app.cli.command("create-user")
    @click.option("--email", prompt=True)
    @click.option("--name", prompt=True)
    @click.option("--role", default="analyst", show_default=True)
    @click.option("--password", prompt=True, hide_input=True, confirmation_prompt=True)
    def create_user_command(email: str, name: str, role: str, password: str) -> None:
        """Create an application user."""
        if User.query.filter_by(email=email.lower()).first():
            raise click.ClickException("User already exists.")
        user = User(email=email.lower(), name=name, role=role)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        click.echo(f"Created user {email}.")


def ensure_admin(app: Flask) -> User:
    email = app.config["ADMIN_EMAIL"].lower()
    user = User.query.filter_by(email=email).one_or_none()
    if user is None:
        user = User(email=email, name=app.config["ADMIN_NAME"], role="admin")
        user.set_password(app.config["ADMIN_PASSWORD"])
        db.session.add(user)
        db.session.commit()
    return user
