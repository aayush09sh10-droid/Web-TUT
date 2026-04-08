const JSZip = require('jszip')
const { requestJsonFromGeminiParts, sanitiseSummaryShape } = require('./parser')
const { GeminiServiceError } = require('./errors')
const { normaliseParagraph } = require('./text')

const MAX_PHOTO_UPLOADS = 10
const MAX_TEXT_FILE_CHARS = 12000
const PPTX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
const PPT_MIME_TYPE = 'application/vnd.ms-powerpoint'

function buildStudyMaterialSummaryPrompt({ sourceMode, uploads }) {
  const uploadLabels = uploads
    .map((upload, index) => `${index + 1}. ${upload.fileName} (${upload.mimeType})`)
    .join('\n')

  return `
You are reading uploaded study materials for a student.

Follow these rules strictly:
- Read all provided study materials carefully.
- The materials may include photos, PDFs, PowerPoint slides, or text-based study files.
- Combine all useful material into one coherent study summary.
- Rewrite everything in simple, clean language.
- If some material is messy or partial, still extract the strongest ideas.
- Return exactly one short title.
- Create a short logical timeline or section flow based on the topics.
- Write exactly three short paragraphs.
- Paragraph 1: overview of what the material is about.
- Paragraph 2: core ideas explained simply.
- Paragraph 3: extra insights, revision help, or what to review next.
- Add 3 to 8 topic-wise study parts.
- Each topic should include a short title, a short explanation, and key points for revision.
- Make the result useful for later teaching-path and formula generation.

Input mode: ${sourceMode}
Uploaded materials:
${uploadLabels}

Return valid JSON only in this shape:
{
  "title": "short meaningful title",
  "timeline": [
    { "timestamp": "Part 1", "label": "Introduction" }
  ],
  "paragraphs": {
    "overview": "short paragraph",
    "coreIdeas": "short paragraph",
    "exploreMore": "short paragraph"
  },
  "topics": [
    {
      "title": "topic title",
      "summary": "short topic explanation",
      "keyPoints": [
        "short point"
      ]
    }
  ]
}
`.trim()
}

function sanitiseStudyMimeType(mimeType) {
  const safeType = String(mimeType || '').trim().toLowerCase()

  if (!safeType) {
    throw new GeminiServiceError('Each uploaded file must include a valid mime type.', 400)
  }

  return safeType
}

function isTextLikeMimeType(mimeType) {
  return (
    mimeType.startsWith('text/') ||
    [
      'application/json',
      'application/ld+json',
      'application/xml',
      'application/javascript',
      'application/x-javascript',
      'application/csv',
      'text/csv',
    ].includes(mimeType)
  )
}

function isPptxMimeType(mimeType) {
  return mimeType === PPTX_MIME_TYPE
}

function isInlineStudyMimeType(mimeType) {
  return (
    mimeType.startsWith('image/') ||
    mimeType === 'application/pdf'
  )
}

function decodeXmlText(value = '') {
  return String(value)
    .replace(/<a:tab\/>/g, ' ')
    .replace(/<a:br\/>/g, '\n')
    .replace(/<\/a:p>/g, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

async function extractTextFromPptx(upload) {
  try {
    const zip = await JSZip.loadAsync(Buffer.from(upload.data, 'base64'))
    const slideEntries = Object.keys(zip.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

    if (!slideEntries.length) {
      throw new GeminiServiceError(
        `Unable to find readable slides in "${upload.fileName}". Please re-save it as a standard PPTX file.`,
        400
      )
    }

    const slideTexts = await Promise.all(
      slideEntries.map(async (entryName, index) => {
        const xml = await zip.files[entryName].async('string')
        const text = decodeXmlText(xml)

        if (!text) {
          return ''
        }

        return `Slide ${index + 1}\n${text}`
      })
    )

    const combinedText = slideTexts.filter(Boolean).join('\n\n').trim()

    if (!combinedText) {
      throw new GeminiServiceError(
        `Unable to read text from "${upload.fileName}". Please make sure the slides contain selectable text or export as PDF.`,
        400
      )
    }

    return combinedText.slice(0, MAX_TEXT_FILE_CHARS)
  } catch (error) {
    if (error instanceof GeminiServiceError) {
      throw error
    }

    throw new GeminiServiceError(
      `Unable to read "${upload.fileName}" as a PPTX file. Please re-save it as PPTX or PDF and try again.`,
      400
    )
  }
}

function normaliseUploads(uploads = []) {
  if (!Array.isArray(uploads) || !uploads.length) {
    throw new GeminiServiceError('Please upload at least one study file.', 400)
  }

  return uploads.map((upload, index) => {
    const data = String(upload?.data || upload?.imageData || '').trim()
    const mimeType = sanitiseStudyMimeType(upload?.mimeType)
    const fileName = normaliseParagraph(upload?.fileName || `Study file ${index + 1}`)

    if (!data) {
      throw new GeminiServiceError(`Uploaded file "${fileName}" is empty.`, 400)
    }

    if (mimeType === PPT_MIME_TYPE) {
      throw new GeminiServiceError(
        `Legacy PowerPoint "${fileName}" is not supported yet. Please save it as .pptx or PDF and try again.`,
        400
      )
    }

    if (!isTextLikeMimeType(mimeType) && !isInlineStudyMimeType(mimeType) && !isPptxMimeType(mimeType)) {
      throw new GeminiServiceError(
        `Unsupported file type for "${fileName}". Please use images, PDF, PPTX, TXT, CSV, JSON, or markdown files.`,
        400
      )
    }

    return {
      data,
      mimeType,
      fileName,
    }
  })
}

async function buildGeminiPartsForUpload(upload, index) {
  const fileHeader = {
    text: `Study material ${index + 1}: ${upload.fileName}`,
  }

  if (isTextLikeMimeType(upload.mimeType)) {
    const decodedText = Buffer.from(upload.data, 'base64')
      .toString('utf8')
      .replace(/\0/g, '')
      .trim()

    if (!decodedText) {
      throw new GeminiServiceError(`Unable to read text from "${upload.fileName}".`, 400)
    }

    return [
      fileHeader,
      {
        text: decodedText.slice(0, MAX_TEXT_FILE_CHARS),
      },
    ]
  }

  if (isPptxMimeType(upload.mimeType)) {
    const extractedText = await extractTextFromPptx(upload)

    return [
      fileHeader,
      {
        text: extractedText,
      },
    ]
  }

  return [
    fileHeader,
    {
      inlineData: {
        mimeType: upload.mimeType,
        data: upload.data,
      },
    },
  ]
}

function buildSourceLabel(sourceMode, uploads) {
  const fileNames = uploads.slice(0, 3).map((upload) => upload.fileName).join(', ')
  const suffix = uploads.length > 3 ? `, +${uploads.length - 3} more` : ''

  if (sourceMode === 'photos') {
    return `Study Photos (${uploads.length}): ${fileNames}${suffix}`
  }

  return `Study Files (${uploads.length}): ${fileNames}${suffix}`
}

async function generateSummaryFromStudyUploads({ uploads, sourceMode = 'files' }) {
  const safeUploads = normaliseUploads(uploads)
  const safeSourceMode = String(sourceMode || 'files').trim().toLowerCase()

  if (safeSourceMode === 'photos') {
    if (safeUploads.length > MAX_PHOTO_UPLOADS) {
      throw new GeminiServiceError(`You can upload a maximum of ${MAX_PHOTO_UPLOADS} photos at one time.`, 400)
    }

    if (safeUploads.some((upload) => !upload.mimeType.startsWith('image/'))) {
      throw new GeminiServiceError('Photo mode accepts image files only.', 400)
    }
  }

  const summaryPrompt = buildStudyMaterialSummaryPrompt({
    sourceMode: safeSourceMode,
    uploads: safeUploads,
  })

  const summaryParts = [{ text: summaryPrompt }]
  for (let index = 0; index < safeUploads.length; index += 1) {
    summaryParts.push(...(await buildGeminiPartsForUpload(safeUploads[index], index)))
  }

  const summary = await requestJsonFromGeminiParts(summaryParts)

  return {
    summary: sanitiseSummaryShape(summary),
    sourceLabel: buildSourceLabel(safeSourceMode, safeUploads),
  }
}

async function generateSummaryFromNotesImage({ imageData, mimeType, fileName }) {
  return generateSummaryFromStudyUploads({
    sourceMode: 'photos',
    uploads: [
      {
        data: imageData,
        mimeType,
        fileName,
      },
    ],
  })
}

module.exports = {
  generateSummaryFromStudyUploads,
  generateSummaryFromNotesImage,
}
