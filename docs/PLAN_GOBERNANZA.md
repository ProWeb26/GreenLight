# Plan de gobernanza — GreenLight

Consigna de la Fase 3 (Operación): definir quién decide, quién responde y con
qué reglas se administra la plataforma **después** de entregada. Este documento
complementa al tablero de métricas (`/sostenibilidad` y `docs/TABLERO_METRICAS.md`):
el tablero dice **cuánto** consume y **cómo** va; este plan dice **quién responde**.

---

## 1. Alcance y principio rector

GreenLight es una red comunitaria de reporte de quemas y focos de humo para el
departamento de Santa Cruz, Bolivia. Se gobierna con tres principios, en este orden:

1. **Interés comunitario primero.** Ninguna decisión de producto o de datos puede
   perjudicar a las comunidades que reportan. El reporte falso o malicioso perjudica a
   la red entera, así que la moderación es un problema de interés público, no de
   "experiencia de usuario".
2. **Software libre y costo cero.** Toda la pila es libre y la infraestructura no
   tiene costo monetario. Cualquier propuesta que introduzca una licencia propietaria
   o un costo recurrente requiere aprobación explícita del coordinador y registro en
   la sección 7.
3. **Criterio humano sobre la salida de la IA.** La IA propone; el equipo audita y
   decide. El registro está en el Anexo A del informe de Inception y se mantiene el
   mismo criterio en esta fase (sección 6).

---

## 2. Actores, roles y responsabilidades

| Rol | Quién | Puede | No puede | Responsabilidad principal |
|-----|-------|-------|----------|---------------------------|
| **Coordinador** | equipo de desarrollo | CRUD de comunidades y tipos de incidente, cambiar estado de reportes, crear/baja de usuarios | Ver el código de los demás sin revisión | Moderar reportes, validar el estado `verificado`, custodiar `SECRET_KEY` |
| **Usuario (comunidad)** | cualquier vecino registrado | Crear reportes, confirmar reportes de otros, editar y borrar los propios | Confirmar dos veces el mismo reporte, editar reportes ajenos, tocar `/admin` | Aportar evidencia veraz y confirmar lo que ve |
| **Proveedor de infraestructura** | Render (free) + Supabase | Alojamiento | No accede a la lógica de negocio | Hibernar el servicio tras 15 min sin tráfico |
| **Equipo de desarrollo** | 2 estudiantes + docente | Código, esquema, despliegue | Modificar datos de producción sin pasar por revisión | Entregar, auditar y mantener |

**Principio de separación:** el rol `coordinador` se verifica en la capa de la API
(`auth.rol_requerido`, `backend/auth.py:30`), no en el frontend. Un `usuario` que
manipule la interfaz sigue recibiendo 403.

### Línea de escalamiento

```
Vecino reporta foco
   └─> Moderación: 3 confirmaciones de usuarios distintos
          └─> Verificación: el coordinador valida y marca `verificado`
                 └─> Error en producción (500 / reporté y no aparece)
                        └─> Equipo de desarrollo (48 h como máximo)
```

---

## 3. Propiedad y clasificación del dato

| Dato | Titular | Clasificación | Retención | Base legal / razón |
|------|---------|---------------|-----------|---------------------|
| Correo y nombre de usuario | El propio usuario | Personal identificable | Mientras exista la cuenta + 30 días | Necesario para autenticar y para que el coordinador sepa a quién preguntar |
| Contraseña | El usuario | Secreto (hash) | N/A | Nunca se almacena en claro (`werkzeug.security.generate_password_hash`) |
| JWT | Sesión | Token de acceso | 120 minutos | `JWT_EXPIRATION_MINUTES`; se invalida al cerrar sesión o al expirar |
| Reporte (descripción, coordenadas) | El autor | Personal + geolocalizado | Permanente mientras sea útil | Es el propósito de la plataforma; es evidencia de un evento ambiental |
| Confirmaciones | El usuario que confirma | Personal | Permanente | Permite auditar la participación en el reporte y detectar cuentas automatizadas |
| Coordenadas | El autor del reporte | Geolocalización sensible | Permanente | Es el foco del reporte; se muestra en el mapa público |
| Evidencia (foto) *(no implementado)* | El autor | Personal | Pendiente de definir | Fuera del alcance del MVP |

**Decisión clave:** las coordenadas de un reporte se publican en el mapa sin
anonimizar, porque el valor del sistema es colectivo (saber dónde hay fuego) y no
individual. La compensación es que **el autor puede editar o borrar su reporte en
cualquier momento** desde "Mis reportes", y la eliminación borra también sus
confirmaciones.

---

## 4. Seguridad de la información en operación

| Control | Implementación | Verificación |
|---------|----------------|--------------|
| Autenticación | JWT HS256 firmado con `SECRET_KEY` | 11 casos de prueba contra producción: sin token / basura / alterado → 401; rol insuficiente → 403 |
| Rol | `usuario` / `coordinador` en `Usuario.rol` | `GET /api/auth/usuarios` devuelve 403 a un usuario y 200 al coordinador |
| Aislamiento de fila (RLS) | 9 políticas Supabase (`backend/sql/01_esquema_y_rls.sql`), el cliente usa el JWT del usuario y **nunca** `service_role` | `backend/scripts/demo_rls.py` |
| Límite de intentos | `Flask-Limiter`: 30/min en login y registro, 2000/h global | 429 al superarlo |
| CORS | Solo el origen del frontend real (`https://proweb26.github.io`) | `access-control-allow-origin` en respuesta |
| Checklist OWASP | `docs/CHECKLIST_OWASP.md` | — |

### Gestión de secretos

- `SECRET_KEY`, `DATABASE_URL`, `SUPABASE_URL` y `SUPABASE_KEY` **solo** viven como
  variables de entorno en Render. `backend/.env` está en `.gitignore` y contiene
  valores de desarrollo, uno de ellos placeholder: `cambia-este-secreto-en-produccion`.
  En producción Render la genera el propio Blueprint (`generateValue: true`).
- **Ninguna consulta directa a la base de datos usa `service_role`**; el
  `supabase_client.cliente_usuario(token)` propaga el JWT del usuario, de modo que
  la base de datos aplica sus propias políticas aunque la API quedara expuesta.
- Rotación de `SECRET_KEY`: invalida todos los JWT emitidos. Procedimiento: generar
  valor nuevo en Render → *Deploy* → los usuarios vuelven a iniciar sesión. Frecuencia
  recomendada: cada 6 meses o ante cualquier sospecha de filtración.

---

## 5. Operación, disponibilidad y costo

| Decisión | Valor | Justificación |
|----------|-------|---------------|
| Plan de Render | `free` | Requisito de costo 0 Bs de la consigna |
| Workers de gunicorn | 2 | Suficiente para el volumen esperado; permite mantenimiento sin downtime total |
| Healthcheck | `GET /api/salud` | Render reinicia el proceso si la base de datos no responde |
| Hibernación | Aceptada | El plan free duerme tras 15 min sin tráfico. El primer request puede tardar ~50 s. Es un compromiso consciente: **0 Bs a cambio de latencia en el primer request** |
| Base de datos | Supabase PostgreSQL, región São Paulo | Gratis, con RLS nativo, cerca del usuario objetivo |
| CORS | Orígenes explícitos, nunca `*` en producción | Principio de mínimo privilegio |

**Umbral de escalamiento:** si la comunidad crece y la latencia o el costo se
vuelven un problema, el orden de actuación es (1) subir de plan, (2) activar la
caché de `GET /feed` (los reportes son de solo lectura y cambian poco),
(3) particionar por comunidad. No se optimiza antes de tener medición, y el
tablero de `/sostenibilidad` existe justamente para decidir con datos.

---

## 6. Gobernanza del uso de Inteligencia Artificial

Misma política que el Anexo A del informe de Inception, extendida a la fase de
Operación:

1. **Toda salida de la IA se revisa antes de entrar a `main`.** Ningún commit
   generado por un modelo se sube sin que un miembro del equipo lo lea.
2. **La auditoría es explícita y queda registrada** (prompt, qué generó, y si se
   aceptó, modificó o rechazó, con el porqué). Ejemplo ya documentado: se rechazó un
   modelo de 10 entidades por exceder el alcance del MVP.
3. **La IA no toma decisiones de gobernanza.** No decide qué reporte se borra, quién
   es coordinador ni qué dato se publica. Eso es del equipo y de las reglas acordadas en
   las secciones 2 y 3.
4. **Datos sensibles fuera del modelo.** No se pegan correos, tokens ni
   `SECRET_KEY` en prompts externos.
5. **Auditorías de seguridad primero.** Si la IA propone un cambio en JWT, CORS,
   rate limiting, consultas SQL o dependencias, se revisa contra
   `docs/CHECKLIST_OWASP.md` antes de aceptarse.

---

## 7. Registro de decisiones

| # | Decisión | Fecha | Estado | Justificación |
|---|----------|-------|--------|---------------|
| 1 | Frontend en GitHub Pages y no en Render | 2026-09 | Vigente | Evita duplicar el despliegue; el build ya genera el JSON de métricas |
| 2 | Hibernación del plan free aceptada | 2026-09 | Vigente | Costo 0 Bs es requisito de la consigna |
| 3 | Entidades del MVP reducidas de 10 a 5 | 2026-09 | Vigente | Criterio de alcance (Anexo A del informe) |
| 4 | `Confirmacion` en lugar de un contador en `Reporte` | 2026-09 | Vigente | Una fila por usuario y reporte: auditable y compatible con RLS |
| 5 | Umbral de 3 confirmaciones | 2026-09 | Vigente | Evita que un reporte se confirme por duplicado de un mismo vecindario |
| 6 | Hoja de ruta sin librería de gráficas | 2026-09 | Vigente | Ahorra ~50 kB gzip; las barras del tablero son CSS puro |
| 7 | Métrica de peso medida en **gzip** | 2026-09 | Vigente | Es la cifra que ve el usuario en redes; el bruto se reporta también |
| 8 | `Visita` / `co2_ppm` fuera de la implementación actual | 2026-09 | Pendiente | Se diseñó en Inception, no está en el MVP construido; requiere decidir si vuelve |

---

## 8. Riesgos y respuesta

| Riesgo | Impacto | Probabilidad | Mitigación ya implementada | Plan si ocurre |
|--------|---------|--------------|----------------------------|----------------|
| Denegación de servicio por tráfico | Alto | Media | Rate limiting global y por IP | Subir el rate limit en Render y revisar `RATE_LIMIT_DEFAULT` |
| Token filtrado | Alto | Baja | Expiración 120 min; token nunca en URL | Rotar `SECRET_KEY` (sección 4) |
| Reportes falsos o spam | Medio | Alta | Confirmación por 3 vecinos antes de `confirmado_comunidad` | El coordinador marca `verificado` solo con evidencia; la comunidad puede reportar el spam a la organización beneficiaria |
| Dependencia de un solo proveedor (Render/Supabase) | Medio | Media | Todo el código es portable; la base tiene `docs/schema.sql` para recrear la BD | Reimportar el esquema y cambiar `DATABASE_URL` |
| Pérdida de datos de Supabase | Alto | Baja | Esquema versionado en `docs/schema.sql` | Restaurar desde backup de Supabase y reejecutar `python seed.py` |
| Hipervigilancia por datos geolocalizados | Medio | Media | El autor puede editar o borrar su reporte; el mapa no muestra quién reporta, solo el foco | Retirar el reporte y revisar la política de la sección 3 |
| IA introduce una vulnerabilidad | Alto | Media | Revisión humana obligatoria y checklist OWASP (sección 6) | Revertir el commit y reportarlo en la auditoría de IA |

---

## 9. Qué sigue fuera del MVP

Definir lo que queda fuera es tan importante como lo que queda dentro:

- **Medición de CO₂ por visita** (`Visita.co2_ppm`): estaba en el modelo de
  Inception y no se construyó. Es el indicador de sostenibilidad ambiental más
  directo; si la organización lo requiere, es la funcionalidad a construir
  primero.
- **Evidencia fotográfica**: los reportes son de texto; sin foto, el estado
  `verificado` depende del criterio del coordinador.
- **Notificaciones** (SMS, correo, push): requerirían otro proveedor y un costo
  recurrente, incompatible con el requisito de 0 Bs.
- **Medición de disponibilidad histórica** (uptime externo): hoy el tablero muestra
  el uptime del proceso actual; un monitor externo tipo UptimeRobot daría
  disponibilidad real por periodo.
- **Panel de Metrics con histórico**: las métricas se publican en cada build; no hay
  serie temporal.
