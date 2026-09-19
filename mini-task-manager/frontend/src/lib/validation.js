export const MIN_TITLE_LENGTH = 3
export const MAX_TITLE_LENGTH = 255

export function validateTitle(value) {
  const title = (value || '').trim()
  if (!title) return 'El título de la tarea es obligatorio.'
  if (title.length < MIN_TITLE_LENGTH)
    return `El título de la tarea debe tener al menos ${MIN_TITLE_LENGTH} caracteres.`
  if (title.length > MAX_TITLE_LENGTH)
    return `El título de la tarea no puede superar los ${MAX_TITLE_LENGTH} caracteres.`
  return ''
}