function Field({
  id,
  label,
  name,
  type = 'text',
  as = 'input',
  value,
  onChange,
  error,
  autoComplete,
  placeholder,
  options = [],
  hint,
}) {
  const clases = `w-full border bg-gris px-3 py-2.5 text-sm text-blanco placeholder:text-texto/60 transition-colors ${
    error ? 'border-rojo' : 'border-linea focus:border-naranja'
  }`
  const aria = {
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  }

  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1 block text-[11px] font-medium uppercase tracking-widest text-texto">
        {label}
      </label>

      {as === 'select' ? (
        <select id={id} name={name} value={value} onChange={onChange} className={clases} {...aria}>
          {options.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
      ) : as === 'textarea' ? (
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          rows={4}
          placeholder={placeholder}
          className={clases}
          {...aria}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={clases}
          {...aria}
        />
      )}

      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-rojo" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-texto">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export default Field