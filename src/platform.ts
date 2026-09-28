import { createJSONStorage } from 'zustand/middleware'

// Platform seam: the few web-only details the shared logic needs. The native
// app (mobile/) swaps this file for mobile/src/platform.ts via its Metro config.

/** Prefix for images served from public/ (packages, stays, heroes). */
export const ASSET_BASE: string = import.meta.env.BASE_URL

/** Where the local (guest) trip store is persisted. */
export const persistStorage = createJSONStorage(() => localStorage)

/** Full URL for an in-app route, e.g. an invite link to share. */
export function appLink(path: string): string {
  return `${window.location.origin}${window.location.pathname}#${path}`
}
