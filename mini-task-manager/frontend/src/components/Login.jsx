import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api, getToken, setSession } from '../lib/api.js'
import { Logo } from './Icons.jsx'

const empty = { username: '', password: '' }

function Field({ id, label, name, type = 'text', value, onChange, error, autoComplete }) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1 block text-[11px] font-medium uppercase tracking-widest text-texto">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full border bg-gris px-3 py-2.5 text-sm text-blanco placeholder:text-texto/60 transition-colors ${
          error ? 'border-rojo' : 'border-linea focus:border-naranja'
        }`}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-rojo" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  if (getToken()) return <Navigate to="/tasks" replace />

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const next = {}
    if (!form.username.trim()) next.username = 'El usuario es obligatorio.'
    if (!form.password) next.password = 'La contraseña es obligatoria.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    if (!validate()) return
    setLoading(true)
    try {
      const session = await api.login(form.username.trim(), form.password)
      setSession(session)
      navigate(session.user.role === 'admin' ? '/dashboard' : '/tasks', { replace: true })
    } catch (err) {
      if (err.status === 401) {
        setErrors((prev) => ({
          ...prev,
          password: 'Credenciales inválidas. Prueba con admin / Vecino123!.',
        }))
      } else {
        setServerError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-negro px-4 py-10 text-blanco">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo />
        </div>

        <section className="border border-linea bg-acero" aria-labelledby="login-title">
          <div className="flex items-center gap-2 border-b border-linea px-5 py-4">
            <span className="h-2 w-2 rounded-full bg-naranja" aria-hidden="true" />
            <h2 id="login-title" className="text-[11px] uppercase tracking-widest text-texto">
              Acceso al sistema
            </h2>
          </div>

          <form className="p-5" onSubmit={handleSubmit} noValidate>
            {serverError && (
              <div role="alert" className="mb-4 border-l-4 border-rojo bg-rojo/10 px-4 py-3 text-sm text-rojo">
                {serverError}
              </div>
            )}

            <Field
              id="username"
              name="username"
              label="Usuario"
              value={form.username}
              onChange={handleChange}
              error={errors.username}
              autoComplete="username"
            />
            <Field
              id="password"
              name="password"
              type="password"
              label="Contraseña"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              autoComplete="current-password"
            />

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 bg-naranja px-5 py-2.5 font-display text-sm font-semibold uppercase tracking-widest text-negro transition-colors hover:bg-naranja-claro disabled:opacity-50"
            >
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>

            <p className="mt-4 text-center text-xs text-texto">
              Usuarios de prueba:{' '}
              <strong className="font-semibold text-naranja">admin</strong>/Admin123! ·{' '}
              <strong className="font-semibold text-naranja">vecino</strong>/Vecino123!
            </p>
          </form>
        </section>
      </div>
    </main>
  )
}

export default Login