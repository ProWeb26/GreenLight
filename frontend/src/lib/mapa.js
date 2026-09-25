import L from 'leaflet'

export const CENTRO = [-17.7863, -63.1812] // Santa Cruz de la Sierra

export const TILE_LAYER = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}

export const ESTADOS_MAPA = {
  activo: { label: 'Activo', color: '#f0c030' },
  confirmado_comunidad: { label: 'Confirmado', color: '#3dba6e' },
  verificado: { label: 'Verificado', color: '#f0ede8' },
}

export function colorEstado(estado) {
  return ESTADOS_MAPA[estado]?.color || '#f05a00'
}

export function crearIconoFoco(estado) {
  const color = colorEstado(estado)
  return L.divIcon({
    className: '',
    iconSize: [22, 26],
    iconAnchor: [11, 26],
    popupAnchor: [0, -24],
    html: `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2px solid #0a0a0a;box-shadow:0 2px 6px rgba(0,0,0,0.5);position:relative"></div>`,
  })
}

export function crearIconoComunidad() {
  return L.divIcon({
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    html: '<div style="width:16px;height:16px;border-radius:50%;background:transparent;border:2px dashed #3dba6e"></div>',
  })
}

export function escapeHtml(texto) {
  return String(texto ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}