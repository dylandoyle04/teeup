import type { ReactNode } from 'react'
import { ScrollView, View, type ScrollViewProps } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '@/theme'

/** Standard scrolling page with the cream background and side gutters. */
export default function Screen({
  children,
  padded = true,
  statusBarShield = false,
  ...rest
}: ScrollViewProps & {
  children: ReactNode
  padded?: boolean
  /** headerless tab screens: keep scrolled content from showing behind the clock */
  statusBarShield?: boolean
}) {
  const insets = useSafeAreaInsets()
  const scroller = (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.cream }}
      contentContainerStyle={padded ? { padding: 16, paddingBottom: 48 } : { paddingBottom: 48 }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      {...rest}
    >
      {children}
    </ScrollView>
  )
  if (!statusBarShield) return scroller
  return (
    <View style={{ flex: 1 }}>
      {scroller}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top, backgroundColor: colors.cream }}
      />
    </View>
  )
}
