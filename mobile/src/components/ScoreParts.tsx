// Native ports of the non-grid pieces of ../src/pages/Scorecard.tsx:
// leaderboards for every game, trip standings, round stats, team setup,
// the Wolf call panel, plus a bottom-sheet picker that stands in for <select>.
import * as Haptics from 'expo-haptics'
import type { ReactNode } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  computeBestBall,
  computeHighLow,
  computeSkins,
  computeStableford,
  computeWolf,
  parPlayed,
  relLabel,
  strokeBoard,
  sum,
  wolfForHole,
} from '@shared/games'
import { useStore } from '@shared/store'
import type { Member, Round, WolfMode } from '@shared/types'
import { Avatar, Card, Hint, SectionTitle, T } from '@/components/ui'
import { colors, fonts } from '@/theme'

/** A scorecard row: a player, or a team when playing Scramble. */
export type ScoreRow = { id: string; name: string; color: string }

export const TEAM_COLORS = ['#1b6b46', '#b8941f']

/** Cell background for a score relative to par (web .cell-* classes). */
export function cellColor(strokes: number | null | undefined, par: number): string | undefined {
  if (strokes == null) return undefined
  const rel = strokes - par
  if (rel <= -2) return '#f6ddee' // eagle
  if (rel === -1) return '#fdeccd' // birdie
  if (rel === 0) return '#fff' // par
  if (rel === 1) return '#eef1ec' // bogey
  return '#e7eaea' // double+
}

/** Light haptic tick for score changes (never throws). */
export function tick() {
  Haptics.selectionAsync().catch(() => {})
}
export function thud() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
}

// ---------- Picker sheet (replaces <select>) ----------

export function OptionSheet<V extends string>({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean
  title: string
  options: { value: V; label: string }[]
  value: V
  onSelect: (v: V) => void
  onClose: () => void
}) {
  const insets = useSafeAreaInsets()
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={st.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[st.sheet, { paddingBottom: 16 + insets.bottom }]}>
        <T style={st.sheetTitle}>{title}</T>
        <ScrollView style={{ maxHeight: 420 }}>
          {options.map((o) => {
            const on = o.value === value
            return (
              <Pressable
                key={o.value}
                onPress={() => {
                  tick()
                  onSelect(o.value)
                  onClose()
                }}
                style={({ pressed }) => [st.option, pressed && { backgroundColor: colors.green100 }]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <T style={[st.optionText, on && { color: colors.green900, fontFamily: fonts.sansBold }]}>{o.label}</T>
                {on ? <T style={{ color: colors.green600, fontFamily: fonts.sansBold }}>✓</T> : null}
              </Pressable>
            )
          })}
        </ScrollView>
      </View>
    </Modal>
  )
}

/** A tappable box that looks like the web's <select>. */
export function SelectBox({ label, onPress, compact }: { label: string; onPress: () => void; compact?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [st.select, compact && st.selectCompact, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
    >
      <T style={[st.selectText, compact && { fontSize: 13 }]} numberOfLines={1}>
        {label}
      </T>
      <T style={st.caret}>▾</T>
    </Pressable>
  )
}

// ---------- Leaderboard rows ----------

function LbRow({
  first,
  last,
  rank,
  member,
  children,
}: {
  first: boolean
  last: boolean
  rank: ReactNode
  member: Member
  children: ReactNode
}) {
  return (
    <View style={[st.lbRow, last && { borderBottomWidth: 0 }]}>
      <Text style={[st.lbRank, first && { color: colors.goldDark }]}>{rank}</Text>
      <Avatar member={member} size={28} />
      <T style={st.lbName} numberOfLines={1}>
        {member.name}
      </T>
      {children}
    </View>
  )
}

function EnterPrompt({ label }: { label?: string }) {
  return (
    <Card>
      <T style={{ color: colors.muted }}>{label ?? 'Enter scores below to see the standings.'}</T>
    </Card>
  )
}

function TeamDuel({
  aName,
  bName,
  aPts,
  bPts,
  aSub,
  bSub,
  vs,
  hint,
}: {
  aName: string
  bName: string
  aPts: number
  bPts: number
  aSub?: string
  bSub?: string
  vs: string
  hint: string
}) {
  const leader = aPts === bPts ? null : aPts > bPts ? 'A' : 'B'
  const team = (name: string, pts: number, sub: string | undefined, win: boolean) => (
    <View style={[st.hlTeam, win && st.hlWin]}>
      <T style={st.hlName} numberOfLines={1}>
        {name}
      </T>
      <Text style={st.hlPts}>{pts}</Text>
      {sub != null ? <T style={[st.hlName, { opacity: 0.7, fontFamily: fonts.sansSemi }]}>{sub}</T> : null}
    </View>
  )
  return (
    <Card>
      <View style={st.hlScore}>
        {team(aName, aPts, aSub, leader === 'A')}
        <T style={st.hlVs}>{vs}</T>
        {team(bName, bPts, bSub, leader === 'B')}
      </View>
      <Hint style={{ marginTop: 10, textAlign: 'center' }}>{hint}</Hint>
    </Card>
  )
}

export function Results({ round, members, rows }: { round: Round; members: Member[]; rows: ScoreRow[] }) {
  const memberIds = members.map((m) => m.id)
  const byId = new Map(members.map((m) => [m.id, m]))

  // Best Ball (Four-Ball)
  if (round.game === 'Best Ball') {
    const bb = computeBestBall(round)
    if (!bb) return <EnterPrompt label="Set up two teams to start Best Ball scoring." />
    return (
      <TeamDuel
        aName={bb.A.name}
        bName={bb.B.name}
        aPts={bb.aHoles}
        bPts={bb.bHoles}
        aSub={bb.aTotal ? String(bb.aTotal) : '–'}
        bSub={bb.bTotal ? String(bb.bTotal) : '–'}
        vs="HOLES UP"
        hint={`Each hole goes to the team with the better (lower) single score. Big number = holes won; small number = team's best-ball total (thru ${bb.thru}).`}
      />
    )
  }

  // High-Low
  if (round.game === 'High-Low') {
    const hl = computeHighLow(round)
    if (!hl) return <EnterPrompt label="Set up two teams to start High-Low scoring." />
    return (
      <TeamDuel
        aName={hl.A.name}
        bName={hl.B.name}
        aPts={hl.aPts}
        bPts={hl.bPts}
        vs="VS"
        hint="1 pt for the better low ball + 1 pt for the better high ball, each hole."
      />
    )
  }

  // Stableford
  if (round.game === 'Stableford') {
    const board = computeStableford(round, memberIds).filter((b) => byId.has(b.id))
    if (board.every((b) => b.thru === 0)) return <EnterPrompt />
    return (
      <Card style={st.lbCard}>
        {board.map((b, i) => (
          <LbRow
            key={b.id}
            first={i === 0}
            last={i === board.length - 1}
            rank={b.thru === 0 ? '–' : i === 0 ? '🏆' : i + 1}
            member={byId.get(b.id)!}
          >
            <T style={st.lbRel}>thru {b.thru}</T>
            <T style={[st.lbScore, { marginLeft: 10 }]}>{b.points} pts</T>
          </LbRow>
        ))}
      </Card>
    )
  }

  // Skins
  if (round.game === 'Skins') {
    const sk = computeSkins(round, memberIds).rows.filter((s) => byId.has(s.id))
    if (sk.every((s) => s.skins === 0)) return <EnterPrompt label="No skins won yet — enter scores below." />
    return (
      <Card style={st.lbCard}>
        {sk.map((s, i) => (
          <LbRow key={s.id} first={i === 0} last={i === sk.length - 1} rank={i === 0 ? '🏆' : i + 1} member={byId.get(s.id)!}>
            <T style={st.lbScore}>
              {s.skins} {s.skins === 1 ? 'skin' : 'skins'}
            </T>
          </LbRow>
        ))}
      </Card>
    )
  }

  // Wolf
  if (round.game === 'Wolf') {
    const wr = computeWolf(round, memberIds).rows.filter((w) => byId.has(w.id))
    return (
      <Card style={st.lbCard}>
        {wr.map((w, i) => (
          <LbRow key={w.id} first={i === 0} last={false} rank={i === 0 ? '🏆' : i + 1} member={byId.get(w.id)!}>
            <T style={st.lbScore}>{w.points} pts</T>
          </LbRow>
        ))}
        <Hint style={{ marginTop: 8, paddingHorizontal: 4 }}>
          Set the wolf&apos;s call per hole below; winners are scored from strokes.
        </Hint>
      </Card>
    )
  }

  // Stroke Play & Scramble (stroke board over rows)
  const board = strokeBoard(
    round,
    rows.map((r) => ({ id: r.id, member: r as Member })),
  )
  if (board.every((b) => b.thru === 0)) return <EnterPrompt />
  return (
    <Card style={st.lbCard}>
      {board.map((b, i) => (
        <LbRow
          key={b.id}
          first={i === 0}
          last={i === board.length - 1}
          rank={b.thru === 0 ? '–' : i === 0 ? '🏆' : i + 1}
          member={b.member}
        >
          {b.thru === 0 ? (
            <T style={st.lbRel}>not started</T>
          ) : (
            <>
              <T style={st.lbRel}>thru {b.thru}</T>
              <T style={[st.lbScore, { marginLeft: 10 }]}>{b.total}</T>
              <T style={[st.lbRel, { marginLeft: 8, minWidth: 30, textAlign: 'right' }]}>{relLabel(b.rel)}</T>
            </>
          )}
        </LbRow>
      ))}
    </Card>
  )
}

// ---------- Trip standings ----------

export function TripStandings({ rounds, members }: { rounds: Round[]; members: Member[] }) {
  if (rounds.length < 1) return null

  const rows = members
    .map((m) => {
      let total = 0
      let relTotal = 0
      let holesIn = 0
      for (const r of rounds) {
        const scores = r.scores[m.id] ?? Array(18).fill(null)
        total += sum(scores)
        relTotal += sum(scores) - parPlayed(r, scores)
        holesIn += scores.filter((s) => s != null).length
      }
      return { member: m, total, relTotal, holesIn }
    })
    .filter((r) => r.holesIn > 0)
    .sort((a, b) => a.relTotal - b.relTotal)

  if (rows.length === 0) return null

  return (
    <>
      <SectionTitle>Trip Standings</SectionTitle>
      <Card style={st.lbCard}>
        {rows.map((r, i) => (
          <LbRow key={r.member.id} first={i === 0} last={i === rows.length - 1} rank={i === 0 ? '🏆' : i + 1} member={r.member}>
            <T style={st.lbRel}>{r.total} strokes</T>
            <T style={[st.lbScore, { marginLeft: 10, minWidth: 34, textAlign: 'right' }]}>{relLabel(r.relTotal)}</T>
          </LbRow>
        ))}
      </Card>
    </>
  )
}

// ---------- Round stats ----------

export function StatsSummary({ round, rows }: { round: Round; rows: ScoreRow[] }) {
  const data = rows.map((r) => {
    const stats = round.stats?.[r.id] ?? []
    let putts = 0
    let firHit = 0
    let firPoss = 0
    let girHit = 0
    let girPoss = 0
    stats.forEach((s, i) => {
      if (!s) return
      if (s.putts != null) putts += s.putts
      if (round.holePars[i] > 3 && s.fir != null) {
        firPoss++
        if (s.fir) firHit++
      }
      if (s.gir != null) {
        girPoss++
        if (s.gir) girHit++
      }
    })
    return { r, putts, firHit, firPoss, girHit, girPoss }
  })

  if (!data.some((d) => d.putts > 0 || d.firPoss > 0 || d.girPoss > 0)) return null

  return (
    <>
      <SectionTitle>Round stats</SectionTitle>
      <Card style={{ padding: 0 }}>
        <View style={st.statRow}>
          <T style={[st.statHead, st.statName]}>Player</T>
          <T style={[st.statHead, st.statCell]}>Putts</T>
          <T style={[st.statHead, st.statCell]}>FIR</T>
          <T style={[st.statHead, st.statCell]}>GIR</T>
        </View>
        {data.map((d, i) => (
          <View key={d.r.id} style={[st.statRow, i === data.length - 1 && { borderBottomWidth: 0 }]}>
            <T style={[st.statName, { fontFamily: fonts.sansBold, fontSize: 14 }]} numberOfLines={1}>
              <Text style={{ color: d.r.color }}>● </Text>
              {d.r.name}
            </T>
            <T style={st.statCell}>{d.putts || '–'}</T>
            <T style={st.statCell}>{d.firPoss ? `${d.firHit}/${d.firPoss}` : '–'}</T>
            <T style={st.statCell}>{d.girPoss ? `${d.girHit}/${d.girPoss}` : '–'}</T>
          </View>
        ))}
      </Card>
    </>
  )
}

// ---------- Team setup ----------

export function TeamSetup({ tripId, round, members }: { tripId: string; round: Round; members: Member[] }) {
  const setRoundTeams = useStore((s) => s.setRoundTeams)
  const teamOf = (id: string) => round.teams.findIndex((t) => t.memberIds.includes(id))

  function assign(memberId: string, teamIdx: number) {
    tick()
    const teams = round.teams.map((t, i) => ({
      ...t,
      memberIds:
        i === teamIdx ? Array.from(new Set([...t.memberIds, memberId])) : t.memberIds.filter((id) => id !== memberId),
    }))
    setRoundTeams(tripId, round.id, teams)
  }

  return (
    <>
      <SectionTitle>Teams</SectionTitle>
      <Card style={{ paddingVertical: 6 }}>
        {members.map((m, idx) => {
          const ti = teamOf(m.id)
          return (
            <View key={m.id} style={[st.listRow, idx === members.length - 1 && { borderBottomWidth: 0 }]}>
              <Avatar member={m} size={28} />
              <T style={{ flex: 1, fontFamily: fonts.sansBold }} numberOfLines={1}>
                {m.name}
              </T>
              <View style={st.teamToggle}>
                {round.teams.map((t, i) => {
                  const on = ti === i
                  return (
                    <Pressable
                      key={t.id}
                      onPress={() => assign(m.id, i)}
                      style={[st.teamBtn, on && st.teamBtnOn]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      hitSlop={4}
                    >
                      <T style={[st.teamBtnText, on && { color: colors.green900 }]}>{t.name}</T>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          )
        })}
      </Card>
    </>
  )
}

// ---------- Wolf ----------

export function WolfPanel({
  round,
  members,
  onPick,
}: {
  round: Round
  members: Member[]
  /** opens the call picker for a hole */
  onPick: (hole: number) => void
}) {
  const memberIds = members.map((m) => m.id)
  const byId = new Map(members.map((m) => [m.id, m]))
  return (
    <>
      <SectionTitle>Wolf — the call each hole</SectionTitle>
      <Card style={{ paddingVertical: 6 }}>
        {round.holePars.map((_, h) => {
          const wolfId = wolfForHole(memberIds, h)
          const wolf = wolfId ? byId.get(wolfId) : undefined
          const pick = round.wolf[h]
          const label = !pick
            ? '— call —'
            : pick.mode === 'partner'
              ? `Partner: ${byId.get(pick.partnerId ?? '')?.name ?? '?'}`
              : pick.mode === 'lone'
                ? 'Lone Wolf (+2)'
                : 'Blind Wolf (+3)'
          return (
            <View key={h} style={[st.wolfRow, h === round.holePars.length - 1 && { borderBottomWidth: 0 }]}>
              <T style={st.wolfHole}>#{h + 1}</T>
              <T style={st.wolfWho} numberOfLines={1}>
                🐺 {wolf?.name ?? '—'}
              </T>
              <View style={{ maxWidth: '52%' }}>
                <SelectBox compact label={label} onPress={() => onPick(h)} />
              </View>
            </View>
          )
        })}
      </Card>
    </>
  )
}

/** Options + setter for the Wolf call picker on one hole. */
export function useWolfOptions(tripId: string, round: Round, members: Member[], hole: number | null) {
  const setWolfPick = useStore((s) => s.setWolfPick)
  const memberIds = members.map((m) => m.id)
  const byId = new Map(members.map((m) => [m.id, m]))
  if (hole == null) return null
  const wolfId = wolfForHole(memberIds, hole)
  const pick = round.wolf[hole]
  const value = !pick ? '' : pick.mode === 'partner' ? `partner:${pick.partnerId}` : pick.mode
  const options = [
    { value: '', label: '— call —' },
    ...memberIds
      .filter((id) => id !== wolfId)
      .map((id) => ({ value: `partner:${id}`, label: `Partner: ${byId.get(id)?.name}` })),
    { value: 'lone', label: 'Lone Wolf (+2)' },
    { value: 'blind', label: 'Blind Wolf (+3)' },
  ]
  const select = (v: string) => {
    if (!v) return setWolfPick(tripId, round.id, hole, null)
    if (v === 'lone' || v === 'blind') return setWolfPick(tripId, round.id, hole, { mode: v as WolfMode, partnerId: null })
    setWolfPick(tripId, round.id, hole, { mode: 'partner', partnerId: v.split(':')[1] })
  }
  return { value, options, select, title: `Hole ${hole + 1} — ${byId.get(wolfId ?? '')?.name ?? 'Wolf'}'s call` }
}

export const st = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(6, 24, 14, 0.55)' },
  sheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 18,
    paddingHorizontal: 18,
  },
  sheetTitle: { fontFamily: fonts.sansBold, fontSize: 15, marginBottom: 8, color: colors.green900 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    borderRadius: 8,
  },
  optionText: { fontSize: 16 },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  selectCompact: { borderWidth: 1.5, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7 },
  selectText: { flexShrink: 1, fontSize: 16 },
  caret: { color: colors.muted, fontSize: 12, marginLeft: 'auto' },
  lbCard: { paddingVertical: 4, paddingHorizontal: 12 },
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  lbRank: { width: 26, textAlign: 'center', fontFamily: fonts.sansBold, color: colors.muted, fontSize: 15 },
  lbName: { flex: 1, fontFamily: fonts.sansSemi, fontSize: 18, letterSpacing: 0.2 },
  lbScore: { fontFamily: fonts.sansBold, fontVariant: ['tabular-nums'] },
  lbRel: { fontSize: 12, color: colors.muted, fontFamily: fonts.sansSemi },
  hlScore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  hlTeam: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  hlWin: { borderColor: colors.gold, backgroundColor: '#fffdf3' },
  hlName: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.muted },
  hlPts: { fontSize: 34, lineHeight: 42, fontFamily: fonts.sansBold, color: colors.green900, fontVariant: ['tabular-nums'] },
  hlVs: { fontSize: 11, fontFamily: fonts.sansBold, color: colors.muted, textAlign: 'center', maxWidth: 44 },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingHorizontal: 8,
  },
  statHead: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.muted,
    fontFamily: fonts.sansBold,
  },
  statName: { flex: 1.8, paddingVertical: 10, paddingHorizontal: 8 },
  statCell: { flex: 1, textAlign: 'center', paddingVertical: 10, fontSize: 14 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  teamToggle: { flexDirection: 'row', gap: 4, backgroundColor: colors.green100, borderRadius: 9, padding: 3 },
  teamBtn: { paddingVertical: 7, paddingHorizontal: 10, borderRadius: 7 },
  teamBtnOn: { backgroundColor: '#fff', shadowColor: '#0b3d2c', shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  teamBtnText: { fontSize: 12, fontFamily: fonts.sansBold, color: colors.green700 },
  wolfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  wolfHole: { width: 34, fontFamily: fonts.sansBold, color: colors.muted, fontSize: 13 },
  wolfWho: { flex: 1, fontFamily: fonts.sansBold, fontSize: 14 },
})
