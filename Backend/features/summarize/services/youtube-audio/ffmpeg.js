const { spawn } = require('child_process')

const ffmpegPath = require('ffmpeg-static')

const { AudioServiceError } = require('./errors')

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) {
      reject(new AudioServiceError('ffmpeg-static is not available.', 500))
      return
    }

    const process = spawn(ffmpegPath, ['-loglevel', 'error', ...args], {
      windowsHide: true,
    })

    let stderr = ''
    process.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    process.on('error', (error) => {
      reject(new AudioServiceError(`Failed to start ffmpeg: ${error.message}`, 500))
    })

    process.on('close', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new AudioServiceError(`ffmpeg failed: ${stderr.trim() || `exit code ${code}`}`, 500))
    })
  })
}

module.exports = {
  runFfmpeg,
}
