// Trip stats: leaders, per-player trip totals and a summary card per round.
// All numbers come from @shared/stats (pure, shared with the website).
import { router, useLocalSearchParams } from 'expo-router'
import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { relLabel, sum } from '@shared/games'
import {
  fmtAvg,
  fmtPct,
  lineHasData,
  playerTotals,
  roundLine,
  scoringEntities,
  tripLeaders,
  type Leader,
  type PlayerTotals,
  type RoundLine,
} from '@shared/stats'
import { useStore } from '@shared/store'
import type { Member, Round } from '@shared/types'
import { TEAM_COLORS } from '@/components/ScoreParts'
import Screen from '@/components/Screen'
import { Button, Card, Hint, PageTitle, SectionTitle, T } from '@/components/ui'
import { colors, fonts } from '@/theme'

/** Fixed-size tiles stay legible up to this text scale. */
const TILE_SCALE = 1.4

const BAR = {
  birdie: '#d4a72c',
  par: colors.green600,
  bogey: '#a9b8ad',
  double: colors.danger,
} as const

type Row = { id: string; name: string; color: string }

function fmtDate(d: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return d || 'No date'
  return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

const signed = (n: number, digits = 1) => {
  const v = Number(n.toFixed(digits))
  return v === 0 ? 'E' : v > 0 ? `+${v.toFixed(digits)}` : v.toFixed(digits)
}

function openScorecard(tripId: string) {
  router.replace({ pathname: '/trip/[tripId]/score', params: { tripId } })
}

export default function Stats() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>()
  const trip = useStore((s) => s.trips.find((t) => t.id === tripId))
  const allMembers = useStore((s) => s.members)

  const members = useMemo(() => {
    if (!trip) return []
    const map = new Map(allMembers.map((m) => [m.id, m]))
    return trip.memberIds.map((id) => map.get(id)).filter((m): m is Member => Boolean(m))
  }, [trip, allMembers])

  const data = useMemo(() => {
    if (!trip) return null
    const memberIds = members.map((m) => m.id)
    const totals = members.map((m) => playerTotals(trip.rounds, m.id))
    const active = totals.filter((t) => t.rounds > 0 || t.puttHoles > 0 || t.firHoles > 0 || t.girHoles > 0)
    // newest first: by date when both have one, otherwise most recently added first
    const rounds = trip.rounds
      .map((r, i) => ({ r, i }))
      .sort((a, b) => (a.r.date && b.r.date && a.r.date !== b.r.date ? (a.r.date < b.r.date ? 1 : -1) : b.i - a.i))
      .map(({ r }) => {
        const lines = scoringEntities(r, memberIds).map((e, ti) => {
          const m = members.find((x) => x.id === e.id)
          const row: Row =
            e.kind === 'team'
              ? { id: e.id, name: e.name ?? 'Team', color: TEAM_COLORS[ti % TEAM_COLORS.length] }
              : { id: e.id, name: m?.name ?? '?', color: m?.color ?? colors.muted }
          return { row, line: roundLine(r, e.id), team: e.kind === 'team' }
        })
        return { round: r, lines: lines.filter((l) => lineHasData(l.line)) }
      })
    const anyData = rounds.some((r) => r.lines.length > 0)
    return { totals: active, leaders: tripLeaders(active), rounds, anyData }
  }, [trip, members])

  if (!trip || !data) return null
  const byId = new Map(members.map((m) => [m.id, m]))

  if (!data.anyData) {
    return (
      <Screen>
        <PageTitle sub="Round summaries, trip leaders and everyone's numbers.">Trip Stats</PageTitle>
        <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
          <Text style={{ fontSize: 40, marginBottom: 8 }} accessibilityElementsHidden importantForAccessibility="no">
            📊
          </Text>
          <T style={{ fontFamily: fonts.sansBold, textAlign: 'center', marginBottom: 4 }}>No scores yet</T>
          <T style={{ textAlign: 'center', color: colors.muted, marginBottom: 16 }}>
            Enter scores (and putts, fairways and greens if you like) on the Scorecard and your stats will show up
            here.
          </T>
          <Button title="Go to the Scorecard" onPress={() => openScorecard(tripId)} />
        </Card>
      </Screen>
    )
  }

  return (
    <Screen>
      <PageTitle sub="Round summaries, trip leaders and everyone's numbers.">Trip Stats</PageTitle>

      {data.leaders.length > 0 ? (
        <>
          <SectionTitle style={{ marginTop: 0 }}>Trip leaders</SectionTitle>
          <View style={st.leaderGrid}>
            {data.leaders.map((l) => (
              <LeaderTile key={l.key} leader={l} byId={byId} totals={data.totals} />
            ))}
          </View>
        </>
      ) : null}

      {data.totals.length > 0 ? (
        <>
          <SectionTitle>Players</SectionTitle>
          {data.totals.map((t) => {
            const m = byId.get(t.id)
            return m ? <PlayerCard key={t.id} member={m} t={t} /> : null
          })}
          <Hint style={{ marginTop: 2 }}>
            Average and best count complete 18-hole rounds only. Percentages use only holes where that stat was entered;
            fairways count par 4s and 5s. Putts / rd is putts per hole × 18. Scramble rounds are team scores, so they
            don&apos;t count toward individual totals.
          </Hint>
        </>
      ) : null}

      <SectionTitle>Round summaries</SectionTitle>
      {data.rounds.map(({ round, lines }) => (
        <RoundCard key={round.id} round={round} lines={lines} onPress={() => openScorecard(tripId)} />
      ))}
    </Screen>
  )
}

function names(ids: string[], byId: Map<string, Member>) {
  return ids.map((id) => byId.get(id)?.name ?? '?').join(' & ')
}

function LeaderTile({
  leader,
  byId,
  totals,
}: {
  leader: Leader
  byId: Map<string, Member>
  totals: PlayerTotals[]
}) {
  const first = totals.find((t) => t.id === leader.ids[0])
  let value: string
  let sub: string | undefined
  switch (leader.key) {
    case 'lowRound':
      value = String(leader.value)
      sub = [first?.bestRound ? relLabel(first.bestRound.toPar) : null, leader.detail].filter(Boolean).join(' · ')
      break
    case 'bestAvg':
      value = fmtAvg(leader.value)
      sub = first?.toParAvg != null ? `${signed(first.toParAvg)} to par` : undefined
      break
    case 'birdies':
      value = String(leader.value)
      sub = 'birdies or better'
      break
    case 'gir':
    case 'fir':
      value = fmtPct(leader.value)
      break
    case 'putts':
      value = fmtAvg(leader.value)
      sub = 'putts per 18'
      break
  }
  const who = names(leader.ids, byId)
  const color = byId.get(leader.ids[0])?.color ?? colors.muted
  return (
    <View
      style={st.leader}
      accessible
      accessibilityLabel={`${leader.label}: ${who}, ${value}${sub ? `, ${sub}` : ''}`}
    >
      <Text style={st.leaderLabel} maxFontSizeMultiplier={TILE_SCALE} numberOfLines={1}>
        {leader.label}
      </Text>
      <Text style={st.leaderValue} maxFontSizeMultiplier={TILE_SCALE} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={st.leaderWho} maxFontSizeMultiplier={TILE_SCALE} numberOfLines={1}>
        <Text style={{ color }}>● </Text>
        {who}
      </Text>
      {sub ? (
        <Text style={st.leaderSub} maxFontSizeMultiplier={TILE_SCALE} numberOfLines={1}>
          {sub}
        </Text>
      ) : null}
    </View>
  )
}

function Tile({ label, value, sub, a11y }: { label: string; value: string; sub?: string; a11y: string }) {
  return (
    <View style={st.tile} accessible accessibilityLabel={a11y}>
      <Text style={st.tileValue} maxFontSizeMultiplier={TILE_SCALE} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {sub ? (
        <Text style={st.tileSub} maxFontSizeMultiplier={TILE_SCALE} numberOfLines={1}>
          {sub}
        </Text>
      ) : null}
      <Text style={st.tileLabel} maxFontSizeMultiplier={TILE_SCALE} numberOfLines={1}>
        {label}
      </Text>
    </View>
  )
}

function PlayerCard({ member, t }: { member: Member; t: PlayerTotals }) {
  const best = t.bestRound
  return (
    <Card style={{ marginBottom: 10, paddingVertical: 12 }}>
      <View style={st.playerHead}>
        <View style={[st.dot, { backgroundColor: member.color }]} />
        <T style={st.playerName} numberOfLines={1}>
          {member.name}
        </T>
        <T style={st.muted}>
          {t.rounds} {t.rounds === 1 ? 'round' : 'rounds'} · {t.holes} holes
        </T>
      </View>
      <View style={st.tiles}>
        <Tile
          label="Avg"
          value={fmtAvg(t.scoringAvg)}
          sub={t.toParAvg != null ? signed(t.toParAvg) : undefined}
          a11y={
            t.scoringAvg != null
              ? `Scoring average ${fmtAvg(t.scoringAvg)}, ${signed(t.toParAvg ?? 0)} to par, over ${t.completeRounds} complete ${t.completeRounds === 1 ? 'round' : 'rounds'}`
              : 'Scoring average: no complete 18-hole rounds yet'
          }
        />
        <Tile
          label="Best"
          value={best ? String(best.strokes) : '—'}
          sub={best ? relLabel(best.toPar) : undefined}
          a11y={best ? `Best round ${best.strokes}, ${relLabel(best.toPar)}, at ${best.courseName}` : 'Best round: none yet'}
        />
        <Tile label="Birdies" value={String(t.birdiesOrBetter)} a11y={`${t.birdiesOrBetter} birdies or better`} />
        <Tile
          label="FIR"
          value={fmtPct(t.firPct)}
          sub={t.firHoles ? `${t.firHit}/${t.firHoles}` : undefined}
          a11y={t.firHoles ? `Fairways hit ${t.firHit} of ${t.firHoles}, ${fmtPct(t.firPct)}` : 'Fairways: not entered'}
        />
        <Tile
          label="GIR"
          value={fmtPct(t.girPct)}
          sub={t.girHoles ? `${t.girHit}/${t.girHoles}` : undefined}
          a11y={t.girHoles ? `Greens in regulation ${t.girHit} of ${t.girHoles}, ${fmtPct(t.girPct)}` : 'Greens: not entered'}
        />
        <Tile
          label="Putts/rd"
          value={fmtAvg(t.puttsPerRound)}
          sub={t.puttsPerHole != null ? `${t.puttsPerHole.toFixed(2)}/hole` : undefined}
          a11y={
            t.puttsPerRound != null
              ? `${fmtAvg(t.puttsPerRound)} putts per 18 holes, ${t.puttsPerHole?.toFixed(2)} per hole`
              : 'Putts: not entered'
          }
        />
      </View>
    </Card>
  )
}

function ScoreBar({ line }: { line: RoundLine }) {
  const segs = [
    { n: line.birdiesOrBetter, color: BAR.birdie, label: 'birdies or better' },
    { n: line.pars, color: BAR.par, label: 'pars' },
    { n: line.bogeys, color: BAR.bogey, label: 'bogeys' },
    { n: line.doublesPlus, color: BAR.double, label: 'double bogeys or worse' },
  ]
  if (line.holes === 0) return null
  return (
    <View
      style={st.bar}
      accessible
      accessibilityRole="image"
      accessibilityLabel={segs.map((s) => `${s.n} ${s.label}`).join(', ')}
    >
      {segs
        .filter((s) => s.n > 0)
        .map((s) => (
          <View key={s.label} style={{ flex: s.n, backgroundColor: s.color }} />
        ))}
    </View>
  )
}

function RoundCard({
  round,
  lines,
  onPress,
}: {
  round: Round
  lines: { row: Row; line: RoundLine; team: boolean }[]
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[
        `${round.courseName}, ${fmtDate(round.date)}, ${round.game}`,
        ...lines.map(({ row, line }) =>
          [
            line.holes > 0
              ? `${row.name} ${line.strokes}, ${relLabel(line.toPar)}${line.complete18 ? '' : ` through ${line.holes}`}`
              : `${row.name} stats only`,
            `${line.birdiesOrBetter} birdies or better, ${line.pars} pars, ${line.bogeys} bogeys, ${line.doublesPlus} doubles or worse`,
            line.puttHoles ? `${line.putts} putts` : null,
            line.firHoles ? `fairways ${fmtPct(line.firPct)}` : null,
            line.girHoles ? `greens ${fmtPct(line.girPct)}` : null,
          ]
            .filter(Boolean)
            .join(', '),
        ),
      ].join('. ')}
      accessibilityHint="Opens the scorecard"
      style={({ pressed }) => [{ marginBottom: 12 }, pressed && { opacity: 0.85 }]}
    >
      <Card>
        <View style={st.roundHead}>
          <View style={{ flex: 1 }}>
            <T style={st.course} numberOfLines={2}>
              {round.courseName}
            </T>
            <T style={st.muted}>
              {fmtDate(round.date)} · {round.game} · Par {sum(round.holePars)}
            </T>
          </View>
          <Text style={st.chev} importantForAccessibility="no">
            ›
          </Text>
        </View>
        {lines.length === 0 ? (
          <Hint style={{ marginTop: 10 }}>No scores yet — tap to open the scorecard.</Hint>
        ) : (
          <>
            {lines.map(({ row, line, team }, i) => (
              <View key={row.id} style={[st.lineRow, i === 0 && { borderTopWidth: 0 }]}>
                <View style={st.lineTop}>
                  <View style={[st.dot, { backgroundColor: row.color }]} />
                  <T style={st.lineName} numberOfLines={1}>
                    {row.name}
                    {team ? <Text style={st.muted}> (team)</Text> : null}
                  </T>
                  {line.holes > 0 ? (
                    <T style={st.lineScore}>
                      {line.strokes}
                      <Text style={st.lineRel}> {relLabel(line.toPar)}</Text>
                    </T>
                  ) : (
                    <T style={st.muted}>stats only</T>
                  )}
                </View>
                <ScoreBar line={line} />
                <T style={st.lineStats}>
                  {line.holes > 0 && !line.complete18 ? `thru ${line.holes} · ` : ''}
                  {line.birdiesOrBetter} birdie+ · {line.pars} par · {line.bogeys} bogey · {line.doublesPlus} dbl+
                  {'\n'}Putts {line.puttHoles ? line.putts : '—'} · FIR {fmtPct(line.firPct)} · GIR{' '}
                  {fmtPct(line.girPct)}
                </T>
              </View>
            ))}
            <View style={st.legend} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {(
                [
                  ['Birdie+', BAR.birdie],
                  ['Par', BAR.par],
                  ['Bogey', BAR.bogey],
                  ['Double+', BAR.double],
                ] as const
              ).map(([label, color]) => (
                <View key={label} style={st.legendItem}>
                  <View style={[st.legendSwatch, { backgroundColor: color }]} />
                  <Text style={st.legendText}>{label}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </Card>
    </Pressable>
  )
}

const st = StyleSheet.create({
  muted: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  leaderGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  leader: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.paper,
    borderRadius: 14,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hair,
  },
  leaderLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  leaderValue: { fontFamily: fonts.sansBold, fontSize: 28, lineHeight: 34, color: colors.green900, fontVariant: ['tabular-nums'] },
  leaderWho: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.ink },
  leaderSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  playerHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  playerName: { flex: 1, fontFamily: fonts.sansBold, fontSize: 16 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tile: {
    flexBasis: '31%',
    flexGrow: 1,
    backgroundColor: colors.cream,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  tileValue: { fontFamily: fonts.sansBold, fontSize: 18, lineHeight: 24, color: colors.green900, fontVariant: ['tabular-nums'] },
  tileSub: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.green600 },
  tileLabel: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  roundHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  course: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.green900 },
  chev: { color: colors.muted, fontSize: 26 },
  lineRow: { paddingTop: 10, marginTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  lineTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lineName: { flex: 1, fontFamily: fonts.sansSemi },
  lineScore: { fontFamily: fonts.sansBold, fontVariant: ['tabular-nums'] },
  lineRel: { fontFamily: fonts.sansSemi, color: colors.muted, fontSize: 13 },
  bar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
    backgroundColor: colors.hair,
  },
  lineStats: { fontSize: 12, lineHeight: 18, color: colors.muted, marginTop: 6, fontVariant: ['tabular-nums'] },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendSwatch: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
})
