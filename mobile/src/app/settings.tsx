import * as Application from 'expo-application'
import Constants from 'expo-constants'
import * as StoreReview from 'expo-store-review'
import { Children, Fragment, useEffect, useState, type ReactNode } from 'react'
import { Alert, Pressable, StyleSheet, Switch, Text, View, type AccessibilityRole } from 'react-native'
import { useStore } from '@shared/store'
import Screen from '@/components/Screen'
import { Hint } from '@/components/ui'
import { openLink } from '@/lib/links'
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
  const resetAll = useStore((s) => s.resetAll)
  const [canRate, setCanRate] = useState(false)

  useEffect(() => {
    StoreReview.isAvailableAsync()
      .then(setCanRate)
      .catch(() => {})
  }, [])

  const confirmReset = () => {
    Alert.alert(
      'Reset app data?',
      'This deletes every trip, round, cup and bet on this phone and restores the example trip. It can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetAll()
            Alert.alert('App data reset', 'You’re back to a fresh start with the example trip.')
          },
        },
      ],
    )
  }

  return (
    <Screen>
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

      <Group title="Data" footer="Your trips, scores and bets are stored only on this phone — there’s no account or cloud backup in this version.">
        <Row label="Reset app data" destructive onPress={confirmReset} />
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
