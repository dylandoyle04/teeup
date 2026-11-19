// Pure golf stats for a trip: per-round lines per player (or Scramble team)
// and trip totals per player. No React / DOM — shared by the website and app.
import { parPlayed, sum } from './games'
import type { ID, Round } from './types'

/** Who carries a scorecard row in a round: a player, or a team in Scramble. */
export interface ScoringEntity {
  id: ID
  kind: 'member' | 'team'
  /** team name (teams only; members are looked up by the caller) */
  name?: string
}

/** Scramble rounds with 2+ teams are scored per team, everything else per player. */
export function isTeamScored(round: Round): boolean {
  return round.game === 'Scramble' && (round.teams?.length ?? 0) >= 2
}

/** The rows scored in a round (mirrors the scorecard's roundRows). */
export function scoringEntities(round: Round, memberIds: ID[]): ScoringEntity[] {
  if (isTeamScored(round)) return round.teams.map((t) => ({ id: t.id, kind: 'team', name: t.name }))
  return memberIds.map((id) => ({ id, kind: 'member' }))
}

/** hits / attempts as a 0..1 fraction, or null when nothing was entered. */
export function ratio(hit: number, attempts: number): number | null {
  return attempts > 0 ? hit / attempts : null
}

/** "64%" or "—" when there's no data. */
export function fmtPct(p: number | null): string {
  return p == null ? '—' : `${Math.round(p * 100)}%`
}

/** One decimal ("72.5"), or "—" when null. */
export function fmtAvg(n: number | null, digits = 1): string {
  return n == null ? '—' : n.toFixed(digits)
}

export interface RoundLine {
  id: ID
  /** holes with a score entered */
  holes: number
  /** every hole of the course scored (and the course has 18 holes) */
  complete18: boolean
  strokes: number
  /** par over the holes played only */
  par: number
  /** strokes − par over the holes played */
  toPar: number
  /** score buckets relative to par, over holes played */
  birdiesOrBetter: number
  eagles: number
  pars: number
  bogeys: number
  doublesPlus: number
  /** total putts over holes with putts entered */
  putts: number
  puttHoles: number
  puttsPerHole: number | null
  /** fairways hit / par-4-and-5 holes with a fairway entry */
  firHit: number
  firHoles: number
  firPct: number | null
  /** greens hit / holes with a GIR entry */
  girHit: number
  girHoles: number
  girPct: number | null
  /** lowest score vs par (earliest hole wins ties); null when nothing scored */
  bestHole: { hole: number; strokes: number; toPar: number } | null
}

/** Stats for one player (or team) in one round. */
export function roundLine(round: Round, id: ID): RoundLine {
  const pars = round.holePars
  const scores = round.scores[id] ?? []
  const stats = round.stats?.[id] ?? []
  const line: RoundLine = {
    id,
    holes: 0,
    complete18: false,
    strokes: sum(scores),
    par: parPlayed(round, scores),
    toPar: 0,
    birdiesOrBetter: 0,
    eagles: 0,
    pars: 0,
    bogeys: 0,
    doublesPlus: 0,
    putts: 0,
    puttHoles: 0,
    puttsPerHole: null,
    firHit: 0,
    firHoles: 0,
    firPct: null,
    girHit: 0,
    girHoles: 0,
    girPct: null,
    bestHole: null,
  }
  line.toPar = line.strokes - line.par

  pars.forEach((par, i) => {
    const s = scores[i]
    if (s != null) {
      line.holes++
      const rel = s - par
      if (rel <= -1) line.birdiesOrBetter++
      if (rel <= -2) line.eagles++
      if (rel === 0) line.pars++
      if (rel === 1) line.bogeys++
      if (rel >= 2) line.doublesPlus++
      if (!line.bestHole || rel < line.bestHole.toPar) line.bestHole = { hole: i + 1, strokes: s, toPar: rel }
    }
    const st = stats[i]
    if (!st) return
    if (st.putts != null) {
      line.putts += st.putts
      line.puttHoles++
    }
    if (par > 3 && st.fir != null) {
      line.firHoles++
      if (st.fir) line.firHit++
    }
    if (st.gir != null) {
      line.girHoles++
      if (st.gir) line.girHit++
    }
  })

  line.complete18 = pars.length === 18 && line.holes === 18
  line.puttsPerHole = line.puttHoles ? line.putts / line.puttHoles : null
  line.firPct = ratio(line.firHit, line.firHoles)
  line.girPct = ratio(line.girHit, line.girHoles)
  return line
}

/** True when the line has anything worth showing (a score or any stat). */
export function lineHasData(l: RoundLine): boolean {
  return l.holes > 0 || l.puttHoles > 0 || l.firHoles > 0 || l.girHoles > 0
}

export interface PlayerTotals {
  id: ID
  /** individually-scored rounds with at least one hole scored */
  rounds: number
  /** of those, complete 18-hole rounds */
  completeRounds: number
  holes: number
  /** mean strokes over complete 18-hole rounds */
  scoringAvg: number | null
  /** mean to-par over complete 18-hole rounds */
  toParAvg: number | null
  /** lowest complete 18-hole round */
  bestRound: { roundId: ID; courseName: string; date: string; strokes: number; toPar: number } | null
  birdiesOrBetter: number
  eagles: number
  pars: number
  bogeys: number
  doublesPlus: number
  firHit: number
  firHoles: number
  firPct: number | null
  girHit: number
  girHoles: number
  girPct: number | null
  putts: number
  puttHoles: number
  puttsPerHole: number | null
  /** putts per hole × 18 (normalised so partial rounds still count) */
  puttsPerRound: number | null
}

/**
 * Trip totals for one player across the rounds they were individually scored
 * in. Team-scored (Scramble) rounds are skipped — those strokes aren't theirs.
 */
export function playerTotals(rounds: Round[], memberId: ID): PlayerTotals {
  const t: PlayerTotals = {
    id: memberId,
    rounds: 0,
    completeRounds: 0,
    holes: 0,
    scoringAvg: null,
    toParAvg: null,
    bestRound: null,
    birdiesOrBetter: 0,
    eagles: 0,
    pars: 0,
    bogeys: 0,
    doublesPlus: 0,
    firHit: 0,
    firHoles: 0,
    firPct: null,
    girHit: 0,
    girHoles: 0,
    girPct: null,
    putts: 0,
    puttHoles: 0,
    puttsPerHole: null,
    puttsPerRound: null,
  }
  let strokes18 = 0
  let toPar18 = 0
  for (const r of rounds) {
    if (isTeamScored(r)) continue
    const l = roundLine(r, memberId)
    if (!lineHasData(l)) continue
    if (l.holes > 0) t.rounds++
    t.holes += l.holes
    t.birdiesOrBetter += l.birdiesOrBetter
    t.eagles += l.eagles
    t.pars += l.pars
    t.bogeys += l.bogeys
    t.doublesPlus += l.doublesPlus
    t.firHit += l.firHit
    t.firHoles += l.firHoles
    t.girHit += l.girHit
    t.girHoles += l.girHoles
    t.putts += l.putts
    t.puttHoles += l.puttHoles
    if (l.complete18) {
      t.completeRounds++
      strokes18 += l.strokes
      toPar18 += l.toPar
      const b = t.bestRound
      if (!b || l.strokes < b.strokes || (l.strokes === b.strokes && l.toPar < b.toPar)) {
        t.bestRound = { roundId: r.id, courseName: r.courseName, date: r.date, strokes: l.strokes, toPar: l.toPar }
      }
    }
  }
  if (t.completeRounds) {
    t.scoringAvg = strokes18 / t.completeRounds
    t.toParAvg = toPar18 / t.completeRounds
  }
  t.firPct = ratio(t.firHit, t.firHoles)
  t.girPct = ratio(t.girHit, t.girHoles)
  t.puttsPerHole = t.puttHoles ? t.putts / t.puttHoles : null
  t.puttsPerRound = t.puttsPerHole == null ? null : t.puttsPerHole * 18
  return t
}

export type LeaderKey = 'lowRound' | 'bestAvg' | 'birdies' | 'gir' | 'fir' | 'putts'

export interface Leader {
  key: LeaderKey
  label: string
  /** the leading value (strokes, average, count, 0..1 fraction or putts) */
  value: number
  /** everyone tied on that value */
  ids: ID[]
  /** Low round only: the course it was shot on (first leader's) */
  detail?: string
}

/** Trip leaders for each stat, only where someone has data. */
export function tripLeaders(totals: PlayerTotals[]): Leader[] {
  const out: Leader[] = []
  const pick = (
    key: LeaderKey,
    label: string,
    get: (t: PlayerTotals) => number | null,
    dir: 'min' | 'max',
    detail?: (t: PlayerTotals) => string | undefined,
  ) => {
    const vals = totals.map((t) => ({ t, v: get(t) })).filter((x): x is { t: PlayerTotals; v: number } => x.v != null)
    if (!vals.length) return
    const best = dir === 'min' ? Math.min(...vals.map((x) => x.v)) : Math.max(...vals.map((x) => x.v))
    const lead = vals.filter((x) => Math.abs(x.v - best) < 1e-9)
    out.push({ key, label, value: best, ids: lead.map((x) => x.t.id), detail: detail?.(lead[0].t) })
  }
  pick('lowRound', 'Low round', (t) => t.bestRound?.strokes ?? null, 'min', (t) => t.bestRound?.courseName)
  pick('bestAvg', 'Best average', (t) => t.scoringAvg, 'min')
  pick('birdies', 'Most birdies', (t) => (t.birdiesOrBetter > 0 ? t.birdiesOrBetter : null), 'max')
  pick('gir', 'Greens in reg.', (t) => t.girPct, 'max')
  pick('fir', 'Fairways hit', (t) => t.firPct, 'max')
  pick('putts', 'Fewest putts / rd', (t) => t.puttsPerRound, 'min')
  return out
}
