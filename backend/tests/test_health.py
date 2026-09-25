def test_health_ok(cliente):
    respuesta = cliente.get("/api/health")
    assert respuesta.status_code == 200
    cuerpo = respuesta.get_json()
    assert cuerpo["status"] == "ok"
    assert cuerpo["database"] == "connected"


def test_salud_ok(cliente):
    respuesta = cliente.get("/api/salud")
    assert respuesta.status_code == 200
    cuerpo = respuesta.get_json()
    assert cuerpo["status"] == "ok"
    assert cuerpo["database"] == "connected"


def test_api_docs_swagger(cliente):
    respuesta = cliente.get("/api/docs", follow_redirects=True)
    assert respuesta.status_code == 200
    assert "swagger" in respuesta.get_data(as_text=True).lower()


def test_openapi_spec(cliente):
    respuesta = cliente.get("/api/openapi.yaml")
    assert respuesta.status_code == 200
    texto = respuesta.get_data(as_text=True)
    assert "openapi:" in texto
    assert "/api/reportes" in texto


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


def test_raiz_no_es_error(cliente):
    respuesta = cliente.get("/")
    assert respuesta.status_code == 200
    cuerpo = respuesta.get_json()
    assert "api" in cuerpo
    assert "documentacion" in cuerpo


def test_ruta_inexistente_404(cliente):
    respuesta = cliente.get("/ruta/que/no/existe")
    assert respuesta.status_code == 404
    assert respuesta.get_json()["error"] == "Recurso no encontrado"