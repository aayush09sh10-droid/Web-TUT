const {
  createGeminiAudioChunks,
  downloadYoutubeAudio,
  removeFiles,
} = require('../services/youtube-audio')
const { generateSummaryFromAudioChunks } = require('../services/gemini')
const { getVideoSourceFingerprint } = require('../services/sourceFingerprint')
const { getCachedVideoSummary } = require('../cache')
const {
  createHistoryEntry,
  updateHistoryEntry,
  findExistingHistoryEntryByFingerprint,
} = require('../../history/services/history')
const { sendSummarizeError, sendValidationError } = require('./errorResponse')

async function summarizeVideo(req, res) {
  let downloadedAudioPath = null
  let chunkPaths = []

  try {
    const { url, historyId, forceRegenerate, studyPrompt = '' } = req.body
    const io = req.app.get('io')

    const emitProgress = (step) => {
      if (io) {
        io.emit('summary-progress', { step })
      }
    }

    if (!url) {
      return sendValidationError(res, 'Missing `url` in request body.')
    }

    const sourceFingerprint = getVideoSourceFingerprint(url)

    if (!forceRegenerate && !historyId) {
      const existingEntry = await findExistingHistoryEntryByFingerprint(
        req.user._id,
        'youtube-video',
        sourceFingerprint
      )

      if (existingEntry?.result?.summary) {
        emitProgress('Summary ready')

        return res.json({
          success: true,
          reusedExisting: true,
          sourceType: existingEntry.sourceType,
          sourceLabel: existingEntry.sourceLabel,
          historyId: existingEntry.id,
          videoUrl: existingEntry.sourceLabel,
          summary: existingEntry.result.summary,
          quiz: existingEntry.result.quiz,
          teaching: existingEntry.result.teaching,
          formula: existingEntry.result.formula,
          doubt: existingEntry.result.doubt,
          quizProgress: existingEntry.result.quizProgress,
        })
      }
    }

    const summaryCachePayload = {
      url,
      studyPrompt: String(studyPrompt || '').trim(),
    }

    const buildSummary = async () => {
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
          studyPrompt,
        })
      }

    const summary = forceRegenerate
      ? await buildSummary()
      : await getCachedVideoSummary(req.user._id, summaryCachePayload, buildSummary)

    const historyEntry =
      historyId
        ? await updateHistoryEntry({
            historyId,
            userId: req.user._id,
            updates: {
              sourceType: 'youtube-video',
              sourceLabel: url,
              sourceFingerprint,
              summary,
              quiz: null,
              teaching: null,
              formula: null,
              doubt: null,
              quizProgress: null,
            },
          })
        : null

    const resolvedHistoryEntry =
      historyEntry ||
      (await createHistoryEntry({
        userId: req.user._id,
        sourceType: 'youtube-video',
        sourceLabel: url,
        sourceFingerprint,
        summary,
      }))

    emitProgress('Summary ready')

    return res.json({
      success: true,
      sourceType: 'youtube-video',
      sourceLabel: url,
      historyId: resolvedHistoryEntry.id,
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
