import type { ActivityPollEntry, ActivityVote, ActivityCategory, Activity } from './types'
import { ACTIVITIES, ACTIVITY_MAP } from './activities'

// Strip day+act prefix: "d1:act:surf-01" → "surf-01"
function baseId(activityId: string): string {
  return activityId.replace(/^d[1-3]:act:/, '')
}

// Returns activities for a given category sorted by vote count descending
// O(n log n) — same pattern as rankVenues [AC-ACTIVITIES-F12]
export function rankActivities(
  votes: ActivityVote[],
  category: ActivityCategory,
  day: 1 | 2 | 3,
  dynamicActivities?: Activity[],
): ActivityPollEntry[] {
  const activityList = dynamicActivities ?? ACTIVITIES
  const liveActivityMap: Record<string, Activity> = dynamicActivities
    ? Object.fromEntries(dynamicActivities.map((a) => [a.id, a]))
    : ACTIVITY_MAP

  const dayPrefix = `d${day}:act:`

  // Build vote index O(n) — no nested loops
  const votesByActivity: Record<string, ActivityVote[]> = {}
  for (const vote of votes) {
    if (!vote.activity_id.startsWith(dayPrefix)) continue
    const base = baseId(vote.activity_id)
    const activity = liveActivityMap[base]
    if (!activity || activity.category !== category) continue
    if (!votesByActivity[base]) votesByActivity[base] = []
    votesByActivity[base].push(vote)
  }

  const entries: ActivityPollEntry[] = activityList
    .filter((a) => a.category === category)
    .map((activity) => ({
      activity,
      votes: votesByActivity[activity.id] ?? [],
      voteCount: votesByActivity[activity.id]?.length ?? 0,
    }))

  // Sort vote count desc → name asc (stable tie-break)
  return entries.sort((a, b) => {
    const voteDiff = b.voteCount - a.voteCount
    return voteDiff !== 0 ? voteDiff : a.activity.name.localeCompare(b.activity.name)
  })
}
