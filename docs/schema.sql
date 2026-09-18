CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS reporte (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comunidad_id UUID NOT NULL,
    usuario_id UUID NOT NULL,
    tipo_id INT NOT NULL,
    ubicacion_texto VARCHAR(255) NOT NULL,
    latitud FLOAT8 NOT NULL,
    longitud FLOAT8 NOT NULL,
    descripcion TEXT,
    foto_url VARCHAR(255),
    estado VARCHAR(30) NOT NULL DEFAULT 'activo',
    slug_url VARCHAR(100) UNIQUE,
    fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);