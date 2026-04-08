import React from 'react'
import { DARK_QUIZ_THEME, LIGHT_QUIZ_THEME } from '../../homeTheme'
import { resetQuizSelections, setSelectedAnswer } from '../../store/homeSlice'
import { useAppDispatch, useAppSelector } from '../../../../store/hooks'

export default function GenerateQuizFeature({ handleSubmitQuiz, onRegenerate, onGenerate }) {
  const dispatch = useAppDispatch()
  const isDarkMode = useAppSelector((state) => state.auth.theme === 'dark')
  const QUIZ_THEME = isDarkMode ? DARK_QUIZ_THEME : LIGHT_QUIZ_THEME
  const { quizLoading, quizError, quizSubmitted, selectedAnswers, result } = useAppSelector((state) => state.home)
  const quiz = result?.quiz
  const totalQuestions = quiz?.questions?.length || 0
  const answeredCount = quiz?.questions?.filter((question) => selectedAnswers[question.id] !== undefined).length || 0
  const correctCount = quiz?.questions?.reduce((count, question) => count + (selectedAnswers[question.id] === question.answerIndex ? 1 : 0), 0) || 0
  const scorePercent = totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0

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
    <div className="rounded-[1.5rem] border p-5 shadow-[0_18px_40px_rgba(255,153,0,0.14)]" style={{ backgroundColor: QUIZ_THEME.surface, borderColor: QUIZ_THEME.primary, color: QUIZ_THEME.text, backgroundImage: isDarkMode ? `radial-gradient(circle at top left, rgba(255,208,160,0.14), transparent 30%), linear-gradient(135deg, ${QUIZ_THEME.surface}, rgba(62,34,22,0.98))` : `radial-gradient(circle at top left, rgba(255,255,255,0.78), transparent 34%), linear-gradient(135deg, ${QUIZ_THEME.surface}, #fff3cf)` }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">{quiz?.title || 'Playful Knowledge Check'}</h3>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: isDarkMode ? QUIZ_THEME.muted : '#7a3b12' }}>Test your understanding with AI-generated questions based on the same video summary.</p>
        </div>
        {quiz ? (
          <button type="button" onClick={onRegenerate} disabled={quizLoading} className="rounded-full border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60" style={{ backgroundColor: isDarkMode ? QUIZ_THEME.cardSoft : 'rgba(255,255,255,0.72)', borderColor: QUIZ_THEME.accent, color: QUIZ_THEME.text }}>
            {quizLoading ? 'Regenerating...' : 'Regenerate'}
          </button>
        ) : null}
      </div>
      {quizError && <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">{quizError}</p>}
      {!quizLoading && !quiz && !quizError && (
        <div className="mt-4">
          <p className="text-sm leading-relaxed">Open the quiz tab any time, then generate questions only when you want them.</p>
          <button type="button" onClick={onGenerate} className="mt-3 rounded-full border px-4 py-2 text-sm font-semibold transition" style={{ background: `linear-gradient(135deg, ${QUIZ_THEME.primary}, ${QUIZ_THEME.secondary})`, borderColor: QUIZ_THEME.accent, color: QUIZ_THEME.text }}>
            Generate Quiz
          </button>
        </div>
      )}
      {quizLoading && <p className="mt-4 text-sm font-medium">Generating your quiz...</p>}
      {quiz?.questions?.length > 0 && (
        <div className="mt-5 space-y-4">
          {quiz.questions.map((question, index) => (
            <div key={question.id} className="rounded-[1.25rem] border px-4 py-4" style={{ background: isDarkMode ? QUIZ_THEME.card : 'rgba(255, 255, 255, 0.58)', borderColor: QUIZ_THEME.secondary }}>
              <h4 className="text-base font-semibold">{index + 1}. {question.question}</h4>
              <div className="mt-3 space-y-2">
                {question.options.map((option, optionIndex) => (
                  <button key={`${question.id}-${optionIndex}`} type="button" onClick={() => !quizSubmitted && dispatch(setSelectedAnswer({ questionId: question.id, optionIndex }))} className="block w-full rounded-xl border px-3 py-2 text-left text-sm shadow-sm transition" style={{ backgroundColor: quizSubmitted ? optionIndex === question.answerIndex ? QUIZ_THEME.primary : selectedAnswers[question.id] === optionIndex ? isDarkMode ? QUIZ_THEME.wrong : '#ffd7d1' : isDarkMode ? QUIZ_THEME.cardSoft : 'rgba(255, 255, 255, 0.78)' : selectedAnswers[question.id] === optionIndex ? isDarkMode ? 'rgba(255, 196, 124, 0.22)' : '#ffe9b8' : isDarkMode ? QUIZ_THEME.cardSoft : 'rgba(255, 255, 255, 0.78)', borderColor: quizSubmitted ? optionIndex === question.answerIndex ? QUIZ_THEME.accent : selectedAnswers[question.id] === optionIndex ? '#d9644a' : 'rgba(122, 59, 18, 0.15)' : selectedAnswers[question.id] === optionIndex ? QUIZ_THEME.accent : 'rgba(122, 59, 18, 0.15)' }}>
                    {option}
                  </button>
                ))}
              </div>
              {quizSubmitted && question.explanation && <p className="mt-3 text-sm leading-relaxed" style={{ color: isDarkMode ? QUIZ_THEME.muted : '#7a3b12' }}>{selectedAnswers[question.id] === question.answerIndex ? `Correct. ${question.explanation}` : `Teacher's note: ${question.explanation}`}</p>}
            </div>
          ))}
          <div className="flex flex-wrap gap-3 pt-2">
            {!quizSubmitted ? (
              <button type="button" onClick={handleSubmitQuiz} disabled={answeredCount !== totalQuestions} className="rounded-full border px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${QUIZ_THEME.primary}, ${QUIZ_THEME.secondary})`, borderColor: QUIZ_THEME.accent, color: QUIZ_THEME.text }}>
                {answeredCount === totalQuestions ? 'Submit Answers' : `Answer ${totalQuestions - answeredCount} More`}
              </button>
            ) : (
              <button type="button" onClick={() => dispatch(resetQuizSelections())} className="rounded-full border px-5 py-2.5 text-sm font-semibold transition" style={{ backgroundColor: isDarkMode ? QUIZ_THEME.cardSoft : 'rgba(255,255,255,0.65)', borderColor: QUIZ_THEME.accent, color: QUIZ_THEME.text }}>
                Try Again
              </button>
            )}
          </div>
          {quizSubmitted && <div className="rounded-[1.25rem] border px-4 py-4" style={{ background: isDarkMode ? QUIZ_THEME.card : 'rgba(255,255,255,0.6)', borderColor: QUIZ_THEME.accent }}><h4 className="text-base font-semibold">Teacher Feedback: {teacherRating}</h4><p className="mt-2 text-sm leading-relaxed">You scored {correctCount} out of {totalQuestions} ({scorePercent}%).</p><p className="mt-2 text-sm leading-relaxed" style={{ color: isDarkMode ? QUIZ_THEME.muted : '#7a3b12' }}>{teacherGuidance}</p></div>}
          {quiz?.teaching && <div className="rounded-[1.25rem] border px-4 py-4" style={{ background: isDarkMode ? QUIZ_THEME.card : 'rgba(255,255,255,0.6)', borderColor: QUIZ_THEME.secondary }}><h4 className="text-base font-semibold">Teaching Corner: {quiz.teaching.topic || 'Topic Review'}</h4>{quiz.teaching.explanation && <p className="mt-2 text-sm leading-relaxed" style={{ color: isDarkMode ? QUIZ_THEME.muted : '#7a3b12' }}>{quiz.teaching.explanation}</p>}{Array.isArray(quiz.teaching.keyTakeaways) && quiz.teaching.keyTakeaways.length > 0 && <div className="mt-3 space-y-2">{quiz.teaching.keyTakeaways.map((item, index) => <div key={`${item}-${index}`} className="rounded-xl border px-3 py-2 text-sm" style={{ background: isDarkMode ? QUIZ_THEME.cardSoft : 'rgba(255,255,255,0.78)', borderColor: 'rgba(122, 59, 18, 0.15)' }}>{item}</div>)}</div>}{quiz.teaching.studyTip && <p className="mt-3 text-sm font-medium leading-relaxed">Study tip: {quiz.teaching.studyTip}</p>}</div>}
        </div>
      )}
    </div>
  )
}
