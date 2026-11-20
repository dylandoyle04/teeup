import type { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface AuthState {
  ready: boolean
  session: Session | null
  user: User | null
}

/** Current sign-in state, shared app-wide (one listener, not one per screen). */
export const useAuth = create<AuthState>(() => ({ ready: false, session: null, user: null }))

supabase?.auth.getSession().then(({ data }) => {
  useAuth.setState({ ready: true, session: data.session, user: data.session?.user ?? null })
})
supabase?.auth.onAuthStateChange((_event, session) => {
  useAuth.setState({ ready: true, session, user: session?.user ?? null })
})

/** Emails a 6-digit sign-in code (same Supabase email the website sends). */
export async function sendCode(email: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Sign-in is not available.' }
  const { error } = await supabase.auth.signInWithOtp({ email: email.trim() })
  return { error: error?.message ?? null }
}

export async function verifyCode(email: string, token: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Sign-in is not available.' }
  const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: 'email' })
  return { error: error?.message ?? null }
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut()
}

/**
 * Permanently deletes the signed-in account (App Store requirement). Runs the
 * delete_my_account() function from supabase/delete-account.sql, then signs out.
 */
export async function deleteAccount(): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Not available.' }
  const { error } = await supabase.rpc('delete_my_account')
  if (error) return { error: error.message }
  await supabase.auth.signOut()
  return { error: null }
}
