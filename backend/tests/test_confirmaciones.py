from helpers import login, crear_reporte


def test_confirmar_reporte(cliente):
    token_autor = login(cliente, "maria@test.com", "Vecino123!")
    reporte_id = crear_reporte(cliente, token_autor).get_json()["id"]

    token_vecino = login(cliente, "vecino1@test.com", "Vecino123!")
    respuesta = cliente.post(
        f"/api/reportes/{reporte_id}/confirmar",
        headers={"Authorization": f"Bearer {token_vecino}"},
    )
    assert respuesta.status_code == 200
    assert respuesta.get_json()["confirmaciones"] == 1


def test_no_puede_confirmar_reporte_propio(cliente):
    token_autor = login(cliente, "maria@test.com", "Vecino123!")
    reporte_id = crear_reporte(cliente, token_autor).get_json()["id"]
    respuesta = cliente.post(
        f"/api/reportes/{reporte_id}/confirmar",
        headers={"Authorization": f"Bearer {token_autor}"},
    )
    assert respuesta.status_code == 409


def test_confirmacion_duplicada(cliente):
    token_autor = login(cliente, "maria@test.com", "Vecino123!")
    reporte_id = crear_reporte(cliente, token_autor).get_json()["id"]
    token_vecino = login(cliente, "vecino1@test.com", "Vecino123!")
    headers = {"Authorization": f"Bearer {token_vecino}"}

    assert cliente.post(f"/api/reportes/{reporte_id}/confirmar", headers=headers).status_code == 200
    assert cliente.post(f"/api/reportes/{reporte_id}/confirmar", headers=headers).status_code == 409


def test_umbral_confirmaciones_cambia_estado(cliente):
    """Tres confirmaciones de usuarios distintos → 'confirmado_comunidad'."""
    token_autor = login(cliente, "maria@test.com", "Vecino123!")
    reporte_id = crear_reporte(cliente, token_autor).get_json()["id"]

    for correo in ("vecino0@test.com", "vecino1@test.com", "vecino2@test.com"):
        token = login(cliente, correo, "Vecino123!")
        r = cliente.post(
            f"/api/reportes/{reporte_id}/confirmar",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert r.status_code == 200

    assert cliente.get(f"/api/reportes/{reporte_id}").get_json()["estado"] == "confirmado_comunidad"