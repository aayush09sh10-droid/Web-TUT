const { clearHistoryEntries } = require('../services/history')

async function clearHistory(req, res) {
  try {
    await clearHistoryEntries(req.user._id)

    return res.json({
      success: true,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to clear history.',
    })
  }
}

module.exports = {
  clearHistory,
}
