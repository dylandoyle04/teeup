import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, hasBackend } from './supabase'

/** Where the magic link sends people back to (site root; PKCE code is a query param). */
function redirectTo(): string {
  return window.location.origin + window.location.pathname
}

export interface AuthState {
  ready: boolean
  session: Session | null
  user: User | null
}

/** Subscribe to the current auth session. */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    ready: !hasBackend, // with no backend we're immediately "ready" (guest only)
    session: null,
    user: null,
  })

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setState({ ready: true, session: data.session, user: data.session?.user ?? null })
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setState({ ready: true, session, user: session?.user ?? null })
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return state
}

/** Send a passwordless magic-link sign-in email. */
export async function sendMagicLink(email: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Sign-in is not available yet.' }
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: redirectTo() },
  })
  return { error: error?.message ?? null }
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut()
}
