import { fileToBase64 } from '../homeUtils'

export const MAX_PHOTO_UPLOADS = 10

export async function buildStudyUploads(files = []) {
  const uploadFiles = Array.from(files)

  return Promise.all(
    uploadFiles.map(async (file) => ({
      data: await fileToBase64(file),
      mimeType: file.type || 'application/octet-stream',
      fileName: file.name,
      size: file.size || 0,
    }))
  )
}

export function formatUploadNames(uploads = [], fallbackText) {
  if (!Array.isArray(uploads) || !uploads.length) {
    return fallbackText
  }

  if (uploads.length === 1) {
    return uploads[0].fileName
  }

  const preview = uploads
    .slice(0, 3)
    .map((upload) => upload.fileName)
    .join(', ')

  return uploads.length > 3 ? `${preview}, +${uploads.length - 3} more` : preview
}
