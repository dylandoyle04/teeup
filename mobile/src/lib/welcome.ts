import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'

export const WELCOME_KEY = 'ff-welcome-seen'

/** True once the welcome tour has been finished or skipped on this phone. */
export async function hasSeenWelcome(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(WELCOME_KEY)) === '1'
  } catch {
    // If storage is unreadable, don't trap the user in the tour on every launch.
    return true
  }
}

export function markWelcomeSeen() {
  AsyncStorage.setItem(WELCOME_KEY, '1').catch(() => {})
}

/** Re-opens the welcome tour (Settings → "Show the welcome tour again"). */
export function showWelcomeAgain() {
  router.push('/welcome')
}
