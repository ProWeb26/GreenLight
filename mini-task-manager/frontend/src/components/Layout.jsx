import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearSession, getUser } from '../lib/api.js'
import { IconChart, IconClipboard, IconLogout, Logo } from './Icons.jsx'

const navClass = ({ isActive }) =>
  `flex items-center gap-2 px-3 py-2 text-sm transition-colors border-l-2 ${
    isActive
      ? 'border-naranja bg-naranja/10 text-naranja'
      : 'border-transparent text-texto hover:text-blanco'
  }`

function Layout() {
  const navigate = useNavigate()
  const user = getUser()

  const logout = () => {
    clearSession()
    navigate('/login', { replace: true })
  }

  return (
    <div className="relative z-10 flex min-h-screen flex-col bg-negro font-sans text-blanco">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:bg-naranja focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:uppercase focus:tracking-wider focus:text-negro"
      >
        Ir al contenido principal
      </a>

      <header className="border-b border-linea bg-acero">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-3">
            {user && (
              <p className="hidden pr-4 text-right sm:block">
                <span className="block text-[13px] leading-tight text-blanco">
                  {user.nombre || user.username}
                </span>
                <span className="block text-[10px] uppercase tracking-widest text-texto">
                  {user.role}
                </span>
              </p>
            )}
            <button
              type="button"
              onClick={logout}
              className={`inline-flex items-center gap-2 border border-linea px-3 py-2 text-[11px] uppercase tracking-widest text-texto transition-colors ${
                user ? '' : 'sm:mr-0'
              } hover:border-naranja hover:text-naranja`}
            >
              <IconLogout />
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6">
        <div className="grid gap-4 pb-10 md:grid-cols-[220px_1fr]">
          <nav
            aria-label="Navegación principal"
            className="flex flex-row flex-wrap gap-1 border-b border-linea py-3 md:flex-col md:border-b-0 md:border-r md:py-6 md:pr-4"
          >
            {user?.role === 'admin' && (
              <NavLink to="/dashboard" className={navClass}>
                <IconChart />
                Dashboard
              </NavLink>
            )}
            <NavLink to="/tasks" end className={navClass}>
              <IconClipboard />
              Tareas
            </NavLink>
          </nav>

          <main id="main" className="min-w-0 py-6 md:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default Layout