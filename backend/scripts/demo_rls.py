"""Checklist automatizado: "Probar JWT y RLS" (adaptado a GreenLight).

Demo sincrónica contra una API corriendo (local o Render):

    python scripts/demo_rls.py http://localhost:5000

Usuarios por defecto (los siembra backend/seed.py):
    Ana  -> maria@greenlight.test  / Vecino123!
    Beto -> carlos@greenlight.test / Vecino123!

Se pueden pasar credenciales explícitas:
    python scripts/demo_rls.py URL --ana correo:contraseña --beto correo:contraseña

Salida: tabla de intentos con ✓/✗; exit code != 0 si algo falla.

Resultados esperados (RLS / app-layer):
  sin token -> 401       | perfil muestra el correo de Ana
  token alterado -> 401  | Ana crea reporte -> 201
  Beto NO puede editar/borrar ni cambiar estado del reporte de Ana -> 403
  Beto NO puede suplantar user_id de Ana -> el reporte queda a nombre de Beto
  Ana borra su reporte -> 200
"""

import json
import sys
import urllib.error
import urllib.request
import uuid


def _peticion(base, metodo, ruta, datos=None, token=None):
    cuerpo = json.dumps(datos).encode() if datos is not None else None
    req = urllib.request.Request(
        base.rstrip("/") + ruta,
        data=cuerpo,
        method=metodo,
        headers={
            "Content-Type": "application/json",
        },
    )
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            return res.status, json.loads(res.read() or b"{}")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read() or b"{}")
        except Exception:
            return e.code, {}


def _login(base, correo, contraseña):
    status, cuerpo = _peticion(base, "POST", "/api/auth/login",
                               {"correo": correo, "contraseña": contraseña})
    if status != 200:
        print(f"  [SKIP] No se pudo iniciar sesión con {correo} "
              f"({status}). ¿Corriste backend/seed.py?")
        return None
    return cuerpo["token"]


def correr_checklist(base, creds_ana, creds_beto):
    resultados = []

    def chequear(nombre, condicion, detalle=""):
        resultados.append((nombre, bool(condicion), detalle))

    print(f"\n== Checklist JWT + RLS | {base} ==")

    # 1. Sin token -> 401
    status, _ = _peticion(base, "GET", "/api/auth/me")
    chequear("Sin token en recurso protegido -> 401", status == 401, f"obtenido {status}")

    # 2. Ana y Beto obtienen su access_token
    token_ana = _login(base, *creds_ana)
    token_beto = _login(base, *creds_beto)
    chequear("Ana obtiene su access_token", bool(token_ana))
    chequear("Beto obtiene su access_token", bool(token_beto))
    if not (token_ana and token_beto):
        return _resumen(resultados, saltar=True)

    # 3. Token alterado -> 401
    status, _ = _peticion(base, "GET", "/api/auth/me", token=token_ana + "x")
    chequear("Token alterado -> 401", status == 401, f"obtenido {status}")

    # 4. El perfil de Ana muestra SU correo
    status, perfil = _peticion(base, "GET", "/api/auth/me", token=token_ana)
    chequear("Perfil de Ana muestra su correo", status == 200 and perfil.get("correo") == creds_ana[0],
             f"obtenido {perfil.get('correo')}")

    # 5. Ana crea un reporte
    slug = f"DEMO-{uuid.uuid4().hex[:6].upper()}"
    status, reporte = _peticion(base, "POST", "/api/reportes", {
        "tipo_id": 1,
        "descripcion": f"Reporte demo {slug}",
        "ubicacion_texto": "Zona de prueba",
    }, token=token_ana)
    chequear("Ana crea reporte -> 201", status == 201, f"obtenido {status}")

    # 6. Beto intenta tocar el reporte de Ana
    if status == 201:
        rid = reporte["id"]
        status_editar, _ = _peticion(base, "PATCH", f"/api/reportes/{rid}",
                                     {"descripcion": "Edición ajena"}, token=token_beto)
        chequear("Beto edita el reporte de Ana -> 403", status_editar == 403, f"obtenido {status_editar}")

        status_estado, _ = _peticion(base, "PATCH", f"/api/reportes/{rid}/estado",
                                     {"estado": "verificado"}, token=token_beto)
        chequear("Beto cambia estado del reporte de Ana -> 403", status_estado == 403, f"obtenido {status_estado}")

        status_borrar, _ = _peticion(base, "DELETE", f"/api/reportes/{rid}", token=token_beto)
        chequear("Beto borra el reporte de Ana -> 403", status_borrar == 403, f"obtenido {status_borrar}")
    else:
        for nombre in ("Beto edita el reporte de Ana -> 403",
                       "Beto cambia estado del reporte de Ana -> 403",
                       "Beto borra el reporte de Ana -> 403"):
            resultados.append((nombre, False, "no se creó el reporte de Ana"))

    # 7. Beto intenta suplantar el user_id de Ana al crear
    status, creado = _peticion(base, "POST", "/api/reportes", {
        "tipo_id": 1,
        "descripcion": f"Intento suplantación {slug}",
        "usuario_id": reporte.get("usuario_id") if status == 201 else "fake-id",
    }, token=token_beto)
    suplantado = status == 201 and creado.get("usuario_id") != reporte.get("usuario_id")
    chequear("Beto envía el user_id de Ana -> no suplanta (el autor es Beto)",
             suplantado, f"obtenido usuario_id={creado.get('usuario_id')}")
    descartar = creado.get("id") if status == 201 else None
    if descartar:
        _peticion(base, "DELETE", f"/api/reportes/{descartar}", token=token_beto)

    # 8. Ana mantiene el control: borra su reporte
    status_borrar_ana, _ = _peticion(base, "DELETE", f"/api/reportes/{reporte['id']}", token=token_ana)
    chequear("Ana borra SU reporte -> 200", status_borrar_ana == 200, f"obtenido {status_borrar_ana}")

    return _resumen(resultados)


def _resumen(resultados, saltar=False):
    marca_ok = "OK  "
    marca_falla = "FALLA"
    print(f"\n{'INTENTO':70} {'RESULTADO':10}")
    print("-" * 82)
    for nombre, condicion, detalle in resultados:
        print(f"{nombre:70} {marca_ok if condicion else marca_falla}  {detalle}")
    fallas = sum(1 for _, ok, _ in resultados if not ok)
    print("-" * 82)
    if saltar:
        print("Resultado: PARCIAL (no se pudo autenticar; ¿corriste seed.py?)")
    elif fallas:
        print(f"Resultado: {len(resultados) - fallas}/{len(resultados)} OK — QUIEBRAN: {fallas}")
    else:
        print(f"Resultado: ¡TODO CORRECTO! ({len(resultados)}/{len(resultados)}) JWT y RLS funcionan.")
    return 1 if fallas or saltar else 0


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    args = sys.argv[1:]
    base = args[0] if args else "http://localhost:5000"
    creds_a = ("maria@greenlight.test", "Vecino123!")
    creds_b = ("carlos@greenlight.test", "Vecino123!")
    if "--ana" in args:
        correo, contra = args[args.index("--ana") + 1].split(":", 1)
        creds_a = (correo, contra)
    if "--beto" in args:
        correo, contra = args[args.index("--beto") + 1].split(":", 1)
        creds_b = (correo, contra)
    raise SystemExit(correr_checklist(base, creds_a, creds_b))


if __name__ == "__main__":
    main()