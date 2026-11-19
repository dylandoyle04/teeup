// Full-screen "play mode": a distraction-free, one-hole-at-a-time scorer for
// use on the course. Every write goes through the same zustand store actions
// as the Scorecard (setScore / setHoleEntry from @shared/store), so the
// Scorecard, Cup, Home card and share image all stay in sync.
import { router, useLocalSearchParams } from 'expo-router'
import { useKeepAwake } from 'expo-keep-awake'
import { useMemo, useRef, useState, type ComponentProps } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, type ViewInstance } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { yardsForCourseName } from '@shared/coursePars'
import { parPlayed, relLabel, strokeBoard, sum } from '@shared/games'
import { nextHole } from '@shared/ryder'
import { useStore } from '@shared/store'
import type { HoleStat, Member, Round } from '@shared/types'
import { useSwipe } from '@/components/HoleEntrySheet'
import { Results, cellColor, tick, type ScoreRow } from '@/components/ScoreParts'
import { OffscreenCapture, RoundShareCard, ShareButton, roundComplete, roundHasScores, roundRows } from '@/components/ShareCards'
import { shareViewAsImage } from '@/lib/shareImage'
import { useLightStatusBar } from '@/lib/useLightStatusBar'
import { colors, fonts } from '@/theme'

/** Text with Dynamic Type capped — the layout here is fixed-size. */
function Txt({ maxFontSizeMultiplier = 1.35, ...rest }: ComponentProps<typeof Text>) {
  return <Text maxFontSizeMultiplier={maxFontSizeMultiplier} {...rest} />
}

const WHITE_DIM = 'rgba(255,255,255,0.68)'
const WHITE_FAINT = 'rgba(255,255,255,0.12)'
const EMPTY_STAT: HoleStat = { putts: null, fir: null, gir: null }

/** "+1" / "E" / "−1" with a proper minus sign. */
const rel = (n: number) => relLabel(n).replace('-', '−')

/** First hole where any scoring row is still missing a score (= hole count when complete). */
function firstIncompleteHole(round: Round, rows: ScoreRow[]): number {
  const n = round.holePars.length
  for (let h = 0; h < n; h++) {
    if (rows.some((r) => round.scores[r.id]?.[h] == null)) return h
  }
  return n
}

export default function PlayMode() {
  const { tripId = '', roundId = '' } = useLocalSearchParams<{ tripId: string; roundId: string }>()
  useKeepAwake()
  useLightStatusBar()
  const insets = useSafeAreaInsets()
  const trip = useStore((s) => s.getTrip(tripId))
  const allMembers = useStore((s) => s.members)

  // same derivation as the Scorecard (tripMembers() builds a new array per call)
  const members = useMemo<Member[]>(() => {
    if (!trip) return []
    const map = new Map(allMembers.map((m) => [m.id, m]))
    return trip.memberIds.map((id) => map.get(id)).filter((m): m is Member => !!m)
  }, [trip, allMembers])

  const round = trip?.rounds.find((r) => r.id === roundId)

  if (!trip || !round) {
    return (
      <View style={[ps.root, ps.center, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Txt style={ps.emptyTitle}>That round doesn&apos;t exist anymore.</Txt>
        <Pressable onPress={() => router.back()} style={ps.doneBig} accessibilityRole="button" accessibilityLabel="Close">
          <Txt style={ps.doneBigText}>Done</Txt>
        </Pressable>
      </View>
    )
  }

  return <PlayBody key={round.id} tripId={tripId} tripName={trip.name} round={round} members={members} />
}

function PlayBody({ tripId, tripName, round, members }: { tripId: string; tripName: string; round: Round; members: Member[] }) {
  const insets = useSafeAreaInsets()
  const setScore = useStore((s) => s.setScore)
  const setHoleEntry = useStore((s) => s.setHoleEntry)
  const rows = roundRows(round, members)
  const holes = round.holePars.length
  // `holes` (one past the last hole) = the "Round complete" summary panel
  const [hole, setHole] = useState(() => Math.min(nextHole(round), firstIncompleteHole(round, rows)))
  const [board, setBoard] = useState(false)
  const [statsOpen, setStatsOpen] = useState<Record<string, boolean>>({})
  const [sharing, setSharing] = useState(false)
  const shareRef = useRef<ViewInstance>(null)

  const yards = yardsForCourseName(round.courseName)
  const summary = hole >= holes
  const par = summary ? 0 : round.holePars[hole]

  // stroke-play leaderboard over the same rows the scorecard uses
  const strokes = strokeBoard(
    round,
    rows.map((r) => ({ id: r.id, member: r as Member })),
  )
  const leader = strokes[0] && strokes[0].thru > 0 ? strokes[0] : null

  const go = (n: number) => {
    const next = Math.min(holes, Math.max(0, n))
    if (next !== hole) {
      tick()
      setHole(next)
    }
  }
  const pan = useSwipe(hole < holes ? () => go(hole + 1) : null, hole > 0 ? () => go(hole - 1) : null)

  function commit(rowId: string, value: number | null) {
    tick()
    setScore(tripId, round.id, rowId, hole, value)
  }
  function bump(rowId: string, d: number) {
    const cur = round.scores[rowId]?.[hole] ?? null
    // first tap lands on par (or a birdie when tapping −), like HoleStepper
    const next = cur == null ? (d > 0 ? par : par - 1) : Math.min(15, Math.max(1, cur + d))
    if (next === cur) return
    commit(rowId, next)
  }
  function setStat(rowId: string, patch: Partial<HoleStat>) {
    const cur = round.stats?.[rowId]?.[hole] ?? EMPTY_STAT
    const nextStat = { ...cur, ...patch }
    tick()
    setHoleEntry(tripId, round.id, rowId, hole, {
      score: round.scores[rowId]?.[hole] ?? null,
      putts: nextStat.putts,
      fir: par <= 3 ? null : nextStat.fir,
      gir: nextStat.gir,
    })
  }

  async function shareResults() {
    tick()
    setSharing(true)
    try {
      await shareViewAsImage(shareRef, { dialogTitle: `${round.courseName} results` })
    } finally {
      setSharing(false)
    }
  }

  const close = () => {
    tick()
    router.back()
  }

  return (
    <View style={ps.root}>
      {/* top bar */}
      <View style={[ps.topBar, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={close} style={ps.topBtn} hitSlop={8} accessibilityRole="button" accessibilityLabel="Done, close full-screen scoring">
          <Txt style={ps.topBtnText}>✕ Done</Txt>
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center', minWidth: 0 }}>
          <Txt style={ps.course} numberOfLines={1}>
            {round.courseName}
          </Txt>
          <Txt style={ps.game} numberOfLines={1}>
            {round.game}
          </Txt>
        </View>
        <Pressable
          onPress={() => {
            tick()
            setBoard(true)
          }}
          style={[ps.topBtn, ps.topBtnGold]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Show leaderboard"
        >
          <Txt style={[ps.topBtnText, { color: colors.green900 }]}>Leaderboard</Txt>
        </Pressable>
      </View>

      <View style={{ flex: 1 }} {...pan}>
        {summary ? (
          <ScrollView contentContainerStyle={ps.summary}>
            <Txt style={ps.summaryTitle}>{roundComplete(round, rows) ? 'Round complete' : 'End of the round'}</Txt>
            <Txt style={ps.summarySub}>
              {round.courseName} · Par {sum(round.holePars)}
            </Txt>
            <View style={ps.summaryCard}>
              {strokes.map((b, i) => (
                <View key={b.id} style={[ps.summaryRow, i === strokes.length - 1 && { borderBottomWidth: 0 }]}>
                  <Txt style={ps.summaryRank}>{b.thru === 0 ? '–' : i === 0 ? '🏆' : i + 1}</Txt>
                  <View style={[ps.dot, { backgroundColor: b.member.color }]} />
                  <Txt style={ps.summaryName} numberOfLines={1}>
                    {b.member.name}
                  </Txt>
                  {b.thru === 0 ? (
                    <Txt style={ps.summaryThru}>no scores</Txt>
                  ) : (
                    <>
                      {b.thru < holes && <Txt style={ps.summaryThru}>thru {b.thru}</Txt>}
                      <Txt style={ps.summaryTotal}>{b.total}</Txt>
                      <Txt style={ps.summaryRel}>{rel(b.rel)}</Txt>
                    </>
                  )}
                </View>
              ))}
            </View>
            {!roundComplete(round, rows) && (
              <Txt style={ps.summaryNote}>Some holes are still missing scores — tap a dot below to fill them in.</Txt>
            )}
            {roundHasScores(round) && (
              <ShareButton
                title="Share results"
                accessibilityLabel="Share round results as an image"
                loading={sharing}
                onPress={shareResults}
                style={{ marginTop: 18 }}
              />
            )}
            <Pressable onPress={close} style={[ps.doneBig, { marginTop: 12 }]} accessibilityRole="button" accessibilityLabel="Done, close full-screen scoring">
              <Txt style={ps.doneBigText}>Done</Txt>
            </Pressable>
            <Pressable onPress={() => go(holes - 1)} style={ps.backLink} accessibilityRole="button" accessibilityLabel={`Back to hole ${holes}`}>
              <Txt style={ps.backLinkText}>‹ Back to hole {holes}</Txt>
            </Pressable>
          </ScrollView>
        ) : (
          <>
            {/* hole header */}
            <View style={ps.holeHead}>
              <NavBtn label="‹" disabled={hole === 0} onPress={() => go(hole - 1)} a11y={`Previous hole, hole ${hole}`} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Txt style={ps.holeNum} accessibilityRole="header">
                  Hole {hole + 1}
                </Txt>
                <Txt style={ps.holeMeta}>
                  Par {par}
                  {yards?.[hole] ? ` · ${yards[hole]} yds` : ''}
                </Txt>
                <Txt style={ps.leader} numberOfLines={1}>
                  {leader ? `Leader: ${leader.member.name} ${rel(leader.rel)} thru ${leader.thru}` : 'No scores yet'}
                </Txt>
              </View>
              <NavBtn
                label="›"
                disabled={false}
                onPress={() => go(hole + 1)}
                a11y={hole === holes - 1 ? 'Finish round, show summary' : `Next hole, hole ${hole + 2}`}
              />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={ps.rows}>
              {rows.length === 0 && <Txt style={ps.emptyTitle}>Add players to the trip to start scoring.</Txt>}
              {rows.map((r) => {
                const val = round.scores[r.id]?.[hole] ?? null
                const stat = round.stats?.[r.id]?.[hole] ?? EMPTY_STAT
                const hasStat = stat.putts != null || stat.fir != null || stat.gir != null
                const open = !!statsOpen[r.id]
                const sc = round.scores[r.id] ?? []
                const thru = sc.filter((v) => v != null).length
                return (
                  <View key={r.id} style={ps.row}>
                    <View style={ps.rowHead}>
                      <View style={[ps.dot, { backgroundColor: r.color }]} />
                      <Txt style={ps.name} numberOfLines={1}>
                        {r.name}
                      </Txt>
                      {thru > 0 && <Txt style={ps.rowTotal}>{rel(sum(sc) - parPlayed(round, sc))}</Txt>}
                      <Pressable
                        onPress={() => {
                          tick()
                          setStatsOpen((s) => ({ ...s, [r.id]: !open }))
                        }}
                        hitSlop={8}
                        style={[ps.statsToggle, hasStat && { borderColor: colors.gold }]}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: open }}
                        accessibilityLabel={`${open ? 'Hide' : 'Show'} stats for ${r.name}, hole ${hole + 1}`}
                      >
                        <Txt style={[ps.statsToggleText, hasStat && { color: colors.gold }]}>{open ? '− Stats' : hasStat ? 'Stats ✓' : '+ Stats'}</Txt>
                      </Pressable>
                    </View>

                    <View style={ps.stepRow}>
                      <StepBtn label="−" onPress={() => bump(r.id, -1)} a11y={`Remove a stroke for ${r.name}, hole ${hole + 1}`} />
                      <Pressable
                        style={[ps.score, { backgroundColor: cellColor(val, par) ?? WHITE_FAINT }]}
                        onLongPress={() => {
                          if (val != null) commit(r.id, null)
                        }}
                        accessibilityRole="adjustable"
                        accessibilityLabel={`${r.name}, hole ${hole + 1}`}
                        accessibilityValue={{ text: val == null ? 'no score' : `${val}, ${rel(val - par)}` }}
                        accessibilityHint="Long-press to clear this score"
                        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }, { name: 'longpress', label: 'Clear score' }]}
                        onAccessibilityAction={(e) => {
                          if (e.nativeEvent.actionName === 'increment') bump(r.id, 1)
                          else if (e.nativeEvent.actionName === 'decrement') bump(r.id, -1)
                          else if (e.nativeEvent.actionName === 'longpress' && val != null) commit(r.id, null)
                        }}
                      >
                        <Txt maxFontSizeMultiplier={1} style={[ps.scoreNum, val == null && { color: WHITE_DIM }]}>
                          {val ?? '–'}
                        </Txt>
                        <Txt maxFontSizeMultiplier={1.2} style={[ps.scoreRel, val == null && { color: WHITE_DIM }]}>
                          {val == null ? 'tap +' : rel(val - par)}
                        </Txt>
                      </Pressable>
                      <StepBtn label="+" onPress={() => bump(r.id, 1)} a11y={`Add a stroke for ${r.name}, hole ${hole + 1}`} />
                    </View>

                    {open && (
                      <View style={ps.stats}>
                        <View style={ps.statLine}>
                          <Txt style={ps.statLabel}>Putts</Txt>
                          {[1, 2, 3].map((n) => (
                            <Chip
                              key={n}
                              label={String(n)}
                              on={stat.putts === n}
                              onPress={() => setStat(r.id, { putts: stat.putts === n ? null : n })}
                              a11y={`${n} ${n === 1 ? 'putt' : 'putts'} for ${r.name}, hole ${hole + 1}`}
                            />
                          ))}
                        </View>
                        <View style={ps.statLine}>
                          {par > 3 && (
                            <>
                              <Txt style={ps.statLabel}>FIR</Txt>
                              <Chip
                                label="✓"
                                on={stat.fir === true}
                                onPress={() => setStat(r.id, { fir: stat.fir === true ? null : true })}
                                a11y={`Fairway hit for ${r.name}, hole ${hole + 1}`}
                              />
                              <Chip
                                label="✕"
                                bad
                                on={stat.fir === false}
                                onPress={() => setStat(r.id, { fir: stat.fir === false ? null : false })}
                                a11y={`Fairway missed for ${r.name}, hole ${hole + 1}`}
                              />
                              <View style={{ width: 8 }} />
                            </>
                          )}
                          <Txt style={ps.statLabel}>GIR</Txt>
                          <Chip
                            label="✓"
                            on={stat.gir === true}
                            onPress={() => setStat(r.id, { gir: stat.gir === true ? null : true })}
                            a11y={`Green in regulation for ${r.name}, hole ${hole + 1}`}
                          />
                          <Chip
                            label="✕"
                            bad
                            on={stat.gir === false}
                            onPress={() => setStat(r.id, { gir: stat.gir === false ? null : false })}
                            a11y={`Missed green for ${r.name}, hole ${hole + 1}`}
                          />
                        </View>
                      </View>
                    )}
                  </View>
                )
              })}
              <Txt style={ps.hint}>Swipe or use ‹ › to change holes · long-press a score to clear it</Txt>
            </ScrollView>
          </>
        )}
      </View>

      {/* hole dots */}
      <View style={[ps.dots, { paddingBottom: insets.bottom + 10 }]}>
        {round.holePars.map((_, h) => {
          const done = rows.length > 0 && rows.every((r) => round.scores[r.id]?.[h] != null)
          const some = !done && rows.some((r) => round.scores[r.id]?.[h] != null)
          const on = h === hole
          return (
            <Pressable
              key={h}
              onPress={() => go(h)}
              style={ps.dotHit}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`Hole ${h + 1}${done ? ', scored' : some ? ', partly scored' : ''}`}
            >
              <View style={[ps.holeDot, some && ps.holeDotSome, done && ps.holeDotDone, on && ps.holeDotOn]} />
            </Pressable>
          )
        })}
      </View>

      {/* compact standings sheet — the same <Results> the Scorecard shows */}
      <Modal visible={board} transparent animationType="slide" onRequestClose={() => setBoard(false)}>
        <Pressable style={ps.backdrop} onPress={() => setBoard(false)} accessibilityLabel="Close leaderboard" />
        <View style={[ps.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={ps.grabber} />
          <View style={ps.sheetHead}>
            <Txt style={ps.sheetTitle}>{round.game === 'Stroke Play' ? 'Leaderboard' : `${round.game} standings`}</Txt>
            <Pressable onPress={() => setBoard(false)} hitSlop={12} style={ps.sheetClose} accessibilityRole="button" accessibilityLabel="Close leaderboard">
              <Txt style={{ fontSize: 18, color: colors.muted }}>✕</Txt>
            </Pressable>
          </View>
          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ paddingBottom: 8 }}>
            <Results round={round} members={members} rows={rows} />
          </ScrollView>
        </View>
      </Modal>

      {/* off-screen capture target for "Share results" */}
      {roundHasScores(round) && (
        <OffscreenCapture>
          <RoundShareCard ref={shareRef} tripName={tripName} round={round} members={members} />
        </OffscreenCapture>
      )}
    </View>
  )
}

function StepBtn({ label, onPress, a11y }: { label: string; onPress: () => void; a11y: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [ps.step, pressed && { backgroundColor: colors.green700, transform: [{ scale: 0.94 }] }]}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      hitSlop={4}
    >
      <Txt maxFontSizeMultiplier={1} style={ps.stepText}>
        {label}
      </Txt>
    </Pressable>
  )
}

function NavBtn({ label, onPress, disabled, a11y }: { label: string; onPress: () => void; disabled: boolean; a11y: string }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [ps.navBtn, disabled && { opacity: 0.25 }, pressed && { backgroundColor: colors.green700 }]}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ disabled }}
      hitSlop={8}
    >
      <Txt maxFontSizeMultiplier={1} style={ps.navText}>
        {label}
      </Txt>
    </Pressable>
  )
}

function Chip({ label, on, onPress, a11y, bad }: { label: string; on: boolean; onPress: () => void; a11y: string; bad?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={[ps.chip, on && (bad ? ps.chipBad : ps.chipOn)]}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={a11y}
    >
      <Txt maxFontSizeMultiplier={1.2} style={[ps.chipText, on && { color: bad ? '#fff' : colors.green900 }]}>
        {label}
      </Txt>
    </Pressable>
  )
}

const ps = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.green900 },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 16 },
  emptyTitle: { fontFamily: fonts.sansSemi, fontSize: 16, color: '#fff', textAlign: 'center', marginTop: 24 },

  topBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  topBtn: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBtnGold: { backgroundColor: colors.gold, borderColor: colors.gold },
  topBtnText: { fontFamily: fonts.sansBold, fontSize: 13, color: '#fff' },
  course: { fontFamily: fonts.serifBold, fontSize: 20, lineHeight: 24, color: '#fff' },
  game: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.gold },

  holeHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8, gap: 8 },
  navBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: WHITE_FAINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: { fontSize: 34, lineHeight: 38, color: '#fff', fontFamily: fonts.sansSemi },
  holeNum: { fontFamily: fonts.serifBold, fontSize: 40, lineHeight: 44, color: '#fff' },
  holeMeta: { fontFamily: fonts.sansBold, fontSize: 15, color: '#fff' },
  leader: { fontFamily: fonts.sansSemi, fontSize: 12, color: WHITE_DIM, marginTop: 2 },

  rows: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  row: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 18, padding: 12 },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: '#fff' },
  name: { flex: 1, fontFamily: fonts.sansBold, fontSize: 17, color: '#fff' },
  rowTotal: { fontFamily: fonts.sansBold, fontSize: 14, color: WHITE_DIM, fontVariant: ['tabular-nums'] },
  statsToggle: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minHeight: 28,
    justifyContent: 'center',
  },
  statsToggleText: { fontFamily: fonts.sansSemi, fontSize: 12, color: WHITE_DIM },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  step: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 38, lineHeight: 44, fontFamily: fonts.sansBold, color: '#fff' },
  score: { flex: 1, height: 76, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  scoreNum: { fontSize: 44, lineHeight: 50, fontFamily: fonts.sansBold, color: colors.green900, fontVariant: ['tabular-nums'] },
  scoreRel: { fontSize: 13, lineHeight: 16, fontFamily: fonts.sansBold, color: colors.green700 },

  stats: { marginTop: 10, gap: 8 },
  statLine: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  statLabel: { fontFamily: fonts.sansBold, fontSize: 12, color: WHITE_DIM, minWidth: 38, letterSpacing: 0.3 },
  chip: {
    minWidth: 44,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipBad: { backgroundColor: colors.danger, borderColor: colors.danger },
  chipText: { fontFamily: fonts.sansBold, fontSize: 15, color: '#fff' },
  hint: { fontFamily: fonts.sans, fontSize: 12, color: WHITE_DIM, textAlign: 'center', marginTop: 4 },

  dots: { flexDirection: 'row', paddingHorizontal: 10, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.2)' },
  dotHit: { flex: 1, height: 32, alignItems: 'center', justifyContent: 'center' },
  holeDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.45)' },
  holeDotSome: { backgroundColor: 'rgba(255,255,255,0.35)' },
  holeDotDone: { backgroundColor: '#fff', borderColor: '#fff' },
  holeDotOn: { transform: [{ scale: 1.45 }], borderColor: colors.gold, backgroundColor: colors.gold },

  summary: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  summaryTitle: { fontFamily: fonts.serifBold, fontSize: 36, lineHeight: 40, color: '#fff', textAlign: 'center' },
  summarySub: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.gold, textAlign: 'center', marginTop: 2, marginBottom: 14 },
  summaryCard: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 18, paddingHorizontal: 12 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  summaryRank: { width: 26, textAlign: 'center', fontFamily: fonts.sansBold, fontSize: 14, color: colors.gold },
  summaryName: { flex: 1, fontFamily: fonts.sansSemi, fontSize: 16, color: '#fff' },
  summaryThru: { fontFamily: fonts.sansMedium, fontSize: 12, color: WHITE_DIM },
  summaryTotal: { fontFamily: fonts.sansBold, fontSize: 18, color: '#fff', fontVariant: ['tabular-nums'] },
  summaryRel: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.gold, minWidth: 34, textAlign: 'right' },
  summaryNote: { fontFamily: fonts.sans, fontSize: 13, color: WHITE_DIM, textAlign: 'center', marginTop: 12 },
  doneBig: {
    minHeight: 52,
    alignSelf: 'stretch',
    borderRadius: 999,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  doneBigText: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.green900 },
  backLink: { alignSelf: 'center', padding: 12, marginTop: 4 },
  backLinkText: { fontFamily: fonts.sansSemi, fontSize: 14, color: WHITE_DIM },

  backdrop: { flex: 1, backgroundColor: 'rgba(6, 24, 14, 0.55)' },
  sheet: {
    maxHeight: '75%',
    backgroundColor: colors.cream,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.line, marginBottom: 8 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sheetTitle: { flex: 1, fontFamily: fonts.serifBold, fontSize: 24, color: colors.green900 },
  sheetClose: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
})
