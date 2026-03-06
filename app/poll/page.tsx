'use client'
// [AC-ITINPLAN0306-F6, F7, E3]
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/app/lib/store'
import PollCategorySection from '@/app/components/PollCategorySection'
import { usePollStream } from '@/app/hooks/usePollStream'

export default function PollPage() {
  const router = useRouter()
  const userName = useAppStore((s) => s.userName)
  const pollData = useAppStore((s) => s.pollData)
  const isReconnecting = useAppStore((s) => s.isReconnecting)

  usePollStream()

  useEffect(() => {
    const saved = localStorage.getItem('lu-outing-name')
    if (!saved && !userName) router.replace('/')
  }, [userName, router])

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span aria-hidden="true">📊</span> Live Poll
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              See what your squad is voting for — updates in real time!
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${isReconnecting ? 'bg-yellow-400 animate-pulse' : 'bg-green-400 animate-pulse'}`}
              aria-hidden="true"
            />
            <span className="text-xs text-gray-400 font-medium">
              {isReconnecting ? 'Reconnecting…' : 'Live'}
            </span>
          </div>
        </div>
      </div>

      {/* Reconnecting banner [AC-ITINPLAN0306-ERR2] */}
      {isReconnecting && (
        <div
          data-testid="reconnecting-indicator"
          role="status"
          aria-live="polite"
          className="px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700"
        >
          ⚡ Reconnecting to live updates… your votes are safe.
        </div>
      )}

      {pollData === null ? (
        /* Skeleton */
        <div className="space-y-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse">
              <div className="h-5 w-28 bg-gray-200 rounded mb-4" />
              {[0, 1, 2].map((j) => (
                <div key={j} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <div className="h-3 w-36 bg-gray-100 rounded" />
                    <div className="h-3 w-10 bg-gray-100 rounded" />
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full" />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {(['breakfast', 'lunch', 'dinner'] as const).map((cat) => (
            <div
              key={cat}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
            >
              <PollCategorySection
                category={cat}
                entries={pollData[cat]}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
