from __future__ import annotations

from io import BytesIO
from statistics import mean
from typing import Any

from flask import Blueprint, Response, abort, flash, jsonify, redirect, render_template, request, url_for
from flask_login import current_user, login_required
from openpyxl import Workbook

from .data_import import import_workbook
from .extensions import db
from .models import AuditLog, Dataset, PanelRecord, User
from .security import ROLES, audit, roles_required


dashboard_bp = Blueprint("dashboard", __name__)
admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


TEMPLATE_PAGES = {
    "platform": {
        "template": "Luminaai_Platform_MVP_v1.html",
        "title": "Utility Intelligence Platform",
        "path": "/",
        "pillar": "01",
    },
    "failure-prediction": {
        "template": "Luminaai_Platform_MVP_v1.html",
        "title": "F02 Failure & Leak Prediction",
        "path": "/failure-prediction",
        "pillar": "02",
    },
    "field-safety": {
        "template": "Luminaai_Platform_MVP_v1.html",
        "title": "F03 Field Safety",
        "path": "/field-safety",
        "pillar": "03",
    },
    "loss-reduction": {
        "template": "Luminaai_Platform_MVP_v1.html",
        "title": "F04 Loss Reduction",
        "path": "/loss-reduction",
        "pillar": "04",
    },
    "forecasting": {
        "template": "Luminaai_Platform_MVP_v1.html",
        "title": "F05 Forecasting",
        "path": "/forecasting",
        "pillar": "05",
    },
    "billing-guard": {
        "template": "Luminaai_Platform_MVP_v1.html",
        "title": "F06 Billing Guard",
        "path": "/billing-guard",
        "pillar": "06",
    },
}


def _as_float(value) -> float | None:
    try:
        return float(str(value).replace(",", "").strip())
    except (TypeError, ValueError):
        return None


def _records(dataset: Dataset, limit: int | None = None) -> list[PanelRecord]:
    query = PanelRecord.query.filter_by(dataset_id=dataset.id).order_by(PanelRecord.row_number)
    if limit:
        query = query.limit(limit)
    return query.all()


def _dataset_summary(dataset: Dataset) -> dict[str, Any]:
    rows = _records(dataset, 1000)
    numeric_health = []
    critical = 0
    total_cost = 0.0
    statuses: dict[str, int] = {}

    for row in rows:
        data = row.data
        for key in ("Health_Score", "Fleet Average Health Score", "Derived_From_1000_Records"):
            value = _as_float(data.get(key))
            if value is not None and 0 <= value <= 100:
                numeric_health.append(value)
                break
        status = str(data.get("Health_Status") or data.get("Status") or data.get("Risk_Level_of_Gap") or "Unknown")
        statuses[status] = statuses.get(status, 0) + 1
        if any(token in status.lower() for token in ("critical", "overdue", "p1")):
            critical += 1
        for key in ("Replacement_Cost_AED", "Estimated_Cost_AED", "Investment_AED", "Total_Cost_AED"):
            value = _as_float(data.get(key))
            if value is not None:
                total_cost += value
                break

    return {
        "dataset": dataset,
        "average_health": round(mean(numeric_health), 1) if numeric_health else None,
        "critical": critical,
        "total_cost": round(total_cost),
        "statuses": statuses,
    }


def _dataset_payload(dataset: Dataset, limit: int = 25) -> dict[str, Any]:
    records = _records(dataset, limit)
    return {
        "id": dataset.id,
        "sheetName": dataset.sheet_name,
        "title": dataset.title,
        "panelCode": dataset.panel_code,
        "recordCount": dataset.record_count,
        "records": [record.data for record in records],
    }


def _status_key(status: str) -> str:
    status_lower = status.lower()
    if "alert" in status_lower or "below" in status_lower:
        return "alert"
    if "monitor" in status_lower:
        return "monitor"
    if "target" in status_lower or "within" in status_lower:
        return "ok"
    return "neutral"


def _kpi_value_percent(value) -> int:
    number = _as_float(value)
    if number is None:
        return 65
    if 0 <= number <= 1:
        return round(number * 100)
    return max(4, min(round(number), 100))


def _kpi_dashboard() -> dict:
    dataset = Dataset.query.filter_by(panel_code="KPI").one_or_none()
    if dataset is None:
        return {"dataset": None, "rows": [], "panels": [], "status_counts": {}}

    records = _records(dataset)
    rows = []
    panels: list[str] = []
    status_counts: dict[str, int] = {}

    for record in records:
        data = record.data
        panel = str(data.get("Panel") or "General")
        status = str(data.get("Status") or "Unknown")
        status_key = _status_key(status)
        if panel not in panels:
            panels.append(panel)
        status_counts[status_key] = status_counts.get(status_key, 0) + 1
        rows.append(
            {
                "panel": panel,
                "name": data.get("KPI_Name") or "Unnamed KPI",
                "formula": data.get("KPI_Formula") or "n/a",
                "value": data.get("Derived_From_1000_Records") or "n/a",
                "unit": data.get("Unit") or "",
                "target": data.get("Target") or "n/a",
                "variance": data.get("Variance") or "n/a",
                "status": status,
                "status_key": status_key,
                "percent": _kpi_value_percent(data.get("Derived_From_1000_Records")),
            }
        )

    return {"dataset": dataset, "rows": rows, "panels": panels, "status_counts": status_counts}


def _platform_summary() -> dict[str, Any]:
    datasets = Dataset.query.order_by(Dataset.panel_code, Dataset.sheet_name).all()
    summaries = [_dataset_summary(dataset) for dataset in datasets]
    kpi_dashboard = _kpi_dashboard()
    return {
        "app": "Luminaai",
        "datasetCount": len(datasets),
        "recordCount": sum(dataset.record_count for dataset in datasets),
        "datasets": [
            {
                "id": summary["dataset"].id,
                "sheetName": summary["dataset"].sheet_name,
                "title": summary["dataset"].title,
                "panelCode": summary["dataset"].panel_code,
                "recordCount": summary["dataset"].record_count,
                "averageHealth": summary["average_health"],
                "critical": summary["critical"],
                "totalCost": summary["total_cost"],
            }
            for summary in summaries
        ],
        "kpis": kpi_dashboard["rows"],
    }


def _inject_app_shell(html: str, active_slug: str) -> str:
    active_pillar = TEMPLATE_PAGES.get(active_slug, TEMPLATE_PAGES["platform"])["pillar"]
    shell = f"""
<script>
window.LUMINAAI_DATA = {{
  summaryUrl: "/api/platform/summary",
  datasetsUrl: "/api/datasets",
  activeTemplate: "{active_slug}",
  activePillar: "{active_pillar}"
}};
setTimeout(function(){{
  if (window.LUMINAAI_DATA.activePillar && typeof showPillar === "function") {{
    showPillar(window.LUMINAAI_DATA.activePillar);
  }}
}}, 0);
</script>
<script src="/static/js/template-data.js" defer></script>
"""
    return html.replace("</body>", f"{shell}</body>")


def _render_template_page(slug: str) -> Response:
    page = TEMPLATE_PAGES.get(slug)
    if page is None:
        abort(404)
    html = render_template(page["template"])
    return Response(_inject_app_shell(html, slug), mimetype="text/html")


@dashboard_bp.route("/")
@login_required
def index():
    return _render_template_page("platform")


@dashboard_bp.route("/<slug>")
@login_required
def template_page(slug: str):
    if slug.startswith("api/") or slug in {"login", "logout"}:
        abort(404)
    return _render_template_page(slug)


@dashboard_bp.route("/data/reload", methods=["POST"])
@login_required
@roles_required("admin", "manager")
def reload_data():
    stats = import_workbook(current_app_config("EXCEL_SOURCE_PATH"))
    audit("reload", "dataset", detail=stats)
    flash(f"Data reload complete: {sum(stats.values())} records imported.", "success")
    return redirect(url_for("dashboard.index"))


def current_app_config(key: str):
    from flask import current_app

    return current_app.config[key]


@dashboard_bp.route("/api/platform/summary")
@login_required
def api_platform_summary():
    return jsonify(_platform_summary())


@dashboard_bp.route("/api/datasets")
@login_required
def api_datasets():
    return jsonify([_dataset_payload(dataset, limit=5) for dataset in Dataset.query.order_by(Dataset.panel_code).all()])


@dashboard_bp.route("/api/datasets/<int:dataset_id>")
@login_required
def api_dataset(dataset_id: int):
    dataset = db.session.get(Dataset, dataset_id)
    if dataset is None:
        abort(404)
    limit = min(max(int(request.args.get("limit", 100)), 1), 1000)
    return jsonify(_dataset_payload(dataset, limit=limit))


@dashboard_bp.route("/api/datasets/panel/<panel_code>")
@login_required
def api_dataset_by_panel(panel_code: str):
    dataset = Dataset.query.filter_by(panel_code=panel_code.upper()).first()
    if dataset is None:
        abort(404)
    limit = min(max(int(request.args.get("limit", 100)), 1), 1000)
    return jsonify(_dataset_payload(dataset, limit=limit))


@dashboard_bp.route("/api/export/xlsx", methods=["POST"])
@login_required
def api_export_xlsx():
    payload = request.get_json(silent=True) or {}
    rows = payload.get("rows") or []
    filename = str(payload.get("filename") or "luminaai-panel-data.xlsx")
    if not filename.lower().endswith(".xlsx"):
        filename = f"{filename}.xlsx"

    wb = Workbook()
    ws = wb.active
    ws.title = "Panel Data"

    if rows and isinstance(rows[0], dict):
        headers = list(rows[0].keys())
        ws.append(headers)
        for row in rows:
            ws.append([row.get(header, "") for header in headers])
    else:
        ws.append(["Message"])
        ws.append(["No panel data was available for export."])

    stream = BytesIO()
    wb.save(stream)
    stream.seek(0)
    return Response(
        stream.getvalue(),
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@admin_bp.route("/users")
@login_required
@roles_required("admin")
def users():
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify(
        [
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "active": user.is_active,
                "createdAt": user.created_at.isoformat(),
                "lastLoginAt": user.last_login_at.isoformat() if user.last_login_at else None,
            }
            for user in users
        ]
    )


def _request_data() -> dict[str, Any]:
    return request.get_json(silent=True) or request.form.to_dict()


@admin_bp.route("/users/new", methods=["GET", "POST"])
@login_required
@roles_required("admin")
def user_new():
    if request.method == "GET":
        return jsonify({"roles": ROLES, "required": ["email", "name", "password"]})

    data = _request_data()
    email = str(data.get("email", "")).strip().lower()
    name = str(data.get("name", "")).strip()
    role = str(data.get("role", "viewer"))
    password = str(data.get("password", ""))
    if not email or not name or role not in ROLES or len(password) < 8:
        return jsonify({"error": "Provide a valid name, email, role, and password with at least 8 characters."}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "A user with this email already exists."}), 409

    user = User(email=email, name=name, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    audit("create", "user", str(user.id), {"email": email, "role": role})
    return jsonify({"id": user.id, "email": user.email, "name": user.name, "role": user.role}), 201


@admin_bp.route("/users/<int:user_id>/edit", methods=["GET", "POST"])
@login_required
@roles_required("admin")
def user_edit(user_id: int):
    user = db.session.get(User, user_id)
    if user is None:
        abort(404)

    if request.method == "GET":
        return jsonify(
            {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "active": user.is_active,
                "roles": ROLES,
            }
        )

    data = _request_data()
    user.name = str(data.get("name", "")).strip() or user.name
    user.role = str(data.get("role", user.role)) if data.get("role") in ROLES else user.role
    user.is_active_flag = str(data.get("is_active", data.get("active", user.is_active))).lower() in {"1", "true", "on", "yes"}
    password = str(data.get("password", ""))
    if password:
        if len(password) < 8:
            return jsonify({"error": "Password must be at least 8 characters."}), 400
        user.set_password(password)
    db.session.commit()
    audit("update", "user", str(user.id), {"role": user.role, "active": user.is_active})
    return jsonify({"id": user.id, "email": user.email, "name": user.name, "role": user.role, "active": user.is_active})


@admin_bp.route("/users/legacy-new", methods=["GET", "POST"])
@login_required
@roles_required("admin")
def user_new_legacy():
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        name = request.form.get("name", "").strip()
        role = request.form.get("role", "viewer")
        password = request.form.get("password", "")
        if not email or not name or role not in ROLES or len(password) < 8:
            flash("Provide a valid name, email, role, and password with at least 8 characters.", "danger")
        elif User.query.filter_by(email=email).first():
            flash("A user with this email already exists.", "danger")
        else:
            user = User(email=email, name=name, role=role)
            user.set_password(password)
            db.session.add(user)
            db.session.commit()
            audit("create", "user", str(user.id), {"email": email, "role": role})
            flash("User created.", "success")
            return redirect(url_for("admin.users"))
    abort(410)


@admin_bp.route("/users/<int:user_id>/legacy-edit", methods=["GET", "POST"])
@login_required
@roles_required("admin")
def user_edit_legacy(user_id: int):
    user = db.session.get(User, user_id)
    if user is None:
        abort(404)

    if request.method == "POST":
        user.name = request.form.get("name", "").strip() or user.name
        user.role = request.form.get("role", user.role) if request.form.get("role") in ROLES else user.role
        user.is_active_flag = request.form.get("is_active") == "on"
        password = request.form.get("password", "")
        if password:
            if len(password) < 8:
                flash("Password must be at least 8 characters.", "danger")
                abort(400)
            user.set_password(password)
        db.session.commit()
        audit("update", "user", str(user.id), {"role": user.role, "active": user.is_active})
        flash("User updated.", "success")
        return redirect(url_for("admin.users"))

    abort(410)
