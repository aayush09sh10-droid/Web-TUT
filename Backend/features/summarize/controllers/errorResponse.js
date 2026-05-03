const { GeminiServiceError } = require('../services/gemini')

const DEFAULT_GEMINI_UI_ERROR =
  'Web-Tut is unavailable right now. Please try again in a moment.'

function sendValidationError(res, message, statusCode = 400) {
  return res.status(statusCode).json({
    success: false,
    error: message,
    errorType: 'validation',
  })
}

function sendSummarizeError(res, error, fallbackMessage) {
  if (error instanceof GeminiServiceError) {
    const isSilentInUi = Number(error.statusCode) === 429

    return res.status(error.statusCode || 502).json({
      success: false,
      error: isSilentInUi ? '' : error.message || fallbackMessage || DEFAULT_GEMINI_UI_ERROR,
      errorType: 'gemini',
      silentInUi: isSilentInUi,
    })
  }

  if (Number(error?.statusCode) === 400) {
    return res.status(400).json({
      success: false,
      error: error.message || fallbackMessage || 'Invalid request.',
      errorType: 'validation',
    })
  }

  return res.status(502).json({
    success: false,
    error: fallbackMessage || DEFAULT_GEMINI_UI_ERROR,
    errorType: 'gemini',
  })
}

module.exports = {
  DEFAULT_GEMINI_UI_ERROR,
  sendSummarizeError,
  sendValidationError,
}
