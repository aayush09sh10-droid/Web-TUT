const fs = require('fs')

const { GoogleGenerativeAI } = require('@google/generative-ai')

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
const MAX_TIMELINE_ITEMS = 6

class GeminiServiceError extends Error {
  constructor(message, statusCode = 502) {
    super(message)
    this.name = 'GeminiServiceError'
    this.statusCode = statusCode
  }
}

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

function formatTimestamp(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  if (hours > 0) {
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
  }

  return [minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
}

function normaliseParagraph(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanJsonFence(text) {
  return String(text || '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()
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

function mimeTypeFromPath(filePath) {
  const lowerPath = String(filePath).toLowerCase()

  if (lowerPath.endsWith('.mp3')) return 'audio/mpeg'
  if (lowerPath.endsWith('.wav')) return 'audio/wav'
  if (lowerPath.endsWith('.m4a')) return 'audio/mp4'
  if (lowerPath.endsWith('.aac')) return 'audio/aac'
  if (lowerPath.endsWith('.ogg')) return 'audio/ogg'
  if (lowerPath.endsWith('.webm')) return 'audio/webm'

  return 'application/octet-stream'
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

    throw new GeminiServiceError(
      `Gemini request failed: ${error.message || 'Unknown error'}`,
      error.status || 502
    )
  }
}

function buildChunkPrompt(chunk, index, totalChunks) {
  const startTime = formatTimestamp(chunk.startInSeconds)
  const endTime = formatTimestamp(chunk.startInSeconds + (chunk.durationInSeconds || 0))

  return `
You are listening to one chunk of audio from a YouTube video.

Rules:
- Do not copy the speaker word-for-word.
- Rewrite everything in your own words.
- Keep the language simple and easy to understand.
- Focus on what is being explained in this audio chunk.

Return valid JSON only in this shape:
{
  "chunkTitle": "short title",
  "mainIdeas": [
    "brief rewritten point"
  ],
  "timelineHint": "very short label for this chunk"
}

Chunk ${index} of ${totalChunks}
Approximate audio range: ${startTime} to ${endTime}
`.trim()
}

function buildFinalPrompt(compiledNotes, durationInSeconds) {
  return `
You are creating the final summary for a YouTube video's audio.

Follow these rules strictly:
- Do not copy the original speech.
- Rewrite everything in your own words.
- Keep the language simple and easy to understand.
- Return exactly one short title.
- Create a logical timeline with approximate timestamps.
- Write exactly three short paragraphs.
- Paragraph 1: brief overview of the topic.
- Paragraph 2: explain the core ideas simply.
- Paragraph 3: add extra insights and suggest what to explore next.

Video duration hint: ${formatTimestamp(durationInSeconds || 0)}

Use these chunk notes:
${compiledNotes}

Return valid JSON only in this shape:
{
  "title": "short meaningful title",
  "timeline": [
    { "timestamp": "00:00", "label": "Introduction" }
  ],
  "paragraphs": {
    "overview": "short paragraph",
    "coreIdeas": "short paragraph",
    "exploreMore": "short paragraph"
  }
}
`.trim()
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

async function summariseAudioChunk(chunk, index, totalChunks) {
  const audioBuffer = await fs.promises.readFile(chunk.path)
  const chunkSummary = await requestJsonFromGeminiParts([
    { text: buildChunkPrompt(chunk, index, totalChunks) },
    {
      inlineData: {
        mimeType: mimeTypeFromPath(chunk.path),
        data: audioBuffer.toString('base64'),
      },
    },
  ])

  return {
    startInSeconds: chunk.startInSeconds,
    durationInSeconds: chunk.durationInSeconds,
    chunkTitle: normaliseParagraph(chunkSummary.chunkTitle || `Section ${index}`),
    timelineHint: normaliseParagraph(chunkSummary.timelineHint || chunkSummary.chunkTitle || `Section ${index}`),
    mainIdeas: Array.isArray(chunkSummary.mainIdeas)
      ? chunkSummary.mainIdeas.map((idea) => normaliseParagraph(idea)).filter(Boolean)
      : [],
  }
}

async function generateSummaryFromAudioChunks(chunks, options = {}) {
  if (!Array.isArray(chunks) || !chunks.length) {
    throw new GeminiServiceError('No audio found in video', 400)
  }

  const durationInSeconds = Number(options.durationInSeconds || 0)
  const partialSummaries = []

  for (let index = 0; index < chunks.length; index += 1) {
    partialSummaries.push(await summariseAudioChunk(chunks[index], index + 1, chunks.length))
  }

  const compiledNotes = JSON.stringify(partialSummaries, null, 2)
  const finalSummary = await requestJsonFromGeminiParts([
    { text: buildFinalPrompt(compiledNotes, durationInSeconds) },
  ])

  const sanitised = sanitiseSummaryShape(finalSummary)

  if (!sanitised.timeline.length) {
    sanitised.timeline = buildFallbackTimeline(partialSummaries, durationInSeconds)
  }

  return sanitised
}

module.exports = {
  generateSummaryFromAudioChunks,
  GeminiServiceError,
}
