import type { Budget, PersistedData, Settings } from './types';

export const DEFAULT_ARTWORK = '/artwork/home_bg.png';
/** Earlier default. Saved settings still point at it and are moved to the new one. */
export const LEGACY_ARTWORK = '/artwork/tomato-stamp.jpg';

export const DEFAULT_SETTINGS: Settings = {
  currency: '৳',
  weekStart: 0,
  upcomingDays: 30,
  // Near-solid by default: the old 0.72 left text sitting on busy artwork.
  cardOpacity: 0.96,
  artworkUrl: DEFAULT_ARTWORK,
  artworkEnabled: true,
  sections: { calendar: true, today: true, upcoming: true, goals: true, cycle: true, budget: true, notes: true },
  // The three that define the day open; the rest start folded so Home stays short.
  collapsed: { calendar: false, today: false, upcoming: false, goals: true, cycle: true, budget: true, notes: true },
  haptics: true,
  notifications: true,
  cycleLength: null,
  pinnedNote: null,
  guideSeen: false,
  streak: true,
};

export const DEFAULT_BUDGET: Budget = { scope: 'week', amount: 0, saving: 0 };

/** A brand-new install starts genuinely empty — no one else's tasks, cycle or budget. */
export function emptyData(): PersistedData {
  return {
    tasks: [],
    goals: [],
    periods: [],
    budget: { ...DEFAULT_BUDGET },
    spends: [],
    budgetNotes: [],
    lists: [],
    activeDays: [],
    settings: {
      ...DEFAULT_SETTINGS,
      sections: { ...DEFAULT_SETTINGS.sections },
      collapsed: { ...DEFAULT_SETTINGS.collapsed },
    },
  };
}
