import { useEffect, useState } from 'react'
import { api } from './lib/api.js'
import { IconChart, IconLeaf, IconShield, IconServer } from './components/Icons.jsx'

const ESTADOS = ['activo', 'confirmado_comunidad', 'verificado']

function Medidor({ valor, maximo, unidad = '', decimal = 0, cumple, invertido = false }) {
  const porcentaje = Math.min(100, Math.round((valor / maximo) * 100))
  const ok = invertido ? valor <= maximo : valor >= maximo
  const color = ok ? 'bg-verde' : cumple === false ? 'bg-rojo' : 'bg-amarillo'
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="font-display text-2xl text-blanco">
          {valor.toFixed(decimal)}
          <span className="text-sm text-texto">{unidad}</span>
        </span>
        <span className="text-[10px] uppercase tracking-widest text-texto">
          máx {maximo}
          {unidad}
        </span>
      </div>
      <div
        className="h-1.5 w-full bg-linea"
        role="meter"
        aria-valuenow={valor}
        aria-valuemin={0}
        aria-valuemax={maximo}
        aria-label={`${valor} de ${maximo}${unidad}`}
      >
        <div className={`h-full ${color}`} style={{ width: `${porcentaje}%` }} />
      </div>
    </div>
  )
}

function Tarjeta({ titulo, descripcion, children, icono }) {
  return (
    <section className="border border-linea bg-acero p-5">
      <div className="mb-3 flex items-center gap-2">
        {icono}
        <h2 className="font-display text-lg tracking-wider text-blanco">{titulo}</h2>
      </div>
      {descripcion && <p className="mb-4 text-xs leading-relaxed text-texto">{descripcion}</p>}
      {children}
    </section>
  )
}

function Estado({ cumple, okTexto = 'Cumple', noTexto = 'No cumple' }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${
        cumple ? 'bg-verde/15 text-verde' : 'bg-rojo/15 text-rojo'
      }`}
    >
      {cumple ? okTexto : noTexto}
    </span>
  )
}

function Sostenibilidad() {
  const [datos, setDatos] = useState(null)
  const [build, setBuild] = useState(null)
  const [latencia, setLatencia] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let vivo = true
    const inicio = performance.now()
    Promise.all([
      api.sostenibilidad(),
      fetch(`${import.meta.env.BASE_URL}metricas-build.json`).catch(() => null),
    ])
      .then(([metricas, respuestaBuild]) => {
        const ms = Math.round(performance.now() - inicio)
        if (!vivo) return
        setDatos(metricas)
        setLatencia(ms)
        if (respuestaBuild && respuestaBuild.ok) {
          respuestaBuild.json().then((json) => vivo && setBuild(json))
        }
      })
      .catch((err) => vivo && setError(err.message))
    return () => {
      vivo = false
    }
  }, [])

  if (error) {
    return (
      <p className="border-l-4 border-rojo bg-rojo/10 px-4 py-3 text-sm text-rojo" role="alert">
        No se pudieron cargar las métricas: {error}
      </p>
    )
  }

  if (!datos) return <p className="text-sm text-texto">Cargando métricas…</p>

  const { presupuesto, impacto, operacion, seguridad, base_datos: bd, uptime } = datos
  const lighthouse = build?.lighthouse
  const porEstado = operacion.por_estado || {}

  return (
    <section aria-labelledby="sostenibilidad-title">
      <h1 id="sostenibilidad-title" className="mb-1 font-display text-3xl tracking-wider text-blanco">
        Tablero de sostenibilidad
      </h1>
      <p className="mb-1 text-sm text-texto">
        Presupuesto de la consigna frente a lo medido en el despliegue real. Datos del{' '}
        <code className="text-naranja">GET /api/sostenibilidad</code>, generado el{' '}
        {new Date(datos.generado).toLocaleString('es-BO')}.
      </p>
      <p className="mb-6 text-xs text-texto">
        Plan de gobernanza y detalle de cada indicador: <code>docs/TABLERO_METRICAS.md</code> y{' '}
        <code>docs/PLAN_GOBERNANZA.md</code>.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Reportes', valor: operacion.total_reportes },
          { label: 'Confirmaciones', valor: operacion.total_confirmaciones },
          { label: 'Usuarios', valor: operacion.total_usuarios },
          { label: 'Costo infraestructura', valor: `${impacto.costo_infraestructura_bs} Bs` },
        ].map((item) => (
          <div key={item.label} className="border border-linea bg-acero p-4">
            <p className="font-display text-3xl text-naranja">{item.valor}</p>
            <p className="text-[10px] uppercase tracking-widest text-texto">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Tarjeta
          titulo="Peso de página"
          descripcion={`Transferencia máxima ${presupuesto.peso_pagina_kb} kB comprimidos (gzip), el presupuesto de la asignatura. Medido sobre el build publicado.`}
          icono={<IconLeaf className="text-verde" />}
        >
          {build ? (
            <div className="space-y-4">
              <Medidor
                valor={build.totales.gzip_kb}
                maximo={presupuesto.peso_pagina_kb}
                unidad=" kB"
                decimal={1}
                invertido
              />
              <dl className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ['Carga inicial (gzip)', `${build.carga_inicial.gzip_kb} kB`],
                  ['Carga inicial (bruto)', `${build.carga_inicial.bruto_kb} kB`],
                  ['Todo el sitio (gzip)', `${build.totales.gzip_kb} kB`],
                  ['Todo el sitio (bruto)', `${build.totales.bruto_kb} kB`],
                  ['Mapa Leaflet (diferido)', `${build.diferido.mapa_kb} kB`],
                  ['Archivos', `${build.totales.archivos}`],
                ].map(([clave, valor]) => (
                  <div key={clave} className="border border-linea px-3 py-2">
                    <dt className="text-[10px] uppercase tracking-widest text-texto">{clave}</dt>
                    <dd className="text-blanco">{valor}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-xs">
                <Estado cumple={build.cumple_peso} />{' '}
                <span className="text-texto">
                  Medido el {new Date(build.generado).toLocaleString('es-BO')}.
                </span>
              </p>
            </div>
          ) : (
            <p className="text-xs text-texto">
              Sin datos de build. Ejecuta <code>npm run build</code> para generar{' '}
              <code>dist/metricas-build.json</code>.
            </p>
          )}
        </Tarjeta>

        <Tarjeta
          titulo="Rendimiento y accesibilidad"
          descripcion={`Lighthouse ≥ ${presupuesto.lighthouse_minimo} en las cuatro categorías y ${presupuesto.wcag} en accesibilidad.`}
          icono={<IconChart className="text-naranja" />}
        >
          {lighthouse?.disponible ? (
            <div className="space-y-4">
              <Medidor
                valor={Math.min(...Object.values(lighthouse.categorias))}
                maximo={presupuesto.lighthouse_minimo}
              />
              <ul className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(lighthouse.categorias).map(([clave, valor]) => (
                  <li key={clave} className="flex items-center justify-between border border-linea px-3 py-2">
                    <span className="capitalize text-texto">{clave.replace('-', ' ')}</span>
                    <span className={valor >= presupuesto.lighthouse_minimo ? 'text-verde' : 'text-rojo'}>
                      {valor}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-texto">
                LCP {lighthouse.lcp_ms} ms · TBT {lighthouse.tbt_ms} ms · CLS {lighthouse.cls}
              </p>
            </div>
          ) : (
            <div className="text-xs text-texto">
              <p>
                Sin informe Lighthouse adjunto. Genera uno con <code>npm run auditar</code> (requiere
                Google Chrome) y publícalo como <code>public/lighthouse.json</code>.
              </p>
              <p className="mt-2">
                Cumplimiento WCAG {presupuesto.wcag} documentado en{' '}
                <code>docs/PERFORMANCE_ACCESSIBILITY.md</code>.
              </p>
            </div>
          )}
        </Tarjeta>

        <Tarjeta
          titulo="Operación del servicio"
          descripcion="Disponibilidad y latencia medidas en el despliegue de Render, no en el entorno local."
          icono={<IconServer className="text-amarillo" />}
        >
          <dl className="grid grid-cols-2 gap-2 text-xs">
            {[
              ['Entorno', datos.entorno],
              ['Versión', datos.version],
              ['Base de datos', bd.estado],
              ['Latencia SQL', bd.latencia_ms != null ? `${bd.latencia_ms} ms` : '—'],
              ['Uptime del proceso', uptime.texto],
              ['Latencia API (este navegador)', latencia != null ? `${latencia} ms` : '—'],
            ].map(([clave, valor]) => (
              <div key={clave} className="border border-linea px-3 py-2">
                <dt className="text-[10px] uppercase tracking-widest text-texto">{clave}</dt>
                <dd className="text-blanco">{valor}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-texto">
            El plan gratuito de Render hiberna tras 15 min sin tráfico: el primer request posterior
            puede tardar ~50 s. Es una decisión de coste (0 Bs) documentada en la gobernanza.
          </p>
        </Tarjeta>

        <Tarjeta
          titulo="Ciclo de vida de los reportes"
          descripcion="Distribución del estado de los reportes. El umbral de 3 confirmaciones es el que promotiona a confirmado_comunidad."
          icono={<IconChart className="text-verde" />}
        >
          <ul className="space-y-2 text-xs">
            {ESTADOS.map((estado) => {
              const cantidad = porEstado[estado] || 0
              const porcentaje = operacion.total_reportes
                ? Math.round((cantidad / operacion.total_reportes) * 100)
                : 0
              return (
                <li key={estado}>
                  <div className="mb-1 flex justify-between">
                    <span className="capitalize text-blanco">{estado.replace('_', ' ')}</span>
                    <span className="text-texto">
                      {cantidad} ({porcentaje}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-linea">
                    <div className="h-full bg-naranja" style={{ width: `${porcentaje}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="mt-3 text-xs text-texto">
            Umbral actual: {seguridad.umbral_confirmacion} confirmaciones por usuario.
          </p>
        </Tarjeta>

        <Tarjeta
          titulo="Sostenibilidad económica y legal"
          descripcion="Costo de licencias e infraestructura, requisito de la consigna."
          icono={<IconLeaf className="text-verde" />}
        >
          <div className="mb-3 flex gap-2">
            <Estado cumple={impacto.costo_infraestructura_bs === 0} okTexto="0 Bs" noTexto="Con costo" />
            <Estado
              cumple={impacto.licencias_propietarias === 0}
              okTexto="100% software libre"
              noTexto="Con licencias propietarias"
            />
          </div>
          <ul className="grid grid-cols-2 gap-1 text-[11px] text-texto">
            {impacto.licencias.map((l) => (
              <li key={l.componente} className="flex justify-between border-b border-linea py-1">
                <span>{l.componente}</span>
                <span className="text-blanco">{l.licencia}</span>
              </li>
            ))}
          </ul>
        </Tarjeta>

        <Tarjeta
          titulo="Seguridad y datos"
          descripcion="Controles activos en producción. Detalle en docs/PLAN_GOBERNANZA.md."
          icono={<IconShield className="text-naranja" />}
        >
          <ul className="space-y-1.5 text-xs text-texto">
            <li>
              Expiración JWT: <span className="text-blanco">{seguridad.jwt_expiracion_minutes} min</span>
            </li>
            <li>
              Rate limit en login: <span className="text-blanco">{seguridad.rate_limit_auth}</span>
            </li>
            <li>
              CORS: <span className="text-blanco break-all">{seguridad.cors_origins}</span>
            </li>
            <li>
              RLS en Supabase: <span className="text-blanco">{seguridad.rls_supabase}</span>
            </li>
            <li>
              Roles: <span className="text-blanco">usuario · coordinador</span>
            </li>
          </ul>
        </Tarjeta>
      </div>
    </section>
  )
}

export default Sostenibilidad
