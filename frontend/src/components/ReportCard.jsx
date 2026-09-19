import { IconCheck, IconMapPin } from './Icons.jsx'

const ESTADOS = {
  activo: { label: 'Activo', clase: 'bg-amarillo/15 text-amarillo' },
  confirmado_comunidad: { label: 'Confirmado por la comunidad', clase: 'bg-verde/15 text-verde' },
  verificado: { label: 'Verificado', clase: 'bg-blanco/15 text-blanco' },
}

function ReportCard({ reporte, onConfirmar, confirmado = false, esAutor = false, sinConexion = false }) {
  const estado = ESTADOS[reporte.estado] || ESTADOS.activo
  const puedeConfirmar = !esAutor && !confirmado

  return (
    <article className="border border-linea bg-acero p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="font-display text-sm tracking-wider text-naranja">{reporte.slug_url}</span>
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ backgroundColor: `${reporte.color_etiqueta}26`, color: reporte.color_etiqueta }}
        >
          {reporte.icono} {reporte.tipo}
        </span>
        <span className={`ml-auto inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${estado.clase}`}>
          {estado.label}
        </span>
      </div>

      <p className="mb-2 text-sm leading-relaxed text-blanco">{reporte.descripcion}</p>

      {reporte.ubicacion_texto && (
        <p className="mb-1 flex items-start gap-1.5 text-xs text-texto">
          <IconMapPin className="mt-0.5" />
          {reporte.ubicacion_texto}
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-[10px] uppercase tracking-widest text-texto">
        <span>
          {reporte.comunidad || 'Sin comunidad'} · por <strong className="text-blanco">{reporte.autor}</strong>
        </span>
        <time dateTime={reporte.fecha_creacion}>
          {new Date(reporte.fecha_creacion).toLocaleString('es-BO')}
        </time>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-linea pt-3">
        <p className="text-xs text-texto">
          <strong className="font-display text-lg text-blanco">{reporte.confirmaciones}</strong>{' '}
          confirmación(es) de la comunidad
        </p>

        {onConfirmar && (
          <button
            type="button"
            onClick={() => onConfirmar(reporte)}
            disabled={!puedeConfirmar || sinConexion}
            aria-disabled={!puedeConfirmar}
            className={`inline-flex items-center gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-widest transition-colors disabled:cursor-not-allowed ${
              confirmado
                ? 'bg-verde text-negro'
                : 'bg-naranja text-negro hover:bg-naranja-claro disabled:bg-gris disabled:text-texto'
            }`}
          >
            <IconCheck />
            {confirmado ? 'Confirmado' : esAutor ? 'Tu reporte' : 'Confirmar +1'}
          </button>
        )}
      </div>
    </article>
  )
}

export default ReportCard