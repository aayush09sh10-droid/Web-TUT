const fs = require('fs')
const os = require('os')
const path = require('path')

const { getYtDlpClient, normaliseYoutubeError } = require('./ytDlp')

function createTempBasePath(prefix) {
  const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
  return path.join(os.tmpdir(), fileName)
}

function parseVttTranscript(vttText) {
  const lines = String(vttText || '')
    .replace(/\r/g, '')
    .split('\n')

  const textLines = []

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) continue
    if (trimmed === 'WEBVTT') continue
    if (/^\d+$/.test(trimmed)) continue
    if (/^\d{2}:\d{2}:\d{2}\.\d{3}\s+-->\s+\d{2}:\d{2}:\d{2}\.\d{3}/.test(trimmed)) continue
    if (/^\d{2}:\d{2}\.\d{3}\s+-->\s+\d{2}:\d{2}\.\d{3}/.test(trimmed)) continue
    if (/^(NOTE|STYLE|REGION)\b/i.test(trimmed)) continue

    textLines.push(trimmed.replace(/<[^>]+>/g, ' '))
  }

  return textLines
    .join(' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

async function downloadYoutubeTranscript(url) {
  const ytDlp = getYtDlpClient()
  const outputBase = createTempBasePath('youtube-transcript')
  const outputDirectory = path.dirname(outputBase)
  const outputPrefix = path.basename(outputBase)

  try {
    await ytDlp.execPromise([
      url,
      '--skip-download',
      '--no-playlist',
      '--no-warnings',
      '--write-auto-subs',
      '--write-subs',
      '--sub-langs',
      'en,en-US,en-GB,hi,hi-IN,*orig',
      '--sub-format',
      'vtt',
      '--output',
      `${outputBase}.%(ext)s`,
    ])
  } catch (error) {
    throw Object.assign(
      new Error(`Failed to download YouTube transcript: ${normaliseYoutubeError(error)}`),
      { statusCode: 502 }
    )
  }

  const downloadedFiles = await fs.promises.readdir(outputDirectory)
  const transcriptFileName = downloadedFiles.find(
    (fileName) =>
      fileName.startsWith(`${outputPrefix}.`) &&
      /\.([a-z-]+)\.vtt$/i.test(fileName)
  )

  if (!transcriptFileName) {
    return null
  }

  const transcriptPath = path.join(outputDirectory, transcriptFileName)
  const transcriptText = parseVttTranscript(await fs.promises.readFile(transcriptPath, 'utf8'))

  return {
    transcriptPath,
    transcriptText,
  }
}

module.exports = {
  downloadYoutubeTranscript,
}
