const {
  createGeminiAudioChunks,
  downloadYoutubeAudio,
  removeFiles,
} = require('../services/youtube-audio')
const { generateSummaryFromAudioChunks } = require('../services/gemini')
const { createHistoryEntry } = require('../../history/services/history')
const { getOrSetJson } = require('../../../services/cache')
const { FEATURE_CACHE_TTL, getVideoSummaryCacheKey } = require('../services/cache')

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

    const summary = await getOrSetJson(
      getVideoSummaryCacheKey(req.user._id, url),
      FEATURE_CACHE_TTL.summaryVideo,
      async () => {
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
          throw Object.assign(new Error('No audio found in video'), { statusCode: 400 })
        }

        emitProgress('Generating summary')
        return generateSummaryFromAudioChunks(chunks, {
          durationInSeconds: audioResult.durationInSeconds,
          sourceUrl: url,
        })
      }
    )

    const historyEntry = await createHistoryEntry({
      userId: req.user._id,
      sourceType: 'youtube-video',
      sourceLabel: url,
      summary,
    })

    emitProgress('Summary ready')

    return res.json({
      success: true,
      sourceType: 'youtube-video',
      sourceLabel: url,
      historyId: historyEntry.id,
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
