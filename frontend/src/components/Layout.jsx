import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { api, clearSession, getToken, getUser } from '../lib/api.js'
import {
  contarPendientes,
  escucharCambios,
  estaEnLinea,
  sincronizarCola,
} from '../lib/offline.js'
import { IconChart, IconClipboard, IconFlame, IconLogout, IconMap, IconPlus, IconRefresh, Logo } from './Icons.jsx'

const navClass = ({ isActive }) =>
  `flex items-center gap-2 px-3 py-2 text-sm transition-colors border-l-2 ${
    isActive
      ? 'border-naranja bg-naranja/10 text-naranja'
      : 'border-transparent text-texto hover:text-blanco'
  }`

function Layout() {
  const navigate = useNavigate()
  const user = getUser()
  const token = getToken()

  const [enLinea, setEnLinea] = useState(estaEnLinea())
  const [pendientes, setPendientes] = useState(contarPendientes())
  const [sincronizando, setSincronizando] = useState(false)
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    const quitar = escucharCambios(() => {
      setEnLinea(estaEnLinea())
      setPendientes(contarPendientes())
    })
    return quitar
  }, [])

  const logout = () => {
    clearSession()
    navigate('/login', { replace: true })
  }

  const sincronizar = async () => {
    setSincronizando(true)
    setAviso('')
    try {
      const resultado = await sincronizarCola(api, token)
      setPendientes(contarPendientes())
      setAviso(
        resultado.sincronizados
          ? `${resultado.sincronizados} reporte(s) sincronizado(s) con la comunidad.`
          : '',
      )
    } catch (err) {
      setAviso(err.message || 'No se pudo sincronizar.')
    } finally {
      setSincronizando(false)
      setTimeout(() => setAviso(''), 5000)
    }
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
                <span className="block text-[13px] leading-tight text-blanco">{user.nombre}</span>
                <span className="block text-[10px] uppercase tracking-widest text-texto">
                  {user.rol === 'coordinador' ? 'Coordinador' : 'Comunidad'}
                </span>
              </p>
            )}
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 border border-linea px-3 py-2 text-[11px] uppercase tracking-widest text-texto transition-colors hover:border-naranja hover:text-naranja"
            >
              <IconLogout />
              Salir
            </button>
          </div>
        </div>
      </header>

      {(!enLinea || pendientes > 0) && (
        <div
          role="status"
          className={`border-b px-4 py-2 text-xs sm:text-sm ${
            enLinea ? 'border-verde/40 bg-verde/10 text-verde' : 'border-amarillo/40 bg-amarillo/10 text-amarillo'
          }`}
        >
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2">
            <p>
              {enLinea
                ? `${pendientes} reporte(s) pendiente(s) de sincronizar.`
                : 'Modo offline: lo que reportes se guardará y sincronizará al recuperar señal.'}
            </p>
            {enLinea && pendientes > 0 && (
              <button
                type="button"
                onClick={sincronizar}
                disabled={sincronizando}
                className="inline-flex items-center gap-2 bg-verde px-3 py-1.5 font-semibold text-negro transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <IconRefresh />
                {sincronizando ? 'Sincronizando…' : 'Sincronizar ahora'}
              </button>
            )}
          </div>
          {aviso && (
            <p className="mx-auto mt-1 max-w-6xl text-xs text-blanco" role="alert">
              {aviso}
            </p>
          )}
        </div>
      )}

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6">
        <div className="grid gap-4 pb-10 md:grid-cols-[220px_1fr]">
          <nav
            aria-label="Navegación principal"
            className="flex flex-row flex-wrap gap-1 border-b border-linea py-3 md:flex-col md:border-b-0 md:border-r md:py-6 md:pr-4"
          >
            <NavLink to="/feed" end className={navClass}>
              <IconFlame />
              Feed
            </NavLink>
            <NavLink to="/reportar" className={navClass}>
              <IconPlus />
              Reportar
            </NavLink>
            <NavLink to="/mapa" className={navClass}>
              <IconMap />
              Mapa
            </NavLink>
            <NavLink to="/mis-reportes" className={navClass}>
              <IconClipboard />
              Mis reportes
            </NavLink>
            {user?.rol === 'coordinador' && (
              <NavLink to="/admin" className={navClass}>
                <IconChart />
                Administración
              </NavLink>
            )}
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