import * as Haptics from 'expo-haptics'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useRef, useState, type ReactNode } from 'react'
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { GAMES } from '@shared/games'
import { RYDER_FORMATS } from '@shared/ryder'
import { useLightStatusBar } from '@/lib/useLightStatusBar'
import { markWelcomeSeen } from '@/lib/welcome'
import { ASSET_BASE } from '@/platform'
import { colors, fonts } from '@/theme'

const BLUE = '#1d5fb0'
const GOLD = '#c6952a'

type Page = {
  key: string
  eyebrow: string
  title: string
  body: string
  image?: string
  extra: () => ReactNode
}

const PAGES: Page[] = [
  {
    key: 'plan',
    eyebrow: 'Plan',
    title: 'Golf trips, planned for you',
    body: 'Pick a curated trip package or build your own. Then book the courses, the stay, and the travel right from the trip.',
    image: `${ASSET_BASE}hero.jpg?v=wekopa`,
    extra: () => <Checklist items={['Curated destination packages', 'Tee times, hotels, flights & cars', 'Drive times and places to eat']} />,
  },
  {
    key: 'score',
    eyebrow: 'Score together',
    title: 'One live scorecard for the group',
    body: 'Keep everyone’s score on one phone, hole by hole, with side games running alongside. When the round’s done, share the results as an image.',
    image: `${ASSET_BASE}packages/harbour-town-1.jpg`,
    extra: () => (
      <View style={st.chips}>
        {GAMES.map((g) => (
          <View key={g} style={st.chip}>
            <Text style={st.chipText}>{g}</Text>
          </View>
        ))}
      </View>
    ),
  },
  {
    key: 'ryder',
    eyebrow: 'The Ryder Cup',
    title: 'Two teams. Three formats. One cup.',
    body: 'Split the crew into two teams and play for the cup all trip long — every match adds to the running total.',
    extra: () => <RyderBadge />,
  },
  {
    key: 'near',
    eyebrow: 'Find trips near you',
    title: 'The closest great golf, first',
    body: 'See which trip destinations are closest — perfect for a long weekend you can drive to. Your location stays on your phone.',
    image: `${ASSET_BASE}packages/pinehurst-no2-1.jpg`,
    extra: () => <Checklist items={['Use your location or type a city', 'Destinations sorted by distance']} />,
  },
]

export default function Welcome() {
  const { width, height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const list = useRef<FlatList<Page>>(null)
  const [index, setIndex] = useState(0)
  useLightStatusBar()

  const last = index === PAGES.length - 1

  const finish = () => {
    markWelcomeSeen()
    if (router.canGoBack()) router.back()
    else router.replace('/')
  }

  const next = () => {
    Haptics.selectionAsync().catch(() => {})
    if (last) {
      finish()
      return
    }
    const i = index + 1
    list.current?.scrollToOffset({ offset: i * width, animated: true })
    setIndex(i)
  }

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width)
    if (i !== index) setIndex(Math.max(0, Math.min(PAGES.length - 1, i)))
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#06170f' }}>
      <FlatList
        ref={list}
        data={PAGES}
        keyExtractor={(p) => p.key}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item, index: i }) => (
          <View style={{ width, height }}>
            {item.image ? (
              <Image
                source={item.image}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={300}
                cachePolicy="memory-disk"
                accessible={false}
              />
            ) : null}
            <LinearGradient
              colors={
                item.image
                  ? ['rgba(18,67,47,0.55)', 'rgba(6,23,15,0.82)', 'rgba(6,23,15,0.97)']
                  : ['#12432f', '#06170f']
              }
              locations={item.image ? [0, 0.45, 1] : [0, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[st.page, { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 150 }]}
              accessible
              accessibilityLabel={`Page ${i + 1} of ${PAGES.length}. ${item.eyebrow}. ${item.title}. ${item.body}`}
            >
              <Text style={st.eyebrow}>
                {String(i + 1).padStart(2, '0')} · {item.eyebrow.toUpperCase()}
              </Text>
              <Text style={st.title}>{item.title}</Text>
              <View style={st.rule} />
              <Text style={st.body}>{item.body}</Text>
              <View style={{ marginTop: 26 }}>{item.extra()}</View>
            </View>
          </View>
        )}
      />

      <View style={[st.top, { top: insets.top + 8 }]} pointerEvents="box-none">
        <Text style={st.brand}>
          Flagstick<Text style={{ color: colors.brandAccent }}> Finder</Text>
        </Text>
        {!last ? (
          <Pressable
            onPress={finish}
            hitSlop={8}
            style={st.skip}
            accessibilityRole="button"
            accessibilityLabel="Skip the welcome tour"
          >
            <Text style={st.skipText}>Skip</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={[st.bottom, { paddingBottom: insets.bottom + 20 }]} pointerEvents="box-none">
        <View
          style={st.dots}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="Welcome tour"
          accessibilityValue={{ text: `Page ${index + 1} of ${PAGES.length}` }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => {
            const i = e.nativeEvent.actionName === 'increment' ? index + 1 : index - 1
            if (i < 0 || i >= PAGES.length) return
            list.current?.scrollToOffset({ offset: i * width, animated: true })
            setIndex(i)
          }}
        >
          {PAGES.map((p, i) => (
            <View key={p.key} style={[st.dot, i === index && st.dotOn]} />
          ))}
        </View>
        <Pressable
          onPress={next}
          style={({ pressed }) => [st.next, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
          accessibilityRole="button"
          accessibilityLabel={last ? 'Get started' : 'Next page'}
        >
          <Text style={st.nextText}>{last ? 'Get started' : 'Next'}</Text>
        </Pressable>
      </View>
    </View>
  )
}

function Checklist({ items }: { items: string[] }) {
  return (
    <View style={{ gap: 10 }}>
      {items.map((t) => (
        <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={st.tick}>
            <Text style={st.tickText}>✓</Text>
          </View>
          <Text style={st.listText}>{t}</Text>
        </View>
      ))}
    </View>
  )
}

function RyderBadge() {
  return (
    <View style={{ gap: 14 }}>
      <View style={st.vsRow}>
        <View style={[st.team, { backgroundColor: BLUE }]}>
          <Text style={st.teamLabel}>TEAM</Text>
          <Text style={st.teamName}>Blue</Text>
        </View>
        <Text style={st.vs}>vs</Text>
        <View style={[st.team, { backgroundColor: GOLD }]}>
          <Text style={st.teamLabel}>TEAM</Text>
          <Text style={st.teamName}>Gold</Text>
        </View>
      </View>
      <View style={st.chips}>
        {RYDER_FORMATS.map((f) => (
          <View key={f.name} style={st.chip}>
            <Text style={st.chipText}>{f.name}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const st = StyleSheet.create({
  page: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 28 },
  eyebrow: { fontFamily: fonts.sansSemi, fontSize: 12, letterSpacing: 2.4, color: colors.gold, marginBottom: 10 },
  title: { fontFamily: fonts.serifBold, fontSize: 42, lineHeight: 44, color: '#fff' },
  rule: { width: 48, height: 2, backgroundColor: colors.gold, marginVertical: 16, borderRadius: 1 },
  body: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 24, color: 'rgba(255,255,255,0.9)' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.6)',
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipText: { fontFamily: fonts.sansMedium, fontSize: 13, color: '#f3e3a6' },
  tick: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickText: { color: '#2b2205', fontFamily: fonts.sansBold, fontSize: 12 },
  listText: { fontFamily: fonts.sansMedium, fontSize: 15, color: '#fff' },
  vsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  team: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  teamLabel: { fontFamily: fonts.sansSemi, fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.8)' },
  teamName: { fontFamily: fonts.serifBold, fontSize: 28, color: '#fff' },
  vs: { fontFamily: fonts.serifBold, fontSize: 24, color: colors.gold },
  top: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 28,
    paddingRight: 12,
    minHeight: 44,
  },
  brand: { fontFamily: fonts.sansBold, fontSize: 18, color: '#fff', letterSpacing: -0.3 },
  skip: { minHeight: 44, minWidth: 64, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  skipText: { fontFamily: fonts.sansSemi, fontSize: 15, color: 'rgba(255,255,255,0.85)' },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 28, gap: 20 },
  dots: { flexDirection: 'row', gap: 8, alignSelf: 'center', paddingVertical: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotOn: { width: 24, backgroundColor: colors.gold },
  next: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: { fontFamily: fonts.sansSemi, fontSize: 16, color: '#2b2205' },
})
