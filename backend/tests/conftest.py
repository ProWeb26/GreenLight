import pytest
from werkzeug.security import generate_password_hash

from app import create_app
from extensions import db
from models import Comunidad, Confirmacion, Reporte, TipoIncidente, Usuario

from config import TestConfig


def _base_props():
    return {
        "SECRET_KEY": "test-key",
        "SQLALCHEMY_DATABASE_URI": "sqlite://",
        "TESTING": True,
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
        "SQLALCHEMY_ENGINE_OPTIONS": {},
        "JWT_EXPIRATION_MINUTES": 60,
        "JWT_ALGORITHM": "HS256",
        "CONFIRMATION_THRESHOLD": 3,
    }


@pytest.fixture()
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        tipos = [
            TipoIncidente(nombre="Quema Agrícola", icono="🔥", color_etiqueta="#f97316"),
            TipoIncidente(nombre="Incendio Forestal", icono="🌲", color_etiqueta="#ef4444"),
        ]
        db.session.add_all(tipos)
        comunidad = Comunidad(nombre="Comunidad Test", zona_ciudad="Zona 1", latitud=-17.7, longitud=-63.1)
        db.session.add(comunidad)
        db.session.flush()

        coordenador = Usuario(
            nombre="Coordinador",
            correo="coord@test.com",
            contraseña_hash=generate_password_hash("Coordi123!"),
            rol="coordinador",
            comunidad_id=comunidad.id,
        )
        autor = Usuario(
            nombre="María",
            correo="maria@test.com",
            contraseña_hash=generate_password_hash("Vecino123!"),
            rol="usuario",
            comunidad_id=comunidad.id,
        )
        otros = []
        for i, nombre in enumerate(["Carlos", "Juana", "Pedro"]):
            otros.append(
                Usuario(
                    nombre=nombre,
                    correo=f"vecino{i}@test.com",
                    contraseña_hash=generate_password_hash("Vecino123!"),
                    rol="usuario",
                    comunidad_id=comunidad.id,
                )
            )
        db.session.add_all([coordenador, autor] + otros)
        db.session.flush()

        contexto = {
            "coordinador": coordenador,
            "autor": autor,
            "otros": otros,
            "comunidad": comunidad,
            "tipos": tipos,
        }
        yield app
    with app.app_context():
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def cliente(app):
    return app.test_client()