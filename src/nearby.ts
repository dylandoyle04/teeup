// "Trips near me": turn a typed place or the device location into a point,
// then rank the trip destinations by distance. Shared by the website and app.
import { PACKAGES } from './packages'

export interface Point {
  lat: number
  lon: number
}

export interface Place extends Point {
  /** e.g. "Kent, OH" or "Ohio" */
  label: string
}

/** Rough centre of each trip destination's golf. */
export const DESTINATION_COORDS: Record<string, Point> = {
  'Boyne, MI': { lat: 45.17, lon: -84.93 },
  'Charleston, SC': { lat: 32.78, lon: -79.93 },
  'Hilton Head Island, SC': { lat: 32.22, lon: -80.75 },
  'Las Vegas, NV': { lat: 36.17, lon: -115.14 },
  'Myrtle Beach, SC': { lat: 33.69, lon: -78.89 },
  'Naples, FL': { lat: 26.14, lon: -81.79 },
  'Orlando, FL': { lat: 28.54, lon: -81.38 },
  'Palm Springs, CA': { lat: 33.83, lon: -116.55 },
  'Pinehurst, NC': { lat: 35.2, lon: -79.47 },
  'San Diego, CA': { lat: 32.72, lon: -117.16 },
  'Scottsdale, AZ': { lat: 33.49, lon: -111.93 },
}

export function distanceMiles(a: Point, b: Point): number {
  const R = 3958.8
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLon = (b.lon - a.lon) * rad
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Straight-line miles from `from` to each trip destination, nearest first. */
export function rankDestinations(from: Point): { destination: string; miles: number }[] {
  const dests = Array.from(new Set(PACKAGES.map((p) => p.destination)))
  return dests
    .filter((d) => DESTINATION_COORDS[d])
    .map((d) => ({ destination: d, miles: distanceMiles(from, DESTINATION_COORDS[d]) }))
    .sort((a, b) => a.miles - b.miles)
}

/** "~6 hr drive" for drivable distances, otherwise a rough flight time. */
export function travelHint(miles: number): string {
  if (miles < 40) return 'Right in your area'
  if (miles <= 650) {
    const hrs = Math.max(1, Math.round((miles * 1.2) / 65)) // roads ~20% longer, ~65 mph
    return `~${hrs} hr drive`
  }
  const hrs = Math.max(1, Math.round(miles / 450 + 1)) // cruise + airport overhead
  return `~${hrs} hr flight`
}

export function fmtMiles(miles: number): string {
  return `${Math.round(miles).toLocaleString()} mi`
}

// ---------------------------------------------------------------- places

const STATES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan',
  MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota',
  OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee',
  TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', PR: 'Puerto Rico',
}

interface Row {
  name: string
  key: string
  st: string
  lat: number
  lon: number
}

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/^(st|ste)\.?\s/, 'saint ')
    .replace(/^mt\.?\s/, 'mount ')
    .replace(/^ft\.?\s/, 'fort ')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

let rows: Row[] | null = null
let loading: Promise<Row[]> | null = null

/** Lazily loads the ~7.5k US places list (biggest first). */
function loadPlaces(): Promise<Row[]> {
  if (rows) return Promise.resolve(rows)
  loading ??= import('./data/usPlaces').then((m) => {
    rows = m.default.split('\n').map((line) => {
      const [name, st, lat, lon] = line.split('|')
      return { name, key: fold(name), st, lat: Number(lat), lon: Number(lon) }
    })
    return rows
  })
  return loading
}

function stateFrom(text: string): string | undefined {
  const t = text.trim()
  if (/^[a-z]{2}$/i.test(t) && STATES[t.toUpperCase()]) return t.toUpperCase()
  const f = fold(t)
  return Object.keys(STATES).find((k) => fold(STATES[k]) === f)
}

function stateCentre(all: Row[], st: string): Place | undefined {
  // first ~25 rows of a state are its biggest places: a decent "middle"
  const mine = all.filter((r) => r.st === st).slice(0, 25)
  if (!mine.length) return undefined
  const lat = mine.reduce((s, r) => s + r.lat, 0) / mine.length
  const lon = mine.reduce((s, r) => s + r.lon, 0) / mine.length
  return { label: STATES[st], lat, lon }
}

/**
 * Suggestions for a typed place: "Kent", "Kent, OH", "kent oh", "Ohio", "SC".
 * Exact name matches first, then prefix matches, biggest places first.
 */
export async function searchPlaces(query: string, limit = 6): Promise<Place[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const all = await loadPlaces()

  // split "City, ST" / "City ST" / "City, State Name"
  let cityPart = q
  let st: string | undefined
  const comma = q.lastIndexOf(',')
  if (comma > 0) {
    st = stateFrom(q.slice(comma + 1))
    if (st) cityPart = q.slice(0, comma)
  } else {
    const m = q.match(/^(.*\S)\s+([A-Za-z]{2})$/)
    if (m && STATES[m[2].toUpperCase()]) {
      st = m[2].toUpperCase()
      cityPart = m[1]
    }
  }

  const out: Place[] = []
  const wholeState = stateFrom(q)
  if (wholeState) {
    const c = stateCentre(all, wholeState)
    if (c) out.push(c)
  }

  const key = fold(cityPart)
  if (key) {
    const pool = st ? all.filter((r) => r.st === st) : all
    const exact = pool.filter((r) => r.key === key)
    const prefix = pool.filter((r) => r.key !== key && r.key.startsWith(key))
    for (const r of [...exact, ...prefix]) {
      if (out.length >= limit) break
      out.push({ label: `${r.name}, ${r.st}`, lat: r.lat, lon: r.lon })
    }
  }

  // "Kent, OH" style where the town is too small for the list: use the state
  if (!out.length && st) {
    const c = stateCentre(all, st)
    if (c) out.push(c)
  }
  return out
}

/** Nearest listed place to a GPS fix, for a friendly "Near Kent, OH" label. */
export async function nearestPlaceLabel(p: Point): Promise<string> {
  const all = await loadPlaces()
  let best: Row | undefined
  let bestD = Infinity
  for (const r of all) {
    const d = distanceMiles(p, r)
    if (d < bestD) {
      bestD = d
      best = r
    }
  }
  return best && bestD < 60 ? `${best.name}, ${best.st}` : 'your location'
}
