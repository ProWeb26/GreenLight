# GreenLight — Reporte de quemas y focos de humo

Proyecto final de **Programación Web II – UPDS**: una **red comunitaria
offline-first** para reportar quemas y focos de humo, seguir su estado
(activo → confirmado_comunidad → verificado) y sincronizar los reportes
cuando se recupera la señal.

Además del proyecto principal, el repositorio incluye el **Mini Task Manager**
(laboratorio de clase en Node) y la API **TaskFlow** (plan de pruebas Postman),
ambos como entregables de la materia.

## Módulos

| Módulo             | Carpeta   | Stack                     | Tests |
|--------------------|-----------|---------------------------|-------|
| **GreenLight API** | `backend` | Flask + SQLAlchemy + JWT  | 35 ✓ |
| **TaskFlow API**   | `taskflow`| Flask + SQLAlchemy        | 19 ✓ |
| **GreenLight Web** | `frontend`| React 19 + Vite + Tailwind| lint+build ✓ |
| Mini Task Manager  | `mini-task-manager` | Node/Express + React (laboratorio) | 21 (Node) |

## Entidades (GreenLight)

`Usuario` (usuario/coordinador) · `Comunidad` · `TipoIncidente` ·
`Reporte` (activo → confirmado_comunidad con umbral 3 → verificado) ·
`Confirmacion` (+1 por usuario).

## Requisitos

- Python 3.11+ · Node 18+ · PostgreSQL (Supabase) **o** SQLite local.

## Arranque local

```powershell
# GreenLight API
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt -r requirements-dev.txt
Copy-Item .env.example .env    # ajusta DATABASE_URL (SQLite por defecto)
python seed.py                 # siembra datos de ejemplo
flask --app app run --debug    # http://localhost:5000

# TaskFlow API
cd taskflow
pip install -r requirements.txt
flask --app app run --port 5001 --debug

# Frontend
cd frontend
npm install
Copy-Item .env.example .env    # VITE_API_URL=http://localhost:5000/api
npm run dev                    # http://localhost:5173
```

### Usuarios de prueba (GreenLight)

| Correo | Contraseña | Rol |
|--------|-----------|-----|
| `coordinador@greenlight.test` | `Coordi123!` | coordinador |
| `maria@greenlight.test` | `Vecino123!` | usuario |
| `carlos@greenlight.test` | `Vecino123!` | usuario |

## Verificación

```powershell
cd backend && python -m pytest        # 35 verdes
cd taskflow && python -m pytest       # 19 verdes
cd frontend && npm run lint && npm run build
```

## Docs

- `docs/DEPLOY_RENDER.md` — Render (Flask/gunicorn) + Supabase + Cloudflare Pages.
- `docs/schema.sql` y `docs/schema_taskflow.sql` — esquemas PostgreSQL/Supabase.
- `docs/GreenLight_Postman.json` y `docs/TaskFlow_Postman.json` — colecciones Postman.
- `docs/TEST_CASES.md` y `docs/PERFORMANCE_ACCESSIBILITY.md` — pruebas y
  presupuesto Lighthouse/WCAG (300–500 KB, ≥ 90).

## Git — Ramas

```text
main  → rama estable
dev   → rama de desarrollo (actual)
```