import { checkedFromLabels, stripLegacyMarkup } from './checklist';
import { iso, todayISO } from './date';
import { DEFAULT_BUDGET, DEFAULT_SETTINGS, emptyData, LEGACY_ARTWORK } from './defaults';
import { storage } from './storage';
import type { BudgetNote, Goal, ListNote, NoteKind, PeriodEntry, PersistedData, Repeat, Scope, SectionKey, Settings, Spend, Sticky, Task, WeekStart } from './types';
import { SECTION_KEYS } from './types';
import { uid } from './uid';

export const SCHEMA_VERSION = 2;

const KEY = 'appledhd.data';
/** The pre-versioning key: a bare AppState blob with UI state mixed into it. */
const LEGACY_KEY = 'appledhd-state-v1';

interface Envelope {
  v: number;
  data: PersistedData;
}

// ---------------------------------------------------------------- coercion

const rec = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? v as Record<string, unknown> : {});
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown, fb = ''): string => (typeof v === 'string' ? v : fb);
const num = (v: unknown, fb = 0): number => {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : fb;
};
const bool = (v: unknown, fb = false): boolean => (typeof v === 'boolean' ? v : fb);
const id = (v: unknown): string => (typeof v === 'string' && v ? v : typeof v === 'number' ? String(v) : uid());

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const isISO = (v: unknown): v is string => typeof v === 'string' && ISO.test(v);
const asScope = (v: unknown): Scope => (v === 'day' || v === 'week' || v === 'month' ? v : 'week');
const isWeekStart = (v: unknown): v is WeekStart => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 6;

// ---------------------------------------------------------------- records

function toRepeat(raw: unknown): Repeat | null {
  const o = rec(raw);
  const every = o.every;
  if (every !== 'day' && every !== 'week' && every !== 'month') return null;
  return { every, until: isISO(o.until) ? o.until : null };
}

function toTask(raw: unknown): Task | null {
  const o = rec(raw);
  if (!isISO(o.date)) return null;
  const title = str(o.title).trim();
  if (!title) return null;
  const time = typeof o.time === 'string' && /^\d{2}:\d{2}/.test(o.time) ? o.time.slice(0, 5) : null;
  return {
    id: id(o.id),
    title,
    cat: str(o.cat, 'mild'),
    date: o.date,
    time,
    done: bool(o.done),
    note: str(o.note) || undefined,
    remind: o.remind === null || o.remind === undefined ? null : num(o.remind, 0),
    repeat: toRepeat(o.repeat),
    doneDates: arr(o.doneDates).filter(isISO),
    skipDates: arr(o.skipDates).filter(isISO),
    order: num(o.order, 0),
    createdAt: num(o.createdAt, Date.now()),
  };
}

function toGoal(raw: unknown): Goal | null {
  const o = rec(raw);
  const name = str(o.name).trim();
  if (!name) return null;
  const perDay = Math.max(0.25, num(o.perDay, 1));

  // v1 recorded a bare list of ticked dates; credit each one the full daily target.
  const log: Record<string, number> = {};
  if (Array.isArray(o.ticks)) {
    o.ticks.forEach(d => { if (isISO(d)) log[d] = perDay; });
  }
  Object.entries(rec(o.log)).forEach(([d, h]) => { if (isISO(d)) log[d] = Math.max(0, num(h, 0)); });

  const logged = Object.keys(log).sort();
  return {
    id: id(o.id),
    name,
    perDay,
    targetD: Math.max(1, Math.round(num(o.targetD, 1))),
    startDate: isISO(o.startDate) ? o.startDate : (logged[0] ?? ''),
    log,
    archived: bool(o.archived) || undefined,
    createdAt: num(o.createdAt, Date.now()),
  };
}

function toPeriod(raw: unknown): PeriodEntry | null {
  const o = rec(raw);
  if (!isISO(o.start)) return null;
  return { id: id(o.id), start: o.start, end: isISO(o.end) ? o.end : null };
}

function toSpend(raw: unknown): Spend | null {
  const o = rec(raw);
  if (!isISO(o.date)) return null;
  const amount = num(o.amount, 0);
  if (!amount) return null;
  return { id: id(o.id), date: o.date, amount, label: str(o.label) || undefined };
}

function toBudgetNote(raw: unknown): BudgetNote | null {
  const o = rec(raw);
  const text = str(o.text).trim();
  if (!text) return null;
  return { id: id(o.id), date: isISO(o.date) ? o.date : '', text, done: bool(o.done) };
}

function toSticky(raw: unknown, index: number): Sticky | null {
  const o = rec(raw);
  const text = str(o.text);
  // Blank is allowed: a sticky created and not yet written on should survive the
  // app being backgrounded mid-thought.
  return {
    id: id(o.id),
    text,
    color: Math.max(0, Math.round(num(o.color, index))),
    order: num(o.order, index),
  };
}

function toList(raw: unknown): ListNote | null {
  const o = rec(raw);
  const title = str(o.title).trim();
  const text = str(o.text);
  const stickies = arr(o.stickies).map(toSticky).filter((x): x is Sticky => !!x);
  if (!title && !text && !stickies.length) return null;
  // Everything written before boards existed is a page.
  const kind: NoteKind = o.kind === 'board' ? 'board' : 'page';
  // Two older shapes to carry forward: `- [x]` written inline in the text, and
  // the brief spell where ticks were keyed by the item's own words.
  const legacy = stripLegacyMarkup(text);
  const rawChecked = arr(o.checked);
  const asNumbers = rawChecked.filter((x): x is number => typeof x === 'number');
  const asLabels = rawChecked.filter((x): x is string => typeof x === 'string');

  const checked = asNumbers.length ? asNumbers
    : asLabels.length ? checkedFromLabels(legacy.text, asLabels)
    : legacy.checked;

  return {
    id: id(o.id),
    title: title || 'untitled note',
    kind,
    color: Math.max(0, Math.round(num(o.color, 0))),
    text: legacy.text,
    checked,
    stickies: stickies.sort((a, b) => a.order - b.order),
    updatedAt: num(o.updatedAt, Date.now()),
  };
}

function toSettings(raw: unknown, legacyCycle: number | null): Settings {
  const o = rec(raw);
  const sections = { ...DEFAULT_SETTINGS.sections };
  const savedSections = rec(o.sections);
  SECTION_KEYS.forEach((k: SectionKey) => { sections[k] = bool(savedSections[k], true); });

  const collapsed = { ...DEFAULT_SETTINGS.collapsed };
  const savedCollapsed = rec(o.collapsed);
  SECTION_KEYS.forEach((k: SectionKey) => { collapsed[k] = bool(savedCollapsed[k], DEFAULT_SETTINGS.collapsed[k]); });

  const cycleRaw = o.cycleLength;
  const cycleLength = cycleRaw === null || cycleRaw === undefined
    ? legacyCycle
    : Math.min(60, Math.max(15, Math.round(num(cycleRaw, 28))));

  return {
    currency: str(o.currency, DEFAULT_SETTINGS.currency) || DEFAULT_SETTINGS.currency,
    weekStart: isWeekStart(o.weekStart) ? o.weekStart : 0,
    upcomingDays: Math.min(60, Math.max(7, Math.round(num(o.upcomingDays, DEFAULT_SETTINGS.upcomingDays)))),
    cardOpacity: Math.min(1, Math.max(0.4, num(o.cardOpacity, DEFAULT_SETTINGS.cardOpacity))),
    // The artwork is not user-chosen, so a saved copy of the old default is just
    // the old default: move it along, or existing installs would keep the old image.
    artworkUrl: (str(o.artworkUrl) && str(o.artworkUrl) !== LEGACY_ARTWORK) ? str(o.artworkUrl) : DEFAULT_SETTINGS.artworkUrl,
    artworkEnabled: bool(o.artworkEnabled, true),
    sections,
    collapsed,
    haptics: bool(o.haptics, true),
    notifications: bool(o.notifications, true),
    cycleLength,
    pinnedNote: typeof o.pinnedNote === 'string' ? o.pinnedNote : null,
    guideSeen: bool(o.guideSeen),
    streak: bool(o.streak, true),
  };
}

// ---------------------------------------------------------------- streak

const MAX_ACTIVE_DAYS = 800;

function normaliseDays(days: string[]): string[] {
  return Array.from(new Set(days)).sort().slice(-MAX_ACTIVE_DAYS);
}

/**
 * Seeds the streak for data saved before streaks existed.
 *
 * Only dates the data itself can vouch for count: goal hours logged, spending
 * recorded, repeating tasks ticked, tasks created and notes edited. Nothing is
 * invented, so someone who used the app every day last week keeps that credit
 * instead of opening the update to a streak of zero.
 */
function backfillActiveDays(body: Record<string, unknown>): string[] {
  const today = todayISO();
  const days: string[] = [];
  const dayOf = (ms: unknown) => (typeof ms === 'number' && ms > 0 ? iso(new Date(ms)) : null);

  arr(body.goals).forEach(g => {
    Object.entries(rec(rec(g).log)).forEach(([d, h]) => { if (isISO(d) && num(h, 0) > 0) days.push(d); });
  });
  arr(body.spends).forEach(sp => { const d = rec(sp).date; if (isISO(d)) days.push(d); });
  arr(body.tasks).forEach(t => {
    const o = rec(t);
    arr(o.doneDates).forEach(d => { if (isISO(d)) days.push(d); });
    const made = dayOf(o.createdAt);
    if (made) days.push(made);
  });
  arr(body.lists).forEach(l => { const d = dayOf(rec(l).updatedAt); if (d) days.push(d); });

  return normaliseDays(days.filter(d => d <= today));
}

// ---------------------------------------------------------------- migration

/**
 * Normalises any previously stored shape into the current `PersistedData`.
 * Written defensively: this parses data the user cannot afford to lose, so a bad
 * field drops that one record rather than throwing the whole planner away.
 */
export function migrate(raw: unknown): PersistedData {
  const root = rec(raw);
  // v2 wraps the data in an envelope; v1 stored the AppState blob at the top level.
  const body = typeof root.v === 'number' ? rec(root.data) : root;

  // v1 held one period object with the cycle length folded into it.
  const legacyPeriod = rec(body.period);
  const legacyCycle = legacyPeriod.cycle !== undefined
    ? Math.min(60, Math.max(15, Math.round(num(legacyPeriod.cycle, 28))))
    : null;

  const periods = arr(body.periods).map(toPeriod).filter((p): p is PeriodEntry => !!p);
  if (!periods.length && isISO(legacyPeriod.start)) {
    const p = toPeriod(legacyPeriod);
    if (p) periods.push(p);
  }

  const budgetRaw = rec(body.budget);

  return {
    tasks: arr(body.tasks).map(toTask).filter((t): t is Task => !!t),
    goals: arr(body.goals).map(toGoal).filter((g): g is Goal => !!g),
    periods: periods.sort((a, b) => a.start.localeCompare(b.start)),
    budget: {
      scope: asScope(budgetRaw.scope),
      amount: Math.max(0, num(budgetRaw.amount, DEFAULT_BUDGET.amount)),
      saving: Math.max(0, num(budgetRaw.saving, DEFAULT_BUDGET.saving)),
    },
    spends: arr(body.spends).map(toSpend).filter((s): s is Spend => !!s),
    // v1 called these `notes`; the key is now explicit about which notes they are.
    budgetNotes: arr(body.budgetNotes ?? body.notes).map(toBudgetNote).filter((n): n is BudgetNote => !!n),
    lists: arr(body.lists).map(toList).filter((l): l is ListNote => !!l),
    activeDays: Array.isArray(body.activeDays)
      ? normaliseDays(body.activeDays.filter(isISO))
      : backfillActiveDays(body),
    settings: toSettings(body.settings, legacyCycle),
  };
}

// ---------------------------------------------------------------- io

export async function loadData(): Promise<PersistedData> {
  for (const key of [KEY, LEGACY_KEY]) {
    try {
      const raw = await storage.get(key);
      if (!raw) continue;
      return migrate(JSON.parse(raw));
    } catch {
      // Unreadable entry — try the next key rather than wiping what is there.
    }
  }
  // A fresh install simply starts empty: no setup, no sample data.
  return emptyData();
}

export async function saveData(data: PersistedData): Promise<void> {
  const envelope: Envelope = { v: SCHEMA_VERSION, data };
  await storage.set(KEY, JSON.stringify(envelope));
}

/** Serialised backup for the export/import feature. */
export function serialise(data: PersistedData): string {
  return JSON.stringify({ v: SCHEMA_VERSION, app: 'appledhd', exportedAt: new Date().toISOString(), data }, null, 2);
}

export function deserialise(text: string): PersistedData {
  return migrate(JSON.parse(text));
}
