import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api, getToken, setSession } from '../lib/api.js'
import Field from './Field.jsx'
import { Logo } from './Icons.jsx'
import {
  validarContraseña,
  validarCorreo,
  validarNombre,
} from '../lib/validation.js'

const vacio = { modo: 'login', nombre: '', correo: '', comunidad_id: '', contraseña: '' }

function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState(vacio)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [comunidades, setComunidades] = useState([])

  useEffect(() => {
    api
      .listarComunidades()
      .then(setComunidades)
      .catch(() => {
        /* las comunidades son opcionales al registrarse */
      })
  }, [])

  if (getToken()) return <Navigate to="/feed" replace />

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const cambiarModo = (modo) => {
    setForm(vacio)
    setErrors({})
    setServerError('')
    setForm((prev) => ({ ...prev, modo }))
  }

  const validate = () => {
    const next = {}
    if (form.modo === 'registro') {
      const n = validarNombre(form.nombre)
      if (n) next.nombre = n
      const c = validarCorreo(form.correo)
      if (c) next.correo = c
    } else {
      const c = validarCorreo(form.correo)
      if (c) next.correo = c
    }
    const p = validarContraseña(form.contraseña)
    if (p) next.contraseña = p
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    if (!validate()) return
    setLoading(true)
    try {
      const session =
        form.modo === 'registro'
          ? await api.registro({
              nombre: form.nombre.trim(),
              correo: form.correo.trim(),
              contraseña: form.contraseña,
              comunidad_id: form.comunidad_id || undefined,
            })
          : await api.login(form.correo.trim(), form.contraseña)
      setSession({ token: session.token, user: session.usuario })
      navigate('/feed', { replace: true })
    } catch (err) {
      if (err.status === 403 || err.status === 401) {
        setErrors((prev) => ({
          ...prev,
          contraseña: 'Credenciales inválidas. Revisa el correo y la contraseña.',
        }))
      } else if (err.status === 409) {
        setServerError('Ya existe un usuario con ese correo.')
      } else {
        setServerError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const esRegistro = form.modo === 'registro'

  return (
    <main className="flex min-h-screen items-center justify-center bg-negro px-4 py-10 text-blanco">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo />
          <p className="max-w-xs text-sm text-texto">
            Red comunitaria de reporte de quemas y focos de humo. Funciona con conexión inestable.
          </p>
        </div>

        <section className="border border-linea bg-acero" aria-labelledby="login-title">
          <div className="grid grid-cols-2 border-b border-linea">
            {['login', 'registro'].map((modo) => (
              <button
                key={modo}
                type="button"
                onClick={() => cambiarModo(modo)}
                aria-pressed={form.modo === modo}
                className={`px-5 py-3 text-[11px] uppercase tracking-widest transition-colors ${
                  form.modo === modo ? 'bg-naranja/15 text-naranja' : 'text-texto hover:text-blanco'
                }`}
              >
                {modo === 'login' ? 'Ingresar' : 'Registrarme'}
              </button>
            ))}
          </div>

          <h2 id="login-title" className="px-5 pt-4 text-[11px] uppercase tracking-widest text-texto">
            {esRegistro ? 'Crear cuenta comunitaria' : 'Acceso a la red'}
          </h2>

          <form className="p-5" onSubmit={handleSubmit} noValidate>
            {serverError && (
              <div role="alert" className="mb-4 border-l-4 border-rojo bg-rojo/10 px-4 py-3 text-sm text-rojo">
                {serverError}
              </div>
            )}

            {esRegistro && (
              <Field
                id="nombre"
                name="nombre"
                label="Nombre"
                value={form.nombre}
                onChange={handleChange}
                error={errors.nombre}
                autoComplete="name"
                placeholder="Ej. Vecina María"
              />
            )}

            <Field
              id="correo"
              name="correo"
              type="email"
              label="Correo"
              value={form.correo}
              onChange={handleChange}
              error={errors.correo}
              autoComplete="email"
              placeholder="tu@correo.com"
            />

            {esRegistro && (
              <Field
                id="comunidad_id"
                name="comunidad_id"
                as="select"
                label="Comunidad (opcional)"
                value={form.comunidad_id}
                onChange={handleChange}
                error={errors.comunidad_id}
                options={[{ value: '', label: 'Sin comunidad' }, ...comunidades.map((c) => ({ value: c.id, label: c.nombre }))]}
              />
            )}

            <Field
              id="contraseña"
              name="contraseña"
              type="password"
              label="Contraseña"
              value={form.contraseña}
              onChange={handleChange}
              error={errors.contraseña}
              autoComplete={esRegistro ? 'new-password' : 'current-password'}
            />

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 bg-naranja px-5 py-2.5 font-display text-sm font-semibold uppercase tracking-widest text-negro transition-colors hover:bg-naranja-claro disabled:opacity-50"
            >
              {loading ? 'Procesando…' : esRegistro ? 'Crear cuenta' : 'Ingresar'}
            </button>

            <p className="mt-4 text-center text-xs text-texto">
              Cuentas de prueba:{' '}
              <strong className="font-semibold text-naranja">coordinador@greenlight.test</strong> / Coordi123! ·{' '}
              <strong className="font-semibold text-naranja">maria@greenlight.test</strong> / Vecino123!
            </p>
          </form>
        </section>
      </div>
    </main>
  )
}

export default Login