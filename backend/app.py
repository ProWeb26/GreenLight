import os

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from extensions import db
from services import (
    ErrorValidacion,
    ErrorNoAutorizado,
    ErrorNoEncontrado,
    ErrorConflicto,
)

from routes_auth import auth_bp
from routes_reportes import reportes_bp
from routes_admin import admin_bp
from routes_sync import sync_bp

load_dotenv()


def create_app(config_object=None):
    app = Flask(__name__)
    if config_object is None:
        config_object = os.getenv("FLASK_CONFIG", "config.Config")
    app.config.from_object(config_object)

    CORS(app, origins="*")
    db.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(reportes_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(sync_bp)

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