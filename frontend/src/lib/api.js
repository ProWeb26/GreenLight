const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const TOKEN_KEY = 'greenlight_token'
const USER_KEY = 'greenlight_user'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}

export function setSession({ token, user }) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Sin conexión con el servidor. Verifica tu internet.')
  }

  const result = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err = new Error(result.error || 'Error del servidor.')
    err.status = res.status
    if (res.status === 401 && token) clearSession()
    throw err
  }

  return result
}

function tokenHeaders(token) {
  return token ? { token } : {}
}

export const api = {
  login: (correo, contraseña) =>
    request('/auth/login', { method: 'POST', body: { correo, contraseña } }),
  registro: (datos) => request('/auth/registro', { method: 'POST', body: datos }),
  me: (token) => request('/auth/me', { token }),

  feed: (filtros = {}) => {
    const params = new URLSearchParams()
    if (filtros.tipo_id) params.set('tipo_id', filtros.tipo_id)
    if (filtros.comunidad_id) params.set('comunidad_id', filtros.comunidad_id)
    if (filtros.estado) params.set('estado', filtros.estado)
    const qs = params.toString()
    return request(qs ? `/feed?${qs}` : '/feed')
  },
  crearReporte: (token, datos) => request('/reportes', { method: 'POST', body: datos, token }),
  obtenerReporte: (id) => request(`/reportes/${id}`),
  actualizarReporte: (token, id, datos) =>
    request(`/reportes/${id}`, { method: 'PATCH', body: datos, token }),
  eliminarReporte: (token, id) => request(`/reportes/${id}`, { method: 'DELETE', token }),
  confirmarReporte: (token, id) =>
    request(`/reportes/${id}/confirmar`, { method: 'POST', token }),
  cambiarEstado: (token, id, estado) =>
    request(`/reportes/${id}/estado`, { method: 'PATCH', body: { estado }, token }),
  sincronizar: (token, cuerpo) => request('/sync', { method: 'POST', body: cuerpo, token }),
  stats: () => request('/stats'),

  listarComunidades: () => request('/comunidades'),
  listarTipos: () => request('/tipo-incidentes'),
  crearComunidad: (token, datos) =>
    request('/comunidades', { method: 'POST', body: datos, token }),
  actualizarComunidad: (token, id, datos) =>
    request(`/comunidades/${id}`, { method: 'PUT', body: datos, token }),
  eliminarComunidad: (token, id) => request(`/comunidades/${id}`, { method: 'DELETE', token }),
  crearTipo: (token, datos) => request('/tipo-incidentes', { method: 'POST', body: datos, token }),
  actualizarTipo: (token, id, datos) =>
    request(`/tipo-incidentes/${id}`, { method: 'PUT', body: datos, token }),
  eliminarTipo: (token, id) => request(`/tipo-incidentes/${id}`, { method: 'DELETE', token }),

  listarUsuarios: (token) => request('/auth/usuarios', tokenHeaders(token)),
  crearUsuarioAdmin: (token, datos) =>
    request('/auth/usuarios', { method: 'POST', body: datos, token }),
  actualizarUsuario: (token, id, datos) =>
    request(`/auth/usuarios/${id}`, { method: 'PUT', body: datos, token }),
  eliminarUsuario: (token, id) => request(`/auth/usuarios/${id}`, { method: 'DELETE', token }),
}