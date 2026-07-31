import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.flagstickfinder.app',
  appName: 'Flagstick Finder',
  // Capacitor serves the built web app from this folder inside the native shell.
  webDir: 'dist',
  backgroundColor: '#0b3d2c',
  ios: {
    backgroundColor: '#0b3d2c',
    contentInset: 'always',
  },
  android: {
    backgroundColor: '#0b3d2c',
  },
}

export default config
