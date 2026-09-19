import os

from app import create_app
from extensions import db
from models import Tarea, Usuario

USUARIOS = [
    {"nombre": "Ana López", "email": "ana@taskflow.test", "rol": "coordinador"},
    {"nombre": "Beto Ríos", "email": "beto@taskflow.test", "rol": "usuario"},
]

TAREAS = [
    {"titulo": "Mapa de focos de quema", "descripcion": "Levantar los puntos del último informe.", "prioridad": "alta"},
    {"titulo": "Validar datos de humo", "descripcion": "Cruzar los reportes con Biocode.", "prioridad": "media"},
    {"titulo": "Publicar resumen semanal", "descripcion": "Redactar el boletín a la comunidad.", "prioridad": "baja", "completada": True},
]


def inicializar():
    app = create_app()
    with app.app_context():
        if Usuario.query.count() > 0:
            print("Base ya contiene datos. Se omite el sembrado.")
            return

        usuarios = [Usuario(**u) for u in USUARIOS]
        db.session.add_all(usuarios)
        db.session.flush()

        for i, datos in enumerate(TAREAS):
            db.session.add(Tarea(usuario_id=usuarios[i % len(usuarios)].id, **datos))
        db.session.commit()

    print("Sembrado de TaskFlow completado.")


if __name__ == "__main__":
    os.environ.setdefault("FLASK_CONFIG", "config.Config")
    inicializar()