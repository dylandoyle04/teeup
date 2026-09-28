import * as WebBrowser from 'expo-web-browser'
import { Linking } from 'react-native'
import { colors } from '@/theme'

/** Opens a partner/affiliate link in an in-app Safari sheet. */
export function openLink(url: string) {
  if (url.startsWith('mailto:') || url.startsWith('tel:')) {
    Linking.openURL(url)
    return
  }
  WebBrowser.openBrowserAsync(url, {
    controlsColor: colors.green700,
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
  }).catch(() => Linking.openURL(url))
}
