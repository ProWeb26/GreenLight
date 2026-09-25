-- ============================================================================
-- GreenLight — Supabase en 10 minutos (RLS)
-- ----------------------------------------------------------------------------
-- Ejecutar en el SQL Editor de supabase.com (región recomendada: São Paulo).
-- Sigue el patrón del laboratorio "API REST segura (Flask + Supabase)":
--
--   1. RLS activo + UNA política por operación (SELECT, INSERT, UPDATE, DELETE)
--   2. using(...)     -> filtra qué filas existentes puedes ver/afectar
--                        (aplica en SELECT, UPDATE, DELETE)
--   3. with check(...) -> valida filas nuevas o modificadas ANTES de guardarlas
--                         (aplica en INSERT, UPDATE)
--   4. El dueño de cada fila lo define la BD: la columna usuario_auth tiene
--      `DEFAULT auth.uid()`; el cliente NUNCA envía user_id (la API también
--      lo ignora).
--   5. auth.uid() = "sub" del JWT emitido por Supabase Auth.
--
-- Qué impide cada combinación (using vs with check):
--
-- | Política | using(uid=usuario_auth)   | with check(uid=usuario_auth)   |
-- |----------|---------------------------|--------------------------------|
-- | SELECT   | ver SOLO tus filas        | —                              |
-- | INSERT   | —                         | crear SOLO a tu nombre         |
-- | UPDATE   | editar SOLO tus filas     | no regalar/traspasar tu fila   |
-- | DELETE   | borrar SOLO tus filas     | —                              |
--
-- Resultados esperados:
--   A lista sus filas        -> sus filas (las de B no aparecen)
--   A lee/edita/borra la de B-> sin filas
--   A manda user_id de B     -> 422 (campo desconocido; la BD lo ignora)
--   Sin token                -> 401
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 0. Vincular cada fila con el usuario autenticado de Supabase.
--    La columna se omite en INSERT para que la BD la llene con auth.uid().
-- ---------------------------------------------------------------------------
alter table public.reporte
  add column if not exists usuario_auth uuid
    references auth.users(id)
    default auth.uid();

alter table public.confirmacion
  add column if not exists usuario_auth uuid
    references auth.users(id)
    default auth.uid();

-- ============================================================================
-- 1. TABLA: reporte  (reportes de quemas / focos de humo)
-- ============================================================================
-- RLS activo -> sin políticas NADIE ve ni crea nada
alter table public.reporte enable row level security;

-- Limpieza: quitar políticas ajenas de despliegues anteriores
drop policy if exists "reporte_lectura_publica" on public.reporte;

-- SELECT: cada usuario ve SOLO sus reportes --------------------------------
drop policy if exists "reporte_select_dueño" on public.reporte;
create policy "reporte_select_dueño"
  on public.reporte for select
  using (auth.uid() = usuario_auth);

-- INSERT: crear SOLO a tu nombre (valida filas nuevas) ----------------------
drop policy if exists "reporte_insert_dueño" on public.reporte;
create policy "reporte_insert_dueño"
  on public.reporte for insert
  with check (auth.uid() = usuario_auth);

-- UPDATE: editar SOLO tus filas y no regalarlas -----------------------------
drop policy if exists "reporte_update_dueño" on public.reporte;
create policy "reporte_update_dueño"
  on public.reporte for update
  using (auth.uid() = usuario_auth)
  with check (auth.uid() = usuario_auth);

-- DELETE: borrar SOLO tus filas ---------------------------------------------
drop policy if exists "reporte_delete_dueño" on public.reporte;
create policy "reporte_delete_dueño"
  on public.reporte for delete
  using (auth.uid() = usuario_auth);

-- ============================================================================
-- 2. TABLA: confirmacion  (vecinos confirman reportes de otros)
-- ============================================================================
alter table public.confirmacion enable row level security;

drop policy if exists "confirmacion_select_dueño" on public.confirmacion;
create policy "confirmacion_select_dueño"
  on public.confirmacion for select
  using (auth.uid() = usuario_auth);

drop policy if exists "confirmacion_insert_dueño" on public.confirmacion;
create policy "confirmacion_insert_dueño"
  on public.confirmacion for insert
  with check (auth.uid() = usuario_auth);

drop policy if exists "confirmacion_update_dueño" on public.confirmacion;
create policy "confirmacion_update_dueño"
  on public.confirmacion for update
  using (auth.uid() = usuario_auth)
  with check (auth.uid() = usuario_auth);

drop policy if exists "confirmacion_delete_dueño" on public.confirmacion;
create policy "confirmacion_delete_dueño"
  on public.confirmacion for delete
  using (auth.uid() = usuario_auth);

-- ============================================================================
-- 3. Lectura pública (feed comunitario): catálogos que todos ven
-- ============================================================================
alter table public.tipo_incidente enable row level security;

drop policy if exists "tipo_incidente_lectura_publica" on public.tipo_incidente;
create policy "tipo_incidente_lectura_publica"
  on public.tipo_incidente for select
  using (true);

-- ============================================================================
-- 4. VERIFICACIÓN — al final DEBE aparecer:
--      rowsecurity = t  y  las 9 políticas (reporte 4 + confirmacion 4 + 1)
-- ============================================================================
select
  relname          as tabla,
  relrowsecurity   as rowsecurity,
  case when relrowsecurity then 'ACTIVO' else 'DESACTIVADO' end as estado_rls
from pg_class
where relname in ('reporte', 'confirmacion', 'tipo_incidente')
order by relname;

select
  tablename  as tabla,
  policyname as politica,
  cmd        as operacion,
  qual       as using,
  with_check as with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('reporte', 'confirmacion', 'tipo_incidente')
order by tablename, cmd;