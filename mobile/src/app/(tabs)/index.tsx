import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import type { ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getPackage, PACKAGES } from '@shared/packages'
import { useStore } from '@shared/store'
import { EXAMPLE_TRIP_ID, cupLine, pickActiveTrip, roundInProgress, roundLine } from '@/lib/tripStatus'
import { useLastTrip } from '@/lib/lastTrip'
import { useNear } from '@/lib/near'
import { openPlayMode } from '@/lib/playMode'
import { useLightStatusBar } from '@/lib/useLightStatusBar'
import { colors, fonts } from '@/theme'

const OUR_TRIPS_PHOTO = PACKAGES[0]?.image
const NEAR_PHOTO = (getPackage('pinehurst-luxury') ?? PACKAGES[1])?.image

/** App home: the brand up top, then a short menu of big tiles. */
export default function Home() {
  const insets = useSafeAreaInsets()
  useLightStatusBar()
  const trips = useStore((s) => s.trips)
  const lastId = useLastTrip((s) => s.tripId)
  const lastSection = useLastTrip((s) => s.section)
  const near = useNear((s) => s.place)

  const realTrips = trips.filter((t) => t.id !== EXAMPLE_TRIP_ID)
  const trip = pickActiveTrip(trips, lastId) ?? [...realTrips].sort((a, b) => b.createdAt - a.createdAt)[0]
  const live = trip ? roundInProgress(trip) : undefined
  const status = trip ? (cupLine(trip) ? `🏆 ${cupLine(trip)}` : roundLine(trip) ? `⛳ ${roundLine(trip)}` : trip.destination) : null

  const openTrip = () => {
    if (!trip) return router.navigate('/explore')
    const section = lastId === trip.id && lastSection ? lastSection : 'setup'
    router.push({ pathname: `/trip/[tripId]/${section}`, params: { tripId: trip.id } })
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.green900 }}>
      <LinearGradient colors={['#12432f', '#0b3d2c', '#06170f']} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ paddingTop: insets.top + 18, paddingHorizontal: 18, paddingBottom: 120 }}
      >
        <View style={st.topRow}>
          <Pressable
            onPress={() => router.push('/settings')}
            hitSlop={10}
            style={st.gear}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <Text style={{ fontSize: 20, color: '#fff' }}>⚙︎</Text>
          </Pressable>
        </View>

        {/* brand, in the original wordmark style */}
        <View style={st.brandBlock} accessible accessibilityRole="header" accessibilityLabel="Flagstick Finder">
          <Text style={st.logo} adjustsFontSizeToFit numberOfLines={1} maxFontSizeMultiplier={1.2}>
            Flagstick<Text style={{ color: colors.brandAccent }}> Finder</Text>
          </Text>
          <View style={st.divider}>
            <View style={st.line} />
            <View style={st.ball} />
            <View style={st.line} />
          </View>
          <Text style={st.tagline} maxFontSizeMultiplier={1.3}>
            Golf trips made easy
          </Text>
        </View>

        {/* 1. jump back in (or start one) */}
        <Pressable
          onPress={openTrip}
          style={({ pressed }) => [st.tile, st.tripTile, pressed && st.pressed]}
          accessibilityRole="button"
          accessibilityLabel={trip ? `Jump back into ${trip.name}` : 'Start a trip'}
        >
          <Text style={st.kicker}>{trip ? (trip.id === EXAMPLE_TRIP_ID ? 'JUMP BACK IN · EXAMPLE' : 'JUMP BACK IN') : 'GET STARTED'}</Text>
          <Text style={st.tileTitle} numberOfLines={2} maxFontSizeMultiplier={1.3}>
            {trip ? trip.name : 'Start your first trip'}
          </Text>
          <Text style={st.tileSub} numberOfLines={1} maxFontSizeMultiplier={1.3}>
            {trip ? status || 'Open your trip' : 'Pick a curated trip or build your own'}
          </Text>
          {live && trip ? (
            <Pressable
              onPress={() => openPlayMode(trip.id, live.id)}
              style={({ pressed }) => [st.playBtn, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
              accessibilityLabel={`Keep scoring ${live.courseName}`}
            >
              <Text style={st.playText}>▶ Keep scoring</Text>
            </Pressable>
          ) : null}
          <Text style={st.arrow}>›</Text>
        </Pressable>

        {/* 2. how it works */}
        <MenuTile
          icon="📖"
          title="How it works"
          sub="Take the 1-minute tour of Flagstick Finder"
          onPress={() => router.push('/welcome')}
        />

        {/* 3 + 4. browse */}
        <View style={st.pair}>
          <PhotoTile photo={OUR_TRIPS_PHOTO} title="Our trips" sub="11 destinations" onPress={() => router.navigate('/explore')} />
          <PhotoTile
            photo={NEAR_PHOTO}
            title="Trips near you"
            sub={near ? `From ${near.label}` : 'Sorted by distance'}
            onPress={() => router.navigate('/explore')}
          />
        </View>
      </ScrollView>
    </View>
  )
}

function MenuTile({ icon, title, sub, onPress }: { icon: string; title: string; sub: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [st.tile, st.row, pressed && st.pressed]} accessibilityRole="button" accessibilityLabel={title}>
      <Text style={{ fontSize: 26 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={st.tileTitleSm} maxFontSizeMultiplier={1.3}>
          {title}
        </Text>
        <Text style={st.tileSub} numberOfLines={2} maxFontSizeMultiplier={1.3}>
          {sub}
        </Text>
      </View>
      <Text style={[st.arrow, { position: 'relative', right: 0, top: 0 }]}>›</Text>
    </Pressable>
  )
}

function PhotoTile({ photo, title, sub, onPress }: { photo?: string; title: string; sub: string; onPress: () => void }): ReactNode {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [st.photoTile, pressed && st.pressed]} accessibilityRole="button" accessibilityLabel={title}>
      {photo ? <Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} cachePolicy="memory-disk" /> : null}
      <LinearGradient colors={['rgba(0,0,0,0.05)', 'rgba(4,22,10,0.85)']} locations={[0.25, 1]} style={StyleSheet.absoluteFill} />
      <View style={st.photoText}>
        <Text style={st.tileTitleSm} maxFontSizeMultiplier={1.2}>
          {title}
        </Text>
        <Text style={st.tileSub} numberOfLines={1} maxFontSizeMultiplier={1.2}>
          {sub}
        </Text>
      </View>
    </Pressable>
  )
}

const st = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  gear: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  brandBlock: { alignItems: 'center', marginTop: 6, marginBottom: 30 },
  logo: {
    fontFamily: fonts.sansBold,
    fontSize: 44,
    color: '#fff',
    letterSpacing: -1,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowRadius: 14,
    textShadowOffset: { width: 0, height: 3 },
  },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14, width: 180 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.6)' },
  ball: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  tagline: { fontFamily: fonts.serif, fontSize: 22, color: 'rgba(255,255,255,0.9)' },
  tile: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
  },
  tripTile: { borderColor: 'rgba(212,175,55,0.65)', backgroundColor: 'rgba(212,175,55,0.08)', paddingRight: 40 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  kicker: { fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.6, color: colors.gold },
  tileTitle: { fontFamily: fonts.serifBold, fontSize: 28, lineHeight: 31, color: '#fff', marginTop: 4 },
  tileTitleSm: { fontFamily: fonts.serifBold, fontSize: 22, lineHeight: 25, color: '#fff' },
  tileSub: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: 'rgba(255,255,255,0.82)', marginTop: 2 },
  arrow: { position: 'absolute', right: 16, top: 16, fontFamily: fonts.sans, fontSize: 26, color: 'rgba(255,255,255,0.7)' },
  playBtn: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  playText: { fontFamily: fonts.sansBold, fontSize: 14, color: '#2b2205' },
  pair: { flexDirection: 'row', gap: 12 },
  photoTile: { flex: 1, height: 170, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.green700 },
  photoText: { position: 'absolute', left: 14, right: 14, bottom: 14 },
})
