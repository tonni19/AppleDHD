/**
 * Checklists on a page.
 *
 * A page is one block of text, which is what makes it quick to write in and
 * keeps search and the PNG export working. An item is any line starting with a
 * dash or a star — nothing else. Whether it is ticked is held separately, so the
 * writing surface stays clean prose rather than `- [x]` bookkeeping.
 *
 * Ticks are stored as line numbers, and every operation that can shift a line
 * shifts them with it. An earlier version keyed them by the item's text, which
 * was simpler but meant two items reading "hello" were literally the same key —
 * ticking one ticked both. Positions are unambiguous; keeping them correct is
 * this module's job, not the caller's.
 */

const ITEM = /^(\s*)([-*])\s+(.*)$/;
/** Older notes wrote the state inline; still accepted on input, never written. */
const LEGACY_MARK = /^\[([ xX]?)\]\s*/;

export interface Line {
  /** Index in the text — also the key its tick is stored under. */
  index: number;
  raw: string;
  isItem: boolean;
  checked: boolean;
  /** The item text with its dash stripped. */
  label: string;
}

export function parseLines(text: string, checked: number[] = []): Line[] {
  const ticked = new Set(checked);
  return text.split('\n').map((raw, index) => {
    const m = raw.match(ITEM);
    if (!m) return { index, raw, isItem: false, checked: false, label: raw };
    const label = (m[3] ?? '').replace(LEGACY_MARK, '');
    return { index, raw, isItem: true, checked: ticked.has(index), label };
  });
}

export interface Progress {
  total: number;
  done: number;
}

export function progressOf(text: string, checked: number[] = []): Progress {
  const items = parseLines(text, checked).filter(l => l.isItem);
  return { total: items.length, done: items.filter(l => l.checked).length };
}

export function hasChecklist(text: string): boolean {
  return parseLines(text).some(l => l.isItem);
}

/** Flips one item by its line number. */
export function toggleChecked(checked: number[], index: number): number[] {
  return checked.includes(index) ? checked.filter(i => i !== index) : checked.concat(index);
}

/** Appends a fresh item — just a dash, no state marker. */
export function appendItem(text: string, label: string): string {
  const clean = label.trim();
  if (!clean) return text;
  const body = text.replace(/\s+$/, '');
  return (body ? body + '\n' : '') + `- ${clean}`;
}

/**
 * Moves one line to another line's position, taking the rest with it.
 *
 * Works on raw line indices rather than item numbers, so an item dragged past a
 * heading lands where it looks like it landed.
 */
export function moveLine(text: string, from: number, to: number): string {
  const lines = text.split('\n');
  if (from < 0 || from >= lines.length || to < 0 || to >= lines.length || from === to) return text;
  lines.splice(to, 0, lines.splice(from, 1)[0]);
  return lines.join('\n');
}

/** The same move applied to the tick positions, so ticks travel with their line. */
export function moveChecked(checked: number[], from: number, to: number): number[] {
  if (from === to) return checked;
  return checked.map(i => {
    if (i === from) return to;
    if (from < to && i > from && i <= to) return i - 1;
    if (from > to && i >= to && i < from) return i + 1;
    return i;
  });
}

/** Drops every ticked item — the "clear finished" action. */
export function removeChecked(text: string, checked: number[]): { text: string; checked: number[] } {
  const ticked = new Set(checked);
  const kept = text.split('\n').filter((_, i) => !ticked.has(i));
  return { text: kept.join('\n'), checked: [] };
}

/**
 * Keeps ticks on the right lines after the text is edited freely.
 *
 * Same number of lines means the edit happened inside a line, so positions still
 * hold. Otherwise the unchanged head and tail are matched and the ticks in the
 * tail shift by the difference; ticks inside the region that actually changed
 * are dropped, because that content is no longer the item that was ticked.
 */
export function realign(oldText: string, newText: string, checked: number[]): number[] {
  if (!checked.length) return checked;

  const a = oldText.split('\n');
  const b = newText.split('\n');
  if (a.length === b.length) return checked.filter(i => i < b.length);

  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) head++;

  let tail = 0;
  while (tail < a.length - head && tail < b.length - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail++;

  const delta = b.length - a.length;
  const out: number[] = [];
  checked.forEach(i => {
    if (i < head) out.push(i);
    else if (i >= a.length - tail) out.push(i + delta);
  });
  return out;
}

/**
 * Converts the old inline form (`- [x] milk`) into clean text plus tick
 * positions. Runs once at load; anything already clean passes straight through.
 */
export function stripLegacyMarkup(text: string): { text: string; checked: number[] } {
  if (!text.includes('[')) return { text, checked: [] };

  const checked: number[] = [];
  const lines = text.split('\n').map((raw, index) => {
    const m = raw.match(ITEM);
    if (!m) return raw;
    const rest = m[3] ?? '';
    const mark = rest.match(LEGACY_MARK);
    if (!mark) return raw;
    const label = rest.replace(LEGACY_MARK, '');
    if ((mark[1] ?? '').toLowerCase() === 'x') checked.push(index);
    return `${m[1]}${m[2]} ${label}`;
  });

  return { text: lines.join('\n'), checked };
}

/**
 * Converts the short-lived text-keyed form into line numbers.
 *
 * Each stored label claims the first matching line not already claimed, so a
 * note that had two identical items keeps the right number of ticks instead of
 * ticking every copy.
 */
export function checkedFromLabels(text: string, labels: string[]): number[] {
  const wanted = new Map<string, number>();
  labels.forEach(l => wanted.set(l.trim(), (wanted.get(l.trim()) ?? 0) + 1));

  const out: number[] = [];
  parseLines(text).forEach(line => {
    if (!line.isItem) return;
    const key = line.label.trim();
    const left = wanted.get(key) ?? 0;
    if (left > 0) {
      out.push(line.index);
      wanted.set(key, left - 1);
    }
  });
  return out;
}
