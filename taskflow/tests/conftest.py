import os
import tempfile

import pytest

from app import create_app
from config import TestConfig


@pytest.fixture()
def app():
    app = create_app(TestConfig)
    yield app


@pytest.fixture()
def cliente(app):
    return app.test_client()


@pytest.fixture()
def app_archivo(tmp_path):
    """App sobre un archivo SQLite temporal para probar persistencia tras reinicio."""
    ruta = str(tmp_path / "taskflow.db")

    config = type("ConfigArchivo", (), {})
    config.TESTING = True
    config.SQLALCHEMY_DATABASE_URI = f"sqlite:///{ruta}"
    config.SQLALCHEMY_TRACK_MODIFICATIONS = False
    config.SQLALCHEMY_ENGINE_OPTIONS = {}
    config.JSON_AS_ASCII = False
    config.ruta = staticmethod(lambda: ruta)
    return config