import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { getPackage } from '@shared/packages'
import { useStore } from '@shared/store'
import Carousel from '@/components/Carousel'
import { Button, Card, Hint, SectionTitle, Serif, T, money } from '@/components/ui'
import { openLink } from '@/lib/links'
import { colors, fonts } from '@/theme'

export default function PackageDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const pkg = getPackage(id)
  const createTripFromPackage = useStore((s) => s.createTripFromPackage)
  const { height, width } = useWindowDimensions()

  if (!pkg) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
        <Serif style={{ fontSize: 24 }}>That package doesn&apos;t exist.</Serif>
        <Button title="Back to trips" variant="subtle" onPress={() => router.back()} />
      </View>
    )
  }

  function startTrip() {
    const tripId = createTripFromPackage(pkg!)
    router.push({ pathname: '/trip/[tripId]/book', params: { tripId } })
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream }} contentContainerStyle={{ paddingBottom: 48 }}>
      <View style={{ height: height * 0.5 }}>
        <Image source={pkg.image} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} cachePolicy="memory-disk" />
        <LinearGradient colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']} locations={[0, 0.3, 1]} style={StyleSheet.absoluteFill} />
        <View style={st.heroText}>
          <View style={[st.tier, { backgroundColor: pkg.tier === 'luxury' ? colors.gold : colors.teeGreen }]}>
            <Text style={[st.tierText, { color: pkg.tier === 'luxury' ? '#3a2e07' : '#133d12' }]}>{pkg.tierLabel}</Text>
          </View>
          <Text style={st.loc}>{pkg.region}</Text>
          <Text style={st.title}>{pkg.title}</Text>
          <Text style={st.meta}>
            📍 {pkg.destination} · ⛳ {pkg.courses.length} courses · {money(pkg.budgetMin)}–{money(pkg.budgetMax)}/pp
          </Text>
        </View>
      </View>

      <View style={{ padding: 16 }}>
        <T style={{ fontSize: 16, lineHeight: 25, marginBottom: 18 }}>{pkg.blurb}</T>
        <Button title="Start a trip from this package →" variant="gold" onPress={startTrip} />
        <Hint style={{ textAlign: 'center', marginTop: 8 }}>
          Opens a booking page with hotel, flight, and tee-time links for these courses.
        </Hint>

        <SectionTitle>The courses</SectionTitle>
        <View style={{ gap: 16 }}>
          {pkg.courses.map((c) => (
            <Card key={c.name} style={{ padding: 0, overflow: 'hidden' }}>
              <Carousel images={c.images} width={width - 32} />
              <View style={{ padding: 16, gap: 8 }}>
                <Serif style={{ fontSize: 24, lineHeight: 27 }}>{c.name}</Serif>
                <T style={{ color: colors.muted, fontSize: 14 }}>{c.blurb}</T>
                {c.golfNow ? (
                  <Button title="Tee times on GolfNow ↗" small variant="subtle" onPress={() => openLink(c.golfNow!)} style={{ alignSelf: 'flex-start' }} />
                ) : c.website ? (
                  <Button title="Visit course website ↗" small variant="subtle" onPress={() => openLink(c.website!)} style={{ alignSelf: 'flex-start' }} />
                ) : null}
              </View>
            </Card>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}

const st = StyleSheet.create({
  heroText: { position: 'absolute', left: 16, right: 16, bottom: 20 },
  tier: { alignSelf: 'flex-start', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 11, marginBottom: 8 },
  tierText: { fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 0.7, textTransform: 'uppercase' },
  loc: { fontFamily: fonts.sansSemi, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)' },
  title: { fontFamily: fonts.serifBold, fontSize: 34, lineHeight: 37, color: '#fff', marginVertical: 4 },
  meta: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.92)' },
})
