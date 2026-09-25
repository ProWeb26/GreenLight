# Checklist OWASP — GreenLight API

Cumplimiento de controles de seguridad (API REST con Flask + Supabase/RLS +
JWT). Estado: listo / pendiente.

## OWASP API Security Top 10 — 2023

| # | Riesgo | Control implementado | Estado |
|---|--------|----------------------|--------|
| API1 | Broken Object Level Authorization | RLS en Supabase (`auth.uid() = usuario_auth`); la API además verifica autor/coordinador antes de PATCH/DELETE (`services.actualizar_reporte`, `eliminar_reporte`). El cliente no puede inyectar `user_id`: el autor sale del token (`g.usuario.id`). | ✅ Listo |
| API2 | Broken Authentication | JWT firmado con `SECRET_KEY` (HS256), expiración `JWT_EXPIRATION_MINUTES`; token ausente/inválido/altered → 401. Contraseñas con `werkzeug.security` (hash salado). Login expone error genérico "Credenciales incorrectas". | ✅ Listo |
| API3 | Broken Object Property Level Authorization | Whitelist de campos por endpoint (`services.modelo_columnas`, `actualizar_reporte` ignora campos desconocidos, `user_id` nunca se acepta del body). | ✅ Listo |
| API4 | Unrestricted Resource Consumption | `MAX_CONTENT_LENGTH = 10 MB` en `config.py`; límites mínimos de longitud en nombre/contraseña/descripción. | ⚠️ Parcial (recomendado: rate limiting) |
| API5 | Broken Function Level Authorization | `@rol_requerido("coordinador")` en rutas de admin y cambio de estado; 403 si no es coordinador. | ✅ Listo |
| API6 | Unrestricted Access to Sensitive Business Flows | Sync de lote requiere token; confirmación única por usuario (constraint `uq_confirmacion_reporte_usuario`). | ✅ Listo |
| API7 | Server-Side Request Forgery (SSRF) | No se aceptan URLs a ser fetcheadas por el servidor (`foto_url` solo se almacena/valida hasta 500 chars). | ✅ Listo |
| API8 | Security Misconfiguration | `SECRET_KEY` por variable de entorno (Render la genera); CORS abierto solo para la SPA en construcción; `JSON_AS_ASCII=False`. | ⚠️ Parcial (afinar CORS por origen) |
| API9 | Improper Inventory Management | `/api/docs` expone solo la API pública; versionado implícito en `openapi.yaml`. Documentación Swagger accesible en `/api/docs`. | ✅ Listo |
| API10 | Unsafe Consumption of APIs | La API no encadena llamadas a APIs externas client-side; el cliente Supabase usa ta clave anon + JWT del usuario (nunca service_role). | ✅ Listo |

## Checklist OWASP clásica (código)

- [x] Autenticación por token Bearer (JWT), no cookies.
- [x] Invalidar token alterado/vencido → 401, no 200.
- [x] No exponer el `SECRET_KEY` ni credenciales en el repo (`.gitignore` cubre `.env`).
- [x] Validación de entrada en el servidor (422) incluso si el cliente la hace.
- [x] Error 500 genérico sin trazas internas al cliente (`Error interno del servidor`).
- [x] Código de respuesta correcto: 401 (autenticación) vs 403 (autorización).
- [x] Contraseñas almacenadas con hash (werkzeug `generate_password_hash`).
- [x] Relaciones con `ondelete`/cascade seguras y unicidad de confirmaciones.
- [x] RLS en la base (ver `backend/sql/01_esquema_y_rls.sql`).
- [ ] (Pendiente) Rate limiting por IP/usuario — recomendado en producción.
- [ ] (Pendiente) CORS restringido al origen del frontend desplegado.

## Notas para pruebas de uso

- El JWT de la API (firma HS256 con `SECRET_KEY`) **no pasa** la validación de
  Supabase (firma/`aud`/`iss`): para RLS con `auth.uid()` se usa el JWT
  emitido por **Supabase Auth**. La capa de aplicación acepta su propio JWT
  para los roles usuario/coordinador.
- En local con SQLite no aplica RLS: se testean los checks de autorización de
  la capa API (autor/coordinador). Para RLS real se usan los scripts de
  `backend/sql/` y el cliente `supabase_client.cliente_usuario(token)` en
  producción.