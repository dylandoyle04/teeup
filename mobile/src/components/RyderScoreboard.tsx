import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, Text, View } from 'react-native'
import { computeRyder } from '@shared/ryder'
import { useStore } from '@shared/store'
import type { Trip } from '@shared/types'
import { Card, Hint, T, Toggle } from '@/components/ui'
import { colors, fonts, shadow } from '@/theme'

export const TEAM_A = '#1d5fb0'
export const TEAM_A_DARK = '#14477f'
export const TEAM_B = '#c6952a'
export const TEAM_B_DARK = '#9c7414'

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : `${Math.floor(n)}½`)

/** Points board + per-round session list (web `RyderScoreboard`). */
export default function RyderScoreboard({ trip }: { trip: Trip }) {
  const setRoundRyder = useStore((st) => st.setRoundRyder)
  const s = computeRyder(trip)
  const rc = trip.ryderCup
  if (!s || !rc) return null
  const aLead = s.aPoints > s.bPoints
  const bLead = s.bPoints > s.aPoints

  return (
    <>
      <View style={st.board}>
        <LinearGradient
          colors={[TEAM_A, TEAM_A_DARK]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={[st.side, !aLead && st.sideTrail]}
        >
          <Text style={st.sideName} numberOfLines={2}>
            {rc.teamAName}
          </Text>
          <Text style={st.sidePts}>{fmt(s.aPoints)}</Text>
        </LinearGradient>
        <View style={st.mid}>
          {s.decided === 'A' ? (
            <Text style={[st.status, st.win]}>{rc.teamAName} wins!</Text>
          ) : s.decided === 'B' ? (
            <Text style={[st.status, st.win]}>{rc.teamBName} wins!</Text>
          ) : s.decided === 'tie' ? (
            <Text style={st.status}>Tied — cup shared</Text>
          ) : (
            <Text style={st.status}>{fmt(s.clinch)} to clinch</Text>
          )}
          <Text style={st.thru}>
            {s.played}/{s.totalSessions} sessions
          </Text>
        </View>
        <LinearGradient
          colors={[TEAM_B, TEAM_B_DARK]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={[st.side, !bLead && st.sideTrail]}
        >
          <Text style={st.sideName} numberOfLines={2}>
            {rc.teamBName}
          </Text>
          <Text style={st.sidePts}>{fmt(s.bPoints)}</Text>
        </LinearGradient>
      </View>

      {s.sessions.length > 0 && (
        <Card style={{ marginTop: 12, paddingVertical: 6 }}>
          {s.sessions.map((ses, i) => (
            <View key={ses.round.id} style={[st.session, i === s.sessions.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={st.day}>{ses.counts ? `Day ${ses.index + 1}` : '—'}</Text>
              <View style={[{ flex: 1, minWidth: 0 }, !ses.counts && { opacity: 0.5 }]}>
                <T style={st.course} numberOfLines={1}>
                  {ses.round.courseName}
                </T>
                <T style={st.fmt} numberOfLines={1}>
                  {ses.counts && ses.format ? `${ses.format.name} · ${ses.format.tag}` : 'Not counting'}
                </T>
              </View>
              {ses.counts ? (
                ses.winner == null ? (
                  <T style={[st.result, st.muted]}>not started</T>
                ) : (
                  <T style={st.result}>
                    {ses.winner === 'tie'
                      ? `Halved ${ses.aHoles}–${ses.bHoles}`
                      : ses.winner === 'A'
                        ? `${rc.teamAName} ${ses.aHoles}–${ses.bHoles}`
                        : `${rc.teamBName} ${ses.bHoles}–${ses.aHoles}`}
                  </T>
                )
              ) : (
                <T style={[st.result, st.muted]}>off</T>
              )}
              <View accessibilityLabel={ses.counts ? 'Counts toward the cup' : 'Not counting'}>
                <Toggle on={ses.counts} onChange={(v) => setRoundRyder(trip.id, ses.round.id, v)} />
              </View>
            </View>
          ))}
          <Hint style={{ marginTop: 8, marginBottom: 8, marginHorizontal: 4 }}>
            Toggle a round off to keep it casual — only counting rounds award Ryder Cup points.
          </Hint>
        </Card>
      )}
    </>
  )
}

const st = StyleSheet.create({
  board: { flexDirection: 'row', alignItems: 'stretch', gap: 10, marginTop: 6, marginBottom: 2 },
  side: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    ...shadow,
  },
  sideTrail: { opacity: 0.82 },
  sideName: {
    color: '#fff',
    fontFamily: fonts.sansBold,
    fontSize: 13,
    letterSpacing: 0.3,
    textAlign: 'center',
    lineHeight: 16,
  },
  sidePts: { color: '#fff', fontFamily: fonts.sansBold, fontSize: 46, lineHeight: 50, marginTop: 6 },
  mid: { alignItems: 'center', justifyContent: 'center', gap: 4, minWidth: 78, maxWidth: 96 },
  status: { fontFamily: fonts.sansBold, fontSize: 12.5, color: '#17472f', textAlign: 'center', lineHeight: 15 },
  win: { color: colors.goldDark },
  thru: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  session: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  day: { fontFamily: fonts.sansBold, fontSize: 11, color: colors.green700, minWidth: 40 },
  course: { fontFamily: fonts.sansBold, fontSize: 14, lineHeight: 19 },
  fmt: { fontSize: 12, lineHeight: 16, color: colors.muted },
  result: { fontFamily: fonts.sansBold, fontSize: 12.5, lineHeight: 16, color: colors.green900, textAlign: 'right', maxWidth: 110 },
  muted: { color: colors.muted },
})
