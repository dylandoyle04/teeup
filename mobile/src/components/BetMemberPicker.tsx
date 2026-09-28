import { Pressable, ScrollView, StyleSheet, Text } from 'react-native'
import type { Member } from '@shared/types'
import { Avatar } from '@/components/ui'
import { colors, fonts } from '@/theme'

/** Horizontal chip list standing in for the web `<select>` of members. */
export default function BetMemberPicker({
  members,
  value,
  onChange,
}: {
  members: Member[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
      keyboardShouldPersistTaps="handled"
    >
      {members.map((m) => {
        const on = m.id === value
        return (
          <Pressable
            key={m.id}
            onPress={() => onChange(m.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={m.name}
            style={[st.chip, on && st.chipOn]}
          >
            <Avatar member={m} size={24} />
            <Text style={[st.text, on && { color: '#fff' }]}>{m.name}</Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const st = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingLeft: 5,
    paddingRight: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  chipOn: { backgroundColor: colors.green700, borderColor: colors.green700 },
  text: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.ink },
})
