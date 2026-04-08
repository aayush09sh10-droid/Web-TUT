import React from 'react'
import { useAppDispatch, useAppSelector } from '../../../../store/hooks'
import { setHomeField } from '../../store/homeSlice'
import { MAX_PHOTO_UPLOADS, formatUploadNames } from '../../utils/studyUploadUtils'

export default function PasteLinkFeature({ canClose, handleClose, handleStudyFilesChange, handleSubmit }) {
  const dispatch = useAppDispatch()
  const { inputMode, url, studyUploads, askPrompt, loading, error } = useAppSelector((state) => state.home)
  const isDarkMode = useAppSelector((state) => state.auth.theme === 'dark')

  function switchInputMode(nextMode) {
    dispatch(
      setHomeField({
        field: 'inputMode',
        value: nextMode,
      })
    )

    dispatch(setHomeField({ field: 'error', value: '' }))

    if (nextMode === 'video') {
      dispatch(setHomeField({ field: 'studyUploads', value: [] }))
      dispatch(setHomeField({ field: 'askPrompt', value: '' }))
      return
    }

    dispatch(setHomeField({ field: 'url', value: '' }))
    dispatch(setHomeField({ field: 'studyUploads', value: [] }))
    if (nextMode !== 'ask') {
      dispatch(setHomeField({ field: 'askPrompt', value: '' }))
    }
  }

  const uploadHint =
    inputMode === 'photos'
      ? formatUploadNames(
          studyUploads,
          `Choose up to ${MAX_PHOTO_UPLOADS} photos of handwritten or typed notes.`
        )
      : formatUploadNames(
          studyUploads,
          'Upload PDF, PPTX, text, CSV, JSON, markdown, or image files to summarize them.'
        )

  return (
    <form
      className="mt-5 rounded-[1.75rem] border border-(--border) p-3 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:mt-6 sm:p-4"
      style={{ background: isDarkMode ? 'rgba(17,17,17,0.82)' : 'rgba(255,255,255,0.52)' }}
      onSubmit={handleSubmit}
    >
      <div className="mb-3 grid gap-2 sm:inline-flex sm:grid-cols-none">
        <button type="button" onClick={() => switchInputMode('video')} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${inputMode === 'video' ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)]' : 'border-(--border) bg-(--card) text-(--text)'}`}>
          YouTube Link
        </button>
        <button type="button" onClick={() => switchInputMode('photos')} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${inputMode === 'photos' ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)]' : 'border-(--border) bg-(--card) text-(--text)'}`}>
          Photos
        </button>
        <button type="button" onClick={() => switchInputMode('files')} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${inputMode === 'files' ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)]' : 'border-(--border) bg-(--card) text-(--text)'}`}>
          Files
        </button>
        <button type="button" onClick={() => switchInputMode('ask')} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${inputMode === 'ask' ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)]' : 'border-(--border) bg-(--card) text-(--text)'}`}>
          Ask AI
        </button>
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
        {inputMode === 'video' ? (
          <input value={url} onChange={(e) => dispatch(setHomeField({ field: 'url', value: e.target.value }))} placeholder="https://www.youtube.com/watch?v=..." className="flex-1 rounded-[1.1rem] border border-(--border) bg-(--card-strong) px-4 py-3 text-sm text-(--text) shadow-sm focus:border-[var(--accent-2)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(99,102,241,0.12)]" />
        ) : inputMode === 'ask' ? (
          <textarea
            value={askPrompt}
            onChange={(e) => dispatch(setHomeField({ field: 'askPrompt', value: e.target.value }))}
            placeholder="Ask anything you want to learn. Example: Teach me recursion from beginner to advanced."
            rows={4}
            className="flex-1 rounded-[1.1rem] border border-(--border) bg-(--card-strong) px-4 py-3 text-sm text-(--text) shadow-sm focus:border-[var(--accent-2)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(99,102,241,0.12)]"
          />
        ) : (
          <label className="flex flex-1 cursor-pointer flex-col justify-center rounded-[1.1rem] border border-(--border) bg-(--card-strong) px-4 py-3 text-sm text-(--text) shadow-sm">
            <span className="font-medium">{inputMode === 'photos' ? 'Upload study photos' : 'Upload study files'}</span>
            <span className="mt-1 text-xs text-(--muted)">{uploadHint}</span>
            <input
              type="file"
              accept={inputMode === 'photos' ? 'image/*' : '.pdf,.pptx,.txt,.md,.markdown,.csv,.json,.xml,image/*,text/*'}
              multiple
              onChange={handleStudyFilesChange}
              className="mt-3 text-xs text-(--muted) file:mr-3 file:rounded-full file:border-0 file:bg-[var(--text)] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[var(--bg)]"
            />
          </label>
        )}

        <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center rounded-[1.1rem] px-6 py-3 text-sm font-semibold text-(--text) shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}>
          {loading
            ? inputMode === 'ask'
              ? 'Building Learning Path...'
              : 'Summarizing...'
            : inputMode === 'video'
              ? 'Summarize Video'
            : inputMode === 'ask'
                ? 'Create Learning Path'
              : inputMode === 'photos'
                ? 'Summarize Photos'
                : 'Summarize Files'}
        </button>

        {canClose ? (
          <button type="button" onClick={handleClose} className="inline-flex h-[48px] w-full items-center justify-center rounded-[1.1rem] border border-(--border) bg-(--card-strong) px-4 text-base font-semibold text-(--text) shadow-sm transition hover:scale-105 sm:w-[48px]" aria-label="Close upload box">
            x
          </button>
        ) : null}
      </div>

      {error && <div className="mt-3"><p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">{error}</p></div>}
    </form>
  )
}
