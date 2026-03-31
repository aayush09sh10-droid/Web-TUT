function formatTimestamp(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  if (hours > 0) {
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
  }

  return [minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
}

function normaliseParagraph(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanJsonFence(text) {
  return String(text || '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()
}

function mimeTypeFromPath(filePath) {
  const lowerPath = String(filePath).toLowerCase()

  if (lowerPath.endsWith('.mp3')) return 'audio/mpeg'
  if (lowerPath.endsWith('.wav')) return 'audio/wav'
  if (lowerPath.endsWith('.m4a')) return 'audio/mp4'
  if (lowerPath.endsWith('.aac')) return 'audio/aac'
  if (lowerPath.endsWith('.ogg')) return 'audio/ogg'
  if (lowerPath.endsWith('.webm')) return 'audio/webm'

  return 'application/octet-stream'
}

module.exports = {
  formatTimestamp,
  normaliseParagraph,
  cleanJsonFence,
  mimeTypeFromPath,
}
