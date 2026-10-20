import { addDays, atTime, daysBetween, endOfMonth, hhmm, iso, parseISO, startOfMonth, startOfWeek } from './date';
import type { Budget, Goal, PeriodEntry, Scope, Spend, Task, WeekStart } from './types';

// ---------------------------------------------------------------- tasks

/**
 * Does this task land on this date?
 *
 * A one-off is only ever on its own date. A repeating one runs from its start
 * date until its `until`, minus any occurrence deleted individually.
 */
export function occursOn(task: Task, date: string): boolean {
  if (!task.repeat) return task.date === date;
  if (date < task.date) return false;
  if (task.repeat.until && date > task.repeat.until) return false;
  if (task.skipDates.includes(date)) return false;

  if (task.repeat.every === 'day') return true;
  if (task.repeat.every === 'week') return daysBetween(task.date, date) % 7 === 0;
  // Monthly keeps the day of the month, so a task on the 31st simply does not
  // occur in shorter months rather than drifting into the next one.
  return parseISO(date).getDate() === parseISO(task.date).getDate();
}

/**
 * One occurrence, shaped exactly like a task.
 *
 * Returning the same shape is deliberate: every row, dot and counter in the app
 * works on tasks, and none of them needs to learn what a repeat is. `date` is
 * the occurrence's date and `done` is that occurrence's state.
 */
export function occurrenceOn(task: Task, date: string): Task {
  return task.repeat ? { ...task, date, done: task.doneDates.includes(date) } : task;
}

/** Sorted for display: all-day items first, then by time, then by creation. */
export function tasksForDate(tasks: Task[], date: string): Task[] {
  return tasks
    .filter(t => occursOn(t, date))
    .map(t => occurrenceOn(t, date))
    .sort(compareTasks);
}

/**
 * Every occurrence in a window, bucketed by date.
 *
 * Walks each repeating task forward once instead of asking "does this occur?"
 * for every task on every cell of the calendar.
 */
export function occurrencesInRange(tasks: Task[], from: string, to: string): Map<string, Task[]> {
  const out = new Map<string, Task[]>();
  const push = (date: string, task: Task) => {
    const list = out.get(date);
    if (list) list.push(task);
    else out.set(date, [task]);
  };

  tasks.forEach(task => {
    if (!task.repeat) {
      if (task.date >= from && task.date <= to) push(task.date, task);
      return;
    }

    const last = task.repeat.until && task.repeat.until < to ? task.repeat.until : to;
    let cursor = task.date > from ? task.date : from;

    if (task.repeat.every === 'week') {
      // Step onto the first occurrence at or after the window start.
      const gap = ((daysBetween(task.date, cursor) % 7) + 7) % 7;
      if (gap) cursor = addDays(cursor, 7 - gap);
    }

    const step = task.repeat.every === 'day' ? 1 : task.repeat.every === 'week' ? 7 : 0;
    let guard = 0;
    while (cursor <= last && guard++ < 400) {
      if (occursOn(task, cursor)) push(cursor, occurrenceOn(task, cursor));
      cursor = step ? addDays(cursor, step) : addDays(cursor, 1);
    }
  });

  out.forEach(list => list.sort(compareTasks));
  return out;
}

/** The next occurrences of a task after a moment, for countdowns and reminders. */
export function nextOccurrences(task: Task, afterMs: number, limit: number, horizonDays: number): Task[] {
  if (!task.repeat) {
    return !task.done && atTime(task.date, task.time) > afterMs ? [task] : [];
  }

  const out: Task[] = [];
  const startISO = iso(new Date(afterMs));
  let cursor = task.date > startISO ? task.date : startISO;
  const last = addDays(startISO, horizonDays);
  let guard = 0;

  while (cursor <= last && out.length < limit && guard++ < 400) {
    if (occursOn(task, cursor) && !task.doneDates.includes(cursor) && atTime(cursor, task.time) > afterMs) {
      out.push(occurrenceOn(task, cursor));
    }
    cursor = addDays(cursor, 1);
  }
  return out;
}

export interface ReminderTime {
  /** Unique per occurrence, so each one gets its own notification. */
  key: string;
  taskId: string;
  /** The occurrence's date, so tapping the notification can open that day. */
  date: string;
  title: string;
  body: string;
  at: number;
}

/** All-day tasks have no time of their own; their reminders use a gentle morning hour instead of midnight. */
const ALL_DAY_REMINDER = '09:00';

// Wording for the notification body. Warm, short, and never guilt-tripping —
// a reminder should feel like a friend tapping your shoulder, not an alarm.
const LINES_NOW = [
  "it's time. you've got this.",
  'your gentle nudge. one small step is enough.',
  "hello from past you. it's time!",
  'no need to be perfect, just begin.',
  'right now is the moment. go gently.',
  "you planned for this. let's do it.",
];
const LINES_SOON = [
  "a good moment to wrap up what you're doing.",
  'grab some water and get ready.',
  'stretch, breathe, then head over.',
  "a heads-up so it doesn't sneak up on you.",
  'finish your thought, then get going.',
];
const LINES_HOUR = [
  'plenty of time to get ready, no rush.',
  'a calm heads-up so you can plan around it.',
  'a nice time to set out what you need.',
  'still time for a snack first.',
];
const LINES_DAY = [
  'future you will be glad you know.',
  'tonight is a good time to get anything you need ready.',
  "one sleep away. you're on top of this.",
  'a little heads-up, so tomorrow feels easy.',
];

/** Picks a line from a set, the same one every time for the same reminder, varied across reminders. */
function pick(lines: string[], key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return lines[h % lines.length];
}

/** The notification body: when it is, then something kind. */
export function reminderBody(leadMinutes: number, time: string | null, key: string): string {
  const when = time ? ` at ${hhmm(time)}` : '';
  if (leadMinutes <= 0) return pick(LINES_NOW, key);
  if (leadMinutes < 60) return `in ${leadMinutes} minutes. ${pick(LINES_SOON, key)}`;
  if (leadMinutes < 1440) {
    const hours = Math.round(leadMinutes / 60);
    return `in ${hours === 1 ? 'an hour' : `${hours} hours`}. ${pick(LINES_HOUR, key)}`;
  }
  return `tomorrow${when}. ${pick(LINES_DAY, key)}`;
}

/**
 * Every reminder due within the horizon, one per occurrence — a repeating task
 * reminds every time it comes round, not only on its first date. Occurrences
 * whose reminder time has already passed are left out.
 */
export function upcomingReminders(tasks: Task[], nowMs: number, horizonDays: number): ReminderTime[] {
  const out: ReminderTime[] = [];
  tasks.forEach(task => {
    if (task.remind === null) return;
    const lead = task.remind * 60000;
    const timed = task.time ? task : { ...task, time: ALL_DAY_REMINDER };
    // Looking from one lead time ahead keeps only occurrences whose reminder is still to come.
    nextOccurrences(timed, nowMs + lead, 64, horizonDays).forEach(occ => {
      const key = task.repeat ? `${task.id}:${occ.date}` : task.id;
      out.push({
        key,
        taskId: task.id,
        date: occ.date,
        title: task.title,
        body: reminderBody(task.remind ?? 0, task.time, key),
        at: atTime(occ.date, occ.time) - lead,
      });
    });
  });
  return out;
}

export function compareTasks(a: Task, b: Task): number {
  // A manual position always beats the automatic ordering. Untouched days have
  // every order at 0, so they still fall through to all-day-first, then time.
  if (a.order !== b.order) return a.order - b.order;
  if (!a.time && b.time) return -1;
  if (a.time && !b.time) return 1;
  if (a.time && b.time && a.time !== b.time) return a.time.localeCompare(b.time);
  return a.createdAt - b.createdAt;
}

/**
 * The task whose colour represents the whole day in the calendar.
 *
 * This follows the user's own ordering rather than picking the most urgent
 * item itself, so dragging something to the top changes what the month shows.
 * Returns null when every task on the day is done.
 */
export function leadTask(tasks: Task[]): Task | null {
  return tasks.slice().sort(compareTasks).find(t => !t.done) ?? null;
}

/**
 * Every task due within the horizon, nearest first. A repeating task — a daily
 * habit, say — could otherwise flood the list with one row per day, so each
 * task contributes at most a few occurrences; the caller decides how many of
 * the combined, sorted result to actually show.
 */
export function upcomingTasks(tasks: Task[], nowMs: number, horizonDays: number): Task[] {
  const PER_TASK_CAP = 3;
  return tasks
    .flatMap(t => nextOccurrences(t, nowMs, PER_TASK_CAP, horizonDays))
    .sort((a, b) => atTime(a.date, a.time) - atTime(b.date, b.time));
}

// ---------------------------------------------------------------- goals

export interface GoalStats {
  /** Days with any hours logged. */
  daysDone: number;
  hoursDone: number;
  targetHours: number;
  /** Progress against the hour target, capped at 100. */
  pct: number;
  todayHours: number;
  finishBy: string;
  /** Hours the plan expects by today; negative difference means behind. */
  expectedByNow: number;
  complete: boolean;
}

export function goalStats(goal: Goal, today: string): GoalStats {
  const entries = Object.entries(goal.log).filter(([, h]) => h > 0);
  const hoursDone = entries.reduce((n, [, h]) => n + h, 0);
  const targetHours = round1(goal.perDay * goal.targetD);
  const start = goal.startDate || today;
  const finishBy = addDays(start, goal.targetD - 1);
  const elapsed = Math.min(goal.targetD, Math.max(0, daysBetween(start, today) + 1));

  return {
    daysDone: entries.length,
    hoursDone: round1(hoursDone),
    targetHours,
    pct: targetHours > 0 ? Math.min(100, Math.round((hoursDone / targetHours) * 100)) : 0,
    todayHours: round1(goal.log[today] ?? 0),
    finishBy,
    expectedByNow: round1(goal.perDay * elapsed),
    complete: targetHours > 0 && hoursDone >= targetHours,
  };
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ---------------------------------------------------------------- cycle

export interface CycleInfo {
  /** Average gap between logged starts, or the manual override, else 28. */
  length: number;
  /** Average logged duration in days, else 5. */
  duration: number;
  lastStart: string | null;
  ongoing: PeriodEntry | null;
  nextStart: string | null;
  /** 1-based day of the current cycle, null when nothing is logged. */
  dayOfCycle: number | null;
  daysUntilNext: number | null;
  /** True once enough history exists for the average to mean something. */
  estimated: boolean;
}

const DEFAULT_LENGTH = 28;
const DEFAULT_DURATION = 5;

export function cycleInfo(periods: PeriodEntry[], override: number | null, today: string): CycleInfo {
  const sorted = periods.slice().sort((a, b) => a.start.localeCompare(b.start));
  const last = sorted[sorted.length - 1] ?? null;

  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const g = daysBetween(sorted[i - 1].start, sorted[i].start);
    if (g >= 15 && g <= 60) gaps.push(g);
  }
  const measured = gaps.length ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : null;
  const length = override ?? measured ?? DEFAULT_LENGTH;

  const durations = sorted
    .filter(p => p.end)
    .map(p => daysBetween(p.start, p.end as string) + 1)
    .filter(d => d >= 1 && d <= 14);
  const duration = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : DEFAULT_DURATION;

  const ongoing = last && !last.end ? last : null;

  let nextStart: string | null = null;
  if (last) {
    nextStart = addDays(last.start, length);
    // If that prediction is already in the past, roll forward to the next one due.
    let guard = 0;
    while (nextStart < today && guard++ < 24) nextStart = addDays(nextStart, length);
  }

  return {
    length,
    duration,
    lastStart: last ? last.start : null,
    ongoing,
    nextStart,
    dayOfCycle: last ? daysBetween(last.start, today) + 1 : null,
    daysUntilNext: nextStart ? daysBetween(today, nextStart) : null,
    estimated: measured !== null,
  };
}

export type CycleMark = 'logged' | 'predicted';

/**
 * Cycle shading for a date window. Logged periods always win over predictions,
 * and predictions only run forward from the most recent logged start.
 */
export function cycleDayMap(
  periods: PeriodEntry[],
  info: CycleInfo,
  today: string,
  from: string,
  to: string,
): Record<string, CycleMark> {
  const out: Record<string, CycleMark> = {};
  if (!periods.length) return out;

  const last = periods.reduce((a, b) => (a.start > b.start ? a : b));
  // Predict forward from the last logged start until past the window.
  let cursor = last.start;
  let guard = 0;
  while (cursor <= to && guard++ < 60) {
    for (let i = 0; i < info.duration; i++) {
      const d = addDays(cursor, i);
      if (d >= from && d <= to && d > today) out[d] = 'predicted';
    }
    cursor = addDays(cursor, info.length);
  }

  // Logged days overwrite predictions.
  periods.forEach(p => {
    const end = p.end ?? today;
    const span = Math.max(0, daysBetween(p.start, end));
    for (let i = 0; i <= span && i < 40; i++) {
      const d = addDays(p.start, i);
      if (d >= from && d <= to) out[d] = 'logged';
    }
  });

  return out;
}

// ---------------------------------------------------------------- budget

export function perDayBudget(budget: Budget): number {
  const a = Number(budget.amount) || 0;
  return budget.scope === 'day' ? a : budget.scope === 'week' ? a / 7 : a / 30;
}

export interface Range {
  from: string;
  to: string;
  days: number;
}

export function scopeRange(scope: Scope, today: string, weekStart: WeekStart): Range {
  if (scope === 'day') return { from: today, to: today, days: 1 };
  if (scope === 'week') {
    const from = startOfWeek(today, weekStart);
    return { from, to: addDays(from, 6), days: 7 };
  }
  const from = startOfMonth(today);
  const to = endOfMonth(today);
  return { from, to, days: daysBetween(from, to) + 1 };
}

export function spentIn(spends: Spend[], range: Range): number {
  return spends
    .filter(s => s.date >= range.from && s.date <= range.to)
    .reduce((n, s) => n + (Number(s.amount) || 0), 0);
}

export function spentOn(spends: Spend[], date: string): number {
  return spends.filter(s => s.date === date).reduce((n, s) => n + (Number(s.amount) || 0), 0);
}

/** Days of the current scope already elapsed, used for pacing. */
export function elapsedInRange(range: Range, today: string): number {
  if (today < range.from) return 0;
  if (today > range.to) return range.days;
  return daysBetween(range.from, today) + 1;
}

/** The keypad is a running adder, not an expression parser: it sums every signed number typed. */
export function calcTotal(calc: string): number {
  const parts = calc.match(/[+-]?\d*\.?\d+/g);
  if (!parts) return 0;
  return Math.round(parts.reduce((n, p) => n + (Number(p) || 0), 0) * 100) / 100;
}

export function money(n: number, currency: string): string {
  const v = Math.round(n * 10) / 10;
  return currency + v.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

// ---------------------------------------------------------------- calendar

export interface MonthCell {
  key: string;
  day: number;
  inMonth: boolean;
}

/** A 6-row grid so the calendar never changes height as months change. */
export function monthGrid(y: number, m: number, weekStart: WeekStart): MonthCell[] {
  const first = new Date(y, m, 1);
  const lead = (first.getDay() - weekStart + 7) % 7;
  const gridStart = addDays(iso(first), -lead);
  const cells: MonthCell[] = [];
  for (let i = 0; i < 42; i++) {
    const key = addDays(gridStart, i);
    const d = parseISO(key);
    cells.push({ key, day: d.getDate(), inMonth: d.getMonth() === m && d.getFullYear() === y });
  }
  return cells;
}

// ---------------------------------------------------------------- streak

export interface StreakInfo {
  /** Consecutive days shown up, counting today if done, otherwise up to yesterday. */
  current: number;
  best: number;
  activeToday: boolean;
}

/**
 * The run of consecutive days ending today — or ending yesterday, when today has
 * not been logged yet. Missing a day only breaks the streak once that day is
 * over, so an unfinished today never reads as zero.
 */
export function streakInfo(activeDays: string[], today: string): StreakInfo {
  const days = new Set(activeDays.filter(d => d <= today));
  const activeToday = days.has(today);

  let current = 0;
  let cursor: string | null = activeToday ? today : days.has(addDays(today, -1)) ? addDays(today, -1) : null;
  while (cursor && days.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }

  const sorted = Array.from(days).sort();
  let best = 0;
  let run = 0;
  for (let i = 0; i < sorted.length; i++) {
    run = i > 0 && daysBetween(sorted[i - 1], sorted[i]) === 1 ? run + 1 : 1;
    if (run > best) best = run;
  }

  return { current, best: Math.max(best, current), activeToday };
}
