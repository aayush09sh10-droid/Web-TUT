import React from 'react'
import { DARK_TEACHING_THEME, LIGHT_TEACHING_THEME } from '../../homeTheme'
import { setHomeField } from '../../store/homeSlice'
import { useAppDispatch, useAppSelector } from '../../../../store/hooks'

function renderVisualAidItems(items, type, theme, isDarkMode) {
  const baseClassName =
    'rounded-xl border px-3 py-3 text-sm font-medium text-center leading-relaxed'
  const baseStyle = {
    background: isDarkMode ? theme.cardSoft : 'rgba(245,248,255,0.95)',
    borderColor: 'rgba(29, 41, 87, 0.1)',
    color: isDarkMode ? theme.text : '#294176',
  }

  if (type === 'comparison') {
    return (
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {items.map((item, index) => (
          <div key={`${item}-${index}`} className={baseClassName} style={baseStyle}>
            {item}
          </div>
        ))}
      </div>
    )
  }

  if (type === 'layers') {
    return (
      <div className="mt-3 space-y-2">
        {items.map((item, index) => (
          <div
            key={`${item}-${index}`}
            className={baseClassName}
            style={{
              ...baseStyle,
              marginLeft: `${index * 8}px`,
              marginRight: `${index * 8}px`,
            }}
          >
            {item}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="mt-3 grid gap-3">
      {items.map((item, index) => (
        <div key={`${item}-${index}`} className="grid gap-3">
          <div className={baseClassName} style={baseStyle}>
            {item}
          </div>
          {index < items.length - 1 ? (
            <div
              className="mx-auto flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold"
              style={{
                background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                borderColor: theme.accent,
                color: isDarkMode ? theme.text : '#294176',
              }}
            >
              {type === 'cycle' ? '↺' : '↓'}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function VisualAidCard({ visualAid, theme, isDarkMode }) {
  if (!visualAid?.needed || !Array.isArray(visualAid.items) || visualAid.items.length < 2) {
    return null
  }

  return (
    <div
      className="mt-4 rounded-[1.2rem] border px-4 py-4"
      style={{
        background: isDarkMode
          ? 'linear-gradient(135deg, rgba(116,147,230,0.18), rgba(255,255,255,0.03))'
          : 'linear-gradient(135deg, rgba(223,234,255,0.85), rgba(255,255,255,0.95))',
        borderColor: theme.accent,
      }}
    >
      <h5
        className="text-sm font-semibold uppercase tracking-[0.12em]"
        style={{ color: isDarkMode ? '#b8cbff' : '#5b6ea5' }}
      >
        Visual Study Guide
      </h5>
      <p className="mt-2 text-base font-semibold" style={{ color: isDarkMode ? theme.text : '#233567' }}>
        {visualAid.title}
      </p>
      {renderVisualAidItems(visualAid.items, visualAid.type, theme, isDarkMode)}
      {visualAid.caption ? (
        <p className="mt-3 text-sm leading-relaxed" style={{ color: isDarkMode ? theme.muted : '#41558c' }}>
          {visualAid.caption}
        </p>
      ) : null}
    </div>
  )
}

function SectionHeading({ children, color }) {
  return (
    <h5 className="text-sm font-semibold uppercase tracking-[0.12em]" style={{ color }}>
      {children}
    </h5>
  )
}

export default function TeachingFeature({ onRegenerate, onGenerate }) {
  const dispatch = useAppDispatch()
  const isDarkMode = useAppSelector((state) => state.auth.theme === 'dark')
  const theme = isDarkMode ? DARK_TEACHING_THEME : LIGHT_TEACHING_THEME
  const { teachingLoading, teachingError, result, activeTopicId } = useAppSelector((state) => state.home)
  const teaching = result?.teaching
  const activeTopic =
    teaching?.topics?.find((topic) => topic.id === activeTopicId) || teaching?.topics?.[0] || null
  const sectionLabelColor = isDarkMode ? '#9fb3e8' : '#5b6ea5'

  return (
    <div
      className="rounded-[1.75rem] border p-4 shadow-[0_20px_48px_rgba(96,112,255,0.14)] sm:p-5"
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.primary,
        color: theme.text,
        backgroundImage: isDarkMode
          ? `radial-gradient(circle at top right, rgba(166,196,255,0.14), transparent 28%), linear-gradient(135deg, ${theme.surface}, rgba(18,24,44,0.98))`
          : `radial-gradient(circle at top right, rgba(255,255,255,0.82), transparent 28%), linear-gradient(135deg, ${theme.surface}, #eef5ff)`,
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold sm:text-xl">{teaching?.title || 'Interactive Teaching Studio'}</h3>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: isDarkMode ? theme.muted : '#41558c' }}>
            Learn topic by topic with a richer study path. Each part can now explain why the concept matters,
            what to study next, and show a visual learning guide when it helps.
          </p>
        </div>
        {teaching ? (
          <button
            type="button"
            onClick={onRegenerate}
            disabled={teachingLoading}
            className="rounded-full border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: isDarkMode ? theme.cardSoft : 'rgba(255,255,255,0.72)',
              borderColor: theme.accent,
              color: theme.text,
            }}
          >
            {teachingLoading ? 'Regenerating...' : 'Regenerate'}
          </button>
        ) : null}
      </div>

      {teachingError ? (
        <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {teachingError}
        </p>
      ) : null}

      {!teachingLoading && !teaching && !teachingError ? (
        <div className="mt-4">
          <p className="text-sm leading-relaxed">
            Open the teaching tab whenever you want, then generate the lesson flow only when you are ready.
          </p>
          <button
            type="button"
            onClick={onGenerate}
            className="mt-3 rounded-full border px-4 py-2 text-sm font-semibold transition"
            style={{
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
              borderColor: theme.accent,
              color: theme.text,
            }}
          >
            Generate Teaching
          </button>
        </div>
      ) : null}

      {teachingLoading ? <p className="mt-4 text-sm font-medium">Preparing your teaching path...</p> : null}

      {teaching?.intro ? (
        <div
          className="mt-5 rounded-[1.25rem] border px-4 py-4"
          style={{
            background: isDarkMode ? theme.card : 'rgba(255,255,255,0.66)',
            borderColor: theme.secondary,
          }}
        >
          <p className="text-sm leading-relaxed" style={{ color: isDarkMode ? theme.muted : '#41558c' }}>
            {teaching.intro}
          </p>
        </div>
      ) : null}

      {teaching?.topics?.length > 0 ? (
        <div className="mt-5 grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="space-y-3">
            {teaching.topics.map((topic, index) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => dispatch(setHomeField({ field: 'activeTopicId', value: topic.id }))}
                className="block w-full rounded-[1.15rem] border px-4 py-3 text-left text-sm font-semibold transition"
                style={{
                  background:
                    activeTopic?.id === topic.id
                      ? `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
                      : isDarkMode
                        ? theme.cardSoft
                        : 'rgba(255,255,255,0.72)',
                  borderColor:
                    activeTopic?.id === topic.id ? theme.accent : 'rgba(29, 41, 87, 0.12)',
                  color: activeTopic?.id === topic.id ? theme.text : isDarkMode ? '#dbe5ff' : '#2e4274',
                }}
              >
                Part {index + 1}: {topic.title}
              </button>
            ))}
          </div>

          {activeTopic ? (
            <div
              className="rounded-[1.5rem] border px-4 py-4 sm:px-5 sm:py-5"
              style={{
                background: isDarkMode ? theme.card : 'rgba(255,255,255,0.74)',
                borderColor: theme.secondary,
              }}
            >
              <h4 className="text-lg font-semibold">{activeTopic.title}</h4>

              {activeTopic.summary ? (
                <p
                  className="mt-2 rounded-xl border px-3 py-3 text-sm leading-relaxed"
                  style={{
                    background: isDarkMode ? theme.cardSoft : 'rgba(238,245,255,0.9)',
                    borderColor: 'rgba(29, 41, 87, 0.1)',
                    color: isDarkMode ? theme.muted : '#41558c',
                  }}
                >
                  {activeTopic.summary}
                </p>
              ) : null}

              {activeTopic.whyItMatters ? (
                <div
                  className="mt-4 rounded-[1.2rem] border px-4 py-4"
                  style={{
                    background: isDarkMode
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(91,116,189,0.1))'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(232,240,255,0.92))',
                    borderColor: 'rgba(29, 41, 87, 0.1)',
                  }}
                >
                  <SectionHeading color={sectionLabelColor}>Why It Matters</SectionHeading>
                  <p className="mt-2 text-sm leading-6" style={{ color: isDarkMode ? theme.text : '#233567' }}>
                    {activeTopic.whyItMatters}
                  </p>
                </div>
              ) : null}

              <div
                className="mt-4 rounded-[1.2rem] border px-4 py-4"
                style={{
                  background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.92)',
                  borderColor: 'rgba(29, 41, 87, 0.1)',
                }}
              >
                <SectionHeading color={sectionLabelColor}>Lesson</SectionHeading>
                <p
                  className="mt-2 whitespace-pre-wrap text-sm leading-6 sm:leading-7"
                  style={{ color: isDarkMode ? theme.text : '#233567' }}
                >
                  {activeTopic.lesson}
                </p>
              </div>

              {Array.isArray(activeTopic.steps) && activeTopic.steps.length > 0 ? (
                <div className="mt-4">
                  <SectionHeading color={sectionLabelColor}>Learning Path</SectionHeading>
                  <div className="mt-3 space-y-3">
                    {activeTopic.steps.map((step, index) => (
                      <div
                        key={`${step}-${index}`}
                        className="flex gap-3 rounded-xl border px-3 py-3 text-sm"
                        style={{
                          background: isDarkMode ? theme.cardSoft : 'rgba(245,248,255,0.95)',
                          borderColor: 'rgba(29, 41, 87, 0.1)',
                          color: isDarkMode ? theme.text : '#2b3f74',
                        }}
                      >
                        <div
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                          style={{
                            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                            color: theme.text,
                          }}
                        >
                          {index + 1}
                        </div>
                        <p className="leading-6">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <VisualAidCard visualAid={activeTopic.visualAid} theme={theme} isDarkMode={isDarkMode} />

              {Array.isArray(activeTopic.notes) && activeTopic.notes.length > 0 ? (
                <div className="mt-4">
                  <SectionHeading color={sectionLabelColor}>Notes</SectionHeading>
                  <div className="mt-3 space-y-2">
                    {activeTopic.notes.map((note, index) => (
                      <div
                        key={`${note}-${index}`}
                        className="rounded-xl border px-3 py-3 text-sm"
                        style={{
                          background: isDarkMode ? theme.cardSoft : 'rgba(245,248,255,0.95)',
                          borderColor: 'rgba(29, 41, 87, 0.1)',
                          color: isDarkMode ? theme.text : '#2b3f74',
                        }}
                      >
                        {note}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {activeTopic.practiceTask ? (
                <div
                  className="mt-4 rounded-[1.2rem] border px-4 py-4"
                  style={{
                    background: isDarkMode
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(80,111,195,0.14))'
                      : 'linear-gradient(135deg, rgba(239,245,255,0.9), rgba(255,255,255,0.96))',
                    borderColor: theme.secondary,
                  }}
                >
                  <SectionHeading color={sectionLabelColor}>Practice</SectionHeading>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: isDarkMode ? theme.text : '#233567' }}>
                    {activeTopic.practiceTask}
                  </p>
                </div>
              ) : null}

              {activeTopic.reflectionQuestion ? (
                <div
                  className="mt-4 rounded-[1.2rem] border px-4 py-4"
                  style={{
                    background: isDarkMode
                      ? 'linear-gradient(135deg, rgba(91,116,189,0.24), rgba(255,255,255,0.03))'
                      : 'linear-gradient(135deg, rgba(204,221,255,0.5), rgba(255,255,255,0.9))',
                    borderColor: theme.accent,
                  }}
                >
                  <SectionHeading color={sectionLabelColor}>Reflect</SectionHeading>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: isDarkMode ? theme.text : '#233567' }}>
                    {activeTopic.reflectionQuestion}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
