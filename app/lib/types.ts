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
