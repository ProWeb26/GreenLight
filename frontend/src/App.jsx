import { useCallback, useEffect, useState } from 'react'
import './App.css'

const API_URL = 'http://localhost:3000/api/reportes'

const emptyForm = {
  comunidad_id: '',
  usuario_id: '',
  tipo_id: '',
  ubicacion_texto: '',
  latitud: '',
  longitud: '',
  descripcion: '',
  foto_url: '',
}

function App() {
  const [reportes, setReportes] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)

  const loadReportes = useCallback(async () => {
    try {
      const res = await fetch(API_URL)
      const { data } = await res.json()
      setReportes(data)
      setError('')
    } catch {
      setError('No se pudo conectar con el servidor.')
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch(API_URL)
        const { data } = await res.json()
        setReportes(data)
      } catch {
        setError('No se pudo conectar con el servidor.')
      }
      setCargando(false)
    }
    init()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const payload = {
      comunidad_id: form.comunidad_id.trim(),
      usuario_id: form.usuario_id.trim(),
      tipo_id: form.tipo_id.trim(),
      ubicacion_texto: form.ubicacion_texto.trim(),
      latitud: form.latitud.trim(),
      longitud: form.longitud.trim(),
      descripcion: form.descripcion.trim() || null,
      foto_url: form.foto_url.trim() || null,
    }

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || 'Error al crear el reporte.')
        return
      }

      setForm(emptyForm)
      loadReportes()
    } catch {
      setError('Error de red al intentar guardar el reporte.')
    }
  }

  const deleteReporte = async (id) => {
    setError('')
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' })
      if (res.ok) loadReportes()
    } catch {
      setError('No se pudo eliminar el reporte.')
    }
  }

  return (
    <main className="container" role="main">
      <h1>GreenLight Reportes</h1>

      <form id="reporteForm" aria-label="Registrar nuevo reporte" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="comunidad_id">Comunidad (ID)</label>
          <input
            type="text"
            id="comunidad_id"
            name="comunidad_id"
            value={form.comunidad_id}
            onChange={handleChange}
            aria-describedby="reporteError"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="usuario_id">Usuario (ID)</label>
          <input
            type="text"
            id="usuario_id"
            name="usuario_id"
            value={form.usuario_id}
            onChange={handleChange}
            aria-describedby="reporteError"
            required
          />
        </div>

        <div className="row">
          <div className="field">
            <label htmlFor="tipo_id">Tipo de reporte (ID)</label>
            <input
              type="number"
              id="tipo_id"
              name="tipo_id"
              value={form.tipo_id}
              onChange={handleChange}
              aria-describedby="reporteError"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="latitud">Latitud</label>
            <input
              type="number"
              step="any"
              id="latitud"
              name="latitud"
              placeholder="-33.4489"
              value={form.latitud}
              onChange={handleChange}
              aria-describedby="reporteError"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="longitud">Longitud</label>
            <input
              type="number"
              step="any"
              id="longitud"
              name="longitud"
              placeholder="-70.6693"
              value={form.longitud}
              onChange={handleChange}
              aria-describedby="reporteError"
              required
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="ubicacion_texto">Ubicación (descripción)</label>
          <input
            type="text"
            id="ubicacion_texto"
            name="ubicacion_texto"
            placeholder="Av. Libertador, esquina con... "
            value={form.ubicacion_texto}
            onChange={handleChange}
            aria-describedby="reporteError"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            name="descripcion"
            rows="3"
            value={form.descripcion}
            onChange={handleChange}
          ></textarea>
        </div>

        <div className="field">
          <label htmlFor="foto_url">URL de la foto</label>
          <input
            type="url"
            id="foto_url"
            name="foto_url"
            placeholder="https://ejemplo.com/foto.jpg"
            value={form.foto_url}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="btn-primary">Registrar reporte</button>
      </form>

      <div id="reporteError" className="error-banner" role="alert" aria-live="polite">
        {error}
      </div>

      <h2>Reportes registrados</h2>
      {cargando ? (
        <p className="text-muted">Cargando reportes...</p>
      ) : reportes.length === 0 ? (
        <p className="text-muted">Aún no hay reportes registrados.</p>
      ) : (
        <ul id="reporteList" aria-label="Listado de reportes registrados">
          {reportes.map((reporte) => (
            <li key={reporte.id}>
              <div className="reporte-info">
                <span className={`estado ${reporte.estado}`}>{reporte.estado}</span>
                <strong className="reporte-title">{reporte.ubicacion_texto}</strong>
                <span className="text-muted">
                  {reporte.fecha_creacion ? new Date(reporte.fecha_creacion).toLocaleString() : ''}
                </span>
                {reporte.descripcion && (
                  <p className="reporte-description">{reporte.descripcion}</p>
                )}
              </div>
              <button
                className="btn-delete"
                onClick={() => deleteReporte(reporte.id)}
                aria-label={`Eliminar reporte ${reporte.ubicacion_texto}`}
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export default App