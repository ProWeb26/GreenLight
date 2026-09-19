def login(cliente, correo, contraseña):
    respuesta = cliente.post(
        "/api/auth/login", json={"correo": correo, "contraseña": contraseña}
    )
    assert respuesta.status_code == 200
    return respuesta.get_json()["token"]


def crear_reporte(cliente, token, extra=None):
    payload = {
        "tipo_id": 1,
        "descripcion": "Humo denso cerca de la vereda El Roble",
        "ubicacion_texto": "Vereda El Roble, km 4",
    }
    payload.update(extra or {})
    return cliente.post(
        "/api/reportes", json=payload, headers={"Authorization": f"Bearer {token}"}
    )