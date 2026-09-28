import { Slot, router, useGlobalSearchParams, usePathname } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useStore } from '@shared/store'
import { colors, fonts } from '@/theme'

const TABS = [
  { seg: 'setup', label: 'Trip' },
  { seg: 'book', label: 'Book' },
  { seg: 'score', label: 'Scorecard' },
  { seg: 'ryder', label: 'Ryder Cup' },
  { seg: 'bets', label: 'Bets' },
] as const

export default function TripLayout() {
  const { tripId } = useGlobalSearchParams<{ tripId: string }>()
  const pathname = usePathname()
  const trip = useStore((s) => s.getTrip(tripId))
  const insets = useSafeAreaInsets()
  const active = pathname.split('/').pop()

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <View style={[st.header, { paddingTop: insets.top + 6 }]}>
        <View style={st.titleRow}>
          <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/trips'))} hitSlop={12} accessibilityLabel="Back">
            <Text style={st.back}>‹</Text>
          </Pressable>
          <Text style={st.title} numberOfLines={1}>
            {trip?.name ?? 'Trip'}
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 12 }}>
          {TABS.map((t) => {
            const on = active === t.seg
            return (
              <Pressable
                key={t.seg}
                onPress={() => !on && router.replace({ pathname: `/trip/[tripId]/${t.seg}`, params: { tripId } })}
                style={[st.tab, on && st.tabOn]}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
              >
                <Text style={[st.tabText, on && { color: colors.green900 }]}>{t.label}</Text>
              </Pressable>
            )
          })}
        </ScrollView>
      </View>
      {trip ? (
        <Slot />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: fonts.sans, color: colors.muted }}>This trip isn&apos;t on this phone.</Text>
        </View>
      )}
    </View>
  )
}

const st = StyleSheet.create({
  header: { backgroundColor: colors.green900, paddingBottom: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, marginBottom: 10 },
  back: { color: '#fff', fontSize: 34, lineHeight: 34, marginTop: -4 },
  title: { flex: 1, color: '#fff', fontFamily: fonts.serifBold, fontSize: 24 },
  tab: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.1)' },
  tabOn: { backgroundColor: colors.teeGreen },
  tabText: { fontFamily: fonts.sansSemi, fontSize: 13, color: '#fff' },
})
