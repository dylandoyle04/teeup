import type { ReactNode } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { initials } from '@shared/components/ui'
import type { Member } from '@shared/types'
import { colors, fonts, radius, shadow } from '@/theme'

export { fmtDateRange, money } from '@shared/components/ui'

/** Poppins body text. */
export function T({ style, ...rest }: TextProps) {
  return <Text {...rest} style={[s.body, style]} />
}

/** Cormorant Garamond display heading. */
export function Serif({ style, ...rest }: TextProps) {
  return <Text {...rest} style={[s.serif, style]} />
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Serif style={s.pageTitle}>{children}</Serif>
      {sub ? <T style={s.pageSub}>{sub}</T> : null}
    </View>
  )
}

export function SectionTitle({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Serif style={[s.sectionTitle, style]}>{children}</Serif>
}

export function Hint({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <T style={[s.hint, style]}>{children}</T>
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>
}

type Variant = 'primary' | 'gold' | 'ghost' | 'subtle' | 'danger'

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  small,
  style,
}: {
  title: string
  onPress?: () => void
  variant?: Variant
  disabled?: boolean
  loading?: boolean
  small?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const v = VARIANTS[variant]
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.btn,
        small && s.btnSm,
        { backgroundColor: v.bg, borderColor: v.border },
        (disabled || loading) && { opacity: 0.45 },
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <Text style={[s.btnText, small && { fontSize: 13 }, { color: v.fg }]}>{title}</Text>
      )}
    </Pressable>
  )
}

const VARIANTS: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.green700, fg: '#fff', border: colors.green700 },
  gold: { bg: colors.gold, fg: '#2b2205', border: colors.gold },
  ghost: { bg: 'transparent', fg: colors.green700, border: colors.green700 },
  subtle: { bg: colors.green100, fg: colors.green700, border: colors.green100 },
  danger: { bg: 'transparent', fg: colors.danger, border: colors.danger },
}

export function Pill({ children, tone = 'green' }: { children: ReactNode; tone?: 'green' | 'gold' }) {
  return (
    <View style={[s.pill, tone === 'gold' && { backgroundColor: '#f6ecc7' }]}>
      <Text style={[s.pillText, tone === 'gold' && { color: '#6b560f' }]}>{children}</Text>
    </View>
  )
}

export function Avatar({ member, size = 34 }: { member: Member; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: member.color,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
      }}
    >
      <Text style={{ color: '#fff', fontFamily: fonts.sansBold, fontSize: size * 0.38 }}>
        {initials(member.name)}
      </Text>
    </View>
  )
}

export function AvatarStack({ members }: { members: Member[] }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {members.slice(0, 5).map((m, i) => (
        <View key={m.id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
          <Avatar member={m} size={28} />
        </View>
      ))}
    </View>
  )
}

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <Switch
      value={on}
      onValueChange={onChange}
      trackColor={{ true: colors.green600, false: colors.line }}
      thumbColor="#fff"
    />
  )
}

/** Segmented control (the web app's `.seg`). */
export function Segmented<V extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: V; label: string }[]
  value: V
  onChange: (v: V) => void
}) {
  return (
    <View style={s.seg}>
      {options.map((o) => {
        const on = o.value === value
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[s.segBtn, on && s.segBtnOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            <Text style={[s.segText, on && { color: '#fff' }]}>{o.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

export const s = StyleSheet.create({
  body: { fontFamily: fonts.sans, color: colors.ink, fontSize: 15, lineHeight: 22 },
  serif: { fontFamily: fonts.serif, color: colors.green900 },
  pageTitle: { fontSize: 34, lineHeight: 38 },
  pageSub: { color: colors.muted, marginTop: 6 },
  sectionTitle: { fontSize: 26, marginTop: 26, marginBottom: 12 },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  card: {
    backgroundColor: colors.paper,
    borderRadius: radius,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hair,
    ...shadow,
  },
  btn: {
    borderRadius: 999,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  btnSm: { paddingVertical: 8, paddingHorizontal: 14, minHeight: 36 },
  btnText: { fontFamily: fonts.sansSemi, fontSize: 15 },
  pill: {
    backgroundColor: colors.green100,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  pillText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.green700 },
  seg: {
    flexDirection: 'row',
    backgroundColor: colors.green100,
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  segBtn: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  segBtnOn: { backgroundColor: colors.green700 },
  segText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.green700 },
})
