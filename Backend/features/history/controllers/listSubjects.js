const { listSubjectCollections } = require('../services/history')
const { logger, serialiseError } = require('../../../utils/logger')

async function listSubjects(req, res) {
  try {
    const subjects = await listSubjectCollections(req.user.id)
    return res.status(200).json({ success: true, subjects })
  } catch (error) {
    logger.error('List subjects error.', serialiseError(error))
    return res.status(500).json({
      success: false,
      error: 'Failed to load subjects.',
    })
  }
}

module.exports = {
  listSubjects,
}
