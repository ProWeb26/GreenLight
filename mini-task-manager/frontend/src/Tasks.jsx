import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getToken, getUser } from './lib/api.js'
import { validateTitle } from './lib/validation.js'
import { IconCheck, IconPlus, IconTrash } from './components/Icons.jsx'

function Stat({ num, label }) {
  return (
    <div className="bg-acero p-4">
      <p className="font-display text-3xl leading-none text-naranja">{num}</p>
      <p className="mt-1 text-[10px] uppercase tracking-widest text-texto">{label}</p>
    </div>
  )
}

function Tasks() {
  const navigate = useNavigate()
  const user = getUser()
  const isAdmin = user?.role === 'admin'

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [titleError, setTitleError] = useState('')
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    try {
      const result = await api.listTasks(getToken())
      setTasks(result.data)
      setError('')
    } catch (err) {
      if (err.status === 401) {
        navigate('/login', { replace: true })
        return
      }
      setError('No se pudo cargar el listado de tareas.')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    let active = true
    const init = async () => {
      try {
        const result = await api.listTasks(getToken())
        if (active) {
          setTasks(result.data)
          setError('')
        }
      } catch (err) {
        if (err.status === 401) {
          navigate('/login', { replace: true })
          return
        }
        if (active) setError('No se pudo cargar el listado de tareas.')
      } finally {
        if (active) setLoading(false)
      }
    }
    init()
    return () => {
      active = false
    }
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fieldError = validateTitle(title)
    setTitleError(fieldError)
    if (fieldError) return

    setCreating(true)
    setError('')
    try {
      await api.createTask(getToken(), title)
      setTitle('')
      setTitleError('')
      await load()
    } catch (err) {
      if (err.status === 401) {
        navigate('/login', { replace: true })
        return
      }
      if (err.field === 'title') setTitleError(err.message)
      else setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const toggle = async (id) => {
    setError('')
    try {
      await api.toggleTask(getToken(), id)
      await load()
    } catch (err) {
      if (err.status === 401) {
        navigate('/login', { replace: true })
        return
      }
      setError(err.message)
    }
  }

  const remove = async (id) => {
    setError('')
    try {
      await api.deleteTask(getToken(), id)
      await load()
    } catch (err) {
      if (err.status === 401) {
        navigate('/login', { replace: true })
        return
      }
      setError(err.message)
    }
  }

  const pending = tasks.filter((t) => t.status === 'pending').length
  const done = tasks.filter((t) => t.status === 'done').length

  return (
    <>
      <header className="mb-6">
        <h2 className="font-display text-3xl tracking-wider text-blanco">Gestión de Tareas</h2>
        <p className="mt-1 text-sm text-texto">Registra, completa y elimina las tareas de la comunidad.</p>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-4 flex items-center gap-2 border-l-4 border-rojo bg-rojo/10 px-4 py-3 text-sm text-rojo"
        >
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-px border border-linea bg-linea sm:grid-cols-3" aria-label="Resumen de tareas">
        <Stat num={tasks.length} label="Total" />
        <Stat num={pending} label="Pendientes" />
        <Stat num={done} label="Completadas" />
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mb-6 border border-linea bg-acero p-4 sm:p-5"
        aria-label="Registrar nueva tarea"
      >
        <div className="mb-4 flex items-center gap-2 border-b border-linea pb-3">
          <span className="h-2 w-2 rounded-full bg-naranja" aria-hidden="true" />
          <span className="text-[11px] uppercase tracking-widest text-texto">Registrar nueva tarea</span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="task-title" className="mb-1 block text-[11px] font-medium uppercase tracking-widest text-texto">
              Título
            </label>
            <input
              id="task-title"
              name="title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (titleError) setTitleError('')
              }}
              onBlur={() => setTitleError(validateTitle(title))}
              placeholder="¿Qué tarea necesitas completar?"
              maxLength={255}
              autoComplete="off"
              aria-invalid={titleError ? 'true' : undefined}
              aria-describedby={titleError ? 'task-title-error' : undefined}
              className={`w-full border bg-gris px-3 py-2.5 text-sm text-blanco placeholder:text-texto/60 transition-colors ${
                titleError ? 'border-rojo' : 'border-linea focus:border-naranja'
              }`}
            />
            {titleError && (
              <p id="task-title-error" className="mt-1 text-xs text-rojo" role="alert">
                {titleError}
              </p>
            )}
          </div>

          <div className="sm:self-end">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex w-full items-center justify-center gap-2 bg-naranja px-5 py-2.5 font-display text-sm font-semibold uppercase tracking-widest text-negro transition-colors hover:bg-naranja-claro disabled:opacity-50 sm:w-auto"
            >
              <IconPlus />
              {creating ? 'Guardando…' : 'Registrar'}
            </button>
          </div>
        </div>
      </form>

      <section className="border border-linea bg-acero" aria-labelledby="task-list-title">
        <header className="flex items-center justify-between border-b border-linea px-4 py-3">
          <h3 id="task-list-title" className="font-display text-lg tracking-widest text-texto">
            Tareas registradas
          </h3>
          <span className="text-[11px] uppercase tracking-widest text-texto" aria-live="polite">
            {tasks.length} tarea(s)
          </span>
        </header>

        <div>
          {loading ? (
            <p className="px-4 py-8 text-sm text-texto">Cargando…</p>
          ) : tasks.length === 0 ? (
            <p className="px-4 py-8 text-sm text-texto">Aún no hay tareas registradas.</p>
          ) : (
            <ul className="divide-y divide-linea" aria-live="polite">
              {tasks.map((task) => {
                const isDone = task.status === 'done'
                return (
                  <li
                    key={task.id}
                    className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggle(task.id)}
                        aria-pressed={isDone}
                        aria-label={`Marcar como ${isDone ? 'pendiente' : 'completada'}: ${task.title}`}
                        className={`flex h-6 w-6 shrink-0 items-center justify-center border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-naranja ${
                          isDone ? 'border-verde bg-verde text-negro' : 'border-gris bg-transparent text-transparent'
                        }`}
                      >
                        <IconCheck />
                      </button>
                      <div className="min-w-0">
                        <p className={`truncate text-sm ${isDone ? 'text-texto line-through' : 'text-blanco'}`}>
                          {task.title}
                        </p>
                        <p className="text-[11px] text-texto">
                          {task.created_at ? new Date(task.created_at).toLocaleString() : '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-9 sm:pl-0">
                      <span
                        className={`inline-flex px-2 py-0.5 text-[10px] uppercase tracking-widest ${
                          isDone ? 'bg-verde/15 text-verde' : 'bg-naranja/15 text-naranja'
                        }`}
                      >
                        {task.status}
                      </span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => remove(task.id)}
                          aria-label={`Eliminar tarea ${task.title}`}
                          className="inline-flex items-center gap-2 border border-linea px-3 py-1.5 text-[11px] uppercase tracking-widest text-rojo transition-colors hover:border-rojo hover:bg-rojo/10"
                        >
                          <IconTrash className="h-3.5 w-3.5" />
                          Eliminar
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>
    </>
  )
}

export default Tasks