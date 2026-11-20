import * as Application from 'expo-application'
import Constants from 'expo-constants'
import { router } from 'expo-router'
import * as StoreReview from 'expo-store-review'
import { Children, Fragment, useEffect, useState, type ReactNode } from 'react'
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, Text, View, type AccessibilityRole } from 'react-native'
import { useStore } from '@shared/store'
import Screen from '@/components/Screen'
import { Hint } from '@/components/ui'
import { deleteAccount, signOut, useAuth } from '@/lib/auth'
import { openLink } from '@/lib/links'
import { useLastTrip } from '@/lib/lastTrip'
import { fetchProfileName, NAME_MAX, saveProfileName } from '@/lib/profile'
import { useSoundPrefs } from '@/lib/sound'
import { showWelcomeAgain } from '@/lib/welcome'
import { colors, fonts, radius } from '@/theme'

const LEGAL_URL = 'https://flagstickfinder.com/#/legal'
const SUPPORT_URL = 'mailto:Flagstickfinder@outlook.com?subject=Flagstick%20Finder%20app'
const GEONAMES_URL = 'https://www.geonames.org/'

function appVersion(): string {
  const version = Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '—'
  const build = Application.nativeBuildVersion
  return build ? `${version} (${build})` : version
}

export default function Settings() {
  const muted = useSoundPrefs((s) => s.muted)
  const setMuted = useSoundPrefs((s) => s.setMuted)
  const clearAll = useStore((s) => s.clearAll)
  const forgetLastTrip = useLastTrip((s) => s.forget)
  const [canRate, setCanRate] = useState(false)

  useEffect(() => {
    StoreReview.isAvailableAsync()
      .then(setCanRate)
      .catch(() => {})
  }, [])

  const confirmReset = () => {
    Alert.alert(
      'Delete all trips?',
      'This deletes every trip, round, cup and bet on this phone, including the example trip. It can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete all',
          style: 'destructive',
          onPress: () => {
            clearAll()
            forgetLastTrip()
            Alert.alert('All trips deleted', 'You’re starting fresh. Plan a trip from the Explore tab.')
          },
        },
      ],
    )
  }

  return (
    <Screen>
      <AccountGroup />

      <Group title="Sound">
        <Row label="Sound effects" detail="The Cup cheer">
          <Switch
            value={!muted}
            onValueChange={(on) => setMuted(!on)}
            trackColor={{ true: colors.green600, false: colors.line }}
            thumbColor="#fff"
            accessibilityLabel="Sound effects"
          />
        </Row>
      </Group>

      <Group title="Help & legal">
        <Row label="Privacy policy & terms" onPress={() => openLink(LEGAL_URL)} role="link" />
        <Row label="Contact support" detail="Flagstickfinder@outlook.com" onPress={() => openLink(SUPPORT_URL)} role="link" />
        {canRate ? (
          <Row
            label="Rate Flagstick Finder"
            onPress={() => {
              StoreReview.requestReview().catch(() => {})
            }}
          />
        ) : null}
        <Row label="Show the welcome tour again" onPress={showWelcomeAgain} />
      </Group>

      <Group title="Data" footer="Trips you plan here, with their scores and bets, are stored only on this phone — signing in doesn’t upload or back them up.">
        <Row label="Delete all trips" destructive onPress={confirmReset} />
      </Group>

      <Group
        title="About"
        footer="Some links are affiliate links — booking through them costs you the same and supports the app."
      >
        <Row label="Version" value={appVersion()} />
        <Row label="City data © GeoNames (CC BY 4.0)" onPress={() => openLink(GEONAMES_URL)} role="link" />
      </Group>
    </Screen>
  )
}

function AccountGroup() {
  const ready = useAuth((s) => s.ready)
  const user = useAuth((s) => s.user)
  const userId = user?.id ?? null
  // Keyed by user id so a stale name never shows after switching accounts.
  const [profile, setProfile] = useState<{ userId: string; name: string | null } | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!userId) return
    let live = true
    fetchProfileName(userId).then((name) => {
      if (live) setProfile({ userId, name })
    })
    return () => {
      live = false
    }
  }, [userId])

  if (!ready) {
    return (
      <Group title="Account">
        <Row label="Account">
          <ActivityIndicator color={colors.muted} />
        </Row>
      </Group>
    )
  }

  if (!user) {
    return (
      <Group
        title="Account"
        footer="Optional. Sign in to share trips, invite friends and score live together. Trips on this phone stay here."
      >
        <Row label="Sign in" detail="No password — we email you a code" onPress={() => router.push('/signin')} />
      </Group>
    )
  }

  const name = profile?.userId === user.id ? profile.name : null

  const editName = () => {
    Alert.prompt(
      'Your name',
      'This is the name friends see on shared trips and live scorecards.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (value?: string) => {
            const clean = (value ?? '').trim().slice(0, NAME_MAX)
            if (!clean) return
            const { error } = await saveProfileName(user.id, clean)
            if (error) Alert.alert('Name not saved', error)
            else setProfile({ userId: user.id, name: clean })
          },
        },
      ],
      'plain-text',
      name ?? '',
    )
  }

  const confirmSignOut = () => {
    Alert.alert('Sign out?', 'Trips on this phone stay here. Sign back in any time to see your shared trips.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ])
  }

  const runDelete = async () => {
    setDeleting(true)
    const { error } = await deleteAccount()
    setDeleting(false)
    if (error) {
      Alert.alert('Couldn’t delete your account', 'Check your connection and try again. If it keeps failing, contact support.')
      return
    }
    Alert.alert(
      'Account deleted',
      'Your account has been permanently deleted and you’re signed out. Trips on this phone are still here.',
    )
  }

  const confirmDelete = () => {
    Alert.alert(
      'Delete your account?',
      '• Trips you organized are deleted for everyone in them.\n' +
        '• Your name and scores stay in friends’ trips, but are no longer linked to you.\n' +
        '• Trips stored only on this phone are not affected.\n\n' +
        'This can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              'Permanently delete account?',
              `${user.email ?? 'This account'} and the trips you organized will be deleted. This can’t be undone.`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete account', style: 'destructive', onPress: runDelete },
              ],
            ),
        },
      ],
    )
  }

  return (
    <Group title="Account" footer="Deleting your account removes it permanently, along with the shared trips you organized.">
      <Row label="Email" value={user.email ?? '—'} />
      <Row label="Display name" value={name ?? 'Add your name'} onPress={editName} />
      <Row label="Sign out" onPress={confirmSignOut} />
      {deleting ? (
        <Row label="Deleting account…">
          <ActivityIndicator color={colors.danger} />
        </Row>
      ) : (
        <Row label="Delete account" destructive onPress={confirmDelete} />
      )}
    </Group>
  )
}

function Group({ title, footer, children }: { title: string; footer?: string; children: ReactNode }) {
  const rows = Children.toArray(children)
  return (
    <View style={{ marginBottom: 26 }}>
      <Text style={st.groupTitle} accessibilityRole="header">
        {title.toUpperCase()}
      </Text>
      <View style={st.group}>
        {rows.map((row, i) => (
          <Fragment key={i}>
            {i > 0 ? <View style={st.sep} /> : null}
            {row}
          </Fragment>
        ))}
      </View>
      {footer ? <Hint style={st.footer}>{footer}</Hint> : null}
    </View>
  )
}

function Row({
  label,
  detail,
  value,
  onPress,
  destructive,
  role = 'button',
  children,
}: {
  label: string
  detail?: string
  value?: string
  onPress?: () => void
  destructive?: boolean
  role?: AccessibilityRole
  children?: ReactNode
}) {
  const body = (
    <>
      <View style={{ flex: 1 }}>
        <Text style={[st.label, destructive && { color: colors.danger }]}>{label}</Text>
        {detail ? <Text style={st.detail}>{detail}</Text> : null}
      </View>
      {value ? <Text style={st.value}>{value}</Text> : null}
      {children}
      {onPress && !destructive ? <Text style={st.chevron}>›</Text> : null}
    </>
  )

  if (!onPress) {
    return (
      <View style={st.row} accessible={!children} accessibilityLabel={value ? `${label}, ${value}` : undefined}>
        {body}
      </View>
    )
  }
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [st.row, pressed && { backgroundColor: colors.green100 }]}
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityHint={detail}
    >
      {body}
    </Pressable>
  )
}

const st = StyleSheet.create({
  groupTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    letterSpacing: 1.2,
    color: colors.muted,
    marginLeft: 16,
    marginBottom: 8,
  },
  group: {
    backgroundColor: colors.paper,
    borderRadius: radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hair,
    overflow: 'hidden',
  },
  row: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginLeft: 16 },
  label: { fontFamily: fonts.sans, fontSize: 16, color: colors.ink },
  detail: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 1 },
  value: { fontFamily: fonts.sans, fontSize: 15, color: colors.muted },
  chevron: { fontSize: 24, lineHeight: 26, color: '#b9b4a6', marginTop: -2 },
  footer: { marginHorizontal: 16, marginTop: 8 },
})
