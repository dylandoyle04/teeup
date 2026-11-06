// Branded, fixed-width "share as image" cards. They're rendered off-screen
// (see OffscreenCapture) and captured to a PNG by lib/shareImage.ts.
// Scoring comes straight from @shared/games / @shared/ryder — the same
// functions the Scorecard + Ryder screens use — so the image always matches.
import { LinearGradient } from 'expo-linear-gradient'
import type { ReactNode, Ref } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import {
  computeBestBall,
  computeHighLow,
  computeSkins,
  computeStableford,
  computeWolf,
  relLabel,
  strokeBoard,
  sum,
} from '@shared/games'
import { computeRyder } from '@shared/ryder'
import type { Member, Round, Trip } from '@shared/types'
import { TEAM_A, TEAM_A_DARK, TEAM_B, TEAM_B_DARK } from '@/components/RyderScoreboard'
import { TEAM_COLORS, type ScoreRow } from '@/components/ScoreParts'
import { colors, fonts } from '@/theme'

export const SHARE_CARD_WIDTH = 360

// ---------- helpers shared with the Scorecard ----------

/** Scoring rows for a round: Scramble scores per team, everything else per player. */
export function roundRows(round: Round, members: Member[]): ScoreRow[] {
  const teamRows: ScoreRow[] =
    round.teams.length >= 2
      ? round.teams.map((t, i) => ({ id: t.id, name: t.name, color: TEAM_COLORS[i % TEAM_COLORS.length] }))
      : []
  return round.game === 'Scramble' && teamRows.length ? teamRows : members
}

/** True once any score has been entered for the round. */
export function roundHasScores(round: Round): boolean {
  return Object.values(round.scores).some((sc) => sc?.some((v) => v != null))
}

/** Holes scored for one row. */
function thruFor(round: Round, id: string): number {
  return (round.scores[id] ?? []).filter((v) => v != null).length
}

/** True when every scoring row has every hole filled in. */
export function roundComplete(round: Round, rows: ScoreRow[]): boolean {
  return rows.length > 0 && rows.every((r) => thruFor(round, r.id) >= round.holePars.length)
}

function fmtDate(d: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
  return new Date(d + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const fmtPts = (n: number) => (Number.isInteger(n) ? String(n) : `${Math.floor(n)}½`)

/** Pill button that opens the share sheet (share icon + label). */
export function ShareButton({
  title,
  accessibilityLabel,
  onPress,
  loading,
  style,
}: {
  title: string
  accessibilityLabel: string
  onPress: () => void
  loading?: boolean
  style?: StyleProp<ViewStyle>
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ busy: !!loading, disabled: !!loading }}
      style={({ pressed }) => [st.shareBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }, style]}
    >
      {loading ? (
        <ActivityIndicator color={colors.green700} />
      ) : (
        <>
          <Text style={st.shareIcon}>📤</Text>
          <Text style={st.shareText}>{title}</Text>
        </>
      )}
    </Pressable>
  )
}

// ---------- frame ----------

/**
 * Keeps a capture target mounted and laid out, but far outside the visible
 * area. Must be rendered OUTSIDE any ScrollView so it can't be clipped/culled.
 * (Opacity 0 would capture a blank image, so we move it instead.)
 */
export function OffscreenCapture({ children }: { children: ReactNode }) {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={st.offscreen}
    >
      {children}
    </View>
  )
}

function ShareFrame({
  ref,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  ref?: Ref<View>
  eyebrow: string
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <View ref={ref} collapsable={false} style={st.frame}>
      <LinearGradient colors={[colors.green900, colors.green700]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.header}>
        <Text style={st.wordmark}>
          Flagstick<Text style={{ color: colors.brandAccent }}> Finder</Text>
        </Text>
        <View style={st.divider}>
          <View style={st.dividerLine} />
          <View style={st.dividerBall} />
          <View style={st.dividerLine} />
        </View>
        <Text style={st.eyebrow}>{eyebrow}</Text>
        <Text style={st.title} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={st.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </LinearGradient>
      <View style={st.body}>{children}</View>
      <View style={st.footer}>
        <Text style={st.footerText}>
          Plan your golf trip · <Text style={st.footerUrl}>flagstickfinder.com</Text>
        </Text>
      </View>
    </View>
  )
}

// ---------- round card ----------

type Line = { id: string; name: string; color: string; main: string; sub?: string; started: boolean }
type Duel = { aName: string; bName: string; aPts: number; bPts: number; aSub?: string; bSub?: string; vs: string; note: string }

function roundResults(round: Round, members: Member[], rows: ScoreRow[]): { lines?: Line[]; duel?: Duel } {
  const memberIds = members.map((m) => m.id)
  const byId = new Map(members.map((m) => [m.id, m]))
  const member = (id: string) => byId.get(id)!

  if (round.game === 'Best Ball') {
    const bb = computeBestBall(round)
    if (!bb) return {}
    return {
      duel: {
        aName: bb.A.name,
        bName: bb.B.name,
        aPts: bb.aHoles,
        bPts: bb.bHoles,
        aSub: bb.aTotal ? `${bb.aTotal} strokes` : undefined,
        bSub: bb.bTotal ? `${bb.bTotal} strokes` : undefined,
        vs: 'HOLES',
        note: `Best ball · thru ${bb.thru}`,
      },
    }
  }
  if (round.game === 'High-Low') {
    const hl = computeHighLow(round)
    if (!hl) return {}
    return {
      duel: { aName: hl.A.name, bName: hl.B.name, aPts: hl.aPts, bPts: hl.bPts, vs: 'PTS', note: `High-Low · thru ${hl.holes.length}` },
    }
  }
  if (round.game === 'Stableford') {
    return {
      lines: computeStableford(round, memberIds)
        .filter((b) => byId.has(b.id))
        .map((b) => ({
          id: b.id,
          name: member(b.id).name,
          color: member(b.id).color,
          main: `${b.points} pts`,
          sub: b.thru >= round.holePars.length ? 'F' : `thru ${b.thru}`,
          started: b.thru > 0,
        })),
    }
  }
  if (round.game === 'Skins') {
    return {
      lines: computeSkins(round, memberIds)
        .rows.filter((s) => byId.has(s.id))
        .map((s) => ({
          id: s.id,
          name: member(s.id).name,
          color: member(s.id).color,
          main: `${s.skins} ${s.skins === 1 ? 'skin' : 'skins'}`,
          started: true,
        })),
    }
  }
  if (round.game === 'Wolf') {
    return {
      lines: computeWolf(round, memberIds)
        .rows.filter((w) => byId.has(w.id))
        .map((w) => ({ id: w.id, name: member(w.id).name, color: member(w.id).color, main: `${w.points} pts`, started: true })),
    }
  }
  // Stroke Play & Scramble
  return {
    lines: strokeBoard(
      round,
      rows.map((r) => ({ id: r.id, member: r as Member })),
    ).map((b) => ({
      id: b.id,
      name: b.member.name,
      color: b.member.color,
      main: b.thru === 0 ? '–' : relLabel(b.rel),
      sub: b.thru === 0 ? 'not started' : `${b.total}${b.thru >= round.holePars.length ? ' · F' : ` · thru ${b.thru}`}`,
      started: b.thru > 0,
    })),
  }
}

export function RoundShareCard({
  ref,
  tripName,
  round,
  members,
}: {
  ref?: Ref<View>
  tripName: string
  round: Round
  members: Member[]
}) {
  const rows = roundRows(round, members)
  const complete = roundComplete(round, rows)
  const thru = Math.max(0, ...rows.map((r) => thruFor(round, r.id)))
  const { lines, duel } = roundResults(round, members, rows)
  const meta = [round.date ? fmtDate(round.date) : null, `Par ${sum(round.holePars)}`, round.game].filter(Boolean).join(' · ')

  return (
    <ShareFrame ref={ref} eyebrow={complete ? 'FINAL RESULTS' : `LIVE · THRU ${thru}`} title={round.courseName} subtitle={tripName}>
      <Text style={st.meta}>{meta}</Text>
      {duel ? (
        <DuelBlock duel={duel} />
      ) : lines && lines.length ? (
        <View style={st.board}>
          {lines.map((l, i) => {
            const lead = i === 0 && l.started
            return (
              <View key={l.id} style={[st.line, i === lines.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={[st.rank, lead && { color: colors.goldDark }]}>{!l.started ? '–' : lead ? '🏆' : i + 1}</Text>
                <View style={[st.dot, { backgroundColor: l.color }]} />
                <Text style={st.name} numberOfLines={1}>
                  {l.name}
                </Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[st.main, lead && { color: colors.green900 }]}>{l.main}</Text>
                  {l.sub ? <Text style={st.sub}>{l.sub}</Text> : null}
                </View>
              </View>
            )
          })}
        </View>
      ) : (
        <Text style={st.empty}>Scores coming soon.</Text>
      )}
    </ShareFrame>
  )
}

function DuelBlock({ duel }: { duel: Duel }) {
  const leader = duel.aPts === duel.bPts ? null : duel.aPts > duel.bPts ? 'A' : 'B'
  const side = (name: string, pts: number, sub: string | undefined, c: string, win: boolean) => (
    <View style={[st.duelSide, { backgroundColor: c }, !win && leader && { opacity: 0.82 }]}>
      <Text style={st.duelName} numberOfLines={2}>
        {name}
      </Text>
      <Text style={st.duelPts}>{pts}</Text>
      {sub ? <Text style={st.duelSub}>{sub}</Text> : null}
    </View>
  )
  return (
    <View>
      <View style={st.duel}>
        {side(duel.aName, duel.aPts, duel.aSub, TEAM_COLORS[0], leader === 'A')}
        <Text style={st.duelVs}>{duel.vs}</Text>
        {side(duel.bName, duel.bPts, duel.bSub, TEAM_COLORS[1], leader === 'B')}
      </View>
      <Text style={st.duelNote}>
        {leader === null ? 'All square' : `${leader === 'A' ? duel.aName : duel.bName} lead`} · {duel.note}
      </Text>
    </View>
  )
}

// ---------- Ryder Cup card ----------

export function RyderShareCard({ ref, trip, members }: { ref?: Ref<View>; trip: Trip; members: Member[] }) {
  const s = computeRyder(trip)
  const rc = trip.ryderCup
  if (!s || !rc) return null
  const roster = (side: 'A' | 'B') => members.filter((m) => rc.teamOf[m.id] === side)
  const status =
    s.decided === 'A'
      ? `${rc.teamAName} win the cup!`
      : s.decided === 'B'
        ? `${rc.teamBName} win the cup!`
        : s.decided === 'tie'
          ? 'Tied — the cup is shared'
          : s.aPoints === s.bPoints
            ? `All square · ${fmtPts(s.clinch)} to clinch`
            : `${s.aPoints > s.bPoints ? rc.teamAName : rc.teamBName} lead · ${fmtPts(s.clinch)} to clinch`
  const played = s.sessions.filter((x) => x.counts && x.winner != null)

  return (
    <ShareFrame ref={ref} eyebrow="THE CUP STANDINGS" title={trip.name} subtitle={`${s.played} of ${s.totalSessions} sessions played`}>
      <View style={st.ryderBoard}>
        <LinearGradient colors={[TEAM_A, TEAM_A_DARK]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={st.ryderSide}>
          <Text style={st.duelName} numberOfLines={2}>
            {rc.teamAName}
          </Text>
          <Text style={st.ryderPts}>{fmtPts(s.aPoints)}</Text>
        </LinearGradient>
        <Text style={st.duelVs}>VS</Text>
        <LinearGradient colors={[TEAM_B, TEAM_B_DARK]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={st.ryderSide}>
          <Text style={st.duelName} numberOfLines={2}>
            {rc.teamBName}
          </Text>
          <Text style={st.ryderPts}>{fmtPts(s.bPoints)}</Text>
        </LinearGradient>
      </View>
      <View style={[st.statusPill, s.decided && s.decided !== 'tie' && { backgroundColor: '#f6ecc7' }]}>
        <Text style={[st.statusText, s.decided && s.decided !== 'tie' && { color: '#6b560f' }]}>
          {s.decided && s.decided !== 'tie' ? '🏆 ' : ''}
          {status}
        </Text>
      </View>

      <View style={st.rosters}>
        {(['A', 'B'] as const).map((side) => (
          <View key={side} style={{ flex: 1, gap: 5 }}>
            {roster(side).map((m) => (
              <View key={m.id} style={st.rosterRow}>
                <View style={[st.dot, { backgroundColor: side === 'A' ? TEAM_A : TEAM_B }]} />
                <Text style={st.rosterName} numberOfLines={1}>
                  {m.name}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      {played.length > 0 && (
        <View style={st.sessions}>
          {played.map((ses, i) => (
            <View key={ses.round.id} style={[st.session, i === played.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={st.day}>Day {ses.index + 1}</Text>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={st.sessionCourse} numberOfLines={1}>
                  {ses.round.courseName}
                </Text>
                {ses.format ? <Text style={st.sub}>{ses.format.name}</Text> : null}
              </View>
              <Text
                style={[
                  st.sessionResult,
                  { color: ses.winner === 'A' ? TEAM_A : ses.winner === 'B' ? TEAM_B_DARK : colors.muted },
                ]}
                numberOfLines={1}
              >
                {ses.winner === 'tie'
                  ? `Halved ${ses.aHoles}–${ses.bHoles}`
                  : ses.winner === 'A'
                    ? `${rc.teamAName} ${ses.aHoles}–${ses.bHoles}`
                    : `${rc.teamBName} ${ses.bHoles}–${ses.aHoles}`}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ShareFrame>
  )
}

const st = StyleSheet.create({
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.green700,
    backgroundColor: colors.paper,
    paddingHorizontal: 18,
  },
  shareIcon: { fontSize: 16 },
  shareText: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.green700 },
  offscreen: { position: 'absolute', left: -10000, top: 0, width: SHARE_CARD_WIDTH },
  frame: { width: SHARE_CARD_WIDTH, backgroundColor: colors.cream, overflow: 'hidden' },
  header: { paddingTop: 22, paddingBottom: 20, paddingHorizontal: 22, alignItems: 'center' },
  wordmark: { fontFamily: fonts.sansBold, fontSize: 24, color: '#fff', letterSpacing: 0.2 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 12, width: 120 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(212,175,55,0.6)' },
  dividerBall: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold },
  eyebrow: { fontFamily: fonts.sansBold, fontSize: 10.5, letterSpacing: 2, color: colors.gold },
  title: { fontFamily: fonts.serifBold, fontSize: 30, lineHeight: 33, color: '#fff', textAlign: 'center', marginTop: 4 },
  subtitle: { fontFamily: fonts.sansMedium, fontSize: 13, color: 'rgba(255,255,255,0.78)', textAlign: 'center', marginTop: 2 },
  body: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 18 },
  meta: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.muted, textAlign: 'center', marginBottom: 12 },
  footer: { backgroundColor: colors.green900, paddingVertical: 12, alignItems: 'center' },
  footerText: { fontFamily: fonts.sansMedium, fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  footerUrl: { fontFamily: fonts.sansBold, color: colors.gold },
  board: { backgroundColor: colors.paper, borderRadius: 14, borderWidth: 1, borderColor: colors.hair, paddingHorizontal: 12 },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  rank: { width: 24, textAlign: 'center', fontFamily: fonts.sansBold, fontSize: 14, color: colors.muted },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: '#fff' },
  name: { flex: 1, fontFamily: fonts.sansSemi, fontSize: 16, color: colors.ink },
  main: { fontFamily: fonts.sansBold, fontSize: 17, color: colors.ink, fontVariant: ['tabular-nums'] },
  sub: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.muted },
  empty: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, textAlign: 'center', paddingVertical: 20 },
  duel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  duelSide: { flex: 1, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 10, alignItems: 'center' },
  duelName: { fontFamily: fonts.sansBold, fontSize: 13, lineHeight: 16, color: '#fff', textAlign: 'center' },
  duelPts: { fontFamily: fonts.sansBold, fontSize: 44, lineHeight: 50, color: '#fff', marginTop: 4 },
  duelSub: { fontFamily: fonts.sansSemi, fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  duelVs: { fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 1, color: colors.muted },
  duelNote: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.green700, textAlign: 'center', marginTop: 12 },
  ryderBoard: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ryderSide: { flex: 1, borderRadius: 16, paddingVertical: 18, paddingHorizontal: 10, alignItems: 'center' },
  ryderPts: { fontFamily: fonts.sansBold, fontSize: 52, lineHeight: 58, color: '#fff', marginTop: 4 },
  statusPill: {
    alignSelf: 'center',
    marginTop: 14,
    backgroundColor: colors.green100,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  statusText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.green700, textAlign: 'center' },
  rosters: { flexDirection: 'row', gap: 16, marginTop: 16, paddingHorizontal: 6 },
  rosterRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  rosterName: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink },
  sessions: {
    marginTop: 16,
    backgroundColor: colors.paper,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hair,
    paddingHorizontal: 12,
  },
  session: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  day: { fontFamily: fonts.sansBold, fontSize: 11, color: colors.green700, minWidth: 40 },
  sessionCourse: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.ink },
  sessionResult: { fontFamily: fonts.sansBold, fontSize: 12, maxWidth: 130, textAlign: 'right' },
})
