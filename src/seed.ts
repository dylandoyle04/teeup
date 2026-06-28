import type {
  CourseOption,
  FlightOption,
  HotelOption,
  Member,
  Round,
  Trip,
} from './types'

export const MEMBER_COLORS = [
  '#1b6b46',
  '#d4af37',
  '#2f6fb0',
  '#c0533b',
  '#7b54b3',
  '#137a7f',
  '#b3506e',
  '#5a7d2a',
]

let counter = 0
/** Deterministic-ish id generator (avoids Date.now/Math.random restrictions). */
export function uid(prefix = 'id'): string {
  counter += 1
  return `${prefix}_${counter}_${(performance.now() | 0).toString(36)}`
}

const STANDARD_PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4]

function emptyScores(memberIds: string[]): Round['scores'] {
  const scores: Round['scores'] = {}
  for (const id of memberIds) scores[id] = Array(18).fill(null)
  return scores
}

export function makeSampleTrip(): Trip {
  const members: Member[] = [
    { id: 'm1', name: 'You', color: MEMBER_COLORS[0] },
    { id: 'm2', name: 'Marcus', color: MEMBER_COLORS[1] },
    { id: 'm3', name: 'Tyler', color: MEMBER_COLORS[2] },
    { id: 'm4', name: 'Devon', color: MEMBER_COLORS[3] },
  ]

  const courses: CourseOption[] = [
    {
      id: 'c1',
      name: 'Caledonia Golf & Fish Club',
      location: 'Pawleys Island, SC',
      greenFee: 185,
      par: 70,
      rating: 4.8,
      teeTimes: ['7:40 AM', '8:20 AM', '9:10 AM', '1:30 PM'],
    },
    {
      id: 'c2',
      name: 'TPC Myrtle Beach',
      location: 'Murrells Inlet, SC',
      greenFee: 159,
      par: 72,
      rating: 4.6,
      teeTimes: ['7:50 AM', '8:40 AM', '10:00 AM', '2:00 PM'],
    },
    {
      id: 'c3',
      name: 'Tidewater Golf Club',
      location: 'North Myrtle Beach, SC',
      greenFee: 139,
      par: 72,
      rating: 4.5,
      teeTimes: ['8:00 AM', '9:00 AM', '11:20 AM', '1:00 PM'],
    },
    {
      id: 'c4',
      name: 'Barefoot Resort — Dye Course',
      location: 'North Myrtle Beach, SC',
      greenFee: 129,
      par: 72,
      rating: 4.4,
      teeTimes: ['7:30 AM', '8:30 AM', '10:40 AM', '12:40 PM'],
    },
  ]

  const hotels: HotelOption[] = [
    {
      id: 'h1',
      name: 'Hampton Inn Broadway',
      tier: 'budget',
      pricePerNight: 119,
      rating: 4.2,
      driveTimes: { c1: 28, c2: 22, c3: 19, c4: 17 },
    },
    {
      id: 'h2',
      name: 'Marina Inn at Grande Dunes',
      tier: 'midrange',
      pricePerNight: 189,
      rating: 4.6,
      driveTimes: { c1: 24, c2: 18, c3: 15, c4: 14 },
    },
    {
      id: 'h3',
      name: 'Marriott Resort & Spa at Grande Dunes',
      tier: 'luxury',
      pricePerNight: 289,
      rating: 4.8,
      driveTimes: { c1: 26, c2: 20, c3: 12, c4: 11 },
    },
  ]

  const flights: FlightOption[] = [
    {
      id: 'f1',
      airline: 'Spirit',
      price: 138,
      depart: 'CLE 6:05 AM',
      arrive: 'MYR 8:10 AM',
      stops: 0,
    },
    {
      id: 'f2',
      airline: 'Delta',
      price: 246,
      depart: 'CLE 9:15 AM',
      arrive: 'MYR 1:40 PM',
      stops: 1,
    },
    {
      id: 'f3',
      airline: 'American',
      price: 212,
      depart: 'CLE 11:30 AM',
      arrive: 'MYR 3:55 PM',
      stops: 1,
    },
  ]

  const memberIds = members.map((m) => m.id)

  const rounds: Round[] = [
    {
      id: 'r1',
      courseName: 'Caledonia Golf & Fish Club',
      date: '2026-09-19',
      holePars: STANDARD_PARS,
      scores: emptyScores(memberIds),
      game: 'Skins',
      teams: [],
      wolf: Array(18).fill(null),
    },
  ]

  return {
    id: 'trip_sample',
    name: 'Myrtle Beach Buddies Trip',
    destination: 'Myrtle Beach, SC',
    startDate: '2026-09-18',
    endDate: '2026-09-21',
    budgetMin: 600,
    budgetMax: 1100,
    hotelTier: 'midrange',
    needsFlights: true,
    notes: 'Driving down Friday morning. Two rounds, maybe a third if weather holds.',
    organizerId: 'm1',
    memberIds,
    courses,
    hotels,
    flights,
    votes: { course: {}, teeTime: {}, hotel: {}, flight: {} },
    rounds,
    bets: [],
    createdAt: 0,
  }
}

export function makeSampleMembers(): Member[] {
  return [
    { id: 'm1', name: 'You', color: MEMBER_COLORS[0] },
    { id: 'm2', name: 'Marcus', color: MEMBER_COLORS[1] },
    { id: 'm3', name: 'Tyler', color: MEMBER_COLORS[2] },
    { id: 'm4', name: 'Devon', color: MEMBER_COLORS[3] },
  ]
}

export const STANDARD_HOLE_PARS = STANDARD_PARS
