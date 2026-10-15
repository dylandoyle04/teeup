import { LinearGradient } from 'expo-linear-gradient'
import { router, type Href } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { fonts, shadow } from '@/theme'

/** Banner that sends people to the Ryder Cup tab. */
export default function RyderPromo() {
  return (
    <Pressable
      onPress={() => router.navigate('/ryder' as Href)}
      style={({ pressed }) => [st.wrap, pressed && { transform: [{ scale: 0.99 }] }]}
      accessibilityRole="button"
      accessibilityLabel="Play your own Ryder Cup"
    >
      <LinearGradient
        colors={['#1d5fb0', '#0d2f5c', '#9c7414', '#c6952a']}
        locations={[0, 0.48, 0.52, 1]}
        start={{ x: 0, y: 0.2 }}
        end={{ x: 1, y: 0.8 }}
        style={st.card}
      >
        <Text style={{ fontSize: 38 }}>🏆</Text>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={st.kicker}>TEAM GOLF, TRIP-LONG</Text>
          <Text style={st.title}>Play your own Ryder Cup</Text>
          <Text style={st.sub}>Two teams, three formats, one cup. Points update live.</Text>
        </View>
        <Text style={st.arrow}>→</Text>
      </LinearGradient>
    </Pressable>
  )
}

const st = StyleSheet.create({
  wrap: { borderRadius: 18, ...shadow },
  card: { borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, overflow: 'hidden' },
  kicker: { fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.5, color: 'rgba(255,255,255,0.85)' },
  title: { fontFamily: fonts.serifBold, fontSize: 26, lineHeight: 28, color: '#fff' },
  sub: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: 'rgba(255,255,255,0.9)' },
  arrow: { fontFamily: fonts.sansBold, fontSize: 22, color: '#fff' },
})
