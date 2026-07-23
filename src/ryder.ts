import type { ID, Round, Trip } from './types'

export type Side = 'A' | 'B'

export interface RyderCup {
  teamAName: string
  teamBName: string
  /** memberId -> which side they're on */
  teamOf: Record<ID, Side>
}

// Classic Ryder Cup format progression, cycled if there are more rounds.
export const RYDER_FORMATS = [
  {
    name: 'Fourball',
    tag: 'Best Ball',
    how: 'Everyone plays their own ball; each hole your team takes its best (lowest) score.',
  },
  {
    name: 'Foursomes',
    tag: 'Alternate Shot',
    how: 'Partners share one ball and alternate shots — pick your order and stick to it.',
  },
  {
    name: 'Singles',
    tag: '1 vs 1',
    how: 'Everyone plays their own ball head-to-head; low score on the hole wins it for their side.',
  },
] as const

export function formatForIndex(i: number) {
  return RYDER_FORMATS[i % RYDER_FORMATS.length]
}

export interface SessionResult {
  round: Round
  /** true unless the round was toggled off */
  counts: boolean
  /** 0-based position among counting rounds (only meaningful when counts) */
  index: number
  format: (typeof RYDER_FORMATS)[number] | null
  aHoles: number
  bHoles: number
  thru: number
  /** null until any score is entered */
  winner: Side | 'tie' | null
  /** points awarded from this session (0, 0.5 or 1 per side) */
  aPts: number
  bPts: number
}

function sideMembers(rc: RyderCup, side: Side): ID[] {
  return Object.keys(rc.teamOf).filter((id) => rc.teamOf[id] === side)
}

/** A round counts toward the cup unless explicitly switched off. */
export function roundCounts(round: Round): boolean {
  return round.ryder !== false
}

// Best-ball match play for one round using the trip-wide Ryder teams.
// `index` is the counting-session position (for Day/format); -1 if it doesn't count.
function sessionResult(rc: RyderCup, round: Round, index: number): SessionResult {
  const counts = index >= 0
  const a = sideMembers(rc, 'A')
  const b = sideMembers(rc, 'B')
  const best = (ids: ID[], hole: number) => {
    const vals = ids
      .map((id) => round.scores[id]?.[hole] ?? null)
      .filter((v): v is number => v != null)
    return vals.length ? Math.min(...vals) : null
  }
  let aHoles = 0
  let bHoles = 0
  let thru = 0
  round.holePars.forEach((_, i) => {
    const av = best(a, i)
    const bv = best(b, i)
    if (av == null || bv == null) return
    thru++
    if (av < bv) aHoles++
    else if (bv < av) bHoles++
  })
  let winner: Side | 'tie' | null = null
  let aPts = 0
  let bPts = 0
  if (thru > 0) {
    if (aHoles > bHoles) winner = 'A'
    else if (bHoles > aHoles) winner = 'B'
    else winner = 'tie'
  }
  if (counts && winner) {
    if (winner === 'A') aPts = 1
    else if (winner === 'B') bPts = 1
    else {
      aPts = 0.5
      bPts = 0.5
    }
  }
  return {
    round,
    counts,
    index: counts ? index : -1,
    format: counts ? formatForIndex(index) : null,
    aHoles,
    bHoles,
    thru,
    winner,
    aPts,
    bPts,
  }
}

export interface RyderStandings {
  aPoints: number
  bPoints: number
  /** points needed to clinch the cup */
  clinch: number
  totalSessions: number
  played: number
  sessions: SessionResult[]
  decided: Side | 'tie' | null
}

export function computeRyder(trip: Trip): RyderStandings | null {
  const rc = trip.ryderCup
  if (!rc) return null
  let counter = 0
  const sessions = trip.rounds.map((r) =>
    sessionResult(rc, r, roundCounts(r) ? counter++ : -1),
  )
  const counting = sessions.filter((s) => s.counts)
  const aPoints = counting.reduce((s, x) => s + x.aPts, 0)
  const bPoints = counting.reduce((s, x) => s + x.bPts, 0)
  const total = counting.length
  const clinch = total > 0 ? total / 2 + 0.5 : 0
  const played = counting.filter((s) => s.winner != null).length
  let decided: Side | 'tie' | null = null
  if (total > 0) {
    if (aPoints >= clinch) decided = 'A'
    else if (bPoints >= clinch) decided = 'B'
    else if (played === total && aPoints === bPoints) decided = 'tie'
  }
  return { aPoints, bPoints, clinch, totalSessions: total, played, sessions, decided }
}
