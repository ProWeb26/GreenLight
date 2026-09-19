def _crear_usuario(cliente):
    return cliente.post(
        "/api/users", json={"nombre": "Prueba Test", "email": "prueba@test.com", "rol": "usuario"}
    ).get_json()


def _crear_tarea(cliente, usuario_id, extra=None):
    datos = {
        "titulo": "Tarea de Prueba",
        "descripcion": "Esta es una tarea para probar el sistema",
        "prioridad": "alta",
        "usuario_id": usuario_id,
    }
    datos.update(extra or {})
    return cliente.post("/api/tasks", json=datos)


def test_crear_tarea_asignada(cliente):
    usuario = _crear_usuario(cliente)
    respuesta = _crear_tarea(cliente, usuario["id"])
    assert respuesta.status_code == 201
    cuerpo = respuesta.get_json()
    assert cuerpo["usuario_id"] == usuario["id"]
    assert cuerpo["completada"] is False
    assert len(cuerpo["id"]) == 36


def test_listar_tareas(cliente):
    usuario = _crear_usuario(cliente)
    _crear_tarea(cliente, usuario["id"])
    assert len(cliente.get("/api/tasks").get_json()) == 1


def test_obtener_tarea_por_id(cliente):
    usuario = _crear_usuario(cliente)
    tarea = _crear_tarea(cliente, usuario["id"]).get_json()
    respuesta = cliente.get(f"/api/tasks/{tarea['id']}")
    assert respuesta.status_code == 200
    assert respuesta.get_json()["titulo"] == "Tarea de Prueba"


def test_actualizar_tarea(cliente):
    usuario = _crear_usuario(cliente)
    tarea = _crear_tarea(cliente, usuario["id"]).get_json()
    respuesta = cliente.put(
        f"/api/tasks/{tarea['id']}", json={"descripcion": "Descripción actualizada"}
    )
    assert respuesta.status_code == 200
    assert respuesta.get_json()["descripcion"] == "Descripción actualizada"


def test_completar_tarea(cliente):
    usuario = _crear_usuario(cliente)
    tarea = _crear_tarea(cliente, usuario["id"]).get_json()
    respuesta = cliente.patch(f"/api/tasks/{tarea['id']}/complete")
    assert respuesta.status_code == 200
    assert respuesta.get_json()["completada"] is True


def test_tareas_completadas(cliente):
    usuario = _crear_usuario(cliente)
    t1 = _crear_tarea(cliente, usuario["id"]).get_json()
    _ = _crear_tarea(cliente, usuario["id"], {"titulo": "Otra tarea"}).get_json()
    cliente.patch(f"/api/tasks/{t1['id']}/complete")

    respuesta = cliente.get("/api/tasks/completed")
    assert respuesta.status_code == 200
    cuerpo = respuesta.get_json()
    assert len(cuerpo) == 1
    assert all(t["completada"] for t in cuerpo)
    assert cuerpo[0]["id"] == t1["id"]


def test_tareas_invalidas(cliente):
    usuario = _crear_usuario(cliente)
    assert _crear_tarea(cliente, usuario["id"], {"titulo": "ab"}).status_code == 422
    assert _crear_tarea(
        cliente, usuario["id"], {"prioridad": "urgente"}
    ).status_code == 422
    assert _crear_tarea(cliente, "id-que-no-existe").status_code == 404


def test_eliminar_tarea(cliente):
    usuario = _crear_usuario(cliente)
    tarea = _crear_tarea(cliente, usuario["id"]).get_json()
    assert cliente.delete(f"/api/tasks/{tarea['id']}").status_code == 200
    assert cliente.get(f"/api/tasks/{tarea['id']}").status_code == 404