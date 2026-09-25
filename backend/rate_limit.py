import os

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from config import Config

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[Config.RATE_LIMIT_DEFAULT],
    storage_uri="memory://",
)

RATE_LIMIT_AUTH = Config.RATE_LIMIT_AUTH