// Native port of ../src/pages/ShareScorecard.tsx — the LIVE scorecard for a
// round on a shared (Supabase) trip. Everyone's scores update in real time;
// each member enters scores from their phone. Reuses the local scorer's UI
// (Results, HoleStepper, ScoreGrid, TeamSetup, WolfPanel) by mapping the
// shared round + score map + members into a local Round shape. Data, realtime
// and the save queue live in useSharedRound (components/SharedScoreSync.ts).
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { yardsForCourseName } from '@shared/coursePars'
import { GAMES, isTeamGame, sum } from '@shared/games'
import ScoreGrid from '@/components/ScoreGrid'
import HoleStepper from '@/components/HoleStepper'
import {
  OptionSheet,
  Results,
  SelectBox,
  TeamSetup,
  WolfPanel,
  tick,
  useWolfOptions,
  type ScoreRow,
} from '@/components/ScoreParts'
import Screen from '@/components/Screen'
import {
  SharedError,
  SharedLoading,
  SharedSaveBadge,
  SharedSignInPrompt,
  backToSharedTrip,
} from '@/components/SharedScoreParts'
import SharedScorePlay from '@/components/SharedScorePlay'
import {
  scrambleScores,
  sharedAsRound,
  toLocalMembers,
  useSharedRound,
} from '@/components/SharedScoreSync'
import { roundRows } from '@/components/ShareCards'
import { Button, Card, Hint, SectionTitle, T } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { colors, fonts, radius } from '@/theme'

export default function SharedRoundScreen() {
  const { id = '', roundId = '' } = useLocalSearchParams<{ id: string; roundId: string }>()
  const ready = useAuth((s) => s.ready)
  const user = useAuth((s) => s.user)
  const live = useSharedRound(id, roundId, ready && !!user)
  const title = live.round?.courseName ?? 'Live scorecard'

  let body
  if (!ready) body = <SharedLoading />
  else if (!user) body = <SharedSignInPrompt what="this scorecard" next={`/shared/${id}/round/${roundId}`} />
  else if (live.load === 'loading') body = <SharedLoading label="Loading the scorecard…" />
  else if (live.load === 'error' || !live.round)
    body = (
      <SharedError
        message="Couldn't load this round. Check your connection — or the round may have been removed."
        onRetry={live.retry}
        onBack={() => backToSharedTrip(id)}
      />
    )
  else body = <LiveCard tripId={id} live={live} myUserId={user.id} />

  return (
    <>
      <Stack.Screen options={{ title }} />
      <Screen automaticallyAdjustKeyboardInsets>{body}</Screen>
    </>
  )
}

type Live = ReturnType<typeof useSharedRound>

function LiveCard({ tripId, live, myUserId }: { tripId: string; live: Live; myUserId: string }) {
  const shared = live.round!
  const [gamePicker, setGamePicker] = useState(false)
  const [wolfHole, setWolfHole] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)

  const members = toLocalMembers(live.members)
  const round = sharedAsRound(shared, live.scores)
  const game = shared.game
  const team = isTeamGame(game)
  const scramble = game === 'Scramble'
  // Scramble: anyone enters on their own row; the team's score is derived.
  const resultsRound = scramble ? sharedAsRound(shared, scrambleScores(shared, live.scores)) : round
  const resultsRows = roundRows(resultsRound, members)
  const rows: ScoreRow[] = members
  const me = live.members.find((m) => m.userId === myUserId)
  const yards = yardsForCourseName(shared.courseName)
  const totalPar = sum(shared.holePars)
  const wolfOpts = useWolfOptions(tripId, round, members, wolfHole, live.setWolfPick)
  const gameOptions = (GAMES.includes(game as (typeof GAMES)[number]) ? [...GAMES] : [game, ...GAMES]).map((g) => ({
    value: g as string,
    label: g as string,
  }))

  return (
    <>
      <View style={st.headRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <T style={st.course} numberOfLines={2}>
            {shared.courseName}
          </T>
          <T style={st.sub}>Par {totalPar} · live scorecard</T>
        </View>
        <SharedSaveBadge status={live.saveStatus} />
      </View>

      <Pressable
        onPress={() => {
          tick()
          setPlaying(true)
        }}
        style={({ pressed }) => [st.playBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
        accessibilityRole="button"
        accessibilityLabel={`Full-screen scoring for ${shared.courseName}`}
      >
        <Text style={st.playBtnText} maxFontSizeMultiplier={1.4}>
          ▶︎ Full-screen scoring
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push({ pathname: '/shared/[id]/cup', params: { id: tripId } })}
        style={({ pressed }) => [pressed && { opacity: 0.85 }]}
        accessibilityRole="button"
        accessibilityLabel="Open The Cup"
      >
        <Card style={st.cupRow}>
          <View style={{ flex: 1 }}>
            <T style={{ fontFamily: fonts.sansBold }}>🏆 The Cup</T>
            <T style={{ color: colors.muted, fontSize: 13 }}>Teams &amp; live points across the trip</T>
          </View>
          <T style={st.chev}>›</T>
        </Card>
      </Pressable>

      <Card style={{ marginTop: 12 }}>
        <T style={st.label}>Game</T>
        <SelectBox label={game} onPress={() => setGamePicker(true)} />
      </Card>
      <OptionSheet
        visible={gamePicker}
        title="Game"
        options={gameOptions}
        value={game}
        onSelect={live.setGame}
        onClose={() => setGamePicker(false)}
      />

      {team && round.teams.length >= 2 && (
        <TeamSetup tripId={tripId} round={round} members={members} onSetTeams={live.setTeams} />
      )}

      <SectionTitle>{game === 'Stroke Play' ? 'Leaderboard' : `${game} standings`}</SectionTitle>
      <Results round={resultsRound} members={members} rows={resultsRows} />

      {game === 'Wolf' && <WolfPanel round={round} members={members} onPick={setWolfHole} />}
      {wolfOpts && (
        <OptionSheet
          visible={wolfHole != null}
          title={wolfOpts.title}
          options={wolfOpts.options}
          value={wolfOpts.value}
          onSelect={wolfOpts.select}
          onClose={() => setWolfHole(null)}
        />
      )}

      <SectionTitle>Enter scores{scramble ? ' (any teammate)' : ''}</SectionTitle>
      <Hint style={{ marginTop: -4, marginBottom: 10, marginHorizontal: 4 }}>
        Everyone&apos;s scores sync live.{me ? ` You're ${me.name} — enter your own, or the group's.` : ''}
      </Hint>

      {rows.length > 0 ? (
        <>
          <View style={{ marginBottom: 12 }}>
            <HoleStepper round={round} rows={rows} yards={yards} commitScore={live.setScore} />
          </View>
          <Card style={{ padding: 0 }}>
            <View style={{ borderRadius: radius, overflow: 'hidden' }}>
              <ScoreGrid
                round={round}
                rows={rows}
                yards={yards}
                mode="quick"
                commitScore={live.setScore}
                onCellTap={() => {}}
              />
            </View>
          </Card>
          <Hint style={{ marginTop: 8, marginHorizontal: 4 }}>
            Type a score in the card — it jumps to the next player automatically.
          </Hint>
        </>
      ) : (
        <Card>
          <T style={{ color: colors.muted }}>No one has joined this trip yet.</T>
        </Card>
      )}

      <Button title="← Back to trip" variant="ghost" onPress={() => backToSharedTrip(tripId)} style={{ marginTop: 18 }} />

      <SharedScorePlay
        visible={playing}
        onClose={() => setPlaying(false)}
        round={round}
        rows={rows}
        resultsRound={resultsRound}
        resultsRows={resultsRows}
        members={members}
        yards={yards}
        saveStatus={live.saveStatus}
        commitScore={live.setScore}
      />
    </>
  )
}

const st = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  course: { fontFamily: fonts.serifBold, fontSize: 28, lineHeight: 32, color: colors.green900 },
  sub: { color: colors.muted, marginTop: 2 },
  label: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.ink, marginBottom: 6 },
  playBtn: {
    minHeight: 54,
    borderRadius: 999,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  playBtnText: { fontFamily: fonts.sansBold, fontSize: 16, color: '#2b2205' },
  cupRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  chev: { fontSize: 24, color: colors.muted },
})
