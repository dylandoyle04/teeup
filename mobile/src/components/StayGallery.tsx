import { Image } from 'expo-image'
import { useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { colors, fonts } from '@/theme'

const GAP = 4

/**
 * Swipeable photo gallery for the featured-stay card (the web app's
 * StayGallery). One photo at a time on phones, two on wider screens;
 * page dots are tappable to jump.
 */
export default function StayGallery({
  photos,
  width: w,
  height = 210,
}: {
  photos: string[]
  width?: number
  height?: number
}) {
  const { width: screen } = useWindowDimensions()
  const width = w ?? screen - 32
  const perPage = width >= 560 ? 2 : 1
  const slide = perPage === 2 ? (width - GAP) / 2 : width
  const pages = Math.max(1, Math.ceil(photos.length / perPage))
  const [page, setPage] = useState(0)
  const [list, setList] = useState<FlatList<string> | null>(null)

  function go(p: number) {
    const clamped = Math.max(0, Math.min(pages - 1, p))
    list?.scrollToOffset({ offset: clamped * (width + (perPage === 2 ? GAP : 0)), animated: true })
    setPage(clamped)
  }

  return (
    <View style={[st.wrap, { height }]}>
      <FlatList
        ref={setList}
        data={photos}
        keyExtractor={(src) => src}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={perPage === 2 ? slide + GAP : width}
        decelerationRate="fast"
        disableIntervalMomentum
        ItemSeparatorComponent={perPage === 2 ? () => <View style={{ width: GAP }} /> : undefined}
        onMomentumScrollEnd={(e) => {
          const step = perPage === 2 ? width + GAP : width
          setPage(Math.min(pages - 1, Math.round(e.nativeEvent.contentOffset.x / step)))
        }}
        renderItem={({ item, index }) => (
          <Image
            source={item}
            style={{ width: slide, height }}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            priority={index < 2 ? 'high' : 'normal'}
            accessibilityIgnoresInvertColors
          />
        )}
      />

      <View style={st.badge} pointerEvents="none">
        <Text style={st.badgeText}>Our pick</Text>
      </View>

      {pages > 1 && (
        <View style={st.dots}>
          {Array.from({ length: pages }).map((_, idx) => (
            <Pressable key={idx} onPress={() => go(idx)} hitSlop={6} accessibilityLabel={`Photo page ${idx + 1}`}>
              <View style={[st.dot, idx === page && st.dotOn]} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  )
}

const st = StyleSheet.create({
  wrap: { backgroundColor: colors.green900 },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 12,
    backgroundColor: colors.gold,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  badgeText: { fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', color: '#3a2e07' },
  dots: { position: 'absolute', bottom: 9, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)' },
  dotOn: { width: 18, backgroundColor: '#fff' },
})
