import React, { useState } from 'react'

export default function SummaryTabs({ result }) {
  const [view, setView] = useState('topics')

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'topics', label: 'Topics' },
          { key: 'timeline', label: 'Timeline' },
          { key: 'summary', label: 'Summary' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setView(tab.key)}
            className={`rounded-full px-4 py-2 text-xs font-medium transition ${
              view === tab.key
                ? 'bg-[var(--text)] text-[var(--bg)]'
                : 'bg-[var(--bg)] text-[var(--text)] border border-[var(--text)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {view === 'topics' && (
          <div>
            <h4 className="text-sm font-semibold text-[var(--text)]">Main topics covered</h4>
            <ul className="mt-2 list-disc list-inside text-sm text-[var(--text)]">
              {result.topics?.map((topic, idx) => (
                <li key={idx}>{topic}</li>
              ))}
            </ul>
          </div>
        )}

        {view === 'timeline' && (
          <div>
            <h4 className="text-sm font-semibold text-[var(--text)]">Important timeline</h4>
            <ol className="mt-2 list-decimal list-inside text-sm text-[var(--text)]">
              {result.timeline?.map((line, idx) => (
                <li key={idx}>{line}</li>
              ))}
            </ol>
          </div>
        )}

        {view === 'summary' && (
          <div>
            <h4 className="text-sm font-semibold text-[var(--text)]">Detailed summary</h4>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text)]">
              {result.detailedSummary}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
