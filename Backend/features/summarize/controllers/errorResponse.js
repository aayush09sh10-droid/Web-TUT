const { GeminiServiceError } = require('../services/gemini')
const { AudioServiceError } = require('../services/youtube-audio')

const DEFAULT_GEMINI_UI_ERROR =
  'Web-Tut is unavailable right now. Please try again in a moment.'

function buildSummarizeErrorPayload(error, fallbackMessage) {
  if (error instanceof GeminiServiceError) {
    const isSilentInUi = Number(error.statusCode) === 429

    return {
      statusCode: error.statusCode || 502,
      payload: {
        success: false,
        error: isSilentInUi ? '' : error.message || fallbackMessage || DEFAULT_GEMINI_UI_ERROR,
        errorType: 'gemini',
        silentInUi: isSilentInUi,
      },
    }
  }

  if (error instanceof AudioServiceError) {
    return {
      statusCode: error.statusCode || 502,
      payload: {
        success: false,
        error: error.message || fallbackMessage || DEFAULT_GEMINI_UI_ERROR,
        errorType: Number(error.statusCode) === 400 ? 'validation' : 'youtube',
      },
    }
  }

  if (Number(error?.statusCode) === 400) {
    return {
      statusCode: 400,
      payload: {
        success: false,
        error: error.message || fallbackMessage || 'Invalid request.',
        errorType: 'validation',
      },
    }
  }

  return {
    statusCode: 502,
    payload: {
      success: false,
      error: fallbackMessage || DEFAULT_GEMINI_UI_ERROR,
      errorType: 'gemini',
    },
  }
}

function sendValidationError(res, message, statusCode = 400) {
  return res.status(statusCode).json({
    success: false,
    error: message,
    errorType: 'validation',
  })
}

function sendSummarizeError(res, error, fallbackMessage) {
  const { statusCode, payload } = buildSummarizeErrorPayload(error, fallbackMessage)
  return res.status(statusCode).json(payload)
}

module.exports = {
  DEFAULT_GEMINI_UI_ERROR,
  buildSummarizeErrorPayload,
  sendSummarizeError,
  sendValidationError,
}
