import React from 'react'
import { setHomeField } from '../../store/homeSlice'
import { useAppDispatch, useAppSelector } from '../../../../store/hooks'
import { useEffect } from 'react';


export default function PasteLinkFeature({ handleNotesFileChange, handleSubmit }) {
  const dispatch = useAppDispatch()
  const { inputMode, url, notesImage, loading, error } = useAppSelector((state) => state.home)
  const isDarkMode = useAppSelector((state) => state.auth.theme === 'dark')

  return (
    <form
      className="mt-5 rounded-[1.75rem] border border-[var(--border)] p-3 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:mt-6 sm:p-4"
      style={{ background: isDarkMode ? 'rgba(17,17,17,0.82)' : 'rgba(255,255,255,0.52)' }}
      onSubmit={handleSubmit}
    >
      <div className="mb-3 grid gap-2 sm:inline-flex sm:grid-cols-none">
        <button type="button" onClick={() => dispatch(setHomeField({ field: 'inputMode', value: 'video' }))} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${inputMode === 'video' ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)]' : 'border-[var(--border)] bg-[var(--card)] text-[var(--text)]'}`}>
          YouTube Link
        </button>
        <button type="button" onClick={() => dispatch(setHomeField({ field: 'inputMode', value: 'notes' }))} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${inputMode === 'notes' ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)]' : 'border-[var(--border)] bg-[var(--card)] text-[var(--text)]'}`}>
          Notes Photo
        </button>
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
        {inputMode === 'video' ? (
          <input value={url} onChange={(e) => dispatch(setHomeField({ field: 'url', value: e.target.value }))} placeholder="https://www.youtube.com/watch?v=..." className="flex-1 rounded-[1.1rem] border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm text-[var(--text)] shadow-sm focus:border-[var(--accent-2)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(99,102,241,0.12)]" />
        ) : (
          <label className="flex flex-1 cursor-pointer flex-col justify-center rounded-[1.1rem] border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm text-[var(--text)] shadow-sm">
            <span className="font-medium">Upload notes photo</span>
            <span className="mt-1 text-xs text-[var(--muted)]">{notesImage?.fileName || 'Choose a clear image of your handwritten or typed notes.'}</span>
            <input type="file" accept="image/*" onChange={handleNotesFileChange} className="mt-3 text-xs text-[var(--muted)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--text)] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[var(--bg)]" />
          </label>
        )}

        <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center rounded-[1.1rem] px-6 py-3 text-sm font-semibold text-[var(--text)] shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}>
          {loading ? 'Summarizing...' : inputMode === 'video' ? 'Summarize Video' : 'Summarize Notes'}
        </button>

        <button type="button" onClick={() => dispatch(setHomeField({ field: 'showComposer', value: false }))} className="inline-flex h-[48px] w-full items-center justify-center rounded-[1.1rem] border border-[var(--border)] bg-[var(--card-strong)] text-base font-semibold text-[var(--text)] shadow-sm transition hover:scale-105 sm:w-[48px]" aria-label="Close paste link box">
          ×
        </button>
      </div>

      {error && <div className="mt-3"><p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">{error}</p></div>}
    </form>
  )
}
