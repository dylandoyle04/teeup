import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { AppState } from 'react-native'

// Native side of ../src/supabase.ts (Metro swaps it in — see metro.config.js), so
// the shared cloud code (@shared/cloud) talks to the same project as the website.
// The publishable key is safe to ship: Row Level Security protects the data.
const url = 'https://wgzntovaggovrrmwqgsb.supabase.co'
const anonKey = 'sb_publishable_UhoKfvEAmHeA0-mzvgBehg_qGzMPZx0'

export const hasBackend = true

export const supabase: SupabaseClient | null = createClient(url, anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // sign-in is a 6-digit code, not a link
  },
})

// Only refresh the session while the app is in the foreground.
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase?.auth.startAutoRefresh()
  else supabase?.auth.stopAutoRefresh()
})
