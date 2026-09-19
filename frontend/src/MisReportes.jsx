import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, getToken, getUser } from './lib/api.js'
import ReportCard from './components/ReportCard.jsx'
import { validarDescripcion } from './lib/validation.js'

function MisReportes() {
  const token = getToken()
  const user = getUser()

  const [reportes, setReportes] = useState([])
  const [tipos, setTipos] = useState([])
  const [error, setError] = useState('')
  const [caragando, setCargando] = useState(true)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({})

  useEffect(() => {
    Promise.all([api.feed(), api.listarTipos()])
      .then(([feed, t]) => {
        setTipos(t)
        setReportes(feed.filter((r) => r.usuario_id === user.id))
      })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const empezarEdicion = (r) => {
    setEditando(r.id)
    setForm({ descripcion: r.descripcion, ubicacion_texto: r.ubicacion_texto || '', tipo_id: r.tipo_id })
  }

  const guardar = async (id) => {
    const d = validarDescripcion(form.descripcion)
    if (d) return
    try {
      const actualizado = await api.actualizarReporte(token, id, {
        descripcion: form.descripcion.trim(),
        ubicacion_texto: form.ubicacion_texto.trim(),
        tipo_id: Number(form.tipo_id),
      })
      setReportes((prev) => prev.map((r) => (r.id === id ? actualizado : r)))
      setEditando(null)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este reporte? Esta acción no se puede deshacer.')) return
    try {
      await api.eliminarReporte(token, id)
      setReportes((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section aria-labelledby="mis-title">
      <h1 id="mis-title" className="mb-5 font-display text-3xl tracking-wider text-blanco">
        Mis reportes
      </h1>

      {error && (
        <p className="mb-4 border-l-4 border-rojo bg-rojo/10 px-4 py-3 text-sm text-rojo" role="alert">
          {error}
        </p>
      )}

      {caragando ? (
        <p className="text-sm text-texto">Cargando…</p>
      ) : reportes.length === 0 ? (
        <div className="border border-dashed border-linea p-6 text-center text-sm text-texto">
          Aún no reportaste nada.{' '}
          <Link to="/reportar" className="text-naranja underline">
            Crea tu primer reporte
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {reportes.map((r) => (
            <li key={r.id}>
              <div className="border border-linea bg-acero p-4">
                {editando === r.id ? (
                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-widest text-texto">
                      Descripción
                    </label>
                    <textarea
                      rows={3}
                      value={form.descripcion}
                      onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
                      className="mb-3 w-full border border-linea bg-gris px-3 py-2 text-sm text-blanco focus:border-naranja"
                      aria-label="Descripción del reporte"
                    />
                    <label className="mb-1 block text-[10px] uppercase tracking-widest text-texto">
                      Ubicación
                    </label>
                    <input
                      value={form.ubicacion_texto}
                      onChange={(e) => setForm((p) => ({ ...p, ubicacion_texto: e.target.value }))}
                      className="mb-3 w-full border border-linea bg-gris px-3 py-2 text-sm text-blanco focus:border-naranja"
                      aria-label="Ubicación"
                    />
                    <label className="mb-1 block text-[10px] uppercase tracking-widest text-texto">
                      Tipo
                    </label>
                    <select
                      value={form.tipo_id}
                      onChange={(e) => setForm((p) => ({ ...p, tipo_id: e.target.value }))}
                      className="mb-4 w-full border border-linea bg-gris px-3 py-2 text-sm text-blanco focus:border-naranja"
                      aria-label="Tipo de incidente"
                    >
                      {tipos.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.icono} {t.nombre}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => guardar(r.id)}
                        className="bg-naranja px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-negro hover:bg-naranja-claro"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditando(null)}
                        className="border border-linea px-4 py-2 text-[11px] uppercase tracking-widest text-texto hover:text-blanco"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <ReportCard reporte={r} esAutor />
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => empezarEdicion(r)}
                        className="border border-linea px-4 py-2 text-[11px] uppercase tracking-widest text-texto hover:border-naranja hover:text-naranja"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminar(r.id)}
                        className="border border-rojo/50 px-4 py-2 text-[11px] uppercase tracking-widest text-rojo hover:bg-rojo/10"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default MisReportes