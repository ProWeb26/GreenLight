def test_sostenibilidad_es_publica(cliente):
    respuesta = cliente.get("/api/sostenibilidad")
    assert respuesta.status_code == 200
    assert respuesta.get_json()["proyecto"] == "GreenLight"


def test_sostenibilidad_expone_presupuesto(cliente):
    datos = cliente.get("/api/sostenibilidad").get_json()
    presupuesto = datos["presupuesto"]
    assert presupuesto["peso_pagina_kb"] == 500
    assert presupuesto["lighthouse_minimo"] == 90
    assert presupuesto["costo_infraestructura_bs"] == 0


def test_sostenibilidad_mide_base_de_datos(cliente):
    datos = cliente.get("/api/sostenibilidad").get_json()
    assert datos["base_datos"]["estado"] == "connected"
    assert datos["base_datos"]["latencia_ms"] >= 0


def test_sostenibilidad_reporta_uptime(cliente):
    datos = cliente.get("/api/sostenibilidad").get_json()
    assert datos["uptime"]["segundos"] >= 0
    assert "h" in datos["uptime"]["texto"]


def test_sostenibilidad_declara_cero_licencias_propietarias(cliente):
    datos = cliente.get("/api/sostenibilidad").get_json()
    assert datos["impacto"]["costo_infraestructura_bs"] == 0
    assert datos["impacto"]["licencias_propietarias"] == 0
    assert len(datos["impacto"]["licencias"]) >= 5


def test_sostenibilidad_incluye_controles_de_seguridad(app, cliente):
    seguridad = cliente.get("/api/sostenibilidad").get_json()["seguridad"]
    assert seguridad["jwt_expiracion_minutos"] == app.config["JWT_EXPIRATION_MINUTES"]
    assert seguridad["umbral_confirmacion"] == app.config["CONFIRMATION_THRESHOLD"]
    assert "rls" in seguridad["rls_supabase"].lower()


def test_sostenibilidad_agrega_operacion(cliente):
    datos = cliente.get("/api/sostenibilidad").get_json()
    assert datos["operacion"]["total_reportes"] == 0
    assert "por_estado" in datos["operacion"]
