import os

from werkzeug.security import generate_password_hash

from app import create_app
from extensions import db
from models import Comunidad, Confirmacion, Reporte, TipoIncidente, Usuario

TIPOS = [
    {
        "nombre": "Quema Agrícola",
        "descripcion": "Quechao o preparación de chacra con fuego.",
        "icono": "🔥",
        "color_etiqueta": "#f97316",
    },
    {
        "nombre": "Quema de Basuras",
        "descripcion": "Incineración de residuos domiciliarios o industriales.",
        "icono": "🗑️",
        "color_etiqueta": "#eab308",
    },
    {
        "nombre": "Incendio Forestal",
        "descripcion": "Fuego descontrolado en vegetación o bosque.",
        "icono": "🌲",
        "color_etiqueta": "#ef4444",
    },
    {
        "nombre": "Foco de Humo",
        "descripcion": "Columna de humo visible sin llama confirmada.",
        "icono": "💨",
        "color_etiqueta": "#94a3b8",
    },
]

COMUNIDADES = [
    {
        "nombre": "Ciudad de Santa Cruz",
        "zona_ciudad": "Guaracachi / Este",
        "latitud": -17.7863,
        "longitud": -63.1812,
    },
    {
        "nombre": "Los Troncos",
        "zona_ciudad": "Carretera al Norte, km 5",
        "latitud": -17.724,
        "longitud": -63.144,
    },
    {
        "nombre": "Pailón",
        "zona_ciudad": "Departamento de Santa Cruz",
        "latitud": -17.6488,
        "longitud": -62.7494,
    },
]

USUARIOS = [
    {
        "nombre": "Coordinador GreenLight",
        "correo": "coordinador@greenlight.test",
        "contraseña": "Coordi123!",
        "rol": "coordinador",
    },
    {
        "nombre": "Vecina María",
        "correo": "maria@greenlight.test",
        "contraseña": "Vecino123!",
        "rol": "usuario",
    },
    {
        "nombre": "Vecino Carlos",
        "correo": "carlos@greenlight.test",
        "contraseña": "Vecino123!",
        "rol": "usuario",
    },
]

REPORTES = [
    {
        "descripcion": "Humo denso saliendo del monte, a unos 300 m de la vereda.",
        "ubicacion_texto": "Vereda El Roble, km 4",
        "estado": "activo",
    },
    {
        "descripcion": "Quechao de restos de cosecha en la llanura.",
        "ubicacion_texto": "Zona El Pajonal",
        "estado": "confirmado_comunidad",
    },
]


def inicializar():
    app = create_app()
    with app.app_context():
        if TipoIncidente.query.count() > 0:
            print("Base ya contiene datos de ejemplo. Se omite el sembrado.")
            return

        for datos in TIPOS:
            db.session.add(TipoIncidente(**datos))

        comunidades = [Comunidad(**c) for c in COMUNIDADES]
        db.session.add_all(comunidades)
        db.session.flush()

        personas = []
        for i, datos in enumerate(USUARIOS):
            persona = Usuario(
                nombre=datos["nombre"],
                correo=datos["correo"],
                contraseña_hash=generate_password_hash(datos["contraseña"]),
                rol=datos["rol"],
                comunidad_id=comunidades[0].id,
            )
            personas.append(persona)
        db.session.add_all(personas)
        db.session.flush()

        tipos = TipoIncidente.query.all()
        for i, datos in enumerate(REPORTES):
            db.session.add(
                Reporte(
                    comunidad_id=comunidades[i % len(comunidades)].id,
                    usuario_id=personas[1 + i % 2].id,
                    tipo_id=tipos[i % len(tipos)].id,
                    descripcion=datos["descripcion"],
                    ubicacion_texto=datos["ubicacion_texto"],
                    estado=datos["estado"],
                    slug_url=f"ECO-{1000 + i * 3:04d}",
                )
            )
        db.session.commit()

    print("Sembrado de datos de ejemplo completado.")


if __name__ == "__main__":
    os.environ.setdefault("FLASK_CONFIG", "config.Config")
    inicializar()