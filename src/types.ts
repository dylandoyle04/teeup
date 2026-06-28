export type ID = string

export type HotelTier = 'budget' | 'midrange' | 'luxury'
export type VoteCategory = 'course' | 'teeTime' | 'hotel' | 'flight'

export interface Member {
  id: ID
  name: string
  color: string
}

export interface CourseOption {
  id: ID
  name: string
  location: string
  greenFee: number
  par: number
  rating: number
  teeTimes: string[]
}

export interface TeeTimeOption {
  id: ID
  courseId: ID
  time: string
}

export interface HotelOption {
  id: ID
  name: string
  tier: HotelTier
  pricePerNight: number
  rating: number
  /** courseId -> drive time in minutes */
  driveTimes: Record<ID, number>
}

export interface FlightOption {
  id: ID
  airline: string
  price: number
  depart: string
  arrive: string
  stops: number
}

/** category -> optionId -> list of member ids who voted */
export type VoteMap = Record<VoteCategory, Record<ID, ID[]>>

export interface Team {
  id: ID
  name: string
  memberIds: ID[]
}

export type WolfMode = 'partner' | 'lone' | 'blind'
export interface WolfPick {
  mode: WolfMode
  partnerId: ID | null
}

export interface Round {
  id: ID
  courseName: string
  date: string
  holePars: number[]
  /** memberId (or teamId for Scramble) -> 18 strokes (null = not entered) */
  scores: Record<ID, (number | null)[]>
  game: string
  /** 2v2 / scramble team assignments (team games only) */
  teams: Team[]
  /** per-hole wolf decision (Wolf only); index = hole 0..17 */
  wolf: (WolfPick | null)[]
}

export interface Bet {
  id: ID
  description: string
  /** member who owes */
  fromId: ID
  /** member who is owed */
  toId: ID
  amount: number
  settled: boolean
  createdAt: number
}

export interface Trip {
  id: ID
  name: string
  destination: string
  startDate: string
  endDate: string
  budgetMin: number
  budgetMax: number
  /** organizer-set preferences that guide what the group votes on */
  hotelTier: HotelTier
  needsFlights: boolean
  notes: string
  organizerId: ID
  memberIds: ID[]
  courses: CourseOption[]
  hotels: HotelOption[]
  flights: FlightOption[]
  votes: VoteMap
  rounds: Round[]
  bets: Bet[]
  createdAt: number
}
