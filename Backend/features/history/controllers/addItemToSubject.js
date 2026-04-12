const { addHistoryItemToSubject } = require('../services/history')
const { logger, serialiseError } = require('../../../utils/logger')

async function addItemToSubject(req, res) {
  try {
    const subject = await addHistoryItemToSubject(
      req.user.id,
      req.params.id,
      req.body?.historyId
    )

    return res.status(200).json({ success: true, subject })
  } catch (error) {
    logger.error('Add item to subject error.', serialiseError(error))
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to save this lesson into the subject.',
    })
  }
}

module.exports = {
  addItemToSubject,
}
