const express = require('express')
const multer = require('multer')

const { register, login, logout, me, updatePassword } = require('../controllers')
const { authenticate } = require('../middleware/authenticate')
const { attachAuthIfPresent } = require('../middleware/attachAuthIfPresent')

const router = express.Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
})

router.post('/register', upload.single('avatar'), register)
router.post('/login', login)
router.post('/logout', logout)
router.get('/me', attachAuthIfPresent, me)
router.post('/change-password', authenticate, updatePassword)

module.exports = router
