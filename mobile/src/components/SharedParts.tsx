import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { Button, Card, Serif, T } from '@/components/ui'
import { colors, fonts } from '@/theme'

/** A tappable list row used by the shared-trip screens (trip, round, cup). */
export function SharedRow({
  title,
  sub,
  onPress,
  right,
  first,
  disabled,
}: {
  title: string
  sub?: string | null
  onPress: () => void
  right?: ReactNode
  /** no top divider (first row in a card) */
  first?: boolean
  disabled?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={sub ? `${title}, ${sub}` : title}
      style={({ pressed }) => [st.row, !first && st.rowDivider, pressed && { opacity: 0.6 }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={st.rowTitle} numberOfLines={2}>
          {title}
        </Text>
        {sub ? (
          <Text style={st.rowSub} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>
      {right ?? <Text style={st.chev}>›</Text>}
    </Pressable>
  )
}

/** Centered message card with an optional action — empty, error and sign-in states. */
export function SharedNotice({
  emoji,
  title,
  body,
  action,
  onAction,
  secondary,
  onSecondary,
}: {
  emoji?: string
  title?: string
  body: string
  action?: string
  onAction?: () => void
  secondary?: string
  onSecondary?: () => void
}) {
  return (
    <Card style={{ alignItems: 'center', gap: 10 }}>
      {emoji ? <Text style={{ fontSize: 34 }}>{emoji}</Text> : null}
      {title ? <Serif style={{ fontSize: 22, textAlign: 'center' }}>{title}</Serif> : null}
      <T style={{ color: colors.muted, textAlign: 'center' }}>{body}</T>
      {action && onAction ? <Button title={action} variant="gold" onPress={onAction} style={{ alignSelf: 'stretch' }} /> : null}
      {secondary && onSecondary ? (
        <Button title={secondary} variant="subtle" small onPress={onSecondary} />
      ) : null}
    </Card>
  )
}

export function SharedLoading({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, gap: 10 }}>
      <ActivityIndicator color={colors.green700} />
      <T style={{ color: colors.muted }}>{label}</T>
    </View>
  )
}

/** Round initial avatar for a shared-trip member (no stored colour on the server). */
export function SharedAvatar({ name }: { name: string }) {
  return (
    <View style={st.avatar}>
      <Text style={st.avatarText}>{(name.trim().charAt(0) || '?').toUpperCase()}</Text>
    </View>
  )
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10, minHeight: 52 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  rowTitle: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.ink },
  rowSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 1 },
  chev: { fontSize: 24, color: colors.muted, marginLeft: 4 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.green600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontFamily: fonts.sansBold, fontSize: 14 },
})
