// Native port of ../src/components/HoleEntry.tsx: a bottom sheet to log a
// player's score, putts, fairway and GIR for one hole. Swipe left to
// "Save & next", swipe right to save and go back a hole.
import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useStore } from '@shared/store'
import type { Round } from '@shared/types'
import { tick, thud, type ScoreRow } from '@/components/ScoreParts'
import { Button, T } from '@/components/ui'
import { colors, fonts } from '@/theme'

/** Horizontal swipe → onLeft / onRight (cheap to rebuild each render). */
export function useSwipe(onLeft: (() => void) | null, onRight: (() => void) | null) {
  return PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 14 && Math.abs(g.dx) > Math.abs(g.dy) * 1.6,
    onPanResponderRelease: (_, g) => {
      if (g.dx < -50) onLeft?.()
      else if (g.dx > 50) onRight?.()
    },
  }).panHandlers
}

type Props = {
  tripId: string
  round: Round
  row: ScoreRow
  hole: number
  yards: number | null
  onClose: () => void
  onNext: (() => void) | null
  onPrev: (() => void) | null
}

/** Stays mounted while moving hole to hole; only the body re-keys. */
export default function HoleEntrySheet({ entry }: { entry: Props | null }) {
  return (
    <Modal visible={!!entry} transparent animationType="slide" onRequestClose={entry?.onClose}>
      <Pressable style={sh.backdrop} onPress={entry?.onClose} accessibilityLabel="Close" />
      <KeyboardAvoidingView behavior="padding">
        {entry && <HoleEntryBody key={`${entry.row.id}-${entry.hole}`} {...entry} />}
      </KeyboardAvoidingView>
    </Modal>
  )
}

function HoleEntryBody({
  tripId,
  round,
  row,
  hole,
  yards,
  onClose,
  onNext,
  onPrev,
}: Props) {
  const insets = useSafeAreaInsets()
  const setHoleEntry = useStore((s) => s.setHoleEntry)
  const par = round.holePars[hole]
  const curScore = round.scores[row.id]?.[hole] ?? null
  const curStat = round.stats?.[row.id]?.[hole] ?? { putts: null, fir: null, gir: null }

  const [score, setScore] = useState<number>(curScore ?? par)
  const [putts, setPutts] = useState<number | null>(curStat.putts)
  const [fir, setFir] = useState<boolean | null>(curStat.fir)
  const [gir, setGir] = useState<boolean | null>(curStat.gir)

  function persist() {
    setHoleEntry(tripId, round.id, row.id, hole, { score, putts, fir: par <= 3 ? null : fir, gir })
    thud()
  }
  function save(next: boolean) {
    persist()
    if (next && onNext) onNext()
    else onClose()
  }
  const pan = useSwipe(onNext ? () => save(true) : null, onPrev ? () => (persist(), onPrev()) : null)

  const bump = (d: number) => {
    const n = Math.min(15, Math.max(1, score + d))
    if (n !== score) tick()
    setScore(n)
  }
  const rel = score - par

  return (
        <View style={[sh.sheet, { paddingBottom: 20 + insets.bottom }]} {...pan}>
          <View style={sh.grabber} />
          <View style={sh.head}>
            <Text style={{ fontSize: 15 }} numberOfLines={1}>
              <Text style={{ color: row.color }}>● </Text>
              <Text style={{ fontFamily: fonts.sansBold, color: colors.ink }}>{row.name}</Text>
            </Text>
            <T style={sh.hole}>
              Hole {hole + 1} · Par {par}
              {yards ? ` · ${yards} yds` : ''}
            </T>
            <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close" style={sh.close}>
              <Text style={{ fontSize: 18, color: colors.muted }}>✕</Text>
            </Pressable>
          </View>

          <T style={sh.label}>Score</T>
          <View style={sh.stepper}>
            <Pressable
              style={({ pressed }) => [sh.stepBtn, pressed && { backgroundColor: colors.green100 }]}
              onPress={() => bump(-1)}
              accessibilityLabel="Decrease score"
              hitSlop={8}
            >
              <Text style={sh.stepBtnText}>−</Text>
            </Pressable>
            <View style={sh.stepVal}>
              <Text style={sh.stepNum}>{score}</Text>
              <Text style={sh.stepRel}>{rel === 0 ? 'E' : rel > 0 ? `+${rel}` : rel}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [sh.stepBtn, pressed && { backgroundColor: colors.green100 }]}
              onPress={() => bump(1)}
              accessibilityLabel="Increase score"
              hitSlop={8}
            >
              <Text style={sh.stepBtnText}>+</Text>
            </Pressable>
          </View>

          <T style={sh.label}>Putts</T>
          <View style={sh.chipRow}>
            {[1, 2, 3].map((n) => (
              <Chip
                key={n}
                label={String(n)}
                on={putts === n}
                onPress={() => {
                  tick()
                  setPutts(n)
                }}
              />
            ))}
            <TextInput
              style={sh.chipInput}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="#"
              placeholderTextColor="#9aa59d"
              value={putts != null && putts > 3 ? String(putts) : ''}
              onChangeText={(t) => setPutts(t === '' ? null : Math.min(10, Number(t.replace(/\D/g, '')) || 0))}
            />
          </View>

          {par > 3 && (
            <>
              <T style={sh.label}>Fairway hit</T>
              <View style={sh.chipRow}>
                <Chip
                  flex
                  label="✓ Hit"
                  on={fir === true}
                  tone="good"
                  onPress={() => {
                    tick()
                    setFir(fir === true ? null : true)
                  }}
                />
                <Chip
                  flex
                  label="✕ Missed"
                  on={fir === false}
                  tone="bad"
                  onPress={() => {
                    tick()
                    setFir(fir === false ? null : false)
                  }}
                />
              </View>
            </>
          )}

          <T style={sh.label}>Green in regulation</T>
          <View style={sh.chipRow}>
            <Chip
              flex
              label="✓ Yes"
              on={gir === true}
              tone="good"
              onPress={() => {
                tick()
                setGir(gir === true ? null : true)
              }}
            />
            <Chip
              flex
              label="✕ No"
              on={gir === false}
              tone="bad"
              onPress={() => {
                tick()
                setGir(gir === false ? null : false)
              }}
            />
          </View>

          <View style={sh.actions}>
            <Button title="Save" variant="ghost" onPress={() => save(false)} style={{ minWidth: 96 }} />
            {onNext && <Button title="Save & next →" variant="gold" onPress={() => save(true)} style={{ flex: 1 }} />}
          </View>
        </View>
  )
}

function Chip({
  label,
  on,
  onPress,
  tone,
  flex,
}: {
  label: string
  on: boolean
  onPress: () => void
  tone?: 'good' | 'bad'
  flex?: boolean
}) {
  const onStyle =
    tone === 'good'
      ? { borderColor: colors.green600, backgroundColor: '#e4efe7' }
      : tone === 'bad'
        ? { borderColor: colors.danger, backgroundColor: '#f7e7e3' }
        : { borderColor: colors.green600, backgroundColor: colors.green100 }
  const onText = tone === 'good' ? colors.green600 : tone === 'bad' ? colors.danger : colors.green900
  return (
    <Pressable
      onPress={onPress}
      style={[sh.chip, flex && { flex: 1 }, on && onStyle]}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
    >
      <Text style={[sh.chipText, on && { color: onText }]}>{label}</Text>
    </Pressable>
  )
}

const sh = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(6, 24, 14, 0.55)' },
  sheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingHorizontal: 18,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.line, marginBottom: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  hole: { flex: 1, color: colors.muted, fontSize: 13, fontFamily: fonts.sansBold },
  close: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  label: {
    fontSize: 12,
    fontFamily: fonts.sansBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.muted,
    marginTop: 14,
    marginBottom: 8,
    marginHorizontal: 2,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  stepBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: colors.green600,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 32, lineHeight: 36, fontFamily: fonts.sansBold, color: colors.green700 },
  stepVal: { minWidth: 76, alignItems: 'center' },
  stepNum: { fontSize: 44, lineHeight: 50, fontFamily: fonts.sansBold, color: colors.green900 },
  stepRel: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.muted },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    minWidth: 52,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  chipText: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },
  chipInput: {
    width: 60,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    textAlign: 'center',
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: colors.ink,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 22 },
})
