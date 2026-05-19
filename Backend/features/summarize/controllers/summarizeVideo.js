const {
  removeFiles,
} = require('../services/youtube-audio')
const { getVideoSourceFingerprint } = require('../services/sourceFingerprint')
const { getCachedVideoSummary } = require('../cache')
const { wantsNdjsonStream, createNdjsonStream } = require('../services/streaming/ndjsonStream')
const { createRequestProgress } = require('../services/streaming/requestProgress')
const { summarizeVideoPipeline } = require('../services/pipeline/summarizeVideoPipeline')
const {
  createHistoryEntry,
  updateHistoryEntry,
  findExistingHistoryEntryByFingerprint,
} = require('../../history/services/history')
const { buildSummarizeErrorPayload, sendSummarizeError, sendValidationError } = require('./errorResponse')

async function summarizeVideo(req, res) {
  let tempPaths = []
  let summaryStrategy = ''
  const stream = wantsNdjsonStream(req) ? createNdjsonStream(res) : null

  try {
    const { url, historyId, forceRegenerate, studyPrompt = '' } = req.body
    const progress = createRequestProgress(req, stream)
    const emitProgress = (step) => progress.emit(step)

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

        const payload = {
          success: true,
          jobId: progress.jobId,
          summaryStrategy: 'history-reused',
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
        }

        if (stream) {
          return stream.final(payload)
        }

        return res.json(payload)
      }
    }

    const summaryCachePayload = {
      url,
      studyPrompt: String(studyPrompt || '').trim(),
    }

    const buildSummary = async () => {
      const pipelineResult = await summarizeVideoPipeline(url, {
        emitProgress,
        sourceUrl: url,
        studyPrompt,
      })
      tempPaths = pipelineResult.tempPaths || []
      summaryStrategy = pipelineResult.strategy || ''
      return pipelineResult.summary
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

    const payload = {
      success: true,
      jobId: progress.jobId,
      summaryStrategy: summaryStrategy || 'unknown',
      sourceType: 'youtube-video',
      sourceLabel: url,
      historyId: resolvedHistoryEntry.id,
      videoUrl: url,
      summary,
    }

    if (stream) {
      return stream.final(payload)
    }

    return res.json(payload)
  } catch (error) {
    if (Array.isArray(error?.tempPaths) && error.tempPaths.length) {
      tempPaths = error.tempPaths
    }
    console.error('Summarize error:', error)

    const fallbackMessage = 'Web-Tut could not summarize this video right now. Please try again.'

    if (stream) {
      const { payload } = buildSummarizeErrorPayload(error, fallbackMessage)
      return stream.error(payload)
    }

    return sendSummarizeError(res, error, fallbackMessage)
  } finally {
    await removeFiles(tempPaths)
  }
}

module.exports = {
  summarizeVideo,
}
