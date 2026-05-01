const { listHistoryEntries } = require('../services/history')

async function listHistory(req, res) {
  try {
    if (!req.user) {
      return res.json({
        success: true,
        history: [],
      })
    }

    const history = await listHistoryEntries(req.user._id)

    return res.json({
      success: true,
      history,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to load history.',
    })
  }
}

module.exports = {
  listHistory,
}
