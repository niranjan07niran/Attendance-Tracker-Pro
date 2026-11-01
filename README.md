# Tally Pro - Attendance Tracker (Android)

A Liquid Glass attendance tracker for classes, subjects, teams or habits.
Version 2 ("Pro") turns the simple counter into a full attendance planner.

## What's new in v2

| Feature | What it does |
|---|---|
| **Today tab** | Your daily timetable. Classes scheduled for the day show up with one-tap **Present / Absent / Cancelled** buttons, plus a week strip to back-fill earlier days. |
| **Attendance target + bunk calculator** | Set a minimum % (default 75%, overridable per item). Every item shows *"Safe to skip 3 classes"* or *"Attend 4 more to reach target"*, and the detail view previews your % if you skip or attend the next class. |
| **Weekly schedule** | Pick the days each class meets; unscheduled extra classes can still be marked. |
| **Full history** | Every mark is logged with its date. A month calendar shows present/absent/cancelled dots; tap any past day to mark or fix it; remove any entry and the counts reverse exactly. |
| **Undo** | Marks, edits, resets and deletes show an *Undo* button for a few seconds. |
| **Advanced stats** | Overall ring vs target, at-risk list, total safe skips, present streak, 8-week trend chart and a by-weekday chart (which days you skip). |
| **Backup, restore & export** | Back up everything to `.json` and restore it later; export a `.csv` (summary + full history) for Excel/Sheets. Uses the Android share sheet. |
| **Daily reminder** | Optional notification at a time you choose. |
| **More polish** | Light / Dark / Auto theme, haptic feedback, Android back button closes sheets, notes per item, "Most at risk" sort, week starts Mon/Sun. |

v1 data (items, name, settings) is migrated automatically the first time v2 opens.

This folder is a complete, ready-to-build project:
- `src/` - the React app (Vite + Tailwind)
  - `src/lib/attendance.js` - all attendance maths, dates, stats, backup (unit-tested: `npm test`)
  - `src/lib/native.js` - storage, haptics, back button, reminders, file export
  - `src/screens.jsx`, `src/sheets.jsx`, `src/ui.jsx` - screens, sheets, UI primitives
- `android/` - the generated Capacitor Android project (web bundle already synced)
- `.github/workflows/build-apk.yml` - cloud APK build via GitHub Actions

---

## Option A - Build the APK in the cloud (NO Android Studio needed)

1. Create a free account at github.com (if you don't have one).
2. Create a new repository (e.g. `tally-app`), then upload ALL files in this
   folder to it (GitHub web UI: "uploading an existing file" link works -
   drag the whole folder contents in; or use git push).
3. GitHub Actions starts automatically. Open the repo's **Actions** tab, wait
   ~5 minutes for "Build Android APK" to go green. (It runs on every push to any branch.)
4. Click the finished run -> **Artifacts** -> download `tally-pro-apk`.
   Unzip it to get `Tally-Pro-v2.apk`.
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

- The debug APK is signed with the committed key `android/app/tally-debug.keystore`,
  so every future build installs **as an update** over the previous one and keeps
  your data. That key is not secret; Play Store distribution needs a private
  release keystore.
- **Upgrading from v1:** v1 builds were signed with a random per-build debug key,
  so Android will refuse to install v2 over v1 ("App not installed" / package
  conflict). Note your numbers, uninstall v1, install v2 and re-enter them
  (Add item lets you type attended/total directly). From v2 onward, use
  *Settings -> Back up data* before reinstalling anything.
- Data (items, history, your name, settings) persists on-device via WebView storage.
  Uninstalling or clearing app data resets it.
- App id: `com.tally.attendance`, name: **Tally Pro**. Change in
  `capacitor.config.json` (then re-run `npx cap sync android`).
- To change the launcher icon, replace the images under
  `android/app/src/main/res/mipmap-*` (Android Studio: right-click `res` ->
  New -> Image Asset makes this easy).
