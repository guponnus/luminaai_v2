from __future__ import annotations

import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent


class Config:
    APP_NAME = "Luminaai"
    SECRET_KEY = os.environ.get("SECRET_KEY", "change-me-for-production")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        f"sqlite:///{BASE_DIR / 'instance' / 'luminaai.sqlite3'}",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    EXCEL_SOURCE_PATH = os.environ.get(
        "EXCEL_SOURCE_PATH",
        str(BASE_DIR / "Luminaai_ASSET H Panel_Sample_Data_1000.xlsx"),
    )
    PDF_SOURCE_PATH = os.environ.get("PDF_SOURCE_PATH", str(BASE_DIR / "Asset .pdf"))
    ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@luminaai.local")
    ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Admin@12345")
    ADMIN_NAME = os.environ.get("ADMIN_NAME", "Luminaai Administrator")
    SAMPLE_RECORDS_PER_PANEL = int(os.environ.get("SAMPLE_RECORDS_PER_PANEL", "250"))
    JSON_SORT_KEYS = False
