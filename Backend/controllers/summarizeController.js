const { getYoutubeTranscript } = require('../utils/youtube')
const { summarizeWithGemini } = require('../utils/gemini')

async function summarizeVideo(req, res) {
  try {
    const { url } = req.body

    // 1️⃣ Validate URL
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Missing `url` in request body.'
      })
    }

    // 2️⃣ Fetch transcript
    const transcript = await getYoutubeTranscript(url)

    if (!transcript || transcript.length < 20) {
      return res.status(400).json({
        success: false,
        error: 'Transcript could not be fetched for this video.'
      })
    }

    // 3️⃣ Generate AI summary
    const result = await summarizeWithGemini(transcript, url)

    // 4️⃣ Send response
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