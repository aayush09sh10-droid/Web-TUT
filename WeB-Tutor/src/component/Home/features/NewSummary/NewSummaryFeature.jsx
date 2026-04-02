import React from 'react'

export default function NewSummaryFeature({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-full border px-5 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 sm:w-auto"
      style={{
        background: 'rgba(255,255,255,0.7)',
        borderColor: 'var(--border)',
        color: 'var(--text)',
      }}
    >
      New Summary
    </button>
  )
}
