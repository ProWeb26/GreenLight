import { Suspense, lazy, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Login from './components/Login.jsx'
import { api, clearSession, getToken, getUser, setSession } from './lib/api.js'

const Feed = lazy(() => import('./Feed.jsx'))
const Reportar = lazy(() => import('./Reportar.jsx'))
const MisReportes = lazy(() => import('./MisReportes.jsx'))
const Admin = lazy(() => import('./Admin.jsx'))

function Protected({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />
}

function GuardedAdmin({ children }) {
  const user = getUser()
  if (!user || user.rol !== 'coordinador') return <Navigate to="/feed" replace />
  return children
}

function App() {
  const alreadyLogged = getToken()
  const [reparando, setReparando] = useState(Boolean(alreadyLogged && !getUser()))

  useEffect(() => {
    const token = getToken()
    if (!token || getUser()) return
    api
      .me(token)
      .then((user) => setSession({ token, user }))
      .catch(() => clearSession())
      .finally(() => setReparando(false))
  }, [])

  if (reparando) return <p className="p-6 text-sm text-texto">Cargando…</p>

  return (
    <Suspense fallback={<p className="p-6 text-sm text-texto">Cargando…</p>}>
      <Routes>
        <Route path="/login" element={alreadyLogged ? <Navigate to="/feed" replace /> : <Login />} />

        <Route
          path="/"
          element={
            <Protected>
              <Layout />
            </Protected>
          }
        >
          <Route index element={<Navigate to="/feed" replace />} />
          <Route path="feed" element={<Feed />} />
          <Route path="reportar" element={<Reportar />} />
          <Route path="mis-reportes" element={<MisReportes />} />
          <Route
            path="admin"
            element={
              <GuardedAdmin>
                <Admin />
              </GuardedAdmin>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App