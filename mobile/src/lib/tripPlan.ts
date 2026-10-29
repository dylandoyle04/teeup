import { getPackage } from '@shared/packages'
import type { Member, Trip } from '@shared/types'
import { fmtDateRange } from '@/components/ui'

/** Course names for a trip: its rounds, else its package, else typed courses. */
export function tripCourseNames(trip: Trip): string[] {
  const fromRounds = trip.rounds.map((r) => r.courseName).filter(Boolean)
  if (fromRounds.length) return Array.from(new Set(fromRounds))
  const pkg = trip.sourcePackageId ? getPackage(trip.sourcePackageId) : undefined
  if (pkg) return pkg.courses.map((c) => c.name)
  return trip.courses.map((c) => c.name)
}

/**
 * Plain-text trip plan for the group chat (Messages, WhatsApp, email…).
 * Accounts and live invites come later; this gets everyone on the same page now.
 */
export function tripPlanText(trip: Trip, members: Member[]): string {
  const lines = [`⛳ ${trip.name}`]
  if (trip.destination) lines.push(`📍 ${trip.destination}`)
  lines.push(`🗓️ ${fmtDateRange(trip.startDate, trip.endDate)}`)

  const rounds = [...trip.rounds].filter((r) => r.courseName)
  if (rounds.length) {
    lines.push('', 'Rounds:')
    for (const r of rounds) lines.push(`• ${r.date ? fmtDateRange(r.date, r.date) + ' — ' : ''}${r.courseName}`)
  } else {
    const courses = tripCourseNames(trip)
    if (courses.length) {
      lines.push('', 'Courses:')
      for (const c of courses) lines.push(`• ${c}`)
    }
  }

  if (members.length > 1) lines.push('', `Crew: ${members.map((m) => m.name).join(', ')}`)
  if (trip.notes) lines.push('', trip.notes)
  lines.push('', 'Planned with Flagstick Finder — flagstickfinder.com')
  return lines.join('\n')
}
