/**
 * Persistence adapter.
 *
 * The web build talks to localStorage, but the packaged iOS/Android builds must not:
 * WKWebView treats localStorage as evictable cache and will clear it under storage
 * pressure. Since the user's planner *is* the entire product, that would be silent
 * data loss. Native builds swap a Capacitor Preferences/SQLite driver in here via
 * `setStorageDriver` without any caller changing.
 *
 * Everything is async so the native driver (which is promise-based) can drop in
 * unchanged.
 */

export interface StorageDriver {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

/** Last-resort driver so the app still runs (in-memory) where storage is blocked. */
function memoryDriver(): StorageDriver {
  const map = new Map<string, string>();
  return {
    async get(k) { return map.get(k) ?? null; },
    async set(k, v) { map.set(k, v); },
    async remove(k) { map.delete(k); },
  };
}

function localStorageDriver(): StorageDriver {
  return {
    async get(k) { return window.localStorage.getItem(k); },
    async set(k, v) { window.localStorage.setItem(k, v); },
    async remove(k) { window.localStorage.removeItem(k); },
  };
}

/** Safari in private mode throws on the first write rather than on access. */
function localStorageUsable(): boolean {
  try {
    const probe = '__appledhd_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

let driver: StorageDriver | null = null;

function activeDriver(): StorageDriver {
  if (!driver) {
    driver = typeof window !== 'undefined' && localStorageUsable() ? localStorageDriver() : memoryDriver();
  }
  return driver;
}

/** Called by the native bootstrap before the app mounts. */
export function setStorageDriver(next: StorageDriver): void {
  driver = next;
}

export const storage = {
  get: (key: string) => activeDriver().get(key),
  set: (key: string, value: string) => activeDriver().set(key, value),
  remove: (key: string) => activeDriver().remove(key),
};

/** True when the current driver cannot outlive the session, so the UI can warn. */
export function storageIsEphemeral(): boolean {
  return typeof window === 'undefined' || !localStorageUsable();
}
