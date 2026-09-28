import { router } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import { useStore } from '@shared/store'
import type { HotelTier } from '@shared/types'
import { DateInput, Field, Input, Row } from '@/components/Field'
import Screen from '@/components/Screen'
import { Button, Card, Hint, PageTitle, Segmented, T, Toggle } from '@/components/ui'

const TIERS: { value: HotelTier; label: string }[] = [
  { value: 'budget', label: 'Budget' },
  { value: 'midrange', label: 'Mid-range' },
  { value: 'luxury', label: 'Luxury' },
]

export default function NewTrip() {
  const createTrip = useStore((s) => s.createTrip)
  const [name, setName] = useState('')
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [budgetMin, setBudgetMin] = useState('500')
  const [budgetMax, setBudgetMax] = useState('1000')
  const [hotelTier, setHotelTier] = useState<HotelTier>('midrange')
  const [needsFlights, setNeedsFlights] = useState(false)

  const canSubmit = name.trim().length > 0

  function submit() {
    if (!canSubmit) return
    const id = createTrip({
      name: name.trim(),
      destination: destination.trim(),
      startDate,
      endDate,
      budgetMin: Number(budgetMin) || 0,
      budgetMax: Number(budgetMax) || 0,
      hotelTier,
      needsFlights,
    })
    router.dismissTo({ pathname: '/trip/[tripId]/setup', params: { tripId: id } })
  }

  return (
    <Screen>
      <PageTitle sub="You're the organizer — book the trip, then invite friends to join the scorecard.">
        Set up the trip
      </PageTitle>
      <Card>
        <Field label="Trip name">
          <Input value={name} onChangeText={setName} placeholder="e.g. Myrtle Beach Buddies Trip" autoFocus returnKeyType="next" />
        </Field>
        <Field label="Destination">
          <Input value={destination} onChangeText={setDestination} placeholder="e.g. Myrtle Beach, SC" />
        </Field>
        <Row>
          <Field label="Start date">
            <DateInput value={startDate} onChange={setStartDate} />
          </Field>
          <Field label="End date">
            <DateInput value={endDate} onChange={setEndDate} minimumDate={startDate || undefined} />
          </Field>
        </Row>
        <Row>
          <Field label="Budget min /pp">
            <Input value={budgetMin} onChangeText={setBudgetMin} keyboardType="number-pad" />
          </Field>
          <Field label="Budget max /pp">
            <Input value={budgetMax} onChangeText={setBudgetMax} keyboardType="number-pad" />
          </Field>
        </Row>
        <Field label="Hotel preference" hint="Sets the vibe for hotel options.">
          <Segmented options={TIERS} value={hotelTier} onChange={setHotelTier} />
        </Field>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <View>
            <T style={{ fontWeight: '700' }}>Need flights?</T>
            <Hint>Driving in? Leave this off.</Hint>
          </View>
          <Toggle on={needsFlights} onChange={setNeedsFlights} />
        </View>
        <Button title="Create trip" onPress={submit} disabled={!canSubmit} />
      </Card>
    </Screen>
  )
}
