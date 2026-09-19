# Despliegue de GreenLight (Flask + Supabase + Cloudflare)

El backend definitivo de la materia es **Flask** (gunicorn en Render) y el
frontend **React + Vite** se publica en **Cloudflare Pages** (también queda
listo el blueprint para Render). Hay **dos APIs**:

| Servicio         | Carpeta   | Tec | Descripción                         |
|------------------|-----------|-----|-------------------------------------|
| `greenlight-api` | `backend` | Flask | GreenLight: reporte de quemas (auth JWT) |
| `taskflow-api`   | `taskflow`| Flask | TaskFlow: tareas por usuario (Plan Postman) |
| `greenlight-web` | `frontend`| React | Frontend GreenLight (Vite + Tailwind) |

> El blueprint `render.yaml` de la raíz crea `greenlight-api`, `taskflow-api` y
> `greenlight-web` si se usa Render para todo. La guía del profesor usa
> **Render (API) + Cloudflare Pages (frontend)**, que es lo que se documenta abajo.

---

## 1. Preparar Supabase (PostgreSQL)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Abre **SQL Editor** y ejecuta:
   - `docs/schema.sql` para GreenLight.
   - `docs/schema_taskflow.sql` para TaskFlow.
3. Copia la cadena **Session pooler** (`postgresql://...@...:5432/postgres`).
   La API la lee de la variable `DATABASE_URL` (`backend/config.py`).

> La API usa el rol `service_role` (RLS no aplica). Los checks de rol y
> permisos los hace la propia API con JWT (PyJWT).

## 2. Desplegar las APIs en Render

1. Empuja el repo (rama `dev`) a GitHub.
2. En [render.com](https://render.com) → **New → Blueprint** → selecciona el repo → **Apply**.
   Render detecta `render.yaml` y crea los dos web services.
3. En cada servicio **Environment** agrega el secreto `DATABASE_URL` (Session pooler de Supabase).
4. **Deploy latest commit**.

Verificaciones:

```powershell
curl https://greenlight-api.onrender.com/api/health
curl https://taskflow-api.onrender.com/api/health
```

> Nota Render/Python: el runtime usa Python 3.13 y lee `requirements.txt`.
> Si `psycopg2-binary` falla al instalar, sustitúyelo por `psycopg[binary]`.

## 3. Publicar el frontend en Cloudflare Pages

1. En [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages → Create → Pages → Connect to Git**.
2. Repositorio, framework **Vite**, build `npm run build`, output directorio `dist`.
3. **Variables de entorno** (framework preset), con la URL final de la API:
   ```
   VITE_API_URL = https://greenlight-api.onrender.com/api
   ```
4. **Save and Deploy**. Las rutas SPA (`/feed`, `/reportar`, `/admin`, etc.)
   ya funcionan gracias al archivo `frontend/public/_redirects`.

> Alternativa: desplegar el estático también en Render (servicio `greenlight-web`
> del blueprint) y ajustar `VITE_API_URL` en su entorno.

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