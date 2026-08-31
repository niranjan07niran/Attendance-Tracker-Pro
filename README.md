# Tally - Attendance Tracker (Android)

A Liquid Glass attendance tracker. Track classes attended / total classes
(partial values like 5.5/8 supported), with splash screen, name onboarding,
time-of-day greeting, stats, and full persistence on-device.

This folder is a complete, ready-to-build project:
- `src/` - the React app (Vite + Tailwind)
- `android/` - the generated Capacitor Android project (web bundle already synced)
- `.github/workflows/build-apk.yml` - cloud APK build via GitHub Actions

---

## Option A - Build the APK in the cloud (NO Android Studio needed)

1. Create a free account at github.com (if you don't have one).
2. Create a new repository (e.g. `tally-app`), then upload ALL files in this
   folder to it (GitHub web UI: "uploading an existing file" link works -
   drag the whole folder contents in; or use git push).
3. GitHub Actions starts automatically. Open the repo's **Actions** tab, wait
   ~5 minutes for "Build Android APK" to go green.
4. Click the finished run -> **Artifacts** -> download `tally-debug-apk`.
   Unzip it to get `app-debug.apk`.
5. Copy the APK to your phone (or download it directly on the phone),
   tap it, allow "Install unknown apps" for your browser/file manager
   when prompted, and install. Done.

## Option B - Build locally with Android Studio

1. Install Android Studio (https://developer.android.com/studio) and let it
   install the default SDK.
2. In this folder run:
   ```
   npm install
   npm run build
   npx cap sync android
   ```
3. Open the `android/` folder in Android Studio (File -> Open).
4. Build -> Build App Bundles / APK(s) -> **Build APK(s)**.
5. The APK appears at `android/app/build/outputs/apk/debug/app-debug.apk`.
   Transfer to your phone and install.

Or from the command line (with SDK installed): `cd android && ./gradlew assembleDebug`

---

## Notes

- The debug APK is auto-signed with a debug key - perfect for installing on
  your own phone. (Play Store distribution would need a release keystore.)
- Data (items, your name, settings) persists on-device via WebView storage.
  Uninstalling or clearing app data resets it.
- App id: `com.tally.attendance`, name: **Tally**. Change in
  `capacitor.config.json` (then re-run `npx cap sync android`).
- To change the launcher icon, replace the images under
  `android/app/src/main/res/mipmap-*` (Android Studio: right-click `res` ->
  New -> Image Asset makes this easy).
