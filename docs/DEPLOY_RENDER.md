# Despliegue de GreenLight (Render + GitHub Pages + Supabase)

El backend definitivo de la materia es **Flask** (gunicorn en Render) y el
frontend **React + Vite** se publica en **GitHub Pages** con
`.github/workflows/deploy-pages.yml` (Cloudflare Pages y Render como alternativas
documentadas abajo). Hay **dos APIs**:

| Servicio         | Carpeta   | Tec | Descripción                         |
|------------------|-----------|-----|-------------------------------------|
| `greenlight-api` | `backend` | Flask | GreenLight: reporte de quemas (auth JWT) |
| `taskflow-api`   | `taskflow`| Flask | TaskFlow: tareas por usuario (Plan Postman), opcional |

---

## 0. Estado verificado del despliegue (29/09/2026)

| Componente | URL | Estado |
|------------|-----|--------|
| API GreenLight (Render) | `https://greenlight-api-a487.onrender.com/api` | ✅ 200, base de datos `connected` |
| Frontend (GitHub Pages) | `https://proweb26.github.io/GreenLight/` | ✅ 200 |
| Tablero de sostenibilidad | `https://proweb26.github.io/GreenLight/sostenibilidad` | ✅ ruta `/sostenibilidad` |
| Swagger UI | `https://greenlight-api-a487.onrender.com/api/docs` | ✅ |
| Frontend (Render static) | `https://greenlight-web.onrender.com` | ⚠️ declarado en `render.yaml`, **pendiente de aplicar** |
| `taskflow-api` (Render) | — | ⚠️ declarado en `render.yaml`, opcional |
| `mini-task-manager-api` | — | No creado; laboratorio de clase |

### Cerrar el requisito "producción en Render o Cloudflare"

La consigna pide el despliegue en **Render o Cloudflare**. El frontend ya está
publicado en GitHub Pages, que es un hosting válido pero no es ninguno de los dos
nombrados. Para cumplir al pie de la letra hay dos caminos, ambos con la config
ya lista en el repo:

**Camino A — Render (recomendado, un clic).** `render.yaml` declara `greenlight-web`
como `static_site`. En [render.com](https://render.com) → **New → Blueprint** →
selecciona el repo → **Apply**. Se crean `greenlight-api`, `greenlight-web` y
`taskflow-api`, y el frontend queda en `https://greenlight-web.onrender.com`.
Después solo hay que añadir `https://greenlight-web.onrender.com` a `CORS_ORIGINS`
del API (ya viene en el blueprint) y hacer *Deploy latest commit*.

**Camino B — Cloudflare Pages.** Instrucciones en la sección 3, opción C. Requiere
conectar el repo en el panel de Cloudflare; no se puede hacer por API sin tu
cuenta.

> Si prefieres quedarte solo con GitHub Pages, dilo y quito `greenlight-web` del
> blueprint; pero entonces el frontend no está en Render ni en Cloudflare.

`GET /api` devuelve 404 a propósito: no hay índice en el prefijo. Los puntos de
entrada son `/`, `/api/salud`, `/api/sostenibilidad`, `/api/docs` y `/api/feed`.

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

### Opción A (la que está en producción): GitHub Pages

El workflow `.github/workflows/deploy-pages.yml` dispara en cada `push` a `main` o
`dev` y publica `frontend/dist` en `https://proweb26.github.io/GreenLight/`:

1. En el repositorio, **Settings → Pages → Source → GitHub Actions**.
2. El `base` de Vite y la URL de la API viajan como variables del workflow:
   ```yaml
   env:
     VITE_BASE: /GreenLight/
     VITE_API_URL: https://greenlight-api-a487.onrender.com/api
   ```
3. Como `base` es un subdirectorio, `CORS_ORIGINS` en el API debe permitir
   `https://proweb26.github.io` (**sin** la ruta `/GreenLight/`), porque el origen
   no incluye la ruta.
4. El SPA fallback se resuelve copiando `index.html` a `404.html` en el mismo paso.
5. `npm run build` ya incluye la medición de peso, así que `dist/metricas-build.json`
   se publica en cada despliegue y el tablero `/sostenibilidad` siempre está al día.

> El origen de GitHub Pages es `https://proweb26.github.io`; `https://proweb26.github.io/`
   devuelve 404 porque el sitio vive bajo `/GreenLight/`.

### Opción B: web service en Render con SPA fallback

Un web service en Render sirve `frontend/dist` con `frontend/server.py` (Python,
sin dependencias), devolviendo `index.html` en las rutas desconocidas:

- `rootDir`: `frontend`
- Build: `npm install && npm run build`
- Start: `python server.py`
- Env var: `VITE_API_URL = https://greenlight-api-a487.onrender.com/api`
- Y en el API, `CORS_ORIGINS` debe incluir `https://<nombre>.onrender.com`

Está comentada en `render.yaml` para no duplicar el despliegue.

### Opción C: Cloudflare Pages

1. En [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages → Create → Pages → Connect to Git**.
2. Repositorio, framework **Vite**, directorio raíz `frontend`, build `npm run build`, output `dist`.
3. **Variables de entorno** (framework preset), con la URL final de la API:
   ```
   VITE_API_URL = https://greenlight-api-a487.onrender.com/api
   VITE_BASE    = /
   ```
4. **Save and Deploy**. Las rutas SPA (`/feed`, `/reportar`, `/sostenibilidad`, `/admin`, etc.)
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

## 6. Verificación posterior al despliegue

```powershell
# Salud y base de datos
curl https://greenlight-api-a487.onrender.com/api/salud

# Tablero de métricas de sostenibilidad
curl https://greenlight-api-a487.onrender.com/api/sostenibilidad

# El CORS debe devolver solo el origen del frontend
curl -I -H "Origin: https://proweb26.github.io" https://greenlight-api-a487.onrender.com/api/salud

# Frontend publicado
curl -o NUL -w "%{http_code}" https://proweb26.github.io/GreenLight/
```

Tokens verificados contra producción: sin token / token basura / token alterado → **401**;
usuario en endpoint de administrador → **403**; coordinador → **200**.