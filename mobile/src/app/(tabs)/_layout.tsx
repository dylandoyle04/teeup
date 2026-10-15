import { NativeTabs } from 'expo-router/unstable-native-tabs'
import { colors } from '@/theme'

export default function TabsLayout() {
  return (
    <NativeTabs tintColor={colors.green700}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf={{ default: 'flag', selected: 'flag.fill' }} md="flag" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Icon sf="map" md="map" />
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ryder">
        <NativeTabs.Trigger.Icon sf={{ default: 'trophy', selected: 'trophy.fill' }} md="emoji_events" />
        <NativeTabs.Trigger.Label>Ryder Cup</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="trips">
        <NativeTabs.Trigger.Icon sf={{ default: 'figure.golf', selected: 'figure.golf' }} md="sports_golf" />
        <NativeTabs.Trigger.Label>My Trips</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
