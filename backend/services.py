import uuid
from datetime import datetime, timezone

from flask import current_app

import jwt

from extensions import db
from models import Confirmacion, Reporte, TipoIncidente, Comunidad, Usuario
from werkzeug.security import generate_password_hash, check_password_hash


class ErrorValidacion(Exception):
    status = 422


class ErrorNoAutorizado(Exception):
    status = 401


class ErrorProhibido(Exception):
    status = 403


class ErrorNoEncontrado(Exception):
    status = 404


class ErrorConflicto(Exception):
    status = 409


def generar_token(usuario):
    ahora = int(datetime.now(timezone.utc).timestamp())
    payload = {
        "sub": usuario.id,
        "rol": usuario.rol,
        "exp": ahora + current_app.config["JWT_EXPIRATION_MINUTES"] * 60,
        "iat": ahora,
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")


def decodificar_token(token):
    try:
        return jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
    except jwt.PyJWTError as e:
        raise ErrorNoAutorizado("Token inválido o expirado") from e


def app_actual():
    return None


def registrar_usuario(datos):
    nombre = (datos.get("nombre") or "").strip()
    correo = (datos.get("correo") or "").strip().lower()
    contraseña = datos.get("contraseña") or ""
    rol = datos.get("rol") or "usuario"

    if len(nombre) < 2:
        raise ErrorValidacion("El nombre debe tener al menos 2 caracteres")
    if "@" not in correo or "." not in correo:
        raise ErrorValidacion("El correo no es válido")
    if len(contraseña) < 6:
        raise ErrorValidacion("La contraseña debe tener al menos 6 caracteres")
    if rol not in ("usuario", "coordinador"):
        raise ErrorValidacion("El rol debe ser 'usuario' o 'coordinador'")

    if Usuario.query.filter_by(correo=correo).first():
        raise ErrorConflicto("Ya existe un usuario con ese correo")

    comunidad_id = datos.get("comunidad_id")
    if comunidad_id and not db.session.get(Comunidad, comunidad_id):
        raise ErrorValidacion("Comunidad inválida")
    usuario = Usuario(
        nombre=nombre,
        correo=correo,
        contraseña_hash=generate_password_hash(contraseña),
        rol=rol,
        comunidad_id=comunidad_id,
    )
    db.session.add(usuario)
    db.session.commit()
    return {"usuario": _serializar_usuario(usuario), "token": generar_token(usuario)}


def iniciar_sesion(datos):
    correo = (datos.get("correo") or "").strip().lower()
    contraseña = datos.get("contraseña") or ""
    usuario = Usuario.query.filter_by(correo=correo).first()
    if not usuario or not check_password_hash(usuario.contraseña_hash, contraseña):
        raise ErrorNoAutorizado("Credenciales incorrectas")
    return {"usuario": _serializar_usuario(usuario), "token": generar_token(usuario)}


def _serializar_usuario(u):
    return {
        "id": u.id,
        "nombre": u.nombre,
        "correo": u.correo,
        "rol": u.rol,
        "comunidad_id": u.comunidad_id,
        "comunidad": u.comunidad.nombre if u.comunidad else None,
        "fecha_creacion": u.fecha_creacion.isoformat() if u.fecha_creacion else None,
    }


def crear_slug():
    return f"ECO-{uuid.uuid4().hex[:6].upper()}"


def listar_feed(filtros=None):
    filtros = filtros or {}
    consulta = Reporte.query
    if filtros.get("tipo_id"):
        consulta = consulta.filter(Reporte.tipo_id == filtros["tipo_id"])
    if filtros.get("comunidad_id"):
        consulta = consulta.filter(Reporte.comunidad_id == filtros["comunidad_id"])
    if filtros.get("estado"):
        consulta = consulta.filter(Reporte.estado == filtros["estado"])
    return consulta.order_by(Reporte.fecha_creacion.desc()).all()


def crear_reporte(usuario, datos):
    descripcion = (datos.get("descripcion") or "").strip()
    if len(descripcion) < 5:
        raise ErrorValidacion("La descripción debe tener al menos 5 caracteres")

    tipo = db.session.get(TipoIncidente, datos.get("tipo_id"))
    if not tipo:
        raise ErrorValidacion("Tipo de incidente inválido")

    comunidad_id = datos.get("comunidad_id") or usuario.comunidad_id
    reporte = Reporte(
        comunidad_id=comunidad_id,
        usuario_id=usuario.id,
        tipo_id=tipo.id,
        ubicacion_texto=(datos.get("ubicacion_texto") or "").strip() or None,
        latitud=datos.get("latitud"),
        longitud=datos.get("longitud"),
        descripcion=descripcion,
        foto_url=datos.get("foto_url"),
        slug_url=crear_slug(),
    )
    db.session.add(reporte)
    db.session.commit()
    return reporte


def obtener_reporte(reporte_id):
    return Reporte.query.filter_by(id=reporte_id).first()


def actualizar_reporte(usuario, reporte, datos):
    if not (usuario.rol == "coordinador" or reporte.usuario_id == usuario.id):
        raise ErrorProhibido("Solo el autor o el coordinador pueden editar este reporte")

    if "descripcion" in datos:
        descripcion = (datos.get("descripcion") or "").strip()
        if len(descripcion) < 5:
            raise ErrorValidacion("La descripción debe tener al menos 5 caracteres")
        reporte.descripcion = descripcion
    if "ubicacion_texto" in datos:
        reporte.ubicacion_texto = (datos.get("ubicacion_texto") or "").strip() or None
    if "latitud" in datos:
        reporte.latitud = datos.get("latitud")
    if "longitud" in datos:
        reporte.longitud = datos.get("longitud")
    if "tipo_id" in datos and datos.get("tipo_id"):
        tipo = db.session.get(TipoIncidente, datos["tipo_id"])
        if not tipo:
            raise ErrorValidacion("Tipo de incidente inválido")
        reporte.tipo_id = tipo.id
    if "comunidad_id" in datos:
        reporte.comunidad_id = datos.get("comunidad_id")
    db.session.commit()
    return reporte


def eliminar_reporte(usuario, reporte):
    if not (usuario.rol == "coordinador" or reporte.usuario_id == usuario.id):
        raise ErrorProhibido("Solo el autor o el coordinador pueden eliminar este reporte")
    db.session.delete(reporte)
    db.session.commit()


def confirmar_reporte(usuario, reporte):
    if usuario.id == reporte.usuario_id:
        raise ErrorConflicto("No puedes confirmar tu propio reporte")
    existente = Confirmacion.query.filter_by(
        reporte_id=reporte.id, usuario_id=usuario.id
    ).first()
    if existente:
        raise ErrorConflicto("Ya confirmaste este reporte")

    db.session.add(Confirmacion(reporte_id=reporte.id, usuario_id=usuario.id))

    umbral = current_app.config["CONFIRMATION_THRESHOLD"]
    if reporte.estado == "activo" and len(reporte.confirmaciones) + 1 >= umbral:
        reporte.estado = "confirmado_comunidad"

    db.session.commit()
    return reporte


def cambiar_estado(usuario, reporte, estado):
    if usuario.rol != "coordinador":
        raise ErrorProhibido("Solo el coordinador puede cambiar el estado")
    if estado not in Reporte.ESTADOS:
        raise ErrorValidacion("Estado inválido")
    reporte.estado = estado
    db.session.commit()
    return reporte


def listar_tipos():
    return TipoIncidente.query.order_by(TipoIncidente.nombre).all()


def listar_comunidades():
    return Comunidad.query.order_by(Comunidad.nombre).all()


def crear_entidad(modelo, datos, requeridos=()):
    for campo in requeridos:
        if not (datos.get(campo) or "").strip():
            raise ErrorValidacion(f"El campo '{campo}' es obligatorio")
    entidad = modelo(**{c: datos.get(c) for c in modelo_columnas(modelo) if c in datos})
    db.session.add(entidad)
    db.session.commit()
    return entidad


def modelo_columnas(modelo):
    return {c.name for c in modelo.__table__.columns if c.name != "id"}


def actualizar_entidad(entidad, datos):
    columnas = modelo_columnas(entidad.__class__)
    for campo in set(datos) & columnas:
        setattr(entidad, campo, datos[campo])
    db.session.commit()
    return entidad


def eliminar_entidad(entidad):
    db.session.delete(entidad)
    db.session.commit()


def stats_globales():
    reportes = listar_feed()
    por_estado = {}
    for r in reportes:
        por_estado[r.estado] = por_estado.get(r.estado, 0) + 1
    por_tipo = {}
    for r in reportes:
        clave = r.tipo.nombre if r.tipo else "sin tipo"
        por_tipo[clave] = por_tipo.get(clave, 0) + 1
    return {
        "total_reportes": len(reportes),
        "total_confirmaciones": Confirmacion.query.count(),
        "total_usuarios": Usuario.query.count(),
        "total_comunidades": Comunidad.query.count(),
        "por_estado": por_estado,
        "por_tipo": por_tipo,
    }