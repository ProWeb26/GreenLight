def _crear_usuario(cliente, nombre="Prueba Test", email="prueba@test.com", rol="usuario"):
    return cliente.post(
        "/api/users", json={"nombre": nombre, "email": email, "rol": rol}
    )


def test_crear_usuario_con_uuid(cliente):
    respuesta = _crear_usuario(cliente)
    assert respuesta.status_code == 201
    cuerpo = respuesta.get_json()
    assert len(cuerpo["id"]) == 36
    assert cuerpo["nombre"] == "Prueba Test"
    assert cuerpo["rol"] == "usuario"
    assert cuerpo["created_a"]


def test_listar_usuarios_iniciales(cliente):
    _crear_usuario(cliente, nombre="Uno", email="uno@test.com")
    _crear_usuario(cliente, nombre="Dos", email="dos@test.com")
    _crear_usuario(cliente, nombre="Tres", email="tres@test.com")
    respuesta = cliente.get("/api/users")
    assert respuesta.status_code == 200
    assert len(respuesta.get_json()) == 3


def test_obtener_usuario_por_id(cliente):
    creado = _crear_usuario(cliente).get_json()
    respuesta = cliente.get(f"/api/users/{creado['id']}")
    assert respuesta.status_code == 200
    cuerpo = respuesta.get_json()
    assert cuerpo["nombre"] == "Prueba Test"
    assert cuerpo["email"] == "prueba@test.com"


def test_actualizar_usuario(cliente):
    creado = _crear_usuario(cliente).get_json()
    respuesta = cliente.put(
        f"/api/users/{creado['id']}", json={"nombre": "Prueba Test ACTUALIZADO"}
    )
    assert respuesta.status_code == 200
    assert respuesta.get_json()["nombre"] == "Prueba Test ACTUALIZADO"


def test_usuario_duplicado_409(cliente):
    _crear_usuario(cliente)
    respuesta = _crear_usuario(cliente, nombre="Otro Nombre")
    assert respuesta.status_code == 409


def test_usuario_validaciones_422(cliente):
    assert _crear_usuario(cliente, nombre="A").status_code == 422
    assert _crear_usuario(cliente, email="invalido").status_code == 422
    assert _crear_usuario(cliente, rol="admin").status_code == 422


def test_eliminar_usuario(cliente):
    creado = _crear_usuario(cliente).get_json()
    assert cliente.delete(f"/api/users/{creado['id']}").status_code == 200
    assert cliente.get(f"/api/users/{creado['id']}").status_code == 404