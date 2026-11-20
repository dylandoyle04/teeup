import { router, useLocalSearchParams, type Href } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import { Field, Input } from '@/components/Field'
import Screen from '@/components/Screen'
import { Button, Card, Hint, PageTitle, T } from '@/components/ui'
import { sendCode, useAuth, verifyCode } from '@/lib/auth'
import { fetchProfileName, NAME_MAX, needsName, saveProfileName } from '@/lib/profile'
import { supabase } from '@/lib/supabase'
import { colors, fonts } from '@/theme'

type Step = 'email' | 'code' | 'name'

const RESEND_SECONDS = 30
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Turns Supabase auth errors into something a golfer can act on. */
function friendly(message: string, stage: 'send' | 'verify'): string {
  const m = message.toLowerCase()
  if (m.includes('rate limit') || m.includes('security purposes') || m.includes('too many'))
    return 'Too many tries. Wait a minute, then try again.'
  if (m.includes('network') || m.includes('fetch') || m.includes('timed out'))
    return 'Couldn’t reach the server. Check your connection and try again.'
  if (stage === 'verify' && (m.includes('expired') || m.includes('invalid') || m.includes('token')))
    return 'That code is wrong or has expired. Check the latest email, or tap Resend code.'
  if (stage === 'send' && (m.includes('email') || m.includes('invalid')))
    return 'That email address doesn’t look right.'
  if (m.includes('not available')) return 'Sign-in isn’t available right now.'
  return 'Something went wrong. Please try again.'
}

/** Only accept in-app route paths for `next` (never a full URL). */
function safeNext(next: string | string[] | undefined): string | null {
  const v = Array.isArray(next) ? next[0] : next
  return v && v.startsWith('/') && !v.startsWith('//') ? v : null
}

export default function SignIn() {
  const params = useLocalSearchParams<{ next?: string }>()
  const next = safeNext(params.next)
  const user = useAuth((s) => s.user)

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [resent, setResent] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Resend countdown: ticks from a timer callback, never synchronously in the effect.
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const finish = () => {
    if (next) router.replace(next as Href)
    else if (router.canGoBack()) router.back()
    else router.replace('/')
  }

  const emailOk = EMAIL_RE.test(email.trim())
  const codeOk = /^\d{6,10}$/.test(code)

  const submitEmail = async () => {
    if (!emailOk || busy) return
    setBusy(true)
    setError(null)
    const { error: err } = await sendCode(email)
    setBusy(false)
    if (err) {
      setError(friendly(err, 'send'))
      return
    }
    setCode('')
    setResent(false)
    setCooldown(RESEND_SECONDS)
    setStep('code')
  }

  const resend = async () => {
    if (cooldown > 0 || busy) return
    setBusy(true)
    setError(null)
    const { error: err } = await sendCode(email)
    setBusy(false)
    if (err) {
      setError(friendly(err, 'send'))
      return
    }
    setResent(true)
    setCooldown(RESEND_SECONDS)
  }

  const submitCode = async () => {
    if (!codeOk || busy) return
    setBusy(true)
    setError(null)
    const { error: err } = await verifyCode(email, code)
    if (err) {
      setBusy(false)
      setError(friendly(err, 'verify'))
      return
    }
    // Signed in. Ask for a display name if they still have the automatic one.
    const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } }
    const u = data.session?.user
    const current = u ? await fetchProfileName(u.id) : null
    setBusy(false)
    if (u && needsName(current, u.email)) {
      setUserId(u.id)
      setName('')
      setStep('name')
    } else {
      finish()
    }
  }

  const submitName = async () => {
    const id = userId ?? user?.id
    if (!id || !name.trim() || busy) return
    setBusy(true)
    setError(null)
    const { error: err } = await saveProfileName(id, name)
    setBusy(false)
    if (err) setError(err)
    else finish()
  }

  const useDifferentEmail = () => {
    setStep('email')
    setCode('')
    setError(null)
    setResent(false)
    setCooldown(0)
  }

  // Opened while already signed in (e.g. from a join link) — nothing to do but continue.
  if (user && step === 'email') {
    return (
      <Screen>
        <PageTitle sub={`Signed in as ${user.email ?? 'your account'}.`}>You’re signed in</PageTitle>
        <Button title="Continue" variant="gold" onPress={finish} />
      </Screen>
    )
  }

  if (step === 'name') {
    return (
      <Screen>
        <PageTitle sub="This is the name friends see on shared trips and live scorecards.">
          What should your crew call you?
        </PageTitle>
        <Card>
          <Field label="Your name">
            <Input
              value={name}
              onChangeText={setName}
              placeholder="e.g. Dylan"
              autoFocus
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              maxLength={NAME_MAX}
              returnKeyType="done"
              onSubmitEditing={submitName}
              accessibilityLabel="Your name"
            />
          </Field>
          <ErrorText error={error} />
          <Button title="Save" variant="gold" onPress={submitName} loading={busy} disabled={!name.trim()} />
        </Card>
        <TextLink label="Not now" onPress={finish} />
      </Screen>
    )
  }

  if (step === 'code') {
    return (
      <Screen>
        <PageTitle sub={`Enter the code we sent to ${email.trim()}.`}>We emailed you a code</PageTitle>
        <Card>
          <Field label="Sign-in code">
            <Input
              value={code}
              onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 10))}
              placeholder="123456"
              autoFocus
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              maxLength={10}
              returnKeyType="done"
              onSubmitEditing={submitCode}
              accessibilityLabel="Sign-in code"
              style={st.code}
            />
          </Field>
          <ErrorText error={error} />
          <Button title="Sign in" variant="gold" onPress={submitCode} loading={busy} disabled={!codeOk} />
        </Card>
        <Hint style={st.center}>
          {resent ? 'New code sent. ' : ''}Can’t find it? Check your spam folder.
        </Hint>
        <TextLink
          label={cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          onPress={resend}
          disabled={cooldown > 0 || busy}
        />
        <TextLink label="Use a different email" onPress={useDifferentEmail} disabled={busy} />
      </Screen>
    )
  }

  return (
    <Screen>
      <PageTitle sub="Sign in to share trips, invite friends and score live together. Trips on this phone stay here.">
        Sign in
      </PageTitle>
      <Card>
        <Field label="Email">
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            autoFocus
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="send"
            onSubmitEditing={submitEmail}
            accessibilityLabel="Email"
          />
        </Field>
        <ErrorText error={error} />
        <Button title="Email me a code" variant="gold" onPress={submitEmail} loading={busy} disabled={!emailOk} />
      </Card>
      <Hint style={st.center}>No password needed — we’ll email you a 6-digit code.</Hint>
    </Screen>
  )
}

function ErrorText({ error }: { error: string | null }) {
  if (!error) return null
  return (
    <T style={st.error} accessibilityRole="alert">
      {error}
    </T>
  )
}

function TextLink({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={8}
      style={({ pressed }) => [st.link, pressed && { opacity: 0.6 }]}
    >
      <Text style={[st.linkText, disabled && { color: colors.muted }]}>{label}</Text>
    </Pressable>
  )
}

const st = StyleSheet.create({
  code: { fontSize: 22, letterSpacing: 6, textAlign: 'center', fontFamily: fonts.sansSemi },
  error: { color: colors.danger, fontSize: 13, lineHeight: 18, marginBottom: 12 },
  center: { textAlign: 'center', marginTop: 14 },
  link: { alignSelf: 'center', paddingVertical: 10, marginTop: 4 },
  linkText: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.green700 },
})
