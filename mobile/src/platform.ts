import AsyncStorage from '@react-native-async-storage/async-storage'
import { createJSONStorage } from 'zustand/middleware'

// Native side of the platform seam — Metro swaps ../src/platform.ts for this
// file (see metro.config.js). Keep the exports identical.

/** Package, stay, and hero photos are served from the website, not bundled. */
export const ASSET_BASE = 'https://flagstickfinder.com/'

/** Guest trips live on the phone. */
export const persistStorage = createJSONStorage(() => AsyncStorage)

/** Shareable links point at the website, which opens the trip in a browser. */
export function appLink(path: string): string {
  return `https://flagstickfinder.com/#${path}`
}
