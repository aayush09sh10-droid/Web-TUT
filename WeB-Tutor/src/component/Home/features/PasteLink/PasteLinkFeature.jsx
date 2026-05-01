import React from 'react'
import { useAppDispatch, useAppSelector } from '../../../../store/hooks'
import { setHomeField } from '../../store/homeSlice'
import { MAX_PHOTO_UPLOADS, formatUploadNames } from '../../utils/studyUploadUtils'

export default function PasteLinkFeature({ canClose, handleClose, handleStudyFilesChange, handleSubmit }) {
  const dispatch = useAppDispatch()
  const { inputMode, url, studyUploads, askPrompt, loading, error } =
    useAppSelector((state) => state.home)
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
  const photoCountText =
    inputMode === 'photos'
      ? `${studyUploads.length}/${MAX_PHOTO_UPLOADS} photos added`
      : `${studyUploads.length} file${studyUploads.length === 1 ? '' : 's'} added`

  const softActionButtonClass =
    'border-[rgba(99,102,241,0.18)] bg-[linear-gradient(135deg,rgba(99,102,241,0.12),rgba(56,189,248,0.1))] text-(--text) shadow-[0_10px_24px_rgba(99,102,241,0.08)] hover:-translate-y-0.5 hover:border-[rgba(99,102,241,0.32)] hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.18),rgba(56,189,248,0.16))]'
  const activeModeClass =
    'border-[rgba(99,102,241,0.28)] bg-[linear-gradient(135deg,rgba(99,102,241,0.16),rgba(56,189,248,0.14))] text-(--text) shadow-[0_10px_24px_rgba(99,102,241,0.08)]'
  const submitButtonLabel = loading
    ? inputMode === 'ask'
      ? 'Thinking...'
      : 'Summarizing...'
    : inputMode === 'video'
      ? 'Summarize Video'
      : inputMode === 'ask'
        ? 'Ask Web-Tut'
        : inputMode === 'photos'
          ? 'Summarize'
          : 'Summarize'

  return (
    <form
      className="mt-5 rounded-[1.75rem] border border-(--border) p-3 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:mt-6 sm:p-4"
      style={{ background: isDarkMode ? 'rgba(17,17,17,0.82)' : 'rgba(255,255,255,0.52)' }}
      onSubmit={handleSubmit}
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <button type="button" aria-pressed={inputMode === 'video'} onClick={() => switchInputMode('video')} className={`pressable-control rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:py-2 sm:text-sm ${inputMode === 'video' ? `${activeModeClass} is-selected` : 'border-(--border) bg-(--card) text-(--text) hover:-translate-y-0.5'}`}>
          Video
        </button>
        <button type="button" aria-pressed={inputMode === 'photos'} onClick={() => switchInputMode('photos')} className={`pressable-control rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:py-2 sm:text-sm ${inputMode === 'photos' ? `${activeModeClass} is-selected` : 'border-(--border) bg-(--card) text-(--text) hover:-translate-y-0.5'}`}>
          Photos
        </button>
        <button type="button" aria-pressed={inputMode === 'files'} onClick={() => switchInputMode('files')} className={`pressable-control rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:py-2 sm:text-sm ${inputMode === 'files' ? `${activeModeClass} is-selected` : 'border-(--border) bg-(--card) text-(--text) hover:-translate-y-0.5'}`}>
          Files
        </button>
        <button type="button" aria-pressed={inputMode === 'ask'} onClick={() => switchInputMode('ask')} className={`pressable-control rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:py-2 sm:text-sm ${inputMode === 'ask' ? `${activeModeClass} is-selected` : 'border-(--border) bg-(--card) text-(--text) hover:-translate-y-0.5'}`}>
          Ask Web-Tut
        </button>
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
        {inputMode === 'video' ? (
          <input value={url} onChange={(e) => dispatch(setHomeField({ field: 'url', value: e.target.value }))} placeholder="https://www.youtube.com/watch?v=..." className="flex-1 rounded-[1.1rem] border border-(--border) bg-[var(--input-bg)] px-4 py-3 text-sm text-(--text) shadow-sm focus:border-[var(--accent-2)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(99,102,241,0.12)]" />
        ) : inputMode === 'ask' ? (
          <textarea
            value={askPrompt}
            onChange={(e) => dispatch(setHomeField({ field: 'askPrompt', value: e.target.value }))}
            placeholder="Ask Web-Tut anything you want to learn. Example: Teach me recursion from beginner to advanced."
            rows={4}
            className="flex-1 rounded-[1.1rem] border border-(--border) bg-[var(--input-bg)] px-4 py-3 text-sm text-(--text) shadow-sm focus:border-[var(--accent-2)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(99,102,241,0.12)]"
          />
        ) : (
          <label className="flex flex-1 cursor-pointer flex-col justify-center rounded-[1.1rem] border border-(--border) bg-[var(--input-bg)] px-4 py-3 text-sm text-(--text) shadow-sm">
            <span className="font-medium">{inputMode === 'photos' ? 'Upload study photos' : 'Upload study files'}</span>
            <span className="mt-1 text-xs text-(--muted)">{uploadHint}</span>
            <span className="mt-1 text-xs font-medium text-(--text)">{photoCountText}</span>
            <input
              type="file"
              accept={inputMode === 'photos' ? 'image/*' : '.pdf,.pptx,.txt,.md,.markdown,.csv,.json,.xml,image/*,text/*'}
              multiple
              onChange={handleStudyFilesChange}
              className="mt-3 text-xs text-(--muted) file:mr-3 file:rounded-full file:border-0 file:bg-[var(--text)] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[var(--bg)]"
            />
          </label>
        )}

        <button type="submit" disabled={loading} className={`pressable-control inline-flex w-auto self-start items-center justify-center rounded-[1.1rem] border px-4 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:px-6 sm:py-3 sm:text-sm ${softActionButtonClass}`}>
          {submitButtonLabel}
        </button>

        {canClose ? (
          <button type="button" onClick={handleClose} className="pressable-control inline-flex h-[40px] w-[40px] items-center justify-center rounded-[1.1rem] border border-(--border) bg-(--card-strong) px-3 text-sm font-semibold text-(--text) shadow-sm transition sm:h-[48px] sm:w-[48px] sm:text-base" aria-label="Close upload box">
            x
          </button>
        ) : null}
      </div>

      {error && <div className="mt-3"><p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">{error}</p></div>}
    </form>
  )
}
