import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PACKAGES } from '@shared/packages'
import PackageCard from '@/components/PackageCard'
import { Button, Card, SectionTitle, Serif, T } from '@/components/ui'
import { openLink } from '@/lib/links'
import { useLightStatusBar } from '@/lib/useLightStatusBar'
import { ASSET_BASE } from '@/platform'
import { colors, fonts } from '@/theme'

// one package per destination, top 4 by popularity order (same as the website)
const FEATURED = (() => {
  const seen = new Set<string>()
  const out: typeof PACKAGES = []
  for (const p of PACKAGES) {
    if (!seen.has(p.destination)) {
      seen.add(p.destination)
      out.push(p)
    }
    if (out.length === 4) break
  }
  return out
})()

const STEPS = [
  ['Plan', 'Pick a curated destination package or build your own — courses, hotels, flights, drive times, and dining.'],
  ['Invite', 'Share one link. Friends sign in and join the trip — everyone on the same page.'],
  ['Score', 'Keep score live together — a shared scorecard, side games, and a trip-long Ryder Cup.'],
  ['Eat & more', 'Restaurant picks near every course, drive times, and everything else the trip needs.'],
]

export default function Home() {
  const { height, width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  useLightStatusBar()

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ height: height * 0.82 }}>
        <Image source={`${ASSET_BASE}hero.jpg?v=wekopa`} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} cachePolicy="memory-disk" />
        <LinearGradient
          colors={['rgba(4,22,10,0.55)', 'rgba(4,22,10,0.18)', 'rgba(4,22,10,0.25)', 'rgba(4,22,10,0.72)']}
          locations={[0, 0.28, 0.58, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[st.hero, { paddingTop: insets.top }]}>
          <Text style={st.logo} adjustsFontSizeToFit numberOfLines={1}>
            Flagstick<Text style={{ color: colors.brandAccent }}> Finder</Text>
          </Text>
          <View style={st.divider}>
            <View style={st.line} />
            <View style={st.ball} />
            <View style={st.line} />
          </View>
          <Text style={st.lead}>Book the trip. Invite the crew. Keep score.</Text>
          <Text style={st.sub}>
            Courses, hotels & travel — with a live shared scorecard, side games, and a trip-long Ryder Cup.
          </Text>
          <Pressable style={({ pressed }) => [st.cta, pressed && { backgroundColor: 'rgba(255,255,255,0.2)' }]} onPress={() => router.push('/explore')}>
            <Text style={st.ctaText}>Plan your trip</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ padding: 16 }}>
        <SectionTitle>How it works</SectionTitle>
        <View style={{ gap: 10 }}>
          {STEPS.map(([title, body], i) => (
            <Card key={title} style={{ flexDirection: 'row', gap: 14 }}>
              <View style={st.stepN}>
                <Text style={st.stepNText}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Serif style={{ fontSize: 22 }}>{title}</Serif>
                <T style={{ color: colors.muted, fontSize: 14 }}>{body}</T>
              </View>
            </Card>
          ))}
        </View>

        <SectionTitle>Featured trips</SectionTitle>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={width * 0.82 + 12}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      >
        {FEATURED.map((p) => (
          <PackageCard key={p.id} pkg={p} width={width * 0.82} />
        ))}
      </ScrollView>
      <View style={{ padding: 16, gap: 16 }}>
        <Button title="See all trips →" variant="ghost" onPress={() => router.push('/explore')} />

        <Card style={{ backgroundColor: colors.green900, borderColor: colors.green900 }}>
          <Text style={st.badge}>SAME PRICE, ALWAYS</Text>
          <Serif style={{ color: '#fff', fontSize: 26, marginVertical: 6 }}>Booking here keeps it free</Serif>
          <T style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
            Book your hotels, flights, rental cars, and tee times right from Flagstick Finder — it costs you exactly the same
            as going direct. When you do, we earn a small referral that keeps the app free and growing.
          </T>
        </Card>

        <T style={{ textAlign: 'center', color: colors.muted, fontSize: 13 }}>
          11 destinations · 70+ courses · one live scorecard
        </T>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 24 }}>
          <Text style={st.footLink} onPress={() => openLink('https://flagstickfinder.com/#/legal')}>
            Privacy & Terms
          </Text>
          <Text style={st.footLink} onPress={() => openLink('mailto:Flagstickfinder@outlook.com')}>
            Contact
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

const st = StyleSheet.create({
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  logo: {
    fontFamily: fonts.sansBold,
    fontSize: 44,
    color: '#fff',
    letterSpacing: -1,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowRadius: 14,
    textShadowOffset: { width: 0, height: 3 },
  },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 18, width: 180 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.7)' },
  ball: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  lead: { fontFamily: fonts.serif, fontSize: 26, color: '#fff', textAlign: 'center', lineHeight: 30 },
  sub: { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 10, lineHeight: 21 },
  cta: {
    marginTop: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    paddingVertical: 15,
    paddingHorizontal: 44,
  },
  ctaText: { fontFamily: fonts.sansMedium, color: '#fff', fontSize: 14, letterSpacing: 2.6, textTransform: 'uppercase' },
  stepN: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.green100, alignItems: 'center', justifyContent: 'center' },
  stepNText: { fontFamily: fonts.sansBold, color: colors.green700 },
  badge: { fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 1, color: colors.gold },
  footLink: { fontFamily: fonts.sansMedium, color: colors.green700, fontSize: 14 },
})
