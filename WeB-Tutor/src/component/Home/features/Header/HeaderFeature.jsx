import React from 'react'

export default function HeaderFeature({ title, description }) {
  return (
    <div>
      <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">{description}</p>
    </div>
  )
}
