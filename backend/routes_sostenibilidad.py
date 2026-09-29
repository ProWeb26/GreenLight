import os
import time
from datetime import datetime, timezone

from flask import Blueprint, current_app, jsonify
from sqlalchemy import text

from extensions import db
from services import stats_globales

sostenibilidad_bp = Blueprint("sostenibilidad", __name__, url_prefix="/api")

INICIO = time.time()

PRESUPUESTO = {
    "peso_pagina_kb": 500,
    "lighthouse_minimo": 90,
    "wcag": "2.1 AA",
    "costo_infraestructura_bs": 0,
}

LICENCIAS = [
    {"componente": "React 19", "licencia": "MIT"},
    {"componente": "Vite 8", "licencia": "MIT"},
    {"componente": "Tailwind CSS 4", "licencia": "MIT"},
    {"componente": "Leaflet 1.9", "licencia": "BSD-2-Clause"},
    {"componente": "React Router 7", "licencia": "MIT"},
    {"componente": "Flask", "licencia": "BSD-3-Clause"},
    {"componente": "SQLAlchemy", "licencia": "MIT"},
    {"componente": "Flask-JWT-Extended", "licencia": "MIT"},
    {"componente": "PostgreSQL (Supabase)", "licencia": "PostgreSQL License"},
    {"componente": "gunicorn", "licencia": "MIT"},
]


def _latencia_base_datos():
    inicio = time.perf_counter()
    try:
        db.session.execute(text("SELECT 1"))
        return {
            "estado": "connected",
            "latencia_ms": round((time.perf_counter() - inicio) * 1000, 2),
        }
    except Exception:
        db.session.rollback()
        return {"estado": "error", "latencia_ms": None}


def _uptime():
    segundos = int(time.time() - INICIO)
    horas, resto = divmod(segundos, 3600)
    minutos, segs = divmod(resto, 60)
    return {"segundos": segundos, "texto": f"{horas}h {minutos}m {segs}s"}


@sostenibilidad_bp.get("/sostenibilidad")
def sostenibilidad():
    """Tablero de métricas de sostenibilidad: presupuesto vs. medido."""
    base_datos = _latencia_base_datos()
    return (
        jsonify(
            {
                "generado": datetime.now(timezone.utc).isoformat(),
                "proyecto": "GreenLight",
                "version": current_app.config.get("APP_VERSION", "3.0.3"),
                "entorno": os.getenv("ENTORNO", "render" if os.getenv("RENDER") else "local"),
                "uptime": _uptime(),
                "base_datos": base_datos,
                "presupuesto": PRESUPUESTO,
                "impacto": {
                    "costo_infraestructura_bs": 0,
                    "licencias_propietarias": 0,
                    "licencias": LICENCIAS,
                },
                "operacion": stats_globales(),
                "seguridad": {
                    "jwt_expiracion_minutos": current_app.config.get("JWT_EXPIRATION_MINUTES"),
                    "umbral_confirmacion": current_app.config.get("CONFIRMATION_THRESHOLD"),
                    "rate_limit_auth": current_app.config.get("RATE_LIMIT_AUTH"),
                    "cors_origins": current_app.config.get("CORS_ORIGINS"),
                    "rls_supabase": "9 politicas en backend/sql/01_esquema_y_rls.sql",
                },
            }
        ),
        200,
    )
