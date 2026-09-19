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


def test_tareas_de_un_usuario(cliente):
    usuario = _crear_usuario(cliente)
    _crear_tarea(cliente, usuario["id"])
    respuesta = cliente.get(f"/api/users/{usuario['id']}/tasks")
    assert respuesta.status_code == 200
    cuerpo = respuesta.get_json()
    assert len(cuerpo) == 1
    assert all(t["usuario_id"] == usuario["id"] for t in cuerpo)


def test_stats_usuario(cliente):
    usuario = _crear_usuario(cliente)
    t1 = _crear_tarea(cliente, usuario["id"]).get_json()
    _crear_tarea(cliente, usuario["id"], {"titulo": "Baja", "prioridad": "baja"})
    _crear_tarea(cliente, usuario["id"], {"titulo": "Media", "prioridad": "media"})
    cliente.patch(f"/api/tasks/{t1['id']}/complete")

    respuesta = cliente.get(f"/api/users/{usuario['id']}/stats")
    assert respuesta.status_code == 200
    cuerpo = respuesta.get_json()
    assert cuerpo["total"] == 3
    assert cuerpo["completadas"] == 1
    assert cuerpo["pendientes"] == 2
    assert cuerpo["por_prioridad"]["alta"] == 1
    assert cuerpo["por_prioridad"]["baja"] == 1
    assert cuerpo["por_prioridad"]["media"] == 1


def test_persistencia_tras_reinicio(app_archivo):
    """Plan Postman TEST 6: los datos persisten después de reiniciar el servidor."""
    from app import create_app
    from extensions import db
    from models import Tarea, Usuario

    primer_app = create_app(app_archivo)
    with primer_app.app_context():
        usuario = Usuario(nombre="Prueba Test ACTUALIZADO", email="prueba@test.com")
        db.session.add(usuario)
        db.session.flush()
        db.session.add(Tarea(titulo="Tarea de Prueba", usuario_id=usuario.id, prioridad="alta"))
        db.session.commit()

        db.session.remove()

    segunda_app = create_app(app_archivo)
    cliente = segunda_app.test_client()

    usuarios = cliente.get("/api/users").get_json()
    assert any(u["nombre"] == "Prueba Test ACTUALIZADO" for u in usuarios)

    tareas = cliente.get("/api/tasks").get_json()
    assert any(t["titulo"] == "Tarea de Prueba" for t in tareas)