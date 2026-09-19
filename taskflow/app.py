import os

from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

from extensions import db
from models import Usuario, Tarea

load_dotenv()


def _validar_usuario(datos):
    nombre = (datos.get("nombre") or "").strip()
    email = (datos.get("email") or "").strip().lower()
    rol = datos.get("rol") or "usuario"
    if len(nombre) < 2:
        return "El nombre debe tener al menos 2 caracteres"
    if "@" not in email or "." not in email:
        return "El email no es válido"
    if rol not in ("usuario", "coordinador"):
        return "El rol debe ser 'usuario' o 'coordinador'"
    return None


def _validar_tarea(datos):
    titulo = (datos.get("titulo") or "").strip()
    prioridad = datos.get("prioridad") or "media"
    if len(titulo) < 3:
        return "El título debe tener al menos 3 caracteres"
    if prioridad not in Tarea.PRIORIDADES:
        return "La prioridad debe ser 'baja', 'media' o 'alta'"
    return None


def create_app(config_object=None):
    app = Flask(__name__)
    if config_object is None:
        config_object = os.getenv("FLASK_CONFIG", "config.Config")
    app.config.from_object(config_object)

    CORS(app, origins="*")
    db.init_app(app)

    def hecho():
        return jsonify({"ok": True}), 200

    @app.get("/api/health")
    def health():
        from sqlalchemy import text

        try:
            db.session.execute(text("SELECT 1"))
            conectada = True
        except Exception:
            conectada = False
        return jsonify({"status": "ok", "database": {"connected": conectada}}), (
            200 if conectada else 503
        )

    @app.get("/api/users")
    def listar_usuarios():
        return jsonify([u.serializar() for u in Usuario.query.order_by(Usuario.created_a).all()]), 200

    @app.get("/api/users/<usuario_id>")
    def obtener_usuario(usuario_id):
        usuario = db.session.get(Usuario, usuario_id)
        if not usuario:
            return jsonify({"error": "Usuario no encontrado"}), 404
        return jsonify(usuario.serializar()), 200

    @app.post("/api/users")
    def crear_usuario():
        datos = request.get_json(silent=True) or {}
        error = _validar_usuario(datos)
        if error:
            return jsonify({"error": error}), 422
        if Usuario.query.filter_by(email=datos["email"].lower()).first():
            return jsonify({"error": "Ya existe un usuario con ese email"}), 409
        usuario = Usuario(
            nombre=datos["nombre"].strip(),
            email=datos["email"].lower(),
            rol=datos.get("rol", "usuario"),
        )
        db.session.add(usuario)
        db.session.commit()
        return jsonify(usuario.serializar()), 201

    @app.put("/api/users/<usuario_id>")
    def actualizar_usuario(usuario_id):
        usuario = db.session.get(Usuario, usuario_id)
        if not usuario:
            return jsonify({"error": "Usuario no encontrado"}), 404
        datos = request.get_json(silent=True) or {}
        if "nombre" in datos:
            nombre = (datos.get("nombre") or "").strip()
            if len(nombre) < 2:
                return jsonify({"error": "El nombre debe tener al menos 2 caracteres"}), 422
            usuario.nombre = nombre
        if "rol" in datos:
            if datos.get("rol") not in ("usuario", "coordinador"):
                return jsonify({"error": "Rol inválido"}), 422
            usuario.rol = datos["rol"]
        db.session.commit()
        return jsonify(usuario.serializar()), 200

    @app.delete("/api/users/<usuario_id>")
    def eliminar_usuario(usuario_id):
        usuario = db.session.get(Usuario, usuario_id)
        if not usuario:
            return jsonify({"error": "Usuario no encontrado"}), 404
        db.session.delete(usuario)
        db.session.commit()
        return hecho()

    @app.get("/api/tasks")
    def listar_tareas():
        return jsonify([t.serializar() for t in Tarea.query.order_by(Tarea.created_a.desc()).all()]), 200

    @app.get("/api/tasks/completed")
    def tareas_completadas():
        tareas = Tarea.query.filter_by(completada=True).order_by(Tarea.created_a.desc()).all()
        return jsonify([t.serializar() for t in tareas]), 200

    @app.get("/api/tasks/<tarea_id>")
    def obtener_tarea(tarea_id):
        tarea = db.session.get(Tarea, tarea_id)
        if not tarea:
            return jsonify({"error": "Tarea no encontrada"}), 404
        return jsonify(tarea.serializar()), 200

    @app.post("/api/tasks")
    def crear_tarea():
        datos = request.get_json(silent=True) or {}
        error = _validar_tarea(datos)
        if error:
            return jsonify({"error": error}), 422
        usuario = db.session.get(Usuario, datos.get("usuario_id"))
        if not usuario:
            return jsonify({"error": "El usuario asignado no existe"}), 404
        tarea = Tarea(
            usuario_id=usuario.id,
            titulo=datos["titulo"].strip(),
            descripcion=(datos.get("descripcion") or "").strip() or None,
            prioridad=datos.get("prioridad", "media"),
        )
        db.session.add(tarea)
        db.session.commit()
        return jsonify(tarea.serializar()), 201

    @app.put("/api/tasks/<tarea_id>")
    def actualizar_tarea(tarea_id):
        tarea = db.session.get(Tarea, tarea_id)
        if not tarea:
            return jsonify({"error": "Tarea no encontrada"}), 404
        datos = request.get_json(silent=True) or {}
        if "titulo" in datos:
            titulo = (datos.get("titulo") or "").strip()
            if len(titulo) < 3:
                return jsonify({"error": "El título debe tener al menos 3 caracteres"}), 422
            tarea.titulo = titulo
        if "descripcion" in datos:
            tarea.descripcion = (datos.get("descripcion") or "").strip() or None
        if "prioridad" in datos:
            if datos["prioridad"] not in Tarea.PRIORIDADES:
                return jsonify({"error": "Prioridad inválida"}), 422
            tarea.prioridad = datos["prioridad"]
        if "completada" in datos and isinstance(datos["completada"], bool):
            tarea.completada = datos["completada"]
        db.session.commit()
        return jsonify(tarea.serializar()), 200

    @app.patch("/api/tasks/<tarea_id>/complete")
    def completar_tarea(tarea_id):
        tarea = db.session.get(Tarea, tarea_id)
        if not tarea:
            return jsonify({"error": "Tarea no encontrada"}), 404
        tarea.completada = True
        db.session.commit()
        return jsonify(tarea.serializar()), 200

    @app.delete("/api/tasks/<tarea_id>")
    def eliminar_tarea(tarea_id):
        tarea = db.session.get(Tarea, tarea_id)
        if not tarea:
            return jsonify({"error": "Tarea no encontrada"}), 404
        db.session.delete(tarea)
        db.session.commit()
        return hecho()

    @app.get("/api/users/<usuario_id>/tasks")
    def tareas_de_usuario(usuario_id):
        usuario = db.session.get(Usuario, usuario_id)
        if not usuario:
            return jsonify({"error": "Usuario no encontrado"}), 404
        tareas = Tarea.query.filter_by(usuario_id=usuario.id).order_by(Tarea.created_a.desc()).all()
        return jsonify([t.serializar() for t in tareas]), 200

    @app.get("/api/users/<usuario_id>/stats")
    def estadisticas_usuario(usuario_id):
        usuario = db.session.get(Usuario, usuario_id)
        if not usuario:
            return jsonify({"error": "Usuario no encontrado"}), 404
        tareas = Tarea.query.filter_by(usuario_id=usuario.id).all()
        total = len(tareas)
        completadas = sum(1 for t in tareas if t.completada)
        por_prioridad = {p: sum(1 for t in tareas if t.prioridad == p) for p in Tarea.PRIORIDADES}
        return (
            jsonify(
                {
                    "total": total,
                    "completadas": completadas,
                    "pendientes": total - completadas,
                    "por_prioridad": por_prioridad,
                }
            ),
            200,
        )

    @app.errorhandler(404)
    def _no_encontrado(_e):
        if request.path.startswith("/api/"):
            return jsonify({"error": "Recurso no encontrado"}), 404
        return "Not Found", 404

    @app.errorhandler(Exception)
    def _inesperado(e):
        app.logger.exception(e)
        return jsonify({"error": "Error interno del servidor"}), 500

    with app.app_context():
        db.create_all()

    return app


app = create_app()


if __name__ == "__main__":
    puerto = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=puerto, debug=True)