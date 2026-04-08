const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
const GEMINI_FALLBACK_MODELS = String(
  process.env.GEMINI_FALLBACK_MODELS || 'gemini-2.5-flash-lite,gemini-2.0-flash,gemini-flash-latest'
)
  .split(',')
  .map((model) => model.trim())
  .filter(Boolean)
const MAX_TIMELINE_ITEMS = 6

module.exports = {
  GEMINI_MODEL,
  GEMINI_FALLBACK_MODELS,
  MAX_TIMELINE_ITEMS,
}
