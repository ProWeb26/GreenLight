import { useState } from 'react'
import Reportes from './Reportes.jsx'
import Dashboard from './Dashboard.jsx'
import './App.css'

const API_URL = 'http://localhost:3000/api'
const TOKEN_KEY = 'greenlight_token'
const USER_KEY = 'greenlight_user'

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '')
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem(USER_KEY) || 'null'))
  const [login, setLogin] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [view, setView] = useState('reportes')

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken('')
    setUser(null)
    setError('')
    setView('reportes')
  }

  const handleLoginChange = (e) => {
    const { name, value } = e.target
    setLogin((prev) => ({ ...prev, [name]: value }))
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(login),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Error al iniciar sesión.')
      localStorage.setItem(TOKEN_KEY, result.token)
      localStorage.setItem(USER_KEY, JSON.stringify(result.user))
      setToken(result.token)
      setUser(result.user)
      setLogin({ username: '', password: '' })
    } catch (err) {
      setError(err.message)
    }
  }

  if (!token) {
    return (
      <div className="login-wrap">
        <div className="login-brand">
          <span className="logo-badge">GL</span>
          <h1>GREENLIGHT</h1>
          <span className="login-sub">Panel Comunitario</span>
        </div>
        <div className="form-panel">
          <div className="form-panel-header">
            <span className="icono"></span>
            <span>Acceso al sistema</span>
          </div>
          <form className="form-body" onSubmit={handleLogin}>
            <div className="campo">
              <label htmlFor="username">Usuario</label>
              <input
                type="text"
                id="username"
                name="username"
                value={login.username}
                onChange={handleLoginChange}
                placeholder="nombre de usuario"
                required
              />
            </div>
            <div className="campo">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                value={login.password}
                onChange={handleLoginChange}
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <div className="alerta alerta-error" role="alert">
                <i className="fas fa-exclamation-circle"></i>
                {error}
              </div>
            )}
            <button type="submit" className="btn btn-primary w-full">
              Ingresar
            </button>
            <p className="login-hint">
              Usuarios de prueba: <strong>admin</strong>/Admin123! · <strong>vecino</strong>/Vecino123!
            </p>
          </form>
        </div>
      </div>
    )
  }

  const isAdmin = user?.role === 'admin'

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="contenedor header-inner">
          <div className="logo-grupo">
            <span className="logo-badge">GL</span>
            <div className="logo-texto">
              <h1>GREENLIGHT</h1>
              <span>Panel Comunitario</span>
            </div>
          </div>
          <div className="header-nav-right">
            <div className="header-user">
              <i className="fas fa-user-circle"></i>
              <div>
                <div className="user-name">{user?.nombre || user?.username}</div>
                <div className="user-rol">{user?.role}</div>
              </div>
            </div>
            <a className="header-link" role="button" onClick={logout} title="Cerrar sesión">
              <i className="fas fa-sign-out-alt"></i> Salir
            </a>
          </div>
        </div>
      </header>

      <div className="admin-layout contenedor">
        <aside className="admin-sidebar">
          <div className="sidebar-section">
            <div className="sidebar-label">Principal</div>
            {isAdmin && (
              <a
                className={view === 'dashboard' ? 'activo' : ''}
                role="button"
                onClick={() => setView('dashboard')}
              >
                <i className="fas fa-chart-pie"></i> Dashboard
              </a>
            )}
            <a
              className={view === 'reportes' ? 'activo' : ''}
              role="button"
              onClick={() => setView('reportes')}
            >
              <i className="fas fa-clipboard-list"></i> Reportes
            </a>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-label">Cuenta</div>
            <a role="button" onClick={logout}>
              <i className="fas fa-sign-out-alt"></i> Salir
            </a>
          </div>
        </aside>

        <main className="admin-content">
          {view === 'dashboard' && isAdmin ? (
            <Dashboard token={token} onLogout={logout} />
          ) : (
            <Reportes token={token} user={user} onLogout={logout} />
          )}
        </main>
      </div>
    </div>
  )
}

export default App