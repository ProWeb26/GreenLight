import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { CENTRO, TILE_LAYER } from '../lib/mapa.js'

function MapaLugar({ latitud, longitud, onChange }) {
  const contenedor = useRef(null)
  const mapaRef = useRef(null)
  const marcadorRef = useRef(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const ponerMarcador = (lat, lon, centrar = false) => {
    if (!mapaRef.current || !Number.isFinite(lat) || !Number.isFinite(lon)) return
    if (!marcadorRef.current) {
      marcadorRef.current = L.marker([lat, lon], { draggable: true })
      marcadorRef.current.on('dragend', () => {
        const pos = marcadorRef.current.getLatLng()
        onChangeRef.current(pos.lat, pos.lng)
      })
      marcadorRef.current.addTo(mapaRef.current)
    } else {
      marcadorRef.current.setLatLng([lat, lon])
    }
    if (centrar) mapaRef.current.setView([lat, lon], 16)
  }

  useEffect(() => {
    const el = contenedor.current
    if (!el || mapaRef.current) return
    const mapa = L.map(el, { center: CENTRO, zoom: 13, scrollWheelZoom: false })
    mapaRef.current = mapa
    L.tileLayer(TILE_LAYER.url, { attribution: TILE_LAYER.attribution, maxZoom: 19 }).addTo(mapa)
    mapaRef.current.on('click', (e) => {
      ponerMarcador(e.latlng.lat, e.latlng.lng, false)
      onChangeRef.current(e.latlng.lat, e.latlng.lng)
    })
    return () => {
      mapa.remove()
      mapaRef.current = null
      marcadorRef.current = null
      if (el) el.innerHTML = ''
    }
  }, [])

  useEffect(() => {
    if (Number.isFinite(latitud) && Number.isFinite(longitud)) {
      ponerMarcador(latitud, longitud, true)
    }
  }, [latitud, longitud])

  const usarMiUbicacion = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        ponerMarcador(pos.coords.latitude, pos.coords.longitude, true)
        onChangeRef.current(pos.coords.latitude, pos.coords.longitude)
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  return (
    <div className="mb-4">
      <div className="mb-1 flex items-end justify-between gap-2">
        <label className="block text-[10px] uppercase tracking-widest text-texto" id="lugar-label">
          Marcar en el mapa
        </label>
        <button
          type="button"
          onClick={usarMiUbicacion}
          className="text-[11px] uppercase tracking-widest text-naranja underline underline-offset-4 hover:text-naranja-claro"
        >
          Usar mi ubicación
        </button>
      </div>
      <div
        ref={contenedor}
        role="application"
        aria-label="Mapa para seleccionar la ubicación del foco"
        className="leaflet-map h-56 w-full border border-linea bg-gris"
      />
      <p className="mt-1 text-xs text-texto" aria-live="polite">
        {Number.isFinite(latitud) && Number.isFinite(longitud)
          ? `📍 ${latitud.toFixed(5)}, ${longitud.toFixed(5)} — haz clic en el mapa para mover el marcador.`
          : 'Haz clic en el mapa para colocar el marcador (opcional).'}
      </p>
    </div>
  )
}

export default MapaLugar