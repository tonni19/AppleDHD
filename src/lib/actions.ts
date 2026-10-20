import { compareTasks, round1 } from './logic';
/*
 * A note on purity.
 *
 * Every function here is applied inside a React state updater, and React may run
 * an updater more than once for a single update — StrictMode does it on purpose.
 * So nothing in this file may invent identity: ids are supplied by the caller,
 * because an id minted here could differ between invocations, and code that
 * captured the first one would navigate to a record that does not exist. That is
 * exactly the bug that made a freshly created note open blank.
 *
 * `Date.now()` for createdAt/updatedAt is the deliberate exception. It is
 * non-deterministic but not identity: React keeps one result and discards the
 * other, so no caller can end up holding a timestamp the stored data disagrees
 * with, and nothing downstream matches on it.
 */
import type { BudgetNote, Draft, Goal, ListNote, NoteKind, PeriodEntry, PersistedData, Settings, Spend, Sticky, Task } from './types';

type D = PersistedData;

// ---------------------------------------------------------------- tasks

export function addTask(d: D, id: string, draft: Draft, fallbackDate: string): D {
  const title = draft.title.trim();
  if (!title) return d;
  const date = draft.date || fallbackDate;
  // Land at the end of whatever order the day already has.
  const last = d.tasks.filter(t => t.date === date).reduce((n, t) => Math.max(n, t.order), 0);
  const task: Task = {
    id,
    title,
    cat: draft.cat,
    date,
    time: draft.time,
    done: false,
    note: draft.note.trim() || undefined,
    remind: draft.remind,
    repeat: draft.repeat,
    doneDates: [],
    skipDates: [],
    order: last + 1,
    createdAt: Date.now(),
  };
  return { ...d, tasks: d.tasks.concat(task) };
}

/**
 * Moves a task up or down within its day.
 *
 * Every task on the day is renumbered from its current displayed order, so a
 * day that has never been rearranged (all orders at 0) gets a stable sequence
 * on the first move rather than collapsing back to the time sort.
 */
export function moveTask(d: D, id: string, dir: -1 | 1): D {
  const task = d.tasks.find(t => t.id === id);
  if (!task) return d;

  const day = d.tasks.filter(t => t.date === task.date).sort(compareTasks);
  const from = day.findIndex(t => t.id === id);
  const to = from + dir;
  if (from < 0 || to < 0 || to >= day.length) return d;

  day.splice(to, 0, day.splice(from, 1)[0]);
  const position = new Map(day.map((t, i) => [t.id, i]));

  return {
    ...d,
    tasks: d.tasks.map(t => (position.has(t.id) ? { ...t, order: position.get(t.id) as number } : t)),
  };
}

export function updateTask(d: D, id: string, draft: Draft): D {
  const title = draft.title.trim();
  if (!title) return d;
  return {
    ...d,
    tasks: d.tasks.map(t => (t.id !== id ? t : {
      ...t,
      title,
      cat: draft.cat,
      date: draft.date,
      time: draft.time,
      note: draft.note.trim() || undefined,
      remind: draft.remind,
      repeat: draft.repeat,
      // Turning a repeat off leaves per-occurrence state meaningless.
      doneDates: draft.repeat ? t.doneDates : [],
      skipDates: draft.repeat ? t.skipDates : [],
    })),
  };
}

export function deleteTask(d: D, id: string): D {
  return { ...d, tasks: d.tasks.filter(t => t.id !== id) };
}

/**
 * Ticks a task off. For a repeating one this records the single occurrence
 * rather than the series, so last Tuesday staying done does not mark every
 * Tuesday done.
 */
export function toggleTask(d: D, id: string, date: string): D {
  return {
    ...d,
    tasks: d.tasks.map(t => {
      if (t.id !== id) return t;
      if (!t.repeat) return { ...t, done: !t.done };
      const has = t.doneDates.includes(date);
      return { ...t, doneDates: has ? t.doneDates.filter(x => x !== date) : t.doneDates.concat(date) };
    }),
  };
}

/** Removes a single occurrence of a repeating task, leaving the series intact. */
export function skipOccurrence(d: D, id: string, date: string): D {
  return {
    ...d,
    tasks: d.tasks.map(t => (t.id !== id || !t.repeat || t.skipDates.includes(date)
      ? t
      : { ...t, skipDates: t.skipDates.concat(date), doneDates: t.doneDates.filter(x => x !== date) })),
  };
}

// ---------------------------------------------------------------- goals

export function addGoal(d: D, id: string, name: string, perDay: number, targetD: number, today: string): D {
  const clean = name.trim();
  if (!clean) return d;
  const goal: Goal = {
    id,
    name: clean,
    perDay: Math.max(0.25, perDay),
    targetD: Math.max(1, Math.round(targetD)),
    startDate: today,
    log: {},
    createdAt: Date.now(),
  };
  return { ...d, goals: d.goals.concat(goal) };
}

export function updateGoal(d: D, id: string, patch: Partial<Pick<Goal, 'name' | 'perDay' | 'targetD'>>): D {
  return {
    ...d,
    goals: d.goals.map(g => (g.id !== id ? g : {
      ...g,
      ...(patch.name !== undefined ? { name: patch.name.trim() || g.name } : {}),
      ...(patch.perDay !== undefined ? { perDay: Math.max(0.25, patch.perDay) } : {}),
      ...(patch.targetD !== undefined ? { targetD: Math.max(1, Math.round(patch.targetD)) } : {}),
    })),
  };
}

export function deleteGoal(d: D, id: string): D {
  return { ...d, goals: d.goals.filter(g => g.id !== id) };
}

export function archiveGoal(d: D, id: string, archived: boolean): D {
  return { ...d, goals: d.goals.map(g => (g.id === id ? { ...g, archived: archived || undefined } : g)) };
}

/** Record an exact number of hours for a day. Zero clears the entry. */
export function setGoalHours(d: D, id: string, date: string, hours: number): D {
  return {
    ...d,
    goals: d.goals.map(g => {
      if (g.id !== id) return g;
      const log = { ...g.log };
      const v = round1(Math.max(0, Math.min(24, hours)));
      if (v <= 0) delete log[date];
      else log[date] = v;
      return { ...g, log };
    }),
  };
}

/** Nudge a day's hours up or down — the +/- controls on a goal card. */
export function addGoalHours(d: D, id: string, date: string, delta: number): D {
  const goal = d.goals.find(g => g.id === id);
  if (!goal) return d;
  return setGoalHours(d, id, date, (goal.log[date] ?? 0) + delta);
}

// ---------------------------------------------------------------- cycle

/** Starts a new period, closing any still-open one the day before. */
export function startPeriod(d: D, id: string, date: string): D {
  const periods = d.periods
    .filter(p => p.start !== date)
    .map(p => (p.end === null && p.start < date ? { ...p, end: date } : p));
  const entry: PeriodEntry = { id, start: date, end: null };
  return { ...d, periods: periods.concat(entry).sort((a, b) => a.start.localeCompare(b.start)) };
}

/** Closes the most recent period that starts on or before `date`. */
export function endPeriod(d: D, date: string): D {
  const candidates = d.periods.filter(p => p.start <= date).sort((a, b) => a.start.localeCompare(b.start));
  const target = candidates[candidates.length - 1];
  if (!target) return d;
  return { ...d, periods: d.periods.map(p => (p.id === target.id ? { ...p, end: date } : p)) };
}

export function updatePeriod(d: D, id: string, patch: Partial<Pick<PeriodEntry, 'start' | 'end'>>): D {
  return {
    ...d,
    periods: d.periods
      .map(p => (p.id === id ? { ...p, ...patch } : p))
      // An end before its start is meaningless; drop the end rather than keep it.
      .map(p => (p.end && p.end < p.start ? { ...p, end: null } : p))
      .sort((a, b) => a.start.localeCompare(b.start)),
  };
}

export function deletePeriod(d: D, id: string): D {
  return { ...d, periods: d.periods.filter(p => p.id !== id) };
}

/** Removes whichever period covers a date — the calendar's "not actually a period day". */
export function clearPeriodOn(d: D, date: string, fallbackEnd: string): D {
  const hit = d.periods.find(p => date >= p.start && date <= (p.end ?? fallbackEnd));
  return hit ? deletePeriod(d, hit.id) : d;
}

// ---------------------------------------------------------------- budget

export function setBudget(d: D, scope: D['budget']['scope'], amount: number, saving: number): D {
  return { ...d, budget: { scope, amount: Math.max(0, amount), saving: Math.max(0, saving) } };
}

export function logSpend(d: D, id: string, date: string, amount: number, label?: string): D {
  if (!amount) return d;
  const entry: Spend = { id, date, amount, label: label?.trim() || undefined };
  return { ...d, spends: d.spends.concat(entry) };
}

export function deleteSpend(d: D, id: string): D {
  return { ...d, spends: d.spends.filter(s => s.id !== id) };
}

/** Wipes logged spending in a date range, leaving the budget settings intact. */
export function clearSpends(d: D, from: string, to: string): D {
  return { ...d, spends: d.spends.filter(s => s.date < from || s.date > to) };
}

export function addBudgetNote(d: D, id: string, text: string, date: string): D {
  const clean = text.trim();
  if (!clean) return d;
  const note: BudgetNote = { id, date, text: clean, done: false };
  return { ...d, budgetNotes: d.budgetNotes.concat(note) };
}

export function toggleBudgetNote(d: D, id: string): D {
  return { ...d, budgetNotes: d.budgetNotes.map(n => (n.id === id ? { ...n, done: !n.done } : n)) };
}

export function deleteBudgetNote(d: D, id: string): D {
  return { ...d, budgetNotes: d.budgetNotes.filter(n => n.id !== id) };
}

export function clearDoneBudgetNotes(d: D): D {
  return { ...d, budgetNotes: d.budgetNotes.filter(n => !n.done) };
}

// ---------------------------------------------------------------- notepad

/**
 * The id is supplied by the caller rather than minted here.
 *
 * State updaters must be pure — React may invoke one more than once for a
 * single update (it does exactly that under StrictMode). Generating the id
 * inside meant the id the caller captured was not always the id that got
 * stored, and navigating to it landed on a note that did not exist.
 */
export function addList(d: D, id: string, title: string, kind: NoteKind = 'page', color = 0): D {
  const note: ListNote = {
    id,
    title: title.trim() || 'untitled note',
    kind,
    color,
    text: '',
    checked: [],
    stickies: [],
    updatedAt: Date.now(),
  };
  return { ...d, lists: d.lists.concat(note) };
}

/** Replaces the ticked set for a page. */
export function setListChecked(d: D, id: string, checked: number[]): D {
  return { ...d, lists: d.lists.map(l => (l.id === id ? { ...l, checked, updatedAt: Date.now() } : l)) };
}

/** Writes text and ticks together, for actions that change both. */
export function setListContent(d: D, id: string, text: string, checked: number[]): D {
  return { ...d, lists: d.lists.map(l => (l.id === id ? { ...l, text, checked, updatedAt: Date.now() } : l)) };
}

export function setListText(d: D, id: string, text: string): D {
  return { ...d, lists: d.lists.map(l => (l.id === id ? { ...l, text, updatedAt: Date.now() } : l)) };
}

export function renameList(d: D, id: string, title: string): D {
  const clean = title.trim();
  if (!clean) return d;
  return { ...d, lists: d.lists.map(l => (l.id === id ? { ...l, title: clean, updatedAt: Date.now() } : l)) };
}

export function setListColor(d: D, id: string, color: number): D {
  return { ...d, lists: d.lists.map(l => (l.id === id ? { ...l, color, updatedAt: Date.now() } : l)) };
}

export function deleteList(d: D, id: string): D {
  return {
    ...d,
    lists: d.lists.filter(l => l.id !== id),
    // A pinned note that no longer exists would leave a dead card on Home.
    settings: d.settings.pinnedNote === id ? { ...d.settings, pinnedNote: null } : d.settings,
  };
}

/** Pins a note to Home, or unpins it when it is already the pinned one. */
export function togglePinnedNote(d: D, id: string): D {
  return {
    ...d,
    settings: { ...d.settings, pinnedNote: d.settings.pinnedNote === id ? null : id },
  };
}

// ---------------------------------------------------------------- stickies

function withStickies(d: D, noteId: string, fn: (s: Sticky[]) => Sticky[]): D {
  return {
    ...d,
    lists: d.lists.map(l => (l.id !== noteId ? l : { ...l, stickies: fn(l.stickies), updatedAt: Date.now() })),
  };
}

/**
 * Adds a sticky, blank by default. An empty sticky is a valid thing to create —
 * you put it on the board and then write on it — so this deliberately does not
 * reject empty text the way the other add actions do. The board removes one that
 * is still empty when you finish with it.
 */
export function addSticky(d: D, noteId: string, stickyId: string, text: string, color: number): D {
  return withStickies(d, noteId, list => list.concat({
    id: stickyId,
    text: text.trim(),
    color,
    order: list.reduce((n, x) => Math.max(n, x.order), -1) + 1,
  }));
}

export function updateSticky(d: D, noteId: string, stickyId: string, patch: Partial<Pick<Sticky, 'text' | 'color'>>): D {
  return withStickies(d, noteId, list => list.map(x => (x.id === stickyId ? { ...x, ...patch } : x)));
}

export function deleteSticky(d: D, noteId: string, stickyId: string): D {
  return withStickies(d, noteId, list => list.filter(x => x.id !== stickyId));
}

/** Moves a sticky to a new position, renumbering the board from the result. */
export function moveSticky(d: D, noteId: string, stickyId: string, toIndex: number): D {
  return withStickies(d, noteId, list => {
    const sorted = list.slice().sort((a, b) => a.order - b.order);
    const from = sorted.findIndex(x => x.id === stickyId);
    if (from < 0) return list;
    const target = Math.max(0, Math.min(sorted.length - 1, toIndex));
    if (target === from) return list;
    sorted.splice(target, 0, sorted.splice(from, 1)[0]);
    return sorted.map((x, i) => ({ ...x, order: i }));
  });
}

// ---------------------------------------------------------------- streak

/**
 * Records that the user did something today.
 *
 * Idempotent, so every qualifying action can call it without checking first.
 * `today` comes from the caller for the same purity reason ids do.
 */
export function markActive(d: D, today: string): D {
  if (d.activeDays.includes(today)) return d;
  return { ...d, activeDays: d.activeDays.concat(today).sort().slice(-800) };
}

// ---------------------------------------------------------------- settings

export function setSettings(d: D, patch: Partial<Settings>): D {
  return { ...d, settings: { ...d.settings, ...patch } };
}

/** Folds a Home section open or shut. Distinct from hiding it entirely. */
export function toggleCollapsed(d: D, key: keyof Settings['collapsed']): D {
  return {
    ...d,
    settings: { ...d.settings, collapsed: { ...d.settings.collapsed, [key]: !d.settings.collapsed[key] } },
  };
}

export function toggleSection(d: D, key: keyof Settings['sections']): D {
  return {
    ...d,
    settings: { ...d.settings, sections: { ...d.settings.sections, [key]: !d.settings.sections[key] } },
  };
}

/** Applies an end date to the newest period when the sheet supplied one. */
export function endPeriodIfNeeded(d: D, end: string | null): D {
  if (!end) return d;
  return endPeriod(d, end);
}
