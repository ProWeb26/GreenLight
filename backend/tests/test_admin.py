from helpers import login


def test_coordinador_gestiona_comunidades(cliente):
    token = login(cliente, "coord@test.com", "Coordi123!")
    headers = {"Authorization": f"Bearer {token}"}

    respuesta = cliente.post(
        "/api/comunidades",
        json={"nombre": "San Julián", "zona_ciudad": "Este"},
        headers=headers,
    )
    assert respuesta.status_code == 201
    comunidad_id = respuesta.get_json()["id"]

    respuesta = cliente.put(
        f"/api/comunidades/{comunidad_id}",
        json={"zona_ciudad": "Noroeste"},
        headers=headers,
    )
    assert respuesta.status_code == 200
    assert respuesta.get_json()["zona_ciudad"] == "Noroeste"

    assert cliente.delete(f"/api/comunidades/{comunidad_id}", headers=headers).status_code == 200


def test_usuario_no_gestiona_comunidades(cliente):
    token = login(cliente, "maria@test.com", "Vecino123!")
    respuesta = cliente.post(
        "/api/comunidades",
        json={"nombre": "Intento no autorizado"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert respuesta.status_code == 403


def test_comunidad_requiere_nombre(cliente):
    token = login(cliente, "coord@test.com", "Coordi123!")
    respuesta = cliente.post(
        "/api/comunidades", json={}, headers={"Authorization": f"Bearer {token}"}
    )
    assert respuesta.status_code == 422


def test_coordinador_gestiona_tipos(cliente):
    token = login(cliente, "coord@test.com", "Coordi123!")
    headers = {"Authorization": f"Bearer {token}"}

    respuesta = cliente.post(
        "/api/tipo-incidentes",
        json={"nombre": "Colapso de Pozo", "icono": "⛏️"},
        headers=headers,
    )
    assert respuesta.status_code == 201
    tipo_id = respuesta.get_json()["id"]

    respuesta = cliente.put(
        f"/api/tipo-incidentes/{tipo_id}",
        json={"color_etiqueta": "#0000ff"},
        headers=headers,
    )
    assert respuesta.status_code == 200
    assert respuesta.get_json()["color_etiqueta"] == "#0000ff"

    assert cliente.delete(f"/api/tipo-incidentes/{tipo_id}", headers=headers).status_code == 200


def test_usuario_lee_tipos_pero_no_edita(cliente):
    respuesta = cliente.get("/api/tipo-incidentes")
    assert respuesta.status_code == 200

    token = login(cliente, "maria@test.com", "Vecino123!")
    respuesta = cliente.post(
        "/api/tipo-incidentes",
        json={"nombre": "Acceso indebido"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert respuesta.status_code == 403


def test_coordinador_gestiona_usuarios(cliente):
    token = login(cliente, "coord@test.com", "Coordi123!")
    headers = {"Authorization": f"Bearer {token}"}

    respuesta = cliente.post(
        "/api/auth/usuarios",
        json={"nombre": "Ana Vera", "correo": "ana@test.com", "contraseña": "Secreto1"},
        headers=headers,
    )
    assert respuesta.status_code == 201
    usuario_id = respuesta.get_json()["usuario"]["id"]

    respuesta = cliente.get("/api/auth/usuarios", headers=headers)
    assert respuesta.status_code == 200
    assert any(u["id"] == usuario_id for u in respuesta.get_json())

    respuesta = cliente.put(
        f"/api/auth/usuarios/{usuario_id}",
        json={"rol": "coordinador"},
        headers=headers,
    )
    assert respuesta.status_code == 200
    assert respuesta.get_json()["rol"] == "coordinador"

    assert cliente.delete(f"/api/auth/usuarios/{usuario_id}", headers=headers).status_code == 200


def test_usuario_no_lista_usuarios(cliente):
    token = login(cliente, "maria@test.com", "Vecino123!")
    respuesta = cliente.get("/api/auth/usuarios", headers={"Authorization": f"Bearer {token}"})
    assert respuesta.status_code == 403


def test_stats(cliente):
    from helpers import crear_reporte

    token = login(cliente, "maria@test.com", "Vecino123!")
    crear_reporte(cliente, token)
    token_vecino = login(cliente, "vecino1@test.com", "Vecino123!")
    cliente.post(
        "/api/reportes",
        json={"tipo_id": 1, "descripcion": "Otro foco de humo en zona norte"},
        headers={"Authorization": f"Bearer {token_vecino}"},
    )
    respuesta = cliente.get("/api/stats")
    assert respuesta.status_code == 200
    cuerpo = respuesta.get_json()
    assert cuerpo["total_reportes"] == 2
    assert cuerpo["por_estado"]["activo"] == 2