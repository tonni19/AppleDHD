import type { SectionKey } from './types';

/** Screens reachable from the tab bar. */
export type TabName = 'home' | 'goals' | 'cycle' | 'budget' | 'notes';

/** Every full-screen destination. */
export type ScreenName = TabName | 'day' | 'note' | 'goal' | 'settings' | 'search';

/** Every bottom sheet. Sheets live in the nav stack so back dismisses them. */
export type SheetName = 'addTask' | 'editGoal' | 'budgetSettings' | 'newNote' | 'renameNote' | 'logPeriod' | 'logHours' | 'logSpend';

export type Layer =
  | { t: 'screen'; name: ScreenName; param?: string }
  | { t: 'sheet'; name: SheetName; param?: string };

export const screen = (name: ScreenName, param?: string): Layer => ({ t: 'screen', name, param });
export const sheet = (name: SheetName, param?: string): Layer => ({ t: 'sheet', name, param });

/** Tabs map onto the section the user can hide, so hiding a section hides its tab. */
export const TAB_SECTION: Record<TabName, SectionKey | null> = {
  home: null,
  goals: 'goals',
  cycle: 'cycle',
  budget: 'budget',
  notes: 'notes',
};

export const TAB_ORDER: TabName[] = ['home', 'goals', 'cycle', 'budget', 'notes'];

export const TAB_LABEL: Record<TabName, string> = {
  home: 'home',
  goals: 'goals',
  cycle: 'cycle',
  budget: 'budget',
  notes: 'notes',
};

export function visibleTabs(sections: Record<SectionKey, boolean>): TabName[] {
  return TAB_ORDER.filter(t => {
    const key = TAB_SECTION[t];
    return key === null || sections[key];
  });
}

/** The topmost full screen — what the page body should render. */
export function activeScreen(stack: Layer[]): { name: ScreenName; param?: string } {
  for (let i = stack.length - 1; i >= 0; i--) {
    const l = stack[i];
    if (l.t === 'screen') return { name: l.name, param: l.param };
  }
  return { name: 'home' };
}

/** Sheets stacked above the active screen, bottom-most first. */
export function activeSheets(stack: Layer[]): { name: SheetName; param?: string }[] {
  const out: { name: SheetName; param?: string }[] = [];
  for (let i = stack.length - 1; i >= 0; i--) {
    const l = stack[i];
    if (l.t === 'screen') break;
    out.unshift({ name: l.name, param: l.param });
  }
  return out;
}

export function sameLayer(a: Layer, b: Layer): boolean {
  return a.t === b.t && a.name === b.name && a.param === b.param;
}
