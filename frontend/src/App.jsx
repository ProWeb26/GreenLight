import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Login from './components/Login.jsx'
import { getToken, getUser } from './lib/api.js'

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