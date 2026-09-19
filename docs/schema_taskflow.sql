-- TaskFlow: API de tareas por usuario (Plan de Pruebas Postman)
-- Esquema para PostgreSQL / Supabase.
-- Los IDs se guardan como VARCHAR(36) para coincidir con String(36) de los
-- modelos de SQLAlchemy; no usar columnas UUID.

CREATE TABLE IF NOT EXISTS users (
    id         VARCHAR(36) PRIMARY KEY,
    nombre     VARCHAR(120) NOT NULL,
    email      VARCHAR(160) NOT NULL UNIQUE,
    rol        VARCHAR(20) NOT NULL DEFAULT 'usuario',
    created_a  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
    id          VARCHAR(36) PRIMARY KEY,
    usuario_id  VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    titulo      VARCHAR(120) NOT NULL,
    descripcion VARCHAR(500),
    prioridad   VARCHAR(10) NOT NULL DEFAULT 'media'
                CHECK (prioridad IN ('baja', 'media', 'alta')),
    completada  BOOLEAN NOT NULL DEFAULT FALSE,
    created_a   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_usuario   ON tasks(usuario_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completada ON tasks(completada);