import type { Activity } from './types'

// Static fallback â€” mirrors scripts/seed-activities.ts exactly.
// IDs MUST match the database so activity_votes foreign keys remain valid.
// [AC-ACTIVITIES-F1]
export const ACTIVITIES: Activity[] = [
  // â”€â”€ MORNING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'surf-urbiztondo',
    name: 'Surfing at Urbiztondo Beach',
    category: 'morning',
    vibe: ['beach', 'adventure'],
    address: 'Urbiztondo Beach, San Juan, La Union',
    lat: 16.6760,
    lng: 120.3219,
    description:
      'The surfing capital of Northern Philippines with consistent waves. Beginner lessons â‚±400â€“â‚±500/hour with instructors. Best early morning when waves are cleaner and crowds are smaller.',
    hours: '6:00 AM â€“ 6:00 PM',
  },
  {
    id: 'el-union-coffee',
    name: 'El Union Coffee',
    category: 'morning',
    vibe: ['leisure'],
    address: 'San Juan, La Union',
    lat: 16.6770,
    lng: 120.3215,
    description:
      'One of the most famous cafes in Elyu, known for specialty coffee and grilled cheese sandwiches. Must try: Dirty Horchata, Grilled Cheese with Bacon Jam, Smores dessert. Popular Instagram spot.',
    hours: '9:00 AM â€“ 9:00 PM',
  },
  {
    id: 'makai-bowls',
    name: 'Makai Bowls',
    category: 'morning',
    vibe: ['leisure', 'beach'],
    address: 'San Juan, La Union',
    lat: 16.6772,
    lng: 120.3216,
    description:
      'Famous for fruit smoothie bowls and shakes, popular with surfers and fitness travelers.',
    hours: '8:00 AM â€“ 6:00 PM',
  },
  {
    id: 'tangadan-falls',
    name: 'Tangadan Falls',
    category: 'morning',
    vibe: ['nature', 'adventure'],
    address: 'San Gabriel, La Union',
    lat: 16.7490,
    lng: 120.3904,
    description:
      'A two-tier waterfall with swimming and cliff diving. Requires a short hike or motorbike ride + trek. Trending: cliff jumping, river trekking, nature photography.',
    hours: '6:00 AM â€“ 5:00 PM',
  },
  {
    id: 'gapuz-grapes-farm',
    name: 'Gapuz Grapes Farm',
    category: 'morning',
    vibe: ['nature', 'leisure'],
    address: 'Bauang, La Union',
    lat: 16.5244,
    lng: 120.3331,
    description:
      'One of the few vineyards in the Philippines where visitors can pick grapes themselves. Best season: Marchâ€“May. Activities: grape picking, wine tasting, farm photos.',
    hours: '7:00 AM â€“ 5:00 PM',
  },

  // â”€â”€ AFTERNOON â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'kabsat',
    name: 'Kabsat Beachfront',
    category: 'afternoon',
    vibe: ['beach', 'leisure'],
    address: 'San Juan, La Union',
    lat: 16.6825,
    lng: 120.3205,
    description:
      'One of the most popular beachfront restaurants in Elyu. Known for sunset views and cocktails. Must try: seafood pasta, pizza, cocktails.',
    hours: '11:00 AM â€“ 10:00 PM',
  },
  {
    id: 'halo-halo-de-iloko',
    name: 'Halo Halo de Iloko',
    category: 'afternoon',
    vibe: ['leisure'],
    address: 'San Juan, La Union',
    lat: 16.6158,
    lng: 120.3175,
    description:
      'One of the most famous halo-halo spots in La Union. A must-try Filipino dessert stop.',
    hours: '9:00 AM â€“ 9:00 PM',
  },
  {
    id: 'urbiztondo-sunset',
    name: 'Sunset Watching at Urbiztondo',
    category: 'afternoon',
    vibe: ['beach', 'leisure'],
    address: 'Urbiztondo Beach, San Juan, La Union',
    lat: 16.6760,
    lng: 120.3219,
    description:
      'Famous golden sunsets over the West Philippine Sea. Popular activities: sunset drinks, beach photography, surf watching.',
    hours: '5:00 PM â€“ 7:00 PM',
  },
  {
    id: 'ma-cho-temple',
    name: 'Ma-Cho Temple',
    category: 'afternoon',
    vibe: ['sightseeing'],
    address: 'San Fernando, La Union',
    lat: 16.6165,
    lng: 120.3167,
    description:
      'One of the largest Taoist temples in the Philippines with panoramic views of San Fernando harbor.',
    hours: '7:00 AM â€“ 5:00 PM',
  },
  {
    id: 'putik-pottery',
    name: 'Putik Friends Pottery Workshop',
    category: 'afternoon',
    vibe: ['leisure', 'sightseeing'],
    address: 'San Juan, La Union',
    lat: 16.6770,
    lng: 120.3220,
    description:
      'Unique hands-on pottery making and ceramic art classes with local artists. A locally recommended creative experience.',
    hours: '9:00 AM â€“ 5:00 PM',
  },

  // â”€â”€ EVENING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'flotsam-jetsam',
    name: 'Flotsam and Jetsam',
    category: 'evening',
    vibe: ['beach', 'nightlife', 'leisure'],
    address: 'San Juan, La Union',
    lat: 16.66197,
    lng: 120.32457,
    description:
      'One of the most famous dining and nightlife spots in Elyu. Known for food, cocktails, and art hostel vibes. Must try: pork belly rice, cocktails, curry rice bowls.',
    hours: '11:00 AM â€“ Late Night',
  },
  {
    id: 'elyu-bar-hopping',
    name: 'Elyu Bar Hopping',
    category: 'evening',
    vibe: ['nightlife', 'beach'],
    address: 'San Juan, La Union',
    lat: 16.6760,
    lng: 120.3219,
    description:
      'Elyu nightlife usually starts around 9â€“10 PM with DJs and beach parties. Hit up Flotsam, Kabsat, and other beachfront bars.',
    hours: '9:00 PM â€“ 2:00 AM',
  },
]

export const ACTIVITY_MAP: Record<string, Activity> = Object.fromEntries(
  ACTIVITIES.map((a) => [a.id, a])
)
