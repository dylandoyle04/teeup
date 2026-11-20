import { createJSONStorage } from 'zustand/middleware'

// Platform seam: the few web-only details the shared logic needs. The native
// app (mobile/) swaps this file for mobile/src/platform.ts via its Metro config.

/** Prefix for images served from public/ (packages, stays, heroes). */
export const ASSET_BASE: string = import.meta.env.BASE_URL

/** Where the local (guest) trip store is persisted. */
export const persistStorage = createJSONStorage(() => localStorage)

/** US places list for "trips near you" — split out so the site only downloads it on use. */
export const loadUsPlaces = (): Promise<string> => import('./data/usPlaces').then((m) => m.default)

/**
 * Full URL for a shareable route, e.g. an invite link. Path-style (not #/) so
 * the iPhone app can claim /join/* as a universal link; in a browser,
 * 404.html forwards it into the hash router.
 */
export function appLink(path: string): string {
  return `${window.location.origin}${path}`
}
