"""Punto de entrada para Gunicorn en Render.

Uso: gunicorn wsgi:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120
"""

from app import app  # noqa: F401