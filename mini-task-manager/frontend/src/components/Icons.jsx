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

export function IconClipboard({ className }) {
  return (
    <Svg className={className}>
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h6" />
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

export function IconAlert({ className }) {
  return (
    <Svg className={className}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
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
          Mini Task Manager
        </span>
      </div>
    </div>
  )
}