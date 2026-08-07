// Affiliate links.
//
// Expedia's creator program issues a *generated* short link per target page
// rather than a tracking parameter we can append to any URL, so each
// destination has its own link, generated in the Expedia dashboard.
//
// Keyed by the package `destination` string. Anything missing falls back to a
// plain, untracked search so the button always works.

const EXPEDIA_HOTELS: Record<string, string> = {
  'Scottsdale, AZ':
    'https://expedia.com/affiliates/hotel-search-scottsdale.LAfpyLU',
  'Myrtle Beach, SC':
    'https://expedia.com/affiliates/hotel-search-myrtle-beach.E7vvFQ9',
  'Hilton Head Island, SC':
    'https://expedia.com/affiliates/hotel-search-hilton-head-island.2EMp7ND',
  'Las Vegas, NV':
    'https://expedia.com/affiliates/hotel-search-las-vegas-strip.6XrkZe6',
  'San Diego, CA':
    'https://expedia.com/affiliates/hotel-search-san-diego.lAzqOFb',
  'Boyne, MI':
    'https://expedia.com/affiliates/hotel-search-boyne-city.iifTU1f',
  'Orlando, FL':
    'https://expedia.com/affiliates/hotel-search-orlando.pD3xjl8',
}

const VRBO_RENTALS: Record<string, string> = {
  'Scottsdale, AZ': 'https://vrbo.com/affiliate/5tKgXZT',
  'Myrtle Beach, SC': 'https://vrbo.com/affiliate/h5vpEvS',
  'Hilton Head Island, SC': 'https://vrbo.com/affiliate/guXYLzf',
  'Las Vegas, NV': 'https://vrbo.com/affiliate/nVqlVrU',
  'San Diego, CA': 'https://vrbo.com/affiliate/IiEZsBJ',
  'Boyne, MI': 'https://vrbo.com/affiliate/Jm6cE2Y',
  'Orlando, FL': 'https://vrbo.com/affiliate/smTqrsr',
}

// One hand-picked Vrbo property per destination — a place a group of golfers
// could actually book. `url` is the direct listing; swap in your Vrbo affiliate
// deeplink for that property once you generate it in the dashboard.
export interface FeaturedStay {
  url: string
  desc: string
}
const VRBO_PROPERTY: Record<string, FeaturedStay> = {
  'Las Vegas, NV': {
    url: 'https://www.vrbo.com/1104017',
    desc: '4BR lakeside home with private pool & game room — sleeps a big group, NW Las Vegas near the Angel Park golf area.',
  },
  'Orlando, FL': {
    url: 'https://www.vrbo.com/1298609',
    desc: '5BR luxury home with private pool & spa on Reunion Resort golf course, ~6 miles from Disney.',
  },
  'Palm Springs, CA': {
    url: 'https://www.vrbo.com/1896831',
    desc: 'Remodeled 4BR home on the PGA West course in La Quinta — private pool and a golf cart.',
  },
}

// Extra public courses in each area you can also book tee times for, beyond the
// ones already in the package.
export interface AreaCourse {
  name: string
  golfNow?: string
  website?: string
}
const MORE_COURSES: Record<string, AreaCourse[]> = {
  'Las Vegas, NV': [
    { name: 'Reflection Bay (Lake Las Vegas)', golfNow: 'https://www.golfnow.com/tee-times/facility/881-reflection-bay-golf-club/search', website: 'https://www.reflectionbaygolf.com/' },
    { name: 'Wildhorse Golf Club', golfNow: 'https://www.golfnow.com/tee-times/facility/1111-wildhorse-golf-course/search', website: 'https://www.golfwildhorse.com/' },
    { name: 'Las Vegas Golf Club', golfNow: 'https://www.golfnow.com/tee-times/facility/1293-las-vegas-golf-club/search' },
  ],
  'Orlando, FL': [
    { name: "Falcon's Fire (Kissimmee)", golfNow: 'https://www.golfnow.com/tee-times/facility/4673-falcons-fire-golf-club/search', website: 'https://www.falconsfire.com/' },
    { name: 'Celebration Golf Club', golfNow: 'https://www.golfnow.com/tee-times/facility/1806-celebration-golf-club/search', website: 'https://www.celebrationgolf.com/' },
    { name: 'Mystic Dunes', golfNow: 'https://www.golfnow.com/tee-times/facility/466-mystic-dunes-golf-club/search' },
  ],
  'Palm Springs, CA': [
    { name: 'Classic Club (Palm Desert)', golfNow: 'https://www.golfnow.com/tee-times/facility/1662-classic-club-golf/search', website: 'https://www.classicclubgolf.com/' },
    { name: 'JW Marriott Desert Springs — Palm', golfNow: 'https://www.golfnow.com/tee-times/facility/6429-jw-marriott-desert-springs-palm-course/search' },
    { name: 'JW Marriott Desert Springs — Valley', golfNow: 'https://www.golfnow.com/tee-times/facility/209-jw-marriott-desert-springs-valley-course/search' },
  ],
}

const EXPEDIA_CARS: Record<string, string> = {
  'Scottsdale, AZ': 'https://expedia.com/affiliate/dkU2U4z',
  'Myrtle Beach, SC': 'https://expedia.com/affiliate/n8ivdtO',
  'Hilton Head Island, SC': 'https://expedia.com/affiliate/EnmaERX',
  'Las Vegas, NV': 'https://expedia.com/affiliate/C41QLLJ',
  'San Diego, CA': 'https://expedia.com/affiliate/GXsShSY',
  'Boyne, MI': 'https://expedia.com/affiliate/F8S3mVu',
  'Orlando, FL': 'https://expedia.com/affiliate/hDEsGna',
}

const EXPEDIA_FLIGHTS: Record<string, string> = {
  'Scottsdale, AZ': 'https://expedia.com/affiliate/zcA5nil',
  'Myrtle Beach, SC': 'https://expedia.com/affiliate/tCNPvBm',
  'Hilton Head Island, SC': 'https://expedia.com/affiliate/UwiSJqX',
  'Las Vegas, NV': 'https://expedia.com/affiliate/HWodFNC',
  'San Diego, CA': 'https://expedia.com/affiliates/expedia-home.MDOK8io',
  'Boyne, MI': 'https://expedia.com/affiliates/expedia-home.Ee7d71Y',
  'Orlando, FL': 'https://expedia.com/affiliates/expedia-home.5SU7M4s',
}

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

export function carsLink(destination: string): string {
  return EXPEDIA_CARS[destination] || 'https://www.expedia.com/Carrentals'
}

export function flightsLink(destination: string): string {
  return (
    EXPEDIA_FLIGHTS[destination] ||
    `https://www.expedia.com/Flights-Search?leg1=to:${enc(destination)}`
  )
}

/** A hand-picked Vrbo property for this destination, if we have one. */
export function featuredStay(destination: string): FeaturedStay | undefined {
  return VRBO_PROPERTY[destination]
}

/** Extra area courses you can also book tee times for. */
export function moreCourses(destination: string): AreaCourse[] {
  return MORE_COURSES[destination] ?? []
}

/** Generic GolfNow area search — the "look for more places here" fallback. */
export function golfNowAreaLink(destination: string): string {
  return `https://www.golfnow.com/tee-times/search?q=${enc(destination)}`
}
