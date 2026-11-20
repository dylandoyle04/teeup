import { supabase } from '@/lib/supabase'

// Display names live in the `profiles` table (id = auth user id). A database
// trigger creates the row on sign-up with name = the email's local part
// (see supabase/schema.sql → handle_new_user), so that default counts as
// "no name chosen yet".

export const NAME_MAX = 40

/** The signed-in user's profile name, or null if it can't be read. */
export async function fetchProfileName(userId: string): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('profiles').select('name').eq('id', userId).maybeSingle()
  if (error) return null
  return (data?.name as string | null | undefined)?.trim() || null
}

/** Saves the signed-in user's display name (creates the profile row if missing). */
export async function saveProfileName(userId: string, name: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Not available.' }
  const clean = name.trim().slice(0, NAME_MAX)
  if (!clean) return { error: 'Enter a name.' }
  const { error } = await supabase.from('profiles').upsert({ id: userId, name: clean }, { onConflict: 'id' })
  return { error: error ? 'Couldn’t save your name. Check your connection and try again.' : null }
}

/** True when the profile still has the automatic email-based name (or none). */
export function needsName(name: string | null, email: string | null | undefined): boolean {
  if (!name) return true
  const local = email?.split('@')[0]?.trim().toLowerCase()
  return !!local && name.trim().toLowerCase() === local
}
