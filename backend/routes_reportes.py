from flask import Blueprint, request, g, jsonify

import services
from auth import token_requerido, rol_requerido

reportes_bp = Blueprint("reportes", __name__, url_prefix="/api")


@reportes_bp.get("/feed")
def feed():
    filtros = {
        "tipo_id": request.args.get("tipo_id", type=int),
        "comunidad_id": request.args.get("comunidad_id"),
        "estado": request.args.get("estado"),
    }
    reportes = services.listar_feed({k: v for k, v in filtros.items() if v})
    return jsonify([r.serializar() for r in reportes]), 200


@reportes_bp.get("/reportes/<reporte_id>")
def detalle(reporte_id):
    reporte = services.obtener_reporte(reporte_id)
    if not reporte:
        return jsonify({"error": "Reporte no encontrado"}), 404
    return jsonify(reporte.serializar()), 200


@reportes_bp.post("/reportes")
@token_requerido
def crear():
    reporte = services.crear_reporte(g.usuario, request.get_json(silent=True) or {})
    return jsonify(reporte.serializar()), 201


@reportes_bp.patch("/reportes/<reporte_id>")
@token_requerido
def actualizar(reporte_id):
    reporte = services.obtener_reporte(reporte_id)
    if not reporte:
        return jsonify({"error": "Reporte no encontrado"}), 404
    reporte = services.actualizar_reporte(
        g.usuario, reporte, request.get_json(silent=True) or {}
    )
    return jsonify(reporte.serializar()), 200


@reportes_bp.delete("/reportes/<reporte_id>")
@token_requerido
def eliminar(reporte_id):
    reporte = services.obtener_reporte(reporte_id)
    if not reporte:
        return jsonify({"error": "Reporte no encontrado"}), 404
    services.eliminar_reporte(g.usuario, reporte)
    return jsonify({"ok": True}), 200


@reportes_bp.post("/reportes/<reporte_id>/confirmar")
@token_requerido
def confirmar(reporte_id):
    reporte = services.obtener_reporte(reporte_id)
    if not reporte:
        return jsonify({"error": "Reporte no encontrado"}), 404
    reporte = services.confirmar_reporte(g.usuario, reporte)
    return jsonify(reporte.serializar()), 200


@reportes_bp.patch("/reportes/<reporte_id>/estado")
@token_requerido
@rol_requerido("coordinador")
def cambiar_estado(reporte_id):
    reporte = services.obtener_reporte(reporte_id)
    if not reporte:
        return jsonify({"error": "Reporte no encontrado"}), 404
    datos = request.get_json(silent=True) or {}
    reporte = services.cambiar_estado(g.usuario, reporte, datos.get("estado"))
    return jsonify(reporte.serializar()), 200


@reportes_bp.get("/stats")
def stats():
    return jsonify(services.stats_globales()), 200