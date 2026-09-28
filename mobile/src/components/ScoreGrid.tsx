// Native port of the web HoleTable: one 18-hole card (1–9, OUT, 10–18, IN,
// TOT) that scrolls horizontally with the player-name column pinned left.
// 'quick' = type straight into cells (auto-advances to the next player),
// 'detailed' = tap a cell to open the hole entry sheet.
import { useRef } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { sum } from '@shared/games'
import type { Round } from '@shared/types'
import { cellColor, thud, type ScoreRow } from '@/components/ScoreParts'
import { colors, fonts } from '@/theme'

const NAME_W = 104
const CELL_W = 40
const TOTAL_W = 46
const HEAD_H = 34
const YARD_H = 26
const PAR_H = 30
const ROW_H = 46

type Col = { kind: 'hole'; hole: number } | { kind: 'out' } | { kind: 'in' } | { kind: 'tot' }

const COLS: Col[] = [
  ...Array.from({ length: 9 }, (_, h) => ({ kind: 'hole' as const, hole: h })),
  { kind: 'out' },
  ...Array.from({ length: 9 }, (_, h) => ({ kind: 'hole' as const, hole: h + 9 })),
  { kind: 'in' },
  { kind: 'tot' },
]
const FRONT = [0, 1, 2, 3, 4, 5, 6, 7, 8]
const BACK = [9, 10, 11, 12, 13, 14, 15, 16, 17]
const colW = (c: Col) => (c.kind === 'hole' ? CELL_W : TOTAL_W)
/** x offset of a hole's column inside the scroller */
const holeX = (hole: number) => hole * CELL_W + (hole >= 9 ? TOTAL_W : 0)

export default function ScoreGrid({
  round,
  rows,
  yards,
  mode,
  commitScore,
  onCellTap,
}: {
  round: Round
  rows: ScoreRow[]
  yards: number[] | null
  mode: 'quick' | 'detailed'
  commitScore: (rowId: string, hole: number, value: number | null) => void
  onCellTap: (rowId: string, hole: number) => void
}) {
  const inputs = useRef(new Map<string, TextInput | null>())
  const scroller = useRef<ScrollView>(null)

  // move focus down to the next player's same hole; wrap to the first
  // player of the next hole after the last player
  function focusNext(rowIdx: number, hole: number) {
    let key: string | null = null
    let nextHole = hole
    if (rowIdx + 1 < rows.length) key = `${rowIdx + 1}-${hole}`
    else if (hole < 17) {
      nextHole = hole + 1
      key = `0-${nextHole}`
    }
    if (!key) return
    if (nextHole !== hole) scroller.current?.scrollTo({ x: Math.max(0, holeX(nextHole) - CELL_W * 3), animated: true })
    inputs.current.get(key)?.focus()
  }

  function handleInput(rowIdx: number, hole: number, raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 2)
    if (!digits) {
      commitScore(rows[rowIdx].id, hole, null)
      return
    }
    let n = Number(digits)
    if (n === 0) return // wait for a valid digit
    n = Math.min(15, n)
    commitScore(rows[rowIdx].id, hole, n)
    thud()
    // advance once the entry can't grow into a bigger score (2 digits, or a
    // single 2–9 which can't be the start of a 10–15)
    if (digits.length === 2 || n >= 2) focusNext(rowIdx, hole)
  }

  const nine = (arr: (number | null)[], holes: number[]) => sum(holes.map((h) => arr[h] ?? null))
  const totalLabel = (c: Col) => (c.kind === 'out' ? 'OUT' : c.kind === 'in' ? 'IN' : 'TOT')

  return (
    <View style={g.wrap}>
      {/* pinned name column */}
      <View style={{ width: NAME_W }}>
        <View style={[g.nameCell, g.head, { height: HEAD_H }]}>
          <Text style={g.headText}>Hole</Text>
        </View>
        {yards && (
          <View style={[g.nameCell, g.yardBg, { height: YARD_H }]}>
            <Text style={[g.yardText, { fontSize: 12 }]}>Yards</Text>
          </View>
        )}
        <View style={[g.nameCell, g.parBg, { height: PAR_H }]}>
          <Text style={g.parText}>Par</Text>
        </View>
        {rows.map((m) => (
          <View key={m.id} style={[g.nameCell, { height: ROW_H, backgroundColor: '#fff' }]}>
            <Text style={g.nameText} numberOfLines={1}>
              <Text style={{ color: m.color }}>● </Text>
              {m.name}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView
        ref={scroller}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1 }}
      >
        <View>
          <View style={{ flexDirection: 'row', height: HEAD_H }}>
            {COLS.map((c, i) => (
              <View key={i} style={[g.cell, g.head, { width: colW(c) }]}>
                <Text style={g.headText}>{c.kind === 'hole' ? c.hole + 1 : totalLabel(c)}</Text>
              </View>
            ))}
          </View>
          {yards && (
            <View style={{ flexDirection: 'row', height: YARD_H }}>
              {COLS.map((c, i) => (
                <View key={i} style={[g.cell, g.yardBg, { width: colW(c) }]}>
                  <Text style={g.yardText}>
                    {c.kind === 'hole'
                      ? yards[c.hole]
                      : c.kind === 'out'
                        ? nine(yards, FRONT)
                        : c.kind === 'in'
                          ? nine(yards, BACK)
                          : sum(yards)}
                  </Text>
                </View>
              ))}
            </View>
          )}
          <View style={{ flexDirection: 'row', height: PAR_H }}>
            {COLS.map((c, i) => (
              <View key={i} style={[g.cell, g.parBg, { width: colW(c) }]}>
                <Text style={g.parText}>
                  {c.kind === 'hole'
                    ? round.holePars[c.hole]
                    : c.kind === 'out'
                      ? nine(round.holePars, FRONT)
                      : c.kind === 'in'
                        ? nine(round.holePars, BACK)
                        : sum(round.holePars)}
                </Text>
              </View>
            ))}
          </View>
          {rows.map((m, rowIdx) => {
            const scores = round.scores[m.id] ?? Array(18).fill(null)
            const stats = round.stats?.[m.id] ?? []
            return (
              <View key={m.id} style={{ flexDirection: 'row', height: ROW_H }}>
                {COLS.map((c, i) => {
                  if (c.kind !== 'hole') {
                    const v = c.kind === 'out' ? nine(scores, FRONT) : c.kind === 'in' ? nine(scores, BACK) : sum(scores)
                    return (
                      <View key={i} style={[g.cell, g.totalCell, { width: TOTAL_W }]}>
                        <Text style={g.totalText}>{v || ''}</Text>
                      </View>
                    )
                  }
                  const h = c.hole
                  const val = scores[h] ?? null
                  const bg = cellColor(val, round.holePars[h])
                  return (
                    <View key={i} style={[g.cell, { width: CELL_W }, bg ? { backgroundColor: bg } : null]}>
                      {mode === 'quick' ? (
                        <TextInput
                          ref={(r) => {
                            inputs.current.set(`${rowIdx}-${h}`, r)
                          }}
                          style={g.input}
                          keyboardType="number-pad"
                          returnKeyType="next"
                          submitBehavior="submit"
                          maxLength={2}
                          selectTextOnFocus
                          value={val == null ? '' : String(val)}
                          onChangeText={(t) => handleInput(rowIdx, h, t)}
                          onSubmitEditing={() => focusNext(rowIdx, h)}
                          accessibilityLabel={`${m.name}, hole ${h + 1}`}
                        />
                      ) : (
                        <Pressable
                          style={({ pressed }) => [g.tapCell, pressed && { backgroundColor: 'rgba(0,0,0,0.05)' }]}
                          onPress={() => onCellTap(m.id, h)}
                          accessibilityRole="button"
                          accessibilityLabel={`${m.name}, hole ${h + 1}${val != null ? `, ${val}` : ''}`}
                        >
                          <Text style={g.scoreText}>{val ?? ''}</Text>
                          {stats[h]?.putts != null && <View style={g.puttDot} />}
                        </Pressable>
                      )}
                    </View>
                  )
                })}
              </View>
            )
          })}
        </View>
      </ScrollView>
    </View>
  )
}

const g = StyleSheet.create({
  wrap: { flexDirection: 'row' },
  cell: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameCell: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  head: { backgroundColor: colors.green900, borderColor: colors.green900 },
  headText: { color: '#fff', fontFamily: fonts.sansBold, fontSize: 13 },
  yardBg: { backgroundColor: '#fbfaf4' },
  yardText: { color: colors.muted, fontFamily: fonts.sansSemi, fontSize: 11 },
  parBg: { backgroundColor: colors.green100 },
  parText: { color: colors.green700, fontFamily: fonts.sansBold, fontSize: 13 },
  nameText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.ink },
  totalCell: { backgroundColor: '#fbfaf4' },
  totalText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink },
  input: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontFamily: fonts.sansSemi,
    fontSize: 16,
    color: colors.ink,
    padding: 0,
  },
  tapCell: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  scoreText: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.ink },
  puttDot: {
    position: 'absolute',
    bottom: 5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.green600,
    opacity: 0.6,
  },
})
