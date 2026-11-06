// Capture a (usually off-screen) view to a PNG and open the iOS share sheet.
// Used for sharing round results / Ryder Cup standings — the app has no
// accounts yet, so a picture in the group chat is how everyone sees results.
import * as Sharing from 'expo-sharing'
import type { RefObject } from 'react'
import { Alert, type ViewInstance } from 'react-native'
import { captureRef, releaseCapture } from 'react-native-view-shot'

export async function shareViewAsImage(
  ref: RefObject<ViewInstance | null>,
  { dialogTitle = 'Share' }: { dialogTitle?: string } = {},
): Promise<boolean> {
  let uri: string | null = null
  try {
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('Sharing unavailable', "Sharing isn't available on this device.")
      return false
    }
    if (!ref.current) throw new Error('Nothing to capture yet')
    uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' })
    await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle })
    return true
  } catch (e) {
    if (__DEV__) console.warn('shareViewAsImage failed', e)
    Alert.alert("Couldn't share", 'Something went wrong creating the image. Please try again.')
    return false
  } finally {
    if (uri) {
      try {
        releaseCapture(uri)
      } catch {
        // temp file cleanup is best-effort
      }
    }
  }
}
