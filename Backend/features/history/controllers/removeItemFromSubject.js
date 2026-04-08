const { removeHistoryItemFromSubject } = require('../services/history')

async function removeItemFromSubject(req, res) {
  try {
    const subject = await removeHistoryItemFromSubject(
      req.user.id,
      req.params.id,
      req.params.historyId
    )

    return res.status(200).json({ success: true, subject })
  } catch (error) {
    console.error('Remove item from subject error:', error)
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to remove this lesson from the subject.',
    })
  }
}

module.exports = {
  removeItemFromSubject,
}
