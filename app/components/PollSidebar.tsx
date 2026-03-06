'use client'
import React from 'react'
import type { PollData } from '@/app/lib/types'
import PollCategorySection from './PollCategorySection'

interface PollSidebarProps {
  pollData: PollData | null
  isReconnecting: boolean
}

// [AC-ITINPLAN0306-F6, F7, ERR2]
const PollSidebar = React.memo(function PollSidebar({
  pollData,
  isReconnecting,
}: PollSidebarProps) {
  return (
    <aside
      data-testid="poll-sidebar"
      aria-label="Live poll results"
      className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
          <span aria-hidden="true">📊</span> Live Poll
        </h2>
        <span className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${isReconnecting ? 'bg-yellow-400 animate-pulse' : 'bg-green-400 animate-pulse'}`}
            aria-hidden="true"
          />
          <span className="text-xs text-gray-400">
            {isReconnecting ? 'Reconnecting…' : 'Live'}
          </span>
        </span>
      </div>

      {/* Reconnecting indicator [AC-ITINPLAN0306-ERR2] */}
      {isReconnecting && (
        <div
          data-testid="reconnecting-indicator"
          role="status"
          aria-live="polite"
          className="mb-4 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700"
        >
          ⚡ Reconnecting to live updates…
        </div>
      )}

      {pollData === null ? (
        /* Skeleton while loading */
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded" />
                <div className="h-3 w-3/4 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <PollCategorySection category="breakfast" entries={pollData.breakfast} />
          <div className="border-t border-gray-100" />
          <PollCategorySection category="lunch" entries={pollData.lunch} />
          <div className="border-t border-gray-100" />
          <PollCategorySection category="dinner" entries={pollData.dinner} />
        </div>
      )}
    </aside>
  )
})

export default PollSidebar
