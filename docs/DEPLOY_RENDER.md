# Despliegue de GreenLight (Flask + Supabase)

El backend definitivo de la materia es **Flask** (gunicorn en Render) y el
frontend **React + Vite** se publica en Render con `frontend/server.py` (SPA
con fallback a `index.html`; Cloudflare Pages también está documentado como
opción). Hay **dos APIs**:

| Servicio         | Carpeta   | Tec | Descripción                         |
|------------------|-----------|-----|-------------------------------------|
| `greenlight-api` | `backend` | Flask | GreenLight: reporte de quemas (auth JWT) |
| `taskflow-api`   | `taskflow`| Flask | TaskFlow: tareas por usuario (Plan Postman) |
| `greenlight-web` | `frontend`| React | Frontend GreenLight (Vite + Tailwind) |

> El blueprint `render.yaml` de la raíz crea `greenlight-api`, `taskflow-api` y
> `greenlight-web` si se usa Render para todo.

---

## 1. Preparar Supabase (PostgreSQL)

1. Crea un proyecto en [supabase.com](https://supabase.com) (región São Paulo).
2. Abre **SQL Editor** y ejecuta:
   - `docs/schema.sql` para GreenLight (esquema de la API) y
     `docs/schema_taskflow.sql` para TaskFlow.
   - `backend/sql/01_esquema_y_rls.sql` para activar **RLS** (políticas por
     operación con `auth.uid()`) y verificar al final `rowsecurity = true`
     con las 9 políticas.
3. Copia la cadena **Session pooler** (`postgresql://...@...:5432/postgres`)
   como `DATABASE_URL` (`backend/config.py`) y las credenciales **anon /
   publishable** (`SUPABASE_URL` y `SUPABASE_KEY`) para `supabase_client.py`.

> **Seguridad (RLS):** las consultas en nombre del usuario van por
> `supabase_client.cliente_usuario(token)` — un cliente por petición con el
> JWT del usuario (`Authorization: Bearer`), el dueño de cada fila lo define la
> BD (`DEFAULT auth.uid()`), y **nunca** se usa `service_role`. Los checks de
> rol y permisos que necesitan un usuario "coordinador" se mantienen en la capa
> de la API (JWT firmado con `SECRET_KEY`).

## 2. Desplegar las APIs en Render

1. Empuja el repo (rama `dev`) a GitHub.
2. En [render.com](https://render.com) → **New → Blueprint** → selecciona el repo → **Apply**.
   Render detecta `render.yaml` y crea los dos web services.
3. En cada servicio **Environment** agrega los secretos `DATABASE_URL`,
   `SUPABASE_URL` y `SUPABASE_KEY`; fija `CORS_ORIGINS` con el origen del
   frontend (el blueprint ya trae `https://greenlight-web.onrender.com`) y,
   opcional, `RATE_LIMIT_DEFAULT` / `RATE_LIMIT_AUTH`.
4. **Deploy latest commit**.

Verificaciones:

```powershell
curl https://greenlight-api-a487.onrender.com/api/salud
curl https://greenlight-api-a487.onrender.com/api/docs   # Swagger UI
curl https://taskflow-api.onrender.com/api/health
```

Checklist JWT + RLS contra la API desplegada:

```powershell
cd backend && python scripts/demo_rls.py https://greenlight-api-a487.onrender.com
```

> Arranque en Render: `gunicorn wsgi:app --bind 0.0.0.0:$PORT --workers 2
> --timeout 120` (healthcheck en `/api/salud`). Nota Render/Python: el runtime
> usa Python 3.13 y lee `requirements.txt`. El driver de Postgres es
> **psycopg v3** (`psycopg[binary]`), compatible también con Python 3.14. La
> API acepta la cadena `postgresql://...` de Supabase tal cual: `config.py` la
> normaliza a `postgresql+psycopg://`.

## 3. Publicar el frontend

### Opción A (recomendada): web service en Render con SPA fallback

Un web service en Render sirve `frontend/dist` con `frontend/server.py` (Python,
sin dependencias), devolviendo `index.html` en las rutas desconocidas para que
las rutas SPA (`/feed`, `/reportar`, `/admin`, ...) funcionen al refrescar:

- `rootDir`: `frontend`
- Build: `npm install && npm run build`
- Start: `python server.py`
- Env var: `VITE_API_URL = https://greenlight-api-a487.onrender.com/api`

### Opción B: Cloudflare Pages

1. En [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages → Create → Pages → Connect to Git**.
2. Repositorio, framework **Vite**, build `npm run build`, output directorio `dist`.
3. **Variables de entorno** (framework preset), con la URL final de la API:
   ```
   VITE_API_URL = https://greenlight-api-a487.onrender.com/api
   ```
4. **Save and Deploy**. Las rutas SPA (`/feed`, `/reportar`, `/admin`, etc.)
   ya funcionan gracias al archivo `frontend/public/_redirects`.

## 4. Datos de prueba en producción

Al crear la base vacía los endpoints funcionan; para sembrar datos de ejemplo
ejecuta una vez dentro de la carpeta `backend` (o el equivalente por consola
del despliegue):

```powershell
python seed.py
```

Usuarios: `coordinador@greenlight.test / Coordi123!`, `maria@greenlight.test` /
`carlos@greenlight.test` con `Vecino123!`.

## 5. Pruebas con Postman

Las colecciones `docs/GreenLight_Postman.json` y `docs/TaskFlow_Postman.json`
cubren todos los endpoints. Solo edita `base_url` para apuntar a Render.