'use client'
// [AC-ACTIVITIES-F10] — Added Activities tab switcher
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/app/lib/store'
import PollCategorySection from '@/app/components/PollCategorySection'
import ActivityPollSection from '@/app/components/ActivityPollSection'
import DayTabs from '@/app/components/DayTabs'
import { usePollStream } from '@/app/hooks/usePollStream'
import { useActivityPollStream } from '@/app/hooks/useActivityPollStream'

export default function PollPage() {
  const router = useRouter()
  const userName = useAppStore((s) => s.userName)
  const pollData = useAppStore((s) => s.pollData)
  const activityPollData = useAppStore((s) => s.activityPollData)
  const isReconnecting = useAppStore((s) => s.isReconnecting)
  const isActivityReconnecting = useAppStore((s) => s.isActivityReconnecting)
  const activeDay = useAppStore((s) => s.activeDay)
  const setActiveDay = useAppStore((s) => s.setActiveDay)

  const [pollTab, setPollTab] = useState<'restaurants' | 'activities'>('restaurants')

  usePollStream()
  useActivityPollStream()

  useEffect(() => {
    const saved = localStorage.getItem('lu-outing-name')
    if (!saved && !userName) router.replace('/')
  }, [userName, router])

  const showReconnecting = pollTab === 'restaurants' ? isReconnecting : isActivityReconnecting

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
              className={`w-2.5 h-2.5 rounded-full ${showReconnecting ? 'bg-yellow-400 animate-pulse' : 'bg-green-400 animate-pulse'}`}
              aria-hidden="true"
            />
            <span className="text-xs text-gray-400 font-medium">
              {showReconnecting ? 'Reconnecting…' : 'Live'}
            </span>
          </div>
        </div>
      </div>

      {/* Restaurants | Activities tab switcher [AC-ACTIVITIES-F10] */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl" role="tablist" aria-label="Poll type">
        <button
          role="tab"
          aria-selected={pollTab === 'restaurants'}
          onClick={() => setPollTab('restaurants')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
            pollTab === 'restaurants'
              ? 'bg-white text-ocean shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🍽️ Restaurants
        </button>
        <button
          role="tab"
          aria-selected={pollTab === 'activities'}
          onClick={() => setPollTab('activities')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
            pollTab === 'activities'
              ? 'bg-white text-ocean shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🎯 Activities
        </button>
      </div>

      {/* Day selector */}
      <DayTabs active={activeDay} onChange={setActiveDay} />

      {/* Reconnecting banner */}
      {showReconnecting && (
        <div
          data-testid="reconnecting-indicator"
          role="status"
          aria-live="polite"
          className="px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700"
        >
          ⚡ Reconnecting to live updates… your votes are safe.
        </div>
      )}

      {/* Restaurant poll results */}
      {pollTab === 'restaurants' && (
        pollData === null ? (
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
        )
      )}

      {/* Activity poll results [AC-ACTIVITIES-F9] */}
      {pollTab === 'activities' && (
        activityPollData === null ? (
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
            {(['morning', 'afternoon', 'evening'] as const).map((cat) => (
              <div
                key={cat}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
              >
                <ActivityPollSection
                  category={cat}
                  entries={activityPollData[cat]}
                />
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
