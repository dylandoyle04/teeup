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
  // Orlando & Charleston affiliate links are area-wide (no single property),
  // so they live here on the general search button rather than as a featured stay.
  'Orlando, FL': 'https://vrbo.com/affiliate/kxESf7V',
  'Charleston, SC': 'https://vrbo.com/affiliate/pqmWsFK',
}

// One hand-picked Vrbo property per destination — a place a group of golfers
// could actually book. `url` is the property-specific Vrbo affiliate deeplink.
// Photo lives at public/stays/<area-slug>.jpg. Orlando & Charleston are NOT
// here — their affiliate links are area-wide (no single property), so they
// power the general "More rentals" button via VRBO_RENTALS instead.
export interface FeaturedStay {
  url: string
  desc: string
}
const VRBO_PROPERTY: Record<string, FeaturedStay> = {
  'Las Vegas, NV': {
    url: 'https://vrbo.com/affiliate/aQ09rzi',
    desc: '4BR lakeside home with private pool & game room — sleeps a big group, NW Las Vegas near the Angel Park golf area.',
  },
  'Palm Springs, CA': {
    url: 'https://vrbo.com/affiliate/7uuPGJp',
    desc: 'Remodeled 4BR home on the PGA West course in La Quinta — private pool and a golf cart.',
  },
  'San Diego, CA': {
    url: 'https://vrbo.com/affiliate/wr5iy6x',
    desc: '6BR/5.5BA ~7,000 sq ft resort home in El Cajon (near Steele Canyon & Singing Hills) — sleeps 16, pool, hot tub, indoor golf simulator.',
  },
  'Pinehurst, NC': {
    url: 'https://vrbo.com/affiliate/fktysh0',
    desc: 'Spacious 4BR house in Southern Pines, minutes from Pinehurst golf — fire pit + games, fits 4–8.',
  },
  'Boyne, MI': {
    url: 'https://vrbo.com/affiliate/lvnRjgB',
    desc: '4BR/3BA house in Harbor Springs — sleeps up to 8, right in the Boyne golf country.',
  },
  'Myrtle Beach, SC': {
    url: 'https://vrbo.com/affiliate/zx7VwtK',
    desc: '4BR oceanfront rental in North Myrtle Beach — sleeps 10, indoor pool & hot tub, close to the North Myrtle courses.',
  },
  'Hilton Head Island, SC': {
    url: 'https://vrbo.com/affiliate/0dgr51t',
    desc: '4BR/4.5BA Palmetto Dunes home with private pool — sleeps 8, within a mile of the Robert Trent Jones & Fazio courses.',
  },
  'Scottsdale, AZ': {
    url: 'https://vrbo.com/affiliate/R8yQFqk',
    desc: 'Upscale North Scottsdale home — 5BR (sleeps 8+), heated pool, hot tub, and a putting green. Built for a golf group.',
  },
  'Naples, FL': {
    url: 'https://vrbo.com/affiliate/lA8GnAI',
    desc: 'Central Naples 4BR/3BA pool home — sleeps 8, private pool + hot tub, about a mile from Naples Grande.',
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
  'San Diego, CA': [
    { name: 'Coronado Municipal', golfNow: 'https://www.golfnow.com/tee-times/facility/10985-coronado-municipal-golf-course-ca/search', website: 'https://www.golfcoronado.com/' },
    { name: 'Riverwalk Golf Club', golfNow: 'https://www.golfnow.com/tee-times/facility/171-riverwalk-golf-club/search', website: 'https://riverwalkgc.com/' },
    { name: 'The Crossings at Carlsbad', golfNow: 'https://www.golfnow.com/tee-times/facility/4184-crossings-at-carlsbad/search', website: 'https://www.thecrossingsatcarlsbad.com/' },
  ],
  'Pinehurst, NC': [
    { name: 'Southern Pines Golf Club', golfNow: 'https://www.golfnow.com/tee-times/facility/3847-southern-pines-golf-club/search', website: 'https://southernpinesgolfclub.com/golf/' },
    { name: 'Hyland Golf Club', golfNow: 'https://www.golfnow.com/tee-times/facility/4504-hyland-golf-club/search' },
    { name: 'Pine Needles Lodge & Golf Club', website: 'https://www.pineneedles-midpines.com/' },
  ],
  'Charleston, SC': [
    { name: 'Charleston National (Mount Pleasant)', golfNow: 'https://www.golfnow.com/tee-times/facility/7077-charleston-national/search', website: 'https://www.charlestonnationalgolf.com/' },
    { name: 'Dunes West (Mount Pleasant)', website: 'https://www.duneswestgolfclub.com/' },
    { name: 'Shadowmoss Plantation (West Ashley)', golfNow: 'https://www.golfnow.com/tee-times/facility/8383-shadowmoss-plantation/search', website: 'https://www.shadowmossgolf.com/' },
  ],
  'Boyne, MI': [
    { name: 'Little Traverse Bay (Harbor Springs)', golfNow: 'https://www.golfnow.com/tee-times/facility/6299-little-traverse-bay/search', website: 'https://www.golfmichigan.net/ltbaygolf/' },
    { name: 'Hidden River (Brutus)', golfNow: 'https://www.golfnow.com/tee-times/facility/3306-hidden-river-golf-casting/search', website: 'https://hiddenriver.com/' },
    { name: 'Belvedere Golf Club (Charlevoix)', website: 'https://belvederegolfclub.com/' },
  ],
  'Scottsdale, AZ': [
    { name: 'Grayhawk (Talon)', golfNow: 'https://www.golfnow.com/tee-times/facility/3050-grayhawk-golf-club-talon-course/search', website: 'https://grayhawkgolf.com/' },
    { name: 'Talking Stick (North)', golfNow: 'https://www.golfnow.com/tee-times/facility/12968-talking-stick-golf-club-oodham-north/search', website: 'https://www.talkingstickresort.com/amenities/golf/' },
    { name: 'The Boulders', golfNow: 'https://www.golfnow.com/tee-times/facility/7-the-boulders-golf-club/search', website: 'https://www.bouldersclub.com/' },
  ],
  'Myrtle Beach, SC': [
    { name: 'Tidewater Golf Club', golfNow: 'https://www.golfnow.com/tee-times/facility/5389-tidewater-golf-club/search', website: 'https://tidewatergolf.com/' },
    { name: 'Grande Dunes Resort', golfNow: 'https://www.golfnow.com/tee-times/facility/5394-grande-dunes-resort-course/search', website: 'https://myrtlebeachgolf.com/golf-course/grande-dunes-resort-club/' },
    { name: 'True Blue Golf Club', golfNow: 'https://www.golfnow.com/tee-times/facility/5416-true-blue-plantation/search', website: 'https://truebluemyrtlebeach.com/' },
  ],
  'Hilton Head Island, SC': [
    { name: 'Palmetto Dunes — Robert Trent Jones', golfNow: 'https://www.golfnow.com/tee-times/facility/17988-palmetto-dunes-resort-robert-trent-jones-course/search', website: 'https://www.palmettodunes.com/golf/robert-trent-jones-course' },
    { name: 'Palmetto Dunes — George Fazio', golfNow: 'https://www.golfnow.com/tee-times/facility/17987-palmetto-dunes-resort-fazio-course/search', website: 'https://www.palmettodunes.com/golf/george-fazio-course' },
    { name: "Port Royal — Robber's Row", golfNow: 'https://www.golfnow.com/tee-times/facility/13548-port-royal-robbers-row/search', website: 'https://hiltonheadgolf.net/book-tee-times' },
  ],
  'Naples, FL': [
    { name: 'Hibiscus Golf Club', golfNow: 'https://www.golfnow.com/tee-times/facility/5132-hibiscus-golf-club/search' },
    { name: 'Naples Grande Golf Club', website: 'https://www.naplesgrandegolf.com/' },
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

// Number of gallery photos per destination in public/stays/<slug>-N.jpg.
const STAY_PHOTO_COUNT: Record<string, number> = {
  'Scottsdale, AZ': 6,
  'Myrtle Beach, SC': 5,
  'Hilton Head Island, SC': 6,
  'Las Vegas, NV': 6,
  'San Diego, CA': 7,
  'Boyne, MI': 6,
  'Pinehurst, NC': 6,
  'Palm Springs, CA': 6,
  'Naples, FL': 6,
}

function staySlug(destination: string): string {
  return destination
    .split(',')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Ordered gallery photo URLs for a destination's featured stay (hero first). */
export function stayPhotos(destination: string): string[] {
  const n = STAY_PHOTO_COUNT[destination]
  if (!n) return []
  const slug = staySlug(destination)
  return Array.from(
    { length: n },
    (_, i) => `${import.meta.env.BASE_URL}stays/${slug}-${i + 1}.jpg`,
  )
}

/** Extra area courses you can also book tee times for. */
export function moreCourses(destination: string): AreaCourse[] {
  return MORE_COURSES[destination] ?? []
}

/** Generic GolfNow area search — the "look for more places here" fallback. */
export function golfNowAreaLink(destination: string): string {
  return `https://www.golfnow.com/tee-times/search?q=${enc(destination)}`
}
