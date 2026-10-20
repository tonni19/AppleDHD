import { setHapticsDriver, type Feel } from './feedback';
import { isAndroid, isNative } from './platform';
import { setStorageDriver } from './storage';

/**
 * The native shell.
 *
 * Everything here is loaded dynamically and only when actually running inside
 * the packaged app, so the web build never pays for it and never executes a
 * plugin's browser fallback by accident. The seams these plug into
 * (`setStorageDriver`, `setHapticsDriver`) already existed, so no feature code
 * changes shape when this runs.
 */

let started = false;

export async function initNative(): Promise<void> {
  if (started || !isNative()) return;
  started = true;

  const [{ Preferences }, { Haptics, ImpactStyle, NotificationType }, { StatusBar, Style }, { SplashScreen }] =
    await Promise.all([
      import('@capacitor/preferences'),
      import('@capacitor/haptics'),
      import('@capacitor/status-bar'),
      import('@capacitor/splash-screen'),
    ]);

  // WKWebView treats localStorage as evictable cache and will clear it under
  // storage pressure. Preferences is backed by real platform storage
  // (SharedPreferences / UserDefaults), which is the whole reason the adapter
  // exists.
  setStorageDriver({
    async get(key) {
      const { value } = await Preferences.get({ key });
      return value ?? null;
    },
    async set(key, value) {
      await Preferences.set({ key, value });
    },
    async remove(key) {
      await Preferences.remove({ key });
    },
  });

  // Real taptic feedback rather than a vibration motor buzz.
  setHapticsDriver({
    play(feel: Feel) {
      if (feel === 'success') {
        void Haptics.notification({ type: NotificationType.Success });
      } else if (feel === 'remove') {
        void Haptics.impact({ style: ImpactStyle.Medium });
      } else {
        void Haptics.impact({ style: ImpactStyle.Light });
      }
    },
  });

  try {
    // Dark icons: the peach wall behind the status bar is light.
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setOverlaysWebView({ overlay: true });
  } catch {
    // Not available on every platform/version — cosmetic only.
  }

  try {
    await SplashScreen.hide();
  } catch {
    // Splash may already be gone.
  }
}

// ---------------------------------------------------------------- back button

/**
 * Android's hardware back button. Returns an unsubscribe.
 * `handler` returns true when it consumed the press; false means "nothing left
 * to go back to", and the app should close rather than sit on a dead screen.
 */
export function onHardwareBack(handler: () => boolean): () => void {
  if (!isNative()) return () => {};

  let remove: (() => void) | null = null;
  let cancelled = false;

  void import('@capacitor/app').then(({ App }) => {
    if (cancelled) return;
    void App.addListener('backButton', () => {
      if (!handler()) void App.exitApp();
    }).then(sub => {
      if (cancelled) void sub.remove();
      else remove = () => { void sub.remove(); };
    });
  });

  return () => {
    cancelled = true;
    remove?.();
  };
}

// ---------------------------------------------------------------- resume

/**
 * Runs `handler` whenever the packaged app comes back to the foreground.
 *
 * On the web a returning tab fires `visibilitychange`, but inside Capacitor's
 * Android WebView that is not dependable — the WebView is not paused when the
 * app goes to the background, and there is no DOM `resume` event of its own.
 * The App plugin's listener is the supported signal, so native builds use it.
 */
export function onAppResume(handler: () => void): () => void {
  if (!isNative()) return () => {};

  let remove: (() => void) | null = null;
  let cancelled = false;

  void import('@capacitor/app').then(({ App }) => {
    if (cancelled) return;
    void App.addListener('resume', handler).then(sub => {
      if (cancelled) void sub.remove();
      else remove = () => { void sub.remove(); };
    });
  });

  return () => {
    cancelled = true;
    remove?.();
  };
}

// ---------------------------------------------------------------- files

export type SaveResult =
  | { kind: 'downloaded'; folder: string }
  | { kind: 'shared' }
  // Carries why a preferred path was abandoned, so a fallback is diagnosable
  // rather than looking like the feature quietly doing something else.
  | { kind: 'fallback'; folder: string; reason: string };

/**
 * Saves a file to the device.
 *
 * A webview blocks `<a download>` outright, so the native path writes the file
 * itself. It goes to the public Documents folder rather than app storage, and
 * the plugin runs a media scan afterwards, so it turns up in Files like anything
 * else the user downloaded — rather than being handed to a share sheet, which
 * made saving your own note feel like sending it somewhere.
 *
 * Sharing remains the fallback: if the write is refused (storage permission
 * denied), the user still gets their file rather than an error.
 */
export async function saveFile(
  fileName: string,
  data: string,
  mimeType: string,
  encoding: 'utf8' | 'base64',
): Promise<SaveResult> {
  if (!isNative()) {
    const href = encoding === 'base64'
      ? `data:${mimeType};base64,${data}`
      : URL.createObjectURL(new Blob([data], { type: mimeType }));
    const a = document.createElement('a');
    a.href = href;
    a.download = fileName;
    a.click();
    if (encoding === 'utf8') setTimeout(() => URL.revokeObjectURL(href), 1000);
    return { kind: 'downloaded', folder: 'downloads' };
  }

  const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
  const writeOptions = encoding === 'utf8' ? { encoding: Encoding.UTF8 } : {};

  try {
    await Filesystem.writeFile({
      path: fileName,
      data,
      directory: Directory.Documents,
      recursive: true,
      ...writeOptions,
    });
    return { kind: 'downloaded', folder: 'documents' };
  } catch {
    // Most likely storage permission was declined. Fall back to sharing from
    // cache, which needs no permission at all.
    const { Share } = await import('@capacitor/share');
    const written = await Filesystem.writeFile({
      path: fileName,
      data,
      directory: Directory.Cache,
      ...writeOptions,
    });
    await Share.share({ title: fileName, files: [written.uri] });
    return { kind: 'shared' };
  }
}

// ---------------------------------------------------------------- gallery

const ALBUM = 'appledhd';

/**
 * Finds or creates the album images are saved into.
 *
 * Android requires an album identifier, so there is no "just put it in the
 * gallery" call — the album has to exist first. Creating it is idempotent here:
 * the list is re-read afterwards because createAlbum returns nothing.
 */
async function albumId(): Promise<string | undefined> {
  const { Media } = await import('@capacitor-community/media');

  const find = async () => {
    const { albums } = await Media.getAlbums();
    return albums.find(a => a.name === ALBUM)?.identifier;
  };

  const existing = await find();
  if (existing) return existing;

  try {
    await Media.createAlbum({ name: ALBUM });
  } catch {
    // Already there, or the user declined — fall through and look again.
  }
  return find();
}

/**
 * Saves an image to the phone's gallery.
 *
 * The Filesystem plugin cannot do this: on Android 10+ an image only appears in
 * Photos if it is written through MediaStore, and writing a raw file path into
 * Pictures/ is blocked under scoped storage. So images go through the media
 * plugin, while ordinary files (the backup) still use the filesystem.
 */
export async function saveImage(fileName: string, base64: string): Promise<SaveResult> {
  const dataUri = `data:image/png;base64,${base64}`;

  if (!isNative()) {
    const a = document.createElement('a');
    a.href = dataUri;
    a.download = fileName;
    a.click();
    return { kind: 'downloaded', folder: 'downloads' };
  }

  try {
    const { Media } = await import('@capacitor-community/media');
    // Android requires an album identifier, which means listing albums first —
    // and listing means asking to *read* the photo library. iOS does not need
    // one, and skipping it there keeps the request to add-only, so the app never
    // asks to see the user's photos just to save a note.
    const album = isAndroid() ? await albumId() : undefined;
    await Media.savePhoto({ path: dataUri, albumIdentifier: album, fileName });
    return { kind: 'downloaded', folder: 'your gallery' };
  } catch (err) {
    // Permission declined, or no album could be made. Still hand over the file
    // rather than failing outright — but say why, so this is fixable.
    const reason = err instanceof Error ? err.message : String(err);
    const fallback = await saveFile(fileName, base64, 'image/png', 'base64');
    return fallback.kind === 'downloaded'
      ? { kind: 'fallback', folder: fallback.folder, reason }
      : fallback;
  }
}

// ---------------------------------------------------------------- reminders

export interface Reminder {
  /** Task id, or task id plus date for one occurrence of a repeat — hashed to the numeric id the OS requires. */
  key: string;
  taskId: string;
  date: string;
  title: string;
  body: string;
  /** When to fire, already offset by the task's lead time. */
  at: number;
}

/** Stable 31-bit id from a reminder key, so rescheduling replaces rather than duplicates. */
function numericId(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h | 0) % 2147483647;
}

/** Asks once; returns whether we may post notifications. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isNative()) return false;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  const current = await LocalNotifications.checkPermissions();
  if (current.display === 'granted') return true;
  if (current.display === 'denied') return false;
  const asked = await LocalNotifications.requestPermissions();
  return asked.display === 'granted';
}

/**
 * Replaces every scheduled reminder with the given set. Resolves to how many were scheduled.
 *
 * Cancel-then-schedule rather than diffing: the list is small, and it keeps the
 * OS in step with the app even after edits, deletes and clock changes that a
 * diff would have to chase.
 */
export async function syncReminders(reminders: Reminder[]): Promise<number> {
  if (!isNative()) return 0;
  const { LocalNotifications } = await import('@capacitor/local-notifications');

  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length) {
    await LocalNotifications.cancel({ notifications: pending.notifications });
  }

  const now = Date.now();
  // iOS caps how many notifications an app may have pending, so take the
  // soonest and let later ones be scheduled as they come into range.
  const due = reminders
    .filter(r => r.at > now)
    .sort((a, b) => a.at - b.at)
    .slice(0, 60);

  if (!due.length) return 0;
  if (!(await ensureNotificationPermission())) return 0;

  await LocalNotifications.schedule({
    notifications: due.map(r => ({
      id: numericId(r.key),
      title: r.title,
      body: r.body,
      schedule: { at: new Date(r.at), allowWhileIdle: true },
      extra: { taskId: r.taskId, date: r.date },
    })),
  });
  return due.length;
}

/**
 * Runs `handler` when a reminder notification is tapped, with the task and day it
 * was for. A tap that launched the app from closed is held by the plugin until
 * this listener attaches, so it still arrives.
 */
export function onReminderTap(handler: (taskId: string, date: string) => void): () => void {
  if (!isNative()) return () => {};

  let remove: (() => void) | null = null;
  let cancelled = false;

  void import('@capacitor/local-notifications').then(({ LocalNotifications }) => {
    if (cancelled) return;
    void LocalNotifications.addListener('localNotificationActionPerformed', action => {
      const extra = action.notification.extra as { taskId?: unknown; date?: unknown } | undefined;
      if (typeof extra?.taskId === 'string' && typeof extra.date === 'string') handler(extra.taskId, extra.date);
    }).then(sub => {
      if (cancelled) void sub.remove();
      else remove = () => { void sub.remove(); };
    });
  });

  return () => {
    cancelled = true;
    remove?.();
  };
}

/**
 * Whether reminders fire at their exact minute.
 *
 * Android 14 and later switch exact alarms off by default for newly installed
 * apps. Reminders still arrive without it, but the system batches them and they
 * can come several minutes late. iOS and older Android always allow it.
 */
export async function exactRemindersAllowed(): Promise<boolean> {
  if (!isNative() || !isAndroid()) return true;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    return (await LocalNotifications.checkExactNotificationSetting()).exact_alarm === 'granted';
  } catch {
    return true;
  }
}

/** Opens Android's "alarms & reminders" page for this app. Resolves to the setting afterwards. */
export async function allowExactReminders(): Promise<boolean> {
  if (!isNative() || !isAndroid()) return true;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    return (await LocalNotifications.changeExactNotificationSetting()).exact_alarm === 'granted';
  } catch {
    return false;
  }
}
