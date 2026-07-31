import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// The anon (publishable) key is safe to ship in the frontend — data is
// protected by Row Level Security policies in Supabase, not by hiding this key.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True once the backend is configured; until then the app runs in local/guest mode. */
export const hasBackend = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = hasBackend
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null
