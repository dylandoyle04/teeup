import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAudioPlayer } from 'expo-audio'
import { useCallback } from 'react'
import { create } from 'zustand'

const MUTE_KEY = 'ff-sound-muted'

type SoundPrefs = {
  muted: boolean
  setMuted: (m: boolean) => void
}

// Set once the user changes the switch, so a slow storage read can't overwrite their choice.
let touched = false

/**
 * App-wide sound preference, shared by Settings and every screen that plays a sound.
 * Persisted to AsyncStorage under 'ff-sound-muted' ('1' = muted).
 */
export const useSoundPrefs = create<SoundPrefs>((set) => ({
  muted: false,
  setMuted: (m) => {
    touched = true
    set({ muted: m })
    AsyncStorage.setItem(MUTE_KEY, m ? '1' : '0').catch(() => {})
  },
}))

// Load the saved preference once, at import time.
AsyncStorage.getItem(MUTE_KEY)
  .then((v) => {
    if (v != null && !touched) useSoundPrefs.setState({ muted: v === '1' })
  })
  .catch(() => {})

/** The Ryder Cup cheer with a remembered mute switch. Respects the iPhone's silent switch. */
export function useRyderCheer() {
  const player = useAudioPlayer(require('@/assets/sounds/ryder-cheer.m4a'))
  const muted = useSoundPrefs((s) => s.muted)
  const setMutedPref = useSoundPrefs((s) => s.setMuted)

  const play = useCallback(() => {
    if (useSoundPrefs.getState().muted) return
    player.seekTo(0)
    player.play()
  }, [player])

  const setMuted = useCallback(
    (m: boolean) => {
      setMutedPref(m)
      if (m) player.pause()
    },
    [player, setMutedPref],
  )

  return { play, muted, setMuted }
}
