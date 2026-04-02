export function normalizeSummaryPayload(result) {
  const summary = result?.summary

  if (summary && typeof summary === 'object') {
    return {
      title: summary.title || 'Video Summary',
      timeline: Array.isArray(summary.timeline) ? summary.timeline : [],
      paragraphs: summary.paragraphs || {},
    }
  }

  const fallbackText = result?.summary || result?.detailedSummary || result?.overview || ''

  return {
    title: 'Video Summary',
    timeline: [],
    paragraphs: {
      overview: fallbackText,
      coreIdeas: '',
      exploreMore: '',
    },
  }
}

export function questionNeedsFormulaSupport(question) {
  return /formula|numerical|calculate|solve|equation|find|derive|substitute|simplify|value of|how much|velocity|speed|force|energy|voltage|current|resistance|math|\d|=|\+|-|\*|\//i.test(
    String(question || '')
  )
}

export function hasStructuredDoubtContent(answer) {
  return Boolean(
    answer?.concept ||
      answer?.mainBody ||
      answer?.conclusion ||
      answer?.realLifeExample ||
      answer?.explanation ||
      answer?.keyTakeaway ||
      answer?.steps?.length ||
      answer?.numerical?.steps?.length ||
      answer?.numerical?.finalAnswer ||
      answer?.code?.snippet
  )
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = String(reader.result || '')
      const [, base64 = ''] = result.split(',')
      resolve(base64)
    }

    reader.onerror = () => {
      reject(new Error('Failed to read the selected image.'))
    }

    reader.readAsDataURL(file)
  })
}
