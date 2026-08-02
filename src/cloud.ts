import { supabase } from './supabase'
import { parsForCourseName } from './coursePars'
import { STANDARD_HOLE_PARS } from './seed'

// --- Cloud (shared) trips: create, list, join, live roster ---

export interface SharedTrip {
  id: string
  name: string
  destination: string | null
  inviteCode: string
  organizerId: string
  createdAt: string
}

export interface SharedMember {
  id: string
  userId: string | null
  name: string
  isOrganizer: boolean
}

function mapTrip(r: Record<string, unknown>): SharedTrip {
  return {
    id: r.id as string,
    name: r.name as string,
    destination: (r.destination as string) ?? null,
    inviteCode: r.invite_code as string,
    organizerId: r.organizer_id as string,
    createdAt: r.created_at as string,
  }
}

function mapMember(r: Record<string, unknown>): SharedMember {
  return {
    id: r.id as string,
    userId: (r.user_id as string) ?? null,
    name: r.name as string,
    isOrganizer: Boolean(r.is_organizer),
  }
}

/** The shareable invite link for a trip. */
export function inviteUrl(code: string): string {
  return `${window.location.origin}${window.location.pathname}#/join/${code}`
}

export async function createSharedTrip(
  name: string,
  destination: string,
): Promise<SharedTrip> {
  if (!supabase) throw new Error('Not signed in')
  const { data: userRes } = await supabase.auth.getUser()
  const user = userRes.user
  if (!user) throw new Error('Not signed in')

  const { data, error } = await supabase
    .from('trips')
    .insert({ name: name.trim() || 'Golf Trip', destination: destination.trim() || null })
    .select()
    .single()
  if (error) throw error

  const displayName = (user.email?.split('@')[0] || 'Organizer').slice(0, 40)
  await supabase.from('trip_members').insert({
    trip_id: data.id,
    user_id: user.id,
    name: displayName,
    is_organizer: true,
  })
  return mapTrip(data)
}

/** Organizer only — deletes the trip and all its rounds/scores (cascade). */
export async function deleteSharedTrip(tripId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('trips').delete().eq('id', tripId)
  if (error) throw error
}

/** Non-organizer — removes yourself from the trip. */
export async function leaveTrip(tripId: string): Promise<void> {
  if (!supabase) return
  const { data } = await supabase.auth.getUser()
  await supabase
    .from('trip_members')
    .delete()
    .eq('trip_id', tripId)
    .eq('user_id', data.user?.id ?? '')
}

export async function listMyTrips(): Promise<SharedTrip[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return []
  return (data ?? []).map(mapTrip)
}

export async function getSharedTrip(id: string): Promise<SharedTrip | null> {
  if (!supabase) return null
  const { data } = await supabase.from('trips').select('*').eq('id', id).maybeSingle()
  return data ? mapTrip(data) : null
}

/** Join a trip by invite code; returns the trip id. */
export async function joinByCode(code: string, name: string): Promise<string> {
  if (!supabase) throw new Error('Not signed in')
  const { data, error } = await supabase.rpc('join_trip', {
    code,
    display_name: name.trim(),
  })
  if (error) throw error
  return data as string
}

export async function listMembers(tripId: string): Promise<SharedMember[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('trip_members')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })
  if (error) return []
  return (data ?? []).map(mapMember)
}

// --- Rounds & live scoring ---

export interface SharedRound {
  id: string
  tripId: string
  courseName: string
  holePars: number[]
  game: string
  teams: unknown[]
  wolf: unknown[]
  createdAt: string
}

function mapRound(r: Record<string, unknown>): SharedRound {
  return {
    id: r.id as string,
    tripId: r.trip_id as string,
    courseName: (r.course_name as string) ?? 'Round',
    holePars: (r.hole_pars as number[]) ?? [...STANDARD_HOLE_PARS],
    game: (r.game as string) || 'Stroke Play',
    teams: (r.teams as unknown[]) ?? [],
    wolf: (r.wolf as unknown[]) ?? [],
    createdAt: r.created_at as string,
  }
}

export async function addRound(
  tripId: string,
  courseName: string,
): Promise<SharedRound> {
  if (!supabase) throw new Error('Not signed in')
  const pars = parsForCourseName(courseName) ?? [...STANDARD_HOLE_PARS]
  const { data, error } = await supabase
    .from('rounds')
    .insert({
      trip_id: tripId,
      course_name: courseName.trim() || 'Round',
      hole_pars: pars,
      game: 'Stroke Play',
    })
    .select()
    .single()
  if (error) throw error
  return mapRound(data)
}

export async function saveRoundGame(roundId: string, game: string): Promise<void> {
  if (!supabase) return
  await supabase.from('rounds').update({ game }).eq('id', roundId)
}

export async function saveRoundTeams(roundId: string, teams: unknown[]): Promise<void> {
  if (!supabase) return
  await supabase.from('rounds').update({ teams }).eq('id', roundId)
}

export async function saveRoundWolf(roundId: string, wolf: unknown[]): Promise<void> {
  if (!supabase) return
  await supabase.from('rounds').update({ wolf }).eq('id', roundId)
}

export async function listRounds(tripId: string): Promise<SharedRound[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('rounds')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })
  return (data ?? []).map(mapRound)
}

export async function getRound(roundId: string): Promise<SharedRound | null> {
  if (!supabase) return null
  const { data } = await supabase.from('rounds').select('*').eq('id', roundId).maybeSingle()
  return data ? mapRound(data) : null
}

/** member_id -> 18 strokes (null = not entered) */
export type ScoreMap = Record<string, (number | null)[]>

export async function getRoundScores(roundId: string): Promise<ScoreMap> {
  if (!supabase) return {}
  const { data } = await supabase
    .from('round_scores')
    .select('member_id, strokes')
    .eq('round_id', roundId)
  const map: ScoreMap = {}
  for (const row of data ?? []) {
    map[row.member_id as string] = (row.strokes as (number | null)[]) ?? Array(18).fill(null)
  }
  return map
}

export async function saveMemberScores(
  roundId: string,
  memberId: string,
  strokes: (number | null)[],
): Promise<void> {
  if (!supabase) return
  await supabase
    .from('round_scores')
    .upsert({ round_id: roundId, member_id: memberId, strokes }, { onConflict: 'round_id,member_id' })
}

// --- Ryder Cup (shared) ---

export interface SharedRyder {
  teamAName: string
  teamBName: string
  teamOf: Record<string, 'A' | 'B'>
}

export async function getRyderCup(tripId: string): Promise<SharedRyder | null> {
  if (!supabase) return null
  const { data } = await supabase
    .from('ryder_cup')
    .select('*')
    .eq('trip_id', tripId)
    .maybeSingle()
  if (!data) return null
  return {
    teamAName: (data.team_a_name as string) ?? 'Team USA',
    teamBName: (data.team_b_name as string) ?? 'Team Europe',
    teamOf: (data.team_of as Record<string, 'A' | 'B'>) ?? {},
  }
}

export async function saveRyderCup(tripId: string, r: SharedRyder): Promise<void> {
  if (!supabase) return
  await supabase.from('ryder_cup').upsert(
    {
      trip_id: tripId,
      team_a_name: r.teamAName,
      team_b_name: r.teamBName,
      team_of: r.teamOf,
    },
    { onConflict: 'trip_id' },
  )
}

/** All rounds of a trip with their score maps — for computing Ryder standings. */
export async function getRoundsWithScores(
  tripId: string,
): Promise<{ round: SharedRound; scores: ScoreMap }[]> {
  const rounds = await listRounds(tripId)
  const out: { round: SharedRound; scores: ScoreMap }[] = []
  for (const r of rounds) out.push({ round: r, scores: await getRoundScores(r.id) })
  return out
}
