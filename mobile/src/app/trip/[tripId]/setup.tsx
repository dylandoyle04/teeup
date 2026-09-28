import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { useStore } from '@shared/store'
import type { HotelTier } from '@shared/types'
import { DateInput, Field, Input, Row } from '@/components/Field'
import Screen from '@/components/Screen'
import {
  Avatar,
  Button,
  Card,
  Hint,
  Pill,
  SectionTitle,
  Segmented,
  Serif,
  T,
  Toggle,
  fmtDateRange,
  money,
} from '@/components/ui'
import { colors, fonts } from '@/theme'

const TIERS: { value: HotelTier; label: string }[] = [
  { value: 'budget', label: 'Budget' },
  { value: 'midrange', label: 'Mid-range' },
  { value: 'luxury', label: 'Luxury' },
]

export default function TripSetup() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>()
  const trip = useStore((s) => s.getTrip(tripId))
  const members = useStore((s) => s.tripMembers(tripId))
  const currentMemberId = useStore((s) => s.currentMemberId)
  const addMember = useStore((s) => s.addMember)
  const removeMember = useStore((s) => s.removeMember)
  const updateTrip = useStore((s) => s.updateTrip)
  const deleteTrip = useStore((s) => s.deleteTrip)

  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState(false)

  if (!trip) {
    return (
      <Screen>
        <Card style={{ alignItems: 'center', gap: 12 }}>
          <T>That trip doesn&apos;t exist.</T>
          <Button title="Back to trips" variant="subtle" small onPress={() => router.replace('/trips')} />
        </Card>
      </Screen>
    )
  }

  const tierLabel = TIERS.find((t) => t.value === trip.hotelTier)?.label ?? 'Mid-range'

  function add() {
    addMember(tripId, newName)
    setNewName('')
  }

  function confirmDelete() {
    Alert.alert(`Delete "${trip!.name}"?`, "This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete trip',
        style: 'destructive',
        onPress: () => {
          router.replace('/trips')
          deleteTrip(tripId)
        },
      },
    ])
  }

  return (
    <Screen>
      {/* Trip header / organizer setup */}
      <Card>
        <View style={st.between}>
          <Serif style={st.title}>{trip.name}</Serif>
          <Button title={editing ? '✓ Done' : '✏️ Edit'} small variant="subtle" onPress={() => setEditing((v) => !v)} />
        </View>

        {!editing ? (
          <View style={{ marginTop: 10, gap: 8 }}>
            <T style={st.muted}>📍 {trip.destination || 'Destination TBD'}</T>
            <T style={st.muted}>🗓️ {fmtDateRange(trip.startDate, trip.endDate)}</T>
            <View style={st.tags}>
              <Pill tone="gold">
                {money(trip.budgetMin)}–{money(trip.budgetMax)}/pp
              </Pill>
              <Pill>🏨 {tierLabel}</Pill>
              {trip.needsFlights ? <Pill tone="gold">✈️ Flights needed</Pill> : <GrayPill>✈️ Driving</GrayPill>}
            </View>
            {trip.notes ? <T style={[st.muted, { fontSize: 14, marginTop: 4 }]}>“{trip.notes}”</T> : null}
          </View>
        ) : (
          <View style={{ marginTop: 12 }}>
            <Field label="Trip name">
              <Input value={trip.name} onChangeText={(v) => updateTrip(tripId, { name: v })} />
            </Field>
            <Field label="Destination">
              <Input value={trip.destination} onChangeText={(v) => updateTrip(tripId, { destination: v })} />
            </Field>
            <Row>
              <Field label="Start">
                <DateInput value={trip.startDate} onChange={(v) => updateTrip(tripId, { startDate: v })} />
              </Field>
              <Field label="End">
                <DateInput
                  value={trip.endDate}
                  minimumDate={trip.startDate || undefined}
                  onChange={(v) => updateTrip(tripId, { endDate: v })}
                />
              </Field>
            </Row>
            <Row>
              <Field label="Budget min">
                <NumberInput value={trip.budgetMin} onChange={(n) => updateTrip(tripId, { budgetMin: n })} />
              </Field>
              <Field label="Budget max">
                <NumberInput value={trip.budgetMax} onChange={(n) => updateTrip(tripId, { budgetMax: n })} />
              </Field>
            </Row>
            <Field label="Hotel preference">
              <Segmented options={TIERS} value={trip.hotelTier} onChange={(v) => updateTrip(tripId, { hotelTier: v })} />
            </Field>
            <View style={st.toggleRow}>
              <View style={{ flex: 1 }}>
                <T style={{ fontFamily: fonts.sansBold }}>Need flights?</T>
                <Hint>Driving in? Leave this off.</Hint>
              </View>
              <Toggle on={trip.needsFlights} onChange={(v) => updateTrip(tripId, { needsFlights: v })} />
            </View>
            <Field label="Notes for the group">
              <Input
                multiline
                value={trip.notes}
                onChangeText={(v) => updateTrip(tripId, { notes: v })}
                placeholder="Travel plan, must-play course, anything to flag…"
                style={{ minHeight: 70, textAlignVertical: 'top' }}
              />
            </Field>
          </View>
        )}
      </Card>

      {/* Members */}
      <SectionTitle>The Group · {members.length}</SectionTitle>
      <Card>
        {members.map((m, i) => (
          <View key={m.id} style={[st.listRow, i === members.length - 1 && { borderBottomWidth: 0 }]}>
            <Avatar member={m} />
            <View style={st.memberName}>
              <T style={{ fontFamily: fonts.sansBold }}>{m.name}</T>
              {m.id === trip.organizerId && <Pill tone="gold">organizer</Pill>}
              {m.id === currentMemberId && m.id !== trip.organizerId && <GrayPill>you</GrayPill>}
            </View>
            {members.length > 1 && m.id !== trip.organizerId && (
              <Pressable
                onPress={() => removeMember(tripId, m.id)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${m.name}`}
                style={{ padding: 4 }}
              >
                <Text style={st.iconBtn}>✕</Text>
              </Pressable>
            )}
          </View>
        ))}

        <View style={[st.addRow, { marginTop: 12 }]}>
          <Input
            style={{ flex: 1 }}
            placeholder="Invite a buddy by name"
            value={newName}
            onChangeText={setNewName}
            onSubmitEditing={add}
            returnKeyType="done"
            submitBehavior="submit"
            autoCapitalize="words"
          />
          <Button title="Add" small onPress={add} />
        </View>
        <Hint style={{ marginTop: 8 }}>
          Add names to keep score on this phone — or share the trip link below so friends join and score from their own.
        </Hint>

        <View style={st.shareBox}>
          <T style={{ fontFamily: fonts.sansBold, marginBottom: 6 }}>🔗 Share the trip link</T>
          <Hint>Sign-in and invite links are coming to the app soon.</Hint>
        </View>
      </Card>

      <Button
        title="Go to the scorecard →"
        variant="gold"
        style={{ marginTop: 20 }}
        onPress={() => router.replace({ pathname: '/trip/[tripId]/score', params: { tripId } })}
      />
      <Button title="← Back to all trips" variant="ghost" style={{ marginTop: 10 }} onPress={() => router.replace('/trips')} />

      <View style={{ marginTop: 24, alignItems: 'center' }}>
        <Button title="Delete trip" small variant="danger" onPress={confirmDelete} />
      </View>
    </Screen>
  )
}

function GrayPill({ children }: { children: React.ReactNode }) {
  return (
    <View style={st.grayPill}>
      <Text style={st.grayPillText}>{children}</Text>
    </View>
  )
}

/** Numeric field that lets the user clear it while typing. */
function NumberInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null)
  return (
    <Input
      keyboardType="number-pad"
      returnKeyType="done"
      value={draft ?? String(value)}
      onChangeText={(t) => {
        const clean = t.replace(/[^0-9]/g, '')
        setDraft(clean)
        onChange(Number(clean))
      }}
      onBlur={() => setDraft(null)}
    />
  )
}

const st = StyleSheet.create({
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { flex: 1, fontSize: 30, lineHeight: 34 },
  muted: { color: colors.muted },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  memberName: { flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  iconBtn: { fontSize: 18, color: colors.muted },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shareBox: { marginTop: 14, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 14 },
  grayPill: {
    backgroundColor: '#eef1ec',
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  grayPillText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.muted },
})
