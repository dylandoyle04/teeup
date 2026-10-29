import { router } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useStore } from '@shared/store'
import Screen from '@/components/Screen'
import { AvatarStack, Button, Card, PageTitle, Pill, Serif, T, fmtDateRange, money } from '@/components/ui'
import { colors, fonts } from '@/theme'

const SAMPLE_TRIP_ID = 'trip_sample'

export default function Trips() {
  const trips = useStore((s) => s.trips)
  const tripMembers = useStore((s) => s.tripMembers)
  const sorted = [...trips].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <Screen>
      <View style={st.titleRow}>
        <View style={{ flex: 1 }}>
          <PageTitle sub="Trips saved on this phone.">My trips</PageTitle>
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
