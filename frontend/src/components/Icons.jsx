const base = 'h-4 w-4 shrink-0'

function Svg({ className = '', children, viewBox = '0 0 24 24' }) {
  return (
    <svg
      className={`${base} ${className}`}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

export function IconFlame({ className }) {
  return (
    <Svg className={className}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </Svg>
  )
}

export function IconMapPin({ className }) {
  return (
    <Svg className={className}>
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </Svg>
  )
}

export function IconRefresh({ className }) {
  return (
    <Svg className={className}>
      <path d="M3 12a9 9 0 0 1 15.5-6.4L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.5 6.4L3 16" />
      <path d="M3 21v-5h5" />
    </Svg>
  )
}

export function IconChart({ className }) {
  return (
    <Svg className={className}>
      <path d="M3 3v18h18" />
      <rect x="7" y="12" width="3" height="6" />
      <rect x="12" y="8" width="3" height="10" />
      <rect x="17" y="4" width="3" height="14" />
    </Svg>
  )
}

export function IconLogout({ className }) {
  return (
    <Svg className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </Svg>
  )
}

export function IconPlus({ className }) {
  return (
    <Svg className={className}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  )
}

export function IconTrash({ className }) {
  return (
    <Svg className={className}>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M10 11v6M14 11v6" />
    </Svg>
  )
}

export function IconCheck({ className }) {
  return (
    <Svg className={className}>
      <path d="M20 6L9 17l-5-5" />
    </Svg>
  )
}

export function IconClipboard({ className }) {
  return (
    <Svg className={className}>
      <path d="M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" />
      <rect x="3" y="5" width="18" height="17" rx="1" />
      <path d="M8 11h8M8 15h5" />
    </Svg>
  )
}

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-11 w-11 items-center justify-center bg-naranja font-display text-xl font-bold text-negro"
        aria-hidden="true"
      >
        GL
      </span>
      <div className="leading-none">
        <span className="block font-display text-2xl tracking-[0.2em] text-blanco">GREENLIGHT</span>
        <span className="mt-1 block text-[10px] uppercase tracking-[0.2em] text-texto">
          Reporte de quemas
        </span>
      </div>
    </div>
  )
}