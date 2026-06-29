from __future__ import annotations

import logging
import time

from flask import Flask, Response, g, request
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest


REQUEST_COUNT = Counter(
    "luminaai_http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status"],
)
REQUEST_LATENCY = Histogram(
    "luminaai_http_request_seconds",
    "HTTP request latency",
    ["method", "endpoint"],
)


def configure_logging(app: Flask) -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    app.logger.setLevel(logging.INFO)


def register_monitoring(app: Flask) -> None:
    @app.before_request
    def start_timer() -> None:
        g.request_start = time.perf_counter()

    @app.after_request
    def record_metrics(response):
        endpoint = request.endpoint or "unknown"
        elapsed = time.perf_counter() - getattr(g, "request_start", time.perf_counter())
        REQUEST_COUNT.labels(request.method, endpoint, response.status_code).inc()
        REQUEST_LATENCY.labels(request.method, endpoint).observe(elapsed)
        app.logger.info(
            "request method=%s path=%s status=%s elapsed_ms=%.2f",
            request.method,
            request.path,
            response.status_code,
            elapsed * 1000,
        )
        return response

    @app.route("/healthz")
    def healthz():
        return {"status": "ok", "service": app.config["APP_NAME"]}

    @app.route("/metrics")
    def metrics():
        return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)
