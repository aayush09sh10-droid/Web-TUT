const bcrypt = require('bcryptjs')

const User = require('../../models/User')
const { uploadBufferToCloudinary, canUploadToCloudinary } = require('./cloudinary')
const { AuthServiceError } = require('./errors')
const { signAuthToken } = require('./jwt')
const { serialiseUser } = require('./userSerializer')

function normaliseText(value) {
  return String(value || '').trim()
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function normaliseUsername(username) {
  return normaliseText(username).toLowerCase()
}

async function registerUser({ name, username, email, password, file }) {
  const safeName = normaliseText(name)
  const safeUsername = normaliseUsername(username)
  const safeEmail = normaliseText(email).toLowerCase()
  const safePassword = String(password || '')

  if (!safeName || !safeUsername || !safeEmail || !safePassword) {
    throw new AuthServiceError('Name, username, email, and password are required.', 400)
  }

  if (safePassword.length < 6) {
    throw new AuthServiceError('Password must be at least 6 characters long.', 400)
  }

  if (!validateEmail(safeEmail)) {
    throw new AuthServiceError('Please enter a valid email address.', 400)
  }

  const existingUser = await User.findOne({
    $or: [{ email: safeEmail }, { username: safeUsername }],
  })

  if (existingUser) {
    throw new AuthServiceError('An account with this email or username already exists.', 409)
  }

  let avatar = {
    url: '',
    publicId: '',
  }

  if (file?.buffer && canUploadToCloudinary()) {
    const uploaded = await uploadBufferToCloudinary(file.buffer)
    avatar = {
      url: uploaded.secure_url || '',
      publicId: uploaded.public_id || '',
    }
  }

  const passwordHash = await bcrypt.hash(safePassword, 10)
  const user = await User.create({
    name: safeName,
    username: safeUsername,
    email: safeEmail,
    passwordHash,
    avatar,
  })

  return {
    token: signAuthToken(user),
    user: serialiseUser(user),
  }
}

module.exports = {
  registerUser,
}
