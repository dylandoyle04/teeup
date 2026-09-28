import { StyleSheet, Text, View } from 'react-native'
import { chunkPairs, computeRyder, nextHole, type RyderCup, type SessionResult } from '@shared/ryder'
import type { Member, Trip } from '@shared/types'
import { Card, Hint, SectionTitle, T } from '@/components/ui'
import { TEAM_A, TEAM_B, TEAM_B_DARK } from '@/components/RyderScoreboard'
import { colors, fonts } from '@/theme'

/** Per-session pairings / matchups for every counting round (web `PlayingOrder`). */
export default function RyderPlayingOrder({ trip, members }: { trip: Trip; members: Member[] }) {
  const s = computeRyder(trip)
  const rc = trip.ryderCup
  if (!s || !rc) return null
  const counting = s.sessions.filter((x) => x.counts)
  if (counting.length === 0) return null

  const sideA = members.filter((m) => rc.teamOf[m.id] === 'A')
  const sideB = members.filter((m) => rc.teamOf[m.id] === 'B')

  return (
    <>
      <SectionTitle>Playing order</SectionTitle>
      <View style={{ gap: 12 }}>
        {counting.map((ses) => (
          <SessionPlay key={ses.round.id} session={ses} rc={rc} sideA={sideA} sideB={sideB} />
        ))}
      </View>
      <Hint style={{ marginTop: 10, marginHorizontal: 4 }}>
        Pairs are made from your team order — reshuffle a side above to change them. Enter scores on the
        Scorecard; points here update automatically.
      </Hint>
    </>
  )
}

function SessionPlay({
  session,
  rc,
  sideA,
  sideB,
}: {
  session: SessionResult
  rc: RyderCup
  sideA: Member[]
  sideB: Member[]
}) {
  if (!session.format) return null
  const f = session.format
  const nh = nextHole(session.round)
  const complete = nh >= session.round.holePars.length
  const holeNum = nh + 1

  return (
    <Card style={{ paddingVertical: 14 }}>
      <View style={st.head}>
        <View style={st.badge}>
          <Text style={st.badgeText}>Day {session.index + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <T style={st.fmtName}>
            {f.name} <Text style={st.fmtTag}>· {f.tag}</Text>
          </T>
          <T style={st.how}>{f.how}</T>
        </View>
      </View>

      {f.name === 'Singles' ? (
        <View style={{ gap: 6 }}>
          {sideA.map((a, i) => (
            <Matchup key={a.id} a={a.name} b={sideB[i]?.name ?? '—'} />
          ))}
          {sideB.length > sideA.length &&
            sideB.slice(sideA.length).map((b) => <Matchup key={b.id} a="—" b={b.name} />)}
        </View>
      ) : (
        // Fourball & Foursomes: show each team's pairs
        <View style={{ gap: 12 }}>
          {[
            { name: rc.teamAName, side: 'a' as const, pairs: chunkPairs(sideA) },
            { name: rc.teamBName, side: 'b' as const, pairs: chunkPairs(sideB) },
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
                  {f.name === 'Foursomes' && pair.length === 2 && (
                    <T style={st.pairTee}>
                      {complete ? (
                        'round complete'
                      ) : (
                        <>
                          next tee:{' '}
                          <Text style={st.strong}>{(holeNum % 2 === 1 ? pair[0] : pair[1]).name}</Text> · hole{' '}
                          {holeNum}
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

      {f.name === 'Foursomes' && (
        <Hint style={{ marginTop: 6, marginHorizontal: 4 }}>
          Partners share one ball and alternate every shot; the listed player tees this hole, then you switch off.
        </Hint>
      )}
    </Card>
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

const st = StyleSheet.create({
  head: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    marginBottom: 10,
  },
  badge: {
    backgroundColor: colors.green100,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 999,
    marginTop: 2,
  },
  badgeText: { fontFamily: fonts.sansBold, fontSize: 11, color: colors.green700 },
  fmtName: { fontFamily: fonts.sansBold, color: colors.green900 },
  fmtTag: { fontFamily: fonts.sansSemi, color: colors.muted, fontSize: 13 },
  how: { fontSize: 13, lineHeight: 18, color: colors.muted, marginTop: 2 },
  teamLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    letterSpacing: 0.3,
    marginBottom: 5,
    paddingBottom: 4,
    borderBottomWidth: 2,
  },
  pairNames: { fontFamily: fonts.sansBold, fontSize: 14, lineHeight: 19, color: colors.green900 },
  pairTee: { fontSize: 12, lineHeight: 17, color: colors.muted },
  strong: { fontFamily: fonts.sansBold, color: '#17472f' },
  matchup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f2f7f3',
    borderRadius: 10,
  },
  mu: { fontFamily: fonts.sansBold, fontSize: 14 },
  vs: { fontFamily: fonts.sansBold, fontSize: 11, color: colors.muted },
})
