// Phone-first hole-by-hole entry: one hole at a time, a big − / + per
// player, swipe (or the arrows) to change holes. Writes straight to the store.
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { Round } from '@shared/types'
import { useSwipe } from '@/components/HoleEntrySheet'
import { cellColor, tick, type ScoreRow } from '@/components/ScoreParts'
import { Card, Hint, T } from '@/components/ui'
import { colors, fonts } from '@/theme'

/** first hole where someone still has no score (0 if all done) */
function firstOpenHole(round: Round, rows: ScoreRow[]) {
  for (let h = 0; h < 18; h++) {
    if (rows.some((r) => round.scores[r.id]?.[h] == null)) return h
  }
  return 0
}

export default function HoleStepper({
  round,
  rows,
  yards,
  commitScore,
}: {
  round: Round
  rows: ScoreRow[]
  yards: number[] | null
  commitScore: (rowId: string, hole: number, value: number | null) => void
}) {
  const [hole, setHole] = useState(() => firstOpenHole(round, rows))
  const par = round.holePars[hole]

  const go = (d: number) => {
    const n = Math.min(17, Math.max(0, hole + d))
    if (n !== hole) {
      tick()
      setHole(n)
    }
  }
  const pan = useSwipe(hole < 17 ? () => go(1) : null, hole > 0 ? () => go(-1) : null)

  function bump(rowId: string, d: number) {
    const cur = round.scores[rowId]?.[hole] ?? null
    // first tap lands on par (or a birdie when tapping −)
    const next = cur == null ? (d > 0 ? par : par - 1) : Math.min(15, Math.max(1, cur + d))
    if (next === cur) return
    tick()
    commitScore(rowId, hole, next)
  }

  return (
    <Card style={{ paddingHorizontal: 12, paddingTop: 10 }}>
      <View {...pan}>
        <View style={hs.nav}>
          <NavBtn label="‹" disabled={hole === 0} onPress={() => go(-1)} a11y="Previous hole" />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={hs.holeNum}>Hole {hole + 1}</Text>
            <T style={hs.holeMeta}>
              Par {par}
              {yards ? ` · ${yards[hole]} yds` : ''}
            </T>
          </View>
          <NavBtn label="›" disabled={hole === 17} onPress={() => go(1)} a11y="Next hole" />
        </View>

        {rows.map((r, i) => {
          const val = round.scores[r.id]?.[hole] ?? null
          const rel = val == null ? null : val - par
          return (
            <View key={r.id} style={[hs.row, i === rows.length - 1 && { borderBottomWidth: 0 }]}>
              <Pressable
                style={{ flex: 1 }}
                onLongPress={() => {
                  if (val == null) return
                  tick()
                  commitScore(r.id, hole, null)
                }}
                accessibilityHint="Long-press to clear this score"
              >
                <Text style={hs.name} numberOfLines={1}>
                  <Text style={{ color: r.color }}>● </Text>
                  {r.name}
                </Text>
              </Pressable>
              <StepBtn label="−" onPress={() => bump(r.id, -1)} a11y={`Decrease ${r.name}'s score`} />
              <View style={[hs.val, { backgroundColor: cellColor(val, par) ?? colors.cream }]}>
                <Text style={hs.valNum}>{val ?? '–'}</Text>
                <Text style={hs.valRel}>{rel == null ? ' ' : rel === 0 ? 'E' : rel > 0 ? `+${rel}` : rel}</Text>
              </View>
              <StepBtn label="+" onPress={() => bump(r.id, 1)} a11y={`Increase ${r.name}'s score`} />
            </View>
          )
        })}
      </View>
      <View style={hs.dots}>
        {round.holePars.map((_, h) => {
          const done = rows.every((r) => round.scores[r.id]?.[h] != null)
          return (
            <Pressable key={h} onPress={() => (tick(), setHole(h))} hitSlop={{ top: 8, bottom: 8 }} accessibilityLabel={`Hole ${h + 1}`}>
              <View style={[hs.dot, done && { backgroundColor: colors.green600 }, h === hole && hs.dotOn]} />
            </Pressable>
          )
        })}
      </View>
      <Hint style={{ textAlign: 'center', marginTop: 6 }}>Swipe or tap the arrows to change holes · long-press a name to clear</Hint>
    </Card>
  )
}

function StepBtn({ label, onPress, a11y }: { label: string; onPress: () => void; a11y: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [hs.step, pressed && { backgroundColor: colors.green100, transform: [{ scale: 0.95 }] }]}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      hitSlop={6}
    >
      <Text style={hs.stepText}>{label}</Text>
    </Pressable>
  )
}

function NavBtn({ label, onPress, disabled, a11y }: { label: string; onPress: () => void; disabled: boolean; a11y: string }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [hs.navBtn, disabled && { opacity: 0.3 }, pressed && { backgroundColor: colors.green100 }]}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      hitSlop={8}
    >
      <Text style={hs.navText}>{label}</Text>
    </Pressable>
  )
}

const hs = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
  navText: { fontSize: 30, lineHeight: 34, color: colors.green700, fontFamily: fonts.sansSemi },
  holeNum: { fontFamily: fonts.serifBold, fontSize: 26, color: colors.green900 },
  holeMeta: { fontSize: 13, color: colors.muted, fontFamily: fonts.sansSemi },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  name: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink },
  step: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: colors.green600,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 28, lineHeight: 32, fontFamily: fonts.sansBold, color: colors.green700 },
  val: { width: 54, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  valNum: { fontSize: 24, lineHeight: 28, fontFamily: fonts.sansBold, color: colors.green900 },
  valRel: { fontSize: 11, lineHeight: 13, fontFamily: fonts.sansBold, color: colors.muted },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.line },
  dotOn: { transform: [{ scale: 1.5 }], backgroundColor: colors.gold },
})
