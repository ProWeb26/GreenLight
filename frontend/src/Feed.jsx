import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, getToken, getUser } from './lib/api.js'
import ReportCard from './components/ReportCard.jsx'
import { agregarPendiente, estaEnLinea } from './lib/offline.js'

const CONFIRMADOS_KEY = 'greenlight_confirmados'

function cargarConfirmados() {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(CONFIRMADOS_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

function guardarConfirmados(set) {
  sessionStorage.setItem(CONFIRMADOS_KEY, JSON.stringify([...set]))
}

function Feed() {
  const token = getToken()
  const user = getUser()

  const [reportes, setReportes] = useState([])
  const [tipos, setTipos] = useState([])
  const [comunidades, setComunidades] = useState([])
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroComunidad, setFiltroComunidad] = useState('')
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [cargando, setCargando] = useState(true)
  const [confirmados, setConfirmados] = useState(cargarConfirmados)

  useEffect(() => {
    let activo = true
    ;(async () => {
      try {
        const [feed, tiposData, comunas] = await Promise.all([
          api.feed({
            tipo_id: filtroTipo || undefined,
            comunidad_id: filtroComunidad || undefined,
          }),
          api.listarTipos(),
          api.listarComunidades(),
        ])
        if (!activo) return
        setError('')
        setReportes(feed)
        setTipos(tiposData)
        setComunidades(comunas)
      } catch (err) {
        if (activo) setError(err.message)
      } finally {
        if (activo) setCargando(false)
      }
    })()
    return () => {
      activo = false
    }
  }, [filtroTipo, filtroComunidad])

  const marcarConfirmado = (id) => {
    setConfirmados((prev) => {
      const next = new Set(prev)
      next.add(id)
      guardarConfirmados(next)
      return next
    })
  }

  const onConfirmar = async (reporte) => {
    setAviso('')
    if (!token) {
      setAviso('Inicia sesión para confirmar reportes.')
      return
    }
    if (!estaEnLinea()) {
      agregarPendiente({ tipo: 'confirmacion', reporte_id: reporte.id })
      marcarConfirmado(reporte.id)
      setAviso('Confirmado en modo offline. Se sincronizará al recuperar señal.')
      return
    }
    try {
      await api.confirmarReporte(token, reporte.id)
      marcarConfirmado(reporte.id)
      setReportes((prev) =>
        prev.map((r) => (r.id === reporte.id ? { ...r, confirmaciones: r.confirmaciones + 1 } : r)),
      )
    } catch (err) {
      if (err.status === 409) {
        marcarConfirmado(reporte.id)
        setAviso('Ya habías confirmado este reporte.')
      } else {
        setAviso(err.message)
      }
    }
  }

  const hayFiltros = Boolean(filtroTipo || filtroComunidad)

  return (
    <section aria-labelledby="feed-title">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h1 id="feed-title" className="font-display text-3xl tracking-wider text-blanco">
          Feed de la comunidad
        </h1>
      </div>

      <div className="mb-5 grid gap-3 rounded border border-linea bg-acero p-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-texto">Tipo de incidente</span>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="w-full border border-linea bg-gris px-3 py-2 text-sm text-blanco focus:border-naranja"
          >
            <option value="">Todos</option>
            {tipos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.icono} {t.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-texto">Comunidad / zona</span>
          <select
            value={filtroComunidad}
            onChange={(e) => setFiltroComunidad(e.target.value)}
            className="w-full border border-linea bg-gris px-3 py-2 text-sm text-blanco focus:border-naranja"
          >
            <option value="">Todas</option>
            {comunidades.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      {aviso && (
        <p className="mb-4 border-l-4 border-naranja bg-naranja/10 px-4 py-3 text-sm text-naranja" role="alert">
          {aviso}
        </p>
      )}
      {error && (
        <p className="mb-4 border-l-4 border-rojo bg-rojo/10 px-4 py-3 text-sm text-rojo" role="alert">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="text-sm text-texto">Cargando reportes…</p>
      ) : reportes.length === 0 ? (
        <div className="border border-dashed border-linea p-6 text-center text-sm text-texto">
          {hayFiltros
            ? 'No hay reportes con esos filtros.'
            : 'Todavía no hay reportes. Sé el primero en reportar un foco.'}{' '}
          <Link className="text-naranja underline" to="/reportar">
            Reportar ahora
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2" aria-live="polite">
          {reportes.map((r) => (
            <li key={r.id}>
              <ReportCard
                reporte={r}
                onConfirmar={token ? onConfirmar : undefined}
                confirmado={confirmados.has(r.id)}
                esAutor={user ? r.usuario_id === user.id : false}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default Feed