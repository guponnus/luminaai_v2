# Luminaai

Luminaai is a Python web application built around the supplied Utility Intelligence Platform dashboard and Excel sample data. It uses Flask, SQLite, role-based access control, audit logging, request logging, health checks, and Prometheus-compatible metrics.

## Template Routes

- `/`: `Luminaai_Platform_MVP_v1.html` landing page.
- `/failure-prediction`: opens F02 Failure & Leak Prediction inside the merged platform.
- `/field-safety`: opens F03 Field Safety inside the merged platform.
- `/loss-reduction`: opens F04 Loss Reduction inside the merged platform.
- `/forecasting`: opens F05 Demand Forecasting & Grid Optimisation inside the merged platform.
- `/billing-guard`: opens F06 Billing Guard & Revenue Protection inside the merged platform.

Only the login screen is custom Flask HTML. The standalone F02-F06 MVP pages have been merged into `template/Luminaai_Platform_MVP_v1.html` under their respective platform tabs.

## Setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python -m flask --app run import-data
python -m flask --app run run --debug
```

Open `http://127.0.0.1:5000`.

Default administrator:

- Email: `admin@luminaai.local`
- Password: `Admin@12345`

Change `SECRET_KEY` and `ADMIN_PASSWORD` in production.

## Operations

- `flask --app run init-db`: creates database tables and default admin.
- `flask --app run import-data`: imports the Excel workbook into SQLite, or generates synthetic panel data if the workbook is missing.
- `flask --app run create-user`: creates an additional user.
- `/api/platform/summary`: Excel/SQLite dataset and KPI summary.
- `/api/datasets`: dataset samples from SQLite.
- `/api/datasets/<id>`: records for one dataset.
- `/healthz`: service health check.
- `/metrics`: Prometheus-compatible request metrics.

## Roles

- `admin`: full access, user management, data reload.
- `manager`: dashboard access and data reload.
- `analyst`, `operator`, `viewer`: dashboard and panel access.

## Notes

SQLite is used as requested and is suitable for local and small-team deployments. For high-concurrency enterprise deployment, keep the model layer and switch `DATABASE_URL` to PostgreSQL or another managed relational database.
