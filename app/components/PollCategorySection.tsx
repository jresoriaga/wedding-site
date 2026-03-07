'use client'
import React from 'react'
import type { PollEntry, Category } from '@/app/lib/types'

interface PollCategorySectionProps {
  category: Category
  entries: PollEntry[]
}

const CATEGORY_META: Record<Category, { label: string; emoji: string; color: string }> = {
  breakfast: { label: 'Breakfast', emoji: '🌅', color: 'text-amber-600' },
  lunch: { label: 'Lunch', emoji: '☀️', color: 'text-orange-500' },
  dinner: { label: 'Dinner', emoji: '🌙', color: 'text-indigo-600' },
}

// [AC-ITINPLAN0306-F7, E3, S3]
export default function PollCategorySection({ category, entries }: PollCategorySectionProps) {
  const meta = CATEGORY_META[category]
  const maxVotes = entries[0]?.voteCount ?? 0

  return (
    <section aria-labelledby={`poll-heading-${category}`}>
      <h3
        id={`poll-heading-${category}`}
        className={`flex items-center gap-2 font-bold text-base mb-3 ${meta.color}`}
      >
        <span aria-hidden="true">{meta.emoji}</span>
        {meta.label}
      </h3>

      {maxVotes === 0 ? (
        <div className="text-center py-6 text-gray-400 text-sm italic">
          {/* [AC-ITINPLAN0306-E3] */}
          No votes yet — be the first! 🗳️
        </div>
      ) : (
        <ol className="space-y-2">
          {entries
            .filter((e) => e.voteCount > 0)
            .map((entry, idx) => {
              const pct = maxVotes > 0 ? (entry.voteCount / maxVotes) * 100 : 0
              return (
                <li key={entry.venue.id} className="group">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-400 w-5 text-right flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-gray-800 flex-1 truncate">
                      {/* [OWASP:A3] Rendered via JSX — XSS safe [AC-ITINPLAN0306-S3] */}
                      {entry.venue.name}
                    </span>
                    <span className="text-xs font-bold text-coral flex-shrink-0">
                      {entry.voteCount} vote{entry.voteCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="ml-7 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-coral to-ocean rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                      role="progressbar"
                      aria-valuenow={entry.voteCount}
                      aria-valuemax={maxVotes}
                      aria-label={`${entry.voteCount} votes`}
                    />
                  </div>
                  {/* Voter names — always visible so mobile users can see who voted */}
                  {entry.votes.length > 0 && (
                    <p className="ml-7 mt-1 text-xs text-gray-400 leading-snug">
                      {/* [OWASP:A3] voter_name rendered via JSX text content — safe [AC-ITINPLAN0306-S3] */}
                      {entry.votes.map((v) => (
                        <span
                          key={v.id}
                          className="inline-flex items-center gap-0.5 mr-1 mb-0.5 px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-medium whitespace-nowrap"
                        >
                          {v.voter_name}
                        </span>
                      ))}
                    </p>
                  )}
                </li>
              )
            })}
        </ol>
      )}
    </section>
  )
}
