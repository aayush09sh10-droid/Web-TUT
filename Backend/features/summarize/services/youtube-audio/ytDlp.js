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
  const rawUrl = String(url || '').trim()

  if (!rawUrl) {
    return null
  }

  try {
    const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`)
    const hostname = parsed.hostname.replace(/^www\./i, '').toLowerCase()
    const pathParts = parsed.pathname.split('/').filter(Boolean)

    if (hostname === 'youtu.be') {
      const shortId = String(pathParts[0] || '').trim()
      return /^[\w-]{11}$/.test(shortId) ? shortId : null
    }

    if (!['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com'].includes(hostname)) {
      return null
    }

    const watchId = String(parsed.searchParams.get('v') || '').trim()
    if (/^[\w-]{11}$/.test(watchId)) {
      return watchId
    }

    const embeddedId = String(pathParts[1] || '').trim()
    if (['shorts', 'embed', 'live', 'v'].includes(pathParts[0]) && /^[\w-]{11}$/.test(embeddedId)) {
      return embeddedId
    }
  } catch {
    return null
  }

  return null
}

function normaliseYoutubeError(error) {
  const message = String(error?.stderr || error?.message || 'Unknown YouTube extraction error')

  if (/private|members-only|login|sign in|cookie|confirm you.?re not a bot/i.test(message)) {
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
