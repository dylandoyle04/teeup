import { router, useFocusEffect } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { useCallback, useState } from 'react'
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { listMyTrips, type SharedTrip } from '@shared/cloud'
import { useStore } from '@shared/store'
import Screen from '@/components/Screen'
import { SharedLoading, SharedNotice, SharedRow } from '@/components/SharedParts'
import { AvatarStack, Button, Card, PageTitle, Pill, SectionTitle, Serif, T, fmtDateRange, money } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { colors, fonts } from '@/theme'

const SAMPLE_TRIP_ID = 'trip_sample'

export default function Trips() {
  const trips = useStore((s) => s.trips)
  const tripMembers = useStore((s) => s.tripMembers)
  const sorted = [...trips].sort((a, b) => b.createdAt - a.createdAt)

  const authReady = useAuth((s) => s.ready)
  const userId = useAuth((s) => s.user?.id)
  // Shared trips are keyed by the user they were loaded for, so a sign-out /
  // account switch never shows someone else's list.
  const [shared, setShared] = useState<{ uid: string; trips: SharedTrip[]; failed: boolean } | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const sharedTrips = shared && shared.uid === userId ? shared : null

  const loadShared = useCallback(async () => {
    if (!userId) return
    try {
      const list = await listMyTrips()
      setShared({ uid: userId, trips: list, failed: false })
    } catch {
      setShared((prev) => ({ uid: userId, trips: prev?.uid === userId ? prev.trips : [], failed: true }))
    }
  }, [userId])

  // Reload whenever the tab comes back into view (after creating, joining or leaving a trip).
  useFocusEffect(
    useCallback(() => {
      loadShared()
    }, [loadShared]),
  )

  async function onRefresh() {
    setRefreshing(true)
    await loadShared()
    setRefreshing(false)
  }

  return (
    <Screen
      statusBarShield
      refreshControl={
        userId ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green700} /> : undefined
      }
    >
      <View style={st.titleRow}>
        <View style={{ flex: 1 }}>
          <PageTitle sub="Trips on this phone, plus trips you share with your crew.">My trips</PageTitle>
        </View>
        <Pressable
          onPress={() => router.push('/settings')}
          style={({ pressed }) => [st.gear, pressed && { opacity: 0.6 }]}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <SymbolView
            name="gearshape"
            size={24}
            tintColor={colors.green700}
            fallback={<Text style={{ fontSize: 22, color: colors.green700 }}>⚙︎</Text>}
          />
        </Pressable>
      </View>

      {sorted.length === 0 ? (
        <Card style={{ alignItems: 'center', gap: 12 }}>
          <Serif style={{ fontSize: 22, textAlign: 'center' }}>No trips yet</Serif>
          <T style={{ color: colors.muted, textAlign: 'center' }}>Pick a package or build your own to get started.</T>
          <Button title="Explore trips" onPress={() => router.push('/explore')} />
        </Card>
      ) : (
        <View style={{ gap: 12 }}>
          {sorted.map((trip) => {
            const members = tripMembers(trip.id)
            return (
              <Pressable
                key={trip.id}
                onPress={() => router.push({ pathname: '/trip/[tripId]/setup', params: { tripId: trip.id } })}
                style={({ pressed }) => [pressed && { opacity: 0.85 }]}
                accessibilityRole="button"
              >
                  <Card style={{ padding: 0, overflow: 'hidden' }}>
                    <View style={st.banner}>
                      {trip.id === SAMPLE_TRIP_ID ? (
                        <View style={st.example}>
                          <Text style={st.exampleText}>EXAMPLE</Text>
                        </View>
                      ) : null}
                      <Serif style={{ color: '#fff', fontSize: 24 }}>{trip.name}</Serif>
                      <T style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
                        📍 {trip.destination || 'Destination TBD'} · {fmtDateRange(trip.startDate, trip.endDate)}
                      </T>
                    </View>
                    <View style={st.meta}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <AvatarStack members={members} />
                        <T style={{ color: colors.muted, fontSize: 13 }}>
                          {members.length} {members.length === 1 ? 'player' : 'players'}
                        </T>
                      </View>
                      <Pill tone="gold">
                        {money(trip.budgetMin)}–{money(trip.budgetMax)}/pp
                      </Pill>
                    </View>
                  </Card>
              </Pressable>
            )
          })}
          <Button title="+ New trip" variant="ghost" onPress={() => router.push('/new')} style={{ marginTop: 8 }} />
        </View>
      )}

      <SectionTitle>Shared trips</SectionTitle>
      {!authReady ? (
        <SharedLoading />
      ) : !userId ? (
        <SharedNotice
          emoji="⛳"
          title="Share trips & score live with your crew"
          body="Sign in to create a trip your friends can join from a link — everyone keeps score together on their own phone."
          action="Sign in"
          onAction={() => router.push({ pathname: '/signin', params: { next: '/trips' } })}
        />
      ) : !sharedTrips ? (
        <SharedLoading />
      ) : (
        <View style={{ gap: 12 }}>
          {sharedTrips.failed ? (
            <SharedNotice
              body="Couldn’t load your shared trips. Check your connection and pull down to try again."
              secondary="Try again"
              onSecondary={onRefresh}
            />
          ) : sharedTrips.trips.length === 0 ? (
            <SharedNotice body="No shared trips yet — create one, then send your crew the invite link." />
          ) : (
            <Card style={{ paddingVertical: 4 }}>
              {sharedTrips.trips.map((t, i) => (
                <SharedRow
                  key={t.id}
                  first={i === 0}
                  title={t.name}
                  sub={t.destination}
                  onPress={() => router.push({ pathname: '/shared/[id]', params: { id: t.id } })}
                />
              ))}
            </Card>
          )}
          <Button title="+ New shared trip" variant="gold" onPress={() => router.push('/shared/new')} />
        </View>
      )}
    </Screen>
  )
}

const st = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  gear: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -8, marginTop: -2 },
  example: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  exampleText: { fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1, color: '#2b2205' },
  banner: { backgroundColor: colors.green700, padding: 16, gap: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
})
