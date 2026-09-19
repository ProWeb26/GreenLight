const QUEUE_KEY = 'greenlight_cola_v1'

let escuchando = false
const oyentes = new Set()

function notificar() {
  oyentes.forEach((fn) => fn())
}

export function estaEnLinea() {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}

export function obtenerCola() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
  } catch {
    return []
  }
}

export function contarPendientes() {
  return obtenerCola().length
}

export function agregarPendiente(item) {
  const cola = obtenerCola()
  const nuevo = { id_cliente: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...item }
  cola.push(nuevo)
  localStorage.setItem(QUEUE_KEY, JSON.stringify(cola))
  notificar()
  return nuevo
}

export function limpiarCola() {
  localStorage.removeItem(QUEUE_KEY)
  notificar()
}

export function escucharCambios(fn) {
  oyentes.add(fn)
  if (!escuchando) {
    escuchando = true
    window.addEventListener('storage', notificar)
    window.addEventListener('online', notificar)
    window.addEventListener('offline', notificar)
  }
  return () => {
    oyentes.delete(fn)
  }
}

export async function sincronizarCola(api, token) {
  const cola = obtenerCola()
  if (!cola.length) return { sincronizados: 0, pendientes: 0 }
  if (!estaEnLinea()) return { sincronizados: 0, pendientes: cola.length }

  const reportes = cola.filter((i) => i.tipo === 'reporte').map((i) => i.reporte)
  const confirmaciones = cola
    .filter((i) => i.tipo === 'confirmacion')
    .map((i) => ({ reporte_id: i.reporte_id }))

  const resultado = await api.sincronizar(token, { reportes, confirmaciones })
  limpiarCola()
  return { sincronizados: cola.length, pendientes: 0, resultado }
}