import { createClient } from '@supabase/supabase-js'

function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing environment variable: ${key}. Add it to Vercel → Settings → Environment Variables.`)
  return value
}

// Browser-side singleton — lazily created to avoid build-time crashes [OWASP:A1]
let _supabase: ReturnType<typeof createClient> | null = null
export function getSupabaseClient() {
  if (!_supabase) {
    _supabase = createClient(
      getEnv('NEXT_PUBLIC_SUPABASE_URL'),
      getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    )
  }
  return _supabase
}

/** @deprecated use getSupabaseClient() — kept for backward compat */
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return (getSupabaseClient() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

// Server-side client factory — anon key, subject to RLS (use for reads)
export function createServerClient() {
  return createClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  )
}

// Server-side admin client — service role key, bypasses RLS
// ONLY use in Route Handlers, never expose to the browser [OWASP:A1]
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local from Supabase Dashboard → Settings → API.')
  }
  return createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
