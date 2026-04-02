import React from 'react'

export default function LearningDoubtCard({ doubt }) {
  if (!doubt?.answer) {
    return (
      <p className="mt-3 text-sm text-[var(--muted)]">
        No doubt explanation was saved for this lesson.
      </p>
    )
  }

  return (
    <>
      {doubt.question && (
        <p className="mt-3 text-sm text-[var(--muted)]">Your doubt: {doubt.question}</p>
      )}
      <p className="mt-3 text-sm font-semibold text-[var(--text)]">
        {doubt.answer.title || 'Saved explanation'}
      </p>
      {doubt.answer.concept && (
        <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Concept</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">{doubt.answer.concept}</p>
        </div>
      )}
      {(doubt.answer.mainBody || doubt.answer.explanation) && (
        <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">
          {doubt.answer.mainBody || doubt.answer.explanation}
        </p>
      )}
      {Array.isArray(doubt.answer.steps) && doubt.answer.steps.length > 0 && (
        <div className="mt-3 space-y-2">
          {doubt.answer.steps.map((step, index) => (
            <p
              key={`${step}-${index}`}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)]"
            >
              Step {index + 1}: {step}
            </p>
          ))}
        </div>
      )}
      {doubt.answer.numerical?.isNumerical && (
        <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Numerical Solution</p>
          {doubt.answer.numerical.formulaUsed && (
            <p className="mt-2 text-sm text-[var(--text)]">
              Formula used: {doubt.answer.numerical.formulaUsed}
            </p>
          )}
          {Array.isArray(doubt.answer.numerical.steps) && doubt.answer.numerical.steps.length > 0 && (
            <div className="mt-3 space-y-2">
              {doubt.answer.numerical.steps.map((step, index) => (
                <div
                  key={`${step.label}-${index}`}
                  className="rounded-xl border border-[var(--border)] bg-[var(--card-strong)] px-3 py-2"
                >
                  <p className="text-sm font-semibold text-[var(--text)]">{step.label}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--text)]">{step.detail}</p>
                </div>
              ))}
            </div>
          )}
          {doubt.answer.numerical.finalAnswer && (
            <p className="mt-3 text-sm font-medium text-[var(--text)]">
              Final answer: {doubt.answer.numerical.finalAnswer}
            </p>
          )}
        </div>
      )}
      {doubt.answer.code?.snippet && (
        <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Code {doubt.answer.code.language ? `(${doubt.answer.code.language})` : ''}
          </p>
          <pre className="mt-3 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card-strong)] px-3 py-3 text-xs leading-6 text-[var(--text)]">
            <code>{doubt.answer.code.snippet}</code>
          </pre>
          {doubt.answer.code.explanation && (
            <p className="mt-3 text-sm leading-relaxed text-[var(--text)]">
              {doubt.answer.code.explanation}
            </p>
          )}
        </div>
      )}
      {doubt.answer.conclusion && (
        <p className="mt-3 text-sm leading-relaxed text-[var(--text)]">
          Conclusion: {doubt.answer.conclusion}
        </p>
      )}
      {doubt.answer.realLifeExample && (
        <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">
          Real-life example: {doubt.answer.realLifeExample}
        </p>
      )}
    </>
  )
}
