// Small building blocks shared by the live (cloud) scorecard and The Cup:
// signed-out prompt, loading / error states and the save-status badge.
import { router, type Href } from 'expo-router'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { Button, Card, T } from '@/components/ui'
import type { SaveStatus } from '@/components/SharedScoreSync'
import { colors, fonts } from '@/theme'

export function SharedSignInPrompt({ what, next }: { what: string; next: string }) {
  return (
    <Card style={ss.center}>
      <Text style={ss.emoji}>🔒</Text>
      <T style={ss.msg}>Sign in to view {what}.</T>
      <Button
        title="Sign in"
        variant="gold"
        onPress={() => router.push(`/signin?next=${encodeURIComponent(next)}` as Href)}
        style={{ marginTop: 14, alignSelf: 'stretch' }}
      />
    </Card>
  )
}

export function SharedLoading({ label = 'Loading…' }: { label?: string }) {
  return (
    <Card style={ss.center}>
      <ActivityIndicator color={colors.green700} />
      <T style={[ss.msg, { marginTop: 10 }]}>{label}</T>
    </Card>
  )
}

export function SharedError({ message, onRetry, onBack }: { message: string; onRetry: () => void; onBack?: () => void }) {
  return (
    <Card style={ss.center}>
      <Text style={ss.emoji}>📡</Text>
      <T style={ss.msg}>{message}</T>
      <Button title="Try again" onPress={onRetry} style={{ marginTop: 14, alignSelf: 'stretch' }} />
      {onBack && <Button title="Back" variant="ghost" onPress={onBack} style={{ marginTop: 10, alignSelf: 'stretch' }} />}
    </Card>
  )
}

/** "● Live · Saved" / "Saving…" / "Offline — will retry" */
export function SharedSaveBadge({ status, dark }: { status: SaveStatus; dark?: boolean }) {
  const offline = status === 'offline'
  const label = offline ? 'Offline — will retry' : status === 'saving' ? 'Saving…' : status === 'saved' ? 'Live · Saved' : 'Live'
  const dot = offline ? colors.danger : status === 'saving' ? colors.gold : '#3fb46b'
  return (
    <View
      style={[ss.badge, dark && ss.badgeDark, offline && !dark && { backgroundColor: '#f7e7e3' }]}
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
      accessibilityLabel={`Scores: ${label}`}
    >
      <View style={[ss.dot, { backgroundColor: dot }]} />
      <Text style={[ss.badgeText, dark && { color: '#fff' }, offline && !dark && { color: colors.danger }]}>
        {label}
      </Text>
    </View>
  )
}

/** Navigate back to the shared trip page (pops to it when it's in the stack). */
export function backToSharedTrip(id: string) {
  router.navigate(`/shared/${id}` as Href)
}

const ss = StyleSheet.create({
  center: { alignItems: 'center', paddingVertical: 32 },
  emoji: { fontSize: 36, marginBottom: 8 },
  msg: { textAlign: 'center', color: colors.muted },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.green100,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 11,
  },
  badgeDark: { backgroundColor: 'rgba(255,255,255,0.12)' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  badgeText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.green700 },
})
