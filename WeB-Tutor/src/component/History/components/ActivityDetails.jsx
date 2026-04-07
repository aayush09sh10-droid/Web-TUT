import React from 'react'
import { clearSelectedHistoryItem } from '../store/historySlice'
import { useAppDispatch } from '../../../store/hooks'
import HistoryDoubtCard from './HistoryDoubtCard'

export default function ActivityDetails({
  selectedResult,
  selectedTopicTitles,
  normalizedSummary,
  summaryParagraphs,
  quiz,
  teaching,
  doubt,
}) {
  const dispatch = useAppDispatch()

  if (!selectedResult) {
    return (
      <div className="rounded-[1.6rem] border border-(--border) bg-(--card) p-4 text-sm text-(--text) shadow-(--shadow) backdrop-blur-xl sm:p-6">
        Select an activity item to view its full learning session.
      </div>
    )
  }

  return (
    <div className="rounded-[1.6rem] border border-(--border) bg-(--card) p-4 shadow-(--shadow) backdrop-blur-xl sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Learning details</h3>
          <p className="mt-2 text-sm text-(--muted)">
            Everything you explored in this study session is saved below.
          </p>
        </div>
        <button
          type="button"
          onClick={() => dispatch(clearSelectedHistoryItem())}
          aria-label="Close learning details"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-(--border) bg-(--card-strong) text-lg font-semibold text-(--text) transition hover:-translate-y-0.5"
        >
          x
        </button>
      </div>

      {selectedTopicTitles.length > 0 && (
        <div className="mt-4 rounded-[1.2rem] border border-(--border) bg-(--card-strong) p-4">
          <h4 className="text-base font-semibold text-(--text)">What you have learnt</h4>
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedTopicTitles.map((topic) => (
              <span key={topic} className="rounded-full border border-(--border) bg-(--card) px-3 py-2 text-sm text-(--text)">
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 rounded-[1.2rem] border border-(--border) bg-(--card-strong) p-4">
        <h4 className="text-base font-semibold text-(--text)">{normalizedSummary.title}</h4>
        {normalizedSummary.timeline.length > 0 && (
          <div className="mt-4 space-y-2 border-b border-(--border) pb-4">
            <h5 className="text-sm font-semibold text-(--text)">Timeline</h5>
            {normalizedSummary.timeline.map((item, index) => (
              <div key={`${item.timestamp}-${index}`} className="flex flex-col gap-1 text-sm text-(--text) sm:flex-row sm:gap-3">
                <span className="font-semibold sm:min-w-16">{item.timestamp}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 space-y-3">
          {summaryParagraphs.length > 0 ? (
            summaryParagraphs.map((paragraph, index) => (
              <p key={index} className="whitespace-pre-wrap text-sm leading-relaxed text-(--text)">
                {paragraph}
              </p>
            ))
          ) : (
            <p className="text-sm leading-relaxed text-(--text)">No summary was available for this item.</p>
          )}
        </div>
      </div>

      {quiz?.questions?.length > 0 && (
        <div className="mt-4 rounded-[1.2rem] border border-(--border) bg-(--card-strong) p-4">
          <h4 className="text-base font-semibold text-(--text)">{quiz.title || 'Saved Quiz'}</h4>
          <div className="mt-4 space-y-4">
            {quiz.questions.map((question, index) => (
              <div key={question.id || index} className="rounded-2xl border border-(--border) bg-(--card) p-4">
                <p className="text-sm font-semibold text-(--text)">{index + 1}. {question.question}</p>
                <div className="mt-3 space-y-2">
                  {question.options?.map((option, optionIndex) => (
                    <div key={`${question.id || index}-${optionIndex}`} className={`rounded-xl border px-3 py-2 text-sm ${question.answerIndex === optionIndex ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : 'border-(--border) bg-(--card-strong) text-(--text)'}`}>
                      {option}
                    </div>
                  ))}
                </div>
                {question.explanation && <p className="mt-3 text-xs leading-relaxed text-(--muted)">Explanation: {question.explanation}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {teaching?.topics?.length > 0 && (
        <div className="mt-4 rounded-[1.2rem] border border-(--border) bg-(--card-strong) p-4">
          <h4 className="text-base font-semibold text-(--text)">{teaching.title || 'Teaching Path'}</h4>
          {teaching.intro && <p className="mt-2 text-sm leading-relaxed text-(--muted)">{teaching.intro}</p>}
          <div className="mt-4 space-y-4">
            {teaching.topics.map((topic, index) => (
              <div key={topic.id || index} className="rounded-2xl border border-(--border) bg-(--card) p-4">
                <p className="text-sm font-semibold text-(--text)">{topic.title}</p>
                {topic.summary && <p className="mt-2 text-sm leading-relaxed text-(--muted)">{topic.summary}</p>}
                {topic.lesson && <p className="mt-3 text-sm leading-relaxed text-(--text)">{topic.lesson}</p>}
                {Array.isArray(topic.notes) && topic.notes.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {topic.notes.map((note, noteIndex) => (
                      <p key={`${topic.id || index}-note-${noteIndex}`} className="rounded-xl border border-(--border) bg-(--card-strong) px-3 py-2 text-sm text-(--text)">
                        {note}
                      </p>
                    ))}
                  </div>
                )}
                {topic.reflectionQuestion && <p className="mt-3 text-xs font-medium text-(--muted)">Reflection: {topic.reflectionQuestion}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <HistoryDoubtCard doubt={doubt} />
    </div>
  )
}
