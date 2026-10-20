import { addDays, todayISO } from './date';
import { DEFAULT_SETTINGS } from './defaults';
import type { PersistedData } from './types';
import { uid } from './uid';

/**
 * Sample data, offered from Settings — never loaded automatically.
 *
 * The previous build seeded this on first run, so a brand-new user opened the app
 * to someone else's exams, art commissions, logged period and budget. It now has
 * to be asked for.
 */
export function sampleData(): PersistedData {
  const today = todayISO();
  const now = Date.now();

  return {
    tasks: [
      { id: uid(), title: 'dsa practice', cat: 'mild', date: today, time: '14:00', done: true, remind: null, repeat: null, doneDates: [], skipDates: [], order: 0, createdAt: now },
      { id: uid(), title: 'stats revision', cat: 'mild', date: today, time: '19:30', done: false, remind: null, repeat: null, doneDates: [], skipDates: [], order: 0, createdAt: now },
      { id: uid(), title: 'dsa exam', cat: 'vimp', date: addDays(today, 3), time: '09:00', done: false, remind: 60, repeat: null, doneDates: [], skipDates: [], order: 0, createdAt: now },
      { id: uid(), title: 'presentation', cat: 'important', date: addDays(today, 7), time: '10:00', done: false, remind: 30, repeat: null, doneDates: [], skipDates: [], order: 0, createdAt: now },
      { id: uid(), title: 'group project', cat: 'vimp', date: addDays(today, 10), time: '23:59', done: false, remind: null, repeat: null, doneDates: [], skipDates: [], order: 0, createdAt: now },
      { id: uid(), title: 'gym', cat: 'mild', date: addDays(today, -7), time: '18:00', done: false, remind: null, repeat: { every: 'week', until: null }, doneDates: [addDays(today, -7)], skipDates: [], order: 0, createdAt: now },
    ],

    goals: [
      {
        id: uid(), name: 'art commission', perDay: 2, targetD: 10, startDate: addDays(today, -6), createdAt: now,
        log: logFrom(today, [[-6, 2], [-5, 2], [-4, 1.5], [-3, 2.5], [-2, 2], [-1, 1]]),
      },
      {
        id: uid(), name: 'animation practice', perDay: 1.5, targetD: 15, startDate: addDays(today, -9), createdAt: now,
        log: logFrom(today, [[-9, 1.5], [-8, 2], [-7, 1], [-6, 1.5], [-5, 1.5], [-3, 0.5], [-2, 1.5], [-1, 2]]),
      },
      {
        id: uid(), name: 'machine learning course', perDay: 3, targetD: 20, startDate: addDays(today, -14), createdAt: now,
        log: logFrom(today, [[-14, 3], [-13, 2], [-12, 3], [-11, 4], [-10, 3], [-9, 1], [-7, 3], [-6, 3], [-5, 2], [-4, 3], [-2, 1.5], [-1, 3]]),
      },
    ],

    periods: [
      { id: uid(), start: addDays(today, -42), end: addDays(today, -38) },
      { id: uid(), start: addDays(today, -13), end: addDays(today, -9) },
    ],

    budget: { scope: 'week', amount: 3000, saving: 5000 },

    spends: [
      { id: uid(), date: addDays(today, -4), amount: 260, label: 'groceries' },
      { id: uid(), date: addDays(today, -3), amount: 90, label: 'bus fare' },
      { id: uid(), date: addDays(today, -2), amount: 415 },
      { id: uid(), date: addDays(today, -1), amount: 150, label: 'coffee' },
    ],

    budgetNotes: [
      { id: uid(), date: addDays(today, -1), text: 'bought bazar', done: true },
      { id: uid(), date: today, text: 'need a new drawing tablet', done: false },
    ],

    lists: [
      {
        id: uid(), title: 'monthly rent', kind: 'page', color: 0, stickies: [], checked: [0], updatedAt: now,
        text: '- flat 3B rent — 12000\n- water bill — 450\n- gas — 1050',
      },
      {
        id: uid(), title: 'resolutions', kind: 'page', color: 2, stickies: [], checked: [], updatedAt: now,
        text: '- draw every day\n- sleep before 1am\n- finish the ML course',
      },
      {
        id: uid(), title: 'ideas', kind: 'board', color: 3, text: '', checked: [], updatedAt: now,
        stickies: [
          { id: uid(), text: 'tomato sticker sheet', color: 0, order: 0 },
          { id: uid(), text: 'ask about the animation course', color: 1, order: 1 },
          { id: uid(), text: 'birthday gift — sketchbook?', color: 2, order: 2 },
        ],
      },
    ],

    // Six days running, ending yesterday — the streak is alive and waiting for today.
    activeDays: [-6, -5, -4, -3, -2, -1].map(n => addDays(today, n)).concat([-12, -11, -10].map(n => addDays(today, n))),

    settings: {
      ...DEFAULT_SETTINGS,
      sections: { ...DEFAULT_SETTINGS.sections },
      collapsed: { ...DEFAULT_SETTINGS.collapsed },
      guideSeen: true,
    },
  };
}

function logFrom(today: string, pairs: [number, number][]): Record<string, number> {
  const out: Record<string, number> = {};
  pairs.forEach(([offset, hours]) => { out[addDays(today, offset)] = hours; });
  return out;
}
