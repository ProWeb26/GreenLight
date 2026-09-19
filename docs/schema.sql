-- GreenLight: Red comunitaria de reporte de quemas y focos de humo (offline-first)
-- Esquema para PostgreSQL / Supabase. La API Flask la crea automáticamente con
-- db.create_all(); este script es la versión declarativa para el SQL Editor.
-- La API se conecta con el rol service_role (RLS no aplica): las políticas son
-- documentación de seguridad para cuando se use el rol anon/authenticated.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Comunidades
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comunidad (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre        VARCHAR(120) NOT NULL,
    descripcion   TEXT,
    zona_ciudad   VARCHAR(120),
    latitud       DOUBLE PRECISION,
    longitud      DOUBLE PRECISION,
    limites_geojson JSONB,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2. Usuarios
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuario (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre        VARCHAR(120) NOT NULL,
    correo        VARCHAR(160) NOT NULL UNIQUE,
    contraseña_hash VARCHAR(255) NOT NULL,
    rol           VARCHAR(20) NOT NULL DEFAULT 'usuario'
                  CHECK (rol IN ('usuario', 'coordinador')),
    comunidad_id  UUID REFERENCES comunidad(id) ON DELETE SET NULL,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 3. Tipos de incidente
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tipo_incidente (
    id            SERIAL PRIMARY KEY,
    nombre        VARCHAR(120) NOT NULL,
    descripcion   TEXT,
    icono         VARCHAR(16),
    color_etiqueta VARCHAR(16)
);

-- ---------------------------------------------------------------------------
-- 4. Reportes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reporte (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comunidad_id  UUID REFERENCES comunidad(id) ON DELETE SET NULL,
    usuario_id    UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    tipo_id       INT NOT NULL REFERENCES tipo_incidente(id),
    ubicacion_texto VARCHAR(255),
    latitud       DOUBLE PRECISION,
    longitud      DOUBLE PRECISION,
    descripcion   TEXT NOT NULL,
    foto_url      VARCHAR(500),
    estado        VARCHAR(24) NOT NULL DEFAULT 'activo'
                  CHECK (estado IN ('activo', 'confirmado_comunidad', 'verificado')),
    slug_url      VARCHAR(32) NOT NULL UNIQUE,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 5. Confirmaciones de la comunidad
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS confirmacion (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporte_id    UUID NOT NULL REFERENCES reporte(id) ON DELETE CASCADE,
    usuario_id    UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_confirmacion_usuario_reporte UNIQUE (usuario_id, reporte_id)
);

-- ---------------------------------------------------------------------------
-- Índices para los filtros del feed y el conteo de confirmaciones
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_usuario_comunidad  ON usuario(comunidad_id);
CREATE INDEX IF NOT EXISTS idx_reporte_creacion   ON reporte(fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_reporte_estado     ON reporte(estado);
CREATE INDEX IF NOT EXISTS idx_reporte_tipo       ON reporte(tipo_id);
CREATE INDEX IF NOT EXISTS idx_reporte_comunidad  ON reporte(comunidad_id);
CREATE INDEX IF NOT EXISTS idx_confirmacion_reporte ON confirmacion(reporte_id);

-- ---------------------------------------------------------------------------
-- RLS (opcional; documentación para el rol anon en Supabase)
-- ---------------------------------------------------------------------------
ALTER TABLE reporte ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipo_incidente ENABLE ROW LEVEL SECURITY;

CREATE POLICY reporte_lectura_publica ON reporte
    FOR SELECT USING (true);

CREATE POLICY comunidad_lectura_publica ON comunidad
    FOR SELECT USING (true);

CREATE POLICY tipo_incidente_lectura_publica ON tipo_incidente
    FOR SELECT USING (true);