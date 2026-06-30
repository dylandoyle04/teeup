import type { HotelTier } from './types'

export interface PackageCourse {
  name: string
  slug: string
  blurb: string
  images: string[]
  /** GolfNow tee-times affiliate link (where available) */
  golfNow?: string
}

// GolfNow tee-time links per course (from the partner's package doc)
const GOLFNOW: Record<string, string> = {
  'troon-north':
    'https://www.golfnow.com/tee-times/facility/813-troon-north-golf-club/search',
  'tpc-stadium':
    'https://www.golfnow.com/tee-times/facility/3482-the-stadium-course-at-tpc-scottsdale/search',
  'tpc-champions':
    'https://www.golfnow.com/tee-times/facility/7076-tpc-scottsdale-champions-course/search',
  kierland:
    'https://www.golfnow.com/tee-times/facility/80-kierland-golf-club/search',
  mcdowell:
    'https://www.golfnow.com/tee-times/facility/4872-mcdowell-mountain-golf-club/search',
  'tpc-myrtle':
    'https://www.golfnow.com/tee-times/facility/5426-tpc-myrtle-beach/search',
  caledonia:
    'https://www.golfnow.com/tee-times/facility/5415-caledonia-golf-fish-club/search',
  'barefoot-dye':
    'https://www.golfnow.com/tee-times/facility/5348-barefoot-resort-dye/search',
  'kings-north':
    'https://www.golfnow.com/tee-times/facility/5398-myrtle-beach-national-kings-north/search',
  'world-tour':
    'https://www.golfnow.com/tee-times/facility/5413-world-tour-golf-links/search',
  'man-o-war':
    'https://www.golfnow.com/tee-times/facility/5400-man-o-war-golf-course/search',
  arrowhead:
    'https://www.golfnow.com/tee-times/facility/5391-arrowhead-country-club/search',
  'indigo-creek':
    'https://www.golfnow.com/tee-times/facility/5420-indigo-creek-golf-club/search',
}

export interface TripPackage {
  id: string
  destination: string
  region: string
  tier: 'luxury' | 'value'
  tierLabel: string
  title: string
  blurb: string
  image: string
  budgetMin: number
  budgetMax: number
  hotelTier: HotelTier
  needsFlights: boolean
  greenFee: number
  courses: PackageCourse[]
}

// Number of gallery photos downloaded per course (public/packages/<slug>-N.jpg)
const PHOTO_COUNTS: Record<string, number> = {
  wekopa: 8,
  'troon-north': 9,
  'tpc-stadium': 13,
  'tpc-champions': 13,
  kierland: 11,
  mcdowell: 14,
  'tpc-myrtle': 14,
  caledonia: 7,
  'barefoot-dye': 2,
  'kings-north': 12,
  'world-tour': 14,
  'man-o-war': 13,
  arrowhead: 14,
  'indigo-creek': 6,
}

const BASE = import.meta.env.BASE_URL
const imgs = (slug: string): string[] =>
  Array.from(
    { length: PHOTO_COUNTS[slug] ?? 0 },
    (_, i) => `${BASE}packages/${slug}-${i + 1}.jpg`,
  )

function course(name: string, slug: string, blurb: string): PackageCourse {
  return { name, slug, blurb, images: imgs(slug), golfNow: GOLFNOW[slug] }
}

const COURSES: Record<string, PackageCourse> = {
  wekopa: course(
    'We-Ko-Pa (Saguaro & Cholla)',
    'wekopa',
    "One of Arizona's premier golf destinations, where championship golf meets the untouched beauty of the Sonoran Desert. With no homes lining the fairways, every hole offers breathtaking mountain views, pristine conditions, and a true desert golf experience.",
  ),
  troon: course(
    'Troon North Golf Club',
    'troon-north',
    'An absolutely breathtaking golf destination, where dramatic desert landscapes, towering granite boulders, and perfectly manicured fairways create an unforgettable round that challenges players of all skill levels.',
  ),
  tpcStadium: course(
    'TPC Scottsdale — Stadium Course',
    'tpc-stadium',
    "Step onto one of golf's most iconic stages, home of the PGA Tour's WM Phoenix Open. Play the same championship layout as the world's best, highlighted by the legendary par-3 16th hole and a thrilling risk-reward finish.",
  ),
  tpcChampions: course(
    'TPC Scottsdale — Champions Course',
    'tpc-champions',
    'A championship-caliber round that blends strategic design with the natural beauty of the Sonoran Desert. More forgiving than its famous Stadium counterpart, it delivers rolling fairways, pristine greens, and stunning McDowell Mountain views.',
  ),
  kierland: course(
    'Kierland Golf Club',
    'kierland',
    'A modern desert golf experience with beautifully manicured fairways, scenic mountain views, and a fun, player-friendly design. Three unique nine-hole layouts and a relaxed resort atmosphere make it a favorite for all skill levels.',
  ),
  mcdowell: course(
    'McDowell Mountain Golf Club',
    'mcdowell',
    "Nestled in the foothills of the McDowell Mountains, one of Scottsdale's best values without sacrificing quality. Known for dramatic elevation changes, panoramic desert views, and well-conditioned fairways that reward smart shot-making.",
  ),
  tpcMyrtle: course(
    'TPC Myrtle Beach',
    'tpc-myrtle',
    "Play where champions have competed on one of South Carolina's premier championship layouts. Designed by Tom Fazio, it features immaculate conditions, strategic bunkering, and holes that reward precision and smart course management.",
  ),
  caledonia: course(
    'Caledonia Golf & Fish Club',
    'caledonia',
    "Consistently ranked among America's finest public courses, Caledonia blends stunning Lowcountry scenery with timeless architecture. Moss-draped oaks, blooming flowers, and unforgettable finishing holes create a beautiful, challenging round.",
  ),
  barefootDye: course(
    'Barefoot Resort — Dye Course',
    'barefoot-dye',
    'Designed by the legendary Pete Dye, this award-winning layout combines dramatic visuals with strategic shot-making. Waste areas, railroad ties, and sculpted bunkers define one of the most unique golf experiences in Myrtle Beach.',
  ),
  kingsNorth: course(
    "Myrtle Beach National — King's North",
    'kings-north',
    'An Arnold Palmer masterpiece renowned for its exciting risk-reward design and iconic holes, including the famous "Gambler" par five. Exceptional conditioning and creative architecture make it one of Myrtle Beach\'s most popular courses.',
  ),
  worldTour: course(
    'World Tour Golf Links',
    'world-tour',
    "Travel the world without leaving Myrtle Beach. Featuring replicas of some of golf's most famous holes from legendary courses across the globe, World Tour offers a unique and entertaining round of iconic designs in one day.",
  ),
  manOWar: course(
    "Man O' War Golf Club",
    'man-o-war',
    "Surrounded by water on nearly every hole, Man O' War delivers a fun, scenic round filled with risk-and-reward opportunities. Generous fairways and beautiful lake views make this a favorite for golfers of all abilities.",
  ),
  arrowhead: course(
    'Arrowhead Country Club',
    'arrowhead',
    'Known for outstanding value and consistently excellent conditions, Arrowhead offers three unique nine-hole layouts with variety, playability, and an enjoyable challenge — quality golf without the premium price.',
  ),
  indigoCreek: course(
    'Indigo Creek Golf Club',
    'indigo-creek',
    'A welcoming layout with rolling fairways, mature trees, and well-placed water hazards. Friendly for all skill levels and known for excellent value — the perfect way to round out a memorable Myrtle Beach trip.',
  ),
}

export const PACKAGES: TripPackage[] = [
  {
    id: 'scottsdale-luxury',
    destination: 'Scottsdale, AZ',
    region: 'Arizona',
    tier: 'luxury',
    tierLabel: 'Luxury',
    title: 'Scottsdale Bucket-List Golf',
    blurb:
      "Designed for golfers seeking the ultimate Scottsdale experience, this bucket-list package features championship courses, breathtaking desert scenery, and world-class accommodations. Play some of Arizona's most iconic layouts while enjoying a luxury golf getaway you'll never forget.",
    image: COURSES.wekopa.images[0],
    budgetMin: 2200,
    budgetMax: 3500,
    hotelTier: 'luxury',
    needsFlights: true,
    greenFee: 225,
    courses: [COURSES.wekopa, COURSES.troon, COURSES.tpcStadium],
  },
  {
    id: 'scottsdale-value',
    destination: 'Scottsdale, AZ',
    region: 'Arizona',
    tier: 'value',
    tierLabel: 'Value',
    title: 'Scottsdale Value Golf',
    blurb:
      'Offering the perfect balance of quality and value, this package combines outstanding Scottsdale golf with comfortable accommodations at a more affordable price. Enjoy challenging desert layouts, stunning scenery, and an unforgettable getaway without stretching your budget.',
    image: COURSES.mcdowell.images[0],
    budgetMin: 1100,
    budgetMax: 1800,
    hotelTier: 'midrange',
    needsFlights: true,
    greenFee: 110,
    courses: [COURSES.tpcChampions, COURSES.kierland, COURSES.mcdowell],
  },
  {
    id: 'myrtle-luxury',
    destination: 'Myrtle Beach, SC',
    region: 'South Carolina',
    tier: 'luxury',
    tierLabel: 'Luxury',
    title: 'Myrtle Beach Championship Experience',
    blurb:
      'Experience the very best of the "Golf Capital of the World" with a bucket-list getaway featuring some of Myrtle Beach\'s most celebrated courses. From championship layouts to breathtaking Lowcountry scenery, this premium package delivers an unforgettable week of world-class golf.',
    image: COURSES.caledonia.images[0],
    budgetMin: 1400,
    budgetMax: 2200,
    hotelTier: 'luxury',
    needsFlights: true,
    greenFee: 175,
    courses: [
      COURSES.tpcMyrtle,
      COURSES.caledonia,
      COURSES.barefootDye,
      COURSES.kingsNorth,
    ],
  },
  {
    id: 'myrtle-value',
    destination: 'Myrtle Beach, SC',
    region: 'South Carolina',
    tier: 'value',
    tierLabel: 'Value',
    title: 'Myrtle Beach Value Getaway',
    blurb:
      "Discover why Myrtle Beach is one of America's favorite golf destinations with a vacation that won't break the bank. This package combines fun, well-maintained courses with comfortable accommodations — the perfect balance of quality, value, and unforgettable rounds.",
    image: COURSES.worldTour.images[0],
    budgetMin: 700,
    budgetMax: 1200,
    hotelTier: 'midrange',
    needsFlights: true,
    greenFee: 80,
    courses: [
      COURSES.worldTour,
      COURSES.manOWar,
      COURSES.arrowhead,
      COURSES.indigoCreek,
    ],
  },
]

export function getPackage(id: string): TripPackage | undefined {
  return PACKAGES.find((p) => p.id === id)
}
