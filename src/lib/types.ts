export type Scope = 'day' | 'week' | 'month';

/** Sections the user can show or hide, in the order they appear on Home. */
export type SectionKey = 'calendar' | 'today' | 'upcoming' | 'goals' | 'cycle' | 'budget' | 'notes';

export const SECTION_KEYS: SectionKey[] = ['calendar', 'today', 'upcoming', 'goals', 'cycle', 'budget', 'notes'];

export const SECTION_LABEL: Record<SectionKey, string> = {
  calendar: 'calendar',
  today: "today's plan",
  upcoming: 'upcoming',
  goals: 'extra goals',
  cycle: 'menstrual cycle',
  budget: 'budget planner',
  notes: 'notepad',
};

// ---------------------------------------------------------------- domain

export type RepeatEvery = 'day' | 'week' | 'month';

export interface Repeat {
  every: RepeatEvery;
  /** Last date the repeat runs; null means it keeps going. */
  until: string | null;
}

export interface Task {
  id: string;
  title: string;
  cat: string;
  date: string;
  /** 'HH:MM', or null for an all-day item that sorts above timed ones. */
  time: string | null;
  done: boolean;
  note?: string;
  /** Minutes before the task to fire a local notification; null = no reminder. */
  remind: number | null;
  /**
   * A repeating task is stored once and expanded when read, so "every Tuesday"
   * is one row rather than a hundred. `date` becomes the series start.
   */
  repeat: Repeat | null;
  /** Occurrence dates already ticked off. Repeating tasks only. */
  doneDates: string[];
  /** Occurrence dates deleted individually. Repeating tasks only. */
  skipDates: string[];
  /** Manual position within its day. Lower sorts first; ties fall back to time. */
  order: number;
  createdAt: number;
}

export interface Goal {
  id: string;
  name: string;
  /** Target hours per day. */
  perDay: number;
  targetD: number;
  startDate: string;
  /** ISO date -> hours actually worked that day. Replaces the old boolean ticks. */
  log: Record<string, number>;
  archived?: boolean;
  createdAt: number;
}

/** One logged period. `end` stays null while it is still ongoing. */
export interface PeriodEntry {
  id: string;
  start: string;
  end: string | null;
}

export interface Budget {
  scope: Scope;
  amount: number;
  saving: number;
}

export interface Spend {
  id: string;
  date: string;
  amount: number;
  label?: string;
}

export interface BudgetNote {
  id: string;
  date: string;
  text: string;
  done: boolean;
}

/** A note is either a page you write on or a board you stick things to. */
export type NoteKind = 'page' | 'board';

export interface Sticky {
  id: string;
  text: string;
  /** Index into STICKY_TINT; stored as a number so the palette can change. */
  color: number;
  order: number;
}

export interface ListNote {
  id: string;
  title: string;
  kind: NoteKind;
  /** Index into STICKY_TINT — notes and stickies share one palette. */
  color: number;
  /** Ruled-paper contents. Used by pages; empty on boards. */
  text: string;
  /** Line numbers of ticked checklist items. See lib/checklist. */
  checked: number[];
  /** Sticky notes. Used by boards; empty on pages. */
  stickies: Sticky[];
  updatedAt: number;
}

/** The day a week starts on: 0 = Sunday … 6 = Saturday, matching Date#getDay(). */
export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Settings {
  currency: string;
  weekStart: WeekStart;
  /** How far ahead the home "upcoming" list looks, in days. */
  upcomingDays: number;
  /** Opacity of every card shell. 1 = fully solid. */
  cardOpacity: number;
  artworkUrl: string;
  artworkEnabled: boolean;
  sections: Record<SectionKey, boolean>;
  /** Which sections are folded shut on Home. Shown but collapsed is not hidden. */
  collapsed: Record<SectionKey, boolean>;
  haptics: boolean;
  notifications: boolean;
  /** Manual override for cycle length; null means average the logged history. */
  cycleLength: number | null;
  /** Note kept on the home screen for quick reference; null for none. */
  pinnedNote: string | null;
  /** Set once the welcome card is dismissed. Not offered as a setting. */
  guideSeen: boolean;
  /**
   * Show the daily streak. Turning it off hides it but keeps recording, so
   * switching it back on does not wipe out a streak that was quietly continuing.
   */
  streak: boolean;
}

// ---------------------------------------------------------------- persistence

/**
 * Everything written to disk. Deliberately excludes the current date, open sheets,
 * scroll position and in-flight drafts: restoring those is what made the app think
 * it was still yesterday when reopened the next morning.
 */
export interface PersistedData {
  tasks: Task[];
  goals: Goal[];
  periods: PeriodEntry[];
  budget: Budget;
  spends: Spend[];
  budgetNotes: BudgetNote[];
  lists: ListNote[];
  /** Local ISO dates on which the user did something. Drives the streak. */
  activeDays: string[];
  settings: Settings;
}

// ---------------------------------------------------------------- drafts

export interface Draft {
  /** Set when editing an existing task rather than creating one. */
  id: string | null;
  repeat: Repeat | null;
  title: string;
  cat: string;
  date: string;
  time: string | null;
  note: string;
  remind: number | null;
}

export interface GoalDraft {
  id: string | null;
  name: string;
  hours: number | string;
  days: number | string;
}

export interface BudgetDraft {
  scope: Scope;
  amount: number | string;
  saving: number | string;
}
