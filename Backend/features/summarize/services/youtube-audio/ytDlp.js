const fs = require('fs')
const path = require('path')
const YTDlpWrap = require('yt-dlp-wrap').default

const { YT_DLP_BINARY_PATH } = require('./constants')

let ytDlpBootstrapPromise = null

function getConfiguredCookiesPath() {
  const configuredPath = String(
    process.env.YT_DLP_COOKIES_PATH || process.env.YTDLP_COOKIES_PATH || ''
  ).trim()

  return configuredPath || ''
}

function isLoginOrBotError(error) {
  const message = String(error?.stderr || error?.message || '').toLowerCase()

  return (
    message.includes('login') ||
    message.includes('sign in') ||
    message.includes('cookie') ||
    message.includes('cookies') ||
    message.includes('confirm you’re not a bot') ||
    message.includes("confirm you're not a bot") ||
    message.includes('use --cookies-from-browser or --cookies') ||
    message.includes('video unavailable')
  )
}

async function getAvailableCookiesArgs() {
  const cookiesPath = getConfiguredCookiesPath()

  if (!cookiesPath) {
    return []
  }

  const exists = await fs.promises
    .access(cookiesPath, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false)

  return exists ? ['--cookies', cookiesPath] : []
}

async function getYtDlpAttemptProfiles() {
  const cookiesArgs = await getAvailableCookiesArgs()

  return [
    {
      name: cookiesArgs.length ? 'cookies-default' : 'default',
      args: [...cookiesArgs],
    },
    {
      name: 'android-client',
      args: [...cookiesArgs, '--extractor-args', 'youtube:player_client=android,web'],
    },
    {
      name: 'tv-client',
      args: [...cookiesArgs, '--extractor-args', 'youtube:player_client=tv_simply,tv,web'],
    },
  ]
}

function getAssetCandidates(platform = process.platform, arch = process.arch) {
  if (platform === 'win32') {
    return ['yt-dlp.exe']
  }

  if (platform === 'linux') {
    if (arch === 'arm64') {
      return ['yt-dlp_linux_aarch64', 'yt-dlp_linux']
    }

    if (arch === 'arm') {
      return ['yt-dlp_linux_armv7l', 'yt-dlp_linux_aarch64', 'yt-dlp_linux']
    }

    return ['yt-dlp_linux', 'yt-dlp']
  }

  if (platform === 'darwin') {
    if (arch === 'arm64') {
      return ['yt-dlp_macos', 'yt-dlp_macos_aarch64', 'yt-dlp']
    }

    return ['yt-dlp_macos_legacy', 'yt-dlp_macos', 'yt-dlp']
  }

  return [platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp']
}

async function downloadReleaseAsset(filePath) {
  const releases = await YTDlpWrap.getGithubReleases(1, 1)
  const latestRelease = Array.isArray(releases) ? releases[0] : null
  const assets = Array.isArray(latestRelease?.assets) ? latestRelease.assets : []
  const candidates = getAssetCandidates()
  const matchedAsset = candidates
    .map((name) => assets.find((asset) => asset?.name === name))
    .find(Boolean)

  if (!matchedAsset?.browser_download_url) {
    throw new Error(
      `Could not find a compatible yt-dlp release asset for ${process.platform}/${process.arch}.`
    )
  }

  await YTDlpWrap.downloadFile(matchedAsset.browser_download_url, filePath)

  if (process.platform !== 'win32') {
    await fs.promises.chmod(filePath, 0o755)
  }
}

async function isInstalledBinaryUsable(filePath) {
  try {
    const ytDlp = new YTDlpWrap(filePath)
    await ytDlp.getVersion()
    return true
  } catch (error) {
    const message = String(error?.stderr || error?.message || '').toLowerCase()

    if (
      message.includes('python3') ||
      message.includes('/usr/bin/env') ||
      message.includes('no such file or directory') ||
      message.includes('cannot execute')
    ) {
      return false
    }

    return true
  }
}

async function ensureYtDlpBinary() {
  if (!ytDlpBootstrapPromise) {
    ytDlpBootstrapPromise = (async () => {
      const exists = await fs.promises
        .access(YT_DLP_BINARY_PATH, fs.constants.F_OK)
        .then(() => true)
        .catch(() => false)

      if (exists && (await isInstalledBinaryUsable(YT_DLP_BINARY_PATH))) {
        return
      }

      await fs.promises.mkdir(path.dirname(YT_DLP_BINARY_PATH), { recursive: true })
      await downloadReleaseAsset(YT_DLP_BINARY_PATH)
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

async function execYtDlpWithFallback(baseArgs, options = {}) {
  const ytDlp = getYtDlpClient()
  const profiles = await getYtDlpAttemptProfiles()
  const safeBaseArgs = Array.isArray(baseArgs) ? baseArgs : []
  let lastError = null

  for (let index = 0; index < profiles.length; index += 1) {
    const profile = profiles[index]

    try {
      return await ytDlp.execPromise([...profile.args, ...safeBaseArgs], options)
    } catch (error) {
      lastError = error

      if (!isLoginOrBotError(error) || index === profiles.length - 1) {
        throw error
      }
    }
  }

  throw lastError || new Error('yt-dlp failed to execute.')
}

async function getVideoInfoWithFallback(url) {
  const ytDlp = getYtDlpClient()
  const profiles = await getYtDlpAttemptProfiles()
  let lastError = null

  for (let index = 0; index < profiles.length; index += 1) {
    const profile = profiles[index]

    try {
      return await ytDlp.getVideoInfo([...profile.args, url])
    } catch (error) {
      lastError = error

      if (!isLoginOrBotError(error) || index === profiles.length - 1) {
        throw error
      }
    }
  }

  throw lastError || new Error('yt-dlp could not read video info.')
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
  execYtDlpWithFallback,
  getYtDlpClient,
  extractYoutubeVideoId,
  getAssetCandidates,
  getConfiguredCookiesPath,
  getVideoInfoWithFallback,
  isLoginOrBotError,
  normaliseYoutubeError,
}
