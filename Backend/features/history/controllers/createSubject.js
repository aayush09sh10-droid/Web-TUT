const { createSubjectCollection } = require('../services/history')
const { logger, serialiseError } = require('../../../utils/logger')

async function createSubject(req, res) {
  try {
    const subject = await createSubjectCollection(req.user.id, req.body?.name)
    return res.status(201).json({ success: true, subject })
  } catch (error) {
    logger.error('Create subject error.', serialiseError(error))
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to create subject.',
    })
  }
}

module.exports = {
  createSubject,
}
