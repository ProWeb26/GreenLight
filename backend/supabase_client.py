"""Cliente de Supabase que consulta en nombre del usuario (RLS).

Reglas:
- Un cliente por petición: nunca compartir un cliente con sesión/token entre
  usuarios (la RLS decide qué filas ve cada uno según su JWT).
- Nunca usar service_role: ignora la RLS y da acceso total a la base.
  En produccion se usan las credenciales *anónimas/publishable*
  (`SUPABASE_URL` y `SUPABASE_KEY`) + el JWT del usuario autenticado.
- `auth.uid()` = `sub` del JWT del usuario: el dueño de cada fila lo define la
  base de datos (columna con `DEFAULT auth.uid()`), el cliente no lo envía.

Espera las variables de entorno:
    SUPABASE_URL  -> Project URL de Supabase
    SUPABASE_KEY  -> clave publishable/anon (NUNCA service_role)
"""

import os


def _credenciales():
    url = os.environ.get("SUPABASE_URL")
    clave = os.environ.get("SUPABASE_KEY")
    if not url or not clave:
        raise RuntimeError(
            "Faltan SUPABASE_URL / SUPABASE_KEY en las variables de entorno"
        )
    return url, clave


def cliente_usuario(token):
    """Cliente Supabase que actúa en nombre del usuario autenticado.

    Envía el JWT del usuario como header `Authorization: Bearer <token>` para
    que la RLS con `auth.uid() = usuario_id` permita o niegue las filas.
    """
    from supabase import create_client

    url, clave = _credenciales()
    cliente = create_client(url, clave)
    cliente.postgrest.auth(token)
    return cliente


def cliente_anon():
    """Cliente Supabase con identidad anónima (solo datos públicos: RLS con
    `USING (true)`). Usar exclusivamente para recursos de lectura pública."""
    from supabase import create_client

    url, clave = _credenciales()
    return create_client(url, clave)