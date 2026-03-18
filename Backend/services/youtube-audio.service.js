const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawn } = require('child_process')

const ffmpegPath = require('ffmpeg-static')
const YTDlpWrap = require('yt-dlp-wrap').default

const YT_DLP_BINARY_PATH = path.join(
  __dirname,
  '..',
  'bin',
  process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'
)

const GEMINI_AUDIO_CHUNK_SECONDS = Number(process.env.GEMINI_AUDIO_CHUNK_SECONDS || 300)

let ytDlpBootstrapPromise = null

class AudioServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message)
    this.name = 'AudioServiceError'
    this.statusCode = statusCode
  }
}

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

      await fs.promises.mkdir(path.dirname(YT_DLP_BINARY_PATH), { recursive: true })
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

function createTempBasePath(prefix) {
  const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
  return path.join(os.tmpdir(), fileName)
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

async function downloadYoutubeAudio(url) {
  if (!extractYoutubeVideoId(url)) {
    throw new AudioServiceError('Invalid YouTube URL provided.', 400)
  }

  await ensureYtDlpBinary()

  const ytDlp = getYtDlpClient()
  const outputBase = createTempBasePath('youtube-audio')

  let videoInfo
  try {
    videoInfo = await ytDlp.getVideoInfo(url)
  } catch (error) {
    throw new AudioServiceError(`Failed to read YouTube video info: ${normaliseYoutubeError(error)}`, 502)
  }

  try {
    await ytDlp.execPromise([
      url,
      '--no-playlist',
      '--no-warnings',
      '--format',
      'bestaudio/best',
      '--output',
      `${outputBase}.%(ext)s`,
    ])
  } catch (error) {
    throw new AudioServiceError(`Failed to download YouTube audio: ${normaliseYoutubeError(error)}`, 502)
  }

  const outputDirectory = path.dirname(outputBase)
  const outputPrefix = path.basename(outputBase)
  const downloadedFiles = await fs.promises.readdir(outputDirectory)
  const downloadedFileName = downloadedFiles.find((fileName) => fileName.startsWith(`${outputPrefix}.`))

  if (!downloadedFileName) {
    throw new AudioServiceError('Failed to download YouTube audio: yt-dlp did not produce an audio file.', 502)
  }

  return {
    audioPath: path.join(outputDirectory, downloadedFileName),
    durationInSeconds: Number(videoInfo?.duration || 0),
  }
}

async function createGeminiAudioChunks(audioPath, durationInSeconds = 0) {
  const totalDuration = Math.max(0, Math.ceil(Number(durationInSeconds) || 0))
  const chunks = []

  if (!totalDuration) {
    const outputPath = `${audioPath}.chunk-0.mp3`
    await runFfmpeg(['-y', '-i', audioPath, '-vn', '-ac', '1', '-ar', '16000', '-b:a', '96k', outputPath])
    chunks.push({ path: outputPath, startInSeconds: 0, durationInSeconds: 0 })
    return chunks
  }

  for (let start = 0, index = 0; start < totalDuration; start += GEMINI_AUDIO_CHUNK_SECONDS, index += 1) {
    const chunkDuration = Math.min(GEMINI_AUDIO_CHUNK_SECONDS, totalDuration - start)
    const outputPath = `${audioPath}.chunk-${index}.mp3`

    await runFfmpeg([
      '-y',
      '-ss',
      String(start),
      '-t',
      String(chunkDuration),
      '-i',
      audioPath,
      '-vn',
      '-ac',
      '1',
      '-ar',
      '16000',
      '-b:a',
      '96k',
      outputPath,
    ])

    chunks.push({
      path: outputPath,
      startInSeconds: start,
      durationInSeconds: chunkDuration,
    })
  }

  return chunks
}

async function removeFiles(paths) {
  await Promise.all(
    paths.filter(Boolean).map((filePath) => fs.promises.unlink(filePath).catch(() => {}))
  )
}

module.exports = {
  AudioServiceError,
  downloadYoutubeAudio,
  createGeminiAudioChunks,
  removeFiles,
}
