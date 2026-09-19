from flask import Blueprint, request, g, jsonify

import services
from auth import token_requerido

sync_bp = Blueprint("sync", __name__, url_prefix="/api")


@sync_bp.post("/sync")
@token_requerido
def sincronizar():
    """Recibe el lote de reportes creados offline y los persiste.

    Body: {"reportes": [{...}, ...], "confirmaciones": [{"reporte_id": ...}, ...]}
    """
    datos = request.get_json(silent=True) or {}
    reportes = datos.get("reportes") or []
    confirmaciones = datos.get("confirmaciones") or []

    if not reportes and not confirmaciones:
        return jsonify({"error": "No hay datos para sincronizar"}), 422

    creados = []
    for r in reportes:
        reporte = services.crear_reporte(g.usuario, r)
        creados.append(reporte.serializar())

    confirmados = []
    for c in confirmaciones:
        reporte = services.obtener_reporte(c.get("reporte_id"))
        if not reporte:
            continue
        try:
            reporte = services.confirmar_reporte(g.usuario, reporte)
            confirmados.append(reporte.serializar())
        except services.ErrorConflicto:
            continue

    return jsonify({"reportes": creados, "confirmaciones": confirmados}), 201