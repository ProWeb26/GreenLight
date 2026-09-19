-- TaskFlow: API de tareas por usuario (Plan de Pruebas Postman)
-- Esquema para PostgreSQL / Supabase.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre     VARCHAR(120) NOT NULL,
    email      VARCHAR(160) NOT NULL UNIQUE,
    rol        VARCHAR(20) NOT NULL DEFAULT 'usuario',
    created_a  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    titulo      VARCHAR(120) NOT NULL,
    descripcion VARCHAR(500),
    prioridad   VARCHAR(10) NOT NULL DEFAULT 'media'
                CHECK (prioridad IN ('baja', 'media', 'alta')),
    completada  BOOLEAN NOT NULL DEFAULT FALSE,
    created_a   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_usuario   ON tasks(usuario_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completada ON tasks(completada);