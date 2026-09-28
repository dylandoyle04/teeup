import type { ReactNode } from 'react'
import { ScrollView, type ScrollViewProps } from 'react-native'
import { colors } from '@/theme'

/** Standard scrolling page with the cream background and side gutters. */
export default function Screen({
  children,
  padded = true,
  ...rest
}: ScrollViewProps & { children: ReactNode; padded?: boolean }) {
  return (
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
}
