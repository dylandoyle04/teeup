// Affiliate links.
//
// Expedia's creator program issues a *generated* short link per target page
// (https://www.expedia.com/affiliates/<slug>.<token>) rather than a tracking
// parameter we can append to any URL. So each destination needs its own link,
// generated once in the Expedia dashboard and pasted in below.
//
// Anything left blank falls back to a plain, untracked search so the button
// always works — it just doesn't earn until the link is filled in.

/** Expedia hotel-search affiliate links, keyed by package `destination`. */
const EXPEDIA_HOTELS: Record<string, string> = {
  'Scottsdale, AZ':
    'https://expedia.com/affiliates/hotel-search-scottsdale.LAfpyLU',
  // paste the generated hotel-search link for each destination below
  // 'Myrtle Beach, SC': '',
  // 'Hilton Head Island, SC': '',
  // 'Las Vegas, NV': '',
  // 'San Diego, CA': '',
  // 'Boyne, MI': '',
  // 'Orlando, FL': '',
}

/** Vrbo rental-search affiliate links, keyed by package `destination`. */
const VRBO_RENTALS: Record<string, string> = {}

/** Flight-search affiliate links per destination (optional). */
const EXPEDIA_FLIGHTS: Record<string, string> = {}

/** Single affiliate links that aren't destination specific. */
const EXPEDIA_FLIGHTS_ANY = 'https://expedia.com/affiliates/flights.u8Gakul'
const EXPEDIA_CARS = ''

const enc = (s: string) => encodeURIComponent(s || '')

export function hotelsLink(destination: string): string {
  return (
    EXPEDIA_HOTELS[destination] ||
    `https://www.expedia.com/Hotel-Search?destination=${enc(destination)}`
  )
}

export function rentalsLink(destination: string): string {
  return (
    VRBO_RENTALS[destination] ||
    `https://www.vrbo.com/search?q=${enc(destination)}`
  )
}

export function flightsLink(destination: string): string {
  return (
    EXPEDIA_FLIGHTS[destination] ||
    EXPEDIA_FLIGHTS_ANY ||
    `https://www.expedia.com/Flights-Search?leg1=to:${enc(destination)}`
  )
}

export function carsLink(): string {
  return EXPEDIA_CARS || 'https://www.expedia.com/Carrentals'
}
