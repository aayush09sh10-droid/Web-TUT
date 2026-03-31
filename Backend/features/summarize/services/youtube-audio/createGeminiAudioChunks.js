const { GEMINI_AUDIO_CHUNK_SECONDS } = require('./constants')
const { runFfmpeg } = require('./ffmpeg')

async function createGeminiAudioChunks(audioPath, durationInSeconds = 0) {
  const totalDuration = Math.max(0, Math.ceil(Number(durationInSeconds) || 0))
  const chunks = []

  if (!totalDuration) {
    const outputPath = `${audioPath}.chunk-0.mp3`
    await runFfmpeg(['-y', '-i', audioPath, '-vn', '-ac', '1', '-ar', '16000', '-b:a', '96k', outputPath])
    chunks.push({ path: outputPath, startInSeconds: 0, durationInSeconds: 0 })
    return chunks
  }

  for (let start = 0, index = 0; start < totalDuration; start += GEMINI_AUDIO_CHUNK_SECONDS, index += 1) {
    const chunkDuration = Math.min(GEMINI_AUDIO_CHUNK_SECONDS, totalDuration - start)
    const outputPath = `${audioPath}.chunk-${index}.mp3`

    await runFfmpeg([
      '-y',
      '-ss',
      String(start),
      '-t',
      String(chunkDuration),
      '-i',
      audioPath,
      '-vn',
      '-ac',
      '1',
      '-ar',
      '16000',
      '-b:a',
      '96k',
      outputPath,
    ])

    chunks.push({
      path: outputPath,
      startInSeconds: start,
      durationInSeconds: chunkDuration,
    })
  }

  return chunks
}

module.exports = {
  createGeminiAudioChunks,
}
