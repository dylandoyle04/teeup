import { Link, router } from 'expo-router'
import { Pressable, StyleSheet, View } from 'react-native'
import { useStore } from '@shared/store'
import Screen from '@/components/Screen'
import { AvatarStack, Button, Card, PageTitle, Pill, Serif, T, fmtDateRange, money } from '@/components/ui'
import { colors } from '@/theme'

export default function Trips() {
  const trips = useStore((s) => s.trips)
  const tripMembers = useStore((s) => s.tripMembers)
  const sorted = [...trips].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <Screen>
      <PageTitle sub="Trips saved on this phone.">My trips</PageTitle>

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
              <Link key={trip.id} href={{ pathname: '/trip/[tripId]/setup', params: { tripId: trip.id } }} asChild>
                <Pressable style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
                  <Card style={{ padding: 0, overflow: 'hidden' }}>
                    <View style={st.banner}>
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
              </Link>
            )
          })}
          <Button title="+ New trip" variant="ghost" onPress={() => router.push('/new')} style={{ marginTop: 8 }} />
        </View>
      )}
    </Screen>
  )
}

const st = StyleSheet.create({
  banner: { backgroundColor: colors.green700, padding: 16, gap: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
})
