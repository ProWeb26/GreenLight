# GreenLight API - Casos de Prueba

Sistema: Mini Task Manager adaptado a reportes (arquitectura de 5 capas).
Autenticación: JWT emitido por una **API simulada de autenticación** (usuarios mock en `backend/src/data/mockUsers.js`).

## Usuarios mock

| Username | Password     | Rol    | Uso                          |
|----------|--------------|--------|------------------------------|
| `admin`  | `Admin123!`  | admin  | Acceso total, puede eliminar |
| `vecino` | `Vecino123!` | vecino | Solo crea y consulta (403 en DELETE) |

## Base URL

```
Backend:  http://localhost:3000/api
Frontend: http://localhost:5174 (Vite)
```

Toda petición a `/reportes` debe incluir el header:

```
Authorization: Bearer <token>
```

---

## Caso 1: Login exitoso
- `POST /api/auth/login`
- Body: `{ "username": "admin", "password": "Admin123!" }`
- Esperado: **200** con `token` (JWT) y `user`.

## Caso 2: Login con credenciales inválidas
- `POST /api/auth/login`
- Body: `{ "username": "admin", "password": "incorrecta" }`
- Esperado: **401** `{ "error": "Credenciales inválidas...", "field": "password" }`

## Caso 3: Login sin campos obligatorios
- `POST /api/auth/login`
- Body: `{ "username": "" }`
- Esperado: **400** con `field: "password"` (falta contraseña).

## Caso 4: GET /reportes sin token
- `GET /api/reportes` (sin header `Authorization`)
- Esperado: **401** `{ "error": "Acceso no autorizado. Se requiere un token de acceso." }`

## Caso 5: GET /reportes con token inválido
- Header: `Authorization: Bearer token.falso.123`
- Esperado: **401** `{ "error": "Token inválido o expirado." }`

## Caso 6: GET /reportes con token válido
- Login previo (Caso 1) y usar su token.
- Esperado: **200** `{ "data": [...] }`

## Caso 7: POST /reportes con token válido
- Header con token; body con los campos obligatorios.
- Esperado: **201** `{ "message": "Reporte creado exitosamente.", "data": {...} }`

## Caso 8: POST /reportes con campo vacío
- Body sin `ubicacion_texto` (o vacío).
- Esperado: **400** `{ "error": "El campo \"ubicacion_texto\" es obligatorio.", "field": "ubicacion_texto" }`

## Caso 9: POST /reportes con regla de negocio violada
- `ubicacion_texto` con menos de 5 caracteres, p. ej. `"casa"`.
- Esperado: **422** `{ "error": "La descripción de la ubicación debe tener al menos 5 caracteres.", "field": "ubicacion_texto" }`

## Caso 10: POST /reportes con coordenadas fuera de rango
- `latitud: 200` → Esperado: **422** con `field: "latitud"`.

## Caso 11: DELETE como administrador
- Login con `admin`, `DELETE /api/reportes/:id` con su token.
- Esperado: **200** `{ "message": "Reporte eliminado exitosamente." }`

## Caso 12: DELETE como vecino (prohibido por rol)
- Login con `vecino`, `DELETE /api/reportes/:id` con su token.
- Esperado: **403** `{ "error": "Acceso denegado. Se requiere el rol \"admin\"." }`

---

## Cómo ejecutarlas (PowerShell)

```powershell
$BASE = "http://localhost:3000/api"

# Login
$login = Invoke-RestMethod -Uri "$BASE/auth/login" -Method Post `
  -ContentType "application/json" -Body '{"username":"admin","password":"Admin123!"}'
$token = $login.token
$H = @{ Authorization = "Bearer $token" }

# Listar
Invoke-RestMethod -Uri "$BASE/reportes" -Headers $H

# Crear
Invoke-RestMethod -Uri "$BASE/reportes" -Headers $H -Method Post `
  -ContentType "application/json" `
  -Body '{"comunidad_id":"...","usuario_id":"...","tipo_id":1,"ubicacion_texto":"Plaza central","latitud":-33.4489,"longitud":-70.6693}'
```