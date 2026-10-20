import { canVibrate } from './platform';

/**
 * Small physical confirmations — ticking something off, removing something.
 *
 * Android browsers can vibrate, iOS Safari cannot, so the web build is a partial
 * implementation by necessity. The native shell registers a proper driver here
 * (Capacitor's Haptics, which gives real iOS taptic feedback rather than a buzz)
 * without any caller changing.
 */

export type Feel = 'tap' | 'success' | 'remove';

export interface HapticsDriver {
  play(feel: Feel): void;
}

/** Durations in ms; the pattern is what separates one feel from another. */
const PATTERN: Record<Feel, number | number[]> = {
  tap: 10,
  success: [12, 45, 20],
  remove: 24,
};

let driver: HapticsDriver | null = null;

/** Called by the native bootstrap to replace vibration with real haptics. */
export function setHapticsDriver(next: HapticsDriver): void {
  driver = next;
}

/**
 * @param enabled the user's setting — passed in rather than read globally so
 * this module stays free of app state.
 */
export function haptic(enabled: boolean, feel: Feel = 'tap'): void {
  if (!enabled) return;

  if (driver) {
    driver.play(feel);
    return;
  }

  if (!canVibrate()) return;
  try {
    navigator.vibrate(PATTERN[feel]);
  } catch {
    // Blocked by the browser or unsupported — feedback is never load-bearing.
  }
}
