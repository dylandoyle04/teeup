import { router } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { computeRyder, nextHole } from '@shared/ryder'
import { fmtPts } from '@shared/ryderLanding'
import { useStore } from '@shared/store'
import type { Trip } from '@shared/types'
import { useLastTrip, type TripSection } from '@/lib/lastTrip'
import { colors, fonts } from '@/theme'

const EXAMPLE_TRIP_ID = 'trip_sample'

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** The trip to offer: the one last opened, else a (real) trip happening today. */
function pickTrip(trips: Trip[], lastId: string | null): Trip | undefined {
  const last = lastId ? trips.find((t) => t.id === lastId) : undefined
  if (last) return last
  const t = today()
  return trips.find(
    (trip) => trip.id !== EXAMPLE_TRIP_ID && trip.startDate && trip.startDate <= t && (trip.endDate || trip.startDate) >= t,
  )
}

/** One-line live status: the Cup score if it's running, else the latest round. */
function statusLine(trip: Trip): { text: string; cup: boolean } {
  const cup = trip.ryderCup ? computeRyder(trip) : null
  if (trip.ryderCup && cup) {
    const { teamAName, teamBName } = trip.ryderCup
    return { cup: true, text: `${teamAName} ${fmtPts(cup.aPoints)} – ${fmtPts(cup.bPoints)} ${teamBName}` }
  }
  const round = trip.rounds[trip.rounds.length - 1]
  if (round) {
    const thru = nextHole(round)
    const where = thru >= round.holePars.length ? 'final' : thru === 0 ? 'not started' : `thru ${thru}`
    return { cup: false, text: `${round.courseName} · ${where}` }
  }
  return { cup: false, text: trip.destination || 'Pick up your plan' }
}

/** "Jump back in" — returning golfers land one tap from their scorecard or Cup. */
export default function ContinueCard() {
  const trips = useStore((s) => s.trips)
  const lastId = useLastTrip((s) => s.tripId)
  const lastSection = useLastTrip((s) => s.section)
  const trip = pickTrip(trips, lastId)
  if (!trip) return null

  const status = statusLine(trip)
  const go = (section: TripSection) =>
    router.push({ pathname: `/trip/[tripId]/${section}`, params: { tripId: trip.id } })
  // primary button: where they were (if it's one of the two), else the Cup when running
  const primary: TripSection =
    lastId === trip.id && (lastSection === 'score' || lastSection === 'ryder') ? lastSection : status.cup ? 'ryder' : 'score'
  const secondary: TripSection = primary === 'ryder' ? 'score' : status.cup ? 'ryder' : 'setup'
  const label = (s: TripSection) => (s === 'ryder' ? '🏆 The Cup' : s === 'score' ? '⛳ Scorecard' : 'Trip plan')

  return (
    <View style={st.card} accessibilityRole="summary">
      <Text style={st.kicker} maxFontSizeMultiplier={1.3}>
        JUMP BACK IN
      </Text>
      <Text style={st.trip} numberOfLines={1} maxFontSizeMultiplier={1.3}>
        {trip.name}
      </Text>
      <Text style={st.status} numberOfLines={1} maxFontSizeMultiplier={1.3}>
        {status.cup ? '🏆 ' : '⛳ '}
        {status.text}
      </Text>
      <View style={st.row}>
        <Pressable
          onPress={() => go(primary)}
          style={({ pressed }) => [st.btn, st.btnPrimary, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel={`Open ${primary === 'ryder' ? 'The Cup' : 'the scorecard'} for ${trip.name}`}
        >
          <Text style={[st.btnText, { color: '#2b2205' }]} maxFontSizeMultiplier={1.3}>
            {label(primary)}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => go(secondary)}
          style={({ pressed }) => [st.btn, st.btnGhost, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel={`Open ${secondary === 'ryder' ? 'The Cup' : secondary === 'score' ? 'the scorecard' : 'the trip plan'} for ${trip.name}`}
        >
          <Text style={[st.btnText, { color: '#fff' }]} maxFontSizeMultiplier={1.3}>
            {label(secondary)}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

const st = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 18,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(6,23,15,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  kicker: { fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.6, color: colors.gold },
  trip: { fontFamily: fonts.serifBold, fontSize: 24, lineHeight: 28, color: '#fff', marginTop: 2 },
  status: { fontFamily: fonts.sansSemi, fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  row: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { flex: 1, borderRadius: 999, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', minHeight: 46 },
  btnPrimary: { backgroundColor: colors.gold },
  btnGhost: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)' },
  btnText: { fontFamily: fonts.sansBold, fontSize: 14 },
})
