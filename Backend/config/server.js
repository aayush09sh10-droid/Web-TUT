const fs = require('fs')
const http = require('http')
const https = require('https')

function isTruthy(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase())
}

function createServer(app) {
  const httpsEnabled = isTruthy(process.env.HTTPS_ENABLED)
  const keyPath = String(process.env.HTTPS_KEY_PATH || '').trim()
  const certPath = String(process.env.HTTPS_CERT_PATH || '').trim()

  if (!httpsEnabled) {
    return {
      protocol: 'http',
      server: http.createServer(app),
    }
  }

  if (!keyPath || !certPath) {
    throw new Error('HTTPS_ENABLED is true but HTTPS_KEY_PATH or HTTPS_CERT_PATH is missing.')
  }

  const key = fs.readFileSync(keyPath)
  const cert = fs.readFileSync(certPath)

  return {
    protocol: 'https',
    server: https.createServer({ key, cert }, app),
  }
}

module.exports = {
  createServer,
}
