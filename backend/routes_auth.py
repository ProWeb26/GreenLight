from flask import Blueprint, request, g, jsonify

import services
from auth import token_requerido, rol_requerido
from models import Usuario

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/registro")
def registro():
    respuesta = services.registrar_usuario(request.get_json(silent=True) or {})
    return jsonify(respuesta), 201


@auth_bp.post("/login")
def login():
    respuesta = services.iniciar_sesion(request.get_json(silent=True) or {})
    return jsonify(respuesta), 200


@auth_bp.get("/usuarios")
@token_requerido
@rol_requerido("coordinador")
def listar_usuarios():
    usuarios = Usuario.query.order_by(Usuario.fecha_creacion.desc()).all()
    return jsonify([services._serializar_usuario(u) for u in usuarios]), 200


@auth_bp.post("/usuarios")
@token_requerido
@rol_requerido("coordinador")
def crear_usuario():
    respuesta = services.registrar_usuario(request.get_json(silent=True) or {})
    return jsonify(respuesta), 201


@auth_bp.put("/usuarios/<usuario_id>")
@token_requerido
@rol_requerido("coordinador")
def actualizar_usuario(usuario_id):
    usuario = Usuario.query.filter_by(id=usuario_id).first()
    if not usuario:
        return jsonify({"error": "Usuario no encontrado"}), 404
    datos = request.get_json(silent=True) or {}
    if "nombre" in datos:
        nombre = (datos.get("nombre") or "").strip()
        if len(nombre) < 2:
            return jsonify({"error": "El nombre debe tener al menos 2 caracteres"}), 422
        usuario.nombre = nombre
    if "rol" in datos:
        if datos["rol"] not in ("usuario", "coordinador"):
            return jsonify({"error": "Rol inválido"}), 422
        usuario.rol = datos["rol"]
    if "comunidad_id" in datos:
        usuario.comunidad_id = datos["comunidad_id"]
    services.db.session.commit()
    return jsonify(services._serializar_usuario(usuario)), 200


@auth_bp.delete("/usuarios/<usuario_id>")
@token_requerido
@rol_requerido("coordinador")
def eliminar_usuario(usuario_id):
    usuario = Usuario.query.filter_by(id=usuario_id).first()
    if not usuario:
        return jsonify({"error": "Usuario no encontrado"}), 404
    services.db.session.delete(usuario)
    services.db.session.commit()
    return jsonify({"ok": True}), 200


@auth_bp.get("/me")
@token_requerido
def perfil():
    return jsonify(services._serializar_usuario(g.usuario)), 200