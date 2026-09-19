# GreenLight — Casos de Prueba

Documento de pruebas de **GreenLight** (API Flask + frontend React) y de la
API **TaskFlow**. La capa de automatización son los tests `pytest`; abajo se
listan los casos manuales para Postman / PowerShell.

## Backends

| Proyecto   | Carpeta   | Pruebas                 | Servidor             |
|------------|-----------|-------------------------|----------------------|
| GreenLight | `backend` | `python -m pytest` (35) | `http://localhost:5000/api` |
| TaskFlow   | `taskflow`| `python -m pytest` (19) | `http://localhost:5000/api` |

Usuarios de GreenLight: `coordinador@greenlight.test / Coordi123!`,
`maria@greenlight.test` y `carlos@greenlight.test` con `Vecino123!`.

## Colecciones Postman

- `docs/GreenLight_Postman.json`: auth, feed, reportes, confirmar, estado,
  sync, stats, comunidades, tipo-incidentes.
- `docs/TaskFlow_Postman.json`: health, users CRUD, tasks CRUD, complete,
  completed, tasks del usuario, stats.

## Casos automatizados (GreenLight — 35)

1. Health check `200` con `database: connected`.
2. Registro: éxito `201` (token + usuario), correo duplicado `409`, correo
   inválido `422`, contraseña corta `422`.
3. Login: éxito `200`, credenciales incorrectas `403`, campo faltante `422`.
4. `/auth/me`: válido `200`, sin token `401`, token inválido `401`.
5. `/auth/usuarios`: como coordinador `200`, como usuario `403`, sin token `401`.
6. Feed: público `200`; filtros por `tipo_id`, `comunidad_id`, `estado`.
7. Reportes: crear `201` (slugs únicos `ECO-####`), título/descripción validados
   `422`, reporte inexistente `404`.
8. Actualizar reporte: autor `200`, otro usuario `403`, desconocido `404`.
9. Eliminar reporte: autor/coordinador `200`, sin permiso `403`.
10. Confirmar: sumar `+1`, repetir `409`, umbral 3 promueve a
    `confirmado_comunidad`.
11. Cambiar estado: solo coordinador `200`, usuario `403`, estado inválido `422`.
12. `/sync`: envía reportes + confirmaciones en lote `201`.
13. `/stats`: `200` con totales.
14. Comunidades y tipo-incidentes: lectura pública; escritura solo coordinador.

## Casos automatizados (TaskFlow — 19)

1. `/api/health` `200`.
2. Users CRUD: crear `201`, listar `200`, obtener `200`, actualizar `200`,
   eliminar `200`; email duplicado `409`, email inválido `422`, usuario
   inexistente `404`.
3. Tasks CRUD: crear `201` (prioridad por defecto `media`), listar `200`,
   obtener `200`, actualizar `200`, eliminar `200`; tarea sin usuario `422`
   (o `404`), tarea inexistente `404`.
4. `PATCH /api/tasks/{id}/complete`: `200` marca completada.
5. `GET /api/tasks/completed`: `200` (solo las completadas).
6. `GET /api/users/{id}/tasks`: `200` con las tareas del usuario.
7. `GET /api/users/{id}/stats`: `200` con `total`, `completadas`, `pendientes`
   y `por_prioridad`.
8. Persistencia: los datos sobreviven al reinicio del proceso (SQLite/Postgres).

## Casos manuales rápido (GreenLight)

```powershell
$BASE = "http://localhost:5000/api"

# Login y token
$login = Invoke-RestMethod -Uri "$BASE/auth/login" -Method Post -ContentType "application/json" `
  -Body '{"correo":"maria@greenlight.test","contraseña":"Vecino123!"}'
$token = $login.token
$H = @{ Authorization = "Bearer $token" }

# Feed público
Invoke-RestMethod -Uri "$BASE/feed"

# Crear reporte
$r = Invoke-RestMethod -Uri "$BASE/reportes" -Headers $H -Method Post -ContentType "application/json" `
  -Body '{"tipo_id":2,"ubicacion_texto":"Vereda El Roble, km 4","descripcion":"Humo denso en el monte."}'

# Confirmar
Invoke-RestMethod -Uri "$BASE/reportes/$($r.id)/confirmar" -Headers $H -Method Post

# Stats
Invoke-RestMethod -Uri "$BASE/stats"
```

### Verificación de errores esperados

| Prueba                       | Request                                | Esperado |
|------------------------------|----------------------------------------|----------|
| Correo duplicado (registro)  | `POST /auth/registro` con `maria@…`    | 409      |
| Contraseña débil             | `POST /auth/registro` `{"contraseña":"abc"}` | 422 |
| Confirmar dos veces          | `POST /reportes/{id}/confirmar` x2     | 1er 200 / 2do 409 |
| Usuario confirma su reporte  | confirmar con el propia token          | 409      |
| Estado no válido             | `PATCH /reportes/{id}/estado` `{"estado":"x"}` | 422 |
| Reporte inexistente          | `GET /reportes/no-existe`              | 404      |

## Verificación del frontend (UI)

1. `http://localhost:5173/login` — credenciales inválidas muestran error por campo.
2. Login `coordinador` → `/feed` y aparece el enlace **Administración**.
3. `/reportar`: envía sin conexión (DevTools: offline) → banner amarillo y el
   reporte queda en la cola; al volver a online la barra muestra
   "X reporte(s) pendiente(s)" → **Sincronizar ahora**.
4. En `/feed`: botón **Confirmar +1**; al confirmar cambia a "Confirmado".
5. Como `usuario`, `/admin` redirige a `/feed` (solo coordinador).
6. Navegación completa con **solo teclado** (Tab/Enter) y foco visible naranja.
7. En móvil (< 768 px): layout de una columna, navegación en fila (mobile-first).