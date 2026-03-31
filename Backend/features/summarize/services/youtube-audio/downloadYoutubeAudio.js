const fs = require('fs')
const os = require('os')
const path = require('path')

const { AudioServiceError } = require('./errors')
const { ensureYtDlpBinary, extractYoutubeVideoId, getYtDlpClient, normaliseYoutubeError } = require('./ytDlp')

function createTempBasePath(prefix) {
  const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
  return path.join(os.tmpdir(), fileName)
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

module.exports = {
  downloadYoutubeAudio,
}
