// [SOLID:SRP] Each type represents a single domain concept

export type Category = 'breakfast' | 'lunch' | 'dinner'

// ── Activities ───────────────────────────────────────────────────────────────
export type ActivityCategory = 'morning' | 'afternoon' | 'evening'

// [AC-GUIDE-F1] Unified time-of-day filter (restaurants + activities in one feed)
export type TimeOfDay = 'morning' | 'afternoon' | 'evening'

export type ActivityVibe =
  | 'beach'
  | 'adventure'
  | 'sightseeing'
  | 'leisure'
  | 'nightlife'
  | 'nature'

export interface Activity {
  id: string
  name: string
  category: ActivityCategory
  vibe: ActivityVibe[]
  address: string
  lat: number
  lng: number
  description?: string
  hours?: string
  imageUrl?: string  // [AC-GUIDE-F3] optional hero image
}

export interface ActivityVote {
  id: string
  activity_id: string   // namespaced: "d1:act:surf-01"
  voter_name: string
  created_at: string
}

export interface ActivityPollEntry {
  activity: Activity
  votes: ActivityVote[]
  voteCount: number
}

export interface ActivityPollData {
  morning: ActivityPollEntry[]
  afternoon: ActivityPollEntry[]
  evening: ActivityPollEntry[]
}

export type Day = 1 | 2 | 3

export type Vibe =
  | 'party'
  | 'casual dining'
  | 'buffet'
  | 'bar'
  | 'café'
  | 'street food'

export interface Venue {
  id: string
  name: string
  category: Category
  vibe: Vibe[]
  address: string
  lat: number
  lng: number
  imageUrl?: string
  description?: string
  hours?: string          // e.g. "7:00 AM – 10:00 PM"
  menuImages?: string[]   // URLs to menu / food photos
}

export interface Vote {
  id: string
  venue_id: string
  voter_name: string
  created_at: string
}

export interface PollEntry {
  venue: Venue
  votes: Vote[]
  voteCount: number
}

export interface PollData {
  breakfast: PollEntry[]
  lunch: PollEntry[]
  dinner: PollEntry[]
}

export interface VotePayload {
  venue_id: string
  voter_name: string
}

// [AC-TRIPCONFIG-F2, F3, F4, F5] [AC-ACTIVITIES-F13]
export interface TripConfig {
  id: string           // always 'main'
  trip_name: string
  start_date: string   // ISO date e.g. "2026-04-10"
  end_date: string
  stay_name: string
  stay_lat: number
  stay_lng: number
  departure_time?: string  // e.g. "6:00 AM" — time group leaves Manila
  arrival_time?: string    // e.g. "12:00 PM" — time group arrives in La Union
  updated_by: string
  updated_at: string
}

// [AC-ACTIVITIES-F15] Output of scheduleBuilder.buildDaySchedule()
export interface ScheduleSlot {
  type: 'meal' | 'activity'
  label: string            // e.g. "Breakfast", "Morning Activity"
  name: string             // venue or activity name (or "No votes yet")
  address: string
  lat: number
  lng: number
  distanceKmFromPrev: number
  travelMinutes: number
}

// [AC-ACTIVITIES-F17, F18] Unified itinerary item — meal OR activity
export interface ItineraryItem {
  type: 'meal' | 'activity'
  label: string            // e.g. "Breakfast", "Morning Activity"
  name: string             // venue/activity name or "No votes yet"
  address: string
  startTime: string        // e.g. "8:00 AM"
  duration: string         // e.g. "1 hour"
  distanceFromPrev: string // e.g. "0.5 km"
  travelNote: string       // e.g. "~2 min walk from hotel"
}

// [AC-AITINPDF-F3, F5, F6] — updated to use unified items
export interface ItineraryDay {
  day: number
  date: string        // "YYYY-MM-DD"
  items: ItineraryItem[]
}

export interface GeneratedItinerary {
  days: ItineraryDay[]
}
