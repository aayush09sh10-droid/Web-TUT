const { createGeminiAudioChunks, downloadYoutubeAudio } = require('../youtube-audio')
const { generateSummaryFromAudioChunks } = require('../gemini')

async function summarizeWithAudio(url, options = {}) {
  const emitProgress = typeof options.emitProgress === 'function' ? options.emitProgress : () => {}

  emitProgress('Downloading audio')
  const audioResult = await downloadYoutubeAudio(url)

  emitProgress('Preparing audio for Web-Tut')
  const chunks = await createGeminiAudioChunks(
    audioResult.audioPath,
    audioResult.durationInSeconds
  )

  if (!chunks.length) {
    throw Object.assign(new Error('No audio found in video'), { statusCode: 400 })
  }

  emitProgress('Generating summary from audio')
  const summary = await generateSummaryFromAudioChunks(chunks, {
    ...options,
    durationInSeconds: audioResult.durationInSeconds,
    sourceUrl: url,
  })

  return {
    audioPath: audioResult.audioPath,
    chunkPaths: chunks.map((chunk) => chunk.path),
    durationInSeconds: audioResult.durationInSeconds,
    summary,
    strategy: 'audio',
  }
}

module.exports = {
  summarizeWithAudio,
}
