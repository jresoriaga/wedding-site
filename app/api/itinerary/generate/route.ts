import { NextResponse } from 'next/server'
import { createServerClient } from '@/app/lib/supabase'
import { buildDaySchedule } from '@/app/lib/scheduleBuilder'
import { ACTIVITIES } from '@/app/lib/activities'
import { RESTAURANTS } from '@/app/lib/restaurants'
import type { TripConfig, Venue, Activity, Vote, ActivityVote, ItineraryItem } from '@/app/lib/types'

// [AC-ACTIVITIES-F16] Top venue per category per day â€” most votes; alpha tie-break
// Returns null when no votes exist for the category on that day
function getTopVenue(
  votes: Vote[],
  restaurants: Venue[],
  day: number,
  category: string,
): Venue | null {
  const prefix = `d${day}:`
  const counts: Record<string, number> = {}

  for (const vote of votes) {
    if (!vote.venue_id.startsWith(prefix)) continue
    const base = vote.venue_id.slice(prefix.length)
    counts[base] = (counts[base] ?? 0) + 1
  }

  const catVenues = restaurants.filter((v) => v.category === category)
  const withVotes = catVenues.filter((v) => (counts[v.id] ?? 0) >= 1)
  if (withVotes.length === 0) return null

  withVotes.sort((a, b) => {
    const voteDiff = (counts[b.id] ?? 0) - (counts[a.id] ?? 0)
    return voteDiff !== 0 ? voteDiff : a.name.localeCompare(b.name)
  })

  return withVotes[0]
}

// [AC-ACTIVITIES-F16] Top activity per time-of-day per day â€” most votes; alpha tie-break
// Activity vote IDs: "d{day}:act:{activity_id}"
function getTopActivity(
  activityVotes: ActivityVote[],
  activities: Activity[],
  day: number,
  category: 'morning' | 'afternoon' | 'evening',
): Activity | null {
  const prefix = `d${day}:act:`
  const counts: Record<string, number> = {}

  for (const vote of activityVotes) {
    if (!vote.activity_id.startsWith(prefix)) continue
    const base = vote.activity_id.slice(prefix.length)
    counts[base] = (counts[base] ?? 0) + 1
  }

  const catActivities = activities.filter((a) => a.category === category)
  const withVotes = catActivities.filter((a) => (counts[a.id] ?? 0) >= 1)
  if (withVotes.length === 0) return null

  withVotes.sort((a, b) => {
    const voteDiff = (counts[b.id] ?? 0) - (counts[a.id] ?? 0)
    return voteDiff !== 0 ? voteDiff : a.name.localeCompare(b.name)
  })

  return withVotes[0]
}

// Standard durations and base start times per slot label
const SLOT_CONFIG: Record<string, { baseTime: string; duration: string }> = {
  Breakfast:            { baseTime: '8:00 AM',  duration: '1 hour' },
  'Morning Activity':   { baseTime: '9:30 AM',  duration: '1.5 hours' },
  Lunch:                { baseTime: '12:00 PM', duration: '1.5 hours' },
  'Afternoon Activity': { baseTime: '2:30 PM',  duration: '2 hours' },
  Dinner:               { baseTime: '7:00 PM',  duration: '2 hours' },
  'Evening Activity':   { baseTime: '9:30 PM',  duration: '1.5 hours' },
}

function formatDistance(km: number): string {
  if (km < 0.05) return 'â€”'
  return `${km.toFixed(1)} km`
}

function formatTravelNote(km: number, minutes: number): string {
  if (km < 0.05) return 'â€”'
  if (km < 0.3) return `~${minutes} min walk`
  return `~${minutes} min drive`
}

// [AC-ACTIVITIES-F17] Convert ScheduleSlot[] â†’ ItineraryItem[] with formatted strings
function slotsToItems(slots: ReturnType<typeof buildDaySchedule>): ItineraryItem[] {
  return slots.map((slot) => {
    const cfg = SLOT_CONFIG[slot.label] ?? { baseTime: 'â€”', duration: 'â€”' }
    return {
      type: slot.type,
      label: slot.label,
      name: slot.name,
      address: slot.address,
      startTime: cfg.baseTime,
      duration: cfg.duration,
      distanceFromPrev: formatDistance(slot.distanceKmFromPrev),
      travelNote: formatTravelNote(slot.distanceKmFromPrev, slot.travelMinutes),
    }
  })
}

// POST /api/itinerary/generate [AC-ACTIVITIES-F16, F17, AC-AITINPDF-E3]
// Intentionally public to all logged-in users â€” no admin gate [OWASP:A1 permissive by design]
export async function POST(_req: Request) {
  const supabase = createServerClient()

  // 1. Read trip_config [AC-AITINPDF-E3]
  const { data: tripConfig, error: tcError } = await supabase
    .from('trip_config')
    .select('*')
    .eq('id', 'main')
    .single()

  if (!tripConfig || tcError) {
    return NextResponse.json({ error: 'Trip config not set' }, { status: 400 })
  }

  // 2. Read restaurant votes
  const { data: votesRaw, error: vError } = await supabase.from('votes').select('*')
  if (vError) {
    return NextResponse.json({ error: 'Failed to read votes' }, { status: 500 })
  }

  // 3. Read restaurants (DB-first, static fallback) [AC-AITINPDF-F5]
  const { data: restaurantsRaw, error: rError } = await supabase.from('restaurants').select('*')
  const restaurants: Venue[] = (rError || !restaurantsRaw?.length)
    ? RESTAURANTS
    : (restaurantsRaw as Venue[])

  // 4. Read activity votes [AC-ACTIVITIES-F16]
  const { data: activityVotesRaw } = await supabase.from('activity_votes').select('*')

  // 5. Read activities (DB-first, static fallback)
  const { data: activitiesRaw } = await supabase.from('activities').select('*')
  const activities: Activity[] = (!activitiesRaw?.length)
    ? ACTIVITIES
    : (activitiesRaw as Activity[])

  const votes: Vote[] = (votesRaw as Vote[]) ?? []
  const activityVotes: ActivityVote[] = (activityVotesRaw as ActivityVote[]) ?? []

  // 6. Compute proximity-ordered schedule for each day [AC-ACTIVITIES-F14, F15, F17]
  const startDate = new Date(tripConfig.start_date)
  const days = [1, 2, 3].map((dayNum) => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + dayNum - 1)

    const topRestaurants = {
      breakfast: getTopVenue(votes, restaurants, dayNum, 'breakfast'),
      lunch: getTopVenue(votes, restaurants, dayNum, 'lunch'),
      dinner: getTopVenue(votes, restaurants, dayNum, 'dinner'),
    }

    const topActivities = {
      morning: getTopActivity(activityVotes, activities, dayNum, 'morning'),
      afternoon: getTopActivity(activityVotes, activities, dayNum, 'afternoon'),
      evening: getTopActivity(activityVotes, activities, dayNum, 'evening'),
    }

    const slots = buildDaySchedule(tripConfig as TripConfig, topRestaurants, topActivities, dayNum)
    const items = slotsToItems(slots)

    return { day: dayNum, date: date.toISOString().slice(0, 10), items }
  })

  return NextResponse.json({ days })
}

