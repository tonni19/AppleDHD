/**
 * What this build can actually do.
 *
 * The app ships both as a web page and, later, wrapped natively. Rather than
 * showing every control everywhere and quietly failing, each feature that needs
 * platform support asks here first. A control the platform cannot honour is not
 * rendered at all — an switch that does nothing is worse than a missing one.
 *
 * When the native shell is added these flip to true on their own; no UI changes.
 */

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
}

function capacitor(): CapacitorGlobal | null {
  if (typeof window === 'undefined') return null;
  return (window as { Capacitor?: CapacitorGlobal }).Capacitor ?? null;
}

/** True only inside the packaged iOS/Android app. */
export function isNative(): boolean {
  return capacitor()?.isNativePlatform?.() === true;
}

/**
 * Android specifically. The two platforms differ on how images reach the photo
 * library: Android demands an album, iOS is happier without one.
 */
export function isAndroid(): boolean {
  return capacitor()?.getPlatform?.() === 'android';
}

/** A phone or tablet, rather than a desktop browser with a mouse. */
export function isTouch(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
}

/**
 * Firing a notification at a set time, with the app closed, needs the operating
 * system. The web alternatives do not qualify: the Notifications API only runs
 * while the page is open, and scheduled push needs a server this app does not
 * have. So reminders are a native-only feature, and the UI for them stays hidden
 * until then rather than accepting input it will silently drop.
 */
export function canScheduleReminders(): boolean {
  return isNative();
}

/** Android browsers expose vibrate; iOS Safari does not. Desktop is pointless. */
export function canVibrate(): boolean {
  if (isNative()) return true;
  if (typeof navigator === 'undefined') return false;
  return typeof navigator.vibrate === 'function' && isTouch();
}

