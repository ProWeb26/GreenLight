import uuid
from datetime import datetime, timezone

from extensions import db


def nuevo_uuid():
    return str(uuid.uuid4())


def ahora_utc():
    return datetime.now(timezone.utc)


class Usuario(db.Model):
    __tablename__ = "usuario"

    id = db.Column(db.String(36), primary_key=True, default=nuevo_uuid)
    nombre = db.Column(db.String(120), nullable=False)
    correo = db.Column(db.String(160), nullable=False, unique=True, index=True)
    contraseña_hash = db.Column(db.String(255), nullable=False)
    rol = db.Column(db.String(20), nullable=False, default="usuario")
    comunidad_id = db.Column(db.String(36), db.ForeignKey("comunidad.id"), nullable=True)
    fecha_creacion = db.Column(db.DateTime(timezone=True), default=ahora_utc)

    comunidad = db.relationship("Comunidad", back_populates="usuarios")
    reportes = db.relationship("Reporte", back_populates="autor", lazy="dynamic")


class Comunidad(db.Model):
    __tablename__ = "comunidad"

    id = db.Column(db.String(36), primary_key=True, default=nuevo_uuid)
    nombre = db.Column(db.String(120), nullable=False)
    descripcion = db.Column(db.Text, nullable=True)
    zona_ciudad = db.Column(db.String(120), nullable=True)
    latitud = db.Column(db.Float, nullable=True)
    longitud = db.Column(db.Float, nullable=True)
    limites_geojson = db.Column(db.JSON, nullable=True)
    fecha_creacion = db.Column(db.DateTime(timezone=True), default=ahora_utc)

    usuarios = db.relationship("Usuario", back_populates="comunidad")
    reportes = db.relationship("Reporte", back_populates="comunidad")


class TipoIncidente(db.Model):
    __tablename__ = "tipo_incidente"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(120), nullable=False)
    descripcion = db.Column(db.Text, nullable=True)
    icono = db.Column(db.String(16), nullable=True)
    color_etiqueta = db.Column(db.String(16), nullable=True)


class Reporte(db.Model):
    __tablename__ = "reporte"

    ESTADOS = ("activo", "confirmado_comunidad", "verificado")

    id = db.Column(db.String(36), primary_key=True, default=nuevo_uuid)
    comunidad_id = db.Column(db.String(36), db.ForeignKey("comunidad.id"), nullable=True)
    usuario_id = db.Column(db.String(36), db.ForeignKey("usuario.id"), nullable=False)
    tipo_id = db.Column(db.Integer, db.ForeignKey("tipo_incidente.id"), nullable=False)
    ubicacion_texto = db.Column(db.String(255), nullable=True)
    latitud = db.Column(db.Float, nullable=True)
    longitud = db.Column(db.Float, nullable=True)
    descripcion = db.Column(db.Text, nullable=False)
    foto_url = db.Column(db.String(500), nullable=True)
    estado = db.Column(db.String(24), nullable=False, default="activo")
    slug_url = db.Column(db.String(32), nullable=False, unique=True)
    fecha_creacion = db.Column(db.DateTime(timezone=True), default=ahora_utc)

    autor = db.relationship("Usuario", back_populates="reportes")
    comunidad = db.relationship("Comunidad", back_populates="reportes")
    tipo = db.relationship("TipoIncidente")
    confirmaciones = db.relationship(
        "Confirmacion", back_populates="reporte", cascade="all, delete-orphan"
    )

    def serializar(self):
        conteo = len(self.confirmaciones)
        return {
            "id": self.id,
            "slug_url": self.slug_url,
            "comunidad_id": self.comunidad_id,
            "comunidad": self.comunidad.nombre if self.comunidad else None,
            "usuario_id": self.usuario_id,
            "autor": self.autor.nombre if self.autor else None,
            "tipo_id": self.tipo_id,
            "tipo": self.tipo.nombre if self.tipo else None,
            "icono": self.tipo.icono if self.tipo else None,
            "color_etiqueta": self.tipo.color_etiqueta if self.tipo else None,
            "ubicacion_texto": self.ubicacion_texto,
            "latitud": self.latitud,
            "longitud": self.longitud,
            "descripcion": self.descripcion,
            "foto_url": self.foto_url,
            "estado": self.estado,
            "confirmaciones": conteo,
            "fecha_creacion": self.fecha_creacion.isoformat() if self.fecha_creacion else None,
        }


class Confirmacion(db.Model):
    __tablename__ = "confirmacion"
    __table_args__ = (
        db.UniqueConstraint("reporte_id", "usuario_id", name="uq_confirmacion_reporte_usuario"),
    )

    id = db.Column(db.String(36), primary_key=True, default=nuevo_uuid)
    reporte_id = db.Column(
        db.String(36), db.ForeignKey("reporte.id", ondelete="CASCADE"), nullable=False
    )
    usuario_id = db.Column(db.String(36), db.ForeignKey("usuario.id"), nullable=False)
    fecha_confirmacion = db.Column(db.DateTime(timezone=True), default=ahora_utc)

    reporte = db.relationship("Reporte", back_populates="confirmaciones")