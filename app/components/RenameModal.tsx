'use client'
import { useState, useEffect, useRef } from 'react'
import { validateName, sanitizeName } from '@/app/lib/validateName'

interface RenameModalProps {
  currentName: string
  onSuccess: (newName: string) => void
  onClose: () => void
}

export default function RenameModal({ currentName, onSuccess, onClose }: RenameModalProps) {
  const [value, setValue] = useState(currentName)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on open [WCAG:2.4.3]
  useEffect(() => {
    inputRef.current?.select()
  }, [])

  // Close on Escape [WCAG:2.1.1]
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = sanitizeName(value)
    const err = validateName(trimmed)
    if (err) { setError(err); return }
    if (trimmed === currentName) { onClose(); return }

    setIsSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/votes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_name: currentName, new_name: trimmed }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.error ?? 'Failed to rename — try again')
        return
      }
      onSuccess(trimmed)
    } catch {
      setError('Network error — try again')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    /* Backdrop [WCAG:2.1.1] */
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Change your name"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-slide-up">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Change your name ✏️</h2>
        <p className="text-gray-400 text-sm mb-5">
          Your existing votes will move to the new name.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="rename-input" className="sr-only">New name</label>
            <input
              id="rename-input"
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(null) }}
              maxLength={50}
              autoComplete="nickname"
              placeholder="Your name"
              aria-describedby={error ? 'rename-error' : undefined}
              aria-invalid={!!error}
              className={`
                w-full rounded-xl border-2 px-4 py-3 text-base font-medium
                focus:outline-none focus:ring-2 focus:ring-ocean focus:border-transparent
                transition-colors
                ${error ? 'border-coral' : 'border-gray-200 focus:border-ocean'}
              `}
            />
            {error && (
              <p id="rename-error" role="alert" className="mt-1.5 text-xs text-coral font-medium">
                {error}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-xl bg-ocean py-3 text-sm font-bold text-white shadow-md shadow-ocean/30 hover:bg-ocean/90 transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-ocean focus:ring-offset-2"
            >
              {isSaving ? 'Saving…' : 'Save name'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
