import { NextResponse } from 'next/server'
import { createServerClient } from '@/app/lib/supabase'
import { ACTIVITIES } from '@/app/lib/activities'

const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
const PG_UNDEFINED_TABLE = '42P01'

// GET /api/activities — returns enriched activity list (DB-first, static fallback)
// [AC-ACTIVITIES-F1]
export async function GET() {
  if (supabaseConfigured) {
    const supabase = createServerClient()
    const { data, error } = await supabase.from('activities').select('*')

    if (!error && data && data.length > 0) {
      return NextResponse.json({ activities: data })
    }

    if (error && error.code !== PG_UNDEFINED_TABLE) {
      console.error('[GET /api/activities] Supabase error', error)
    }
    // Fall through to static data if table missing or empty
  }

  return NextResponse.json({ activities: ACTIVITIES })
}
