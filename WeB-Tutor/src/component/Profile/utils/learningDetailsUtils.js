export const HOME_STATE_STORAGE_KEY = 'yt-summarizer-home-state'

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

  return {
    url: item?.sourceLabel || '',
    inputMode: item?.sourceType === 'notes-photo' ? 'notes' : 'video',
    result: item?.result,
    activeView: 'summary',
    selectedAnswers: quizProgress?.selectedAnswers || {},
    quizSubmitted: Boolean(quizProgress?.submittedAt),
    activeTopicId: item?.result?.teaching?.topics?.[0]?.id || '',
    showComposer: false,
    doubtQuestion: item?.result?.doubt?.question || '',
  }
}
