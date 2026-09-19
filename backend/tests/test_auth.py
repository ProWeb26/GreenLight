from helpers import login


def test_registro_usuario(cliente):
    respuesta = cliente.post(
        "/api/auth/registro",
        json={"nombre": "Nuevo Vecino", "correo": "nuevo@test.com", "contraseña": "Secreto1"},
    )
    assert respuesta.status_code == 201
    cuerpo = respuesta.get_json()
    assert cuerpo["token"]
    assert cuerpo["usuario"]["rol"] == "usuario"


def test_registro_correo_duplicado(cliente):
    cliente.post(
        "/api/auth/registro",
        json={"nombre": "Uno", "correo": "dup@test.com", "contraseña": "Secreto1"},
    )
    respuesta = cliente.post(
        "/api/auth/registro",
        json={"nombre": "Dos", "correo": "dup@test.com", "contraseña": "Secreto1"},
    )
    assert respuesta.status_code == 409


def test_registro_validaciones(cliente):
    assert cliente.post("/api/auth/registro", json={"nombre": "A", "correo": "a@b.com", "contraseña": "Secreto1"}).status_code == 422
    assert cliente.post("/api/auth/registro", json={"nombre": "Ana", "correo": "correo-invalido", "contraseña": "Secreto1"}).status_code == 422
    assert cliente.post("/api/auth/registro", json={"nombre": "Ana", "correo": "ana@test.com", "contraseña": "123"}).status_code == 422


def test_login_exitoso_y_perfil(cliente):
    token = login(cliente, "maria@test.com", "Vecino123!")
    respuesta = cliente.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert respuesta.status_code == 200
    assert respuesta.get_json()["correo"] == "maria@test.com"


def test_login_fallido(cliente):
    respuesta = cliente.post(
        "/api/auth/login", json={"correo": "maria@test.com", "contraseña": "incorrecta"}
    )
    assert respuesta.status_code == 403


def test_me_sin_token(cliente):
    respuesta = cliente.get("/api/auth/me")
    assert respuesta.status_code == 403