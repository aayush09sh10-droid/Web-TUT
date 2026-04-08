const {
  createGeminiAudioChunks,
  downloadYoutubeAudio,
  removeFiles,
} = require('../services/youtube-audio')
const { generateSummaryFromAudioChunks } = require('../services/gemini')
const { getCachedVideoSummary } = require('../cache')
const { createHistoryEntry } = require('../../history/services/history')
const { sendSummarizeError, sendValidationError } = require('./errorResponse')

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
      return sendValidationError(res, 'Missing `url` in request body.')
    }

    const summary = await getCachedVideoSummary(req.user._id, url, async () => {
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
      })

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

    return sendSummarizeError(
      res,
      error,
      'Gemini could not summarize this video right now. Please try again.'
    )
  } finally {
    await removeFiles([downloadedAudioPath, ...chunkPaths])
  }
}

module.exports = {
  summarizeVideo,
}
