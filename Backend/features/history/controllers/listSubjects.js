const { listSubjectCollections } = require('../services/history')

async function listSubjects(req, res) {
  try {
    const subjects = await listSubjectCollections(req.user.id)
    return res.status(200).json({ success: true, subjects })
  } catch (error) {
    console.error('List subjects error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to load subjects.',
    })
  }
}

module.exports = {
  listSubjects,
}
