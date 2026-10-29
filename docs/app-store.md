# Shipping Flagstick Finder to the App Store (Expo + EAS)

The iPhone app lives in `mobile/` (Expo SDK 57, Expo Router). It shares its
trip/scoring logic with the website through `src/` (see `mobile/metro.config.js`).
EAS builds and submits in the cloud — **no Xcode or macOS update needed**.

Listing copy, review notes and questionnaire answers: [`app-store-listing.md`](./app-store-listing.md).

## 0. Accounts

- **Apple Developer Program** — $99/yr, https://developer.apple.com/programs/
  - *Individual*: your legal name is shown as the seller. ~1–2 days.
  - *Organization*: an LLC name is shown; needs a free D-U-N-S number (days–weeks).
- **Expo** — already set up (`dylanrowan510`).

## 1. One-time: link the project to EAS

```bash
cd ~/golf-trip-planner/mobile
npx eas-cli@latest login          # Expo account
npx eas-cli@latest init           # adds extra.eas.projectId to app.json — commit it
```

## 2. Build for the App Store

```bash
npx eas-cli@latest build --platform ios --profile production
```

The first run asks you to sign in with your Apple ID; let EAS create the
certificates and register the bundle ID `com.flagstickfinder.app`. Build
numbers auto-increment (`eas.json`), so you only bump `version` in
`mobile/app.json` for a new release (1.0.0 → 1.0.1 …).

## 3. Upload to TestFlight

```bash
npx eas-cli@latest submit --platform ios --latest
```

This creates the app in App Store Connect (if needed) and uploads the build.
After processing (~10–30 min) it appears in **TestFlight** — install the
TestFlight app on your iPhone and test the real build (sound, haptics, share,
calendar, location all behave as shipped). Add a few golf buddies as testers.

## 4. Submit for review

In https://appstoreconnect.apple.com → your app:
1. Paste the listing text, keywords, URLs from `app-store-listing.md`.
2. Upload screenshots (6.9" iPhone required: 1320×2868 or 1290×2796).
3. Answer **App Privacy** and **Age Rating** as in `app-store-listing.md`.
4. Pick the TestFlight build, paste the **App Review notes**, submit.
First reviews usually take 1–3 days.

## Every update after that

```bash
cd ~/golf-trip-planner/mobile
# bump "version" in app.json, then:
npx eas-cli@latest build --platform ios --profile production --auto-submit
```

## Day-to-day development

```bash
cd ~/golf-trip-planner/mobile && npx expo start      # scan QR with Expo Go
npx tsc --noEmit && npx expo lint && npx expo-doctor # before shipping
```

## Notes

- Package/stay/hero photos load from flagstickfinder.com (not bundled), so
  keep the website deployed.
- Permissions the app declares (all optional, all explained in-app):
  location while using, calendar add-only, Photos add-only. No microphone,
  no background modes, no tracking.
- `ITSAppUsesNonExemptEncryption = false` is set, so there's no export
  compliance question per upload.
