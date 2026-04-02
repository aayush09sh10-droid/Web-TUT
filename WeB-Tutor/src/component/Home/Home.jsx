import React, { useMemo } from 'react'
import {
  requestDoubtAnswer,
  requestFormula,
  requestNotesSummary,
  requestQuiz,
  requestTeaching,
  requestVideoSummary,
  saveQuizProgress,
} from './api/homeApi'
import AskDoubtFeature from './features/AskDoubt'
import FormulaLabFeature from './features/FormulaLab'
import GenerateQuizFeature from './features/GenerateQuiz'
import HeaderFeature from './features/Header'
import NewSummaryFeature from './features/NewSummary'
import PasteLinkFeature from './features/PasteLink'
import SummaryFeature from './features/Summary'
import TeachingFeature from './features/Teaching'
import { useHomeHistory } from './hooks/useHomeHistory'
import { useHomePersistence } from './hooks/useHomePersistence'
import { fileToBase64, normalizeSummaryPayload, questionNeedsFormulaSupport } from './homeUtils'
import {
  addHistoryItem,
  resetHomeForNewSummary,
  setHomeField,
  setHomeFields,
  setHomeHistory,
} from './store/homeSlice'
import { useAppDispatch, useAppSelector } from '../../store/hooks'

function Home() {
  const dispatch = useAppDispatch()
  const authToken = useAppSelector((state) => state.auth.auth?.token)
  const home = useAppSelector((state) => state.home)
  const {
    inputMode,
    url,
    notesImage,
    result,
    history,
    activeView,
    quizLoading,
    teachingLoading,
    formulaLoading,
    selectedAnswers,
    quizSubmitted,
    activeTopicId,
    activeFormulaSectionId,
    activeFormulaPanel,
    showComposer,
    doubtQuestion,
  } = home

  const persistedHomeState = useMemo(
    () => ({
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
    }),
    [
      activeFormulaPanel,
      activeFormulaSectionId,
      activeTopicId,
      activeView,
      doubtQuestion,
      inputMode,
      quizSubmitted,
      result,
      selectedAnswers,
      showComposer,
      url,
    ]
  )

  useHomePersistence(persistedHomeState)

  const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {}
  useHomeHistory(authToken, authHeaders)

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

    dispatch(setHomeHistory(updatedHistory))
  }

  async function requestSummaryForCurrentInput() {
    if (inputMode === 'video') {
      if (!url.trim()) throw new Error('Please paste a valid YouTube video URL.')
      return requestVideoSummary(authHeaders, url.trim())
    }

    if (!notesImage?.imageData) throw new Error('Please upload a notes photo first.')
    return requestNotesSummary(authHeaders, notesImage)
  }

  function applySummaryPayload(payload, nextView = 'summary') {
    dispatch(
      setHomeFields({
        result: payload,
        error: '',
        quizError: '',
        teachingError: '',
        formulaError: '',
        doubtError: '',
        activeView: nextView,
        selectedAnswers: {},
        quizSubmitted: false,
        activeTopicId: '',
        activeFormulaSectionId: '',
        activeFormulaPanel: 'explanation',
        showComposer: false,
      })
    )

    dispatch(
      addHistoryItem({
        url: payload.sourceLabel || url.trim() || notesImage?.fileName || '',
        result: payload,
        timestamp: Date.now(),
      })
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    dispatch(setHomeFields({ error: '', quizError: '', teachingError: '', formulaError: '', doubtError: '', loading: true }))
    try {
      const payload = await requestSummaryForCurrentInput()
      applySummaryPayload(payload, 'summary')
    } catch (err) {
      dispatch(setHomeField({ field: 'error', value: err.message || 'Unexpected error' }))
    } finally {
      dispatch(setHomeField({ field: 'loading', value: false }))
    }
  }

  async function handleNotesFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) {
      dispatch(setHomeField({ field: 'notesImage', value: null }))
      return
    }
    if (!file.type.startsWith('image/')) {
      dispatch(setHomeFields({ error: 'Please choose an image file for your notes.', notesImage: null }))
      return
    }

    dispatch(setHomeField({ field: 'error', value: '' }))
    try {
      const imageData = await fileToBase64(file)
      dispatch(setHomeField({ field: 'notesImage', value: { imageData, mimeType: file.type, fileName: file.name } }))
    } catch (err) {
      dispatch(setHomeFields({ error: err.message || 'Failed to read the selected image.', notesImage: null }))
    }
  }

  async function handleSubmitDoubt(e) {
    e.preventDefault()
    if (!doubtQuestion.trim()) {
      dispatch(setHomeField({ field: 'doubtError', value: 'Please type your doubt first.' }))
      return
    }

    dispatch(setHomeFields({ doubtError: '', doubtLoading: true }))
    try {
      let workingResult = result
      if (!workingResult?.summary) {
        const payload = await requestSummaryForCurrentInput()
        applySummaryPayload(payload, 'doubt')
        workingResult = payload
      }

      if (workingResult?.summary && !workingResult?.formula && questionNeedsFormulaSupport(doubtQuestion)) {
        const formulaPayload = await requestFormula(authHeaders, workingResult.summary, workingResult.historyId)
        workingResult = { ...workingResult, formula: formulaPayload.formula }
        dispatch(setHomeFields({ result: workingResult, activeFormulaSectionId: formulaPayload.formula?.sections?.[0]?.id || '' }))
        updateHistoryResult(workingResult)
      }

      const payload = await requestDoubtAnswer(authHeaders, {
        summary: workingResult.summary,
        formula: workingResult.formula || null,
        teaching: workingResult.teaching || null,
        question: doubtQuestion.trim(),
        historyId: workingResult.historyId,
        sourceLabel: workingResult.sourceLabel || getCurrentSourceLabel(workingResult),
        sourceType: workingResult.sourceType || inputMode,
      })

      const nextResult = { ...workingResult, doubt: { question: doubtQuestion.trim(), answer: payload.answer } }
      dispatch(setHomeField({ field: 'result', value: nextResult }))
      updateHistoryResult(nextResult)
    } catch (err) {
      dispatch(setHomeField({ field: 'doubtError', value: err.message || 'Unexpected error' }))
    } finally {
      dispatch(setHomeField({ field: 'doubtLoading', value: false }))
    }
  }

  async function handleGenerateQuiz() {
    if (!result?.summary) return
    dispatch(setHomeFields({ activeView: 'quiz', quizError: '' }))
    if (result.quiz) return

    dispatch(setHomeFields({ selectedAnswers: {}, quizSubmitted: false, quizLoading: true }))
    try {
      const payload = await requestQuiz(authHeaders, result.summary, result.historyId)
      const nextResult = { ...result, quiz: payload.quiz }
      dispatch(setHomeField({ field: 'result', value: nextResult }))
      updateHistoryResult(nextResult)
    } catch (err) {
      dispatch(setHomeField({ field: 'quizError', value: err.message || 'Unexpected error' }))
    } finally {
      dispatch(setHomeField({ field: 'quizLoading', value: false }))
    }
  }

  async function handleGenerateTeaching() {
    if (!result?.summary) return
    dispatch(setHomeFields({ activeView: 'teaching', teachingError: '' }))
    if (result.teaching?.topics?.length) {
      if (!activeTopicId) dispatch(setHomeField({ field: 'activeTopicId', value: result.teaching.topics[0].id }))
      return
    }

    dispatch(setHomeField({ field: 'teachingLoading', value: true }))
    try {
      const payload = await requestTeaching(authHeaders, result.summary, result.historyId)
      const nextResult = { ...result, teaching: payload.teaching }
      dispatch(setHomeFields({ result: nextResult, activeTopicId: payload.teaching?.topics?.[0]?.id || '' }))
      updateHistoryResult(nextResult)
    } catch (err) {
      dispatch(setHomeField({ field: 'teachingError', value: err.message || 'Unexpected error' }))
    } finally {
      dispatch(setHomeField({ field: 'teachingLoading', value: false }))
    }
  }

  async function handleGenerateFormula() {
    if (!result?.summary) return
    dispatch(setHomeFields({ activeView: 'formula', formulaError: '' }))
    if (result.formula?.sections?.length) {
      if (!activeFormulaSectionId) dispatch(setHomeField({ field: 'activeFormulaSectionId', value: result.formula.sections[0].id }))
      return
    }

    dispatch(setHomeField({ field: 'formulaLoading', value: true }))
    try {
      const payload = await requestFormula(authHeaders, result.summary, result.historyId)
      const nextResult = { ...result, formula: payload.formula }
      dispatch(setHomeFields({ result: nextResult, activeFormulaSectionId: payload.formula?.sections?.[0]?.id || '', activeFormulaPanel: 'explanation' }))
      updateHistoryResult(nextResult)
    } catch (err) {
      dispatch(setHomeField({ field: 'formulaError', value: err.message || 'Unexpected error' }))
    } finally {
      dispatch(setHomeField({ field: 'formulaLoading', value: false }))
    }
  }

  function handleSubmitQuiz() {
    const quiz = result?.quiz
    if (!quiz?.questions?.length) return

    dispatch(setHomeField({ field: 'quizSubmitted', value: true }))
    const totalQuestions = quiz?.questions?.length || 0
    const correctCount = quiz?.questions?.reduce((count, question) => count + (selectedAnswers[question.id] === question.answerIndex ? 1 : 0), 0) || 0
    const scorePercent = totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0

    if (result?.historyId && authToken) {
      const nextWrongQuestions = quiz.questions
        .filter((question) => selectedAnswers[question.id] !== question.answerIndex)
        .map((question) => question.question)

      saveQuizProgress(authHeaders, result.historyId, {
        correctCount,
        totalQuestions,
        scorePercent,
        selectedAnswers,
        wrongQuestions: nextWrongQuestions,
      })
        .then((payload) => {
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
          dispatch(setHomeField({ field: 'result', value: nextResult }))
          updateHistoryResult(nextResult)
        })
        .catch((err) => console.error('Quiz progress save error:', err))
    }
  }

  const normalizedSummary = normalizeSummaryPayload(result)
  const showResult = Boolean(result)

  return (
    <main className="min-h-140 text-[var(--text)]">
      <section className="flex flex-1 flex-col overflow-hidden">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-3 pb-10 pt-6 sm:px-4 sm:pb-12 sm:pt-8">
          <HeaderFeature
            title="Summarize a video or notes photo"
            description="Paste a YouTube link or upload study notes and turn them into a colorful study flow with summaries, quizzes, formula help, and guided teaching."
          />

          <PasteLinkFeature handleNotesFileChange={handleNotesFileChange} handleSubmit={handleSubmit} />

          <div className="mt-5 flex flex-1 flex-col gap-4 sm:mt-6">
            <div className="flex flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] backdrop-blur-xl">
              <div className="flex flex-1 flex-col gap-4 overflow-auto p-4 pb-16 sm:p-6 sm:pb-24">
                {showResult ? (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:flex sm:flex-wrap">
                      <button type="button" onClick={() => dispatch(setHomeField({ field: 'activeView', value: 'summary' }))} className={`w-full rounded-full border px-4 py-2 text-sm font-semibold transition sm:w-auto ${activeView === 'summary' ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)]' : 'border-[var(--border)] bg-[var(--card)] text-[var(--text)]'}`}>Summary</button>
                      <button type="button" onClick={handleGenerateQuiz} disabled={quizLoading} className="w-full rounded-full border px-5 py-2.5 text-sm font-semibold shadow-[0_8px_24px_rgba(255,153,0,0.22)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto" style={{ background: 'linear-gradient(135deg, oklch(75% 0.204 54), oklch(80% 0.186 80))', borderColor: 'oklch(72% 0.217 24)', color: '#4a2313' }}>{quizLoading ? 'Generating Quiz...' : 'Generate Quiz'}</button>
                      <button type="button" onClick={handleGenerateTeaching} disabled={teachingLoading} className="w-full rounded-full border px-5 py-2.5 text-sm font-semibold shadow-[0_10px_26px_rgba(96,112,255,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto" style={{ background: 'linear-gradient(135deg, oklch(72% 0.167 244), oklch(84% 0.118 214))', borderColor: 'oklch(65% 0.19 278)', color: '#1d2957' }}>{teachingLoading ? 'Generating Teaching...' : 'Teaching'}</button>
                      <button type="button" onClick={handleGenerateFormula} disabled={formulaLoading} className="w-full rounded-full border px-5 py-2.5 text-sm font-semibold shadow-[0_10px_26px_rgba(58,168,118,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto" style={{ background: 'linear-gradient(135deg, oklch(74% 0.18 145), oklch(87% 0.11 120))', borderColor: 'oklch(63% 0.16 155)', color: '#183d2e' }}>{formulaLoading ? 'Generating Formula...' : 'Formula Lab'}</button>
                      <button type="button" onClick={() => dispatch(setHomeField({ field: 'activeView', value: 'doubt' }))} className="w-full rounded-full border px-5 py-2.5 text-sm font-semibold shadow-[0_10px_26px_rgba(173,78,167,0.18)] transition hover:-translate-y-0.5 sm:w-auto" style={{ background: 'linear-gradient(135deg, oklch(70% 0.16 330), oklch(86% 0.09 320))', borderColor: 'oklch(62% 0.18 320)', color: '#4f1d4a' }}>Ask Doubt</button>
                      <NewSummaryFeature onClick={() => dispatch(resetHomeForNewSummary())} />
                    </div>

                    <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--card-strong)] p-4 shadow-sm">
                      <h3 className="text-lg font-semibold text-[var(--text)]">{normalizedSummary.title}</h3>
                    </div>

                    {activeView === 'summary' && <SummaryFeature />}
                    {activeView === 'quiz' && <GenerateQuizFeature handleSubmitQuiz={handleSubmitQuiz} />}
                    {activeView === 'teaching' && <TeachingFeature />}
                    {activeView === 'formula' && <FormulaLabFeature />}
                    {activeView === 'doubt' && <AskDoubtFeature handleSubmitDoubt={handleSubmitDoubt} hasLearningContext={Boolean(result?.summary)} />}
                  </div>
                ) : activeView === 'doubt' ? (
                  <AskDoubtFeature handleSubmitDoubt={handleSubmitDoubt} hasLearningContext={false} />
                ) : (
                  <div className="flex flex-1 items-center justify-center px-2 text-center text-sm leading-relaxed text-[var(--muted)]">
                    <p>Paste a YouTube link or upload a notes photo to get a clean, easy-to-read summary.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Home
