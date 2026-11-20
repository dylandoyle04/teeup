import { computeRyder, nextHole } from '@shared/ryder'
import { fmtPts } from '@shared/ryderLanding'
import type { Trip } from '@shared/types'

// Live status lines for a trip (Home's "Jump back in" tile).

export const EXAMPLE_TRIP_ID = 'trip_sample'

const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** The trip Home leads with: the one last opened, else a real trip happening today. */
export function pickActiveTrip(trips: Trip[], lastId: string | null): Trip | undefined {
  const last = lastId ? trips.find((t) => t.id === lastId) : undefined
  if (last) return last
  const t = todayISO()
  return trips.find(
    (trip) => trip.id !== EXAMPLE_TRIP_ID && trip.startDate && trip.startDate <= t && (trip.endDate || trip.startDate) >= t,
  )
}

export function cupLine(trip: Trip): string | null {
  if (!trip.ryderCup) return null
  const s = computeRyder(trip)
  if (!s) return null
  const { teamAName, teamBName } = trip.ryderCup
  return `${teamAName} ${fmtPts(s.aPoints)} – ${fmtPts(s.bPoints)} ${teamBName}`
}

export function roundLine(trip: Trip): string | null {
  const today = todayISO()
  const round = trip.rounds.find((r) => r.date === today) ?? trip.rounds[trip.rounds.length - 1]
  if (!round) return null
  const thru = nextHole(round)
  const where = thru >= round.holePars.length ? 'final' : thru === 0 ? 'not started' : `thru ${thru}`
  return `${round.date === today ? 'Today · ' : ''}${round.courseName} · ${where}`
}

/** Today's (else the latest) round, if it still has holes to score. */
export function roundInProgress(trip: Trip) {
  const today = todayISO()
  const round = trip.rounds.find((r) => r.date === today) ?? trip.rounds[trip.rounds.length - 1]
  if (!round) return undefined
  const rows = Object.values(round.scores)
  const unfinished = rows.length === 0 || rows.some((row) => row.some((v) => v == null))
  return unfinished ? round : undefined
}
