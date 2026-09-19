from helpers import login


def test_sincronizar_lote_offline(cliente):
    token = login(cliente, "maria@test.com", "Vecino123!")
    respuesta = cliente.post(
        "/api/sync",
        json={
            "reportes": [
                {"tipo_id": 1, "descripcion": "Reporte offline 1", "ubicacion_texto": "Rio Grande"},
                {"tipo_id": 2, "descripcion": "Reporte offline 2", "ubicacion_texto": "Pampa"},
            ]
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert respuesta.status_code == 201
    cuerpo = respuesta.get_json()
    assert len(cuerpo["reportes"]) == 2
    assert cliente.get("/api/feed").get_json().__len__() == 2


def test_sincronizar_sin_datos(cliente):
    token = login(cliente, "maria@test.com", "Vecino123!")
    respuesta = cliente.post(
        "/api/sync", json={}, headers={"Authorization": f"Bearer {token}"}
    )
    assert respuesta.status_code == 422


def test_sincronizar_requiere_autenticacion(cliente):
    respuesta = cliente.post("/api/sync", json={"reportes": []})
    assert respuesta.status_code == 403