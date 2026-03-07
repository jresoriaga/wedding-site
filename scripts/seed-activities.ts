/**
 * Supabase Activity Seeder
 * Seeds the `activities` table with La Union activities.
 *
 * Prerequisites:
 *   1. Run the Supabase SQL from the ACTIVITIES feature to create the activities table.
 *   2. Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 *
 * Usage:
 *   npx tsx scripts/seed-activities.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

// ── Activity seed data ────────────────────────────────────────────────────────
// vibes must be from: beach | adventure | sightseeing | leisure | nightlife | nature

const ACTIVITIES = [
  // ── MORNING ACTIVITIES ────────────────────────────────────────────────────

  {
    id: 'surf-urbiztondo',
    name: 'Surfing at Urbiztondo Beach',
    category: 'morning',
    vibe: ['beach', 'adventure'],
    address: 'Urbiztondo Beach, San Juan, La Union',
    lat: 16.6760,
    lng: 120.3219,
    description:
      'The surfing capital of Northern Philippines with consistent waves. Beginner lessons ₱400–₱500/hour with instructors. Best early morning when waves are cleaner and crowds are smaller.',
    hours: '6:00 AM – 6:00 PM',
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
    hours: '9:00 AM – 9:00 PM',
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
    hours: '8:00 AM – 6:00 PM',
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
    hours: '6:00 AM – 5:00 PM',
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
      'One of the few vineyards in the Philippines where visitors can pick grapes themselves. Best season: March–May. Activities: grape picking, wine tasting, farm photos.',
    hours: '7:00 AM – 5:00 PM',
  },

  // ── AFTERNOON ACTIVITIES ──────────────────────────────────────────────────

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
    hours: '11:00 AM – 10:00 PM',
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
    hours: '9:00 AM – 9:00 PM',
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
    hours: '5:00 PM – 7:00 PM',
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
    hours: '7:00 AM – 5:00 PM',
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
    hours: '9:00 AM – 5:00 PM',
  },

  // ── EVENING ACTIVITIES ────────────────────────────────────────────────────

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
    hours: '11:00 AM – Late Night',
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
      'Elyu nightlife usually starts around 9–10 PM with DJs and beach parties. Hit up Flotsam, Kabsat, and other beachfront bars.',
    hours: '9:00 PM – 2:00 AM',
  },
]

// ── Seed runner ───────────────────────────────────────────────────────────────

async function seedActivities() {
  console.log(`🌊  Seeding ${ACTIVITIES.length} activities into Supabase...`)
  console.log(`   URL: ${supabaseUrl}\n`)

  const { data, error } = await supabase
    .from('activities')
    .upsert(ACTIVITIES, { onConflict: 'id' })
    .select('id, name, category')

  if (error) {
    console.error('❌  Seed failed:', error.message)
    console.error('    Code:', error.code)
    console.error('    Hint: Make sure the activities table exists.')
    console.error('    Run the SQL from the ACTIVITIES feature first:\n')
    console.error(`
    create table activities (
      id text primary key,
      name text not null,
      category text not null check (category in ('morning','afternoon','evening')),
      vibe text[] not null default '{}',
      address text not null,
      lat double precision not null,
      lng double precision not null,
      description text,
      hours text
    );
    alter table activities enable row level security;
    create policy "public read" on activities for select using (true);
    `)
    process.exit(1)
  }

  console.log('✅  Seeded activities:')
  for (const row of data ?? []) {
    const emoji = row.category === 'morning' ? '🌅' : row.category === 'afternoon' ? '☀️' : '🌙'
    console.log(`   ${emoji}  [${row.category.padEnd(9)}] ${row.name}`)
  }
  console.log(`\n✨  Done — ${data?.length ?? 0} activities upserted.`)
}

seedActivities()
