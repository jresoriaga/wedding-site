import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser-side client — safe with Supabase RLS enforced [OWASP:A1]
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client factory (for Route Handlers)
export function createServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey)
}
