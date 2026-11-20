import { Image } from 'expo-image'
import { Stack, router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { createSharedTrip, createSharedTripFromPackage } from '@shared/cloud'
import { PACKAGES, type TripPackage } from '@shared/packages'
import { Field, Input } from '@/components/Field'
import Screen from '@/components/Screen'
import { SharedLoading, SharedNotice } from '@/components/SharedParts'
import { Button, Card, Hint, PageTitle, SectionTitle, money } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { colors, fonts, shadow } from '@/theme'

function errorText(err: unknown): string {
  return err instanceof Error && err.message ? err.message : 'Could not create the trip. Check your connection and try again.'
}

export default function NewSharedTrip() {
  const ready = useAuth((s) => s.ready)
  const user = useAuth((s) => s.user)
  const [name, setName] = useState('')
  const [destination, setDestination] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const header = <Stack.Screen options={{ title: 'New shared trip' }} />

  if (!ready) {
    return (
      <Screen>
        {header}
        <SharedLoading />
      </Screen>
    )
  }

  if (!user) {
    return (
      <Screen>
        {header}
        <SharedNotice
          emoji="⛳"
          body="Sign in to create a shared trip your friends can join."
          action="Sign in"
          onAction={() => router.push({ pathname: '/signin', params: { next: '/shared/new' } })}
        />
      </Screen>
    )
  }

  async function pick(pkg: TripPackage) {
    if (busy) return
    setBusy(pkg.id)
    setError(null)
    try {
      const trip = await createSharedTripFromPackage(pkg.id, pkg.destination, pkg.title)
      router.replace({ pathname: '/shared/[id]', params: { id: trip.id } })
    } catch (err) {
      setError(errorText(err))
      setBusy(null)
    }
  }

  async function createCustom() {
    if (!name.trim() || busy) return
    setBusy('custom')
    setError(null)
    try {
      const trip = await createSharedTrip(name, destination)
      router.replace({ pathname: '/shared/[id]', params: { id: trip.id } })
    } catch (err) {
      setError(errorText(err))
      setBusy(null)
    }
  }

  return (
    <Screen>
      {header}
      <PageTitle sub="Pick the trip you're planning — everyone who joins sees its courses and can jump straight into a live scorecard.">
        Start a shared trip
      </PageTitle>

      {error ? <Hint style={st.error}>{error}</Hint> : null}

      <View style={{ gap: 10 }}>
        {PACKAGES.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => pick(p)}
            disabled={!!busy}
            accessibilityRole="button"
            accessibilityLabel={`${p.destination}, ${p.tierLabel}`}
            style={({ pressed }) => [st.pick, pressed && { opacity: 0.85 }, !!busy && busy !== p.id && { opacity: 0.5 }]}
          >
            <Image source={p.image} style={st.thumb} contentFit="cover" cachePolicy="memory-disk" transition={200} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[st.tier, p.tier === 'luxury' ? st.lux : st.val]}>{p.tierLabel}</Text>
              <Text style={st.dest} numberOfLines={1}>
                {p.destination.split(',')[0]}
              </Text>
              <Text style={st.meta} numberOfLines={1}>
                {p.courses.length} courses · {money(p.budgetMin)}–{money(p.budgetMax)}/pp
              </Text>
            </View>
            {busy === p.id ? <ActivityIndicator color={colors.green700} /> : <Text style={st.chev}>›</Text>}
          </Pressable>
        ))}
      </View>

      <SectionTitle>Or build a custom trip</SectionTitle>
      <Card>
        <Field label="Trip name">
          <Input
            value={name}
            onChangeText={setName}
            placeholder="e.g. Myrtle Beach Buddies Trip"
            returnKeyType="next"
            maxLength={80}
          />
        </Field>
        <Field label="Destination (optional)">
          <Input
            value={destination}
            onChangeText={setDestination}
            placeholder="e.g. Myrtle Beach, SC"
            returnKeyType="done"
            onSubmitEditing={createCustom}
            maxLength={80}
          />
        </Field>
        <Button
          title="Create custom trip"
          variant="gold"
          onPress={createCustom}
          loading={busy === 'custom'}
          disabled={!name.trim() || (!!busy && busy !== 'custom')}
        />
      </Card>
    </Screen>
  )
}

const st = StyleSheet.create({
  error: { color: colors.danger, marginBottom: 10, marginHorizontal: 4 },
  pick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.paper,
    borderRadius: 14,
    padding: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hair,
    ...shadow,
  },
  thumb: { width: 72, height: 72, borderRadius: 10, backgroundColor: colors.green100 },
  tier: {
    alignSelf: 'flex-start',
    fontFamily: fonts.sansBold,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  lux: { backgroundColor: '#f6ecc7', color: '#3a2e07' },
  val: { backgroundColor: colors.green100, color: '#133d12' },
  dest: { fontFamily: fonts.serif, fontSize: 21, color: colors.green900 },
  meta: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  chev: { fontSize: 24, color: colors.muted, marginRight: 4 },
})
