import { Image } from 'expo-image'
import { useState } from 'react'
import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native'

/** Swipeable photo strip with page dots (the web app's Carousel). */
export default function Carousel({
  images,
  height = 210,
  width: w,
}: {
  images: string[]
  height?: number
  width?: number
}) {
  const { width: screen } = useWindowDimensions()
  const width = w ?? screen - 32
  const [page, setPage] = useState(0)
  if (images.length === 0) return <View style={{ height, backgroundColor: '#dfe8e1' }} />

  return (
    <View>
      <FlatList
        data={images}
        keyExtractor={(src) => src}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <Image
            source={item}
            style={{ width, height }}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
        )}
      />
      {images.length > 1 && (
        <View style={st.dots} pointerEvents="none">
          {images.map((src, i) => (
            <View key={src} style={[st.dot, i === page && st.dotOn]} />
          ))}
        </View>
      )}
    </View>
  )
}

const st = StyleSheet.create({
  dots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)' },
  dotOn: { backgroundColor: '#fff', width: 16 },
})
