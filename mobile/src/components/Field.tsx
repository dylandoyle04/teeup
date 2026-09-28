import DateTimePicker from '@react-native-community/datetimepicker'
import type { ReactNode } from 'react'
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native'
import { Hint, T } from '@/components/ui'
import { colors, fonts } from '@/theme'

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <View style={{ marginBottom: 14, flex: 1 }}>
      <T style={st.label}>{label}</T>
      {hint ? <Hint style={{ marginBottom: 6 }}>{hint}</Hint> : null}
      {children}
    </View>
  )
}

export function Input(props: TextInputProps) {
  return <TextInput placeholderTextColor="#9aa59d" {...props} style={[st.input, props.style]} />
}

const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Compact iOS date picker bound to a 'YYYY-MM-DD' string ('' = unset). */
export function DateInput({
  value,
  onChange,
  minimumDate,
}: {
  value: string
  onChange: (v: string) => void
  minimumDate?: string
}) {
  const date = value ? new Date(value + 'T00:00:00') : new Date()
  return (
    <View style={{ alignItems: 'flex-start' }}>
      <DateTimePicker
        value={date}
        mode="date"
        display="compact"
        accentColor={colors.green700}
        minimumDate={minimumDate ? new Date(minimumDate + 'T00:00:00') : undefined}
        onValueChange={(_, d) => onChange(toISO(d))}
      />
    </View>
  )
}

export function Row({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: 12 }}>{children}</View>
}

const st = StyleSheet.create({
  label: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.ink, marginBottom: 6 },
  input: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.ink,
  },
})
