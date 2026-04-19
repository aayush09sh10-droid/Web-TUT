import React from 'react'

export default function HeaderFeature({ title, description }) {
  return (
    <div className="pr-1">
      <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl lg:text-3xl">{title}</h2>
      <p className="mt-1.5 max-w-2xl text-sm leading-6 text-(--muted) lg:mt-2 lg:leading-relaxed">{description}</p>
    </div>
  )
}
