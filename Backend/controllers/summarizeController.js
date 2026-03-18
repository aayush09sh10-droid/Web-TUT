const {
  downloadYoutubeAudio,
  createGeminiAudioChunks,
  removeFiles,
} = require('../services/youtube-audio.service')
const { generateSummaryFromAudioChunks } = require('../services/gemini.service')

async function summarizeVideo(req, res) {
  let downloadedAudioPath = null
  let chunkPaths = []

  try {
    const { url } = req.body
    const io = req.app.get('io')

    const emitProgress = (step) => {
      if (io) {
        io.emit('summary-progress', { step })
      }
    }

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Missing `url` in request body.',
      })
    }

    emitProgress('Downloading audio')
    const audioResult = await downloadYoutubeAudio(url)
    downloadedAudioPath = audioResult.audioPath

    emitProgress('Preparing audio for Gemini')
    const chunks = await createGeminiAudioChunks(
      downloadedAudioPath,
      audioResult.durationInSeconds
    )

    chunkPaths = chunks.map((chunk) => chunk.path)

    if (!chunks.length) {
      return res.status(400).json({
        success: false,
        error: 'No audio found in video',
      })
    }

    emitProgress('Generating summary')
    const summary = await generateSummaryFromAudioChunks(chunks, {
      durationInSeconds: audioResult.durationInSeconds,
      sourceUrl: url,
    })

    emitProgress('Summary ready')

    return res.json({
      success: true,
      videoUrl: url,
      summary,
    })
  } catch (error) {
    console.error('Summarize error:', error)

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to summarize the video.',
    })
  } finally {
    await removeFiles([downloadedAudioPath, ...chunkPaths])
  }
}

module.exports = {
  summarizeVideo,
}
