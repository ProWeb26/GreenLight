import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Chart from 'chart.js/auto'
import { api, getToken } from './lib/api.js'

const PALETTE = ['#f05a00', '#3dba6e', '#f0c030', '#6496ff', '#e74c3c']

function SummaryCard({ num, label, sub }) {
  return (
    <div className="bg-acero p-4">
      <p className="font-display text-3xl leading-none text-naranja">{num}</p>
      <p className="mt-1 text-[10px] uppercase tracking-widest text-texto">{label}</p>
      {sub && <p className="mt-1 text-xs text-verde">{sub}</p>}
    </div>
  )
}

function Dashboard() {
  const navigate = useNavigate()
  const estadoRef = useRef(null)
  const mesRef = useRef(null)
  const chartsRef = useRef([])

  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const result = await api.stats(getToken())
        if (active) {
          setStats(result.data)
          setError('')
        }
      } catch (err) {
        if (err.status === 401) {
          navigate('/login', { replace: true })
          return
        }
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [navigate])

  useEffect(() => {
    if (!stats) return

    chartsRef.current.forEach((c) => c.destroy())
    chartsRef.current = []

    if (estadoRef.current && stats.porEstado.length > 0) {
      chartsRef.current.push(
        new Chart(estadoRef.current, {
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
            animation: false,
            plugins: {
              legend: { position: 'bottom', labels: { color: '#b8b2aa', boxWidth: 12 } },
            },
          },
        }),
      )
    }

    if (mesRef.current && stats.porMes.length > 0) {
      chartsRef.current.push(
        new Chart(mesRef.current, {
          type: 'bar',
          data: {
            labels: stats.porMes.map((m) => m.mes),
            datasets: [
              {
                label: 'Tareas',
                data: stats.porMes.map((m) => m.total),
                backgroundColor: PALETTE[0],
                borderRadius: 2,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: '#b8b2aa' } },
              y: { ticks: { color: '#b8b2aa' }, beginAtZero: true },
            },
          },
        }),
      )
    }

    return () => {
      chartsRef.current.forEach((c) => c.destroy())
      chartsRef.current = []
    }
  }, [stats])

  if (loading) {
    return <p className="text-sm text-texto">Cargando dashboard…</p>
  }

  if (!stats) return null

  const { summary, porEstado, porMes, recientes } = stats

  const estadoText = porEstado.map((e) => `${e.estado}: ${e.total}`).join('. ')
  const mesText = porMes.map((m) => `${m.mes}: ${m.total}`).join('. ')

  return (
    <>
      <header className="mb-6">
        <h2 className="font-display text-3xl tracking-wider text-blanco">Dashboard</h2>
        <p className="mt-1 text-sm text-texto">Estadísticas y seguimiento de las tareas.</p>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-4 flex items-center gap-2 border-l-4 border-rojo bg-rojo/10 px-4 py-3 text-sm text-rojo"
        >
          {error}
        </div>
      )}

      <div
        className="mb-6 grid grid-cols-2 gap-px border border-linea bg-linea lg:grid-cols-4"
        aria-label="Estadísticas generales"
      >
        <SummaryCard num={summary.total} label="Tareas totales" />
        <SummaryCard num={summary.pending} label="Pendientes" sub="En proceso" />
        <SummaryCard num={summary.done} label="Completadas" sub="Finalizadas" />
        <SummaryCard num={summary.este_mes} label="Este mes" sub="Registradas" />
      </div>

      <div className="mb-6 grid gap-1 lg:grid-cols-2">
        <div className="border border-linea bg-acero p-4">
          <h3 className="mb-4 font-display text-lg tracking-widest text-texto">Tareas por estado</h3>
          {porEstado.length > 0 ? (
            <div className="relative h-64">
              <canvas
                ref={estadoRef}
                role="img"
                aria-label={`Gráfica de dona de tareas por estado. ${estadoText}.`}
              ></canvas>
            </div>
          ) : (
            <p className="py-6 text-sm text-texto">Sin datos suficientes para graficar.</p>
          )}
          <p className="sr-only">Resumen por estado: {estadoText || 'sin datos'}</p>
        </div>

        <div className="border border-linea bg-acero p-4">
          <h3 className="mb-4 font-display text-lg tracking-widest text-texto">Tareas por mes</h3>
          {porMes.length > 0 ? (
            <div className="relative h-64">
              <canvas
                ref={mesRef}
                role="img"
                aria-label={`Gráfica de barras de tareas por mes. ${mesText}.`}
              ></canvas>
            </div>
          ) : (
            <p className="py-6 text-sm text-texto">Sin datos suficientes para graficar.</p>
          )}
          <p className="sr-only">Resumen por mes: {mesText || 'sin datos'}</p>
        </div>
      </div>

      <section className="border border-linea bg-acero" aria-labelledby="recent-title">
        <header className="border-b border-linea px-4 py-3">
          <h3 id="recent-title" className="font-display text-lg tracking-widest text-texto">
            Tareas recientes
          </h3>
        </header>
        {recientes.length === 0 ? (
          <p className="px-4 py-6 text-sm text-texto">Aún no hay tareas registradas.</p>
        ) : (
          <ul className="divide-y divide-linea">
            {recientes.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <p className={`truncate text-sm ${t.status === 'done' ? 'text-texto line-through' : 'text-blanco'}`}>
                  {t.title}
                </p>
                <span
                  className={`inline-flex shrink-0 px-2 py-0.5 text-[10px] uppercase tracking-widest ${
                    t.status === 'done' ? 'bg-verde/15 text-verde' : 'bg-naranja/15 text-naranja'
                  }`}
                >
                  {t.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

export default Dashboard