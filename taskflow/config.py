import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def _uri_base():
    url = os.getenv("DATABASE_URL", "")
    if url.startswith("postgres://") or url.startswith("postgresql://"):
        url = url.replace("postgres://", "postgresql+psycopg://", 1)
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


class Config:
    SQLALCHEMY_DATABASE_URI = _uri_base() or f"sqlite:///{os.path.join(BASE_DIR, 'taskflow.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}
    JSON_AS_ASCII = False


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite://"
    SQLALCHEMY_ENGINE_OPTIONS = {}


class FileTestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "TEST_DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'test_taskflow.db')}"
    )