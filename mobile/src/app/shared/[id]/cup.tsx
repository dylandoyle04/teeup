// Native port of ../src/pages/SharedRyder.tsx — "The Cup" for a shared
// (Supabase) trip: two teams across the whole trip, a format per match,
// standings and playing order, all updating live for everyone.
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Text, View } from 'react-native'
import {
  addRound,
  getRoundsWithScores,
  getRyderCup,
  listMembers,
  saveRoundGame,
  saveRyderCup,
  type SharedMember,
  type SharedRyder,
} from '@shared/cloud'
import { TEAM_A, TEAM_B } from '@/components/RyderScoreboard'
import Screen from '@/components/Screen'
import {
  SharedCupAddMatch,
  SharedCupBoard,
  SharedCupMatchRow,
  SharedCupPlayingOrder,
  SharedCupTeamButton,
  SharedCupTeamName,
  cupSt,
} from '@/components/SharedCupParts'
import { cupStandings, type CupSide, type RoundWithScores } from '@/components/SharedCupStandings'
import { SharedError, SharedLoading, SharedSignInPrompt, backToSharedTrip } from '@/components/SharedScoreParts'
import { toLocalMembers } from '@/components/SharedScoreSync'
import { Avatar, Button, Card, Hint, PageTitle, SectionTitle, T } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { colors } from '@/theme'

type Load = 'loading' | 'ready' | 'error'

export default function SharedCupScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>()
  const ready = useAuth((s) => s.ready)
  const user = useAuth((s) => s.user)
  const enabled = ready && !!user

  const [members, setMembers] = useState<SharedMember[]>([])
  const [config, setConfig] = useState<SharedRyder | null>(null)
  const [rws, setRws] = useState<RoundWithScores[]>([])
  const [load, setLoad] = useState<Load>('loading')
  const [adding, setAdding] = useState(false)
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reload = useCallback(() => {
    Promise.all([listMembers(id), getRyderCup(id), getRoundsWithScores(id)])
      .then(([m, c, r]) => {
        // a signed-in member always sees themselves; empty = offline / no access
        if (m.length === 0) {
          setLoad((l) => (l === 'ready' ? l : 'error'))
          return
        }
        setMembers(m)
        setConfig(c)
        setRws(r)
        setLoad('ready')
      })
      .catch(() => setLoad((l) => (l === 'ready' ? l : 'error')))
  }, [id])

  useEffect(() => {
    if (enabled) reload()
  }, [enabled, reload])

  // realtime: any change to the cup, its rounds, scores or roster → reload (debounced)
  useEffect(() => {
    if (!enabled || !supabase) return
    const sb = supabase
    const timer = reloadTimer
    const soon = () => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(reload, 400)
    }
    let subscribedOnce = false
    const ch = sb
      .channel(`app-cup-${id}-${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ryder_cup', filter: `trip_id=eq.${id}` }, soon)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'round_scores' }, soon)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds', filter: `trip_id=eq.${id}` }, soon)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_members', filter: `trip_id=eq.${id}` }, soon)
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') return
        if (subscribedOnce) soon() // reconnected — catch up
        subscribedOnce = true
      })
    return () => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = null
      sb.removeChannel(ch)
    }
  }, [enabled, id, reload])

  function save(c: SharedRyder) {
    setConfig(c)
    saveRyderCup(id, c).catch(() => {})
  }
  function startCup() {
    const teamOf: Record<string, CupSide> = {}
    members.forEach((m, i) => (teamOf[m.id] = i % 2 === 0 ? 'A' : 'B'))
    save({ teamAName: 'Team USA', teamBName: 'Team Europe', teamOf })
  }
  function assign(memberId: string, side: CupSide) {
    if (!config) return
    save({ ...config, teamOf: { ...config.teamOf, [memberId]: side } })
  }
  function rename(which: 'teamAName' | 'teamBName', name: string) {
    if (!config) return
    save({ ...config, [which]: name })
  }
  async function addMatch(course: string, formatKey: string) {
    if (adding) return
    setAdding(true)
    try {
      const r = await addRound(id, course || 'Match')
      await saveRoundGame(r.id, formatKey)
      reload()
      router.push({ pathname: '/shared/[id]/round/[roundId]', params: { id, roundId: r.id } })
    } catch {
      Alert.alert("Couldn't add the match", 'Check your connection and try again.')
    } finally {
      setAdding(false)
    }
  }
  const openRound = (roundId: string) => router.push({ pathname: '/shared/[id]/round/[roundId]', params: { id, roundId } })

  let body
  if (!ready) body = <SharedLoading />
  else if (!user) body = <SharedSignInPrompt what="The Cup" next={`/shared/${id}/cup`} />
  else if (load === 'loading') body = <SharedLoading label="Loading The Cup…" />
  else if (load === 'error')
    body = (
      <SharedError
        message="Couldn't load The Cup. Check your connection and try again."
        onRetry={() => {
          setLoad('loading')
          reload()
        }}
        onBack={() => backToSharedTrip(id)}
      />
    )
  else if (!config)
    body = (
      <>
        <PageTitle sub="Two teams across the whole trip, points tallied live.">The Cup</PageTitle>
        <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
          <Text style={{ fontSize: 40, marginBottom: 8 }}>🏆</Text>
          <T style={{ textAlign: 'center', color: colors.muted }}>
            Split the group into two teams, then add matches and pick a format for each.
          </T>
          <Button title="Start The Cup" variant="gold" onPress={startCup} style={{ marginTop: 16, alignSelf: 'stretch' }} />
        </Card>
        <Button title="← Back to trip" variant="ghost" onPress={() => backToSharedTrip(id)} style={{ marginTop: 16 }} />
      </>
    )
  else {
    const s = cupStandings(config, rws)
    const sideA = members.filter((m) => config.teamOf[m.id] === 'A')
    const sideB = members.filter((m) => config.teamOf[m.id] === 'B')
    const teamsReady = sideA.length > 0 && sideB.length > 0
    const local = toLocalMembers(members)
    body = (
      <>
        <PageTitle>The Cup</PageTitle>
        <SharedCupBoard config={config} s={s} />

        <SectionTitle>Teams</SectionTitle>
        <View style={cupSt.names}>
          <SharedCupTeamName
            key={`a-${config.teamAName}`}
            value={config.teamAName}
            color={TEAM_A}
            label="Team A name"
            onCommit={(n) => rename('teamAName', n)}
          />
          <T style={cupSt.vs}>vs</T>
          <SharedCupTeamName
            key={`b-${config.teamBName}`}
            value={config.teamBName}
            color={TEAM_B}
            label="Team B name"
            onCommit={(n) => rename('teamBName', n)}
          />
        </View>
        <Card style={{ paddingVertical: 6 }}>
          {members.map((m, i) => {
            const side = config.teamOf[m.id]
            return (
              <View key={m.id} style={[cupSt.row, i === members.length - 1 && { borderBottomWidth: 0 }]}>
                <Avatar member={local[i]} size={30} />
                <T style={cupSt.memberName} numberOfLines={1}>
                  {m.name}
                </T>
                <View style={cupSt.toggle}>
                  <SharedCupTeamButton label={config.teamAName} on={side === 'A'} color={TEAM_A} onPress={() => assign(m.id, 'A')} />
                  <SharedCupTeamButton label={config.teamBName} on={side === 'B'} color={TEAM_B} onPress={() => assign(m.id, 'B')} />
                </View>
              </View>
            )
          })}
        </Card>

        <SectionTitle>Matches</SectionTitle>
        {s.sessions.map((ses) => (
          <SharedCupMatchRow key={ses.round.id} ses={ses} config={config} onPress={() => openRound(ses.round.id)} />
        ))}
        {teamsReady ? (
          <SharedCupAddMatch busy={adding} onAdd={addMatch} />
        ) : (
          <Card>
            <Hint>Put at least one player on each team to add matches.</Hint>
          </Card>
        )}

        {teamsReady && <SharedCupPlayingOrder sessions={s.sessions} config={config} sideA={sideA} sideB={sideB} />}

        <Button title="← Back to trip" variant="ghost" onPress={() => backToSharedTrip(id)} style={{ marginTop: 16 }} />
      </>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: 'The Cup' }} />
      <Screen automaticallyAdjustKeyboardInsets>{body}</Screen>
    </>
  )
}
