import React, { useMemo } from 'react'
import {
  requestAskAnything,
  requestDoubtAnswer,
  requestFormula,
  requestQuiz,
  requestStudySummary,
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
import { normalizeSummaryPayload, questionNeedsFormulaSupport } from './homeUtils'
import { MAX_PHOTO_UPLOADS, buildStudyUploads } from './utils/studyUploadUtils'
import { setHistoryCache } from '../../cache'
import { hasUsedGuestSummary, markGuestSummaryUsed } from '../../shared/auth/guestAccess'
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
  const auth = useAppSelector((state) => state.auth.auth)
  const isAuthenticated = Boolean(auth?.user)
  const home = useAppSelector((state) => state.home)
  const {
    inputMode,
    url,
    studyUploads,
    askPrompt,
    summaryPrompt,
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
      askPrompt,
      summaryPrompt,
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
      askPrompt,
      doubtQuestion,
      inputMode,
      summaryPrompt,
      quizSubmitted,
      result,
      selectedAnswers,
      showComposer,
      url,
    ]
  )

  const homeStateOwnerId = auth?.user?.id || auth?.user?._id || auth?.user?.email || ''

  useHomePersistence(persistedHomeState, homeStateOwnerId)
  useHomeHistory(isAuthenticated)

  function getVisibleErrorMessage(err, fallbackMessage = 'Unexpected error') {
    if (err?.silentInUi) {
      return ''
    }

    return err?.message || fallbackMessage
  }

  function getCurrentSourceLabel(nextResult = result) {
    if (nextResult?.sourceLabel) return nextResult.sourceLabel
    if (url.trim()) return url.trim()
    if (askPrompt.trim()) return `Ask AI: ${askPrompt.trim()}`
    if (studyUploads.length > 0) {
      if (inputMode === 'photos') {
        return `Study Photos: ${studyUploads.map((upload) => upload.fileName).join(', ')}`
      }

      return `Study Files: ${studyUploads.map((upload) => upload.fileName).join(', ')}`
    }

    return ''
  }

  function getSummaryRequestOptions(options = {}) {
    return {
      ...options,
      studyPrompt: inputMode === 'ask' ? '' : summaryPrompt.trim(),
    }
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
    if (isAuthenticated) {
      setHistoryCache('authenticated', updatedHistory)
    }
  }

  async function requestSummaryForCurrentInput(options = {}) {
    const requestOptions = getSummaryRequestOptions(options)

    if (inputMode === 'video') {
      if (!url.trim()) throw new Error('Please paste a valid YouTube video URL.')
      return requestVideoSummary(url.trim(), requestOptions)
    }

    if (inputMode === 'ask') {
      if (!askPrompt.trim()) throw new Error('Please enter a topic or question first.')
      return requestAskAnything(askPrompt.trim(), requestOptions)
    }

    if (!studyUploads.length) {
      throw new Error(
        inputMode === 'photos'
          ? 'Please upload at least one study photo first.'
          : 'Please upload at least one study file first.'
      )
    }

    return requestStudySummary(
      {
        uploads: studyUploads,
        sourceMode: inputMode,
      },
      requestOptions
    )
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
        activeTopicId: payload.teaching?.topics?.[0]?.id || '',
        activeFormulaSectionId: '',
        activeFormulaPanel: 'explanation',
        showComposer: false,
      })
    )

    if (result?.historyId && payload?.historyId && result.historyId === payload.historyId) {
      updateHistoryResult(payload)
      return
    }

    dispatch(
      addHistoryItem({
        url: payload.sourceLabel || url.trim() || askPrompt.trim() || studyUploads[0]?.fileName || '',
        result: payload,
        timestamp: Date.now(),
      })
    )

    const nextHistory = [
      {
        id: payload.historyId,
        url: payload.sourceLabel || url.trim() || askPrompt.trim() || studyUploads[0]?.fileName || '',
        sourceLabel: payload.sourceLabel,
        sourceType: payload.sourceType,
        timestamp: Date.now(),
        result: payload,
      },
      ...history.filter((item) => item.id !== payload.historyId && item.url !== (payload.sourceLabel || url.trim() || askPrompt.trim() || studyUploads[0]?.fileName || '')),
    ].slice(0, 12)

    if (isAuthenticated) {
      setHistoryCache('authenticated', nextHistory)
    }
  }

  async function continueAfterSummary(payload) {
    applySummaryPayload(payload, 'summary')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    dispatch(setHomeFields({ error: '', quizError: '', teachingError: '', formulaError: '', doubtError: '', loading: true }))
    try {
      if (!isAuthenticated && hasUsedGuestSummary()) {
        throw new Error('Please login to continue using WebTutor after your one free summary.')
      }

      const payload = await requestSummaryForCurrentInput()
      if (!isAuthenticated) {
        markGuestSummaryUsed()
      }
      await continueAfterSummary(payload)
    } catch (err) {
      const nextError = getVisibleErrorMessage(err)
      if (nextError) {
        dispatch(setHomeField({ field: 'error', value: nextError }))
      }
    } finally {
      dispatch(setHomeField({ field: 'loading', value: false }))
    }
  }

  async function handleRegenerateSummary() {
    if (!isAuthenticated) {
      dispatch(setHomeField({ field: 'error', value: 'Please login to regenerate this summary.' }))
      return
    }

    dispatch(setHomeFields({ error: '', quizError: '', teachingError: '', formulaError: '', doubtError: '', loading: true }))
    try {
      const payload = await requestSummaryForCurrentInput({
        historyId: result?.historyId,
        forceRegenerate: true,
      })
      applySummaryPayload(payload, activeView || 'summary')
    } catch (err) {
      const nextError = getVisibleErrorMessage(err)
      if (nextError) {
        dispatch(setHomeField({ field: 'error', value: nextError }))
      }
    } finally {
      dispatch(setHomeField({ field: 'loading', value: false }))
    }
  }

  async function handleStudyFilesChange(e) {
    const files = Array.from(e.target.files || [])

    if (!files.length) {
      dispatch(setHomeField({ field: 'studyUploads', value: [] }))
      return
    }

    if (inputMode === 'photos') {
      if (files.length > MAX_PHOTO_UPLOADS) {
        dispatch(
          setHomeFields({
            error: `You can upload a maximum of ${MAX_PHOTO_UPLOADS} photos at one time.`,
            studyUploads: [],
          })
        )
        return
      }

      if (files.some((file) => !file.type.startsWith('image/'))) {
        dispatch(
          setHomeFields({
            error: 'Photo mode accepts image files only.',
            studyUploads: [],
          })
        )
        return
      }
    }

    if (inputMode === 'files') {
      const allowedMimeTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/json',
        'application/ld+json',
        'application/xml',
        'application/javascript',
        'application/x-javascript',
        'application/csv',
        'text/csv',
      ]

      const hasUnsupportedFile = files.some(
        (file) =>
          !file.type.startsWith('text/') &&
          !file.type.startsWith('image/') &&
          !allowedMimeTypes.includes(file.type)
      )

      if (hasUnsupportedFile) {
        dispatch(
          setHomeFields({
            error: 'Please upload PDF, PPTX, text, CSV, JSON, markdown, or image files.',
            studyUploads: [],
          })
        )
        return
      }
    }

    dispatch(setHomeField({ field: 'error', value: '' }))

    try {
      const uploads = await buildStudyUploads(files)
      dispatch(setHomeField({ field: 'studyUploads', value: uploads }))
    } catch (err) {
      dispatch(setHomeFields({ error: err.message || 'Failed to read the selected files.', studyUploads: [] }))
    } finally {
      e.target.value = ''
    }
  }

  function handleOpenNewSummaryComposer() {
    dispatch(resetHomeForNewSummary())
  }

  function handleCloseComposer() {
    if (!result) {
      return
    }

    dispatch(setHomeFields({ showComposer: false, error: '', studyUploads: [], askPrompt: '' }))
  }

  async function submitDoubtRequest(questionValue, forceRegenerate = false) {
    if (!isAuthenticated) {
      dispatch(setHomeField({ field: 'doubtError', value: 'Please login to use Ask Doubt.' }))
      return
    }

    if (!questionValue.trim()) {
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
        const formulaPayload = await requestFormula(workingResult.summary, workingResult.historyId)
        workingResult = { ...workingResult, formula: formulaPayload.formula }
        dispatch(setHomeFields({ result: workingResult, activeFormulaSectionId: formulaPayload.formula?.sections?.[0]?.id || '' }))
        updateHistoryResult(workingResult)
      }

      const payload = await requestDoubtAnswer({
        summary: workingResult.summary,
        formula: workingResult.formula || null,
        teaching: workingResult.teaching || null,
        question: questionValue.trim(),
        historyId: workingResult.historyId,
        sourceLabel: workingResult.sourceLabel || getCurrentSourceLabel(workingResult),
        sourceType: workingResult.sourceType || inputMode,
      }, {
        forceRegenerate,
      })

      const nextResult = { ...workingResult, doubt: { question: questionValue.trim(), answer: payload.answer } }
      dispatch(setHomeField({ field: 'result', value: nextResult }))
      updateHistoryResult(nextResult)
    } catch (err) {
      const nextError = getVisibleErrorMessage(err)
      if (nextError) {
        dispatch(setHomeField({ field: 'doubtError', value: nextError }))
      }
    } finally {
      dispatch(setHomeField({ field: 'doubtLoading', value: false }))
    }
  }

  async function handleSubmitDoubt(e) {
    e.preventDefault()
    await submitDoubtRequest(doubtQuestion)
  }

  async function handleRegenerateDoubt() {
    const questionValue = result?.doubt?.question || doubtQuestion
    await submitDoubtRequest(questionValue, true)
  }

  async function handleGenerateQuiz(forceRegenerate = false, workingResult = result) {
    if (!isAuthenticated) {
      dispatch(setHomeField({ field: 'quizError', value: 'Please login to generate quiz.' }))
      return
    }

    if (!workingResult?.summary) return
    dispatch(setHomeFields({ activeView: 'quiz', quizError: '' }))
    if (workingResult.quiz && !forceRegenerate) return

    dispatch(setHomeFields({ selectedAnswers: {}, quizSubmitted: false, quizLoading: true }))
    try {
      const payload = await requestQuiz(workingResult.summary, workingResult.historyId, { forceRegenerate })
      const nextResult = { ...workingResult, quiz: payload.quiz }
      dispatch(setHomeField({ field: 'result', value: nextResult }))
      updateHistoryResult(nextResult)
    } catch (err) {
      const nextError = getVisibleErrorMessage(err)
      if (nextError) {
        dispatch(setHomeField({ field: 'quizError', value: nextError }))
      }
    } finally {
      dispatch(setHomeField({ field: 'quizLoading', value: false }))
    }
  }

  async function handleGenerateTeaching(forceRegenerate = false, workingResult = result) {
    if (!isAuthenticated) {
      dispatch(setHomeField({ field: 'teachingError', value: 'Please login to generate teaching path.' }))
      return
    }

    if (!workingResult?.summary) return
    dispatch(setHomeFields({ activeView: 'teaching', teachingError: '' }))
    if (workingResult.teaching?.topics?.length && !forceRegenerate) {
      if (!activeTopicId) dispatch(setHomeField({ field: 'activeTopicId', value: workingResult.teaching.topics[0].id }))
      return
    }

    dispatch(setHomeField({ field: 'teachingLoading', value: true }))
    try {
      const payload = await requestTeaching(workingResult.summary, workingResult.historyId, { forceRegenerate })
      const nextResult = { ...workingResult, teaching: payload.teaching }
      dispatch(setHomeFields({ result: nextResult, activeTopicId: payload.teaching?.topics?.[0]?.id || '' }))
      updateHistoryResult(nextResult)
    } catch (err) {
      const nextError = getVisibleErrorMessage(err)
      if (nextError) {
        dispatch(setHomeField({ field: 'teachingError', value: nextError }))
      }
    } finally {
      dispatch(setHomeField({ field: 'teachingLoading', value: false }))
    }
  }

  async function handleGenerateFormula(forceRegenerate = false, workingResult = result) {
    if (!isAuthenticated) {
      dispatch(setHomeField({ field: 'formulaError', value: 'Please login to generate formula guide.' }))
      return
    }

    if (!workingResult?.summary) return
    dispatch(setHomeFields({ activeView: 'formula', formulaError: '' }))
    if (workingResult.formula?.sections?.length && !forceRegenerate) {
      if (!activeFormulaSectionId) dispatch(setHomeField({ field: 'activeFormulaSectionId', value: workingResult.formula.sections[0].id }))
      return
    }

    dispatch(setHomeField({ field: 'formulaLoading', value: true }))
    try {
      const payload = await requestFormula(workingResult.summary, workingResult.historyId, { forceRegenerate })
      const nextResult = { ...workingResult, formula: payload.formula }
      dispatch(setHomeFields({ result: nextResult, activeFormulaSectionId: payload.formula?.sections?.[0]?.id || '', activeFormulaPanel: 'explanation' }))
      updateHistoryResult(nextResult)
    } catch (err) {
      const nextError = getVisibleErrorMessage(err)
      if (nextError) {
        dispatch(setHomeField({ field: 'formulaError', value: nextError }))
      }
    } finally {
      dispatch(setHomeField({ field: 'formulaLoading', value: false }))
    }
  }

  function handleOpenQuizView() {
    dispatch(setHomeFields({ activeView: 'quiz', quizError: '' }))
  }

  function handleOpenTeachingView() {
    dispatch(setHomeFields({ activeView: 'teaching', teachingError: '' }))
    if (result?.teaching?.topics?.length && !activeTopicId) {
      dispatch(setHomeField({ field: 'activeTopicId', value: result.teaching.topics[0].id }))
    }
  }

  function handleOpenFormulaView() {
    dispatch(setHomeFields({ activeView: 'formula', formulaError: '' }))
    if (result?.formula?.sections?.length && !activeFormulaSectionId) {
      dispatch(setHomeField({ field: 'activeFormulaSectionId', value: result.formula.sections[0].id }))
    }
  }

  function handleSubmitQuiz() {
    const quiz = result?.quiz
    if (!quiz?.questions?.length) return

    dispatch(setHomeField({ field: 'quizSubmitted', value: true }))
    const totalQuestions = quiz?.questions?.length || 0
    const correctCount = quiz?.questions?.reduce((count, question) => count + (selectedAnswers[question.id] === question.answerIndex ? 1 : 0), 0) || 0
    const scorePercent = totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0

    if (result?.historyId && isAuthenticated) {
      const nextWrongQuestions = quiz.questions
        .filter((question) => selectedAnswers[question.id] !== question.answerIndex)
        .map((question) => question.question)

      saveQuizProgress(result.historyId, {
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
  const isAskResult = result?.sourceType === 'ask-ai'

  return (
    <main className="min-h-140 text-(--text)">
      <section className="flex flex-1 flex-col overflow-hidden">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-3 pb-10 pt-6 sm:px-4 sm:pb-12 sm:pt-8">
          <HeaderFeature
            title="Learn from video, files, or Ask AI"
            description="Paste a YouTube link, upload study photos or files, or ask AI anything you want to learn, research, explain, compare, or generate with WebTutor."
          />

          {(showComposer || !showResult) && (
            <PasteLinkFeature
              handleClose={handleCloseComposer}
              handleStudyFilesChange={handleStudyFilesChange}
              handleSubmit={handleSubmit}
              canClose={showResult}
            />
          )}

          <div className="mt-5 flex flex-1 flex-col gap-4 sm:mt-6">
            <div className="flex flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-(--border) bg-(--card) shadow-(--shadow) backdrop-blur-xl">
              <div className="flex flex-1 flex-col gap-4 overflow-auto p-4 pb-16 sm:p-6 sm:pb-24">
                {showResult ? (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:flex sm:flex-wrap">
                      <button type="button" onClick={() => dispatch(setHomeField({ field: 'activeView', value: 'summary' }))} className={`w-full rounded-full border px-4 py-2 text-sm font-semibold transition sm:w-auto ${activeView === 'summary' ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)]' : 'border-(--border) bg-(--card) text-(--text)'}`}>{isAskResult ? 'Response' : 'Summary'}</button>
                      <button type="button" onClick={handleOpenQuizView} className="w-full rounded-full border px-5 py-2.5 text-sm font-semibold shadow-[0_8px_24px_rgba(255,153,0,0.22)] transition hover:-translate-y-0.5 sm:w-auto" style={{ background: activeView === 'quiz' ? 'linear-gradient(135deg, oklch(75% 0.204 54), oklch(80% 0.186 80))' : 'rgba(255,255,255,0.72)', borderColor: 'oklch(72% 0.217 24)', color: '#4a2313' }}>{quizLoading ? 'Quiz' : 'Quiz'}</button>
                      <button type="button" onClick={handleOpenTeachingView} className="w-full rounded-full border px-5 py-2.5 text-sm font-semibold shadow-[0_10px_26px_rgba(96,112,255,0.18)] transition hover:-translate-y-0.5 sm:w-auto" style={{ background: activeView === 'teaching' ? 'linear-gradient(135deg, oklch(72% 0.167 244), oklch(84% 0.118 214))' : 'rgba(255,255,255,0.72)', borderColor: 'oklch(65% 0.19 278)', color: '#1d2957' }}>{teachingLoading ? 'Teaching' : 'Teaching'}</button>
                      <button type="button" onClick={handleOpenFormulaView} className="w-full rounded-full border px-5 py-2.5 text-sm font-semibold shadow-[0_10px_26px_rgba(58,168,118,0.18)] transition hover:-translate-y-0.5 sm:w-auto" style={{ background: activeView === 'formula' ? 'linear-gradient(135deg, oklch(74% 0.18 145), oklch(87% 0.11 120))' : 'rgba(255,255,255,0.72)', borderColor: 'oklch(63% 0.16 155)', color: '#183d2e' }}>{formulaLoading ? 'Formula Lab' : 'Formula Lab'}</button>
                      <button type="button" onClick={() => dispatch(setHomeField({ field: 'activeView', value: 'doubt' }))} className="w-full rounded-full border px-5 py-2.5 text-sm font-semibold shadow-[0_10px_26px_rgba(173,78,167,0.18)] transition hover:-translate-y-0.5 sm:w-auto" style={{ background: activeView === 'doubt' ? 'linear-gradient(135deg, oklch(70% 0.16 330), oklch(86% 0.09 320))' : 'rgba(255,255,255,0.72)', borderColor: 'oklch(62% 0.18 320)', color: '#4f1d4a' }}>Ask Doubt</button>
                      <NewSummaryFeature onClick={handleOpenNewSummaryComposer} />
                    </div>

                    <div className="rounded-[1.25rem] border border-(--border) bg-(--card-strong) p-4 shadow-sm">
                      <h3 className="text-lg font-semibold text-(--text)">{normalizedSummary.title}</h3>
                    </div>

                    {activeView === 'summary' && <SummaryFeature onRegenerate={handleRegenerateSummary} />}
                    {activeView === 'quiz' && <GenerateQuizFeature handleSubmitQuiz={handleSubmitQuiz} onRegenerate={() => handleGenerateQuiz(true)} onGenerate={() => handleGenerateQuiz(false)} />}
                    {activeView === 'teaching' && <TeachingFeature onRegenerate={() => handleGenerateTeaching(true)} onGenerate={() => handleGenerateTeaching(false)} />}
                    {activeView === 'formula' && <FormulaLabFeature onRegenerate={() => handleGenerateFormula(true)} onGenerate={() => handleGenerateFormula(false)} />}
                    {activeView === 'doubt' && <AskDoubtFeature handleSubmitDoubt={handleSubmitDoubt} hasLearningContext={Boolean(result?.summary)} onRegenerate={handleRegenerateDoubt} />}
                  </div>
                ) : activeView === 'doubt' ? (
                  <AskDoubtFeature handleSubmitDoubt={handleSubmitDoubt} hasLearningContext={false} onRegenerate={handleRegenerateDoubt} />
                ) : (
                  <div className="flex flex-1 items-center justify-center px-2 text-center text-sm leading-relaxed text-(--muted)">
                    <p>Paste a YouTube link, upload study photos or files, or ask AI anything you want to understand, research, or generate with WebTutor.</p>
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
