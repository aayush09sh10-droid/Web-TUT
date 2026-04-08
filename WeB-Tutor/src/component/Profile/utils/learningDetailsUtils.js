export function normalizeLearningSummary(result) {
  const summary = result?.summary

  if (summary && typeof summary === 'object') {
    return {
      title: summary.title || 'Saved Summary',
      timeline: Array.isArray(summary.timeline) ? summary.timeline : [],
      paragraphs: summary.paragraphs || {},
    }
  }

  return {
    title: 'Saved Summary',
    timeline: [],
    paragraphs: {
      overview: '',
      coreIdeas: '',
      exploreMore: '',
    },
  }
}

export function extractLearningTopics(item) {
  const topicSet = new Set()

  if (item?.result?.summary?.title) {
    topicSet.add(item.result.summary.title)
  }

  if (Array.isArray(item?.result?.summary?.timeline)) {
    item.result.summary.timeline.forEach((entry) => {
      if (entry?.label) {
        topicSet.add(entry.label)
      }
    })
  }

  if (Array.isArray(item?.result?.teaching?.topics)) {
    item.result.teaching.topics.forEach((topic) => {
      if (topic?.title) {
        topicSet.add(topic.title)
      }
    })
  }

  return Array.from(topicSet).filter(Boolean)
}

export function buildLearningHomeState(item) {
  const quizProgress = item?.result?.quizProgress
  const sourceType = item?.sourceType
  const inputMode =
    sourceType === 'study-photos' || sourceType === 'notes-image' || sourceType === 'notes-photo'
      ? 'photos'
      : sourceType === 'study-files'
        ? 'files'
        : sourceType === 'ask-ai'
          ? 'ask'
        : 'video'

  return {
    url: item?.sourceLabel || '',
    inputMode,
    result: item?.result,
    activeView: 'summary',
    selectedAnswers: quizProgress?.selectedAnswers || {},
    quizSubmitted: Boolean(quizProgress?.submittedAt),
    activeTopicId: item?.result?.teaching?.topics?.[0]?.id || '',
    showComposer: false,
    doubtQuestion: item?.result?.doubt?.question || '',
  }
}
