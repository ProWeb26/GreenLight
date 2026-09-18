import { useEffect, useRef, useState } from 'react'
import Chart from 'chart.js/auto'

const API_URL = 'http://localhost:3000/api'

const PALETTE = ['#f05a00', '#3dba6e', '#f0c030', '#6496ff', '#e74c3c']

function Dashboard({ token, onLogout }) {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)
  const chartRefs = useRef([])
  const estadoCanvas = useRef(null)
  const mesCanvas = useRef(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/reportes/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const result = await res.json()
        if (res.status === 401) {
          onLogout()
          return
        }
        if (!res.ok) throw new Error(result.error || 'Error al cargar estadísticas.')
        if (active) {
          setStats(result.data)
          setError('')
        }
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setCargando(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [token, onLogout])

  useEffect(() => {
    if (!stats) return

    chartRefs.current.forEach((c) => c.destroy())
    chartRefs.current = []

    if (estadoCanvas.current && stats.porEstado.length > 0) {
      chartRefs.current.push(
        new Chart(estadoCanvas.current, {
          type: 'doughnut',
          data: {
            labels: stats.porEstado.map((e) => e.estado),
            datasets: [
              {
                data: stats.porEstado.map((e) => e.total),
                backgroundColor: PALETTE,
                borderWidth: 0,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom', labels: { color: '#b8b2aa' } },
            },
          },
        }),
      )
    }

    if (mesCanvas.current && stats.porMes.length > 0) {
      chartRefs.current.push(
        new Chart(mesCanvas.current, {
          type: 'bar',
          data: {
            labels: stats.porMes.map((m) => m.mes),
            datasets: [
              {
                label: 'Reportes',
                data: stats.porMes.map((m) => m.total),
                backgroundColor: PALETTE[0],
                borderRadius: 2,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: '#b8b2aa' } },
              y: { ticks: { color: '#b8b2aa' } },
            },
          },
        }),
      )
    }

    return () => {
      chartRefs.current.forEach((c) => c.destroy())
      chartRefs.current = []
    }
  }, [stats])

  if (cargando) {
    return <p className="text-muted">Cargando dashboard…</p>
  }

  if (!stats) return null

  const { summary, recientes } = stats

  return (
    <>
      <h2>Dashboard</h2>

      {error && (
        <div className="alerta alerta-error" role="alert">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      <div className="dashboard-grid" aria-label="Estadísticas generales">
        <div className="dash-card">
          <div className="dash-num">{summary.total}</div>
          <div className="dash-label">Reportes totales</div>
        </div>
        <div className="dash-card">
          <div className="dash-num">{summary.activos}</div>
          <div className="dash-label">Activos</div>
          <div className="dash-sub">En proceso de seguimiento</div>
        </div>
        <div className="dash-card">
          <div className="dash-num">{summary.cerrados}</div>
          <div className="dash-label">Cerrados</div>
          <div className="dash-sub">Resueltos o finalizados</div>
        </div>
        <div className="dash-card">
          <div className="dash-num">{summary.este_mes}</div>
          <div className="dash-label">Este mes</div>
          <div className="dash-sub">Reportes registrados</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-box">
          <h3>Reportes por Estado</h3>
          <div className="chart-canvas">
            <canvas ref={estadoCanvas}></canvas>
          </div>
        </div>
        <div className="chart-box">
          <h3>Reportes por Mes</h3>
          <div className="chart-canvas">
            <canvas ref={mesCanvas}></canvas>
          </div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <h3>Reportes Recientes</h3>
        </div>
        <div className="admin-section-body">
          <div className="tabla-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ubicación</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recientes.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-muted">
                      Aún no hay reportes registrados.
                    </td>
                  </tr>
                ) : (
                  recientes.map((r) => (
                    <tr key={r.id}>
                      <td className="codigo">{r.ubicacion_texto}</td>
                      <td>{r.descripcion || '—'}</td>
                      <td>
                        <span className={`badge badge-${r.estado === 'activo' ? 'naranja' : 'verde'}`}>
                          {r.estado}
                        </span>
                      </td>
                      <td>{r.fecha_creacion ? new Date(r.fecha_creacion).toLocaleString() : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard