import { useFocusEffect } from 'expo-router'
import { useCallback } from 'react'
import { create } from 'zustand'

// The root layout renders the one <StatusBar>, styled from this count. Screens
// used to call setStatusBarStyle() directly, but the root's <StatusBar
// style="dark"> re-applied on every re-render and won — dark text on the
// dark-green trip header.
export const useStatusBarLight = create<{ count: number }>(() => ({ count: 0 }))

/** White status-bar text while this screen is focused (photo or green header behind it). */
export function useLightStatusBar() {
  useFocusEffect(
    useCallback(() => {
      useStatusBarLight.setState((s) => ({ count: s.count + 1 }))
      return () => useStatusBarLight.setState((s) => ({ count: Math.max(0, s.count - 1) }))
    }, []),
  )
}
