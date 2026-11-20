// Views for the shared (cloud) Cup screen — native port of the pieces of
// ../src/pages/SharedRyder.tsx, styled like the local Cup's
// RyderScoreboard / RyderPlayingOrder.
import { LinearGradient } from 'expo-linear-gradient'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { SharedMember, SharedRyder } from '@shared/cloud'
import { chunkPairs } from '@shared/ryder'
import { Input } from '@/components/Field'
import { TEAM_A, TEAM_A_DARK, TEAM_B, TEAM_B_DARK } from '@/components/RyderScoreboard'
import {
  CUP_FORMATS,
  cupFormatOf,
  firstUnplayed,
  fmtCupPts,
  type CupSession,
  type cupStandings,
} from '@/components/SharedCupStandings'
import { tick } from '@/components/ScoreParts'
import { Card, Hint, SectionTitle, T } from '@/components/ui'
import { colors, fonts, shadow } from '@/theme'

type Standings = ReturnType<typeof cupStandings>

export function SharedCupBoard({ config, s }: { config: SharedRyder; s: Standings }) {
  const aLead = s.aPoints > s.bPoints
  const bLead = s.bPoints > s.aPoints
  return (
    <View style={st.board} accessible accessibilityLabel={`${config.teamAName} ${fmtCupPts(s.aPoints)}, ${config.teamBName} ${fmtCupPts(s.bPoints)}`}>
      <LinearGradient colors={[TEAM_A, TEAM_A_DARK]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={[st.side, !aLead && st.sideTrail]}>
        <Text style={st.sideName} numberOfLines={2}>
          {config.teamAName}
        </Text>
        <Text style={st.sidePts}>{fmtCupPts(s.aPoints)}</Text>
      </LinearGradient>
      <View style={st.mid}>
        {s.decided === 'A' ? (
          <Text style={[st.status, st.win]}>{config.teamAName} wins!</Text>
        ) : s.decided === 'B' ? (
          <Text style={[st.status, st.win]}>{config.teamBName} wins!</Text>
        ) : s.decided === 'tie' ? (
          <Text style={st.status}>Tied</Text>
        ) : (
          <Text style={st.status}>{s.total ? `${fmtCupPts(s.clinch)} to clinch` : 'Add a match'}</Text>
        )}
        <Text style={st.thru}>
          {s.played}/{s.total} matches
        </Text>
      </View>
      <LinearGradient colors={[TEAM_B, TEAM_B_DARK]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={[st.side, !bLead && st.sideTrail]}>
        <Text style={st.sideName} numberOfLines={2}>
          {config.teamBName}
        </Text>
        <Text style={st.sidePts}>{fmtCupPts(s.bPoints)}</Text>
      </LinearGradient>
    </View>
  )
}

/** Team-name field: edits locally, saves when editing ends (remounts on remote renames). */
export function SharedCupTeamName({
  value,
  color,
  label,
  onCommit,
}: {
  value: string
  color: string
  label: string
  onCommit: (name: string) => void
}) {
  const [draft, setDraft] = useState(value)
  const commit = () => {
    const v = draft.trim()
    if (v && v !== value) onCommit(v)
    else setDraft(value)
  }
  return (
    <Input
      value={draft}
      onChangeText={setDraft}
      onEndEditing={commit}
      accessibilityLabel={label}
      style={[st.nameInput, { borderLeftColor: color }]}
      returnKeyType="done"
      maxLength={40}
    />
  )
}

export function SharedCupTeamButton({ label, on, color, onPress }: { label: string; on: boolean; color: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        tick()
        onPress()
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      hitSlop={4}
      style={[st.teamBtn, on && { backgroundColor: color }]}
    >
      <Text style={[st.teamBtnText, on && { color: '#fff' }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  )
}

export function SharedCupMatchRow({ ses, config, onPress }: { ses: CupSession; config: SharedRyder; onPress: () => void }) {
  const f = cupFormatOf(ses.round.game)
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.85 }]} accessibilityRole="button" accessibilityLabel={`${ses.round.courseName}, ${f.label}. Open live scorecard`}>
      <Card style={st.matchRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <T style={st.course} numberOfLines={1}>
            {ses.round.courseName}
          </T>
          <T style={st.fmt} numberOfLines={1}>
            {f.label} · {f.tag}
          </T>
        </View>
        {ses.winner == null ? (
          <T style={[st.result, st.muted]}>not started</T>
        ) : (
          <T style={st.result}>
            {ses.winner === 'tie'
              ? `Halved ${ses.aHoles}–${ses.bHoles}`
              : ses.winner === 'A'
                ? `${config.teamAName} ${ses.aHoles}–${ses.bHoles}`
                : `${config.teamBName} ${ses.bHoles}–${ses.aHoles}`}
          </T>
        )}
        <T style={st.chev}>›</T>
      </Card>
    </Pressable>
  )
}

export function SharedCupAddMatch({ busy, onAdd }: { busy: boolean; onAdd: (course: string, formatKey: string) => void }) {
  const [course, setCourse] = useState('')
  return (
    <Card>
      <T style={st.label}>What course are you playing?</T>
      <Input value={course} onChangeText={setCourse} placeholder="e.g. TPC Myrtle Beach" returnKeyType="done" maxLength={80} />
      <T style={[st.label, { marginTop: 14 }]}>Pick the format</T>
      <View style={{ gap: 8 }}>
        {CUP_FORMATS.map((f) => (
          <Pressable
            key={f.key}
            disabled={busy}
            onPress={() => {
              tick()
              onAdd(course.trim(), f.key)
            }}
            style={({ pressed }) => [st.formatPick, busy && { opacity: 0.5 }, pressed && { backgroundColor: colors.green100 }]}
            accessibilityRole="button"
            accessibilityLabel={`Add a ${f.label} match`}
          >
            <T style={st.fmtName}>
              {f.label} <Text style={st.fmtTag}>· {f.tag}</Text>
            </T>
            <T style={st.how}>{f.how}</T>
          </Pressable>
        ))}
      </View>
    </Card>
  )
}

export function SharedCupPlayingOrder({
  sessions,
  config,
  sideA,
  sideB,
}: {
  sessions: CupSession[]
  config: SharedRyder
  sideA: SharedMember[]
  sideB: SharedMember[]
}) {
  if (sessions.length === 0) return null
  return (
    <>
      <SectionTitle>Playing order</SectionTitle>
      <View style={{ gap: 12 }}>
        {sessions.map((ses) => {
          const f = cupFormatOf(ses.round.game)
          const nh = firstUnplayed(ses.round.holePars, ses.scores)
          const complete = nh >= ses.round.holePars.length
          return (
            <Card key={ses.round.id} style={{ paddingVertical: 14 }}>
              <View style={st.head}>
                <View style={st.badge}>
                  <Text style={st.badgeText} numberOfLines={1}>
                    {ses.round.courseName}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <T style={st.fmtName}>
                    {f.label} <Text style={st.fmtTag}>· {f.tag}</Text>
                  </T>
                  {!!f.how && <T style={st.how}>{f.how}</T>}
                </View>
              </View>
              {f.key === 'Singles' ? (
                <View style={{ gap: 6 }}>
                  {sideA.map((a, i) => (
                    <Matchup key={a.id} a={a.name} b={sideB[i]?.name ?? '—'} />
                  ))}
                  {sideB.slice(sideA.length).map((b) => (
                    <Matchup key={b.id} a="—" b={b.name} />
                  ))}
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {[
                    { name: config.teamAName, side: 'a' as const, pairs: chunkPairs(sideA) },
                    { name: config.teamBName, side: 'b' as const, pairs: chunkPairs(sideB) },
                  ].map((team) => (
                    <View key={team.side}>
                      <Text
                        style={[
                          st.teamLabel,
                          team.side === 'a'
                            ? { color: TEAM_A, borderBottomColor: TEAM_A }
                            : { color: TEAM_B_DARK, borderBottomColor: TEAM_B },
                        ]}
                      >
                        {team.name}
                      </Text>
                      {team.pairs.map((pair, pi) => (
                        <View key={pi} style={{ paddingVertical: 6 }}>
                          <T style={st.pairNames}>{pair.map((m) => m.name).join(' & ')}</T>
                          {f.key === 'Alternate Shot' && pair.length === 2 && (
                            <T style={st.pairTee}>
                              {complete ? (
                                'round complete'
                              ) : (
                                <>
                                  next tee: <Text style={st.strong}>{((nh + 1) % 2 === 1 ? pair[0] : pair[1]).name}</Text> · hole{' '}
                                  {nh + 1}
                                </>
                              )}
                            </T>
                          )}
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              )}
            </Card>
          )
        })}
      </View>
      <Hint style={{ marginTop: 10, marginHorizontal: 4 }}>
        Pairs come from each team&apos;s order. Tap a match above to enter scores — points update live.
      </Hint>
    </>
  )
}

function Matchup({ a, b }: { a: string; b: string }) {
  return (
    <View style={st.matchup}>
      <Text style={[st.mu, { flex: 1, textAlign: 'right', color: TEAM_A }]} numberOfLines={1}>
        {a}
      </Text>
      <Text style={st.vs}>vs</Text>
      <Text style={[st.mu, { flex: 1, color: TEAM_B_DARK }]} numberOfLines={1}>
        {b}
      </Text>
    </View>
  )
}

export const cupSt = StyleSheet.create({
  names: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  vs: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.muted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  memberName: { flex: 1, fontFamily: fonts.sansBold },
  toggle: { flexDirection: 'row', gap: 4, backgroundColor: colors.green100, borderRadius: 9, padding: 3, maxWidth: '58%' },
})

const st = StyleSheet.create({
  board: { flexDirection: 'row', alignItems: 'stretch', gap: 10, marginTop: 6, marginBottom: 2 },
  side: { flex: 1, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 12, alignItems: 'center', ...shadow },
  sideTrail: { opacity: 0.82 },
  sideName: { color: '#fff', fontFamily: fonts.sansBold, fontSize: 13, letterSpacing: 0.3, textAlign: 'center', lineHeight: 16 },
  sidePts: { color: '#fff', fontFamily: fonts.sansBold, fontSize: 46, lineHeight: 50, marginTop: 6 },
  mid: { alignItems: 'center', justifyContent: 'center', gap: 4, minWidth: 78, maxWidth: 96 },
  status: { fontFamily: fonts.sansBold, fontSize: 12.5, color: '#17472f', textAlign: 'center', lineHeight: 15 },
  win: { color: colors.goldDark },
  thru: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  nameInput: {
    flex: 1,
    minWidth: 0,
    borderLeftWidth: 4,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    fontFamily: fonts.sansBold,
    fontSize: 14,
  },
  teamBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 7, flexShrink: 1 },
  teamBtnText: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.green700 },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, marginBottom: 10 },
  course: { fontFamily: fonts.sansBold, fontSize: 14, lineHeight: 19 },
  fmt: { fontSize: 12, lineHeight: 16, color: colors.muted },
  result: { fontFamily: fonts.sansBold, fontSize: 12.5, lineHeight: 16, color: colors.green900, textAlign: 'right', maxWidth: 120 },
  muted: { color: colors.muted },
  chev: { fontSize: 22, color: colors.muted },
  label: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.ink, marginBottom: 6 },
  formatPick: { borderWidth: 1.5, borderColor: colors.line, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
  fmtName: { fontFamily: fonts.sansBold, color: colors.green900 },
  fmtTag: { fontFamily: fonts.sansSemi, color: colors.muted, fontSize: 13 },
  how: { fontSize: 13, lineHeight: 18, color: colors.muted, marginTop: 2 },
  head: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    marginBottom: 10,
  },
  badge: { backgroundColor: colors.green100, paddingVertical: 4, paddingHorizontal: 9, borderRadius: 999, marginTop: 2, maxWidth: 130 },
  badgeText: { fontFamily: fonts.sansBold, fontSize: 11, color: colors.green700 },
  teamLabel: { fontFamily: fonts.sansBold, fontSize: 12, letterSpacing: 0.3, marginBottom: 5, paddingBottom: 4, borderBottomWidth: 2 },
  pairNames: { fontFamily: fonts.sansBold, fontSize: 14, lineHeight: 19, color: colors.green900 },
  pairTee: { fontSize: 12, lineHeight: 17, color: colors.muted },
  strong: { fontFamily: fonts.sansBold, color: '#17472f' },
  matchup: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: '#f2f7f3', borderRadius: 10 },
  mu: { fontFamily: fonts.sansBold, fontSize: 14 },
  vs: { fontFamily: fonts.sansBold, fontSize: 11, color: colors.muted },
})
