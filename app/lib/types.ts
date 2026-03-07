// [SOLID:SRP] Each type represents a single domain concept

export type Category = 'breakfast' | 'lunch' | 'dinner'

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

// [AC-TRIPCONFIG-F2, F3, F4, F5]
export interface TripConfig {
  id: string           // always 'main'
  trip_name: string
  start_date: string   // ISO date e.g. "2026-04-10"
  end_date: string
  stay_name: string
  stay_lat: number
  stay_lng: number
  updated_by: string
  updated_at: string
}

// [AC-AITINPDF-F3, F5, F6]
export interface ItineraryMeal {
  meal: 'breakfast' | 'lunch' | 'dinner'
  venue: string       // venue name or "No votes yet"
  address: string
  suggestedTime: string
  duration: string
  travelNote: string
}

export interface ItineraryDay {
  day: number
  date: string        // "YYYY-MM-DD"
  meals: ItineraryMeal[]
}

export interface GeneratedItinerary {
  days: ItineraryDay[]
}
