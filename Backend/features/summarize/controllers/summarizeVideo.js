const {
  removeFiles,
} = require('../services/youtube-audio')
const { getVideoSourceFingerprint } = require('../services/sourceFingerprint')
const { getCachedVideoSummary } = require('../cache')
const { createSummaryProgressReporter } = require('../services/progress/summaryProgress')
const { summarizeVideoPipeline } = require('../services/pipeline/summarizeVideoPipeline')
const {
  createHistoryEntry,
  updateHistoryEntry,
  findExistingHistoryEntryByFingerprint,
} = require('../../history/services/history')
const { sendSummarizeError, sendValidationError } = require('./errorResponse')

async function summarizeVideo(req, res) {
  let tempPaths = []
  let summaryStrategy = ''

  try {
    const { url, historyId, forceRegenerate, studyPrompt = '' } = req.body
    const progress = createSummaryProgressReporter(req)
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

        return res.json({
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
        })
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

    return res.json({
      success: true,
      jobId: progress.jobId,
      summaryStrategy: summaryStrategy || 'unknown',
      sourceType: 'youtube-video',
      sourceLabel: url,
      historyId: resolvedHistoryEntry.id,
      videoUrl: url,
      summary,
    })
  } catch (error) {
    if (Array.isArray(error?.tempPaths) && error.tempPaths.length) {
      tempPaths = error.tempPaths
    }
    console.error('Summarize error:', error)

    return sendSummarizeError(
      res,
      error,
      'Web-Tut could not summarize this video right now. Please try again.'
    )
  } finally {
    await removeFiles(tempPaths)
  }
}

module.exports = {
  summarizeVideo,
}
