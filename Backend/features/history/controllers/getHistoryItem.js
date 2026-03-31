const { getHistoryEntry } = require('../services/history')

async function getHistoryItem(req, res) {
  try {
    const item = await getHistoryEntry(req.user._id, req.params.id)

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'History item not found.',
      })
    }

    return res.json({
      success: true,
      item,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to load history item.',
    })
  }
}

module.exports = {
  getHistoryItem,
}
