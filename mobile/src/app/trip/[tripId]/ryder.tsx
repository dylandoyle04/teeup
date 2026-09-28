import { useLocalSearchParams } from 'expo-router'
import { useMemo } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { computeRyder, type Side } from '@shared/ryder'
import { useStore } from '@shared/store'
import type { Member } from '@shared/types'
import Screen from '@/components/Screen'
import { Input } from '@/components/Field'
import RyderPlayingOrder from '@/components/RyderPlayingOrder'
import RyderScoreboard, { TEAM_A, TEAM_B } from '@/components/RyderScoreboard'
import { Avatar, Button, Card, Hint, PageTitle, SectionTitle, T } from '@/components/ui'
import { colors, fonts } from '@/theme'

export default function RyderCupScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>()
  const trip = useStore((s) => s.trips.find((t) => t.id === tripId))
  const allMembers = useStore((s) => s.members)
  const setRyderCup = useStore((s) => s.setRyderCup)

  const members = useMemo(() => {
    if (!trip) return []
    const map = new Map(allMembers.map((m) => [m.id, m]))
    return trip.memberIds.map((id) => map.get(id)).filter((m): m is Member => Boolean(m))
  }, [trip, allMembers])

  if (!trip) return null

  const rc = trip.ryderCup
  const standings = computeRyder(trip)

  function assign(memberId: string, side: Side) {
    const base = rc ?? { teamAName: 'Team USA', teamBName: 'Team Europe', teamOf: {} }
    setRyderCup(tripId, { ...base, teamOf: { ...base.teamOf, [memberId]: side } })
  }

  function rename(which: 'teamAName' | 'teamBName', name: string) {
    if (!rc) return
    setRyderCup(tripId, { ...rc, [which]: name })
  }

  function startCup() {
    // seed balanced sides by order
    const teamOf: Record<string, Side> = {}
    members.forEach((m, i) => (teamOf[m.id] = i % 2 === 0 ? 'A' : 'B'))
    setRyderCup(tripId, { teamAName: 'Team USA', teamBName: 'Team Europe', teamOf })
  }

  function endCup() {
    Alert.alert('End Ryder Cup?', 'Turn off the Ryder Cup for this trip? Team assignments are cleared.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End Ryder Cup', style: 'destructive', onPress: () => setRyderCup(tripId, undefined) },
    ])
  }

  const aCount = rc ? Object.values(rc.teamOf).filter((s) => s === 'A').length : 0
  const bCount = rc ? Object.values(rc.teamOf).filter((s) => s === 'B').length : 0

  return (
    <Screen>
      <PageTitle sub="Two teams, one trip. Play a different format each day and rack up points toward the cup.">
        Ryder Cup
      </PageTitle>

      {!rc ? (
        <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
          <Text style={{ fontSize: 40, marginBottom: 8 }}>🏆</Text>
          <T style={{ textAlign: 'center', color: colors.muted }}>
            Start a Ryder Cup to split the group into two teams and compete across every round of the trip.
          </T>
          <Button title="Start the Ryder Cup" variant="gold" onPress={startCup} style={{ marginTop: 16, alignSelf: 'stretch' }} />
        </Card>
      ) : (
        <>
          {standings && <RyderScoreboard trip={trip} />}

          <SectionTitle>Teams</SectionTitle>
          <View style={st.names}>
            <Input
              value={rc.teamAName}
              onChangeText={(v) => rename('teamAName', v)}
              accessibilityLabel="Team A name"
              style={[st.nameInput, { borderLeftColor: TEAM_A }]}
              returnKeyType="done"
            />
            <T style={st.vs}>vs</T>
            <Input
              value={rc.teamBName}
              onChangeText={(v) => rename('teamBName', v)}
              accessibilityLabel="Team B name"
              style={[st.nameInput, { borderLeftColor: TEAM_B }]}
              returnKeyType="done"
            />
          </View>
          <Card style={{ paddingVertical: 6 }}>
            {members.map((m, i) => {
              const side = rc.teamOf[m.id]
              return (
                <View key={m.id} style={[st.row, i === members.length - 1 && { borderBottomWidth: 0 }]}>
                  <Avatar member={m} size={30} />
                  <T style={st.memberName} numberOfLines={1}>
                    {m.name}
                  </T>
                  <View style={st.toggle}>
                    <TeamButton label={rc.teamAName} on={side === 'A'} color={TEAM_A} onPress={() => assign(m.id, 'A')} />
                    <TeamButton label={rc.teamBName} on={side === 'B'} color={TEAM_B} onPress={() => assign(m.id, 'B')} />
                  </View>
                </View>
              )
            })}
            {(aCount === 0 || bCount === 0) && (
              <Hint style={{ marginTop: 8, marginBottom: 8, marginHorizontal: 4 }}>
                Put at least one player on each side to start scoring.
              </Hint>
            )}
          </Card>

          {aCount > 0 && bCount > 0 && <RyderPlayingOrder trip={trip} members={members} />}

          <Button title="End Ryder Cup" variant="ghost" onPress={endCup} style={{ marginTop: 16 }} />
        </>
      )}
    </Screen>
  )
}

function TeamButton({ label, on, color, onPress }: { label: string; on: boolean; color: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
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

const st = StyleSheet.create({
  names: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
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
  teamBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 7, flexShrink: 1 },
  teamBtnText: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.green700 },
})
