import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Circle, ClipPath, Defs, G, LinearGradient as SvgGradient, Path, Rect, Stop } from 'react-native-svg'
import { RYDER_FORMATS } from '@shared/ryder'
import {
  RC_FEATURES,
  RC_FINAL_A,
  RC_FINAL_B,
  RC_SAMPLE_SESSIONS,
  RC_STEPS,
  fmtPts,
} from '@shared/ryderLanding'
import { Button, Card, SectionTitle, Serif, T } from '@/components/ui'
import { useLightStatusBar } from '@/lib/useLightStatusBar'
import { useRyderCheer } from '@/lib/sound'
import { colors, fonts } from '@/theme'

const BLUE = '#1d5fb0'
const GOLD = '#c6952a'
const CONFETTI = Array.from({ length: 26 }, (_, i) => ({
  i,
  x: (Math.random() - 0.5) * 360,
  y: -Math.random() * 260 - 20,
  r: (Math.random() - 0.5) * 900,
}))

// Timeline (ms): teams clash → trophy rises → titles → score counts up → confetti.
const T_CLASH = 650
const T_TROPHY = 950
const T_COUNT = 1900
const COUNT_MS = 1600

export default function RyderTab() {
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const reduce = useReducedMotion()
  const { play, muted, setMuted } = useRyderCheer()
  useLightStatusBar()

  const [a, setA] = useState(RC_FINAL_A)
  const [b, setB] = useState(RC_FINAL_B)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const sides = useSharedValue(1) // 0 = offscreen, 1 = met in the middle
  const flash = useSharedValue(0)
  const trophy = useSharedValue(1)
  const shine = useSharedValue(1)
  const titles = useSharedValue(1)
  const board = useSharedValue(1)
  const pop = useSharedValue(1)
  const burst = useSharedValue(0)

  const run = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    play()
    if (reduce) return

    sides.set(0)
    flash.set(0)
    trophy.set(0)
    shine.set(0)
    titles.set(0)
    board.set(0)
    burst.set(0)
    setA(0)
    setB(0)

    sides.set(withTiming(1, { duration: 700, easing: Easing.out(Easing.exp) }))
    flash.set(withDelay(T_CLASH, withSequence(withTiming(1, { duration: 110 }), withTiming(0, { duration: 500 }))))
    trophy.set(withDelay(T_TROPHY, withSpring(1, { damping: 11, stiffness: 120 })))
    shine.set(withDelay(T_TROPHY + 450, withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) })))
    titles.set(withDelay(T_TROPHY + 100, withTiming(1, { duration: 600 })))
    board.set(withDelay(T_COUNT - 400, withTiming(1, { duration: 450 })))

    const later = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms))
    later(T_CLASH, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy))
    // tick the score up in half points, alternating sides like sessions coming in
    const steps = (RC_FINAL_A + RC_FINAL_B) * 2
    for (let k = 1; k <= steps; k++) {
      later(T_COUNT + (COUNT_MS * k) / steps, () => {
        const done = k / steps
        setA(Math.round(RC_FINAL_A * done * 2) / 2)
        setB(Math.round(RC_FINAL_B * done * 2) / 2)
        if (k % 4 === 0) Haptics.selectionAsync()
      })
    }
    later(T_COUNT + COUNT_MS + 50, () => {
      pop.set(withSequence(withTiming(1.18, { duration: 160 }), withTiming(1, { duration: 200 })))
      burst.set(withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) }))
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    })
  }, [reduce, play, sides, flash, trophy, shine, titles, board, pop, burst])

  // replay the whole intro (and the cheer) every time the tab is selected
  useFocusEffect(
    useCallback(() => {
      run()
      return () => timers.current.forEach(clearTimeout)
    }, [run]),
  )
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const sideA = useAnimatedStyle(() => ({ transform: [{ translateX: (sides.value - 1) * width * 0.7 }] }))
  const sideB = useAnimatedStyle(() => ({ transform: [{ translateX: (1 - sides.value) * width * 0.7 }] }))
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value, transform: [{ skewX: '-12deg' }, { scaleY: 0.3 + flash.value * 0.7 }] }))
  const trophyStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, trophy.value * 1.5),
    transform: [{ translateY: (1 - trophy.value) * 140 }, { scale: 0.6 + trophy.value * 0.4 }],
  }))
  const titleStyle = useAnimatedStyle(() => ({ opacity: titles.value, transform: [{ translateY: (1 - titles.value) * 24 }] }))
  const boardStyle = useAnimatedStyle(() => ({ opacity: board.value, transform: [{ translateY: (1 - board.value) * 20 }] }))
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }))

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream }} contentContainerStyle={{ paddingBottom: 48 }}>
      <View style={[st.hero, { paddingTop: insets.top + 44 }]}>
        <LinearGradient colors={['#12432f', '#06170f']} style={StyleSheet.absoluteFill} />
        <Animated.View style={[st.side, { left: -width * 0.08 }, sideA]}>
          <LinearGradient colors={[BLUE, '#0d2f5c']} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <Animated.View style={[st.side, { right: -width * 0.08 }, sideB]}>
          <LinearGradient colors={[GOLD, '#6e520c']} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <Animated.View pointerEvents="none" style={[st.flash, { left: width / 2 - 7 }, flashStyle]} />

        <Pressable
          onPress={() => setMuted(!muted)}
          style={[st.mute, { top: insets.top + 8 }]}
          accessibilityLabel={muted ? 'Turn sound on' : 'Turn sound off'}
          hitSlop={8}
        >
          <Text style={{ fontSize: 17 }}>{muted ? '🔇' : '🔊'}</Text>
        </Pressable>

        <Animated.View style={[{ alignItems: 'center' }, titleStyle]}>
          <Text style={st.kicker}>ONLY ON FLAGSTICK FINDER</Text>
          <Text style={st.title}>The Ryder Cup</Text>
          <Text style={st.sub}>Turn your golf trip into a team showdown.</Text>
        </Animated.View>

        <View style={st.trophyWrap}>
          <View style={st.confettiOrigin} pointerEvents="none">
            {CONFETTI.map((c) => (
              <ConfettiPiece key={c.i} burst={burst} {...c} />
            ))}
          </View>
          <Animated.View style={trophyStyle}>
            <Trophy shine={shine} />
          </Animated.View>
        </View>

        <Animated.View style={[st.board, boardStyle]} accessibilityLabel={`Sample score: Team USA ${fmtPts(RC_FINAL_A)}, Team Europe ${fmtPts(RC_FINAL_B)}`}>
          <Animated.View style={[{ flex: 1 }, popStyle]}>
            <LinearGradient colors={[BLUE, '#14477f']} style={st.team}>
              <Text style={st.teamName}>Team USA</Text>
              <Text style={st.pts}>{fmtPts(a)}</Text>
            </LinearGradient>
          </Animated.View>
          <Text style={st.vs}>vs</Text>
          <LinearGradient colors={[GOLD, '#9c7414']} style={[st.team, { flex: 1 }]}>
            <Text style={st.teamName}>Team Europe</Text>
            <Text style={st.pts}>{fmtPts(b)}</Text>
          </LinearGradient>
        </Animated.View>

        <View style={st.actions}>
          <Button title="Start a Ryder Cup trip →" variant="gold" onPress={() => router.navigate('/explore')} style={{ flexShrink: 1 }} />
          <Pressable onPress={run} style={st.replay} accessibilityRole="button">
            <Text style={st.replayText}>↻ Replay</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ padding: 16 }}>
        <SectionTitle>How it works</SectionTitle>
        <View style={{ gap: 10 }}>
          {RC_STEPS.map(([title, body], i) => (
            <Card key={title} style={{ flexDirection: 'row', gap: 14 }}>
              <View style={st.stepN}>
                <Text style={st.stepNText}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Serif style={{ fontSize: 22 }}>{title}</Serif>
                <T style={st.muted}>{body}</T>
              </View>
            </Card>
          ))}
        </View>

        <SectionTitle>The formats</SectionTitle>
        <View style={{ gap: 10 }}>
          {RYDER_FORMATS.map((f, i) => (
            <Card key={f.name} style={{ borderTopWidth: 4, borderTopColor: [BLUE, colors.gold, colors.green600][i] }}>
              <Text style={st.day}>DAY {i + 1}</Text>
              <Serif style={{ fontSize: 24 }}>{f.name}</Serif>
              <View style={st.tag}>
                <Text style={st.tagText}>{f.tag.toUpperCase()}</Text>
              </View>
              <T style={st.muted}>{f.how}</T>
            </Card>
          ))}
        </View>

        <SectionTitle>What the trip looks like</SectionTitle>
        <Card style={{ paddingVertical: 4 }}>
          {RC_SAMPLE_SESSIONS.map((s, i) => (
            <View key={s.day} style={[st.session, i === RC_SAMPLE_SESSIONS.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={st.sessionDay}>{s.day}</Text>
              <View style={{ flex: 1 }}>
                <T style={{ fontFamily: fonts.sansSemi, fontSize: 14 }}>{s.format}</T>
                <T style={[st.muted, { fontSize: 12 }]}>{s.course}</T>
              </View>
              <View style={[st.res, s.winner === 'A' ? { backgroundColor: BLUE } : s.winner === 'B' ? { backgroundColor: GOLD } : null]}>
                <Text style={[st.resText, s.winner !== 'tie' && { color: '#fff' }]}>{s.result}</Text>
              </View>
            </View>
          ))}
        </Card>

        <View style={{ gap: 10, marginTop: 14 }}>
          {RC_FEATURES.map(([icon, title, body]) => (
            <Card key={title} style={{ flexDirection: 'row', gap: 14 }}>
              <Text style={{ fontSize: 26 }}>{icon}</Text>
              <View style={{ flex: 1 }}>
                <Serif style={{ fontSize: 22 }}>{title}</Serif>
                <T style={st.muted}>{body}</T>
              </View>
            </Card>
          ))}
        </View>

        <LinearGradient colors={['#14563c', colors.green900]} style={st.cta}>
          <Serif style={{ color: '#fff', fontSize: 32, textAlign: 'center' }}>Who&apos;s taking the cup home?</Serif>
          <T style={{ color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: 16 }}>
            Pick a trip, invite the crew, and settle it on the course.
          </T>
          <Button title="Browse trips →" variant="gold" onPress={() => router.navigate('/explore')} />
          <Button
            title="Create your own"
            variant="ghost"
            onPress={() => router.push('/new')}
            style={{ borderColor: 'rgba(255,255,255,0.7)', marginTop: 10 }}
          />
        </LinearGradient>
      </View>
    </ScrollView>
  )
}

function ConfettiPiece({ burst, i, x, y, r }: { burst: SharedValue<number>; i: number; x: number; y: number; r: number }) {
  const style = useAnimatedStyle(() => ({
    opacity: burst.value === 0 || burst.value === 1 ? 0 : 1 - burst.value,
    transform: [{ translateX: x * burst.value }, { translateY: y * burst.value + 120 * burst.value * burst.value }, { rotate: `${r * burst.value}deg` }],
  }))
  return <Animated.View style={[st.confetti, { backgroundColor: i % 2 ? '#3b82d6' : '#e8bd47' }, style]} />
}

function Trophy({ shine }: { shine: SharedValue<number> }) {
  const shineStyle = useAnimatedStyle(() => ({ transform: [{ translateX: -90 + shine.value * 180 }, { skewX: '-20deg' }] }))
  return (
    <View style={{ width: 120, height: 150 }}>
      <Svg width={120} height={150} viewBox="0 0 120 150">
        <Defs>
          <SvgGradient id="gold" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#f6e08a" />
            <Stop offset="0.45" stopColor="#d4af37" />
            <Stop offset="1" stopColor="#9c7414" />
          </SvgGradient>
          <ClipPath id="cup">
            <Path d="M30 18h60v20c0 22-12 38-30 42-18-4-30-20-30-42z" />
          </ClipPath>
        </Defs>
        <Circle cx={60} cy={10} r={7} fill="#fff" stroke="#d4af37" strokeWidth={2} />
        <Path d="M30 22c-14 0-20 8-18 18 2 10 12 16 22 16" fill="none" stroke="url(#gold)" strokeWidth={6} strokeLinecap="round" />
        <Path d="M90 22c14 0 20 8 18 18-2 10-12 16-22 16" fill="none" stroke="url(#gold)" strokeWidth={6} strokeLinecap="round" />
        <Path d="M30 18h60v20c0 22-12 38-30 42-18-4-30-20-30-42z" fill="url(#gold)" />
        <G clipPath="url(#cup)">
          <Rect x={52} y={18} width={6} height={60} fill="rgba(255,255,255,0.35)" />
        </G>
        <Rect x={54} y={80} width={12} height={26} fill="url(#gold)" />
        <Path d="M38 106h44l6 18H32z" fill="url(#gold)" />
        <Rect x={26} y={124} width={68} height={14} rx={3} fill="#0b3d2c" stroke="#d4af37" strokeWidth={2} />
      </Svg>
      {/* moving glint across the bowl */}
      <View style={st.shineClip} pointerEvents="none">
        <Animated.View style={[st.shine, shineStyle]} />
      </View>
    </View>
  )
}

const st = StyleSheet.create({
  hero: { overflow: 'hidden', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 36 },
  side: { position: 'absolute', top: 0, bottom: 0, width: '58%', opacity: 0.4, transform: [{ skewX: '-10deg' }] },
  flash: {
    position: 'absolute',
    top: -40,
    bottom: -40,
    width: 14,
    backgroundColor: '#fff',
    shadowColor: '#fff',
    shadowOpacity: 0.9,
    shadowRadius: 30,
  },
  mute: {
    position: 'absolute',
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  kicker: { fontFamily: fonts.sansSemi, fontSize: 11, letterSpacing: 2.2, color: colors.gold },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: 48,
    lineHeight: 52,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowRadius: 20,
    textShadowOffset: { width: 0, height: 4 },
  },
  sub: { fontFamily: fonts.sans, fontSize: 15, color: 'rgba(255,255,255,0.88)' },
  trophyWrap: { marginTop: 18, marginBottom: 6, alignItems: 'center' },
  confettiOrigin: { position: 'absolute', top: 60, left: 60, width: 0, height: 0 },
  confetti: { position: 'absolute', width: 8, height: 12, borderRadius: 2 },
  shineClip: { position: 'absolute', left: 30, top: 18, width: 60, height: 62, overflow: 'hidden', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  shine: { position: 'absolute', top: -10, left: 22, width: 14, height: 90, backgroundColor: 'rgba(255,255,255,0.5)' },
  board: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', maxWidth: 420, marginTop: 8 },
  team: { borderRadius: 16, paddingVertical: 12, alignItems: 'center' },
  teamName: { fontFamily: fonts.sansBold, fontSize: 12, color: '#fff' },
  pts: { fontFamily: fonts.sansBold, fontSize: 44, lineHeight: 50, color: '#fff', fontVariant: ['tabular-nums'] },
  vs: { fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 22, color: 'rgba(255,255,255,0.7)' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 22 },
  replay: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  replayText: { fontFamily: fonts.sansSemi, color: '#fff', fontSize: 14 },
  stepN: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.green100, alignItems: 'center', justifyContent: 'center' },
  stepNText: { fontFamily: fonts.sansBold, color: colors.green700 },
  muted: { color: colors.muted, fontSize: 14 },
  day: { fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 1, color: colors.muted },
  tag: { alignSelf: 'flex-start', backgroundColor: colors.green100, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 10, marginVertical: 6 },
  tagText: { fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 0.5, color: colors.green700 },
  session: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.hair },
  sessionDay: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.muted, width: 44 },
  res: { borderRadius: 999, paddingVertical: 4, paddingHorizontal: 9, backgroundColor: colors.green100, maxWidth: 130 },
  resText: { fontFamily: fonts.sansBold, fontSize: 11, color: colors.green700, textAlign: 'center' },
  cta: { marginTop: 28, borderRadius: 20, padding: 24 },
})
