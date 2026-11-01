/* ---------------------------------------------------------------------- */
/* Platform layer: storage, haptics, Android back button, reminders,      */
/* file export. Every call degrades gracefully on the web so the same     */
/* bundle runs in a browser and inside the Capacitor APK.                 */
/* ---------------------------------------------------------------------- */
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export const IS_NATIVE = Capacitor.isNativePlatform();

/* Storage: WebView localStorage persists with the app on Android. Claude's
   window.storage is used when present (artifact preview). */
export const appStorage = {
  async get(key) {
    if (typeof window !== 'undefined' && window.storage) {
      try { return await window.storage.get(key); } catch (e) { return null; }
    }
    try {
      const value = window.localStorage.getItem(key);
      return value == null ? null : { key, value };
    } catch (e) { return null; }
  },
  async set(key, value) {
    if (typeof window !== 'undefined' && window.storage) {
      try { return await window.storage.set(key, value); } catch (e) { return null; }
    }
    try { window.localStorage.setItem(key, value); return { key, value }; } catch (e) { return null; }
  },
};

/* Haptics */
let hapticsEnabled = true;
export function setHapticsEnabled(v) { hapticsEnabled = !!v; }

export function haptic(kind = 'light') {
  if (!hapticsEnabled || !IS_NATIVE) return;
  try {
    if (kind === 'success') Haptics.notification({ type: NotificationType.Success });
    else if (kind === 'warning') Haptics.notification({ type: NotificationType.Warning });
    else Haptics.impact({ style: kind === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light });
  } catch (e) { /* ignore */ }
}

/* Android hardware back button. Handler returns true if it consumed the
   press; otherwise the app is minimised (like a native app). */
export function onBackButton(handler) {
  if (!IS_NATIVE) return () => {};
  const sub = CapApp.addListener('backButton', () => {
    if (!handler()) CapApp.minimizeApp().catch(() => CapApp.exitApp());
  });
  return () => { sub.then(s => s.remove()).catch(() => {}); };
}

/* Daily reminder */
const REMINDER_ID = 4101;

export async function scheduleDailyReminder(enabled, time = '18:00') {
  if (!IS_NATIVE) return { ok: false, reason: 'Reminders work in the Android app.' };
  try {
    await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] }).catch(() => {});
    if (!enabled) return { ok: true };
    let perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') return { ok: false, reason: 'Notification permission was denied.' };
    const [hour, minute] = String(time).split(':').map(Number);
    await LocalNotifications.schedule({
      notifications: [{
        id: REMINDER_ID,
        title: 'Mark today\'s attendance',
        body: 'Take 10 seconds to tally today\'s classes in Tally.',
        schedule: { on: { hour: hour || 0, minute: minute || 0 }, allowWhileIdle: true, repeats: true },
      }],
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: 'Could not schedule the reminder.' };
  }
}

/* Export a text file: share sheet on Android, download in the browser. */
export async function exportTextFile(filename, text, mime) {
  if (IS_NATIVE) {
    const res = await Filesystem.writeFile({ path: filename, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: filename, url: res.uri, dialogTitle: 'Save or send your export' });
    return;
  }
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Open a file picker and resolve with the chosen file's text (or null). */
export function pickTextFile(accept = 'application/json,.json') {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => {
      const file = input.files && input.files[0];
      if (!file) { resolve(null); return; }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Could not read that file.'));
      reader.readAsText(file);
    };
    input.click();
  });
}
