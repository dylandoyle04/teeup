// Shared (cloud) Cup maths — a straight port of the logic in
// ../src/pages/SharedRyder.tsx (which keeps it inline in the page). Each
// shared round is one match with its own format; a match is won by the side
// with more holes won (best ball over each side's players), worth 1 point,
// ½ each when halved.
import type { ScoreMap, SharedRound, SharedRyder } from '@shared/cloud'

export type CupSide = 'A' | 'B'

export type CupFormat = { key: string; label: string; tag: string; how: string; oneBall: boolean }

/** Match formats a group can choose per match. */
export const CUP_FORMATS: CupFormat[] = [
  { key: 'Best Ball', label: 'Best Ball', tag: 'Fourball · 2v2', how: 'Everyone plays their own ball; each hole your team takes its best (lowest) score.', oneBall: false },
  { key: 'Alternate Shot', label: 'Alternate Shot', tag: 'Foursomes · 2v2', how: 'Partners share one ball and alternate every shot.', oneBall: true },
  { key: 'Scramble', label: 'Scramble', tag: 'Team · best shot', how: 'Everyone hits, the team plays the best shot, and repeats — one team score per hole.', oneBall: true },
  { key: 'Singles', label: 'Singles', tag: '1 v 1', how: 'Everyone plays their own ball head-to-head; low score wins the hole for their side.', oneBall: false },
]

export const cupFormatOf = (game: string): CupFormat =>
  CUP_FORMATS.find((f) => f.key === game) ?? { key: game, label: game, tag: 'match', how: '', oneBall: false }

/** 1.5 → "1½" */
export const fmtCupPts = (n: number) => (Number.isInteger(n) ? String(n) : `${Math.floor(n)}½`)

export type RoundWithScores = { round: SharedRound; scores: ScoreMap }

export interface CupSession {
  round: SharedRound
  scores: ScoreMap
  aHoles: number
  bHoles: number
  thru: number
  winner: CupSide | 'tie' | null
  aPts: number
  bPts: number
}

export function cupStandings(config: SharedRyder, rws: RoundWithScores[]) {
  const sideIds = (side: CupSide) => Object.keys(config.teamOf).filter((id) => config.teamOf[id] === side)
  const a = sideIds('A')
  const b = sideIds('B')
  const teamHole = (ids: string[], sc: ScoreMap, hole: number) => {
    const vals = ids.map((id) => sc[id]?.[hole]).filter((v): v is number => v != null)
    return vals.length ? Math.min(...vals) : null
  }
  const sessions: CupSession[] = rws.map(({ round, scores }) => {
    let aHoles = 0
    let bHoles = 0
    let thru = 0
    round.holePars.forEach((_, i) => {
      const av = teamHole(a, scores, i)
      const bv = teamHole(b, scores, i)
      if (av == null || bv == null) return
      thru++
      if (av < bv) aHoles++
      else if (bv < av) bHoles++
    })
    let winner: CupSide | 'tie' | null = null
    let aPts = 0
    let bPts = 0
    if (thru > 0) {
      winner = aHoles > bHoles ? 'A' : bHoles > aHoles ? 'B' : 'tie'
      if (winner === 'A') aPts = 1
      else if (winner === 'B') bPts = 1
      else {
        aPts = 0.5
        bPts = 0.5
      }
    }
    return { round, scores, aHoles, bHoles, thru, winner, aPts, bPts }
  })
  const aPoints = sessions.reduce((s, x) => s + x.aPts, 0)
  const bPoints = sessions.reduce((s, x) => s + x.bPts, 0)
  const total = sessions.length
  const clinch = total ? total / 2 + 0.5 : 0
  const played = sessions.filter((s) => s.winner != null).length
  let decided: CupSide | 'tie' | null = null
  if (total > 0) {
    if (aPoints >= clinch) decided = 'A'
    else if (bPoints >= clinch) decided = 'B'
    else if (played === total && aPoints === bPoints) decided = 'tie'
  }
  return { sessions, aPoints, bPoints, clinch, total, played, decided }
}

/** First hole (0-based) nobody has scored yet; = hole count once complete. */
export function firstUnplayed(pars: number[], scores: ScoreMap): number {
  for (let i = 0; i < pars.length; i++) {
    const any = Object.values(scores).some((s) => s?.[i] != null)
    if (!any) return i
  }
  return pars.length
}
