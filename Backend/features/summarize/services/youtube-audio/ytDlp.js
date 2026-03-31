const fs = require('fs')
const YTDlpWrap = require('yt-dlp-wrap').default

const { YT_DLP_BINARY_PATH } = require('./constants')

let ytDlpBootstrapPromise = null

async function ensureYtDlpBinary() {
  if (!ytDlpBootstrapPromise) {
    ytDlpBootstrapPromise = (async () => {
      const exists = await fs.promises
        .access(YT_DLP_BINARY_PATH, fs.constants.F_OK)
        .then(() => true)
        .catch(() => false)

      if (exists) {
        return
      }

      await fs.promises.mkdir(require('path').dirname(YT_DLP_BINARY_PATH), { recursive: true })
      await YTDlpWrap.downloadFromGithub(YT_DLP_BINARY_PATH)
    })().catch((error) => {
      ytDlpBootstrapPromise = null
      throw error
    })
  }

  return ytDlpBootstrapPromise
}

function getYtDlpClient() {
  return new YTDlpWrap(YT_DLP_BINARY_PATH)
}

function extractYoutubeVideoId(url) {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([\w-]{11})/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([\w-]{11})/i,
    /(?:https?:\/\/)?youtu\.be\/([\w-]{11})/i,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match?.[1]) {
      return match[1]
    }
  }

  return null
}

function normaliseYoutubeError(error) {
  const message = String(error?.stderr || error?.message || 'Unknown YouTube extraction error')

  if (/private|members-only|login|sign in|cookie/i.test(message)) {
    return 'This YouTube video requires login or cookies to access.'
  }

  if (/region/i.test(message)) {
    return 'This YouTube video is region restricted.'
  }

  if (/age/i.test(message)) {
    return 'This YouTube video is age restricted.'
  }

  if (/429|rate limit|too many requests/i.test(message)) {
    return 'YouTube temporarily rate-limited this server. Please try again later.'
  }

  if (/unavailable|unsupported url|not a valid url/i.test(message)) {
    return 'The YouTube video could not be accessed.'
  }

  return message.replace(/\s+/g, ' ').trim()
}

module.exports = {
  ensureYtDlpBinary,
  getYtDlpClient,
  extractYoutubeVideoId,
  normaliseYoutubeError,
}
