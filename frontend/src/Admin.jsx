import { useEffect, useState } from 'react'
import { api, getToken } from './lib/api.js'

function Panel({ titulo, children }) {
  return (
    <section className="border border-linea bg-acero p-4 sm:p-5" aria-labelledby={`panel-${titulo}`}>
      <h2 id={`panel-${titulo}`} className="mb-4 font-display text-xl tracking-wider text-blanco">
        {titulo}
      </h2>
      {children}
    </section>
  )
}

function MiniForm({ campos, onSubmit, placeholder, submitLabel }) {
  const [valores, setValores] = useState({})
  const [error, setError] = useState('')

  const handle = async (e) => {
    e.preventDefault()
    setError('')
    const valido = Boolean((valores[campos[0].name] || '').trim())
    if (!valido) return setError('El nombre es obligatorio.')
    try {
      await onSubmit({ ...valores, [campos[0].name]: valores[campos[0].name].trim() })
      setValores({})
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form onSubmit={handle} className="mb-4 flex flex-col gap-2 sm:flex-row">
      <input
        value={valores[campos[0].name] || ''}
        onChange={(e) => setValores((p) => ({ ...p, [campos[0].name]: e.target.value }))}
        placeholder={placeholder}
        className="flex-1 border border-linea bg-gris px-3 py-2 text-sm text-blanco focus:border-naranja"
        aria-label={placeholder}
      />
      <button
        type="submit"
        className="bg-naranja px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-negro hover:bg-naranja-claro"
      >
        {submitLabel}
      </button>
      {error && <p className="text-xs text-rojo" role="alert">{error}</p>}
    </form>
  )
}

function Admin() {
  const token = getToken()

  const [comunidades, setComunidades] = useState([])
  const [tipos, setTipos] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [stats, setStats] = useState(null)
  const [reportes, setReportes] = useState([])
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  const cargarTodo = () => {
    Promise.all([
      api.listarComunidades(),
      api.listarTipos(),
      api.listarUsuarios(token),
      api.stats(),
      api.feed(),
    ])
      .then(([c, t, u, s, r]) => {
        setComunidades(c)
        setTipos(t)
        setUsuarios(u)
        setStats(s)
        setReportes(r)
      })
      .catch((err) => setError(err.message))
  }

  useEffect(() => cargarTodo(), []) // eslint-disable-line react-hooks/exhaustive-deps

  const avisar = (mensaje) => {
    setAviso(mensaje)
    setTimeout(() => setAviso(''), 4000)
  }

  const crearComunidad = async (datos) => {
    const c = await api.crearComunidad(token, datos)
    setComunidades((prev) => [...prev, c])
    avisar('Comunidad creada.')
  }

  const eliminarComunidad = async (id) => {
    if (!window.confirm('¿Eliminar esta comunidad?')) return
    await api.eliminarComunidad(token, id)
    setComunidades((prev) => prev.filter((c) => c.id !== id))
  }

  const crearTipo = async (datos) => {
    const t = await api.crearTipo(token, datos)
    setTipos((prev) => [...prev, t])
    avisar('Tipo de incidente creado.')
  }

  const eliminarTipo = async (id) => {
    if (!window.confirm('¿Eliminar este tipo de incidente?')) return
    await api.eliminarTipo(token, id)
    setTipos((prev) => prev.filter((t) => t.id !== id))
  }

  const cambiarRol = async (id, rol) => {
    const u = await api.actualizarUsuario(token, id, { rol })
    setUsuarios((prev) => prev.map((x) => (x.id === id ? { ...x, rol: u.rol } : x)))
    avisar('Rol actualizado.')
  }

  const eliminarUsuario = async (id) => {
    if (!window.confirm('¿Eliminar este usuario?')) return
    await api.eliminarUsuario(token, id)
    setUsuarios((prev) => prev.filter((u) => u.id !== id))
  }

  const cambiarEstado = async (id, estado) => {
    const r = await api.cambiarEstado(token, id, estado)
    setReportes((prev) => prev.map((x) => (x.id === id ? { ...x, estado: r.estado } : x)))
    avisar('Estado del reporte actualizado.')
  }

  return (
    <section aria-labelledby="admin-title">
      <h1 id="admin-title" className="mb-1 font-display text-3xl tracking-wider text-blanco">
        Administración
      </h1>
      <p className="mb-5 text-sm text-texto">Gestión exclusiva del coordinador.</p>

      {error && (
        <p className="mb-4 border-l-4 border-rojo bg-rojo/10 px-4 py-3 text-sm text-rojo" role="alert">
          {error}
        </p>
      )}
      {aviso && (
        <p className="mb-4 border-l-4 border-verde bg-verde/10 px-4 py-3 text-sm text-verde" role="status">
          {aviso}
        </p>
      )}

      {stats && (
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Reportes', valor: stats.total_reportes },
            { label: 'Confirmaciones', valor: stats.total_confirmaciones },
            { label: 'Usuarios', valor: stats.total_usuarios },
            { label: 'Comunidades', valor: stats.total_comunidades },
          ].map((item) => (
            <div key={item.label} className="border border-linea bg-acero p-4">
              <p className="font-display text-3xl text-naranja">{item.valor}</p>
              <p className="text-[10px] uppercase tracking-widest text-texto">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel titulo="Comunidades">
          <MiniForm
            campos={[{ name: 'nombre' }]}
            onSubmit={crearComunidad}
            placeholder="Nombre de la comunidad"
            submitLabel="Crear"
          />
          <ul className="divide-y divide-linea">
            {comunidades.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span>
                  <strong className="text-blanco">{c.nombre}</strong>
                  {c.zona_ciudad ? <span className="text-texto"> · {c.zona_ciudad}</span> : null}
                </span>
                <button
                  type="button"
                  onClick={() => eliminarComunidad(c.id)}
                  className="text-[11px] uppercase tracking-widest text-rojo hover:underline"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel titulo="Tipos de incidente">
          <MiniForm
            campos={[{ name: 'nombre' }]}
            onSubmit={crearTipo}
            placeholder="Nombre del tipo de incidente"
            submitLabel="Crear"
          />
          <ul className="divide-y divide-linea">
            {tipos.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span>
                  <span className="mr-1">{t.icono}</span>
                  <strong className="text-blanco">{t.nombre}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => eliminarTipo(t.id)}
                  className="text-[11px] uppercase tracking-widest text-rojo hover:underline"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel titulo="Usuarios">
          <ul className="divide-y divide-linea">
            {usuarios.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>
                  <strong className="text-blanco">{u.nombre}</strong>
                  <span className="block text-xs text-texto">{u.correo}</span>
                </span>
                <span className="flex items-center gap-2">
                  <select
                    value={u.rol}
                    onChange={(e) => cambiarRol(u.id, e.target.value)}
                    className="border border-linea bg-gris px-2 py-1 text-xs text-blanco"
                    aria-label={`Rol de ${u.nombre}`}
                  >
                    <option value="usuario">usuario</option>
                    <option value="coordinador">coordinador</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => eliminarUsuario(u.id)}
                    className="text-[11px] uppercase tracking-widest text-rojo hover:underline"
                  >
                    Eliminar
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel titulo="Estados de reportes">
          <ul className="divide-y divide-linea">
            {reportes.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>
                  <span className="text-naranja">{r.slug_url}</span>{' '}
                  <span className="text-texto">{r.tipo}</span>
                  <span className="block text-xs text-texto">
                    {r.estado} · {r.confirmaciones} conf.
                  </span>
                </span>
                <select
                  value={r.estado}
                  onChange={(e) => cambiarEstado(r.id, e.target.value)}
                  className="border border-linea bg-gris px-2 py-1 text-xs text-blanco"
                  aria-label={`Estado de ${r.slug_url}`}
                >
                  <option value="activo">activo</option>
                  <option value="confirmado_comunidad">confirmado_comunidad</option>
                  <option value="verificado">verificado</option>
                </select>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </section>
  )
}

export default Admin