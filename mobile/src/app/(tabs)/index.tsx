import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { fmtMiles, rankDestinations, travelHint } from '@shared/nearby'
import { PACKAGES } from '@shared/packages'
import { useStore } from '@shared/store'
import PackageCard from '@/components/PackageCard'
import RyderPromo from '@/components/RyderPromo'
import Screen from '@/components/Screen'
import { EXAMPLE_TRIP_ID, StartCard, TripCard, pickActiveTrip } from '@/components/TripDashboard'
import { fmtDateRange } from '@/components/ui'
import { useLastTrip } from '@/lib/lastTrip'
import { useNear } from '@/lib/near'
import { colors, fonts, shadow } from '@/theme'

// one package per destination (popularity order) — the website's featured set
const ONE_PER_DESTINATION = (() => {
  const seen = new Set<string>()
  return PACKAGES.filter((p) => !seen.has(p.destination) && seen.add(p.destination))
})()

function greeting(): string {
  const h = new Date().getHours()
  return h < 5 ? 'Good evening' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export default function Home() {
  const trips = useStore((s) => s.trips)
  const lastId = useLastTrip((s) => s.tripId)
  const near = useNear((s) => s.place)

  // lead with the trip you were in / on today, else your newest real trip
  const realTrips = trips.filter((t) => t.id !== EXAMPLE_TRIP_ID)
  const active =
    pickActiveTrip(trips, lastId) ?? [...realTrips].sort((a, b) => b.createdAt - a.createdAt)[0]
  const others = [...realTrips].filter((t) => t.id !== active?.id).sort((a, b) => b.createdAt - a.createdAt)

  const { picks, distanceOf } = useMemo(() => {
    if (!near) return { picks: ONE_PER_DESTINATION.slice(0, 6), distanceOf: (): string | undefined => undefined }
    const ranked = rankDestinations(near)
    const order = new Map(ranked.map((r, i) => [r.destination, i]))
    const miles = new Map(ranked.map((r) => [r.destination, r.miles]))
    return {
      picks: [...ONE_PER_DESTINATION].sort((a, b) => (order.get(a.destination) ?? 99) - (order.get(b.destination) ?? 99)).slice(0, 6),
      distanceOf: (dest: string) => {
        const m = miles.get(dest)
        return m == null ? undefined : `${fmtMiles(m)} · ${travelHint(m)}`
      },
    }
  }, [near])

  return (
    <Screen statusBarShield>
      {/* header */}
      <View style={st.header}>
        <Image source={require('@/assets/images/icon.png')} style={st.logo} accessibilityIgnoresInvertColors />
        <View style={{ flex: 1 }}>
          <Text style={st.brand} maxFontSizeMultiplier={1.3}>
            Flagstick<Text style={{ color: colors.brandAccent }}> Finder</Text>
          </Text>
          <Text style={st.greeting} maxFontSizeMultiplier={1.3}>
            {greeting()}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/settings')}
          hitSlop={10}
          style={st.gear}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <Text style={{ fontSize: 22 }}>⚙︎</Text>
        </Pressable>
      </View>

      {active ? <TripCard trip={active} /> : <StartCard hasExample={trips.some((t) => t.id === EXAMPLE_TRIP_ID)} />}

      {others.length > 0 && (
        <View style={{ marginTop: 22 }}>
          <View style={st.sectionRow}>
            <Text style={st.section}>Your other trips</Text>
            <Pressable onPress={() => router.navigate('/trips')} hitSlop={8} accessibilityRole="button">
              <Text style={st.seeAll}>All trips</Text>
            </Pressable>
          </View>
          <View style={st.list}>
            {others.slice(0, 3).map((t, i) => (
              <Pressable
                key={t.id}
                onPress={() => router.push({ pathname: '/trip/[tripId]/setup', params: { tripId: t.id } })}
                style={({ pressed }) => [st.listRow, i > 0 && st.listLine, pressed && { backgroundColor: colors.green100 }]}
                accessibilityRole="button"
              >
                <View style={{ flex: 1 }}>
                  <Text style={st.rowName} numberOfLines={1}>
                    {t.name}
                  </Text>
                  <Text style={st.rowMeta} numberOfLines={1}>
                    {[t.destination || 'Destination TBD', t.startDate ? fmtDateRange(t.startDate, t.endDate) : null].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Text style={st.chev}>›</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <View style={[st.sectionRow, { marginTop: 26 }]}>
        <Text style={st.section}>{near ? 'Trips near you' : 'Featured trips'}</Text>
        <Pressable onPress={() => router.navigate('/explore')} hitSlop={8} accessibilityRole="button">
          <Text style={st.seeAll}>{near ? 'See all' : 'Sort by distance'}</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={262}
        style={{ marginHorizontal: -16 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      >
        {picks.map((p) => (
          <PackageCard key={p.id} pkg={p} width={250} height={176} distance={distanceOf(p.destination)} />
        ))}
      </ScrollView>

      <View style={{ marginTop: 26 }}>
        <RyderPromo />
      </View>
    </Screen>
  )
}

const st = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  logo: { width: 44, height: 44, borderRadius: 11 },
  brand: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.green900 },
  greeting: { fontFamily: fonts.serifBold, fontSize: 30, lineHeight: 33, color: colors.green900 },
  gear: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper, ...shadow },
  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 },
  section: { fontFamily: fonts.serifBold, fontSize: 24, color: colors.green900 },
  seeAll: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.green600 },
  list: { backgroundColor: colors.paper, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hair, overflow: 'hidden' },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, minHeight: 56 },
  listLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  rowName: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.ink },
  rowMeta: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
  chev: { fontFamily: fonts.sans, fontSize: 24, color: colors.muted, marginLeft: 8 },
})
