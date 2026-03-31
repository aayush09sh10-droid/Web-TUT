const { deleteHistoryEntry } = require('../services/history')

async function deleteHistoryItem(req, res) {
  try {
    const removed = await deleteHistoryEntry(req.user._id, req.params.id)

    if (!removed) {
      return res.status(404).json({
        success: false,
        error: 'History item not found.',
      })
    }

    return res.json({
      success: true,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete history item.',
    })
  }
}

module.exports = {
  deleteHistoryItem,
}
