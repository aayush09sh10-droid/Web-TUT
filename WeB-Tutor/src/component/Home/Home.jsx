import React, { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001'
const HOME_STATE_STORAGE_KEY = 'yt-summarizer-home-state'
const LIGHT_QUIZ_THEME = {
  primary: 'oklch(75% 0.204 54)',
  secondary: 'oklch(80% 0.186 80)',
  surface: 'oklch(92% 0.11 88)',
  accent: 'oklch(72% 0.217 24)',
  text: '#4a2313',
}
const DARK_QUIZ_THEME = {
  primary: 'oklch(58% 0.16 45)',
  secondary: 'oklch(42% 0.09 58)',
  surface: 'rgba(44, 28, 18, 0.92)',
  accent: 'oklch(72% 0.16 70)',
  text: '#f8e6d2',
  muted: '#d9bfa8',
  card: 'rgba(78, 49, 30, 0.55)',
  cardSoft: 'rgba(255, 238, 220, 0.08)',
  wrong: 'rgba(126, 44, 44, 0.55)',
}
const LIGHT_TEACHING_THEME = {
  primary: 'oklch(72% 0.167 244)',
  secondary: 'oklch(84% 0.118 214)',
  surface: 'oklch(95% 0.05 221)',
  accent: 'oklch(65% 0.19 278)',
  text: '#1d2957',
}
const DARK_TEACHING_THEME = {
  primary: 'oklch(60% 0.14 245)',
  secondary: 'oklch(40% 0.09 235)',
  surface: 'rgba(20, 28, 52, 0.94)',
  accent: 'oklch(70% 0.16 278)',
  text: '#e5edff',
  muted: '#aebeea',
  card: 'rgba(38, 51, 89, 0.62)',
  cardSoft: 'rgba(234, 241, 255, 0.08)',
}
const LIGHT_FORMULA_THEME = {
  primary: 'oklch(74% 0.18 145)',
  secondary: 'oklch(87% 0.11 120)',
  surface: 'oklch(95% 0.06 145)',
  accent: 'oklch(63% 0.16 155)',
  text: '#183d2e',
}
const DARK_FORMULA_THEME = {
  primary: 'oklch(61% 0.13 155)',
  secondary: 'oklch(42% 0.08 145)',
  surface: 'rgba(17, 44, 35, 0.94)',
  accent: 'oklch(72% 0.14 150)',
  text: '#e4fff2',
  muted: '#b9e9d1',
  card: 'rgba(37, 79, 63, 0.58)',
  cardSoft: 'rgba(231, 255, 243, 0.08)',
}
const LIGHT_DOUBT_THEME = {
  primary: 'oklch(70% 0.16 330)',
  secondary: 'oklch(86% 0.09 320)',
  surface: 'oklch(95% 0.05 340)',
  accent: 'oklch(62% 0.18 320)',
  text: '#4f1d4a',
}
const DARK_DOUBT_THEME = {
  primary: 'oklch(58% 0.13 320)',
  secondary: 'oklch(38% 0.08 305)',
  surface: 'rgba(48, 23, 52, 0.94)',
  accent: 'oklch(70% 0.16 320)',
  text: '#f7ddf5',
  muted: '#ddb8d8',
  card: 'rgba(95, 48, 99, 0.38)',
  cardSoft: 'rgba(255, 232, 252, 0.08)',
}

function normalizeSummaryPayload(result) {
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

function fileToBase64(file) {
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

function Home({ theme = 'light', authToken }) {
  const isDarkMode = theme === 'dark'
  const QUIZ_THEME = isDarkMode ? DARK_QUIZ_THEME : LIGHT_QUIZ_THEME
  const TEACHING_THEME = isDarkMode ? DARK_TEACHING_THEME : LIGHT_TEACHING_THEME
  const FORMULA_THEME = isDarkMode ? DARK_FORMULA_THEME : LIGHT_FORMULA_THEME
  const DOUBT_THEME = isDarkMode ? DARK_DOUBT_THEME : LIGHT_DOUBT_THEME
  const [inputMode, setInputMode] = useState('video')
  const [url, setUrl] = useState('')
  const [notesImage, setNotesImage] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [activeView, setActiveView] = useState('summary')
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizError, setQuizError] = useState('')
  const [teachingLoading, setTeachingLoading] = useState(false)
  const [teachingError, setTeachingError] = useState('')
  const [formulaLoading, setFormulaLoading] = useState(false)
  const [formulaError, setFormulaError] = useState('')
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [activeTopicId, setActiveTopicId] = useState('')
  const [activeFormulaSectionId, setActiveFormulaSectionId] = useState('')
  const [activeFormulaPanel, setActiveFormulaPanel] = useState('explanation')
  const [showComposer, setShowComposer] = useState(true)
  const [hasHydratedHomeState, setHasHydratedHomeState] = useState(false)
  const [doubtQuestion, setDoubtQuestion] = useState('')
  const [doubtLoading, setDoubtLoading] = useState(false)
  const [doubtError, setDoubtError] = useState('')

  useEffect(() => {
    const stored = window.localStorage.getItem(HOME_STATE_STORAGE_KEY)
    if (!stored) return

    try {
      const parsed = JSON.parse(stored)
      if (typeof parsed?.url === 'string') {
        setUrl(parsed.url)
      }
      if (parsed?.inputMode === 'video' || parsed?.inputMode === 'notes') {
        setInputMode(parsed.inputMode)
      }
      if (parsed?.result) {
        setResult(parsed.result)
      }
      if (
        parsed?.activeView === 'summary' ||
        parsed?.activeView === 'quiz' ||
        parsed?.activeView === 'teaching' ||
        parsed?.activeView === 'formula' ||
        parsed?.activeView === 'doubt'
      ) {
        setActiveView(parsed.activeView)
      }
      if (parsed?.selectedAnswers && typeof parsed.selectedAnswers === 'object') {
        setSelectedAnswers(parsed.selectedAnswers)
      }
      if (typeof parsed?.quizSubmitted === 'boolean') {
        setQuizSubmitted(parsed.quizSubmitted)
      }
      if (typeof parsed?.activeTopicId === 'string') {
        setActiveTopicId(parsed.activeTopicId)
      }
      if (typeof parsed?.activeFormulaSectionId === 'string') {
        setActiveFormulaSectionId(parsed.activeFormulaSectionId)
      }
      if (parsed?.activeFormulaPanel === 'explanation' || parsed?.activeFormulaPanel === 'practice') {
        setActiveFormulaPanel(parsed.activeFormulaPanel)
      }
      if (typeof parsed?.showComposer === 'boolean') {
        setShowComposer(parsed.showComposer)
      }
      if (typeof parsed?.doubtQuestion === 'string') {
        setDoubtQuestion(parsed.doubtQuestion)
      }
    } catch {
      // ignore malformed stored value
    }

    setHasHydratedHomeState(true)
  }, [])

  useEffect(() => {
    if (!hasHydratedHomeState) return

    const nextState = {
      url,
      inputMode,
      result,
      activeView,
      selectedAnswers,
      quizSubmitted,
      activeTopicId,
      activeFormulaSectionId,
      activeFormulaPanel,
      showComposer,
      doubtQuestion,
    }

    window.localStorage.setItem(HOME_STATE_STORAGE_KEY, JSON.stringify(nextState))
  }, [
    url,
    inputMode,
    result,
    activeView,
    selectedAnswers,
    quizSubmitted,
    activeTopicId,
    activeFormulaSectionId,
    activeFormulaPanel,
    showComposer,
    doubtQuestion,
    hasHydratedHomeState,
  ])

  function saveHistory(items) {
    setHistory(items)
  }

  function addToHistory(item) {
    const deduped = [item, ...history.filter((h) => h.url !== item.url)]
    saveHistory(deduped.slice(0, 12))
  }

  function getAuthHeaders() {
    return authToken
      ? {
          Authorization: `Bearer ${authToken}`,
        }
      : {}
  }

  function getCurrentSourceLabel(nextResult = result) {
    if (nextResult?.sourceLabel) return nextResult.sourceLabel
    if (url.trim()) return url.trim()
    if (notesImage?.fileName) return `Notes Photo: ${notesImage.fileName}`
    return ''
  }

  function updateHistoryResult(nextResult) {
    const currentSourceLabel = getCurrentSourceLabel()
    if (!currentSourceLabel) return

    const updatedHistory = history.map((item) =>
      item.result?.historyId === nextResult?.historyId || item.url === currentSourceLabel
        ? {
            ...item,
            url: getCurrentSourceLabel(nextResult) || item.url,
            result: nextResult,
            timestamp: Date.now(),
          }
        : item
    )

    saveHistory(updatedHistory)
  }

  useEffect(() => {
    if (!authToken) return

    const controller = new AbortController()

    async function loadHistory() {
      try {
        const res = await fetch(`${API_BASE}/api/history`, {
          headers: getAuthHeaders(),
          signal: controller.signal,
        })

        const payload = await res.json()
        if (!res.ok) {
          throw new Error(payload?.error || 'Failed to load history.')
        }

        setHistory(Array.isArray(payload.history) ? payload.history : [])
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('History load error:', err)
        }
      }
    }

    loadHistory()

    return () => controller.abort()
  }, [authToken])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setQuizError('')
    setTeachingError('')
    setFormulaError('')
    setDoubtError('')

    setLoading(true)
    try {
      let res

      if (inputMode === 'video') {
        if (!url.trim()) {
          setError('Please paste a valid YouTube video URL.')
          setLoading(false)
          return
        }

        res = await fetch(`${API_BASE}/api/summarize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ url: url.trim() }),
        })
      } else {
        if (!notesImage?.imageData) {
          setError('Please upload a notes photo first.')
          setLoading(false)
          return
        }

        res = await fetch(`${API_BASE}/api/summarize-notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(notesImage),
        })
      }

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to summarize.')
      }

      setResult(payload)
      setError('')
      setQuizError('')
      setTeachingError('')
      setFormulaError('')
      setDoubtError('')
      setActiveView('summary')
      setSelectedAnswers({})
      setQuizSubmitted(false)
      setActiveTopicId('')
      setActiveFormulaSectionId('')
      setActiveFormulaPanel('explanation')
      setShowComposer(false)

      addToHistory({
        url: payload.sourceLabel || url.trim(),
        result: payload,
        timestamp: Date.now(),
      })
    } catch (err) {
      setError(err.message || 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  function handleStartNewSummary() {
    setUrl('')
    setNotesImage(null)
    setError('')
    setFormulaError('')
    setActiveFormulaSectionId('')
    setActiveFormulaPanel('explanation')
    setShowComposer(true)
  }

  async function handleNotesFileChange(e) {
    const file = e.target.files?.[0]

    if (!file) {
      setNotesImage(null)
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file for your notes.')
      setNotesImage(null)
      return
    }

    setError('')

    try {
      const imageData = await fileToBase64(file)
      setNotesImage({
        imageData,
        mimeType: file.type,
        fileName: file.name,
      })
    } catch (err) {
      setError(err.message || 'Failed to read the selected image.')
      setNotesImage(null)
    }
  }

  async function handleAskDoubt() {
    if (!result?.summary) return
    setActiveView('doubt')
  }

  async function handleSubmitDoubt(e) {
    e.preventDefault()

    if (!result?.summary) return
    if (!doubtQuestion.trim()) {
      setDoubtError('Please type your doubt first.')
      return
    }

    setDoubtError('')
    setDoubtLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/doubt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          summary: result.summary,
          question: doubtQuestion.trim(),
          historyId: result.historyId,
        }),
      })

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to answer the doubt.')
      }

      const nextResult = {
        ...result,
        doubt: {
          question: doubtQuestion.trim(),
          answer: payload.answer,
        },
      }

      setResult(nextResult)
      updateHistoryResult(nextResult)
    } catch (err) {
      setDoubtError(err.message || 'Unexpected error')
    } finally {
      setDoubtLoading(false)
    }
  }

  async function handleGenerateQuiz() {
    if (!result?.summary) return

    setActiveView('quiz')
    setQuizError('')

    if (result.quiz) {
      return
    }

    setSelectedAnswers({})
    setQuizSubmitted(false)
    setQuizLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ summary: result.summary, historyId: result.historyId }),
      })

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to generate quiz.')
      }

      const nextResult = {
        ...result,
        quiz: payload.quiz,
      }

      setResult(nextResult)
      updateHistoryResult(nextResult)
    } catch (err) {
      setQuizError(err.message || 'Unexpected error')
    } finally {
      setQuizLoading(false)
    }
  }

  async function handleGenerateTeaching() {
    if (!result?.summary) return

    setActiveView('teaching')
    setTeachingError('')

    if (result.teaching?.topics?.length) {
      if (!activeTopicId) {
        setActiveTopicId(result.teaching.topics[0].id)
      }
      return
    }

    setTeachingLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/teaching`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ summary: result.summary, historyId: result.historyId }),
      })

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to generate teaching content.')
      }

      const nextResult = {
        ...result,
        teaching: payload.teaching,
      }

      setResult(nextResult)
      setActiveTopicId(payload.teaching?.topics?.[0]?.id || '')
      updateHistoryResult(nextResult)
    } catch (err) {
      setTeachingError(err.message || 'Unexpected error')
    } finally {
      setTeachingLoading(false)
    }
  }

  async function handleGenerateFormula() {
    if (!result?.summary) return

    setActiveView('formula')
    setFormulaError('')

    if (result.formula?.sections?.length) {
      if (!activeFormulaSectionId) {
        setActiveFormulaSectionId(result.formula.sections[0].id)
      }
      return
    }

    setFormulaLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/formula`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ summary: result.summary, historyId: result.historyId }),
      })

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to generate formula guide.')
      }

      const nextResult = {
        ...result,
        formula: payload.formula,
      }

      setResult(nextResult)
      setActiveFormulaSectionId(payload.formula?.sections?.[0]?.id || '')
      setActiveFormulaPanel('explanation')
      updateHistoryResult(nextResult)
    } catch (err) {
      setFormulaError(err.message || 'Unexpected error')
    } finally {
      setFormulaLoading(false)
    }
  }

  function handleSelectAnswer(questionId, optionIndex) {
    if (quizSubmitted) return

    setSelectedAnswers((current) => ({
      ...current,
      [questionId]: optionIndex,
    }))
  }

  function handleSubmitQuiz() {
    if (!quiz?.questions?.length) return
    setQuizSubmitted(true)

    if (result?.historyId && authToken) {
      const nextWrongQuestions = quiz.questions
        .filter((question) => selectedAnswers[question.id] !== question.answerIndex)
        .map((question) => question.question)

      fetch(`${API_BASE}/api/history/${result.historyId}/quiz-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          correctCount,
          totalQuestions,
          scorePercent,
          selectedAnswers,
          wrongQuestions: nextWrongQuestions,
        }),
      })
        .then((res) => res.json().then((payload) => ({ ok: res.ok, payload })))
        .then(({ ok, payload }) => {
          if (!ok) {
            throw new Error(payload?.error || 'Failed to save quiz progress.')
          }

          const nextResult = {
            ...result,
            quizProgress: payload.item?.result?.quizProgress || {
              correctCount,
              totalQuestions,
              scorePercent,
              selectedAnswers,
              wrongQuestions: nextWrongQuestions,
            },
          }

          setResult(nextResult)
          updateHistoryResult(nextResult)
        })
        .catch((err) => {
          console.error('Quiz progress save error:', err)
        })
    }
  }

  function handleRetryQuiz() {
    setQuizSubmitted(false)
    setSelectedAnswers({})
  }

  const showResult = Boolean(result)
  const normalizedSummary = normalizeSummaryPayload(result)
  const summaryParagraphs = [
    normalizedSummary.paragraphs.overview,
    normalizedSummary.paragraphs.coreIdeas,
    normalizedSummary.paragraphs.exploreMore,
  ].filter(Boolean)
  const quiz = result?.quiz
  const teaching = result?.teaching
  const formula = result?.formula
  const doubt = result?.doubt
  const isQuizView = activeView === 'quiz'
  const isTeachingView = activeView === 'teaching'
  const isFormulaView = activeView === 'formula'
  const isDoubtView = activeView === 'doubt'
  const answeredCount = quiz?.questions?.filter((question) => selectedAnswers[question.id] !== undefined).length || 0
  const totalQuestions = quiz?.questions?.length || 0
  const correctCount = quiz?.questions?.reduce((count, question) => {
    return count + (selectedAnswers[question.id] === question.answerIndex ? 1 : 0)
  }, 0) || 0
  const scorePercent = totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0
  const quizPanelStyle = isQuizView
    ? {
        backgroundColor: QUIZ_THEME.surface,
        borderColor: QUIZ_THEME.primary,
      }
    : undefined
  const teachingPanelStyle = isTeachingView
    ? {
        backgroundColor: TEACHING_THEME.surface,
        borderColor: TEACHING_THEME.primary,
      }
    : undefined
  const formulaPanelStyle = isFormulaView
    ? {
        backgroundColor: FORMULA_THEME.surface,
        borderColor: FORMULA_THEME.primary,
      }
    : undefined
  const doubtPanelStyle = isDoubtView
    ? {
        backgroundColor: DOUBT_THEME.surface,
        borderColor: DOUBT_THEME.primary,
      }
    : undefined
  const activeTopic =
    teaching?.topics?.find((topic) => topic.id === activeTopicId) || teaching?.topics?.[0] || null
  const activeFormulaSection =
    formula?.sections?.find((section) => section.id === activeFormulaSectionId) ||
    formula?.sections?.[0] ||
    null

  let teacherRating = ''
  let teacherGuidance = ''

  if (quizSubmitted) {
    if (scorePercent >= 90) {
      teacherRating = 'Excellent work'
      teacherGuidance = 'You understood the topic very well. Keep this momentum by explaining the ideas in your own words once more.'
    } else if (scorePercent >= 70) {
      teacherRating = 'Good progress'
      teacherGuidance = 'You have a solid grasp of the topic. Review the missed questions and focus on the small details that connect the main ideas.'
    } else if (scorePercent >= 40) {
      teacherRating = 'Fair attempt'
      teacherGuidance = 'You caught some important points, but the topic needs one more careful revision. Re-read the summary and compare it with the quiz feedback.'
    } else {
      teacherRating = 'Needs more practice'
      teacherGuidance = 'This topic is still developing for you, and that is completely okay. Start with the teaching section below, then try the quiz again slowly.'
    }
  }

  return (
    <main className="min-h-140 text-[var(--text)]">
      <section className="flex flex-1 flex-col overflow-hidden">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-3 pb-10 pt-6 sm:px-4 sm:pb-12 sm:pt-8">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Summarize a video or notes photo</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
              Paste a YouTube link or upload study notes and turn them into a colorful study flow with summaries, quizzes, formula help, and guided teaching.
            </p>
          </div>

          {showComposer && (
            <form
              className="mt-5 rounded-[1.75rem] border border-[var(--border)] bg-[color:rgba(255,255,255,0.52)] p-3 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:mt-6 sm:p-4 dark:bg-[color:rgba(17,17,17,0.82)]"
              onSubmit={handleSubmit}
            >
              <div className="mb-3 grid gap-2 sm:inline-flex sm:grid-cols-none">
                <button
                  type="button"
                  onClick={() => setInputMode('video')}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    inputMode === 'video'
                      ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)]'
                      : 'border-[var(--border)] bg-[var(--card)] text-[var(--text)]'
                  }`}
                >
                  YouTube Link
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('notes')}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    inputMode === 'notes'
                      ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)]'
                      : 'border-[var(--border)] bg-[var(--card)] text-[var(--text)]'
                  }`}
                >
                  Notes Photo
                </button>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                {inputMode === 'video' ? (
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="flex-1 rounded-[1.1rem] border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm text-[var(--text)] shadow-sm focus:border-[var(--accent-2)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(99,102,241,0.12)]"
                  />
                ) : (
                  <label className="flex flex-1 cursor-pointer flex-col justify-center rounded-[1.1rem] border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm text-[var(--text)] shadow-sm">
                    <span className="font-medium">Upload notes photo</span>
                    <span className="mt-1 text-xs text-[var(--muted)]">
                      {notesImage?.fileName || 'Choose a clear image of your handwritten or typed notes.'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleNotesFileChange}
                      className="mt-3 text-xs text-[var(--muted)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--text)] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[var(--bg)]"
                    />
                  </label>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-[1.1rem] px-6 py-3 text-sm font-semibold text-[var(--text)] shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}
                >
                  {loading ? 'Summarizing...' : inputMode === 'video' ? 'Summarize Video' : 'Summarize Notes'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowComposer(false)}
                  className="inline-flex h-[48px] w-full items-center justify-center rounded-[1.1rem] border border-[var(--border)] bg-[var(--card-strong)] text-base font-semibold text-[var(--text)] shadow-sm transition hover:scale-105 sm:w-[48px]"
                  aria-label="Close paste link box"
                >
                  ×
                </button>
              </div>

              {error && (
                <div className="mt-3">
                  <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
                    {error}
                  </p>
                </div>
              )}
            </form>
          )}

          <div className="mt-5 flex flex-1 flex-col gap-4 sm:mt-6">
            <div className="flex flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] backdrop-blur-xl">
              <div className="flex flex-1 flex-col gap-4 overflow-auto p-4 pb-16 sm:p-6 sm:pb-24">
                {showResult ? (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:flex sm:flex-wrap">
                      <button
                        type="button"
                        onClick={() => setActiveView('summary')}
                        className={`w-full rounded-full border px-4 py-2 text-sm font-semibold transition sm:w-auto ${
                          activeView === 'summary'
                            ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)]'
                            : 'border-[var(--border)] bg-[var(--card)] text-[var(--text)]'
                        }`}
                      >
                        Summary
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateQuiz}
                        disabled={quizLoading}
                        className="w-full rounded-full border px-5 py-2.5 text-sm font-semibold shadow-[0_8px_24px_rgba(255,153,0,0.22)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                        style={{
                          background: `linear-gradient(135deg, ${QUIZ_THEME.primary}, ${QUIZ_THEME.secondary})`,
                          borderColor: QUIZ_THEME.accent,
                          color: QUIZ_THEME.text,
                        }}
                      >
                        {quizLoading ? 'Generating Quiz...' : 'Generate Quiz'}
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateTeaching}
                        disabled={teachingLoading}
                        className="w-full rounded-full border px-5 py-2.5 text-sm font-semibold shadow-[0_10px_26px_rgba(96,112,255,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                        style={{
                          background: `linear-gradient(135deg, ${TEACHING_THEME.primary}, ${TEACHING_THEME.secondary})`,
                          borderColor: TEACHING_THEME.accent,
                          color: TEACHING_THEME.text,
                        }}
                      >
                        {teachingLoading ? 'Generating Teaching...' : 'Teaching'}
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateFormula}
                        disabled={formulaLoading}
                        className="w-full rounded-full border px-5 py-2.5 text-sm font-semibold shadow-[0_10px_26px_rgba(58,168,118,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                        style={{
                          background: `linear-gradient(135deg, ${FORMULA_THEME.primary}, ${FORMULA_THEME.secondary})`,
                          borderColor: FORMULA_THEME.accent,
                          color: FORMULA_THEME.text,
                        }}
                      >
                        {formulaLoading ? 'Generating Formula...' : 'Formula Lab'}
                      </button>
                      <button
                        type="button"
                        onClick={handleAskDoubt}
                        className="w-full rounded-full border px-5 py-2.5 text-sm font-semibold shadow-[0_10px_26px_rgba(173,78,167,0.18)] transition hover:-translate-y-0.5 sm:w-auto"
                        style={{
                          background: `linear-gradient(135deg, ${DOUBT_THEME.primary}, ${DOUBT_THEME.secondary})`,
                          borderColor: DOUBT_THEME.accent,
                          color: DOUBT_THEME.text,
                        }}
                      >
                        Ask Doubt
                      </button>
                      <button
                        type="button"
                        onClick={handleStartNewSummary}
                        className="w-full rounded-full border px-5 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 sm:w-auto"
                        style={{
                          background: 'rgba(255,255,255,0.7)',
                          borderColor: 'var(--border)',
                          color: 'var(--text)',
                        }}
                      >
                        New Summary
                      </button>
                    </div>

                    <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--card-strong)] p-4 shadow-sm">
                      <h3 className="text-lg font-semibold text-[var(--text)]">
                        {normalizedSummary.title}
                      </h3>
                    </div>

                    {activeView === 'summary' ? (
                      <>
                        {normalizedSummary.timeline.length > 0 && (
                          <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--card-strong)] p-4 shadow-sm">
                            <h3 className="text-lg font-semibold text-[var(--text)]">Timeline</h3>
                            <div className="mt-3 space-y-2">
                              {normalizedSummary.timeline.map((item, index) => (
                                <div
                                  key={`${item.timestamp}-${index}`}
                                  className="flex gap-3 text-sm text-[var(--text)]"
                                >
                                  <span className="min-w-16 font-semibold">{item.timestamp}</span>
                                  <span>{item.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--card-strong)] p-4 shadow-sm">
                          <h3 className="text-lg font-semibold text-[var(--text)]">Summary</h3>
                          <div className="mt-3 space-y-3">
                            {summaryParagraphs.length > 0 ? (
                              summaryParagraphs.map((paragraph, index) => (
                                <p
                                  key={index}
                                  className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text)]"
                                >
                                  {paragraph}
                                </p>
                              ))
                            ) : (
                              <p className="text-sm leading-relaxed text-[var(--text)]">
                                No summary was returned by the model.
                              </p>
                            )}
                          </div>
                        </div>
                      </>
                    ) : activeView === 'quiz' ? (
                      <div
                        className="rounded-[1.5rem] border p-5 shadow-[0_18px_40px_rgba(255,153,0,0.14)]"
                        style={{
                          ...quizPanelStyle,
                          color: QUIZ_THEME.text,
                          backgroundImage: isDarkMode
                            ? `radial-gradient(circle at top left, rgba(255,208,160,0.14), transparent 30%), linear-gradient(135deg, ${QUIZ_THEME.surface}, rgba(62,34,22,0.98))`
                            : `radial-gradient(circle at top left, rgba(255,255,255,0.78), transparent 34%), linear-gradient(135deg, ${QUIZ_THEME.surface}, #fff3cf)`,
                        }}
                      >
                        <h3 className="text-lg font-semibold">
                          {quiz?.title || 'Playful Knowledge Check'}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed" style={{ color: isDarkMode ? QUIZ_THEME.muted : '#7a3b12' }}>
                          Test your understanding with AI-generated questions based on the same video summary.
                        </p>

                        {quizError && (
                          <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
                            {quizError}
                          </p>
                        )}

                        {!quizLoading && !quiz && !quizError && (
                          <p className="mt-4 text-sm leading-relaxed">
                            Click the button above to generate the quiz.
                          </p>
                        )}

                        {quizLoading && (
                          <p className="mt-4 text-sm font-medium">Generating your quiz...</p>
                        )}

                        {quiz?.questions?.length > 0 && (
                          <div className="mt-5 space-y-4">
                            {quiz.questions.map((question, index) => (
                              <div
                                key={question.id}
                                className="rounded-[1.25rem] border px-4 py-4"
                                style={{
                                  background: isDarkMode ? QUIZ_THEME.card : 'rgba(255, 255, 255, 0.58)',
                                  borderColor: QUIZ_THEME.secondary,
                                }}
                              >
                                <h4 className="text-base font-semibold">
                                  {index + 1}. {question.question}
                                </h4>
                                <div className="mt-3 space-y-2">
                                  {question.options.map((option, optionIndex) => (
                                    <button
                                      type="button"
                                      key={`${question.id}-${optionIndex}`}
                                      onClick={() => handleSelectAnswer(question.id, optionIndex)}
                                      className="block w-full rounded-xl border px-3 py-2 text-left text-sm shadow-sm transition"
                                      style={{
                                        backgroundColor:
                                          quizSubmitted
                                            ? optionIndex === question.answerIndex
                                              ? QUIZ_THEME.primary
                                              : selectedAnswers[question.id] === optionIndex
                                                ? isDarkMode
                                                  ? QUIZ_THEME.wrong
                                                  : '#ffd7d1'
                                                : isDarkMode
                                                  ? QUIZ_THEME.cardSoft
                                                  : 'rgba(255, 255, 255, 0.78)'
                                            : selectedAnswers[question.id] === optionIndex
                                              ? isDarkMode
                                                ? 'rgba(255, 196, 124, 0.22)'
                                                : '#ffe9b8'
                                              : isDarkMode
                                                ? QUIZ_THEME.cardSoft
                                                : 'rgba(255, 255, 255, 0.78)',
                                        borderColor:
                                          quizSubmitted
                                            ? optionIndex === question.answerIndex
                                              ? QUIZ_THEME.accent
                                              : selectedAnswers[question.id] === optionIndex
                                                ? '#d9644a'
                                                : 'rgba(122, 59, 18, 0.15)'
                                            : selectedAnswers[question.id] === optionIndex
                                              ? QUIZ_THEME.accent
                                              : 'rgba(122, 59, 18, 0.15)',
                                      }}
                                    >
                                      {option}
                                    </button>
                                  ))}
                                </div>
                                {quizSubmitted && question.explanation && (
                                  <p className="mt-3 text-sm leading-relaxed" style={{ color: isDarkMode ? QUIZ_THEME.muted : '#7a3b12' }}>
                                    {selectedAnswers[question.id] === question.answerIndex
                                      ? `Correct. ${question.explanation}`
                                      : `Teacher's note: ${question.explanation}`}
                                  </p>
                                )}
                              </div>
                            ))}

                            <div className="flex flex-wrap gap-3 pt-2">
                              {!quizSubmitted ? (
                                <button
                                  type="button"
                                  onClick={handleSubmitQuiz}
                                  disabled={answeredCount !== totalQuestions}
                                  className="rounded-full border px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
                                  style={{
                                    background: `linear-gradient(135deg, ${QUIZ_THEME.primary}, ${QUIZ_THEME.secondary})`,
                                    borderColor: QUIZ_THEME.accent,
                                    color: QUIZ_THEME.text,
                                  }}
                                >
                                  {answeredCount === totalQuestions
                                    ? 'Submit Answers'
                                    : `Answer ${totalQuestions - answeredCount} More`}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={handleRetryQuiz}
                                  className="rounded-full border px-5 py-2.5 text-sm font-semibold transition"
                                  style={{
                                    backgroundColor: isDarkMode ? QUIZ_THEME.cardSoft : 'rgba(255,255,255,0.65)',
                                    borderColor: QUIZ_THEME.accent,
                                    color: QUIZ_THEME.text,
                                  }}
                                >
                                  Try Again
                                </button>
                              )}
                            </div>

                            {quizSubmitted && (
                              <div
                                className="rounded-[1.25rem] border px-4 py-4"
                                style={{
                                  background: isDarkMode ? QUIZ_THEME.card : 'rgba(255,255,255,0.6)',
                                  borderColor: QUIZ_THEME.accent,
                                }}
                              >
                                <h4 className="text-base font-semibold">
                                  Teacher Feedback: {teacherRating}
                                </h4>
                                <p className="mt-2 text-sm leading-relaxed">
                                  You scored {correctCount} out of {totalQuestions} ({scorePercent}%).
                                </p>
                                <p className="mt-2 text-sm leading-relaxed" style={{ color: isDarkMode ? QUIZ_THEME.muted : '#7a3b12' }}>
                                  {teacherGuidance}
                                </p>
                              </div>
                            )}

                            {quiz?.teaching && (
                              <div
                                className="rounded-[1.25rem] border px-4 py-4"
                                style={{
                                  background: isDarkMode ? QUIZ_THEME.card : 'rgba(255,255,255,0.6)',
                                  borderColor: QUIZ_THEME.secondary,
                                }}
                              >
                                <h4 className="text-base font-semibold">
                                  Teaching Corner: {quiz.teaching.topic || 'Topic Review'}
                                </h4>
                                {quiz.teaching.explanation && (
                                  <p className="mt-2 text-sm leading-relaxed" style={{ color: isDarkMode ? QUIZ_THEME.muted : '#7a3b12' }}>
                                    {quiz.teaching.explanation}
                                  </p>
                                )}
                                {Array.isArray(quiz.teaching.keyTakeaways) &&
                                  quiz.teaching.keyTakeaways.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                      {quiz.teaching.keyTakeaways.map((item, index) => (
                                        <div
                                          key={`${item}-${index}`}
                                          className="rounded-xl border px-3 py-2 text-sm"
                                          style={{
                                            background: isDarkMode ? QUIZ_THEME.cardSoft : 'rgba(255,255,255,0.78)',
                                            borderColor: 'rgba(122, 59, 18, 0.15)',
                                          }}
                                        >
                                          {item}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                {quiz.teaching.studyTip && (
                                  <p className="mt-3 text-sm font-medium leading-relaxed">
                                    Study tip: {quiz.teaching.studyTip}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : activeView === 'teaching' ? (
                      <div
                        className="rounded-[1.75rem] border p-4 shadow-[0_20px_48px_rgba(96,112,255,0.14)] sm:p-5"
                        style={{
                          ...teachingPanelStyle,
                          color: TEACHING_THEME.text,
                          backgroundImage: isDarkMode
                            ? `radial-gradient(circle at top right, rgba(166,196,255,0.14), transparent 28%), linear-gradient(135deg, ${TEACHING_THEME.surface}, rgba(18,24,44,0.98))`
                            : `radial-gradient(circle at top right, rgba(255,255,255,0.82), transparent 28%), linear-gradient(135deg, ${TEACHING_THEME.surface}, #eef5ff)`,
                        }}
                      >
                        <h3 className="text-lg font-semibold sm:text-xl">
                          {teaching?.title || 'Interactive Teaching Studio'}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed" style={{ color: isDarkMode ? TEACHING_THEME.muted : '#41558c' }}>
                          Learn topic by topic with guided lessons. Pick a part below and read the lesson in a clean, note-friendly format.
                        </p>

                        {teachingError && (
                          <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
                            {teachingError}
                          </p>
                        )}

                        {!teachingLoading && !teaching && !teachingError && (
                          <p className="mt-4 text-sm leading-relaxed">
                            Click the teaching button above to divide the summary into topics and start the lesson flow.
                          </p>
                        )}

                        {teachingLoading && (
                          <p className="mt-4 text-sm font-medium">Preparing your teaching path...</p>
                        )}

                        {teaching?.intro && (
                          <div
                            className="mt-5 rounded-[1.25rem] border px-4 py-4"
                            style={{
                              background: isDarkMode ? TEACHING_THEME.card : 'rgba(255,255,255,0.66)',
                              borderColor: TEACHING_THEME.secondary,
                            }}
                          >
                            <p className="text-sm leading-relaxed" style={{ color: isDarkMode ? TEACHING_THEME.muted : '#41558c' }}>
                              {teaching.intro}
                            </p>
                          </div>
                        )}

                        {teaching?.topics?.length > 0 && (
                          <div className="mt-5 grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
                            <div className="space-y-3">
                              {teaching.topics.map((topic, index) => (
                                <button
                                  key={topic.id}
                                  type="button"
                                  onClick={() => setActiveTopicId(topic.id)}
                                  className="block w-full rounded-[1.15rem] border px-4 py-3 text-left text-sm font-semibold transition"
                                  style={{
                                    background:
                                      activeTopic?.id === topic.id
                                        ? `linear-gradient(135deg, ${TEACHING_THEME.primary}, ${TEACHING_THEME.secondary})`
                                        : isDarkMode
                                          ? TEACHING_THEME.cardSoft
                                          : 'rgba(255,255,255,0.72)',
                                    borderColor:
                                      activeTopic?.id === topic.id
                                        ? TEACHING_THEME.accent
                                        : 'rgba(29, 41, 87, 0.12)',
                                    color:
                                      activeTopic?.id === topic.id
                                        ? TEACHING_THEME.text
                                        : isDarkMode
                                          ? '#dbe5ff'
                                          : '#2e4274',
                                  }}
                                >
                                  Part {index + 1}: {topic.title}
                                </button>
                              ))}
                            </div>

                            {activeTopic && (
                              <div
                                className="rounded-[1.5rem] border px-4 py-4 sm:px-5 sm:py-5"
                                style={{
                                  background: isDarkMode ? TEACHING_THEME.card : 'rgba(255,255,255,0.74)',
                                  borderColor: TEACHING_THEME.secondary,
                                }}
                              >
                                <h4 className="text-lg font-semibold">
                                  {activeTopic.title}
                                </h4>
                                {activeTopic.summary && (
                                  <p className="mt-2 rounded-xl border px-3 py-3 text-sm leading-relaxed" style={{
                                    background: isDarkMode ? TEACHING_THEME.cardSoft : 'rgba(238,245,255,0.9)',
                                    borderColor: 'rgba(29, 41, 87, 0.1)',
                                    color: isDarkMode ? TEACHING_THEME.muted : '#41558c',
                                  }}>
                                    {activeTopic.summary}
                                  </p>
                                )}
                                <div className="mt-4 rounded-[1.2rem] border px-4 py-4" style={{
                                  background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.92)',
                                  borderColor: 'rgba(29, 41, 87, 0.1)',
                                }}>
                                  <h5 className="text-sm font-semibold uppercase tracking-[0.12em]" style={{ color: isDarkMode ? '#9fb3e8' : '#5b6ea5' }}>
                                    Lesson
                                  </h5>
                                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 sm:leading-7" style={{ color: isDarkMode ? TEACHING_THEME.text : '#233567' }}>
                                    {activeTopic.lesson}
                                  </p>
                                </div>

                                {Array.isArray(activeTopic.notes) && activeTopic.notes.length > 0 && (
                                  <div className="mt-4">
                                    <h5 className="text-sm font-semibold uppercase tracking-[0.12em]" style={{ color: isDarkMode ? '#9fb3e8' : '#5b6ea5' }}>
                                      Notes
                                    </h5>
                                    <div className="mt-3 space-y-2">
                                      {activeTopic.notes.map((note, index) => (
                                        <div
                                          key={`${note}-${index}`}
                                          className="rounded-xl border px-3 py-3 text-sm"
                                          style={{
                                            background: isDarkMode ? TEACHING_THEME.cardSoft : 'rgba(245,248,255,0.95)',
                                            borderColor: 'rgba(29, 41, 87, 0.1)',
                                            color: isDarkMode ? TEACHING_THEME.text : '#2b3f74',
                                          }}
                                        >
                                          {note}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {activeTopic.reflectionQuestion && (
                                  <div
                                    className="mt-4 rounded-[1.2rem] border px-4 py-4"
                                    style={{
                                      background: isDarkMode
                                        ? 'linear-gradient(135deg, rgba(91,116,189,0.24), rgba(255,255,255,0.03))'
                                        : 'linear-gradient(135deg, rgba(204,221,255,0.5), rgba(255,255,255,0.9))',
                                      borderColor: TEACHING_THEME.accent,
                                    }}
                                  >
                                    <h5 className="text-sm font-semibold uppercase tracking-[0.12em]" style={{ color: isDarkMode ? '#9fb3e8' : '#5b6ea5' }}>
                                      Reflect
                                    </h5>
                                    <p className="mt-2 text-sm leading-relaxed" style={{ color: isDarkMode ? TEACHING_THEME.text : '#233567' }}>
                                      {activeTopic.reflectionQuestion}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : activeView === 'formula' ? (
                      <div
                        className="rounded-[1.75rem] border p-4 shadow-[0_20px_48px_rgba(58,168,118,0.16)] sm:p-5"
                        style={{
                          ...formulaPanelStyle,
                          color: FORMULA_THEME.text,
                          backgroundImage: isDarkMode
                            ? `radial-gradient(circle at top left, rgba(182,255,224,0.1), transparent 28%), linear-gradient(135deg, ${FORMULA_THEME.surface}, rgba(14,35,29,0.98))`
                            : `radial-gradient(circle at top left, rgba(255,255,255,0.82), transparent 28%), linear-gradient(135deg, ${FORMULA_THEME.surface}, #effff5)`,
                        }}
                      >
                        <h3 className="text-lg font-semibold sm:text-xl">
                          {formula?.title || 'Formula Lab'}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed" style={{ color: isDarkMode ? FORMULA_THEME.muted : '#35634f' }}>
                          Explore important formulas part by part. Open one section, then switch between explanation and practice to apply the idea properly.
                        </p>

                        {formulaError && (
                          <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
                            {formulaError}
                          </p>
                        )}

                        {!formulaLoading && !formula && !formulaError && (
                          <p className="mt-4 text-sm leading-relaxed">
                            Click the formula button above to generate formula explanations and practice tasks.
                          </p>
                        )}

                        {formulaLoading && (
                          <p className="mt-4 text-sm font-medium">Preparing your formula guide...</p>
                        )}

                        {formula?.intro && (
                          <div
                            className="mt-5 rounded-[1.25rem] border px-4 py-4"
                            style={{
                              background: isDarkMode ? FORMULA_THEME.card : 'rgba(255,255,255,0.66)',
                              borderColor: FORMULA_THEME.secondary,
                            }}
                          >
                            <p className="text-sm leading-relaxed" style={{ color: isDarkMode ? FORMULA_THEME.muted : '#35634f' }}>
                              {formula.intro}
                            </p>
                          </div>
                        )}

                        {formula?.sections?.length > 0 && (
                          <div className="mt-5 grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
                            <div className="space-y-3">
                              {formula.sections.map((section, index) => (
                                <button
                                  key={section.id}
                                  type="button"
                                  onClick={() => {
                                    setActiveFormulaSectionId(section.id)
                                    setActiveFormulaPanel('explanation')
                                  }}
                                  className="block w-full rounded-[1.15rem] border px-4 py-3 text-left text-sm font-semibold transition"
                                  style={{
                                    background:
                                      activeFormulaSection?.id === section.id
                                        ? `linear-gradient(135deg, ${FORMULA_THEME.primary}, ${FORMULA_THEME.secondary})`
                                        : isDarkMode
                                          ? FORMULA_THEME.cardSoft
                                          : 'rgba(255,255,255,0.72)',
                                    borderColor:
                                      activeFormulaSection?.id === section.id
                                        ? FORMULA_THEME.accent
                                        : 'rgba(24, 61, 46, 0.12)',
                                    color:
                                      activeFormulaSection?.id === section.id
                                        ? FORMULA_THEME.text
                                        : isDarkMode
                                          ? '#d6ffea'
                                          : '#245340',
                                  }}
                                >
                                  Part {index + 1}: {section.title}
                                </button>
                              ))}
                            </div>

                            {activeFormulaSection && (
                              <div
                                className="rounded-[1.5rem] border px-4 py-4 sm:px-5 sm:py-5"
                                style={{
                                  background: isDarkMode ? FORMULA_THEME.card : 'rgba(255,255,255,0.74)',
                                  borderColor: FORMULA_THEME.secondary,
                                }}
                              >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <h4 className="text-lg font-semibold">{activeFormulaSection.title}</h4>
                                    <p className="mt-1 text-sm font-medium" style={{ color: isDarkMode ? FORMULA_THEME.muted : '#35634f' }}>
                                      {activeFormulaSection.formulaName}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setActiveFormulaPanel('explanation')}
                                      className="rounded-full border px-3 py-1.5 text-xs font-semibold transition"
                                      style={{
                                        background:
                                          activeFormulaPanel === 'explanation'
                                            ? `linear-gradient(135deg, ${FORMULA_THEME.primary}, ${FORMULA_THEME.secondary})`
                                            : isDarkMode
                                              ? FORMULA_THEME.cardSoft
                                              : 'rgba(255,255,255,0.75)',
                                        borderColor: FORMULA_THEME.accent,
                                        color: FORMULA_THEME.text,
                                      }}
                                    >
                                      Explanation
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setActiveFormulaPanel('practice')}
                                      className="rounded-full border px-3 py-1.5 text-xs font-semibold transition"
                                      style={{
                                        background:
                                          activeFormulaPanel === 'practice'
                                            ? `linear-gradient(135deg, ${FORMULA_THEME.primary}, ${FORMULA_THEME.secondary})`
                                            : isDarkMode
                                              ? FORMULA_THEME.cardSoft
                                              : 'rgba(255,255,255,0.75)',
                                        borderColor: FORMULA_THEME.accent,
                                        color: FORMULA_THEME.text,
                                      }}
                                    >
                                      Practice
                                    </button>
                                  </div>
                                </div>

                                <div className="mt-4 rounded-[1.2rem] border px-4 py-4" style={{
                                  background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.92)',
                                  borderColor: 'rgba(24, 61, 46, 0.1)',
                                }}>
                                  <h5 className="text-sm font-semibold uppercase tracking-[0.12em]" style={{ color: isDarkMode ? '#9be4bf' : '#4a7d68' }}>
                                    Formula
                                  </h5>
                                  <p className="mt-2 text-base font-semibold break-words" style={{ color: isDarkMode ? FORMULA_THEME.text : '#1d4a38' }}>
                                    {activeFormulaSection.formula}
                                  </p>
                                </div>

                                {activeFormulaPanel === 'explanation' ? (
                                  <div className="mt-4 space-y-4">
                                    {activeFormulaSection.importance && (
                                      <div className="rounded-xl border px-4 py-3 text-sm" style={{
                                        background: isDarkMode ? FORMULA_THEME.cardSoft : 'rgba(244,255,248,0.95)',
                                        borderColor: 'rgba(24, 61, 46, 0.1)',
                                        color: isDarkMode ? FORMULA_THEME.muted : '#35634f',
                                      }}>
                                        Why it matters: {activeFormulaSection.importance}
                                      </div>
                                    )}
                                    {activeFormulaSection.whenToUse && (
                                      <div className="rounded-xl border px-4 py-3 text-sm" style={{
                                        background: isDarkMode ? FORMULA_THEME.cardSoft : 'rgba(244,255,248,0.95)',
                                        borderColor: 'rgba(24, 61, 46, 0.1)',
                                        color: isDarkMode ? FORMULA_THEME.muted : '#35634f',
                                      }}>
                                        When to use: {activeFormulaSection.whenToUse}
                                      </div>
                                    )}
                                    <div className="rounded-[1.2rem] border px-4 py-4" style={{
                                      background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.92)',
                                      borderColor: 'rgba(24, 61, 46, 0.1)',
                                    }}>
                                      <h5 className="text-sm font-semibold uppercase tracking-[0.12em]" style={{ color: isDarkMode ? '#9be4bf' : '#4a7d68' }}>
                                        Explanation
                                      </h5>
                                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 sm:leading-7" style={{ color: isDarkMode ? FORMULA_THEME.text : '#1d4a38' }}>
                                        {activeFormulaSection.explanation}
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-4">
                                    <h5 className="text-sm font-semibold uppercase tracking-[0.12em]" style={{ color: isDarkMode ? '#9be4bf' : '#4a7d68' }}>
                                      Practice Questions
                                    </h5>
                                    <div className="mt-3 space-y-2">
                                      {Array.isArray(activeFormulaSection.practiceQuestions) && activeFormulaSection.practiceQuestions.length > 0 ? (
                                        activeFormulaSection.practiceQuestions.map((question, index) => (
                                          <div
                                            key={`${question}-${index}`}
                                            className="rounded-xl border px-3 py-3 text-sm"
                                            style={{
                                              background: isDarkMode ? FORMULA_THEME.cardSoft : 'rgba(245,255,249,0.95)',
                                              borderColor: 'rgba(24, 61, 46, 0.1)',
                                              color: isDarkMode ? FORMULA_THEME.text : '#245340',
                                            }}
                                          >
                                            Q{index + 1}. {question}
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-sm" style={{ color: isDarkMode ? FORMULA_THEME.muted : '#35634f' }}>
                                          This part does not need practice questions. Focus on understanding the rule first.
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className="rounded-[1.6rem] border p-4 shadow-[0_18px_40px_rgba(173,78,167,0.14)] sm:p-5"
                        style={{
                          ...doubtPanelStyle,
                          color: DOUBT_THEME.text,
                          backgroundImage: isDarkMode
                            ? `radial-gradient(circle at top left, rgba(255,182,246,0.1), transparent 28%), linear-gradient(135deg, ${DOUBT_THEME.surface}, rgba(38,16,42,0.98))`
                            : `radial-gradient(circle at top left, rgba(255,255,255,0.82), transparent 32%), linear-gradient(135deg, ${DOUBT_THEME.surface}, #ffe8fb)`,
                        }}
                      >
                        <h3 className="text-lg font-semibold">Ask Your Doubt</h3>
                        <p
                          className="mt-2 text-sm leading-relaxed"
                          style={{ color: isDarkMode ? DOUBT_THEME.muted : '#7d3d74' }}
                        >
                          Ask any question about this summary and get a clear teacher-style explanation.
                        </p>

                        <form className="mt-4 space-y-3" onSubmit={handleSubmitDoubt}>
                          <textarea
                            value={doubtQuestion}
                            onChange={(e) => setDoubtQuestion(e.target.value)}
                            placeholder="Ask your doubt here..."
                            rows={4}
                            className="w-full rounded-[1.2rem] border px-4 py-3 text-sm outline-none"
                            style={{
                              background: isDarkMode ? DOUBT_THEME.cardSoft : 'rgba(255,255,255,0.82)',
                              borderColor: DOUBT_THEME.accent,
                              color: DOUBT_THEME.text,
                            }}
                          />
                          <button
                            type="submit"
                            disabled={doubtLoading}
                            className="w-full rounded-full border px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                            style={{
                              background: `linear-gradient(135deg, ${DOUBT_THEME.primary}, ${DOUBT_THEME.secondary})`,
                              borderColor: DOUBT_THEME.accent,
                              color: DOUBT_THEME.text,
                            }}
                          >
                            {doubtLoading ? 'Getting Explanation...' : 'Get Explanation'}
                          </button>
                        </form>

                        {doubtError && (
                          <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
                            {doubtError}
                          </p>
                        )}

                        {doubt?.answer && (
                          <div
                            className="mt-5 rounded-[1.25rem] border px-4 py-4"
                            style={{
                              background: isDarkMode ? DOUBT_THEME.card : 'rgba(255,255,255,0.6)',
                              borderColor: DOUBT_THEME.accent,
                            }}
                          >
                            {doubt?.question && (
                              <p
                                className="mb-3 text-sm font-medium"
                                style={{ color: isDarkMode ? DOUBT_THEME.muted : '#7d3d74' }}
                              >
                                Your doubt: {doubt.question}
                              </p>
                            )}
                            <h4 className="text-base font-semibold">
                              {doubt.answer.title || 'Teacher Explanation'}
                            </h4>
                            <p className="mt-2 text-sm leading-relaxed">
                              {doubt.answer.explanation}
                            </p>
                            {Array.isArray(doubt.answer.steps) && doubt.answer.steps.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {doubt.answer.steps.map((step, index) => (
                                  <div
                                    key={`${step}-${index}`}
                                    className="rounded-xl border px-3 py-2 text-sm"
                                    style={{
                                      background: isDarkMode ? DOUBT_THEME.cardSoft : 'rgba(255,255,255,0.8)',
                                      borderColor: DOUBT_THEME.accent,
                                    }}
                                  >
                                    {step}
                                  </div>
                                ))}
                              </div>
                            )}
                            {doubt.answer.keyTakeaway && (
                              <p
                                className="mt-3 text-sm font-medium"
                                style={{ color: isDarkMode ? DOUBT_THEME.muted : '#7d3d74' }}
                              >
                                Key takeaway: {doubt.answer.keyTakeaway}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center px-2 text-center text-sm leading-relaxed text-[var(--muted)]">
                    <p>
                      Paste a YouTube link or upload a notes photo to get a clean, easy-to-read summary.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <form
        className="hidden"
        onSubmit={handleSubmit}
      >
        <div className="mx-auto flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 rounded-[1.1rem] border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm text-[var(--text)] shadow-sm focus:border-[var(--accent-2)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(99,102,241,0.12)]"
          />

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-[1.1rem] px-6 py-3 text-sm font-semibold text-[var(--text)] shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}
          >
            {loading ? 'Summarizing…' : 'Summarize'}
          </button>
        </div>

        <div className="mx-auto mt-3 flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          
          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
              {error}
            </p>
          )}
        </div>
      </form>
    </main>
  )
}

export default Home
