import AsyncStorage from '@react-native-async-storage/async-storage'
import { createJSONStorage } from 'zustand/middleware'
import usPlaces from '@shared/data/usPlaces'

// Native side of the platform seam — Metro swaps ../src/platform.ts for this
// file (see metro.config.js). Keep the exports identical.

/** Package, stay, and hero photos are served from the website, not bundled. */
export const ASSET_BASE = 'https://flagstickfinder.com/'

/** Guest trips live on the phone. */
export const persistStorage = createJSONStorage(() => AsyncStorage)

/** US places list for "trips near you" — bundled with the app (no on-demand fetch). */
export const loadUsPlaces = (): Promise<string> => Promise.resolve(usPlaces)

/** Shareable links point at the website, which opens the trip in a browser. */
export function appLink(path: string): string {
  return `https://flagstickfinder.com/#${path}`
}
