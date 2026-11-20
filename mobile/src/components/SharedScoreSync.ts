// Live data + saving for one shared (Supabase) round — the native side of
// ../src/pages/ShareScorecard.tsx's data layer.
//
// Loading:  getRound + listMembers + getRoundScores from @shared/cloud.
// Realtime: one channel per mounted screen with postgres_changes on
//           round_scores (this round), rounds (this round) and trip_members
//           (this trip). Removed on unmount. On (re)subscribe and when the app
//           returns to the foreground we refetch scores to catch anything
//           missed while disconnected.
// Saving:   score edits are applied locally first (optimistic), queued per
//           member, and flushed after a short debounce. A failed write stays
//           queued and is retried with backoff; while anything is unconfirmed
//           the status is 'saving' or 'offline'. Incoming realtime rows for a
//           member with an unconfirmed local edit are ignored so they can't
//           clobber what was just typed.
import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'
import {
  getRound,
  getRoundScores,
  listMembers,
  saveRoundGame,
  saveRoundTeams,
  saveRoundWolf,
  type ScoreMap,
  type SharedMember,
  type SharedRound,
} from '@shared/cloud'
import { isTeamGame } from '@shared/games'
import type { Member, Round, Team, WolfPick } from '@shared/types'
import { supabase } from '@/lib/supabase'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'offline'
export type LoadState = 'loading' | 'ready' | 'error'

const DEBOUNCE_MS = 600
const MAX_RETRY_MS = 30000

/** Stable avatar colours for shared members (they have none in the cloud). */
export const SHARED_MEMBER_COLORS = ['#1b6b46', '#c6952a', '#1d5fb0', '#b5476b', '#6b4fb5', '#2a8c8c', '#c0533b', '#4e7a1f']

export function toLocalMembers(members: SharedMember[]): Member[] {
  return members.map((m, i) => ({ id: m.id, name: m.name, color: SHARED_MEMBER_COLORS[i % SHARED_MEMBER_COLORS.length] }))
}

/** Pseudo local Round so the app's scoring UI + @shared/games maths can be reused. */
export function sharedAsRound(round: SharedRound, scores: ScoreMap): Round {
  return {
    id: round.id,
    courseName: round.courseName,
    date: '',
    holePars: round.holePars,
    scores,
    stats: {},
    game: round.game,
    teams: (round.teams as Team[]) ?? [],
    wolf: (round.wolf as (WolfPick | null)[]) ?? [],
  }
}

/** Scramble: a team's score on a hole = whatever a teammate entered first. */
export function scrambleScores(round: SharedRound, scores: ScoreMap): ScoreMap {
  const map: ScoreMap = {}
  for (const t of (round.teams as Team[]) ?? []) {
    map[t.id] = round.holePars.map((_, h) => {
      for (const mid of t.memberIds) {
        const v = scores[mid]?.[h]
        if (v != null) return v
      }
      return null
    })
  }
  return map
}

/** Same upsert as saveMemberScores, but surfaces failures so we can retry. */
async function upsertScores(roundId: string, memberId: string, strokes: (number | null)[]) {
  if (!supabase) throw new Error('offline')
  const { error } = await supabase
    .from('round_scores')
    .upsert({ round_id: roundId, member_id: memberId, strokes }, { onConflict: 'round_id,member_id' })
  if (error) throw error
}

/** Web parity: auto-create two balanced teams when a team game has none. */
function withTeams(r: SharedRound, members: SharedMember[]): SharedRound {
  const teams = (r.teams as Team[]) ?? []
  if (!isTeamGame(r.game) || teams.length >= 2 || members.length < 2) return r
  const a: string[] = []
  const b: string[] = []
  members.forEach((m, i) => (i % 2 === 0 ? a : b).push(m.id))
  const next: Team[] = [
    { id: 'teamA', name: 'Team 1', memberIds: a },
    { id: 'teamB', name: 'Team 2', memberIds: b },
  ]
  saveRoundTeams(r.id, next).catch(() => {})
  return { ...r, teams: next }
}

export function useSharedRound(tripId: string, roundId: string, enabled: boolean) {
  const [round, setRound] = useState<SharedRound | null>(null)
  const [members, setMembers] = useState<SharedMember[]>([])
  const [scores, setScores] = useState<ScoreMap>({})
  const [load, setLoad] = useState<LoadState>('loading')
  const [reloadKey, setReloadKey] = useState(0)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  /** member -> latest local strokes not yet confirmed by the server */
  const dirty = useRef(new Map<string, (number | null)[]>())
  const inflight = useRef(new Set<string>())
  const failed = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryMs = useRef(0)
  const membersRef = useRef<SharedMember[]>([])

  const updateStatus = useCallback(() => {
    if (dirty.current.size === 0) setSaveStatus('saved')
    else setSaveStatus(failed.current ? 'offline' : 'saving')
  }, [])

  const flush = useCallback(() => {
    const run = () => {
      if (timer.current) {
        clearTimeout(timer.current)
        timer.current = null
      }
      const schedule = (ms: number) => {
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(run, ms)
      }
      for (const [mid, strokes] of dirty.current) {
        if (inflight.current.has(mid)) continue
        inflight.current.add(mid)
        upsertScores(roundId, mid, strokes)
          .then(() => {
            inflight.current.delete(mid)
            failed.current = false
            retryMs.current = 0
            if (dirty.current.get(mid) === strokes) dirty.current.delete(mid)
            else schedule(DEBOUNCE_MS) // a newer edit arrived while saving
            updateStatus()
          })
          .catch(() => {
            inflight.current.delete(mid)
            failed.current = true
            retryMs.current = Math.min(MAX_RETRY_MS, retryMs.current ? retryMs.current * 2 : 2000)
            schedule(retryMs.current)
            updateStatus()
          })
      }
    }
    run()
  }, [roundId, updateStatus])

  /** server scores, keeping any member with an unconfirmed local edit */
  const mergeServer = useCallback((server: ScoreMap) => {
    const local = new Map(dirty.current)
    setScores((prev) => {
      const next: ScoreMap = { ...prev, ...server }
      for (const [mid, strokes] of local) next[mid] = strokes
      return next
    })
  }, [])

  const refetchScores = useCallback(() => {
    getRoundScores(roundId)
      .then((s) => mergeServer(s))
      .catch(() => {})
  }, [roundId, mergeServer])

  // initial load (and Retry)
  useEffect(() => {
    if (!enabled) return
    let alive = true
    Promise.all([getRound(roundId), listMembers(tripId), getRoundScores(roundId)])
      .then(([r, m, s]) => {
        if (!alive) return
        // A signed-in member always sees at least themselves; an empty roster
        // means the request failed (offline) or no access.
        if (!r || m.length === 0) {
          setLoad('error')
          return
        }
        membersRef.current = m
        setMembers(m)
        setRound(withTeams(r, m))
        mergeServer(s)
        setLoad('ready')
      })
      .catch(() => alive && setLoad('error'))
    return () => {
      alive = false
    }
  }, [enabled, tripId, roundId, reloadKey, mergeServer])

  // realtime
  useEffect(() => {
    if (!enabled || !supabase) return
    const sb = supabase
    let subscribedOnce = false
    const ch = sb
      .channel(`app-round-${roundId}-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'round_scores', filter: `round_id=eq.${roundId}` },
        (payload) => {
          const row = payload.new as { member_id?: string; strokes?: (number | null)[] } | null
          const mid = row?.member_id
          if (!mid || dirty.current.has(mid)) return
          setScores((prev) => ({ ...prev, [mid]: row?.strokes ?? Array(18).fill(null) }))
        },
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds', filter: `id=eq.${roundId}` }, () => {
        getRound(roundId)
          .then((r) => r && setRound(withTeams(r, membersRef.current)))
          .catch(() => {})
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_members', filter: `trip_id=eq.${tripId}` }, () => {
        listMembers(tripId)
          .then((m) => {
            if (m.length === 0) return
            membersRef.current = m
            setMembers(m)
          })
          .catch(() => {})
      })
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') return
        // reconnected: catch up on anything we missed, push anything queued
        if (subscribedOnce) refetchScores()
        subscribedOnce = true
        if (dirty.current.size) flush()
      })
    return () => {
      sb.removeChannel(ch)
    }
  }, [enabled, tripId, roundId, refetchScores, flush])

  // back in the foreground: retry queued saves and catch up
  useEffect(() => {
    if (!enabled) return
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return
      if (dirty.current.size) flush()
      refetchScores()
    })
    return () => sub.remove()
  }, [enabled, refetchScores, flush])

  // leaving the screen: stop timers, fire one last save attempt
  useEffect(() => {
    const t = timer
    const d = dirty
    return () => {
      if (t.current) clearTimeout(t.current)
      t.current = null
      if (d.current.size) flush()
    }
  }, [flush])

  /** Optimistic score edit for one member/hole; saved after a short debounce. */
  function setScore(memberId: string, hole: number, value: number | null) {
    if (!round) return
    const len = round.holePars.length
    const base = dirty.current.get(memberId) ?? scores[memberId] ?? []
    const cur = Array.from({ length: Math.max(len, base.length) }, (_, i) => base[i] ?? null)
    cur[hole] = value == null ? null : Math.min(15, Math.max(1, value))
    dirty.current.set(memberId, cur)
    setScores((prev) => ({ ...prev, [memberId]: cur }))
    setSaveStatus(failed.current ? 'offline' : 'saving')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(flush, DEBOUNCE_MS)
  }

  function setGame(game: string) {
    if (!round) return
    setRound(withTeams({ ...round, game }, members))
    saveRoundGame(roundId, game).catch(() => {})
  }

  function setTeams(teams: Team[]) {
    setRound((r) => (r ? { ...r, teams } : r))
    saveRoundTeams(roundId, teams).catch(() => {})
  }

  function setWolfPick(hole: number, pick: WolfPick | null) {
    if (!round) return
    const w = [...((round.wolf as (WolfPick | null)[]) ?? [])]
    while (w.length < round.holePars.length) w.push(null)
    w[hole] = pick
    setRound({ ...round, wolf: w })
    saveRoundWolf(roundId, w).catch(() => {})
  }

  function retry() {
    setLoad('loading')
    setReloadKey((k) => k + 1)
  }

  return { round, members, scores, load, saveStatus, setScore, setGame, setTeams, setWolfPick, retry }
}
