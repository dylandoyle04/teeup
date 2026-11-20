import { Stack, router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { joinByCode } from '@shared/cloud'
import { Field, Input } from '@/components/Field'
import Screen from '@/components/Screen'
import { SharedLoading, SharedNotice } from '@/components/SharedParts'
import { Button, Card, Hint, PageTitle } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { colors } from '@/theme'

interface Lookup {
  key: string
  /** set when you're already a member (RLS only lets members read the trip) */
  existing: { id: string; name: string } | null
  profileName: string | null
}

function joinError(err: unknown): string {
  const msg = err instanceof Error ? err.message : typeof err === 'object' && err && 'message' in err ? String(err.message) : ''
  if (/not found/i.test(msg)) {
    return 'This invite link is invalid or the trip was deleted. Ask the organizer to send a fresh link.'
  }
  if (/fetch|network|timed? ?out/i.test(msg)) return 'Couldn’t reach Flagstick Finder. Check your connection and try again.'
  return msg || 'Could not join this trip. Please try again.'
}

export default function JoinTrip() {
  const params = useLocalSearchParams<{ code: string }>()
  const code = (params.code ?? '').trim()
  const ready = useAuth((s) => s.ready)
  const user = useAuth((s) => s.user)
  const userId = user?.id
  const emailName = user?.email?.split('@')[0] ?? ''

  const [lookup, setLookup] = useState<Lookup | null>(null)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const key = `${userId ?? ''}:${code}`
  const info: Lookup | null = !supabase
    ? { key, existing: null, profileName: null }
    : lookup && lookup.key === key
      ? lookup
      : null

  // Signed in: see if you're already on this trip, and prefill your display name from your profile.
  useEffect(() => {
    if (!userId || !code || !supabase) return
    const client = supabase
    let alive = true
    Promise.all([
      client.from('trips').select('id, name').eq('invite_code', code).maybeSingle(),
      client.from('profiles').select('name').eq('id', userId).maybeSingle(),
    ])
      .then(([t, p]) => {
        if (!alive) return
        const existing = t.data ? { id: t.data.id as string, name: t.data.name as string } : null
        const profileName = (p.data?.name as string | null | undefined) || null
        setLookup({ key, existing, profileName })
        if (profileName) setName((prev) => prev || profileName)
      })
      .catch(() => {
        if (alive) setLookup({ key, existing: null, profileName: null })
      })
    return () => {
      alive = false
    }
  }, [userId, code, key])

  const header = <Stack.Screen options={{ title: 'Join trip' }} />

  if (!code) {
    return (
      <Screen>
        {header}
        <SharedNotice
          body="This invite link is missing its trip code. Ask the organizer to send the link again."
          action="Go to my trips"
          onAction={() => router.replace('/trips')}
        />
      </Screen>
    )
  }

  if (!ready) {
    return (
      <Screen>
        {header}
        <SharedLoading />
      </Screen>
    )
  }

  // Must be signed in to join — sign in, then come straight back here.
  if (!user) {
    return (
      <Screen>
        {header}
        <SharedNotice
          emoji="⛳"
          title="You’re invited!"
          body="You’ve been invited to a golf trip on Flagstick Finder. Sign in to join — then you can see the plan and keep score live with the group."
          action="Sign in to join"
          onAction={() => router.push({ pathname: '/signin', params: { next: `/join/${code}` } })}
        />
      </Screen>
    )
  }

  if (!info) {
    return (
      <Screen>
        {header}
        <SharedLoading label="Opening your invite…" />
      </Screen>
    )
  }

  if (info.existing) {
    const tripId = info.existing.id
    return (
      <Screen>
        {header}
        <SharedNotice
          emoji="✅"
          title={info.existing.name}
          body="You’re already on this trip."
          action="Open trip"
          onAction={() => router.replace({ pathname: '/shared/[id]', params: { id: tripId } })}
        />
      </Screen>
    )
  }

  async function join() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const tripId = await joinByCode(code, name.trim() || info?.profileName || emailName || 'Player')
      router.replace({ pathname: '/shared/[id]', params: { id: tripId } })
    } catch (err) {
      setError(joinError(err))
      setBusy(false)
    }
  }

  return (
    <Screen>
      {header}
      <PageTitle sub="You’ve been invited to a golf trip on Flagstick Finder.">Join the trip</PageTitle>
      <Card>
        <Field label="Your name" hint="How you’ll show up on the scorecard.">
          <Input
            value={name}
            onChangeText={setName}
            placeholder={info.profileName || emailName || 'Your name'}
            autoFocus
            autoCapitalize="words"
            textContentType="name"
            returnKeyType="join"
            onSubmitEditing={join}
            maxLength={40}
          />
        </Field>
        {error ? <Hint style={{ color: colors.danger, marginBottom: 10 }}>{error}</Hint> : null}
        <Button title="Join trip" variant="gold" onPress={join} loading={busy} />
      </Card>
      <Button
        title="Not now"
        variant="subtle"
        small
        onPress={() => router.replace('/trips')}
        style={{ alignSelf: 'center', marginTop: 16 }}
      />
    </Screen>
  )
}
