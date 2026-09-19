export const MIN_NOMBRE_LENGTH = 2
export const MIN_CONTRASEÑA_LENGTH = 6
export const MIN_DESCRIPCION_LENGTH = 5
export const MAX_TEXT = 500

export function validarNombre(value) {
  const nombre = (value || '').trim()
  if (!nombre) return 'El nombre es obligatorio.'
  if (nombre.length < MIN_NOMBRE_LENGTH)
    return `El nombre debe tener al menos ${MIN_NOMBRE_LENGTH} caracteres.`
  return ''
}

export function validarCorreo(value) {
  const correo = (value || '').trim()
  if (!correo) return 'El correo es obligatorio.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return 'Ingresa un correo válido.'
  return ''
}

export function validarContraseña(value, { minimo = MIN_CONTRASEÑA_LENGTH } = {}) {
  const contraseña = value || ''
  if (!contraseña) return 'La contraseña es obligatoria.'
  if (contraseña.length < minimo)
    return `La contraseña debe tener al menos ${minimo} caracteres.`
  return ''
}

export function validarDescripcion(value) {
  const descripcion = (value || '').trim()
  if (!descripcion) return 'Describe el foco de humo o quema.'
  if (descripcion.length < MIN_DESCRIPCION_LENGTH)
    return `La descripción debe tener al menos ${MIN_DESCRIPCION_LENGTH} caracteres.`
  if (descripcion.length > MAX_TEXT)
    return `La descripción no puede superar los ${MAX_TEXT} caracteres.`
  return ''
}

export function validarUbicacion(value) {
  const ubicacion = (value || '').trim()
  if (!ubicacion) return 'Indica la ubicación del foco (referencia, vereda o coordenadas).'
  if (ubicacion.length > 255) return 'La ubicación no puede superar 255 caracteres.'
  return ''
}

export function validarNombreComunidad(value) {
  const nombre = (value || '').trim()
  if (!nombre) return 'El nombre es obligatorio.'
  if (nombre.length < 2) return 'El nombre debe tener al menos 2 caracteres.'
  return ''
}