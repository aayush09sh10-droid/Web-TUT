const fs = require('fs')

const { GeminiServiceError } = require('./errors')
const {
  buildFallbackTimeline,
  requestJsonFromGeminiParts,
  sanitiseSummaryShape,
} = require('./parser')
const { formatTimestamp, mimeTypeFromPath, normaliseParagraph } = require('./text')

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

function buildTranscriptChunkPrompt(transcriptChunk, index, totalChunks) {
  return `
You are reading one transcript chunk from a YouTube video.

Rules:
- Ignore filler words, subtitle noise, and repeated lines.
- Do not copy the speaker word-for-word.
- Rewrite everything in simple, clean language.
- Focus only on the ideas being explained.

Return valid JSON only in this shape:
{
  "chunkTitle": "short title",
  "mainIdeas": [
    "brief rewritten point"
  ],
  "timelineHint": "very short label for this chunk"
}

Transcript chunk ${index} of ${totalChunks}:
${transcriptChunk}
`.trim()
}

function buildLearningPreferencesBlock(options = {}) {
  const studyPrompt = normaliseParagraph(options.studyPrompt)

  if (!studyPrompt) {
    return ''
  }

  return `
Student preferences:
- Summary instructions: ${studyPrompt || 'No special instructions provided'}
- Respect these instructions while keeping the result accurate, structured, and useful for later feature generation.
- If the student asks for a visual or image-style part, shape the summary so later teaching can include a useful visual study guide.
`.trim()
}

function buildFinalPrompt(compiledNotes, durationInSeconds, options = {}) {
  const preferencesBlock = buildLearningPreferencesBlock(options)

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

${preferencesBlock ? `${preferencesBlock}\n` : ''}

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
  },
  "topics": [
    {
      "title": "topic title",
      "summary": "short topic explanation",
      "keyPoints": [
        "short point"
      ]
    }
  ]
}
`.trim()
}

function splitTranscriptIntoChunks(transcriptText, maxChunkLength = 12000) {
  const safeText = normaliseParagraph(transcriptText)

  if (!safeText) {
    return []
  }

  if (safeText.length <= maxChunkLength) {
    return [safeText]
  }

  const sentences = safeText.split(/(?<=[.?!])\s+/)
  const chunks = []
  let currentChunk = ''

  for (const sentence of sentences) {
    if (!sentence) {
      continue
    }

    const candidate = currentChunk ? `${currentChunk} ${sentence}` : sentence

    if (candidate.length > maxChunkLength && currentChunk) {
      chunks.push(currentChunk)
      currentChunk = sentence
      continue
    }

    currentChunk = candidate
  }

  if (currentChunk) {
    chunks.push(currentChunk)
  }

  return chunks.slice(0, 12)
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

async function summariseTranscriptChunk(transcriptChunk, index, totalChunks) {
  const chunkSummary = await requestJsonFromGeminiParts([
    { text: buildTranscriptChunkPrompt(transcriptChunk, index, totalChunks) },
  ])

  return {
    startInSeconds: 0,
    durationInSeconds: 0,
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
    { text: buildFinalPrompt(compiledNotes, durationInSeconds, options) },
  ])

  const sanitised = sanitiseSummaryShape(finalSummary)

  if (!sanitised.timeline.length) {
    sanitised.timeline = buildFallbackTimeline(partialSummaries, durationInSeconds)
  }

  return sanitised
}

async function generateSummaryFromTranscript(transcriptText, options = {}) {
  const transcriptChunks = splitTranscriptIntoChunks(transcriptText)

  if (!transcriptChunks.length) {
    throw new GeminiServiceError('No transcript found for this video', 400)
  }

  const partialSummaries = []

  for (let index = 0; index < transcriptChunks.length; index += 1) {
    partialSummaries.push(
      await summariseTranscriptChunk(transcriptChunks[index], index + 1, transcriptChunks.length)
    )
  }

  const durationInSeconds = Number(options.durationInSeconds || 0)
  const compiledNotes = JSON.stringify(partialSummaries, null, 2)
  const finalSummary = await requestJsonFromGeminiParts([
    { text: buildFinalPrompt(compiledNotes, durationInSeconds, options) },
  ])

  const sanitised = sanitiseSummaryShape(finalSummary)

  if (!sanitised.timeline.length) {
    sanitised.timeline = buildFallbackTimeline(partialSummaries, durationInSeconds)
  }

  return sanitised
}

module.exports = {
  generateSummaryFromAudioChunks,
  generateSummaryFromTranscript,
}
