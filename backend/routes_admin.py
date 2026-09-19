from flask import Blueprint, request, jsonify

import services
from auth import token_requerido, rol_requerido
from extensions import db
from models import Comunidad, TipoIncidente

admin_bp = Blueprint("admin", __name__, url_prefix="/api")


def _serializar_comunidad(c):
    return {
        "id": c.id,
        "nombre": c.nombre,
        "descripcion": c.descripcion,
        "zona_ciudad": c.zona_ciudad,
        "latitud": c.latitud,
        "longitud": c.longitud,
        "limites_geojson": c.limites_geojson,
        "fecha_creacion": c.fecha_creacion.isoformat() if c.fecha_creacion else None,
    }


def _serializar_tipo(t):
    return {
        "id": t.id,
        "nombre": t.nombre,
        "descripcion": t.descripcion,
        "icono": t.icono,
        "color_etiqueta": t.color_etiqueta,
    }


@admin_bp.get("/comunidades")
def listar_comunidades():
    return jsonify([_serializar_comunidad(c) for c in services.listar_comunidades()]), 200


@admin_bp.post("/comunidades")
@token_requerido
@rol_requerido("coordinador")
def crear_comunidad():
    comunidad = services.crear_entidad(
        Comunidad, request.get_json(silent=True) or {}, requeridos=("nombre",)
    )
    return jsonify(_serializar_comunidad(comunidad)), 201


@admin_bp.put("/comunidades/<comunidad_id>")
@token_requerido
@rol_requerido("coordinador")
def actualizar_comunidad(comunidad_id):
    comunidad = db.session.get(Comunidad, comunidad_id)
    if not comunidad:
        return jsonify({"error": "Comunidad no encontrada"}), 404
    datos = request.get_json(silent=True) or {}
    if "nombre" in datos and not (datos.get("nombre") or "").strip():
        return jsonify({"error": "El nombre es obligatorio"}), 422
    comunidad = services.actualizar_entidad(comunidad, datos)
    return jsonify(_serializar_comunidad(comunidad)), 200


@admin_bp.delete("/comunidades/<comunidad_id>")
@token_requerido
@rol_requerido("coordinador")
def eliminar_comunidad(comunidad_id):
    comunidad = db.session.get(Comunidad, comunidad_id)
    if not comunidad:
        return jsonify({"error": "Comunidad no encontrada"}), 404
    services.eliminar_entidad(comunidad)
    return jsonify({"ok": True}), 200


@admin_bp.get("/tipo-incidentes")
def listar_tipos():
    return jsonify([_serializar_tipo(t) for t in services.listar_tipos()]), 200


@admin_bp.post("/tipo-incidentes")
@token_requerido
@rol_requerido("coordinador")
def crear_tipo():
    tipo = services.crear_entidad(
        TipoIncidente, request.get_json(silent=True) or {}, requeridos=("nombre",)
    )
    return jsonify(_serializar_tipo(tipo)), 201


@admin_bp.put("/tipo-incidentes/<int:tipo_id>")
@token_requerido
@rol_requerido("coordinador")
def actualizar_tipo(tipo_id):
    tipo = db.session.get(TipoIncidente, tipo_id)
    if not tipo:
        return jsonify({"error": "Tipo de incidente no encontrado"}), 404
    datos = request.get_json(silent=True) or {}
    if "nombre" in datos and not (datos.get("nombre") or "").strip():
        return jsonify({"error": "El nombre es obligatorio"}), 422
    tipo = services.actualizar_entidad(tipo, datos)
    return jsonify(_serializar_tipo(tipo)), 200


@admin_bp.delete("/tipo-incidentes/<int:tipo_id>")
@token_requerido
@rol_requerido("coordinador")
def eliminar_tipo(tipo_id):
    tipo = db.session.get(TipoIncidente, tipo_id)
    if not tipo:
        return jsonify({"error": "Tipo de incidente no encontrado"}), 404
    services.eliminar_entidad(tipo)
    return jsonify({"ok": True}), 200