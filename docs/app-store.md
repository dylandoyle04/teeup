# Shipping Flagstick Finder to the App Store & Play Store

The app is wrapped with [Capacitor](https://capacitorjs.com/) — the same React
web app runs inside a native shell. The web side is fully set up
(`capacitor.config.ts`, app icon, manifest). What's left needs a Mac with Xcode
(iOS) and/or Android Studio, plus the developer accounts.

## 0. Accounts to start NOW (they take days to approve)

- **Apple Developer Program** — $99/year, https://developer.apple.com/programs/
  Enrollment/identity verification can take 24–48h (sometimes longer). Start this first.
- **Google Play Console** — one-time $25, https://play.google.com/console
  Approval is usually quick.

## 1. One-time tooling install (on the Mac)

```bash
# iOS
xcode-select --install            # or install Xcode from the App Store (~10GB)
sudo gem install cocoapods

# Android
# install Android Studio from https://developer.android.com/studio
```

## 2. Add the native projects (once)

```bash
npm install
npm run build
npx cap add ios
npx cap add android
```

This creates the `ios/` and `android/` folders — commit them.

## 3. Every time the app changes

```bash
npm run cap:sync      # builds the web app + copies it into both native projects
```

## 4. Build & submit — iOS

```bash
npm run cap:ios       # builds, syncs, opens Xcode
```

In Xcode:
1. Select the project → **Signing & Capabilities** → pick your Apple team (auto-signing).
2. Set the version/build number.
3. **Product → Archive**, then **Distribute App → App Store Connect**.
4. In https://appstoreconnect.apple.com create the app listing (name, screenshots,
   description, privacy questionnaire, the flagstickfinder.com privacy URL), attach
   the build, submit for review.

## 5. Build & submit — Android

```bash
npm run cap:android   # builds, syncs, opens Android Studio
```

In Android Studio:
1. **Build → Generate Signed Bundle / APK → Android App Bundle (.aab)**; create a keystore (keep it safe — you need it for every future update).
2. In the Play Console, create the app, upload the `.aab`, fill the store listing +
   data-safety form (point to the flagstickfinder.com privacy page), submit.

## App identity (already configured)

- **App ID:** `com.flagstickfinder.app` (`capacitor.config.ts`)
- **Name:** Flagstick Finder
- **Icon:** `public/icon-1024.png` (source). Generate the per-platform icon sets with
  `@capacitor/assets`: `npx @capacitor/assets generate --iconBackgroundColor '#0b3d2c'`.

## Notes / gotchas

- Uses `HashRouter`, which works cleanly inside Capacitor.
- Data is still local to each device (localStorage). Shared/live scoring across
  phones needs a backend (accounts + sync) — a separate project.
- Apple rejects thin "just a website" wrappers; the scorecard, Ryder Cup, betting
  tracker and offline use make this a real utility, which satisfies that rule.
