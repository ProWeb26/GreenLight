import os

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_swagger_ui import get_swaggerui_blueprint
from dotenv import load_dotenv

from extensions import db
from services import (
    ErrorValidacion,
    ErrorNoAutorizado,
    ErrorProhibido,
    ErrorNoEncontrado,
    ErrorConflicto,
)

from routes_auth import auth_bp
from routes_reportes import reportes_bp
from routes_admin import admin_bp
from routes_sync import sync_bp
from rate_limit import limiter

RUTA_BACKEND = os.path.dirname(os.path.abspath(__file__))

load_dotenv()


def _origenes_cors(valor):
    """Acepta '*' o una lista de orígenes separados por coma."""
    if valor == "*":
        return "*"
    return [o.strip() for o in valor.split(",") if o.strip()]


def create_app(config_object=None):
    app = Flask(__name__)
    if config_object is None:
        config_object = os.getenv("FLASK_CONFIG", "config.Config")
    app.config.from_object(config_object)

    CORS(app, origins=_origenes_cors(app.config.get("CORS_ORIGINS", "*")))
    db.init_app(app)

    limiter.init_app(app)
    if app.config.get("TESTING"):
        limiter.enabled = False

    app.register_blueprint(auth_bp)
    app.register_blueprint(reportes_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(sync_bp)

    swagger_ui_bp = get_swaggerui_blueprint(
        "/api/docs",
        "/api/openapi.yaml",
        config={"app_name": "GreenLight API"},
    )
    app.register_blueprint(swagger_ui_bp, url_prefix="/api/docs")

    @app.get("/api/openapi.yaml")
    def spec_openapi():
        return send_from_directory(
            RUTA_BACKEND, "openapi.yaml", mimetype="application/yaml"
        )

    @app.get("/api/salud")
    def salud():
        from sqlalchemy import text

        try:
            db.session.execute(text("SELECT 1"))
            database = "connected"
        except Exception:
            database = "error"
        return (
            jsonify(
                {
                    "status": "ok" if database == "connected" else "degraded",
                    "database": database,
                    "project": "GreenLight",
                }
            ),
            200 if database == "connected" else 503,
        )

    @app.get("/api/health")
    def health():
        from sqlalchemy import text

        try:
            db.session.execute(text("SELECT 1"))
            database = "connected"
        except Exception:
            database = "error"
        return jsonify({"status": "ok", "database": database, "project": "GreenLight"}), 200

    @app.errorhandler(ErrorValidacion)
    def _validacion(e):
        return jsonify({"error": str(e)}), e.status

    @app.errorhandler(ErrorNoAutorizado)
    def _no_autorizado(e):
        return jsonify({"error": str(e)}), e.status

    @app.errorhandler(ErrorProhibido)
    def _prohibido(e):
        return jsonify({"error": str(e)}), e.status

    @app.errorhandler(ErrorNoEncontrado)
    def _no_encontrado(e):
        return jsonify({"error": str(e)}), e.status

    @app.errorhandler(ErrorConflicto)
    def _conflicto(e):
        return jsonify({"error": str(e)}), e.status

    @app.errorhandler(Exception)
    def _inesperado(e):
        app.logger.exception(e)
        return jsonify({"error": "Error interno del servidor"}), 500

    with app.app_context():
        db.create_all()

    return app


app = create_app()


if __name__ == "__main__":
    puerto = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=puerto, debug=True)