import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'

const KEY = 'ff-last-trip'

export type TripSection = 'setup' | 'book' | 'score' | 'stats' | 'ryder' | 'bets'

interface LastTrip {
  tripId: string | null
  section: TripSection | null
  /** remember the trip + tab the user was last in (Home's "Jump back in") */
  visit: (tripId: string, section: TripSection) => void
  forget: () => void
}

export const useLastTrip = create<LastTrip>((set) => ({
  tripId: null,
  section: null,
  visit: (tripId, section) => {
    set({ tripId, section })
    AsyncStorage.setItem(KEY, JSON.stringify({ tripId, section })).catch(() => {})
  },
  forget: () => {
    set({ tripId: null, section: null })
    AsyncStorage.removeItem(KEY).catch(() => {})
  },
}))

// restore once at launch (a visit made before this resolves wins)
AsyncStorage.getItem(KEY)
  .then((v) => {
    const saved = v ? JSON.parse(v) : null
    if (saved?.tripId && !useLastTrip.getState().tripId) useLastTrip.setState(saved)
  })
  .catch(() => {})
