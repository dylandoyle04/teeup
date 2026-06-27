import type { HotelTier } from './types'

export interface PackageCourse {
  name: string
  blurb: string
  website: string
  golfNow?: string
  image: string
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

// Base-aware so images resolve under /teeup/ on GitHub Pages and / in dev.
const IMG = (slug: string) => `${import.meta.env.BASE_URL}packages/${slug}.jpg`

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
    image: IMG('wekopa'),
    budgetMin: 2200,
    budgetMax: 3500,
    hotelTier: 'luxury',
    needsFlights: true,
    greenFee: 225,
    courses: [
      {
        name: 'We-Ko-Pa (Saguaro & Cholla)',
        blurb:
          "One of Arizona's premier golf destinations, where championship golf meets the untouched beauty of the Sonoran Desert. With no homes lining the fairways, every hole offers breathtaking mountain views, pristine conditions, and a true desert golf experience.",
        website: 'https://wekopa.com/',
        image: IMG('wekopa'),
      },
      {
        name: 'Troon North Golf Club',
        blurb:
          'An absolutely breathtaking golf destination, where dramatic desert landscapes, towering granite boulders, and perfectly manicured fairways create an unforgettable round that challenges players of all skill levels.',
        website: 'https://www.troonnorthgolf.com/book_tt/',
        golfNow:
          'https://www.golfnow.com/tee-times/facility/813-troon-north-golf-club/search',
        image: IMG('troon-north'),
      },
      {
        name: 'TPC Scottsdale — Stadium Course',
        blurb:
          "Step onto one of golf's most iconic stages, home of the PGA Tour's WM Phoenix Open. Play the same championship layout as the world's best, highlighted by the legendary par-3 16th hole and a thrilling risk-reward finish.",
        website: 'https://tpc.com/scottsdale/stadium-course/',
        golfNow:
          'https://www.golfnow.com/tee-times/facility/3482-the-stadium-course-at-tpc-scottsdale/search',
        image: IMG('tpc-stadium'),
      },
    ],
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
    image: IMG('mcdowell'),
    budgetMin: 1100,
    budgetMax: 1800,
    hotelTier: 'midrange',
    needsFlights: true,
    greenFee: 110,
    courses: [
      {
        name: 'TPC Scottsdale — Champions Course',
        blurb:
          'A championship-caliber round that blends strategic design with the natural beauty of the Sonoran Desert. More forgiving than its famous Stadium counterpart, it delivers rolling fairways, pristine greens, and stunning McDowell Mountain views.',
        website: 'https://tpc.com/scottsdale/champions-course/',
        golfNow:
          'https://www.golfnow.com/tee-times/facility/7076-tpc-scottsdale-champions-course/search',
        image: IMG('tpc-champions'),
      },
      {
        name: 'Kierland Golf Club',
        blurb:
          'A modern desert golf experience with beautifully manicured fairways, scenic mountain views, and a fun, player-friendly design. Three unique nine-hole layouts and a relaxed resort atmosphere make it a favorite for all skill levels.',
        website: 'https://www.kierlandgolf.com/',
        golfNow:
          'https://www.golfnow.com/tee-times/facility/80-kierland-golf-club/search',
        image: IMG('kierland'),
      },
      {
        name: 'McDowell Mountain Golf Club',
        blurb:
          "Nestled in the foothills of the McDowell Mountains, one of Scottsdale's best values without sacrificing quality. Known for dramatic elevation changes, panoramic desert views, and well-conditioned fairways that reward smart shot-making.",
        website:
          'https://arcisgolf.com/clubs/mcdowell-mountain-golf-club/golf-course',
        golfNow:
          'https://www.golfnow.com/tee-times/facility/4872-mcdowell-mountain-golf-club/search',
        image: IMG('mcdowell'),
      },
    ],
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
    image: IMG('caledonia'),
    budgetMin: 1400,
    budgetMax: 2200,
    hotelTier: 'luxury',
    needsFlights: true,
    greenFee: 175,
    courses: [
      {
        name: 'TPC Myrtle Beach',
        blurb:
          "Play where champions have competed on one of South Carolina's premier championship layouts. Designed by Tom Fazio, it features immaculate conditions, strategic bunkering, and holes that reward precision and smart course management.",
        website: 'https://www.tpcmyrtlebeach.com/',
        golfNow:
          'https://www.golfnow.com/tee-times/facility/5426-tpc-myrtle-beach/search',
        image: IMG('tpc-myrtle'),
      },
      {
        name: 'Caledonia Golf & Fish Club',
        blurb:
          "Consistently ranked among America's finest public courses, Caledonia blends stunning Lowcountry scenery with timeless architecture. Moss-draped oaks, blooming flowers, and unforgettable finishing holes create a beautiful, challenging round.",
        website: 'https://caledoniagolfandfishclub.com/',
        golfNow:
          'https://www.golfnow.com/tee-times/facility/5415-caledonia-golf-fish-club/search',
        image: IMG('caledonia'),
      },
      {
        name: 'Barefoot Resort — Dye Course',
        blurb:
          'Designed by the legendary Pete Dye, this award-winning layout combines dramatic visuals with strategic shot-making. Waste areas, railroad ties, and sculpted bunkers define one of the most unique golf experiences in Myrtle Beach.',
        website: 'https://barefootgolf.com/',
        golfNow:
          'https://www.golfnow.com/tee-times/facility/5348-barefoot-resort-dye/search',
        image: IMG('barefoot-dye'),
      },
      {
        name: "Myrtle Beach National — King's North",
        blurb:
          'An Arnold Palmer masterpiece renowned for its exciting risk-reward design and iconic holes, including the famous "Gambler" par five. Exceptional conditioning and creative architecture make it one of Myrtle Beach\'s most popular courses.',
        website: 'https://www.myrtlebeachnational.com/about-myrtle-beach-national/',
        golfNow:
          'https://www.golfnow.com/tee-times/facility/5398-myrtle-beach-national-kings-north/search',
        image: IMG('kings-north'),
      },
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
    image: IMG('world-tour'),
    budgetMin: 700,
    budgetMax: 1200,
    hotelTier: 'midrange',
    needsFlights: true,
    greenFee: 80,
    courses: [
      {
        name: 'World Tour Golf Links',
        blurb:
          "Travel the world without leaving Myrtle Beach. Featuring replicas of some of golf's most famous holes from legendary courses across the globe, World Tour offers a unique and entertaining round of iconic designs in one day.",
        website: 'https://www.theworldtourgolf.com/',
        golfNow:
          'https://www.golfnow.com/tee-times/facility/5413-world-tour-golf-links/search',
        image: IMG('world-tour'),
      },
      {
        name: "Man O' War Golf Club",
        blurb:
          "Surrounded by water on nearly every hole, Man O' War delivers a fun, scenic round filled with risk-and-reward opportunities. Generous fairways and beautiful lake views make this a favorite for golfers of all abilities.",
        website: 'https://www.mysticalgolf.com/',
        golfNow:
          'https://www.golfnow.com/tee-times/facility/5400-man-o-war-golf-course/search',
        image: IMG('man-o-war'),
      },
      {
        name: 'Arrowhead Country Club',
        blurb:
          'Known for outstanding value and consistently excellent conditions, Arrowhead offers three unique nine-hole layouts with variety, playability, and an enjoyable challenge — quality golf without the premium price.',
        website: 'https://arrowheadcc.com/',
        golfNow:
          'https://www.golfnow.com/tee-times/facility/5391-arrowhead-country-club/search',
        image: IMG('arrowhead'),
      },
      {
        name: 'Indigo Creek Golf Club',
        blurb:
          'A welcoming layout with rolling fairways, mature trees, and well-placed water hazards. Friendly for all skill levels and known for excellent value — the perfect way to round out a memorable Myrtle Beach trip.',
        website: 'https://www.indigocreekgolfclub.com/',
        golfNow:
          'https://www.golfnow.com/tee-times/facility/5420-indigo-creek-golf-club/search',
        image: IMG('indigo-creek'),
      },
    ],
  },
]

export function getPackage(id: string): TripPackage | undefined {
  return PACKAGES.find((p) => p.id === id)
}
