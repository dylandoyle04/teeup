import * as Calendar from 'expo-calendar'
import { createEventInCalendarAsync } from 'expo-calendar/legacy'
import Constants, { ExecutionEnvironment } from 'expo-constants'
import type { Trip } from '@shared/types'

export type CalendarResult = 'saved' | 'canceled' | 'no-dates' | 'denied' | 'failed'

/** Day after a 'YYYY-MM-DD' (all-day events end at the start of the next day). */
function dayAfter(iso: string): Date {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  return d
}

/**
 * Opens iOS's own "New Event" sheet pre-filled with the trip, so the user
 * reviews and saves it. Write-only calendar access: we never read their
 * calendar.
 */
export async function addTripToCalendar(trip: Trip, notes: string): Promise<CalendarResult> {
  if (!trip.startDate) return 'no-dates'
  const details = {
    title: `⛳ ${trip.name}`,
    startDate: new Date(trip.startDate + 'T00:00:00'),
    endDate: dayAfter(trip.endDate || trip.startDate),
    allDay: true,
    location: trip.destination || undefined,
    notes,
  }
  try {
    // Expo Go ships a stub of the newer calendar API — use the legacy dialog there.
    if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
      const r = await createEventInCalendarAsync(details)
      return r.action === 'saved' || r.action === 'done' ? 'saved' : 'canceled'
    }
    const perm = await Calendar.requestCalendarPermissions(true)
    if (!perm.granted) return 'denied'
    const r = await Calendar.getDefaultCalendarSync().addEventWithForm(details)
    return r.action === 'saved' || r.action === 'done' ? 'saved' : 'canceled'
  } catch {
    return 'failed'
  }
}
