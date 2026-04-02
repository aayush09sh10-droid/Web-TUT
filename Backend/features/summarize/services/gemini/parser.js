const { GoogleGenerativeAI } = require('@google/generative-ai')

const { GEMINI_MODEL, MAX_TIMELINE_ITEMS } = require('./constants')
const { GeminiServiceError } = require('./errors')
const { cleanJsonFence, formatTimestamp, normaliseParagraph } = require('./text')

function ensureGeminiConfig() {
  const apiKey = String(process.env.GEMINI_API_KEY || '').trim()

  if (!apiKey || /your_.*key_here/i.test(apiKey)) {
    throw new GeminiServiceError('GEMINI_API_KEY is missing or still using a placeholder value.', 500)
  }
}

function getGeminiModel() {
  ensureGeminiConfig()

  const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  return client.getGenerativeModel({ model: GEMINI_MODEL })
}

function isGeminiQuotaError(error) {
  const message = String(error?.message || '').toLowerCase()
  const status = Number(error?.status || error?.statusCode || 0)

  return (
    status === 429 ||
    status === 503 ||
    message.includes('quota') ||
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('resource has been exhausted') ||
    message.includes('token limit') ||
    message.includes('billing') ||
    message.includes('exceeded') ||
    message.includes('service unavailable') ||
    message.includes('high demand') ||
    message.includes('try again later')
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
      throw new GeminiServiceError('Gemini returned an invalid response format.')
    }

    try {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1))
    } catch {
      throw new GeminiServiceError('Gemini returned malformed JSON.')
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

function sanitiseSummaryShape(summary) {
  if (!summary || typeof summary !== 'object') {
    throw new GeminiServiceError('Gemini did not return a valid summary object.')
  }

  const sanitised = {
    title: normaliseParagraph(summary.title || 'Video Summary'),
    timeline: sanitiseTimeline(summary.timeline),
    paragraphs: {
      overview: normaliseParagraph(summary.paragraphs?.overview),
      coreIdeas: normaliseParagraph(summary.paragraphs?.coreIdeas),
      exploreMore: normaliseParagraph(summary.paragraphs?.exploreMore),
    },
  }

  if (
    !sanitised.paragraphs.overview ||
    !sanitised.paragraphs.coreIdeas ||
    !sanitised.paragraphs.exploreMore
  ) {
    throw new GeminiServiceError('Gemini returned an incomplete summary structure.')
  }

  return sanitised
}

function sanitiseQuizShape(quiz) {
  if (!quiz || typeof quiz !== 'object') {
    throw new GeminiServiceError('Gemini did not return a valid quiz object.')
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
    throw new GeminiServiceError('Gemini returned an incomplete quiz structure.')
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
    throw new GeminiServiceError('Gemini did not return a valid teaching object.')
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
    throw new GeminiServiceError('Gemini returned an incomplete teaching structure.')
  }

  return {
    title: normaliseParagraph(teaching.title || 'Teaching Studio'),
    intro: normaliseParagraph(teaching.intro),
    topics,
  }
}

function sanitiseDoubtAnswerShape(answer) {
  if (!answer || typeof answer !== 'object') {
    throw new GeminiServiceError('Gemini did not return a valid doubt answer object.')
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
    throw new GeminiServiceError('Gemini did not return a valid formula object.')
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
    throw new GeminiServiceError('Gemini returned an incomplete formula structure.')
  }

  return {
    title: normaliseParagraph(formula.title || 'Formula Lab'),
    intro: normaliseParagraph(formula.intro),
    sections,
  }
}

async function requestJsonFromGeminiParts(parts) {
  const model = getGeminiModel()

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

    if (isGeminiQuotaError(error)) {
      throw new GeminiServiceError(
        'Gemini token finished. Please take subscription.',
        429
      )
    }

    throw new GeminiServiceError(
      `Gemini request failed: ${error.message || 'Unknown error'}`,
      error.status || 502
    )
  }
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
