def test_health(cliente):
    respuesta = cliente.get("/api/health")
    assert respuesta.status_code == 200
    cuerpo = respuesta.get_json()
    assert cuerpo["status"] == "ok"
    assert cuerpo["database"]["connected"] is True