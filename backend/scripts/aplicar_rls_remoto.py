import os
import sys

import psycopg

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

required = ["SUPABASE_DB_HOST", "SUPABASE_DB_USER", "SUPABASE_DB_PASSWORD"]
if not all(os.environ.get(k) for k in required):
    sys.exit("Faltan SUPABASE_DB_HOST / SUPABASE_DB_USER / SUPABASE_DB_PASSWORD")

dbname = os.environ.get("SUPABASE_DB_NAME", "postgres")
sql_path = os.path.join(BASE, "sql", "01_esquema_y_rls.sql")
with open(sql_path, encoding="utf-8") as fh:
    script = fh.read()

conn = psycopg.connect(
    host=os.environ["SUPABASE_DB_HOST"],
    port=5432,
    user=os.environ["SUPABASE_DB_USER"],
    password=os.environ["SUPABASE_DB_PASSWORD"],
    dbname=dbname,
    connect_timeout=15,
)
conn.autocommit = True
cur = conn.cursor()

cur.execute(script)
while cur.nextset():
    pass

print("=== verificacion: rowsecurity ===")
cur.execute(
    "select relname as tabla, relrowsecurity as activa from pg_class "
    "where relname in ('reporte','confirmacion','tipo_incidente') order by relname"
)
for r in cur.fetchall():
    print(f"  {r[0]:16} RLS activo={r[1]}")

print("=== verificacion: politicas (9) ===")
cur.execute(
    "select tablename, policyname, cmd from pg_policies "
    "where schemaname='public' and tablename in ('reporte','confirmacion','tipo_incidente') "
    "order by tablename, cmd"
)
for r in cur.fetchall():
    print(f"  {r[0]:14} {r[2]:6} {r[1]}")

conn.close()
print("LISTO")