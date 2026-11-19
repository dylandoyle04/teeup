import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { computeRyder, nextHole } from '@shared/ryder'
import { fmtPts } from '@shared/ryderLanding'
import type { Trip } from '@shared/types'
import { fmtDateRange } from '@/components/ui'
import type { TripSection } from '@/lib/lastTrip'
import { colors, fonts, shadow } from '@/theme'

export const EXAMPLE_TRIP_ID = 'trip_sample'

const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** The trip Home leads with: the one last opened, else a real trip happening today. */
export function pickActiveTrip(trips: Trip[], lastId: string | null): Trip | undefined {
  const last = lastId ? trips.find((t) => t.id === lastId) : undefined
  if (last) return last
  const t = todayISO()
  return trips.find(
    (trip) => trip.id !== EXAMPLE_TRIP_ID && trip.startDate && trip.startDate <= t && (trip.endDate || trip.startDate) >= t,
  )
}

function cupLine(trip: Trip): string | null {
  if (!trip.ryderCup) return null
  const s = computeRyder(trip)
  if (!s) return null
  const { teamAName, teamBName } = trip.ryderCup
  return `${teamAName} ${fmtPts(s.aPoints)} – ${fmtPts(s.bPoints)} ${teamBName}`
}

function roundLine(trip: Trip): string | null {
  const today = todayISO()
  const round = trip.rounds.find((r) => r.date === today) ?? trip.rounds[trip.rounds.length - 1]
  if (!round) return null
  const thru = nextHole(round)
  const where = thru >= round.holePars.length ? 'final' : thru === 0 ? 'not started' : `thru ${thru}`
  return `${round.date === today ? 'Today · ' : ''}${round.courseName} · ${where}`
}

const go = (tripId: string, section: TripSection) =>
  router.push({ pathname: `/trip/[tripId]/${section}`, params: { tripId } })

/** The big green card: live status + one-tap shortcuts into the trip. */
export function TripCard({ trip }: { trip: Trip }) {
  const cup = cupLine(trip)
  const round = roundLine(trip)
  const meta = [trip.destination, trip.startDate ? fmtDateRange(trip.startDate, trip.endDate) : null].filter(Boolean).join(' · ')
  const shortcuts: { section: TripSection; label: string }[] = [
    { section: 'score', label: '⛳ Scorecard' },
    { section: 'ryder', label: '🏆 The Cup' },
    { section: 'bets', label: '💵 Bets' },
  ]
  return (
    <View style={st.wrap}>
      <LinearGradient colors={[colors.green700, colors.green900]} style={st.card}>
        <Pressable onPress={() => go(trip.id, 'setup')} accessibilityRole="button" accessibilityLabel={`Open ${trip.name}`}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={st.kicker} maxFontSizeMultiplier={1.3}>
              {trip.id === EXAMPLE_TRIP_ID ? 'EXAMPLE TRIP' : 'YOUR TRIP'}
            </Text>
          </View>
          <Text style={st.name} numberOfLines={2} maxFontSizeMultiplier={1.3}>
            {trip.name}
          </Text>
          {meta ? (
            <Text style={st.meta} numberOfLines={1} maxFontSizeMultiplier={1.3}>
              {meta}
            </Text>
          ) : null}
        </Pressable>

        {(cup || round) && (
          <View style={st.status}>
            {cup ? (
              <Text style={st.statusText} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                🏆 {cup}
              </Text>
            ) : null}
            {round ? (
              <Text style={st.statusText} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                ⛳ {round}
              </Text>
            ) : null}
          </View>
        )}

        <View style={st.row}>
          {shortcuts.map((s, i) => (
            <Pressable
              key={s.section}
              onPress={() => go(trip.id, s.section)}
              style={({ pressed }) => [st.btn, i === 0 ? st.btnPrimary : st.btnGhost, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
            >
              <Text style={[st.btnText, { color: i === 0 ? '#2b2205' : '#fff' }]} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </LinearGradient>
    </View>
  )
}

/** New users: no trip yet. */
export function StartCard({ hasExample }: { hasExample: boolean }) {
  return (
    <View style={st.wrap}>
      <LinearGradient colors={[colors.green700, colors.green900]} style={st.card}>
        <Text style={st.kicker}>LET&apos;S GET YOU ON THE COURSE</Text>
        <Text style={st.name}>Start your first trip</Text>
        <Text style={st.meta}>Pick a curated package or build your own — then keep score with the crew.</Text>
        <View style={[st.row, { marginTop: 16 }]}>
          <Pressable onPress={() => router.navigate('/explore')} style={({ pressed }) => [st.btn, st.btnPrimary, pressed && { opacity: 0.85 }]} accessibilityRole="button">
            <Text style={[st.btnText, { color: '#2b2205' }]}>Browse trips</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/new')} style={({ pressed }) => [st.btn, st.btnGhost, pressed && { opacity: 0.85 }]} accessibilityRole="button">
            <Text style={[st.btnText, { color: '#fff' }]}>Build your own</Text>
          </Pressable>
        </View>
        {hasExample ? (
          <Pressable onPress={() => go(EXAMPLE_TRIP_ID, 'score')} hitSlop={8} style={{ marginTop: 14 }} accessibilityRole="button">
            <Text style={st.link}>Or look around the example trip →</Text>
          </Pressable>
        ) : null}
      </LinearGradient>
    </View>
  )
}

const st = StyleSheet.create({
  wrap: { borderRadius: 22, ...shadow },
  card: { borderRadius: 22, padding: 18 },
  kicker: { fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.6, color: colors.gold },
  name: { fontFamily: fonts.serifBold, fontSize: 30, lineHeight: 33, color: '#fff', marginTop: 4 },
  meta: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.82)', marginTop: 4 },
  status: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    gap: 4,
  },
  statusText: { fontFamily: fonts.sansSemi, fontSize: 14, color: '#fff' },
  row: { flexDirection: 'row', gap: 8, marginTop: 14 },
  btn: { flex: 1, borderRadius: 999, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', minHeight: 46 },
  btnPrimary: { backgroundColor: colors.gold },
  btnGhost: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)' },
  btnText: { fontFamily: fonts.sansBold, fontSize: 13 },
  link: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.teeGreen },
})
