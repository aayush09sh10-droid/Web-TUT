const OpenAI = require('openai')

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

// Use global fetch (Node 18+)
const fetchFn = global.fetch || (() => {
  throw new Error('Global fetch is not available; please run on Node 18+ or set up a fetch polyfill.')
})

function buildPrompt(transcript, url) {
  // Increase transcript context
  const snippet =
    transcript.length > 12000
      ? transcript.slice(0, 12000) + '...'
      : transcript

  return `
You are an expert educator who summarizes YouTube videos.

The user provided this YouTube video:
${url}

Below is the transcript of the video.

IMPORTANT RULES:
- Do NOT repeat the transcript.
- Do NOT copy transcript sentences.
- Do NOT quote transcript text.
- Analyze the ideas in the transcript.
- Explain the video in your own words.
- Provide a **comprehensive**, **detailed**, and **well-structured** explanation that could stand alone for someone who has never seen the video.
- Use as many words as needed to fully cover the key concepts and teaching points.

Your task:
Understand the transcript and explain what the video teaches.

Return ONLY valid JSON with this structure:

{
 "summary": "Explain clearly what the video teaches, what main ideas are discussed, and what someone would learn from watching the video. Use as many words as necessary to provide a complete and helpful explanation."
}

Transcript:
${snippet}
`
}

function isLikelyTranscript(summary, transcript) {
  if (!summary || !transcript) return false

  const normalize = (s) =>
    s
      .toLowerCase()
      .replace(/[\r\n]/g, ' ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

  const normSummary = normalize(summary)
  const normTranscript = normalize(transcript)

  if (normSummary.length > normTranscript.length * 0.6) return true

  if (normSummary.includes('transcript')) return true

  const summaryWords = new Set(normSummary.split(' '))
  const transcriptWords = new Set(normTranscript.split(' '))

  const overlap = Array.from(summaryWords).filter((w) =>
    transcriptWords.has(w)
  ).length

  const overlapRatio = summaryWords.size === 0 ? 0 : overlap / summaryWords.size

  if (overlapRatio > 0.85) return true

  if (
    normTranscript.includes(normSummary) ||
    normSummary.includes(normTranscript)
  )
    return true

  return false
}

function parseStructuredSummary(raw) {
  if (!raw || typeof raw !== 'string') return null

  const firstBrace = raw.indexOf('{')
  const lastBrace = raw.lastIndexOf('}')

  if (firstBrace === -1 || lastBrace === -1) return null

  const jsonText = raw.slice(firstBrace, lastBrace + 1)

  try {
    const parsed = JSON.parse(jsonText)

    if (parsed && typeof parsed.summary === 'string') {
      return { summary: parsed.summary.trim() }
    }
  } catch {
    return null
  }

  return null
}

function summarizeLocally(transcript) {
  const normalized = transcript.replace(/\s+/g, ' ').trim()

  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)

  const summary = sentences.slice(0, 6).join(' ') || normalized.slice(0, 200)

  return {
    summary,
  }
}

async function summarizeWithGemini(transcript, url) {
  if (GEMINI_API_KEY) {
    try {
      return await summarizeWithGoogleGemini(transcript, url)
    } catch (err) {
      console.warn(
        'Gemini summarization failed; falling back to local summary.',
        err.message
      )
      return summarizeLocally(transcript)
    }
  }

  if (OPENAI_API_KEY) {
    try {
      return await summarizeWithOpenAI(transcript, url)
    } catch (err) {
      console.warn(
        'OpenAI summarization failed; falling back to local summary.',
        err.message
      )
      return summarizeLocally(transcript)
    }
  }

  return summarizeLocally(transcript)
}

async function summarizeWithGoogleGemini(transcript, url) {
  const prompt = buildPrompt(transcript, url)

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`

  const body = {
  contents: [
    {
      parts: [
        {
          text: prompt
        }
      ]
    }
  ],
  generationConfig: {
    temperature: 0.3,
    maxOutputTokens: 2048
  }
}

  const response = await fetchFn(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Gemini request failed: ${response.status} ${errText}`)
  }

  const data = await response.json()

  const output =
  data?.candidates?.[0]?.content?.parts?.[0]?.text || ''

  if (!output) {
    throw new Error('Gemini did not return any summary.')
  }

  if (isLikelyTranscript(output, transcript)) {
    return summarizeLocally(transcript)
  }

  const structured = parseStructuredSummary(output)

  if (!structured) {
    return summarizeLocally(transcript)
  }

  return structured
}

async function summarizeWithOpenAI(transcript, url) {
  const prompt = buildPrompt(transcript, url)

  const client = new OpenAI({
    apiKey: OPENAI_API_KEY,
  })

  const response = await client.responses.create({
    model: 'gpt-4o-mini',
    input: prompt,
    max_output_tokens: 1024,
    temperature: 0.3,
  })

  const output = response.output?.[0]?.content?.[0]?.text

  if (!output) {
    throw new Error('OpenAI did not return a summary.')
  }

  if (isLikelyTranscript(output, transcript)) {
    return summarizeLocally(transcript)
  }

  const structured = parseStructuredSummary(output)

  if (!structured) {
    return summarizeLocally(transcript)
  }

  return structured
}

module.exports = {
  summarizeWithGemini,
}