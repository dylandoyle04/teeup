import * as Clipboard from 'expo-clipboard'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Stack, router, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, RefreshControl, Share, StyleSheet, Text, View } from 'react-native'
import {
  addRound,
  deleteSharedTrip,
  getOrCreateRound,
  getSharedTrip,
  inviteUrl,
  leaveTrip,
  listMembers,
  listRounds,
  type SharedMember,
  type SharedRound,
  type SharedTrip,
} from '@shared/cloud'
import { getPackage } from '@shared/packages'
import Screen from '@/components/Screen'
import { SharedAvatar, SharedLoading, SharedNotice, SharedRow } from '@/components/SharedParts'
import { Button, Card, Hint, Pill, SectionTitle, T } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { colors, fonts } from '@/theme'

interface Loaded {
  id: string
  trip: SharedTrip | null
  members: SharedMember[]
  rounds: SharedRound[]
  failed: boolean
}

// Built as strings so these links type-check whether or not the round / cup
// screens (owned by another module) exist yet in the typed-routes manifest.
const roundHref = (tripId: string, roundId: string) => `/shared/${tripId}/round/${roundId}` as Href
const cupHref = (tripId: string) => `/shared/${tripId}/cup` as Href

const parTotal = (r: SharedRound) => r.holePars.reduce((a, b) => a + b, 0)

export default function SharedTripScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>()
  const ready = useAuth((s) => s.ready)
  const userId = useAuth((s) => s.user?.id)

  const [data, setData] = useState<Loaded | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [opening, setOpening] = useState<string | null>(null)
  const [addingRound, setAddingRound] = useState(false)
  const [copied, setCopied] = useState(false)
  const [removing, setRemoving] = useState(false)

  const loaded = data && data.id === id ? data : null

  const load = useCallback(async () => {
    if (!userId || !id) return
    try {
      const [trip, members, rounds] = await Promise.all([getSharedTrip(id), listMembers(id), listRounds(id)])
      setData({ id, trip, members, rounds, failed: false })
    } catch {
      setData((prev) =>
        prev && prev.id === id ? { ...prev, failed: true } : { id, trip: null, members: [], rounds: [], failed: true },
      )
    }
  }, [id, userId])

  // Load on focus, so coming back from a scorecard shows new rounds.
  useFocusEffect(
    useCallback(() => {
      load()
    }, [load]),
  )

  // Live roster + rounds: refresh when anyone joins/leaves or adds a round.
  useEffect(() => {
    if (!supabase || !userId || !id) return
    const client = supabase
    const refreshMembers = () => {
      listMembers(id)
        .then((members) => setData((prev) => (prev && prev.id === id ? { ...prev, members } : prev)))
        .catch(() => {})
    }
    const refreshRounds = () => {
      listRounds(id)
        .then((rounds) => setData((prev) => (prev && prev.id === id ? { ...prev, rounds } : prev)))
        .catch(() => {})
    }
    const ch = client
      .channel(`app-shared-trip-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_members', filter: `trip_id=eq.${id}` }, refreshMembers)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds', filter: `trip_id=eq.${id}` }, refreshRounds)
      .subscribe()
    return () => {
      client.removeChannel(ch)
    }
  }, [id, userId])

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const trip = loaded?.trip ?? null
  const header = <Stack.Screen options={{ title: trip?.name ?? 'Shared trip' }} />

  if (!ready || (userId && !loaded)) {
    return (
      <Screen>
        {header}
        <SharedLoading />
      </Screen>
    )
  }

  if (!userId) {
    return (
      <Screen>
        {header}
        <SharedNotice
          emoji="⛳"
          body="Sign in to view this shared trip."
          action="Sign in"
          onAction={() => router.push({ pathname: '/signin', params: { next: `/shared/${id}` } })}
        />
      </Screen>
    )
  }

  if (!trip || !loaded) {
    return (
      <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green700} />}>
        {header}
        <SharedNotice
          body={
            loaded?.failed
              ? 'Couldn’t load this trip. Check your connection and try again.'
              : 'This trip doesn’t exist, was deleted, or you’re not a member. If you’re offline, try again once you’re connected.'
          }
          action="Try again"
          onAction={onRefresh}
          secondary="Back to my trips"
          onSecondary={() => router.replace('/trips')}
        />
      </Screen>
    )
  }

  const { members, rounds } = loaded
  const isOrganizer = trip.organizerId === userId
  const pkg = trip.sourcePackageId ? getPackage(trip.sourcePackageId) : undefined
  const roundByCourse = new Map(rounds.map((r) => [r.courseName, r]))
  const extraRounds = pkg ? rounds.filter((r) => !pkg.courses.some((c) => c.name === r.courseName)) : rounds
  const link = inviteUrl(trip.inviteCode)
  const tripName = trip.name

  function invite() {
    Share.share(
      {
        // link only in the message — passing `url` too makes Messages paste it twice
        message: `Join "${tripName}" on Flagstick Finder — we'll keep score together live: ${link}`,
      },
      { subject: `Join ${tripName} on Flagstick Finder` },
    ).catch(() => {})
  }

  async function copyLink() {
    await Clipboard.setStringAsync(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Tap a course → open (or start) its live scorecard.
  async function openCourse(courseName: string) {
    if (opening) return
    setOpening(courseName)
    try {
      const r = await getOrCreateRound(id, courseName)
      router.push(roundHref(id, r.id))
    } catch {
      Alert.alert('Couldn’t open that course', 'Check your connection and try again.')
    } finally {
      setOpening(null)
    }
  }

  async function createRound(name: string) {
    setAddingRound(true)
    try {
      const r = await addRound(id, name)
      router.push(roundHref(id, r.id))
    } catch {
      Alert.alert('Couldn’t add the round', 'Check your connection and try again.')
    } finally {
      setAddingRound(false)
    }
  }

  function newRound() {
    if (addingRound) return
    Alert.prompt(
      'New round',
      'Course name for this round?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add', onPress: (value?: string) => createRound(value ?? '') },
      ],
      'plain-text',
      '',
      'default',
    )
  }

  function confirmRemove() {
    const title = isOrganizer ? `Delete "${tripName}"?` : `Leave "${tripName}"?`
    const msg = isOrganizer
      ? 'This deletes the trip, its rounds and scores for everyone. It can’t be undone.'
      : 'You’ll need a new invite to rejoin.'
    Alert.alert(title, msg, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: isOrganizer ? 'Delete trip' : 'Leave trip',
        style: 'destructive',
        onPress: async () => {
          setRemoving(true)
          try {
            if (isOrganizer) await deleteSharedTrip(id)
            else await leaveTrip(id)
            router.replace('/trips')
          } catch {
            setRemoving(false)
            Alert.alert(
              isOrganizer ? 'Couldn’t delete the trip' : 'Couldn’t leave the trip',
              'Check your connection and try again.',
            )
          }
        },
      },
    ])
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green700} />}>
      {header}

      {/* Trip header */}
      <View style={st.hero}>
        {pkg ? (
          <>
            <Image source={pkg.image} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" transition={250} />
            <LinearGradient
              colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.65)']}
              locations={[0.2, 1]}
              style={StyleSheet.absoluteFill}
            />
          </>
        ) : null}
        <View style={st.heroBody}>
          {trip.destination ? <Text style={st.heroLoc}>📍 {trip.destination}</Text> : null}
          <Text style={st.heroTitle}>{trip.name}</Text>
          <Text style={st.heroMeta}>
            {members.length} {members.length === 1 ? 'player' : 'players'}
            {pkg ? ` · ${pkg.courses.length} courses` : ''}
          </Text>
        </View>
      </View>

      {loaded.failed ? (
        <Hint style={{ color: colors.danger, marginTop: 10, marginHorizontal: 4 }}>
          Couldn’t refresh — showing the last loaded info. Pull down to retry.
        </Hint>
      ) : null}

      {/* Invite */}
      <SectionTitle>Invite your group</SectionTitle>
      <Card style={{ gap: 10 }}>
        <Hint>Send this link — anyone who opens it can sign in and join the trip.</Hint>
        <View style={st.linkBox}>
          <Text selectable style={st.linkText} numberOfLines={1}>
            {link}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button title="Invite friends" variant="gold" onPress={invite} style={{ flex: 2 }} />
          <Button title={copied ? 'Copied ✓' : 'Copy link'} variant="subtle" onPress={copyLink} style={{ flex: 1 }} />
        </View>
      </Card>

      {/* Courses / rounds */}
      {pkg ? (
        <>
          <SectionTitle>Courses</SectionTitle>
          <Hint style={{ marginTop: -6, marginBottom: 10, marginHorizontal: 4 }}>
            Tap a course to open its live scorecard and pick how you’re playing.
          </Hint>
          <View style={{ gap: 10 }}>
            {pkg.courses.map((c) => {
              const started = roundByCourse.get(c.name)
              return (
                <Pressable
                  key={c.slug}
                  onPress={() => openCourse(c.name)}
                  disabled={!!opening}
                  accessibilityRole="button"
                  accessibilityLabel={`${c.name}, ${started ? 'in progress' : 'start scoring'}`}
                  style={({ pressed }) => [st.course, pressed && { opacity: 0.85 }]}
                >
                  {c.images[0] ? (
                    <Image source={c.images[0]} style={st.courseThumb} contentFit="cover" cachePolicy="memory-disk" />
                  ) : (
                    <View style={st.courseThumb} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={st.courseName} numberOfLines={2}>
                      {c.name}
                    </Text>
                    <Text style={st.courseMeta}>
                      {started ? `In progress · par ${parTotal(started)}` : 'Tap to start scoring'}
                    </Text>
                  </View>
                  {opening === c.name ? (
                    <ActivityIndicator color={colors.green700} />
                  ) : (
                    <View style={[st.go, started && st.goLive]}>
                      <Text style={[st.goText, started && { color: '#2b2205' }]}>{started ? 'Score' : 'Start'}</Text>
                    </View>
                  )}
                </Pressable>
              )
            })}
          </View>
          {extraRounds.length > 0 ? (
            <Card style={{ marginTop: 12, paddingVertical: 4 }}>
              {extraRounds.map((r, i) => (
                <SharedRow
                  key={r.id}
                  first={i === 0}
                  title={r.courseName}
                  sub={`Live scorecard · par ${parTotal(r)}`}
                  onPress={() => router.push(roundHref(id, r.id))}
                />
              ))}
            </Card>
          ) : null}
          <Button
            title="+ Add another course"
            variant="ghost"
            onPress={newRound}
            loading={addingRound}
            style={{ marginTop: 12 }}
          />
        </>
      ) : (
        <>
          <SectionTitle>Rounds</SectionTitle>
          <Card style={{ gap: 6 }}>
            {rounds.length === 0 ? (
              <T style={{ color: colors.muted }}>No rounds yet.</T>
            ) : (
              rounds.map((r, i) => (
                <SharedRow
                  key={r.id}
                  first={i === 0}
                  title={r.courseName}
                  sub={`Live scorecard · par ${parTotal(r)}`}
                  onPress={() => router.push(roundHref(id, r.id))}
                />
              ))
            )}
            <Button title="+ New round" variant="gold" onPress={newRound} loading={addingRound} style={{ marginTop: 6 }} />
          </Card>
        </>
      )}

      {/* The Cup */}
      <SectionTitle>The Cup</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        <SharedRow
          first
          title="🏆 The Cup"
          sub="Two teams, live points across the trip"
          onPress={() => router.push(cupHref(id))}
        />
      </Card>

      {/* Players */}
      <SectionTitle>
        Players <Text style={{ color: colors.muted, fontSize: 20 }}>({members.length})</Text>
      </SectionTitle>
      <Card style={{ paddingVertical: 6 }}>
        {members.length === 0 ? (
          <T style={{ color: colors.muted, paddingVertical: 8 }}>No one’s joined yet.</T>
        ) : (
          members.map((m, i) => (
            <View key={m.id} style={[st.member, i > 0 && st.memberDivider]}>
              <SharedAvatar name={m.name} />
              <T style={{ flex: 1, fontFamily: fonts.sansSemi }} numberOfLines={1}>
                {m.name}
                {m.userId === userId ? <Text style={{ color: colors.muted, fontFamily: fonts.sans }}> (you)</Text> : null}
              </T>
              {m.isOrganizer ? <Pill>Organizer</Pill> : null}
            </View>
          ))
        )}
      </Card>

      <Button
        title={isOrganizer ? 'Delete trip' : 'Leave trip'}
        variant="danger"
        onPress={confirmRemove}
        loading={removing}
        style={{ marginTop: 28 }}
      />
    </Screen>
  )
}

const st = StyleSheet.create({
  hero: {
    minHeight: 170,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.green700,
    justifyContent: 'flex-end',
  },
  heroBody: { padding: 18, gap: 2 },
  heroLoc: { fontFamily: fonts.sansSemi, fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  heroTitle: { fontFamily: fonts.serif, fontSize: 32, lineHeight: 36, color: '#fff' },
  heroMeta: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  linkBox: {
    backgroundColor: colors.cream,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  linkText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.green700 },
  course: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.paper,
    borderRadius: 14,
    padding: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hair,
  },
  courseThumb: { width: 60, height: 60, borderRadius: 10, backgroundColor: colors.green100 },
  courseName: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.ink },
  courseMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },
  go: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.green700,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  goLive: { backgroundColor: colors.gold, borderColor: colors.gold },
  goText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.green700 },
  member: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  memberDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
})
