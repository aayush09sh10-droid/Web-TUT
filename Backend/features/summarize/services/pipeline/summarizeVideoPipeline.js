const { summarizeWithAudio } = require('./summarizeWithAudio')
const { summarizeWithTranscript } = require('./summarizeWithTranscript')

async function summarizeVideoPipeline(url, options = {}) {
  const emitProgress = typeof options.emitProgress === 'function' ? options.emitProgress : () => {}
  const tempPaths = []

  try {
    const transcriptResult = await summarizeWithTranscript(url, options)

    if (transcriptResult?.transcriptPath) {
      tempPaths.push(transcriptResult.transcriptPath)
    }

    if (transcriptResult?.summary) {
      emitProgress('Summary ready')
      return {
        summary: transcriptResult.summary,
        tempPaths,
        strategy: transcriptResult.strategy,
      }
    }

    const audioResult = await summarizeWithAudio(url, options)

    tempPaths.push(
      audioResult.audioPath,
      ...(Array.isArray(audioResult.chunkPaths) ? audioResult.chunkPaths : [])
    )

    emitProgress('Summary ready')
    return {
      summary: audioResult.summary,
      tempPaths,
      strategy: audioResult.strategy,
    }
  } catch (error) {
    error.tempPaths = Array.isArray(error.tempPaths)
      ? [...tempPaths, ...error.tempPaths]
      : tempPaths
    throw error
  }
}

module.exports = {
  summarizeVideoPipeline,
}
