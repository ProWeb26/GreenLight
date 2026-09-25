import os
from datetime import timedelta
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
    SECRET_KEY = os.getenv("SECRET_KEY", "greenlight-dev-key-change-me")
    SQLALCHEMY_DATABASE_URI = _uri_base() or f"sqlite:///{os.path.join(BASE_DIR, 'greenlight.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}
    JWT_EXPIRATION_MINUTES = int(os.getenv("JWT_EXPIRATION_MINUTES", "120"))
    JWT_ALGORITHM = "HS256"
    CONFIRMATION_THRESHOLD = int(os.getenv("CONFIRMATION_THRESHOLD", "3"))
    JSON_AS_ASCII = False
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
    RATE_LIMIT_DEFAULT = os.getenv("RATE_LIMIT_DEFAULT", "2000 per hour")
    RATE_LIMIT_AUTH = os.getenv("RATE_LIMIT_AUTH", "30 per minute")


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite://"