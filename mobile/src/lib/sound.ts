import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAudioPlayer } from 'expo-audio'
import { useCallback, useEffect, useState } from 'react'

const MUTE_KEY = 'ff-sound-muted'

/** The Ryder Cup cheer with a remembered mute switch. Respects the iPhone's silent switch. */
export function useRyderCheer() {
  const player = useAudioPlayer(require('@/assets/sounds/ryder-cheer.m4a'))
  const [muted, setMutedState] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(MUTE_KEY)
      .then((v) => setMutedState(v === '1'))
      .catch(() => {})
  }, [])

  const play = useCallback(() => {
    if (muted) return
    player.seekTo(0)
    player.play()
  }, [muted, player])

  const setMuted = useCallback(
    (m: boolean) => {
      setMutedState(m)
      if (m) player.pause()
      AsyncStorage.setItem(MUTE_KEY, m ? '1' : '0').catch(() => {})
    },
    [player],
  )

  return { play, muted, setMuted }
}
