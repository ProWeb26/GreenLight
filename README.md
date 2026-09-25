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
| **GreenLight API** | `backend` | Flask + SQLAlchemy + JWT + Swagger | 41 ✓ |
| **TaskFlow API**   | `taskflow`| Flask + SQLAlchemy        | 19 ✓ |
| **GreenLight Web** | `frontend`| React 19 + Vite + Tailwind + **Leaflet** | lint+build ✓ |
| Mini Task Manager  | `mini-task-manager` | Node/Express + React (laboratorio) | 21 (Node) |

## Entidades (GreenLight)

`Usuario` (usuario/coordinador) · `Comunidad` · `TipoIncidente` ·
`Reporte` (activo → confirmado_comunidad con umbral 3 → verificado) ·
`Confirmacion` (+1 por usuario).

## Mapa (Leaflet)

- Ruta `/mapa`: mapa con los focos con coordenadas (marcadores por estado, popups
  con detalle, filtro por tipo, capa opcional de comunidades).
- En "Reportar" el marcador se coloca con un clic en el mapa o con "Usar mi ubicación".

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
cd backend && python -m pytest        # 41 verdes
cd taskflow && python -m pytest       # 19 verdes
cd frontend && npm run lint && npm run build
```

## Documentación Swagger

Con el backend corriendo, abre:

- **Swagger UI**: `http://localhost:5000/api/docs`
- Spec OpenAPI (YAML): `http://localhost:5000/api/openapi.yaml`

## Seguridad: JWT + RLS (Supabase)

- Autenticación JWT (Bearer) con roles `usuario`/`coordinador`; errores 401
  (token) vs 403 (permiso).
- RLS con política por operación (`SELECT/INSERT/UPDATE/DELETE`, `using` vs
  `with check`): `backend/sql/01_esquema_y_rls.sql` — termina verificando
  `rowsecurity = true` y las 9 políticas.
- Consultas en nombre del usuario: `backend/supabase_client.py`
  (`cliente_usuario(token)`, nunca `service_role`).
- Rate limiting por IP (`Flask-Limiter`, más estricto en login/registro) y
  CORS configurable por `CORS_ORIGINS`.
- Checklist JWT + RLS automatizado: `python backend/scripts/demo_rls.py <URL>`.
- Checklist OWASP: `docs/CHECKLIST_OWASP.md`.

## Docs

- `docs/DEPLOY_RENDER.md` — Render (gunicorn `wsgi:app`) + Supabase (RLS) + Cloudflare Pages.
- `docs/schema.sql` y `docs/schema_taskflow.sql` — esquemas PostgreSQL/Supabase.
- `docs/GreenLight_Postman.json` y `docs/TaskFlow_Postman.json` — colecciones Postman.
- `docs/TEST_CASES.md` y `docs/PERFORMANCE_ACCESSIBILITY.md` — pruebas y
  presupuesto Lighthouse/WCAG (300–500 KB, ≥ 90).

## Git — Ramas

```text
main  → rama estable
dev   → rama de desarrollo (actual)
```