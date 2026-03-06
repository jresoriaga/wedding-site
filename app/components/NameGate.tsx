'use client'
import { useState, useRef } from 'react'
import { validateName, sanitizeName } from '@/app/lib/validateName'

interface NameGateProps {
  onSuccess: (name: string) => void
}

// [AC-ITINPLAN0306-F1, F2, E1] [WCAG:1.3.1, 2.1.1, 3.3.1]
export default function NameGate({ onSuccess }: NameGateProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validateName(value)
    if (err) {
      setError(err)
      inputRef.current?.focus()
      return
    }
    const clean = sanitizeName(value)
    setError(null)
    onSuccess(clean)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-ocean via-sky to-sand px-4">
      {/* Decorative background waves */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-coral/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-ocean/30 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🌊</div>
          <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-2">
            La Union Summer Outing
          </h1>
          <p className="text-sky-100 text-lg">
            Plan the perfect trip with your squad 🏄
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/50">
          <h2 className="text-2xl font-bold text-ocean mb-1">Welcome! 👋</h2>
          <p className="text-gray-500 text-sm mb-6">
            Enter your name so your friends know it&apos;s you voting.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label
                htmlFor="name-input"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Your Name
              </label>
              <input
                ref={inputRef}
                id="name-input"
                data-testid="name-input"
                type="text"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  if (error) setError(null)
                }}
                placeholder="e.g. Maria, Juan 🌊"
                maxLength={60}
                autoFocus
                aria-describedby={error ? 'name-error' : undefined}
                aria-invalid={!!error}
                className={`
                  w-full px-4 py-3 rounded-xl border-2 text-gray-800 text-base
                  focus:outline-none focus:ring-2 focus:ring-ocean transition-all
                  ${error
                    ? 'border-coral bg-red-50 focus:ring-coral'
                    : 'border-gray-200 bg-white focus:border-ocean'
                  }
                `}
              />
              {error && (
                <p
                  id="name-error"
                  role="alert"
                  data-testid="name-error"
                  className="mt-2 text-sm text-coral font-medium"
                >
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              data-testid="name-submit"
              className="
                w-full py-3 px-6 rounded-xl bg-ocean text-white font-bold text-base
                hover:bg-ocean/90 active:scale-[0.98] transition-all duration-150
                focus:outline-none focus:ring-2 focus:ring-ocean focus:ring-offset-2
                shadow-lg shadow-ocean/30
              "
            >
              Join the Planning 🚀
            </button>
          </form>
        </div>

        <p className="text-center text-sky-100/70 text-xs mt-6">
          No account needed — just your name 🙌
        </p>
      </div>
    </div>
  )
}
