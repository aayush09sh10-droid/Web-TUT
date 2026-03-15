const { getYoutubeTranscript } = require('../utils/youtube')
const { summarizeWithGemini } = require('../utils/gemini')

async function summarizeVideo(req, res) {
  try {
    const { url } = req.body
    const io = req.app.get('io')

    const emitProgress = (step) => {
      if (io) {
        io.emit('summary-progress', { step })
      }
    }

    // 1️⃣ Validate URL
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Missing `url` in request body.'
      })
    }

    // 2️⃣ Fetch transcript
    emitProgress('Fetching transcript')
    const transcript = await getYoutubeTranscript(url)

    if (!transcript || transcript.length < 20) {
      return res.status(400).json({
        success: false,
        error: 'Transcript could not be fetched for this video.'
      })
    }

    // 3️⃣ Analyze transcript (preparing for summary)
    emitProgress('Analyzing transcript')

    // 4️⃣ Generate AI summary
    emitProgress('Generating AI summary')
    const result = await summarizeWithGemini(transcript, url)

    // 5️⃣ Summary ready
    emitProgress('Summary ready')

    // 6️⃣ Send response
    return res.json({
      success: true,
      videoUrl: url,
      summary: result.summary
    })

  } catch (error) {
    console.error('Summarize error:', error)

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to summarize the video.'
    })
  }
}

module.exports = {
  summarizeVideo,
}