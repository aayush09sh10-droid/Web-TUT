const OpenAI = require("openai")

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

const fetchFn = global.fetch || (() => {
  throw new Error("Global fetch is not available")
})

/* -----------------------------
   Split transcript into chunks
------------------------------*/
function splitTranscript(transcript, size = 6000) {
  const chunks = []
  for (let i = 0; i < transcript.length; i += size) {
    chunks.push(transcript.slice(i, i + size))
  }
  return chunks
}

/* -----------------------------
   Parse JSON from AI
------------------------------*/
function parseStructuredSummary(raw) {
  if (!raw) return null

  const firstBrace = raw.indexOf("{")
  const lastBrace = raw.lastIndexOf("}")

  if (firstBrace === -1 || lastBrace === -1) return null

  try {
    const jsonText = raw.slice(firstBrace, lastBrace + 1)
    const parsed = JSON.parse(jsonText)

    if (parsed.summary) {
      return { summary: parsed.summary.trim() }
    }
  } catch {}

  return null
}

/* -----------------------------
   Local fallback summary
------------------------------*/
function summarizeLocally(transcript) {
  const normalized = transcript.replace(/\s+/g, " ").trim()

  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)

  const summary = sentences.slice(0, 6).join(" ")

  return {
    summary,
  }
}

/* -----------------------------
   Gemini API call
------------------------------*/
async function callGemini(prompt) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`

  const body = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
    },
  }

  const response = await fetchFn(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Gemini request failed: ${response.status} ${errText}`)
  }

  const data = await response.json()

  return data?.candidates?.[0]?.content?.parts?.[0]?.text || ""
}

/* -----------------------------
   Main Gemini summarization
------------------------------*/
async function summarizeWithGoogleGemini(transcript, url) {
  const chunks = splitTranscript(transcript)

  const partialSummaries = []

  // Step 1: summarize each chunk
  for (const chunk of chunks) {
    const prompt = `
You are summarizing a YouTube video transcript.

Rules:
- Do NOT copy transcript text.
- Explain the ideas briefly.
- Use your own words.

Transcript part:
${chunk}

Return JSON:
{
 "summary": "Short explanation of this part."
}
`

    const result = await callGemini(prompt)

    const parsed = parseStructuredSummary(result)

    if (parsed) {
      partialSummaries.push(parsed.summary)
    }
  }

  // Step 2: combine summaries
  const finalPrompt = `
You are combining summaries of a YouTube video.

Summaries:
${partialSummaries.join("\n")}

Create one clear explanation of the video.

Return JSON:

{
 "summary": "Complete explanation of what the video teaches."
}
`

  const finalOutput = await callGemini(finalPrompt)

  const structured = parseStructuredSummary(finalOutput)

  if (!structured) {
    return summarizeLocally(transcript)
  }

  return structured
}

/* -----------------------------
   Entry function
------------------------------*/
async function summarizeWithGemini(transcript, url) {
  if (GEMINI_API_KEY) {
    try {
      return await summarizeWithGoogleGemini(transcript, url)
    } catch (err) {
      console.warn("Gemini failed, using fallback:", err.message)
      return summarizeLocally(transcript)
    }
  }

  if (OPENAI_API_KEY) {
    try {
      const client = new OpenAI({ apiKey: OPENAI_API_KEY })

      const response = await client.responses.create({
        model: "gpt-4o-mini",
        input: transcript.slice(0, 10000),
      })

      const output = response.output?.[0]?.content?.[0]?.text

      return {
        summary: output,
      }
    } catch (err) {
      return summarizeLocally(transcript)
    }
  }

  return summarizeLocally(transcript)
}

module.exports = {
  summarizeWithGemini,
}