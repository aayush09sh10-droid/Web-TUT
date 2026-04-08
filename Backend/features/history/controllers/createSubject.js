const { createSubjectCollection } = require('../services/history')

async function createSubject(req, res) {
  try {
    const subject = await createSubjectCollection(req.user.id, req.body?.name)
    return res.status(201).json({ success: true, subject })
  } catch (error) {
    console.error('Create subject error:', error)
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to create subject.',
    })
  }
}

module.exports = {
  createSubject,
}
