import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getToken, getUser } from './lib/api.js'
import Field from './components/Field.jsx'
import { agregarPendiente, estaEnLinea } from './lib/offline.js'
import { validarDescripcion, validarUbicacion } from './lib/validation.js'

const vacio = { tipo_id: '', comunidad_id: '', ubicacion_texto: '', descripcion: '' }

function Reportar() {
  const navigate = useNavigate()
  const token = getToken()
  const user = getUser()

  const [form, setForm] = useState(vacio)
  const [errors, setErrors] = useState({})
  const [tipos, setTipos] = useState([])
  const [comunidades, setComunidades] = useState([])
  const [serverError, setServerError] = useState('')
  const [guardadoLocal, setGuardadoLocal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    Promise.all([api.listarTipos(), api.listarComunidades()])
      .then(([t, c]) => {
        setTipos(t)
        setComunidades(c)
        setForm((prev) => ({ ...prev, tipo_id: t[0]?.id || '', comunidad_id: user?.comunidad_id || '' }))
      })
      .catch((err) => setServerError(err.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const next = {}
    if (!form.tipo_id) next.tipo_id = 'Selecciona el tipo de incidente.'
    const d = validarDescripcion(form.descripcion)
    if (d) next.descripcion = d
    const u = validarUbicacion(form.ubicacion_texto)
    if (u) next.ubicacion_texto = u
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    setGuardadoLocal(false)
    if (!validate()) return

    const datos = {
      tipo_id: Number(form.tipo_id),
      comunidad_id: form.comunidad_id || undefined,
      ubicacion_texto: form.ubicacion_texto.trim(),
      descripcion: form.descripcion.trim(),
    }

    if (!estaEnLinea()) {
      agregarPendiente({ tipo: 'reporte', reporte: datos })
      setGuardadoLocal(true)
      setEnviado(true)
      return
    }

    setLoading(true)
    try {
      await api.crearReporte(token, datos)
      setEnviado(true)
    } catch (err) {
      setServerError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (enviado) {
    return (
      <section className="border border-verde/40 bg-verde/10 p-6 text-center" aria-labelledby="ok-title">
        <h1 id="ok-title" className="font-display text-2xl tracking-wider text-verde">
          {guardadoLocal ? 'Reporte guardado en tu dispositivo' : '¡Reporte publicado!'}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-blanco">
          {guardadoLocal
            ? 'Quedó en la cola de sincronización y aparecerá en el feed cuando recuperes conexión.'
            : 'Gracias por ayudar a tu comunidad. Tu reporte ya es visible para todos en el feed.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/feed')}
          className="mt-5 bg-naranja px-5 py-2.5 font-display text-sm font-semibold uppercase tracking-widest text-negro transition-colors hover:bg-naranja-claro"
        >
          Ver el feed
        </button>
      </section>
    )
  }

  return (
    <section aria-labelledby="reportar-title">
      <h1 id="reportar-title" className="mb-1 font-display text-3xl tracking-wider text-blanco">
        Reportar un foco
      </h1>
      <p className="mb-5 text-sm text-texto">
        Reporta quemas o focos de humo. Si no hay conexión, se guarda y se sincroniza después.
      </p>

      <form onSubmit={handleSubmit} noValidate className="max-w-2xl">
        {serverError && (
          <div role="alert" className="mb-4 border-l-4 border-rojo bg-rojo/10 px-4 py-3 text-sm text-rojo">
            {serverError}
          </div>
        )}

        <Field
          id="tipo_id"
          name="tipo_id"
          as="select"
          label="Tipo de incidente"
          value={form.tipo_id}
          onChange={handleChange}
          error={errors.tipo_id}
          options={[{ value: '', label: 'Selecciona un tipo…' }, ...tipos.map((t) => ({ value: t.id, label: `${t.icono} ${t.nombre}` }))]}
        />

        <Field
          id="comunidad_id"
          name="comunidad_id"
          as="select"
          label="Comunidad / zona"
          value={form.comunidad_id}
          onChange={handleChange}
          error={errors.comunidad_id}
          options={[{ value: '', label: 'Sin comunidad' }, ...comunidades.map((c) => ({ value: c.id, label: c.nombre }))]}
        />

        <Field
          id="ubicacion_texto"
          name="ubicacion_texto"
          label="Ubicación"
          value={form.ubicacion_texto}
          onChange={handleChange}
          error={errors.ubicacion_texto}
          placeholder="Ej. Vereda El Roble, km 4"
          hint="Puede ser una referencia conocida por la comunidad o coordenadas."
        />

        <Field
          id="descripcion"
          name="descripcion"
          as="textarea"
          label="Descripción"
          value={form.descripcion}
          onChange={handleChange}
          error={errors.descripcion}
          placeholder="Describe qué se ve: humo, llama, tamaño aproximado…"
        />

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 bg-naranja px-5 py-2.5 font-display text-sm font-semibold uppercase tracking-widest text-negro transition-colors hover:bg-naranja-claro disabled:opacity-50"
        >
          {loading ? 'Publicando…' : 'Publicar reporte'}
        </button>
      </form>
    </section>
  )
}

export default Reportar