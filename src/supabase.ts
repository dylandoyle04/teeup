import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// The publishable (anon) key is safe to ship in the frontend — data is protected
// by Row Level Security policies in Supabase, not by hiding this key. Env vars
// override the committed defaults (e.g. to point at a different project).
const url =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  'https://wgzntovaggovrrmwqgsb.supabase.co'
const anonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  'sb_publishable_UhoKfvEAmHeA0-mzvgBehg_qGzMPZx0'

/** True once the backend is configured; until then the app runs in local/guest mode. */
export const hasBackend = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = hasBackend
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // PKCE puts the magic-link token in a ?code= query param instead of the
        // URL hash, so it doesn't collide with the app's HashRouter.
        flowType: 'pkce',
        detectSessionInUrl: true,
      },
    })
  : null
