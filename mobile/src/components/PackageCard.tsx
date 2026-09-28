import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Link } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { TripPackage } from '@shared/packages'
import { money } from '@/components/ui'
import { colors, fonts, shadow } from '@/theme'

export default function PackageCard({ pkg, width }: { pkg: TripPackage; width?: number }) {
  return (
    <Link href={{ pathname: '/package/[id]', params: { id: pkg.id } }} asChild>
      <Pressable
        style={({ pressed }) => [st.card, width ? { width } : null, pressed && { transform: [{ scale: 0.98 }] }]}
        accessibilityLabel={`${pkg.destination}, ${pkg.tierLabel}`}
      >
        <Image source={pkg.image} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} cachePolicy="memory-disk" />
        <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)']} locations={[0.35, 1]} style={StyleSheet.absoluteFill} />
        <View style={st.flag}>
          <View style={st.pennant} />
        </View>
        <View style={[st.tier, pkg.tier === 'luxury' ? st.lux : st.val]}>
          <Text style={[st.tierText, { color: pkg.tier === 'luxury' ? '#3a2e07' : '#133d12' }]}>{pkg.tierLabel}</Text>
        </View>
        <View style={st.body}>
          <Text style={st.loc}>{pkg.region}</Text>
          <Text style={st.title}>{pkg.destination.split(',')[0]}</Text>
          <Text style={st.tag}>
            {pkg.courses.length} courses · {money(pkg.budgetMin)}–{money(pkg.budgetMax)}/pp
          </Text>
        </View>
      </Pressable>
    </Link>
  )
}

const st = StyleSheet.create({
  card: {
    height: 210,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.green700,
    ...shadow,
  },
  flag: {
    position: 'absolute',
    top: 22,
    left: 18,
    width: 2,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  pennant: {
    position: 'absolute',
    left: 2,
    top: 0,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 15,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: colors.teeGreen,
  },
  tier: { position: 'absolute', top: 20, right: 14, borderRadius: 4, paddingVertical: 4, paddingHorizontal: 10 },
  lux: { backgroundColor: colors.gold },
  val: { backgroundColor: colors.teeGreen },
  tierText: { fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase' },
  body: { position: 'absolute', left: 18, right: 18, bottom: 16 },
  loc: { fontFamily: fonts.sansSemi, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)' },
  title: { fontFamily: fonts.serifBold, fontSize: 30, color: '#fff', lineHeight: 34 },
  tag: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.9)' },
})
