const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

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

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const result = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err = new Error(result.error || 'Error del servidor.')
    err.status = res.status
    err.field = result.field || null
    if (res.status === 401 && token) clearSession()
    throw err
  }

  return result
}

export const api = {
  login: (username, password) => request('/auth/login', { method: 'POST', body: { username, password } }),
  listTasks: (token) => request('/tasks', { token }),
  createTask: (token, title) => request('/tasks', { method: 'POST', body: { title }, token }),
  toggleTask: (token, id) => request(`/tasks/${id}/toggle`, { method: 'PATCH', token }),
  deleteTask: (token, id) => request(`/tasks/${id}`, { method: 'DELETE', token }),
  stats: (token) => request('/tasks/stats', { token }),
}