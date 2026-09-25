import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import { api } from './lib/api.js'
import {
  CENTRO,
  TILE_LAYER,
  ESTADOS_MAPA,
  colorEstado,
  crearIconoComunidad,
  crearIconoFoco,
  escapeHtml,
} from './lib/mapa.js'

function PopupContenido({ r }) {
  const estado = ESTADOS_MAPA[r.estado]?.label || 'Activo'
  return (
    <article style={{ minWidth: 220 }}>
      <header className="mb-2 flex flex-wrap items-center gap-2">
        <span className="font-display text-sm tracking-wider text-naranja">{r.slug_url}</span>
        {r.icono && <span style={{ backgroundColor: `${r.color_etiqueta}26`, color: r.color_etiqueta, padding: '0 6px' }}>{r.icono} {r.tipo}</span>}
        <span style={{ backgroundColor: `${colorEstado(r.estado)}26`, color: colorEstado(r.estado) }} className="ml-auto px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
          {estado}
        </span>
      </header>
      <p className="text-xs leading-relaxed">{r.descripcion}</p>
      {r.ubicacion_texto && (
        <p className="mt-1 text-[11px] opacity-70">📍 {r.ubicacion_texto}</p>
      )}
      <p className="mt-1 text-[11px] opacity-60">
        {r.comunidad || 'Sin comunidad'} · por {r.autor} · {r.confirmaciones} confirmación(es)
      </p>
      <p className="mt-1 text-[10px] opacity-50">
        {new Date(r.fecha_creacion).toLocaleString('es-BO')}
      </p>
    </article>
  )
}

function Mapa() {
  const contenedor = useRef(null)
  const mapaRef = useRef(null)
  const capaReportes = useRef(null)
  const capaComunidades = useRef(null)

  const [reportes, setReportes] = useState([])
  const [tipos, setTipos] = useState([])
  const [comunidades, setComunidades] = useState([])
  const [filtroTipo, setFiltroTipo] = useState('')
  const [verComunidades, setVerComunidades] = useState(true)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)
  const [contando, setContando] = useState(0)

  useEffect(() => {
    let activo = true
    ;(async () => {
      try {
        const [feed, tiposData, comunas] = await Promise.all([
          api.feed(),
          api.listarTipos(),
          api.listarComunidades(),
        ])
        if (!activo) return
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
  }, [])

  useEffect(() => {
    const el = contenedor.current
    if (!el || mapaRef.current) return
    const mapa = L.map(el, { center: CENTRO, zoom: 12, scrollWheelZoom: false })
    mapaRef.current = mapa
    L.tileLayer(TILE_LAYER.url, { attribution: TILE_LAYER.attribution, maxZoom: 19 }).addTo(mapa)
    capaReportes.current = L.layerGroup().addTo(mapa)
    capaComunidades.current = L.layerGroup().addTo(mapa)
    return () => {
      mapa.remove()
      mapaRef.current = null
      if (el) el.innerHTML = ''
    }
  }, [])

  useEffect(() => {
    if (!mapaRef.current) return
    const activo = filtroTipo ? Number(filtroTipo) : null

    capaReportes.current.clearLayers()
    capaComunidades.current.clearLayers()

    const conCoordenadas = reportes.filter(
      (r) => (activo === null || r.tipo_id === activo) && Number.isFinite(r.latitud) && Number.isFinite(r.longitud),
    )
    setContando(conCoordenadas.length)

    conCoordenadas.forEach((r) => {
      const marcador = L.marker([r.latitud, r.longitud], { icon: crearIconoFoco(r.estado) })
      marcador.bindPopup(() => PopupContenido({ r }))
      marcador.addTo(capaReportes.current)
    })

    if (verComunidades) {
      comunidades.forEach((c) => {
        if (!Number.isFinite(c.latitud) || !Number.isFinite(c.longitud)) return
        const marca = L.marker([c.latitud, c.longitud], { icon: crearIconoComunidad() })
        marca.bindPopup(`<strong>${escapeHtml(c.nombre)}</strong><br/><span class="opacity-70">${escapeHtml(c.zona_ciudad || '')}</span>`)
        marca.addTo(capaComunidades.current)
      })
    }

    const bounds = L.latLngBounds(
      conCoordenadas.map((r) => [r.latitud, r.longitud]),
      comunidades.filter((c) => verComunidades && Number.isFinite(c.latitud) && Number.isFinite(c.longitud)).map((c) => [c.latitud, c.longitud]),
    )
    if (bounds.isValid()) {
      mapaRef.current.fitBounds(bounds.pad(0.15), { maxZoom: 14 })
    } else {
      mapaRef.current.setView(CENTRO, 12)
    }
  }, [reportes, filtroTipo, verComunidades, comunidades])

  const sinCoordenadas = reportes.length - contando

  return (
    <section aria-labelledby="mapa-title">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h1 id="mapa-title" className="font-display text-3xl tracking-wider text-blanco">
          Mapa de la comunidad
        </h1>
        <p className="text-xs text-texto">
          {cargando ? '…' : `${contando} foco(s) con ubicación`}{sinCoordenadas > 0 ? ` · ${sinCoordenadas} sin coordenadas` : ''}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded border border-linea bg-acero p-3 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-texto">Tipo</span>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="border border-linea bg-gris px-3 py-1.5 text-sm text-blanco focus:border-naranja"
          >
            <option value="">Todos</option>
            {tipos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.icono} {t.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-xs uppercase tracking-widest text-texto">
          <input
            type="checkbox"
            checked={verComunidades}
            onChange={(e) => setVerComunidades(e.target.checked)}
            className="h-4 w-4 accent-[#3dba6e]"
          />
          Ver comunidades
        </label>
        <div className="ml-auto flex flex-wrap gap-3 text-[10px] uppercase tracking-widest text-texto">
          {Object.entries(ESTADOS_MAPA).map(([estado, info]) => (
            <span key={estado} className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5" style={{ backgroundColor: info.color }} />
              {info.label}
            </span>
          ))}
        </div>
      </div>

      {error && (
        <p className="mb-4 border-l-4 border-rojo bg-rojo/10 px-4 py-3 text-sm text-rojo" role="alert">
          {error}
        </p>
      )}

      <div
        ref={contenedor}
        className="leaflet-map h-[58vh] min-h-[420px] w-full border border-linea bg-gris"
        aria-label="Mapa de focos reportados"
      />

      {!cargando && contando === 0 && (
        <div className="mt-4 border border-dashed border-linea p-6 text-center text-sm text-texto">
          {reportes.length === 0 ? (
            <>
              Todavía no hay reportes. <Link className="text-naranja underline" to="/reportar">Reporta el primero</Link>.
            </>
          ) : (
            <>
              No hay focos con coordenadas{' '}
              {filtroTipo ? 'para ese tipo' : 'para mostrar en el mapa'}.{' '}
              <Link className="text-naranja underline" to="/reportar">Reportar uno nuevo</Link> o
              usa <Link className="text-naranja underline" to="/feed">el feed</Link>.
            </>
          )}
        </div>
      )}
    </section>
  )
}

export default Mapa