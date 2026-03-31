const { v2: cloudinary } = require('cloudinary')

function ensureCloudinaryConfig() {
  const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim()
  const apiKey = String(process.env.CLOUDINARY_API_KEY || '').trim()
  const apiSecret = String(process.env.CLOUDINARY_API_SECRET || '').trim()

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.'
    )
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  })
}

function canUploadToCloudinary() {
  return Boolean(
    String(process.env.CLOUDINARY_CLOUD_NAME || '').trim() &&
      String(process.env.CLOUDINARY_API_KEY || '').trim() &&
      String(process.env.CLOUDINARY_API_SECRET || '').trim()
  )
}

function uploadBufferToCloudinary(buffer, folder = 'web-tutor/auth') {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('Invalid file buffer provided for Cloudinary upload.')
  }

  ensureCloudinaryConfig()

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error)
          return
        }

        resolve(result)
      }
    )

    uploadStream.end(buffer)
  })
}

module.exports = {
  canUploadToCloudinary,
  uploadBufferToCloudinary,
}
