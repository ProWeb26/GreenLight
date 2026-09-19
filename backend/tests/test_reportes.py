from helpers import login, crear_reporte


def test_crear_reporte(cliente):
    token = login(cliente, "maria@test.com", "Vecino123!")
    respuesta = crear_reporte(cliente, token)
    assert respuesta.status_code == 201
    cuerpo = respuesta.get_json()
    assert cuerpo["slug_url"].startswith("ECO-")
    assert cuerpo["estado"] == "activo"
    assert cuerpo["autor"] == "María"


def test_crear_reporte_validacion(cliente):
    token = login(cliente, "maria@test.com", "Vecino123!")
    respuesta = crear_reporte(cliente, token, {"descripcion": "humo"})
    assert respuesta.status_code == 422

    respuesta = cliente.post(
        "/api/reportes",
        json={"descripcion": "Sin tipo de incidente válido", "tipo_id": 999},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert respuesta.status_code == 422


def test_crear_reporte_requiere_token(cliente):
    respuesta = cliente.post(
        "/api/reportes",
        json={"tipo_id": 1, "descripcion": "Reporte sin autenticación"},
    )
    assert respuesta.status_code == 403


def test_feed_publico_tras_crear(cliente):
    token = login(cliente, "maria@test.com", "Vecino123!")
    crear_reporte(cliente, token)
    respuesta = cliente.get("/api/feed")
    assert respuesta.status_code == 200
    assert len(respuesta.get_json()) == 1


def test_editar_reporte_propio(cliente):
    token = login(cliente, "maria@test.com", "Vecino123!")
    reporte_id = crear_reporte(cliente, token).get_json()["id"]
    respuesta = cliente.patch(
        f"/api/reportes/{reporte_id}",
        json={"descripcion": "Actualizado: humo controlado por la comunidad"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert respuesta.status_code == 200
    assert "Actualizado" in respuesta.get_json()["descripcion"]


def test_no_puede_editar_reporte_ajeno(cliente):
    token_autor = login(cliente, "maria@test.com", "Vecino123!")
    reporte_id = crear_reporte(cliente, token_autor).get_json()["id"]
    token_otro = login(cliente, "vecino1@test.com", "Vecino123!")
    respuesta = cliente.patch(
        f"/api/reportes/{reporte_id}",
        json={"descripcion": "Intento de edición ajena"},
        headers={"Authorization": f"Bearer {token_otro}"},
    )
    assert respuesta.status_code == 403


def test_eliminar_reporte_propio(cliente):
    token = login(cliente, "maria@test.com", "Vecino123!")
    reporte_id = crear_reporte(cliente, token).get_json()["id"]
    respuesta = cliente.delete(
        f"/api/reportes/{reporte_id}", headers={"Authorization": f"Bearer {token}"}
    )
    assert respuesta.status_code == 200
    assert cliente.get("/api/feed").get_json() == []


def test_no_puede_eliminar_reporte_ajeno(cliente):
    token_autor = login(cliente, "maria@test.com", "Vecino123!")
    reporte_id = crear_reporte(cliente, token_autor).get_json()["id"]
    token_otro = login(cliente, "vecino1@test.com", "Vecino123!")
    respuesta = cliente.delete(
        f"/api/reportes/{reporte_id}", headers={"Authorization": f"Bearer {token_otro}"}
    )
    assert respuesta.status_code == 403


def test_coordinador_elimina_cualquiera(cliente):
    token_autor = login(cliente, "maria@test.com", "Vecino123!")
    reporte_id = crear_reporte(cliente, token_autor).get_json()["id"]
    token_coord = login(cliente, "coord@test.com", "Coordi123!")
    respuesta = cliente.delete(
        f"/api/reportes/{reporte_id}", headers={"Authorization": f"Bearer {token_coord}"}
    )
    assert respuesta.status_code == 200


def test_cambiar_estado_verificado_solo_coordinador(cliente):
    token_autor = login(cliente, "maria@test.com", "Vecino123!")
    reporte_id = crear_reporte(cliente, token_autor).get_json()["id"]

    respuesta = cliente.patch(
        f"/api/reportes/{reporte_id}/estado",
        json={"estado": "verificado"},
        headers={"Authorization": f"Bearer {token_autor}"},
    )
    assert respuesta.status_code == 403

    token_coord = login(cliente, "coord@test.com", "Coordi123!")
    respuesta = cliente.patch(
        f"/api/reportes/{reporte_id}/estado",
        json={"estado": "verificado"},
        headers={"Authorization": f"Bearer {token_coord}"},
    )
    assert respuesta.status_code == 200
    assert respuesta.get_json()["estado"] == "verificado"