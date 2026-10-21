import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { PACKAGES } from '@shared/packages'
import { fmtMiles, rankDestinations, travelHint, type Place } from '@shared/nearby'
import NearbySearch from '@/components/NearbySearch'
import PackageCard from '@/components/PackageCard'
import RyderPromo from '@/components/RyderPromo'
import Screen from '@/components/Screen'
import { PageTitle, SectionTitle, Serif, T } from '@/components/ui'
import { colors, fonts, shadow } from '@/theme'

const NEAR_KEY = 'ff-near'

export default function Explore() {
  const [near, setNearState] = useState<Place | null>(null)

  useEffect(() => {
    AsyncStorage.getItem(NEAR_KEY)
      .then((v) => {
        const p = v ? JSON.parse(v) : null
        if (p && typeof p.lat === 'number' && typeof p.lon === 'number') setNearState(p)
      })
      .catch(() => {})
  }, [])

  function setNear(p: Place | null) {
    setNearState(p)
    ;(p ? AsyncStorage.setItem(NEAR_KEY, JSON.stringify(p)) : AsyncStorage.removeItem(NEAR_KEY)).catch(() => {})
  }

  // nearest destinations first, each card labelled with distance + travel time
  const { packages, distanceOf } = useMemo(() => {
    if (!near) return { packages: PACKAGES, distanceOf: (_: string): string | undefined => undefined }
    const ranked = rankDestinations(near)
    const rank = new Map(ranked.map((r, i) => [r.destination, i]))
    const miles = new Map(ranked.map((r) => [r.destination, r.miles]))
    return {
      packages: [...PACKAGES].sort((a, b) => (rank.get(a.destination) ?? 99) - (rank.get(b.destination) ?? 99)),
      distanceOf: (dest: string) => {
        const m = miles.get(dest)
        return m == null ? undefined : `${fmtMiles(m)} · ${travelHint(m)}`
      },
    }
  }, [near])

  return (
    <Screen>
      <PageTitle sub="Start from a curated package or build your own — then invite friends to keep score.">
        Plan your golf trip
      </PageTitle>

      <RyderPromo />

      <View style={{ marginTop: 16 }}>
        <NearbySearch value={near} onChange={setNear} />
      </View>

      <SectionTitle>{near ? 'Trips closest to you' : 'Our preplanned trips'}</SectionTitle>
      <View style={{ gap: 14 }}>
        {packages.map((p) => (
          <PackageCard key={p.id} pkg={p} distance={distanceOf(p.destination)} />
        ))}
      </View>

      <SectionTitle>Or start from scratch</SectionTitle>
      <Pressable
        style={({ pressed }) => [st.createOwn, pressed && { opacity: 0.85 }]}
        onPress={() => router.push('/new')}
        accessibilityRole="button"
      >
        <Text style={{ fontSize: 28 }}>⛳</Text>
        <View style={{ flex: 1 }}>
          <Serif style={{ fontSize: 22 }}>Create your own</Serif>
          <T style={{ color: colors.muted, fontSize: 13 }}>Build a custom trip and invite friends to keep score.</T>
        </View>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 20, color: colors.green700 }}>→</Text>
      </Pressable>
    </Screen>
  )
}

const st = StyleSheet.create({
  createOwn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.paper,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.hair,
    ...shadow,
  },
})
