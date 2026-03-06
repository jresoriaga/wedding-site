import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser-side client — safe with Supabase RLS enforced [OWASP:A1]
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client factory — anon key, subject to RLS (use for reads)
export function createServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Server-side admin client — service role key, bypasses RLS
// ONLY use in Route Handlers, never expose to the browser [OWASP:A1]
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local from Supabase Dashboard → Settings → API.')
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
