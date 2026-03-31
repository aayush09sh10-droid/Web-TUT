const path = require('path')

const GEMINI_AUDIO_CHUNK_SECONDS = Number(process.env.GEMINI_AUDIO_CHUNK_SECONDS || 300)
const YT_DLP_BINARY_PATH = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'bin',
  process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'
)

module.exports = {
  GEMINI_AUDIO_CHUNK_SECONDS,
  YT_DLP_BINARY_PATH,
}
