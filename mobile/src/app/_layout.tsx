import {
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
} from '@expo-google-fonts/cormorant-garamond'
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins'
import { useFonts } from 'expo-font'
import { Stack, router, useRootNavigationState } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useRef, useState } from 'react'
import { hasSeenWelcome } from '@/lib/welcome'
import { colors, fonts } from '@/theme'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [loaded, error] = useFonts({
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  })

  // First launch: the splash stays up until fonts AND the 'ff-welcome-seen' check resolve.
  // If the tour hasn't been seen, the welcome modal is pushed while the splash still covers
  // the screen, and the splash hides only after the modal has animated in — so Home never flashes.
  const [welcomeSeen, setWelcomeSeen] = useState<boolean | null>(null)
  useEffect(() => {
    hasSeenWelcome().then(setWelcomeSeen)
  }, [])

  const fontsReady = loaded || !!error
  const ready = fontsReady && welcomeSeen !== null
  const navKey = useRootNavigationState()?.key
  const launched = useRef(false)

  useEffect(() => {
    if (!ready || !navKey || launched.current) return
    launched.current = true
    if (welcomeSeen) {
      SplashScreen.hideAsync()
      return
    }
    router.push('/welcome')
    setTimeout(() => SplashScreen.hideAsync(), 550)
  }, [ready, navKey, welcomeSeen])

  // Safety net: never leave the splash up if navigation state is slow to report ready.
  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => SplashScreen.hideAsync(), 4000)
    return () => clearTimeout(t)
  }, [ready])

  if (!ready) return null

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.green900 },
          headerTintColor: '#fff',
          headerTitleStyle: { fontFamily: fonts.sansSemi, fontSize: 17 },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.cream },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="package/[id]" options={{ title: '', headerTransparent: true }} />
        <Stack.Screen name="new" options={{ title: 'New trip', presentation: 'modal' }} />
        <Stack.Screen name="trip/[tripId]" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen
          name="welcome"
          options={{ presentation: 'fullScreenModal', headerShown: false, gestureEnabled: false }}
        />
      </Stack>
    </>
  )
}
