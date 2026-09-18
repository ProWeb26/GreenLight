import { useCallback, useEffect, useState } from 'react'

const API_URL = 'http://localhost:3000/api'

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

function Reportes({ token, user, onLogout }) {
  const [reportes, setReportes] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)

  const authHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }),
    [token],
  )

  const loadReportes = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/reportes`, { headers: authHeaders() })
      const result = await res.json()
      if (res.status === 401) {
        onLogout()
        return
      }
      if (!res.ok) throw new Error(result.error || 'Error al cargar reportes.')
      setReportes(result.data)
      setError('')
    } catch {
      setError('No se pudo cargar el listado de reportes.')
    }
  }, [authHeaders, onLogout])

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch(`${API_URL}/reportes`, { headers: authHeaders() })
        const result = await res.json()
        if (res.status === 401) {
          onLogout()
          return
        }
        if (!res.ok) throw new Error(result.error || 'Error al cargar reportes.')
        setReportes(result.data)
      } catch {
        setError('No se pudo conectar con el servidor.')
      }
      setCargando(false)
    }
    init()
  }, [authHeaders, onLogout])

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
      const res = await fetch(`${API_URL}/reportes`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      })
      const result = await res.json()
      if (res.status === 401) {
        onLogout()
        return
      }
      if (!res.ok) throw new Error(result.error || 'Error al crear el reporte.')
      setForm(emptyForm)
      loadReportes()
    } catch (err) {
      setError(err.message)
    }
  }

  const deleteReporte = async (id) => {
    setError('')
    try {
      const res = await fetch(`${API_URL}/reportes/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      const result = await res.json()
      if (res.status === 401) {
        onLogout()
        return
      }
      if (!res.ok) throw new Error(result.error || 'No se pudo eliminar el reporte.')
      loadReportes()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <h2>Gestión de Reportes</h2>

      {error && (
        <div className="alerta alerta-error" role="alert">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      <div className="form-panel">
        <div className="form-panel-header">
          <span className="icono"></span>
          <span>Registrar nuevo reporte</span>
        </div>
        <form className="form-body" onSubmit={handleSubmit}>
          <div className="fila">
            <div className="campo">
              <label htmlFor="comunidad_id">Comunidad (ID)</label>
              <input
                type="text"
                id="comunidad_id"
                name="comunidad_id"
                value={form.comunidad_id}
                onChange={handleChange}
                required
              />
            </div>
            <div className="campo">
              <label htmlFor="usuario_id">Usuario (ID)</label>
              <input
                type="text"
                id="usuario_id"
                name="usuario_id"
                value={form.usuario_id}
                onChange={handleChange}
                required
              />
            </div>
            <div className="campo">
              <label htmlFor="tipo_id">Tipo de reporte (ID)</label>
              <input
                type="number"
                id="tipo_id"
                name="tipo_id"
                value={form.tipo_id}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="fila">
            <div className="campo">
              <label htmlFor="latitud">Latitud</label>
              <input
                type="number"
                step="any"
                id="latitud"
                name="latitud"
                placeholder="-33.4489"
                value={form.latitud}
                onChange={handleChange}
                required
              />
            </div>
            <div className="campo">
              <label htmlFor="longitud">Longitud</label>
              <input
                type="number"
                step="any"
                id="longitud"
                name="longitud"
                placeholder="-70.6693"
                value={form.longitud}
                onChange={handleChange}
                required
              />
            </div>
            <div className="campo">
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
          </div>

          <div className="campo">
            <label htmlFor="ubicacion_texto">Ubicación (descripción)</label>
            <input
              type="text"
              id="ubicacion_texto"
              name="ubicacion_texto"
              placeholder="Plaza central, esquina con..."
              value={form.ubicacion_texto}
              onChange={handleChange}
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="descripcion">Descripción</label>
            <textarea
              id="descripcion"
              name="descripcion"
              rows="3"
              value={form.descripcion}
              onChange={handleChange}
            ></textarea>
          </div>

          <button type="submit" className="btn btn-primary">
            <i className="fas fa-plus"></i> Registrar reporte
          </button>
        </form>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <h3>Reportes registrados</h3>
          {cargando ? (
            <span className="text-muted">Cargando…</span>
          ) : (
            <span className="text-muted">{reportes.length} reporte(s)</span>
          )}
        </div>
        <div className="admin-section-body">
          {!cargando && reportes.length === 0 ? (
            <p className="empty-note">Aún no hay reportes registrados.</p>
          ) : (
            <div className="tabla-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ubicación</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    {user?.role === 'admin' && <th>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {reportes.map((reporte) => (
                    <tr key={reporte.id}>
                      <td className="codigo">{reporte.ubicacion_texto}</td>
                      <td>{reporte.descripcion || '—'}</td>
                      <td>
                        <span className={`badge badge-${reporte.estado}`}>{reporte.estado}</span>
                      </td>
                      <td>
                        {reporte.fecha_creacion
                          ? new Date(reporte.fecha_creacion).toLocaleString()
                          : '—'}
                      </td>
                      {user?.role === 'admin' && (
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => deleteReporte(reporte.id)}
                            aria-label={`Eliminar reporte ${reporte.ubicacion_texto}`}
                          >
                            <i className="fas fa-trash"></i> Eliminar
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Reportes