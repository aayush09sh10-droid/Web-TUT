const { downloadYoutubeTranscript } = require('../youtube-audio')
const { generateFastSummaryFromTranscript } = require('../gemini/transcriptFastSummary')
const { generateSummaryFromTranscript } = require('../gemini')
const { TRANSCRIPT_FAST_PATH_MAX_CHARS } = require('./config')

async function summarizeWithTranscript(url, options = {}) {
  const emitProgress = typeof options.emitProgress === 'function' ? options.emitProgress : () => {}

  emitProgress('Checking transcript')
  let transcript = null

  try {
    transcript = await downloadYoutubeTranscript(url)
  } catch (error) {
    console.warn('Transcript fast path skipped:', error.message)
    return {
      summary: null,
      transcriptPath: null,
      strategy: 'transcript-error',
    }
  }

  if (!transcript?.transcriptText) {
    return {
      summary: null,
      transcriptPath: transcript?.transcriptPath || null,
      strategy: 'transcript-unavailable',
    }
  }

  const transcriptText = String(transcript.transcriptText || '').trim()

  emitProgress(
    transcriptText.length <= TRANSCRIPT_FAST_PATH_MAX_CHARS
      ? 'Generating summary from transcript'
      : 'Generating summary from long transcript'
  )

  const summary =
    transcriptText.length <= TRANSCRIPT_FAST_PATH_MAX_CHARS
      ? await generateFastSummaryFromTranscript(transcriptText, options)
      : await generateSummaryFromTranscript(transcriptText, options)

  return {
    summary,
    transcriptPath: transcript.transcriptPath || null,
    strategy:
      transcriptText.length <= TRANSCRIPT_FAST_PATH_MAX_CHARS
        ? 'transcript-fast'
        : 'transcript-chunked',
  }
}

module.exports = {
  summarizeWithTranscript,
}
