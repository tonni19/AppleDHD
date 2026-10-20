import { parseLines } from './checklist';
import { STICKY_TINT } from './constants';
import { prettyFull } from './date';
import type { ListNote } from './types';

/**
 * Mixes a tint towards paper, matching the wash the note page wears on screen.
 * Canvas has no color-mix(), so the blend is done by hand.
 */
function wash(hex: string, amount: number, base: [number, number, number]): string {
  const h = hex.replace('#', '');
  const to = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
  const mixed = to.map((c, i) => Math.round(c * amount + base[i] * (1 - amount)));
  return `rgb(${mixed[0]}, ${mixed[1]}, ${mixed[2]})`;
}

/**
 * next/font rewrites each family to a hashed name (`__Baloo_2_abc123`), so asking
 * canvas for "Baloo 2" silently fell back to a generic sans and the exported card
 * did not match the app. Read the real family off the CSS variable instead.
 */
function family(varName: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return v ? `${v}, ${fallback}` : fallback;
}

export interface NotePng {
  fileName: string;
  /** Raw base64, no data: prefix — what both save paths want. */
  base64: string;
}

/**
 * Renders a note page to a canvas and returns the PNG — no library, so the
 * exported card is drawn clean rather than being a screenshot of the editor.
 *
 * Returning the bytes rather than triggering a download keeps this working in
 * the packaged app, where a webview blocks `<a download>` outright.
 */
export async function renderListPng(list: ListNote, today: string): Promise<NotePng | null> {
  const W = 840, pad = 26, inner = 52;
  const lineH = 44;
  const cv = document.createElement('canvas');
  const probe = cv.getContext('2d');
  if (!probe) return null;
  const bodyFont = family('--font-body', 'sans-serif');
  const titleFont = family('--font-display', 'system-ui, sans-serif');
  probe.font = `700 30px ${bodyFont}`;
  const maxW = W - pad * 2 - inner * 2;
  // Each wrapped line remembers whether it belongs to a ticked item, so the card
  // crosses items out exactly as the note does on screen.
  const lines: { text: string; done: boolean }[] = [];

  parseLines(String(list.text || ''), list.checked).forEach(({ raw: para, isItem, checked }) => {
    const done = isItem && checked;
    const push = (text: string) => lines.push({ text, done });
    if (!para.trim()) {
      push('');
      return;
    }
    let cur = '';
    para.split(/\s+/).forEach(word => {
      let w = word;
      // a single token longer than the line gets broken character by character
      while (probe.measureText(w).width > maxW) {
        if (cur) {
          push(cur);
          cur = '';
        }
        let cut = '';
        for (let i = 0; i < w.length; i++) {
          if (probe.measureText(cut + w[i]).width > maxW) break;
          cut += w[i];
        }
        if (!cut) cut = w[0];
        push(cut);
        w = w.slice(cut.length);
      }
      const test = cur ? cur + ' ' + w : w;
      if (probe.measureText(test).width > maxW && cur) {
        push(cur);
        cur = w;
      } else {
        cur = test;
      }
    });
    push(cur);
  });
  if (!lines.length) lines.push({ text: '', done: false });

  const H = pad * 2 + 150 + lineH * lines.length + 50;
  const dpr = 2;
  cv.width = W * dpr;
  cv.height = H * dpr;
  const x = cv.getContext('2d');
  if (!x) return null;
  x.scale(dpr, dpr);

  try {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
  } catch {
    // fonts API unavailable — draw with whatever is loaded
  }

  const ink = '#6b3226';
  // The exported card wears the note's own colour, the same way the page does
  // in the app — an export that ignored it looked like a different note.
  const tint = STICKY_TINT[list.color % STICKY_TINT.length];

  x.fillStyle = wash(tint, 0.55, [251, 238, 222]);
  x.fillRect(0, 0, W, H);

  const r = 40, bx = pad, by = pad, bw = W - pad * 2, bh = H - pad * 2;
  x.fillStyle = wash(tint, 0.3, [255, 253, 247]);
  x.beginPath();
  x.moveTo(bx + r, by);
  x.arcTo(bx + bw, by, bx + bw, by + bh, r);
  x.arcTo(bx + bw, by + bh, bx, by + bh, r);
  x.arcTo(bx, by + bh, bx, by, r);
  x.arcTo(bx, by, bx + bw, by, r);
  x.closePath();
  x.fill();
  x.lineWidth = 6;
  x.strokeStyle = ink;
  x.stroke();

  let y = by + 74;
  x.fillStyle = tint;
  x.beginPath();
  x.arc(bx + inner - 4, y - 10, 15, 0, 6.284);
  x.fill();
  x.lineWidth = 5;
  x.strokeStyle = ink;
  x.stroke();

  x.fillStyle = '#5a2f28';
  x.font = `700 40px ${titleFont}`;
  x.fillText(list.title, bx + inner + 28, y);

  x.fillStyle = '#a8776c';
  x.font = `400 24px ${bodyFont}`;
  x.fillText('appledhd · ' + prettyFull(today), bx + inner + 28, y + 34);

  y += 66;
  x.strokeStyle = 'rgba(107,50,38,.35)';
  x.lineWidth = 4;
  x.setLineDash([6, 8]);
  x.beginPath();
  x.moveTo(bx + inner, y);
  x.lineTo(bx + bw - inner, y);
  x.stroke();
  x.setLineDash([]);
  y += 52;

  x.font = `700 30px ${bodyFont}`;
  lines.forEach(line => {
    x.strokeStyle = 'rgba(107,50,38,.14)';
    x.lineWidth = 2;
    x.beginPath();
    x.moveTo(bx + inner, y + 10);
    x.lineTo(bx + bw - inner, y + 10);
    x.stroke();
    if (line.text) {
      x.fillStyle = line.done ? 'rgba(74,58,38,.55)' : '#4a3a26';
      x.fillText(line.text, bx + inner, y);
      if (line.done) {
        // Struck through the middle of the letters, like the note in write mode.
        const width = x.measureText(line.text).width;
        x.strokeStyle = 'rgba(107,50,38,.8)';
        x.lineWidth = 3;
        x.beginPath();
        x.moveTo(bx + inner - 2, y - 10);
        x.lineTo(bx + inner + width + 2, y - 10);
        x.stroke();
      }
    }
    y += lineH;
  });

  // Stamped, so saving the same note again is a new file rather than a write
  // over the old one. Overwriting left the gallery showing a cached thumbnail of
  // the previous version, which reads as "it stopped saving".
  const d = new Date();
  const stamp = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
    '-',
    String(d.getHours()).padStart(2, '0'),
    String(d.getMinutes()).padStart(2, '0'),
    String(d.getSeconds()).padStart(2, '0'),
  ].join('');

  const slug = String(list.title || 'note').replace(/[^a-z0-9]+/gi, '-').toLowerCase();

  return {
    fileName: `appledhd-${slug}-${stamp}.png`,
    base64: cv.toDataURL('image/png').split(',')[1] ?? '',
  };
}
