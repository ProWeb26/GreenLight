def test_health_ok(cliente):
    respuesta = cliente.get("/api/health")
    assert respuesta.status_code == 200
    cuerpo = respuesta.get_json()
    assert cuerpo["status"] == "ok"
    assert cuerpo["database"] == "connected"


def test_feed_vacio_y_publico(cliente):
    respuesta = cliente.get("/api/feed")
    assert respuesta.status_code == 200


def test_tipos_publicos(cliente):
    respuesta = cliente.get("/api/tipo-incidentes")
    assert respuesta.status_code == 200
    assert len(respuesta.get_json()) >= 2


def test_comunidades_publicas(cliente):
    respuesta = cliente.get("/api/comunidades")
    assert respuesta.status_code == 200
    assert respuesta.get_json()[0]["nombre"] == "Comunidad Test"