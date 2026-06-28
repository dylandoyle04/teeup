import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Bet,
  CourseOption,
  FlightOption,
  HotelOption,
  HotelTier,
  ID,
  Member,
  Round,
  Team,
  Trip,
  VoteCategory,
  WolfPick,
} from './types'
import {
  MEMBER_COLORS,
  STANDARD_HOLE_PARS,
  makeSampleMembers,
  makeSampleTrip,
  uid,
} from './seed'
import type { TripPackage } from './packages'
import { parsForCourseName } from './coursePars'

const DEFAULT_TEE_TIMES = ['7:40 AM', '8:30 AM', '9:20 AM', '1:10 PM']

interface State {
  members: Member[]
  trips: Trip[]
  currentMemberId: ID

  // selectors helpers
  getTrip: (tripId: ID) => Trip | undefined
  tripMembers: (tripId: ID) => Member[]

  // global
  setCurrentMember: (memberId: ID) => void
  resetAll: () => void

  // trips
  createTrip: (input: {
    name: string
    destination: string
    startDate: string
    endDate: string
    budgetMin: number
    budgetMax: number
    hotelTier: HotelTier
    needsFlights: boolean
  }) => ID
  createTripFromPackage: (pkg: TripPackage) => ID
  updateTrip: (tripId: ID, patch: Partial<Trip>) => void
  deleteTrip: (tripId: ID) => void

  // members
  addMember: (tripId: ID, name: string) => void
  removeMember: (tripId: ID, memberId: ID) => void

  // booking options
  addCourse: (
    tripId: ID,
    input: { name: string; location: string; greenFee: number; par: number },
  ) => void
  addHotel: (
    tripId: ID,
    input: { name: string; tier: HotelTier; pricePerNight: number },
  ) => void
  addFlight: (
    tripId: ID,
    input: { airline: string; price: number; stops: number },
  ) => void
  removeOption: (tripId: ID, category: 'course' | 'hotel' | 'flight', optionId: ID) => void

  // voting
  toggleVote: (
    tripId: ID,
    category: VoteCategory,
    optionId: ID,
    memberId: ID,
  ) => void

  // scoring
  addRound: (tripId: ID, courseName: string, date: string, game: string) => void
  setRoundGame: (tripId: ID, roundId: ID, game: string) => void
  setRoundTeams: (tripId: ID, roundId: ID, teams: Team[]) => void
  setWolfPick: (
    tripId: ID,
    roundId: ID,
    hole: number,
    pick: WolfPick | null,
  ) => void
  setScore: (
    tripId: ID,
    roundId: ID,
    memberId: ID,
    hole: number,
    strokes: number | null,
  ) => void
  deleteRound: (tripId: ID, roundId: ID) => void

  // bets
  addBet: (
    tripId: ID,
    bet: { description: string; fromId: ID; toId: ID; amount: number },
  ) => void
  toggleBetSettled: (tripId: ID, betId: ID) => void
  deleteBet: (tripId: ID, betId: ID) => void
}

function patchTrip(trips: Trip[], tripId: ID, fn: (t: Trip) => Trip): Trip[] {
  return trips.map((t) => (t.id === tripId ? fn(t) : t))
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      members: makeSampleMembers(),
      trips: [makeSampleTrip()],
      currentMemberId: 'm1',

      getTrip: (tripId) => get().trips.find((t) => t.id === tripId),
      tripMembers: (tripId) => {
        const trip = get().trips.find((t) => t.id === tripId)
        if (!trip) return []
        const map = new Map(get().members.map((m) => [m.id, m]))
        return trip.memberIds
          .map((id) => map.get(id))
          .filter((m): m is Member => Boolean(m))
      },

      setCurrentMember: (memberId) => set({ currentMemberId: memberId }),

      resetAll: () =>
        set({
          members: makeSampleMembers(),
          trips: [makeSampleTrip()],
          currentMemberId: 'm1',
        }),

      createTrip: (input) => {
        const id = uid('trip')
        const organizerId = get().currentMemberId
        const trip: Trip = {
          id,
          name: input.name,
          destination: input.destination,
          startDate: input.startDate,
          endDate: input.endDate,
          budgetMin: input.budgetMin,
          budgetMax: input.budgetMax,
          hotelTier: input.hotelTier,
          needsFlights: input.needsFlights,
          notes: '',
          organizerId,
          memberIds: [organizerId],
          courses: [],
          hotels: [],
          flights: [],
          votes: { course: {}, teeTime: {}, hotel: {}, flight: {} },
          rounds: [],
          bets: [],
          createdAt: performance.now(),
        }
        set({ trips: [...get().trips, trip] })
        return id
      },

      createTripFromPackage: (pkg) => {
        const id = uid('trip')
        const organizerId = get().currentMemberId
        const courses: CourseOption[] = pkg.courses.map((c) => ({
          id: uid('c'),
          name: c.name,
          location: pkg.destination,
          greenFee: pkg.greenFee,
          par: 72,
          rating: 4.6,
          teeTimes: [...DEFAULT_TEE_TIMES],
        }))
        const trip: Trip = {
          id,
          name: `${pkg.destination.split(',')[0]} Golf Trip`,
          destination: pkg.destination,
          startDate: '',
          endDate: '',
          budgetMin: pkg.budgetMin,
          budgetMax: pkg.budgetMax,
          hotelTier: pkg.hotelTier,
          needsFlights: pkg.needsFlights,
          notes: `Started from the "${pkg.title}" package.`,
          organizerId,
          memberIds: [organizerId],
          courses,
          hotels: [],
          flights: [],
          votes: { course: {}, teeTime: {}, hotel: {}, flight: {} },
          rounds: [],
          bets: [],
          createdAt: performance.now(),
        }
        set({ trips: [...get().trips, trip] })
        return id
      },

      updateTrip: (tripId, patch) =>
        set({ trips: patchTrip(get().trips, tripId, (t) => ({ ...t, ...patch })) }),

      deleteTrip: (tripId) =>
        set({ trips: get().trips.filter((t) => t.id !== tripId) }),

      addMember: (tripId, name) => {
        const trimmed = name.trim()
        if (!trimmed) return
        const id = uid('m')
        const color = MEMBER_COLORS[get().members.length % MEMBER_COLORS.length]
        const member: Member = { id, name: trimmed, color }
        set({
          members: [...get().members, member],
          trips: patchTrip(get().trips, tripId, (t) => ({
            ...t,
            memberIds: [...t.memberIds, id],
            rounds: t.rounds.map((r) => ({
              ...r,
              scores: { ...r.scores, [id]: Array(18).fill(null) },
            })),
          })),
        })
      },

      removeMember: (tripId, memberId) =>
        set({
          trips: patchTrip(get().trips, tripId, (t) => ({
            ...t,
            memberIds: t.memberIds.filter((id) => id !== memberId),
          })),
        }),

      addCourse: (tripId, input) => {
        const course: CourseOption = {
          id: uid('c'),
          name: input.name.trim() || 'New Course',
          location: input.location.trim(),
          greenFee: input.greenFee,
          par: input.par || 72,
          rating: 4.3,
          teeTimes: ['7:40 AM', '8:30 AM', '9:20 AM', '1:10 PM'],
        }
        set({
          trips: patchTrip(get().trips, tripId, (t) => ({
            ...t,
            courses: [...t.courses, course],
          })),
        })
      },

      addHotel: (tripId, input) => {
        const trip = get().getTrip(tripId)
        const driveTimes: Record<ID, number> = {}
        // seed plausible drive times for existing courses
        trip?.courses.forEach((c, i) => {
          driveTimes[c.id] = 12 + ((i * 7) % 22)
        })
        const hotel: HotelOption = {
          id: uid('h'),
          name: input.name.trim() || 'New Hotel',
          tier: input.tier,
          pricePerNight: input.pricePerNight,
          rating: 4.3,
          driveTimes,
        }
        set({
          trips: patchTrip(get().trips, tripId, (t) => ({
            ...t,
            hotels: [...t.hotels, hotel],
          })),
        })
      },

      addFlight: (tripId, input) => {
        const flight: FlightOption = {
          id: uid('f'),
          airline: input.airline.trim() || 'Airline',
          price: input.price,
          depart: 'Home',
          arrive: 'Destination',
          stops: input.stops,
        }
        set({
          trips: patchTrip(get().trips, tripId, (t) => ({
            ...t,
            flights: [...t.flights, flight],
          })),
        })
      },

      removeOption: (tripId, category, optionId) =>
        set({
          trips: patchTrip(get().trips, tripId, (t) => {
            if (category === 'course') {
              return { ...t, courses: t.courses.filter((c) => c.id !== optionId) }
            }
            if (category === 'hotel') {
              return { ...t, hotels: t.hotels.filter((h) => h.id !== optionId) }
            }
            return { ...t, flights: t.flights.filter((f) => f.id !== optionId) }
          }),
        }),

      toggleVote: (tripId, category, optionId, memberId) =>
        set({
          trips: patchTrip(get().trips, tripId, (t) => {
            const cat = { ...t.votes[category] }
            const voters = cat[optionId] ?? []
            cat[optionId] = voters.includes(memberId)
              ? voters.filter((id) => id !== memberId)
              : [...voters, memberId]
            return { ...t, votes: { ...t.votes, [category]: cat } }
          }),
        }),

      addRound: (tripId, courseName, date, game) => {
        const trip = get().getTrip(tripId)
        if (!trip) return
        const scores: Round['scores'] = {}
        for (const id of trip.memberIds) scores[id] = Array(18).fill(null)
        const name = courseName.trim() || 'New Round'
        const round: Round = {
          id: uid('r'),
          courseName: name,
          date,
          holePars: parsForCourseName(name) ?? [...STANDARD_HOLE_PARS],
          scores,
          game: game.trim(),
          teams: [],
          wolf: Array(18).fill(null),
        }
        set({
          trips: patchTrip(get().trips, tripId, (t) => ({
            ...t,
            rounds: [...t.rounds, round],
          })),
        })
      },

      setRoundGame: (tripId, roundId, game) =>
        set({
          trips: patchTrip(get().trips, tripId, (t) => ({
            ...t,
            rounds: t.rounds.map((r) =>
              r.id === roundId
                ? {
                    ...r,
                    game,
                    wolf:
                      r.wolf && r.wolf.length === 18
                        ? r.wolf
                        : Array(18).fill(null),
                  }
                : r,
            ),
          })),
        }),

      setRoundTeams: (tripId, roundId, teams) =>
        set({
          trips: patchTrip(get().trips, tripId, (t) => ({
            ...t,
            rounds: t.rounds.map((r) =>
              r.id === roundId ? { ...r, teams } : r,
            ),
          })),
        }),

      setWolfPick: (tripId, roundId, hole, pick) =>
        set({
          trips: patchTrip(get().trips, tripId, (t) => ({
            ...t,
            rounds: t.rounds.map((r) => {
              if (r.id !== roundId) return r
              const wolf = [...(r.wolf ?? Array(18).fill(null))]
              wolf[hole] = pick
              return { ...r, wolf }
            }),
          })),
        }),

      setScore: (tripId, roundId, memberId, hole, strokes) =>
        set({
          trips: patchTrip(get().trips, tripId, (t) => ({
            ...t,
            rounds: t.rounds.map((r) => {
              if (r.id !== roundId) return r
              const current = r.scores[memberId] ?? Array(18).fill(null)
              const next = [...current]
              next[hole] = strokes
              return { ...r, scores: { ...r.scores, [memberId]: next } }
            }),
          })),
        }),

      deleteRound: (tripId, roundId) =>
        set({
          trips: patchTrip(get().trips, tripId, (t) => ({
            ...t,
            rounds: t.rounds.filter((r) => r.id !== roundId),
          })),
        }),

      addBet: (tripId, bet) => {
        const newBet: Bet = {
          id: uid('bet'),
          description: bet.description.trim() || 'Wager',
          fromId: bet.fromId,
          toId: bet.toId,
          amount: bet.amount,
          settled: false,
          createdAt: performance.now(),
        }
        set({
          trips: patchTrip(get().trips, tripId, (t) => ({
            ...t,
            bets: [newBet, ...t.bets],
          })),
        })
      },

      toggleBetSettled: (tripId, betId) =>
        set({
          trips: patchTrip(get().trips, tripId, (t) => ({
            ...t,
            bets: t.bets.map((b) =>
              b.id === betId ? { ...b, settled: !b.settled } : b,
            ),
          })),
        }),

      deleteBet: (tripId, betId) =>
        set({
          trips: patchTrip(get().trips, tripId, (t) => ({
            ...t,
            bets: t.bets.filter((b) => b.id !== betId),
          })),
        }),
    }),
    {
      name: 'birdie-trips-v1',
      version: 3,
      migrate: (persisted, version) => {
        const state = persisted as { trips?: unknown[] } | undefined
        if (!state) return persisted as never
        if (version < 2 && Array.isArray(state.trips)) {
          state.trips = state.trips.map((raw) => {
            const t = raw as Record<string, unknown>
            const memberIds = Array.isArray(t.memberIds) ? (t.memberIds as ID[]) : []
            delete t.survey
            return {
              hotelTier: 'midrange',
              needsFlights: false,
              notes: '',
              organizerId: memberIds[0] ?? 'm1',
              ...t,
            }
          })
        }
        if (version < 3 && Array.isArray(state.trips)) {
          for (const raw of state.trips) {
            const t = raw as Record<string, unknown>
            if (Array.isArray(t.rounds)) {
              for (const r of t.rounds as Record<string, unknown>[]) {
                if (!Array.isArray(r.teams)) r.teams = []
                if (!Array.isArray(r.wolf)) r.wolf = Array(18).fill(null)
              }
            }
          }
        }
        return state as never
      },
    },
  ),
)
