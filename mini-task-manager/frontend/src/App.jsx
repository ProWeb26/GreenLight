import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Login from './components/Login.jsx'
import { getToken, getUser } from './lib/api.js'

const Tasks = lazy(() => import('./Tasks.jsx'))
const Dashboard = lazy(() => import('./Dashboard.jsx'))

function Protected({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />
}

function GuardedAdmin({ children }) {
  const user = getUser()
  if (!user || user.role !== 'admin') return <Navigate to="/tasks" replace />
  return children
}

function App() {
  const alreadyLogged = getToken()

  return (
    <Suspense fallback={<p className="p-6 text-sm text-texto">Cargando…</p>}>
      <Routes>
        <Route path="/login" element={alreadyLogged ? <Navigate to="/tasks" replace /> : <Login />} />

        <Route
          path="/"
          element={
            <Protected>
              <Layout />
            </Protected>
          }
        >
          <Route index element={<Navigate to="/tasks" replace />} />
          <Route path="tasks" element={<Tasks />} />
          <Route
            path="dashboard"
            element={
              <GuardedAdmin>
                <Dashboard />
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