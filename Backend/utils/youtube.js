// The `youtube-transcript` package is shipped as an ES module.
// In a CommonJS backend we must import it dynamically.

function extractYoutubeVideoId(url) {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([\w-]{11})/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([\w-]{11})/i,
    /(?:https?:\/\/)?youtu\.be\/([\w-]{11})/i,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

function secondsToTimestamp(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)

  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

async function getYoutubeTranscript(url) {
  const videoId = extractYoutubeVideoId(url)

  if (!videoId) {
    throw new Error('Could not parse a YouTube video ID from the URL provided.')
  }

  const { fetchTranscript } = await import(
    'youtube-transcript/dist/youtube-transcript.esm.js'
  )

  const transcriptItems = await fetchTranscript(videoId)

  // Create timestamped transcript
  const formattedTranscript = transcriptItems
    .map((item) => {
      const time = secondsToTimestamp(item.offset)
      return `[${time}] ${item.text}`
    })
    .join('\n')

  return formattedTranscript
}

module.exports = {
  getYoutubeTranscript,
  extractYoutubeVideoId,
}