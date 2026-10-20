export const INK = '#6b3226';

export type CatKey = 'mild' | 'important' | 'vimp';

export interface CatInfo {
  color: string;
  soft: string;
  ink: string;
  label: string;
  full: string;
}

export const CATS: Record<CatKey, CatInfo> = {
  mild: { color: '#6ea45f', soft: '#dcecc9', ink: '#3a5a29', label: 'mild', full: 'mild' },
  important: { color: '#e8b13a', soft: '#ffe6b3', ink: '#7a5312', label: 'important', full: 'important' },
  vimp: { color: '#e0503a', soft: '#ffd2cb', ink: '#8f2c20', label: 'very imp', full: 'very important' },
};

export const CAT_KEYS: CatKey[] = ['mild', 'important', 'vimp'];

// older data used task/exam/presentation/deadline categories — keep reading them.
const LEGACY: Record<string, CatKey> = { task: 'mild', exam: 'vimp', deadline: 'vimp', presentation: 'important' };

export function catOf(k: string): CatInfo {
  return CATS[k as CatKey] || CATS[LEGACY[k]] || CATS.mild;
}

/** Per-section accents, so each screen keeps its own identity. */
export const TONE = {
  brand: { bg: '#ffe0c2', ink: '#8a3f31', solid: '#e0503a' },
  today: { bg: '#ffe0c2', ink: '#8a4032', solid: '#e8913a' },
  goals: { bg: '#dcecc9', ink: '#3a5a29', solid: '#8fae74' },
  cycle: { bg: '#ffd6e3', ink: '#98305a', solid: '#ef7a9b' },
  budget: { bg: '#e2dcf2', ink: '#463668', solid: '#b9a9e0' },
  notes: { bg: '#ffe6b3', ink: '#7a5312', solid: '#e8b13a' },
  neutral: { bg: '#f1e2d8', ink: '#7d4d41', solid: '#c9a394' },
} as const;

export type ToneKey = keyof typeof TONE;

export const PIN = ['#e8b13a', '#f4aec0', '#8fae74', '#b9a9e0'];

/** Sticky note colours, paired with an ink that stays readable on them. */
export const STICKY_TINT = ['#ffe9a8', '#ffc9d6', '#d3e9be', '#dcd4f2', '#ffd9bd', '#c9e6ea'];
export const STICKY_INK = ['#7a5312', '#98305a', '#3a5a29', '#463668', '#8a4032', '#245e66'];

/** Font roles. Named for what they do, so swapping a typeface never lies. */
export const FONT = {
  display: "var(--font-display), system-ui, sans-serif",
  hand: "var(--font-hand), system-ui, sans-serif",
  body: "var(--font-body), system-ui, sans-serif",
};

/** Reminder offsets offered when adding a task, in minutes before it starts. */
export const REMIND_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'none' },
  { value: 0, label: 'on time' },
  { value: 10, label: '10 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 1440, label: '1 day' },
];
