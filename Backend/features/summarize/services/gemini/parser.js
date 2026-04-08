const { GoogleGenerativeAI } = require('@google/generative-ai')

const { GEMINI_MODEL, GEMINI_FALLBACK_MODELS, MAX_TIMELINE_ITEMS } = require('./constants')
const { GeminiServiceError } = require('./errors')
const { cleanJsonFence, formatTimestamp, normaliseParagraph } = require('./text')
const WEBTUTOR_BUSY_MESSAGE =
  'WebTutor AI is busy right now. Please try again in a moment.'
const WEBTUTOR_PLAN_MESSAGE =
  'WebTutor AI usage limit has been reached. Please upgrade your WebTutor plan and try again.'
const WEBTUTOR_FILE_MESSAGE =
  'WebTutor could not read this file format for AI study generation. Please change the file and try again.'
const WEBTUTOR_RESPONSE_MESSAGE =
  'WebTutor AI returned an incomplete response. Please try again.'
const WEBTUTOR_CONFIG_MESSAGE =
  'WebTutor AI is not configured correctly right now. Please contact support or try again later.'
const WEBTUTOR_SETUP_MESSAGE =
  'WebTutor AI is not available for this API setup yet. Please check the API key, model access, and project configuration.'

function ensureGeminiConfig() {
  const apiKey = String(process.env.GEMINI_API_KEY || '').trim()

  if (!apiKey || /your_.*key_here/i.test(apiKey)) {
    throw new GeminiServiceError(WEBTUTOR_CONFIG_MESSAGE, 500)
  }
}

function getGeminiModels() {
  ensureGeminiConfig()

  const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const candidateModels = [GEMINI_MODEL, ...GEMINI_FALLBACK_MODELS].filter(Boolean)
  const uniqueModels = Array.from(new Set(candidateModels))

  return uniqueModels.map((modelName) => ({
    modelName,
    model: client.getGenerativeModel({ model: modelName }),
  }))
}

function isGeminiQuotaError(error) {
  const message = String(error?.message || '').toLowerCase()
  const status = Number(error?.status || error?.statusCode || 0)

  return (
    status === 429 ||
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('resource has been exhausted')
  )
}

function isInvalidApiKeyError(error) {
  const message = String(error?.message || '').toLowerCase()
  const status = Number(error?.status || error?.statusCode || 0)

  return (
    status === 401 ||
    status === 403 ||
    message.includes('api key not valid') ||
    message.includes('invalid api key') ||
    message.includes('api_key_invalid') ||
    message.includes('permission denied') ||
    message.includes('authentication')
  )
}

function isGeminiSetupError(error) {
  const message = String(error?.message || '').toLowerCase()
  const status = Number(error?.status || error?.statusCode || 0)

  return (
    status === 400 ||
    status === 404 ||
    message.includes('api has not been used') ||
    message.includes('api is not enabled') ||
    message.includes('billing account') ||
    message.includes('method doesn\'t allow') ||
    message.includes('model not found') ||
    message.includes('not found for api version') ||
    message.includes('developer instruction') ||
    message.includes('permission denied on resource') ||
    message.includes('request contains an invalid argument')
  )
}

function isRetryableModelError(error) {
  const message = String(error?.message || '').toLowerCase()
  const status = Number(error?.status || error?.statusCode || 0)

  return (
    status === 503 ||
    status === 404 ||
    message.includes('high demand') ||
    message.includes('service unavailable') ||
    message.includes('try again later') ||
    message.includes('model not found') ||
    message.includes('not found for api version') ||
    message.includes('is not found') ||
    message.includes('does not have access to model')
  )
}

function isGeminiUpstreamError(error) {
  const message = String(error?.message || '').toLowerCase()
  const status = Number(error?.status || error?.statusCode || 0)

  return (
    status >= 400 ||
    message.includes('googlegenerativeai error') ||
    message.includes('generativelanguage.googleapis.com') ||
    message.includes('unsupported mime type') ||
    message.includes('generatecontent')
  )
}

function isUnsupportedInputError(error) {
  const message = String(error?.message || '').toLowerCase()

  return (
    message.includes('unsupported mime type') ||
    message.includes('unsupported file') ||
    message.includes('invalid argument') ||
    message.includes('bad request')
  )
}

function parseGeminiJson(rawText) {
  const cleaned = cleanJsonFence(rawText)

  try {
    return JSON.parse(cleaned)
  } catch {
    const firstBrace = cleaned.indexOf('{')
    const lastBrace = cleaned.lastIndexOf('}')

    if (firstBrace === -1 || lastBrace === -1) {
      throw new GeminiServiceError(WEBTUTOR_RESPONSE_MESSAGE)
    }

    try {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1))
    } catch {
      throw new GeminiServiceError(WEBTUTOR_RESPONSE_MESSAGE)
    }
  }
}

function sanitiseTimeline(items = []) {
  return items
    .filter((item) => item && (item.timestamp || item.label))
    .slice(0, 8)
    .map((item) => ({
      timestamp: String(item.timestamp || '00:00').trim(),
      label: normaliseParagraph(item.label || 'Untitled section'),
    }))
}

function sanitiseSummaryTopics(items = [], summaryParagraphs = {}) {
  const topics = Array.isArray(items)
    ? items
        .map((item, index) => {
          const keyPoints = Array.isArray(item?.keyPoints)
            ? item.keyPoints.map((point) => normaliseParagraph(point)).filter(Boolean).slice(0, 4)
            : []

          if (!normaliseParagraph(item?.title) || !normaliseParagraph(item?.summary)) {
            return null
          }

          return {
            id: `summary-topic-${index + 1}`,
            title: normaliseParagraph(item.title),
            summary: normaliseParagraph(item.summary),
            keyPoints,
          }
        })
        .filter(Boolean)
        .slice(0, 8)
    : []

  if (topics.length) {
    return topics
  }

  const fallbackParagraphs = [
    summaryParagraphs.overview,
    summaryParagraphs.coreIdeas,
    summaryParagraphs.exploreMore,
  ].filter(Boolean)

  return fallbackParagraphs.map((paragraph, index) => ({
    id: `summary-topic-${index + 1}`,
    title: ['Overview', 'Core Ideas', 'Explore More'][index] || `Topic ${index + 1}`,
    summary: paragraph,
    keyPoints: [],
  }))
}

function sanitiseSummaryShape(summary) {
  if (!summary || typeof summary !== 'object') {
    throw new GeminiServiceError(WEBTUTOR_RESPONSE_MESSAGE)
  }

  const sanitised = {
    title: normaliseParagraph(summary.title || 'Video Summary'),
    timeline: sanitiseTimeline(summary.timeline),
    paragraphs: {
      overview: normaliseParagraph(summary.paragraphs?.overview),
      coreIdeas: normaliseParagraph(summary.paragraphs?.coreIdeas),
      exploreMore: normaliseParagraph(summary.paragraphs?.exploreMore),
    },
    topics: [],
  }

  if (
    !sanitised.paragraphs.overview ||
    !sanitised.paragraphs.coreIdeas ||
    !sanitised.paragraphs.exploreMore
  ) {
    throw new GeminiServiceError(WEBTUTOR_RESPONSE_MESSAGE)
  }

  sanitised.topics = sanitiseSummaryTopics(summary.topics, sanitised.paragraphs)

  return sanitised
}

function sanitiseQuizShape(quiz) {
  if (!quiz || typeof quiz !== 'object') {
    throw new GeminiServiceError(WEBTUTOR_RESPONSE_MESSAGE)
  }

  const questions = Array.isArray(quiz.questions)
    ? quiz.questions
        .map((question, index) => {
          const options = Array.isArray(question?.options)
            ? question.options.map((option) => normaliseParagraph(option)).filter(Boolean).slice(0, 4)
            : []
          const answerIndex = Number(question?.answerIndex)

          if (
            !normaliseParagraph(question?.question) ||
            options.length < 2 ||
            !Number.isInteger(answerIndex) ||
            answerIndex < 0 ||
            answerIndex >= options.length
          ) {
            return null
          }

          return {
            id: `q${index + 1}`,
            question: normaliseParagraph(question.question),
            options,
            answerIndex,
            explanation: normaliseParagraph(question.explanation),
          }
        })
        .filter(Boolean)
        .slice(0, 6)
    : []

  if (!questions.length) {
    throw new GeminiServiceError(WEBTUTOR_RESPONSE_MESSAGE)
  }

  return {
    title: normaliseParagraph(quiz.title || 'Knowledge Check'),
    questions,
    teaching: {
      topic: normaliseParagraph(quiz.teaching?.topic || quiz.title || 'Topic Review'),
      explanation: normaliseParagraph(quiz.teaching?.explanation),
      keyTakeaways: Array.isArray(quiz.teaching?.keyTakeaways)
        ? quiz.teaching.keyTakeaways.map((item) => normaliseParagraph(item)).filter(Boolean).slice(0, 4)
        : [],
      studyTip: normaliseParagraph(quiz.teaching?.studyTip),
    },
  }
}

function sanitiseTeachingShape(teaching) {
  if (!teaching || typeof teaching !== 'object') {
    throw new GeminiServiceError(WEBTUTOR_RESPONSE_MESSAGE)
  }

  const topics = Array.isArray(teaching.topics)
    ? teaching.topics
        .map((topic, index) => {
          const notes = Array.isArray(topic?.notes)
            ? topic.notes.map((note) => normaliseParagraph(note)).filter(Boolean).slice(0, 6)
            : []

          if (!normaliseParagraph(topic?.title) || !normaliseParagraph(topic?.lesson)) {
            return null
          }

          return {
            id: `topic-${index + 1}`,
            title: normaliseParagraph(topic.title),
            summary: normaliseParagraph(topic.summary),
            lesson: normaliseParagraph(topic.lesson),
            notes,
            reflectionQuestion: normaliseParagraph(topic.reflectionQuestion),
          }
        })
        .filter(Boolean)
        .slice(0, 8)
    : []

  if (!topics.length) {
    throw new GeminiServiceError(WEBTUTOR_RESPONSE_MESSAGE)
  }

  return {
    title: normaliseParagraph(teaching.title || 'Teaching Studio'),
    intro: normaliseParagraph(teaching.intro),
    topics,
  }
}

function sanitiseDoubtAnswerShape(answer) {
  if (!answer || typeof answer !== 'object') {
    throw new GeminiServiceError(WEBTUTOR_RESPONSE_MESSAGE)
  }

  const explanation = normaliseParagraph(answer.explanation)
  const concept = normaliseParagraph(answer.concept)
  const mainBody = normaliseParagraph(answer.mainBody || explanation)
  const conclusion = normaliseParagraph(answer.conclusion || answer.keyTakeaway)
  const realLifeExample = normaliseParagraph(answer.realLifeExample)
  const numericalSteps = Array.isArray(answer?.numerical?.steps)
    ? answer.numerical.steps
        .map((step, index) => {
          const label = normaliseParagraph(step?.label || `Step ${index + 1}`)
          const detail = normaliseParagraph(step?.detail || step)

          if (!detail) {
            return null
          }

          return {
            label,
            detail,
          }
        })
        .filter(Boolean)
        .slice(0, 8)
    : []
  const codeNotes = Array.isArray(answer?.code?.notes)
    ? answer.code.notes.map((note) => normaliseParagraph(note)).filter(Boolean).slice(0, 6)
    : []

  return {
    title: normaliseParagraph(answer.title || 'Doubt Solved'),
    explanation,
    concept,
    mainBody,
    conclusion,
    realLifeExample,
    steps: Array.isArray(answer.steps)
      ? answer.steps.map((step) => normaliseParagraph(step)).filter(Boolean).slice(0, 5)
      : [],
    numerical: {
      isNumerical: Boolean(answer?.numerical?.isNumerical || numericalSteps.length || answer?.numerical?.finalAnswer),
      formulaUsed: normaliseParagraph(answer?.numerical?.formulaUsed),
      knownValues: Array.isArray(answer?.numerical?.knownValues)
        ? answer.numerical.knownValues.map((value) => normaliseParagraph(value)).filter(Boolean).slice(0, 8)
        : [],
      steps: numericalSteps,
      finalAnswer: normaliseParagraph(answer?.numerical?.finalAnswer),
    },
    code: {
      language: normaliseParagraph(answer?.code?.language),
      snippet: String(answer?.code?.snippet || '').trim(),
      explanation: normaliseParagraph(answer?.code?.explanation),
      notes: codeNotes,
    },
    keyTakeaway: normaliseParagraph(answer.keyTakeaway),
  }
}

function sanitiseFormulaShape(formula) {
  if (!formula || typeof formula !== 'object') {
    throw new GeminiServiceError(WEBTUTOR_RESPONSE_MESSAGE)
  }

  const sections = Array.isArray(formula.sections)
    ? formula.sections
        .map((section, index) => {
          const practiceQuestions = Array.isArray(section?.practiceQuestions)
            ? section.practiceQuestions.map((question) => normaliseParagraph(question)).filter(Boolean).slice(0, 4)
            : []

          if (!normaliseParagraph(section?.title) || !normaliseParagraph(section?.explanation)) {
            return null
          }

          return {
            id: `formula-${index + 1}`,
            title: normaliseParagraph(section.title),
            formulaName: normaliseParagraph(section.formulaName || section.title),
            formula: normaliseParagraph(section.formula || 'No direct formula required'),
            importance: normaliseParagraph(section.importance),
            whenToUse: normaliseParagraph(section.whenToUse),
            explanation: normaliseParagraph(section.explanation),
            practiceQuestions,
          }
        })
        .filter(Boolean)
        .slice(0, 8)
    : []

  if (!sections.length) {
    throw new GeminiServiceError(WEBTUTOR_RESPONSE_MESSAGE)
  }

  return {
    title: normaliseParagraph(formula.title || 'Formula Lab'),
    intro: normaliseParagraph(formula.intro),
    sections,
  }
}

async function requestJsonFromGeminiParts(parts) {
  const modelCandidates = getGeminiModels()
  let lastError = null

  for (let index = 0; index < modelCandidates.length; index += 1) {
    const { modelName, model } = modelCandidates[index]

    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      })

      return parseGeminiJson(result.response.text())
    } catch (error) {
      if (error instanceof GeminiServiceError) {
        throw error
      }

      lastError = error

      const debugStatus = Number(error?.status || error?.statusCode || 0) || 'unknown'
      const debugMessage = String(error?.message || 'Unknown error')
      const debugFlags = {
        modelName,
        invalidApiKey: isInvalidApiKeyError(error),
        quota: isGeminiQuotaError(error),
        setup: isGeminiSetupError(error),
        unsupportedInput: isUnsupportedInputError(error),
        upstream: isGeminiUpstreamError(error),
        retryableModel: isRetryableModelError(error),
      }

      console.error('WebTutor AI debug:', {
        status: debugStatus,
        message: debugMessage,
        flags: debugFlags,
      })

      if (isRetryableModelError(error) && index < modelCandidates.length - 1) {
        continue
      }

      if (isGeminiQuotaError(error)) {
        throw new GeminiServiceError(
          WEBTUTOR_PLAN_MESSAGE,
          429
        )
      }

      if (isInvalidApiKeyError(error)) {
        throw new GeminiServiceError(WEBTUTOR_CONFIG_MESSAGE, 401)
      }

      if (isGeminiSetupError(error)) {
        throw new GeminiServiceError(WEBTUTOR_SETUP_MESSAGE, Number(error?.status || error?.statusCode || 400))
      }

      if (isUnsupportedInputError(error)) {
        throw new GeminiServiceError(WEBTUTOR_FILE_MESSAGE, 400)
      }

      if (isGeminiUpstreamError(error)) {
        throw new GeminiServiceError(
          WEBTUTOR_BUSY_MESSAGE,
          Number(error?.status || error?.statusCode || 400) || 400
        )
      }

      throw new GeminiServiceError(
        WEBTUTOR_BUSY_MESSAGE,
        error.status || 502
      )
    }
  }

  throw new GeminiServiceError(
    WEBTUTOR_BUSY_MESSAGE,
    Number(lastError?.status || lastError?.statusCode || 502)
  )
}

function buildFallbackTimeline(chunks = [], durationInSeconds = 0) {
  if (!chunks.length) {
    const checkpoints = durationInSeconds
      ? [0, durationInSeconds * 0.33, durationInSeconds * 0.66]
      : [0]

    return checkpoints.slice(0, MAX_TIMELINE_ITEMS).map((time, index) => ({
      timestamp: formatTimestamp(time),
      label: ['Introduction', 'Key ideas', 'Wrap-up'][index] || `Section ${index + 1}`,
    }))
  }

  return chunks.slice(0, MAX_TIMELINE_ITEMS).map((chunk, index) => ({
    timestamp: formatTimestamp(chunk.startInSeconds),
    label: normaliseParagraph(chunk.timelineHint || chunk.chunkTitle || `Section ${index + 1}`),
  }))
}

module.exports = {
  sanitiseSummaryShape,
  sanitiseQuizShape,
  sanitiseTeachingShape,
  sanitiseDoubtAnswerShape,
  sanitiseFormulaShape,
  requestJsonFromGeminiParts,
  buildFallbackTimeline,
}
