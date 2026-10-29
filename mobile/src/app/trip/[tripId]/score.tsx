// Native port of ../src/pages/Scorecard.tsx — live 18-hole scoring, side
// games, per-round leaderboards and stats. All scoring is local (zustand).
// TODO: live shared scoring (Supabase / @shared/cloud) isn't wired on mobile yet.
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { coursePlayOptions, yardsForCourseName } from '@shared/coursePars'
import { GAMES, isTeamGame, sum } from '@shared/games'
import { useStore } from '@shared/store'
import type { Member, Round } from '@shared/types'
import { DateInput, Field, Input } from '@/components/Field'
import HoleEntrySheet from '@/components/HoleEntrySheet'
import HoleStepper from '@/components/HoleStepper'
import ScoreGrid from '@/components/ScoreGrid'
import {
  OptionSheet,
  Results,
  SelectBox,
  StatsSummary,
  TeamSetup,
  TripStandings,
  WolfPanel,
  tick,
  useWolfOptions,
  type ScoreRow,
} from '@/components/ScoreParts'
import Screen from '@/components/Screen'
import { OffscreenCapture, RoundShareCard, ShareButton, roundComplete, roundHasScores, roundRows } from '@/components/ShareCards'
import { Button, Card, Hint, PageTitle, SectionTitle, Segmented, T } from '@/components/ui'
import { maybeAskForReview } from '@/lib/review'
import { shareViewAsImage } from '@/lib/shareImage'
import { colors, fonts, radius } from '@/theme'

const GAME_OPTIONS = GAMES.map((g) => ({ value: g as string, label: g }))

export default function Scorecard() {
  const { tripId = '' } = useLocalSearchParams<{ tripId: string }>()
  const trip = useStore((s) => s.getTrip(tripId))
  const allMembers = useStore((s) => s.members)
  const addRound = useStore((s) => s.addRound)
  const deleteRound = useStore((s) => s.deleteRound)

  const [activeRoundId, setActiveRoundId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [courseName, setCourseName] = useState('')
  const [date, setDate] = useState('')
  const [game, setGame] = useState<string>(GAMES[0])
  const [gamePicker, setGamePicker] = useState(false)
  const shareRef = useRef<View>(null)

  // tripMembers() builds a new array per call — derive it from stable state instead
  const members = useMemo<Member[]>(() => {
    if (!trip) return []
    const map = new Map(allMembers.map((m) => [m.id, m]))
    return trip.memberIds.map((id) => map.get(id)).filter((m): m is Member => !!m)
  }, [trip, allMembers])

  if (!trip) {
    return (
      <Screen>
        <Card style={{ alignItems: 'center', paddingVertical: 40 }}>
          <T>That trip doesn&apos;t exist.</T>
        </Card>
      </Screen>
    )
  }

  const rounds = trip.rounds
  const active = rounds.find((r) => r.id === activeRoundId) ?? rounds[rounds.length - 1]
  const q = courseName.trim().toLowerCase()
  const courseSuggestions = Array.from(new Set(trip.courses.flatMap((c) => coursePlayOptions(c.name)))).filter(
    (n) => n.toLowerCase() !== q && (!q || n.toLowerCase().includes(q)),
  )

  function createRound() {
    addRound(tripId, courseName, date, game)
    setCourseName('')
    setDate('')
    setGame(GAMES[0])
    setAdding(false)
    setActiveRoundId(null)
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
    <Screen automaticallyAdjustKeyboardInsets>
      <PageTitle sub="Live scoring, games & leaderboards for the whole trip.">Scorecard</PageTitle>

      <TripStandings rounds={rounds} members={members} />

      {rounds.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 18, flexGrow: 0 }}
          contentContainerStyle={st.roundSeg}
        >
          {rounds.map((r) => {
            const on = active?.id === r.id
            return (
              <Pressable
                key={r.id}
                onPress={() => {
                  tick()
                  setActiveRoundId(r.id)
                }}
                style={[st.roundBtn, on && { backgroundColor: colors.green700 }]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <Text style={[st.roundText, on && { color: '#fff' }]}>{r.courseName.split(' ').slice(0, 2).join(' ')}</Text>
              </Pressable>
            )
          })}
        </ScrollView>
      )}

      <View style={{ height: 16 }} />
      {active ? (
        <RoundCard
          key={active.id}
          tripId={tripId}
          round={active}
          members={members}
          shareRef={shareRef}
          onDelete={() =>
            Alert.alert(`Delete the round at ${active.courseName}?`, undefined, [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  deleteRound(tripId, active.id)
                  setActiveRoundId(null)
                },
              },
            ])
          }
        />
      ) : (
        <Card style={{ alignItems: 'center', paddingVertical: 36 }}>
          <Text style={{ fontSize: 40, marginBottom: 8 }}>⛳</Text>
          <T style={{ color: colors.muted, textAlign: 'center' }}>No rounds yet. Start one when you get to the first tee.</T>
        </Card>
      )}

      <View style={{ height: 16 }} />
      {adding ? (
        <Card>
          <Field label="Course">
            <Input value={courseName} onChangeText={setCourseName} placeholder="Which course today?" autoFocus />
            {courseSuggestions.length > 0 && (
              <View style={st.suggestions}>
                {courseSuggestions.map((n) => (
                  <Pressable key={n} onPress={() => setCourseName(n)} style={st.suggestion} accessibilityRole="button">
                    <Text style={st.suggestionText}>{n}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </Field>
          <Field label="Date">
            <DateInput value={date} onChange={setDate} />
          </Field>
          <Field label="Game">
            <SelectBox label={game} onPress={() => setGamePicker(true)} />
          </Field>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <Button title="Cancel" variant="ghost" onPress={() => setAdding(false)} />
            <Button title="Start round" onPress={createRound} style={{ flex: 1 }} />
          </View>
          <OptionSheet
            visible={gamePicker}
            title="Game"
            options={GAME_OPTIONS}
            value={game}
            onSelect={setGame}
            onClose={() => setGamePicker(false)}
          />
        </Card>
      ) : (
        <Button title="+ New round" variant="gold" onPress={() => setAdding(true)} />
      )}
    </Screen>
    {/* Off-screen (outside the ScrollView) so "Share results" can capture it. */}
    {active && roundHasScores(active) && (
      <OffscreenCapture>
        <RoundShareCard ref={shareRef} tripName={trip.name} round={active} members={members} />
      </OffscreenCapture>
    )}
    </View>
  )
}

function RoundCard({
  tripId,
  round,
  members,
  shareRef,
  onDelete,
}: {
  tripId: string
  round: Round
  members: Member[]
  shareRef: RefObject<View | null>
  onDelete: () => void
}) {
  const setRoundGame = useStore((s) => s.setRoundGame)
  const setRoundTeams = useStore((s) => s.setRoundTeams)
  const setScore = useStore((s) => s.setScore)
  const [entry, setEntry] = useState<{ rowId: string; hole: number } | null>(null)
  const [entryMode, setEntryMode] = useState<'quick' | 'detailed'>('quick')
  const [gamePicker, setGamePicker] = useState(false)
  const [wolfHole, setWolfHole] = useState<number | null>(null)
  const wolfOpts = useWolfOptions(tripId, round, members, wolfHole)

  const team = isTeamGame(round.game)

  // auto-create two balanced teams when a team game has none
  useEffect(() => {
    if (team && round.teams.length < 2 && members.length >= 2) {
      const a: string[] = []
      const b: string[] = []
      members.forEach((m, i) => (i % 2 === 0 ? a : b).push(m.id))
      setRoundTeams(tripId, round.id, [
        { id: 'teamA', name: 'Team 1', memberIds: a },
        { id: 'teamB', name: 'Team 2', memberIds: b },
      ])
    }
  }, [team, round.teams.length, members, tripId, round.id, setRoundTeams])

  const scramble = round.game === 'Scramble'
  const rows: ScoreRow[] = roundRows(round, members)
  const hasScores = roundHasScores(round)
  const complete = roundComplete(round, rows)
  const [sharing, setSharing] = useState(false)

  // Ask for an App Store rating once, on the transition to a fully-scored round
  // (not on mounting a round that was already complete). RoundCard is keyed by
  // round id, so switching rounds remounts and resets this.
  const wasComplete = useRef(complete)
  useEffect(() => {
    if (complete && !wasComplete.current) {
      wasComplete.current = true
      const t = setTimeout(() => void maybeAskForReview(), 1500)
      return () => clearTimeout(t)
    }
    wasComplete.current = complete
  }, [complete])

  async function shareResults() {
    tick()
    setSharing(true)
    try {
      await shareViewAsImage(shareRef, { dialogTitle: `${round.courseName} results` })
    } finally {
      setSharing(false)
    }
  }

  const yards = yardsForCourseName(round.courseName)
  const totalYards = yards ? yards.reduce((a, b) => a + b, 0) : 0
  const commitScore = (rowId: string, h: number, v: number | null) => setScore(tripId, round.id, rowId, h, v)
  const entryRow = entry ? rows.find((r) => r.id === entry.rowId) : undefined

  return (
    <>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <T style={{ fontFamily: fonts.sansBold, fontSize: 17 }}>{round.courseName}</T>
            <T style={{ color: colors.muted, fontSize: 13 }}>
              {round.date || 'Today'} · Par {sum(round.holePars)}
              {totalYards > 0 && ` · ${totalYards.toLocaleString()} yds`}
            </T>
          </View>
          <Pressable onPress={onDelete} hitSlop={10} style={st.iconBtn} accessibilityLabel="Delete round">
            <Text style={{ fontSize: 18 }}>🗑️</Text>
          </Pressable>
        </View>
        <View style={{ marginTop: 12 }}>
          <T style={st.label}>Game</T>
          <SelectBox label={round.game} onPress={() => setGamePicker(true)} />
        </View>
      </Card>
      <OptionSheet
        visible={gamePicker}
        title="Game"
        options={GAME_OPTIONS}
        value={round.game}
        onSelect={(g) => setRoundGame(tripId, round.id, g)}
        onClose={() => setGamePicker(false)}
      />

      {team && round.teams.length >= 2 && <TeamSetup tripId={tripId} round={round} members={members} />}

      <SectionTitle>{round.game === 'Stroke Play' ? 'Leaderboard' : `${round.game} standings`}</SectionTitle>
      <Results round={round} members={members} rows={rows} />
      {hasScores && (
        <ShareButton
          title={complete ? 'Share final results' : 'Share results'}
          accessibilityLabel="Share round results as an image"
          loading={sharing}
          onPress={shareResults}
          style={{ marginTop: 10 }}
        />
      )}

      {round.game === 'Wolf' && <WolfPanel round={round} members={members} onPick={setWolfHole} />}
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

      <SectionTitle>Enter scores{scramble ? ' (one per team)' : ''}</SectionTitle>
      <Segmented
        options={[
          { value: 'quick', label: 'Quick' },
          { value: 'detailed', label: 'Detailed' },
        ]}
        value={entryMode}
        onChange={(v) => {
          tick()
          setEntryMode(v)
        }}
      />
      <Hint style={{ marginTop: 8, marginBottom: 10, marginHorizontal: 4 }}>
        {entryMode === 'quick'
          ? 'Type a score — it jumps down to the next player automatically.'
          : 'Tap any box to log the score, putts, fairway & GIR for that hole.'}
      </Hint>

      {entryMode === 'quick' && rows.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <HoleStepper round={round} rows={rows} yards={yards} commitScore={commitScore} />
        </View>
      )}

      <Card style={{ padding: 0 }}>
        <View style={{ borderRadius: radius, overflow: 'hidden' }}>
        <ScoreGrid
          round={round}
          rows={rows}
          yards={yards}
          mode={entryMode}
          commitScore={commitScore}
          onCellTap={(id, h) => setEntry({ rowId: id, hole: h })}
        />
        </View>
      </Card>

      <StatsSummary round={round} rows={rows} />

      <HoleEntrySheet
        entry={
          entry && entryRow
            ? {
                tripId,
                round,
                row: entryRow,
                hole: entry.hole,
                yards: yards ? yards[entry.hole] : null,
                onClose: () => setEntry(null),
                onNext: entry.hole < 17 ? () => setEntry({ rowId: entry.rowId, hole: entry.hole + 1 }) : null,
                onPrev: entry.hole > 0 ? () => setEntry({ rowId: entry.rowId, hole: entry.hole - 1 }) : null,
              }
            : null
        }
      />
    </>
  )
}

const st = StyleSheet.create({
  roundSeg: { flexDirection: 'row', backgroundColor: colors.green100, borderRadius: 12, padding: 3, gap: 3 },
  roundBtn: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 9 },
  roundText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.green700 },
  label: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.ink, marginBottom: 6 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  suggestion: { backgroundColor: colors.green100, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  suggestionText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.green700 },
})
