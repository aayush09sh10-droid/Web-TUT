const { reorderSubjectItems } = require('../services/history')
const { logger, serialiseError } = require('../../../utils/logger')

async function reorderSubjectItemsController(req, res) {
  try {
    const subject = await reorderSubjectItems(
      req.user.id,
      req.params.id,
      req.body?.itemIds
    )

    return res.status(200).json({ success: true, subject })
  } catch (error) {
    logger.error('Reorder subject items error.', serialiseError(error))
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to reorder lessons inside the subject.',
    })
  }
}

module.exports = {
  reorderSubjectItemsController,
}
