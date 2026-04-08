export const PROFILE_FEATURE_CONFIG = {
  summaries: {
    title: 'Saved Summaries',
    description: 'Review lessons that already have a saved summary.',
    countKey: 'totalSummaries',
    matches: (item) => Boolean(item?.result?.summary),
  },
  quizzes: {
    title: 'Saved Quizzes',
    description: 'Open lessons where quiz questions were generated.',
    countKey: 'totalQuizzes',
    matches: (item) => Boolean(item?.result?.quiz),
  },
  teaching: {
    title: 'Teaching Sessions',
    description: 'Open lessons that already have a teaching path.',
    countKey: 'totalTeachingSessions',
    matches: (item) => Boolean(item?.result?.teaching),
  },
  doubts: {
    title: 'Doubts Solved',
    description: 'Open lessons where a doubt answer was saved.',
    countKey: 'totalDoubts',
    matches: (item) => Boolean(item?.result?.doubt),
  },
}

export function getProfileFeatureConfig(featureKey) {
  return PROFILE_FEATURE_CONFIG[featureKey] || null
}
