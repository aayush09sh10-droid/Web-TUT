import React from 'react'

export default function NewSummaryFeature({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pressable-control w-auto rounded-full border px-4 py-2 text-xs font-semibold transition hover:-translate-y-0.5 sm:px-5 sm:py-2.5 sm:text-sm"
      style={{
        background: 'rgba(255,255,255,0.7)',
        borderColor: 'var(--border)',
        color: 'var(--text)',
      }}
    >
      New
    </button>
  )
}
