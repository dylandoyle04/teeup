import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import type { Place } from '@shared/nearby'

const KEY = 'ff-near'

interface NearState {
  /** where trips are sorted from ("trips near you"), shared by Home and Explore */
  place: Place | null
  setPlace: (p: Place | null) => void
}

export const useNear = create<NearState>((set) => ({
  place: null,
  setPlace: (place) => {
    set({ place })
    ;(place ? AsyncStorage.setItem(KEY, JSON.stringify(place)) : AsyncStorage.removeItem(KEY)).catch(() => {})
  },
}))

AsyncStorage.getItem(KEY)
  .then((v) => {
    const p = v ? JSON.parse(v) : null
    if (p && typeof p.lat === 'number' && typeof p.lon === 'number' && !useNear.getState().place) useNear.setState({ place: p })
  })
  .catch(() => {})
