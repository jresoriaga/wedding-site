'use client'
import React from 'react'
import type { ActivityPollEntry, ActivityCategory } from '@/app/lib/types'

interface ActivityPollSectionProps {
  category: ActivityCategory
  entries: ActivityPollEntry[]
}

const CATEGORY_META: Record<ActivityCategory, { label: string; emoji: string; color: string }> = {
  morning: { label: 'Morning Activities', emoji: '🌅', color: 'text-amber-600' },
  afternoon: { label: 'Afternoon Activities', emoji: '☀️', color: 'text-orange-500' },
  evening: { label: 'Evening Activities', emoji: '🌙', color: 'text-indigo-600' },
}

// [AC-ACTIVITIES-F9] Activity poll results section — mirrors PollCategorySection
export default function ActivityPollSection({ category, entries }: ActivityPollSectionProps) {
  const meta = CATEGORY_META[category]
  const maxVotes = entries[0]?.voteCount ?? 0

  return (
    <section aria-labelledby={`activity-poll-heading-${category}`}>
      <h3
        id={`activity-poll-heading-${category}`}
        className={`flex items-center gap-2 font-bold text-base mb-3 ${meta.color}`}
      >
        <span aria-hidden="true">{meta.emoji}</span>
        {meta.label}
      </h3>

      {maxVotes === 0 ? (
        <div className="text-center py-6 text-gray-400 text-sm italic">
          No activity votes yet — cast yours! 🎯
        </div>
      ) : (
        <ol className="space-y-2">
          {entries
            .filter((e) => e.voteCount > 0)
            .map((entry, idx) => {
              const pct = maxVotes > 0 ? (entry.voteCount / maxVotes) * 100 : 0
              return (
                <li key={entry.activity.id} className="group">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-400 w-5 text-right flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-gray-800 flex-1 truncate">
                      {/* [OWASP:A3] XSS-safe JSX text rendering */}
                      {entry.activity.name}
                    </span>
                    <span className="text-xs font-bold text-ocean flex-shrink-0">
                      {entry.voteCount}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="ml-7 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-ocean rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                      aria-hidden="true"
                    />
                  </div>

                  {/* Voter names */}
                  {entry.votes.length > 0 && (
                    <div className="ml-7 mt-1">
                      <p className="text-xs text-gray-400 truncate">
                        {entry.votes.map((v) => v.voter_name).join(', ')}
                      </p>
                    </div>
                  )}
                </li>
              )
            })}
        </ol>
      )}
    </section>
  )
}
