import React from 'react'
import { normalizeSummaryPayload } from '../../homeUtils'
import { useAppSelector } from '../../../../store/hooks'

export default function SummaryFeature() {
  const result = useAppSelector((state) => state.home.result)
  const normalizedSummary = normalizeSummaryPayload(result)
  const summaryParagraphs = [
    normalizedSummary.paragraphs.overview,
    normalizedSummary.paragraphs.coreIdeas,
    normalizedSummary.paragraphs.exploreMore,
  ].filter(Boolean)

  return (
    <>
      {normalizedSummary.timeline.length > 0 && (
        <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--card-strong)] p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-[var(--text)]">Timeline</h3>
          <div className="mt-3 space-y-2">
            {normalizedSummary.timeline.map((item, index) => (
              <div key={`${item.timestamp}-${index}`} className="flex gap-3 text-sm text-[var(--text)]">
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
              <p key={index} className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text)]">
                {paragraph}
              </p>
            ))
          ) : (
            <p className="text-sm leading-relaxed text-[var(--text)]">No summary was returned by the model.</p>
          )}
        </div>
      </div>
    </>
  )
}
