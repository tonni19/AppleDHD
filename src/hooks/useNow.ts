'use client';

import { useEffect, useState } from 'react';
import { todayISO } from '@/lib/date';
import { onAppResume } from '@/lib/native';

export interface Clock {
  /** Local ISO date, kept current across midnight and across app resume. */
  today: string;
  /** Epoch ms, refreshed each minute so countdowns actually count down. */
  now: number;
}

/** Milliseconds until one second past the coming local midnight. */
function msUntilMidnight(): number {
  const d = new Date();
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 1);
  return next.getTime() - d.getTime();
}

/**
 * A live clock.
 *
 * Everything that depends on the date — the streak, "today", countdowns — reads
 * it from here, so it has to change the moment the day does:
 *
 *   - at midnight, by a timer aimed at midnight itself. The 30-second interval
 *     alone left the streak showing yesterday's count for up to half a minute.
 *   - on returning to the app, from whichever signal the platform actually gives:
 *     `visibilitychange` and `pageshow` on the web, the App plugin's resume in the
 *     packaged app, where the WebView's own events are not dependable.
 *
 * The interval stays as a safety net and keeps countdowns ticking.
 */
export function useNow(): Clock {
  const [clock, setClock] = useState<Clock>(() => ({ today: todayISO(), now: Date.now() }));

  useEffect(() => {
    const sync = () => {
      const today = todayISO();
      const now = Date.now();
      setClock(prev => (prev.today === today && Math.abs(prev.now - now) < 30000 ? prev : { today, now }));
    };

    // Re-aimed after each firing, and whenever the app resumes: a timer set
    // before the phone slept can land late, or the clock may have been changed.
    let midnight = 0;
    const armMidnight = () => {
      window.clearTimeout(midnight);
      midnight = window.setTimeout(() => { sync(); armMidnight(); }, msUntilMidnight());
    };

    const resync = () => { sync(); armMidnight(); };
    const onVisible = () => { if (document.visibilityState === 'visible') resync(); };

    armMidnight();
    const timer = window.setInterval(sync, 30000);
    window.addEventListener('focus', resync);
    window.addEventListener('pageshow', resync);
    document.addEventListener('visibilitychange', onVisible);
    const offResume = onAppResume(resync);

    return () => {
      window.clearTimeout(midnight);
      window.clearInterval(timer);
      window.removeEventListener('focus', resync);
      window.removeEventListener('pageshow', resync);
      document.removeEventListener('visibilitychange', onVisible);
      offResume();
    };
  }, []);

  return clock;
}
