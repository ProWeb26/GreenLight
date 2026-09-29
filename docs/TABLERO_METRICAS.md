# Tablero de métricas de sostenibilidad — GreenLight

Consigna de la Fase 3 (Operación): *generar tablero de métricas de sostenibilidad*.
Este documento es el respaldo escrito del tablero; la versión interactiva está en la
ruta **`/sostenibilidad`** del frontend y se alimenta de dos fuentes:

| Fuente | Qué aporta | Cómo se genera |
|--------|-----------|----------------|
| `GET /api/sostenibilidad` | uptime, latencia SQL, costo, licencias, controles de seguridad, operación | En vivo, en cada visita a la ruta |
| `dist/metricas-build.json` | peso real de cada archivo del build, Lighthouse | `npm run build` (automático) |

Complementa a `docs/PERFORMANCE_ACCESSIBILITY.md` (presupuesto y WCAG) y
`docs/PLAN_GOBERNANZA.md` (quién responde a cada métrica).

---

## 1. Presupuesto de la consigna frente a lo medido

Medición tomada el **29/09/2026** sobre el build de producción
(`VITE_BASE=/GreenLight/`, `VITE_API_URL=https://greenlight-api-a487.onrender.com/api`).

| Indicador | Presupuesto | Medido | Cumplimiento |
|-----------|:-----------:|:------:|:------------:|
| Peso total servido (gzip) | ≤ 500 kB | **156.79 kB** | ✅ 31 % del presupuesto |
| Carga inicial (gzip) | ≤ 500 kB | **96.72 kB** | ✅ 19 % del presupuesto |
| Lighthouse Performance | ≥ 90 | *sin auditar* | ⚠️ pendiente |
| Lighthouse Accessibility | ≥ 90 | *sin auditar* | ⚠️ pendiente |
| Lighthouse Best Practices | ≥ 90 | *sin auditar* | ⚠️ pendiente |
| Lighthouse SEO | ≥ 90 | *sin auditar* | ⚠️ pendiente |
| WCAG 2.1 | Nivel AA | documentado | ✅ `PERFORMANCE_ACCESSIBILITY.md` §2 |
| Costo de infraestructura | 0 Bs | **0 Bs** | ✅ |
| Licencias propietarias | 0 | **0** | ✅ MIT / BSD / PostgreSQL |

### Criterio de medición

El presupuesto de **300–500 kB** se evalúa sobre **gzip**, que es lo que el
vecino descarga realmente por su red móvil; el peso bruto se reporta también para
no ocultar el dato. Es la decisión #7 del registro de gobernanza. Con gzip, el
sitio completo pesa un tercio de lo permitido; sin comprimir serían 508 kB, apenas
por encima del techo de 500 kB.

### Desglose del build (gzip)

| Archivo | gzip | Nota |
|---------|-----:|------|
| `index-*.js` (vendor + app) | 85.17 kB | React 19, router, iconos SVG inline |
| `mapa-*.js` | 42.59 kB | Leaflet, **cargado solo en `/mapa`** |
| `index-*.css` | 10.99 kB | Tailwind v4, solo utilidades usadas |
| `Sostenibilidad-*.js` | 3.19 kB | este tablero |
| resto (8 chunks de ruta) | ~13 kB | `React.lazy` por página |
| HTML + iconos + favicon | ~5 kB | — |

La decisión que sostiene este número es el **code-splitting por ruta**
(`React.lazy` en `frontend/src/App.jsx:7-11`): un vecino que solo lee el feed
nunca descarga Leaflet ni el panel de administración.

### Cómo auditar Lighthouse

Lighthouse necesita Google Chrome, que no está disponible en el entorno donde se
generó esta medición. Cuando Chrome esté instalado:

```powershell
cd frontend
npm run build
npm run auditar        # levanta vite preview, corre lighthouse, deja public/lighthouse.json
npm run build          # vuelve a volcar las métricas con el informe incluido
```

`dist/metricas-build.json` lee `public/lighthouse.json` si existe y el tablero
muestra las cuatro categorías con semáforo. Sin ese archivo, el tablero lo dice
explícitamente en vez de mostrar un 0.

---

## 2. Operación del despliegue

Medido contra `https://greenlight-api-a487.onrender.com` desde la red del equipo:

| Métrica | Valor | Nota |
|---------|-------|------|
| Estado del servicio | `ok` | `GET /api/salud` → `{"status":"ok","database":"connected"}` |
| Base de datos | `connected` | Supabase PostgreSQL, región São Paulo |
| Latencia SQL | 1–15 ms | se mide por petición en `/api/sostenibilidad` |
| Latencia de la API | 200–800 ms | incluye el despertar del servicio tras hibernación |
| Uptime del proceso | reinicia en cada deploy | se muestra en el tablero, no hay histórico |
| CORS | `access-control-allow-origin: https://proweb26.github.io` | solo el origen real del frontend |
| Plan | Render `free` | 0 Bs; hiberna tras 15 min sin tráfico |

Los tokens se verificaron contra producción (11/11):

```
sin token / basura / alterado   -> 401
usuario en endpoint de admin    -> 403
coordinador en endpoint de admin -> 200
```

---

## 3. Operación social del sistema

Los contadores que muestra el tablero vienen de `stats_globales()`:

| Indicador | Para qué sirve en la gobernanza |
|-----------|----------------------------------|
| Reportes totales | dimensionar la carga de moderación |
| Reportes por estado | ver si el ciclo `activo → confirmado_comunidad → verificado` avanza o se atasca |
| Reportes por tipo | detectar si un tipo de incidente domina (prioridad operativa) |
| Confirmaciones | auditar el umbral de 3 antes de que un reporte sea `verificado` |
| Usuarios / comunidades | dimensionar el crecimiento y decidir cuándo migrar de SQLite a un plan pago |

**Métrica que la consigna de Inception pedía y el MVP no tiene:** `co2_ppm` por
visita de verificación. Está registrada como pendiente en la gobernanza (§9) porque
es el indicador de sostenibilidad *ambiental* más directo, y el tablero de
*sostenibilidad web* no lo sustituye.

---

## 4. Cómo mantener el tablero al día

| Quiero… | Comando / acción |
|---------|------------------|
| Regenerar el peso tras tocar el frontend | `npm run build` (en `frontend/`) |
| Ver solo el peso, sin reconstruir | `npm run medir` |
| Adjuntar Lighthouse | `npm run auditar` y luego `npm run build` |
| Publicar el tablero | `git push` → `.github/workflows/deploy-pages.yml` dispara solo |
| Verificar el backend en producción | `curl https://greenlight-api-a487.onrender.com/api/sostenibilidad` |
| Regenerar datos de ejemplo | `cd backend && python seed.py` |

El build de GitHub Pages ejecuta `npm run build`, que ya incluye la medición, así
que **el JSON de métricas se publica en cada despliegue sin pasos extra**.
