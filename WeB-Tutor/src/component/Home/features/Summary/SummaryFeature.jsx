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
        <div className="rounded-[1.25rem] border border-(--border) bg-(--card-strong) p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-(--text)">Timeline</h3>
          <div className="mt-3 space-y-2">
            {normalizedSummary.timeline.map((item, index) => (
              <div key={`${item.timestamp}-${index}`} className="flex gap-3 text-sm text-(--text)">
                <span className="min-w-16 font-semibold">{item.timestamp}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-[1.25rem] border border-(--border) bg-(--card-strong) p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-(--text)">Summary</h3>
        <div className="mt-3 space-y-3">
          {summaryParagraphs.length > 0 ? (
            summaryParagraphs.map((paragraph, index) => (
              <p key={index} className="whitespace-pre-wrap text-sm leading-relaxed text-(--text)">
                {paragraph}
              </p>
            ))
          ) : (
            <p className="text-sm leading-relaxed text-(--text)">No summary was returned by the model.</p>
          )}
        </div>
      </div>

      {normalizedSummary.topics.length > 0 && (
        <div className="rounded-[1.25rem] border border-(--border) bg-(--card-strong) p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-(--text)">Topic-Wise Breakdown</h3>
          <div className="mt-4 grid gap-3">
            {normalizedSummary.topics.map((topic) => (
              <div key={topic.id || topic.title} className="rounded-[1.1rem] border border-(--border) bg-(--card) p-4">
                <h4 className="text-sm font-semibold text-(--text)">{topic.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-(--text)">{topic.summary}</p>
                {Array.isArray(topic.keyPoints) && topic.keyPoints.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {topic.keyPoints.map((point, index) => (
                      <p key={`${topic.id || topic.title}-${index}`} className="rounded-xl border border-(--border) bg-(--card-strong) px-3 py-2 text-xs text-(--text)">
                        {point}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
