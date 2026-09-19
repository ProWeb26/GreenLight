import uuid
from datetime import datetime, timezone

from extensions import db


def nuevo_uuid():
    return str(uuid.uuid4())


def ahora_utc():
    return datetime.now(timezone.utc)


class Usuario(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=nuevo_uuid)
    nombre = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(160), nullable=False, unique=True, index=True)
    rol = db.Column(db.String(20), nullable=False, default="usuario")
    created_a = db.Column(db.DateTime(timezone=True), default=ahora_utc)

    tareas = db.relationship("Tarea", back_populates="usuario", cascade="all, delete-orphan")

    def serializar(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "email": self.email,
            "rol": self.rol,
            "created_a": self.created_a.isoformat() if self.created_a else None,
        }


class Tarea(db.Model):
    __tablename__ = "tasks"

    PRIORIDADES = ("baja", "media", "alta")

    id = db.Column(db.String(36), primary_key=True, default=nuevo_uuid)
    usuario_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    titulo = db.Column(db.String(120), nullable=False)
    descripcion = db.Column(db.String(500), nullable=True)
    prioridad = db.Column(db.String(10), nullable=False, default="media")
    completada = db.Column(db.Boolean, nullable=False, default=False)
    created_a = db.Column(db.DateTime(timezone=True), default=ahora_utc)

    usuario = db.relationship("Usuario", back_populates="tareas")

    def serializar(self):
        return {
            "id": self.id,
            "usuario_id": self.usuario_id,
            "titulo": self.titulo,
            "descripcion": self.descripcion,
            "prioridad": self.prioridad,
            "completada": self.completada,
            "created_a": self.created_a.isoformat() if self.created_a else None,
        }