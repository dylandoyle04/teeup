import { router } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { PACKAGES } from '@shared/packages'
import PackageCard from '@/components/PackageCard'
import Screen from '@/components/Screen'
import { PageTitle, SectionTitle, Serif, T } from '@/components/ui'
import { colors, fonts, shadow } from '@/theme'

export default function Explore() {
  return (
    <Screen>
      <PageTitle sub="Start from a curated package or build your own — then invite friends to keep score.">
        Plan your golf trip
      </PageTitle>

      <SectionTitle style={{ marginTop: 4 }}>Our preplanned trips</SectionTitle>
      <View style={{ gap: 14 }}>
        {PACKAGES.map((p) => (
          <PackageCard key={p.id} pkg={p} />
        ))}
      </View>

      <SectionTitle>Or start from scratch</SectionTitle>
      <Pressable
        style={({ pressed }) => [st.createOwn, pressed && { opacity: 0.85 }]}
        onPress={() => router.push('/new')}
        accessibilityRole="button"
      >
        <Text style={{ fontSize: 28 }}>⛳</Text>
        <View style={{ flex: 1 }}>
          <Serif style={{ fontSize: 22 }}>Create your own</Serif>
          <T style={{ color: colors.muted, fontSize: 13 }}>Build a custom trip and invite friends to keep score.</T>
        </View>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 20, color: colors.green700 }}>→</Text>
      </Pressable>
    </Screen>
  )
}

const st = StyleSheet.create({
  createOwn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.paper,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.hair,
    ...shadow,
  },
})
