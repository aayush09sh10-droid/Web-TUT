const express = require('express')
const multer = require('multer')

const { register, login, me, updatePassword } = require('../controllers')
const { authenticate } = require('../middleware/authenticate')

const router = express.Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
})

router.post('/register', upload.single('avatar'), register)
router.post('/login', login)
router.get('/me', authenticate, me)
router.post('/change-password', authenticate, updatePassword)

module.exports = router
