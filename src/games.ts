import type { ID, Member, Round } from './types'

export const GAMES = [
  'Stroke Play',
  'Stableford',
  'Skins',
  'High-Low',
  'Scramble',
  'Wolf',
] as const
export type Game = (typeof GAMES)[number]

export const TEAM_GAMES: Game[] = ['High-Low', 'Scramble']
export const isTeamGame = (g: string) => TEAM_GAMES.includes(g as Game)

export function sum(arr: (number | null)[]): number {
  return arr.reduce<number>((a, b) => a + (b ?? 0), 0)
}

export function relLabel(rel: number): string {
  if (rel === 0) return 'E'
  return rel > 0 ? `+${rel}` : `${rel}`
}

/** par over only the holes that have a score entered */
export function parPlayed(round: Round, scores: (number | null)[]): number {
  return round.holePars.reduce(
    (acc, p, i) => acc + (scores[i] != null ? p : 0),
    0,
  )
}

// ---------- Stableford ----------
// standard: bogey 1, par 2, birdie 3, eagle 4, albatross 5, dbl-bogey+ 0
export function stablefordPoints(strokes: number | null, par: number): number {
  if (strokes == null) return 0
  const rel = strokes - par
  if (rel >= 2) return 0
  if (rel === 1) return 1
  if (rel === 0) return 2
  if (rel === -1) return 3
  if (rel === -2) return 4
  return 5
}

export function computeStableford(round: Round, memberIds: ID[]) {
  return memberIds
    .map((id) => {
      const sc = round.scores[id] ?? []
      let pts = 0
      let thru = 0
      round.holePars.forEach((par, i) => {
        if (sc[i] != null) {
          pts += stablefordPoints(sc[i], par)
          thru++
        }
      })
      return { id, points: pts, thru }
    })
    .sort((a, b) => b.points - a.points)
}

// ---------- Skins (carryover on ties) ----------
export function computeSkins(round: Round, memberIds: ID[]) {
  const skins: Record<ID, number> = {}
  memberIds.forEach((id) => (skins[id] = 0))
  let carry = 1
  const holeWinners: (ID | null)[] = []
  round.holePars.forEach((_, i) => {
    const entries = memberIds
      .map((id) => ({ id, s: round.scores[id]?.[i] ?? null }))
      .filter((e) => e.s != null) as { id: ID; s: number }[]
    if (entries.length < 2) {
      holeWinners.push(null)
      return
    }
    const min = Math.min(...entries.map((e) => e.s))
    const low = entries.filter((e) => e.s === min)
    if (low.length === 1) {
      skins[low[0].id] += carry
      holeWinners.push(low[0].id)
      carry = 1
    } else {
      holeWinners.push(null)
      carry += 1
    }
  })
  return {
    rows: memberIds
      .map((id) => ({ id, skins: skins[id] }))
      .sort((a, b) => b.skins - a.skins),
    holeWinners,
  }
}

// ---------- High-Low (exactly 2 teams of any size) ----------
export function computeHighLow(round: Round) {
  const [A, B] = round.teams ?? []
  if (!A || !B) return null
  const teamLowHigh = (memberIds: ID[], hole: number) => {
    const vals = memberIds
      .map((id) => round.scores[id]?.[hole] ?? null)
      .filter((v): v is number => v != null)
    if (vals.length === 0) return null
    return { low: Math.min(...vals), high: Math.max(...vals) }
  }
  let aPts = 0
  let bPts = 0
  const holes: { hole: number; low: 'A' | 'B' | '½'; high: 'A' | 'B' | '½' }[] =
    []
  round.holePars.forEach((_, i) => {
    const a = teamLowHigh(A.memberIds, i)
    const b = teamLowHigh(B.memberIds, i)
    if (!a || !b) return
    const low = a.low < b.low ? 'A' : b.low < a.low ? 'B' : '½'
    const high = a.high < b.high ? 'A' : b.high < a.high ? 'B' : '½'
    if (low === 'A') aPts++
    else if (low === 'B') bPts++
    if (high === 'A') aPts++
    else if (high === 'B') bPts++
    holes.push({ hole: i + 1, low, high })
  })
  return { A, B, aPts, bPts, holes }
}

// ---------- Wolf ----------
// wolf rotates by hole through the member order
export function wolfForHole(memberIds: ID[], hole: number): ID | undefined {
  if (memberIds.length === 0) return undefined
  return memberIds[hole % memberIds.length]
}

export function computeWolf(round: Round, memberIds: ID[]) {
  const points: Record<ID, number> = {}
  memberIds.forEach((id) => (points[id] = 0))
  const holeLog: {
    hole: number
    wolf: ID
    detail: string
    result: string
  }[] = []

  round.holePars.forEach((_, i) => {
    const wolf = wolfForHole(memberIds, i)
    const pick = (round.wolf ?? [])[i]
    if (!wolf || !pick) return
    const scoreOf = (id: ID) => round.scores[id]?.[i] ?? null
    const best = (ids: ID[]) => {
      const vals = ids.map(scoreOf).filter((v): v is number => v != null)
      return vals.length ? Math.min(...vals) : null
    }
    let wolfSide: ID[]
    let hunters: ID[]
    if (pick.mode === 'partner' && pick.partnerId) {
      wolfSide = [wolf, pick.partnerId]
      hunters = memberIds.filter((id) => !wolfSide.includes(id))
    } else if (pick.mode === 'lone' || pick.mode === 'blind') {
      wolfSide = [wolf]
      hunters = memberIds.filter((id) => id !== wolf)
    } else {
      return // partner mode without a partner chosen yet
    }
    const w = best(wolfSide)
    const h = best(hunters)
    if (w == null || h == null) return // hole not complete
    const win = pick.mode === 'blind' ? 3 : pick.mode === 'lone' ? 2 : 1
    let result: string
    if (w < h) {
      wolfSide.forEach((id) => (points[id] += win))
      result = `Wolf +${win}`
    } else if (h < w) {
      hunters.forEach((id) => (points[id] += 1))
      result = `Hunters +1`
    } else {
      result = 'Push'
    }
    holeLog.push({
      hole: i + 1,
      wolf,
      detail:
        pick.mode === 'partner'
          ? 'with partner'
          : pick.mode === 'lone'
            ? 'Lone Wolf'
            : 'Blind Wolf',
      result,
    })
  })

  return {
    rows: memberIds
      .map((id) => ({ id, points: points[id] }))
      .sort((a, b) => b.points - a.points),
    holeLog,
  }
}

/** stroke/scramble leaderboard rows for a set of scoring-row ids */
export function strokeBoard(
  round: Round,
  rows: { id: ID; member: Member }[],
) {
  return rows
    .map(({ id, member }) => {
      const sc = round.scores[id] ?? Array(18).fill(null)
      const total = sum(sc)
      const thru = sc.filter((s) => s != null).length
      const rel = total - parPlayed(round, sc)
      return { id, member, total, thru, rel }
    })
    .sort((a, b) => {
      if (a.thru === 0 && b.thru === 0) return 0
      if (a.thru === 0) return 1
      if (b.thru === 0) return -1
      return a.rel - b.rel
    })
}
