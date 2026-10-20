export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

import type { WeekStart } from './types';

export const DOW_SHORT = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export const DOW_LONG = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function iso(d: Date): string {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function todayISO(): string {
  return iso(new Date());
}

export function parseISO(s: string): Date {
  const p = s.split('-').map(Number);
  return new Date(p[0], p[1] - 1, p[2]);
}

export function addDays(s: string, n: number): string {
  const d = parseISO(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}

/** Whole days from `a` to `b`; negative when `b` is earlier. */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86400000);
}

/** Day first, then month: `4 Mar`. */
export function pretty(s: string): string {
  const d = parseISO(s);
  return d.getDate() + ' ' + MONTHS[d.getMonth()].slice(0, 3);
}

/** `4 Mar 2026` — used wherever the year genuinely matters. */
export function prettyFull(s: string): string {
  return pretty(s) + ' ' + parseISO(s).getFullYear();
}

export function hhmm(t: string): string {
  const p = t.split(':').map(Number);
  const h = p[0] % 12 || 12;
  return h + ':' + String(p[1]).padStart(2, '0') + (p[0] < 12 ? ' AM' : ' PM');
}

/** 'today' / 'yesterday' / 'tomorrow', else the short date. */
export function relativeDay(s: string, today: string): string {
  const diff = daysBetween(today, s);
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff === -1) return 'yesterday';
  return pretty(s);
}

/**
 * A heading for a date: "today · 17 Sep 2026", and for dates that have no
 * relative word, the weekday in its place — "thursday · 25 Sep 2026".
 *
 * Pairing relativeDay() with the full date directly doubled the date for
 * anything beyond yesterday or tomorrow, since relativeDay falls back to the
 * date itself.
 */
export function dayHeading(s: string, today: string): string {
  const diff = daysBetween(today, s);
  const lead = diff === 0 ? 'today'
    : diff === 1 ? 'tomorrow'
    : diff === -1 ? 'yesterday'
    : DOW_LONG[parseISO(s).getDay()];
  return `${lead} · ${prettyFull(s)}`;
}

/** Day of week rotated so the user's chosen first day is index 0. */
export function dowIndex(date: Date, weekStart: WeekStart): number {
  return (date.getDay() - weekStart + 7) % 7;
}

export function weekdayLabels(weekStart: WeekStart): string[] {
  return DOW_SHORT.slice(weekStart).concat(DOW_SHORT.slice(0, weekStart));
}

export function startOfWeek(s: string, weekStart: WeekStart): string {
  return addDays(s, -dowIndex(parseISO(s), weekStart));
}

export function startOfMonth(s: string): string {
  const d = parseISO(s);
  return iso(new Date(d.getFullYear(), d.getMonth(), 1));
}

export function endOfMonth(s: string): string {
  const d = parseISO(s);
  return iso(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

/** Combines a stored date and 'HH:MM' into local epoch ms; all-day items land at 00:00. */
export function atTime(date: string, time: string | null): number {
  const d = parseISO(date);
  if (time) {
    const [h, mi] = time.split(':').map(Number);
    d.setHours(h, mi, 0, 0);
  }
  return d.getTime();
}

/** Coarse countdown text for a future timestamp. */
export function countdown(ms: number, nowMs: number): string {
  const mins = Math.round((ms - nowMs) / 60000);
  if (mins <= 0) return 'now';
  if (mins < 60) return mins + (mins === 1 ? ' min left' : ' mins left');
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + (hrs === 1 ? ' hr left' : ' hrs left');
  const days = Math.floor(hrs / 24);
  return days + (days === 1 ? ' day left' : ' days left');
}
