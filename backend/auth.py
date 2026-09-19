from functools import wraps

from flask import request, g

from models import Usuario
from extensions import db
from services import decodificar_token, ErrorNoAutorizado


def _cargar_usuario():
    autorizacion = request.headers.get("Authorization", "")
    if not autorizacion.startswith("Bearer "):
        raise ErrorNoAutorizado("Autenticación requerida")
    payload = decodificar_token(autorizacion[7:])
    usuario = db.session.get(Usuario, payload.get("sub"))
    if not usuario:
        raise ErrorNoAutorizado("Usuario no encontrado")
    return usuario


def token_requerido(f):
    @wraps(f)
    def envoltura(*args, **kwargs):
        g.usuario = _cargar_usuario()
        return f(*args, **kwargs)

    return envoltura


def rol_requerido(*roles):
    def decorador(f):
        @wraps(f)
        def envoltura(*args, **kwargs):
            usuario = g.get("usuario") or _cargar_usuario()
            if usuario.rol not in roles:
                raise ErrorNoAutorizado("No tienes permiso para esta acción")
            g.usuario = usuario
            return f(*args, **kwargs)

        return envoltura

    return decorador