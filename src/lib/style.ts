import type { CSSProperties } from 'react';
import { FONT, INK } from './constants';

export const shadowCard = '5px 6px 0 rgba(80,26,18,.45)';
export const shadowRow = '3px 3px 0 rgba(80,26,18,.3)';
export const shadowInner = '2px 3px 0 rgba(80,26,18,.25)';
export const shadowBtn = (a = 0.45) => `3px 4px 0 rgba(80,26,18,${a})`;

/**
 * The sticker-card shell every section sits in. `tint` is an "r,g,b" triple.
 *
 * Alpha now comes from settings and defaults to near-solid: at the old 0.72 the
 * artwork showed through body text, which hurt legibility badly on a busy image.
 * The blur is only worth paying for when the card is actually translucent.
 */
export function cardShell(alpha: number, tint = '255,247,242'): CSSProperties {
  const translucent = alpha < 0.99;
  return {
    position: 'relative',
    borderRadius: 30,
    padding: '16px 15px',
    background: `rgba(${tint},${alpha})`,
    ...(translucent ? { backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } : {}),
    border: `3px solid ${INK}`,
    boxShadow: shadowCard,
  };
}

/** A plain panel inside a card — always solid, since it sits on the card already. */
export function panel(bg = '#fffdfa', radius = 22): CSSProperties {
  return {
    borderRadius: radius,
    padding: 14,
    background: bg,
    border: `3px solid ${INK}`,
    boxShadow: shadowRow,
  };
}

/** "#rrggbb" → "r,g,b", so a hex colour used elsewhere can feed cardShell/rowShell's tint. */
export function hexRgb(hex: string): string {
  const h = hex.replace('#', '');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)).join(',');
}

/**
 * The same translucent-plus-blur treatment as cardShell, for a row or panel
 * nested inside a card — so on the two screens where the artwork shows through
 * (home and a single day), turning up transparency fades everything inside a
 * section together, instead of leaving an opaque row floating in a see-through
 * card. Everywhere else sits on a solid paper page, where this would do nothing.
 */
export function rowShell(alpha: number, tint = '255,253,250'): CSSProperties {
  const translucent = alpha < 0.99;
  return {
    background: `rgba(${tint},${alpha})`,
    ...(translucent ? { backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' } : {}),
  };
}

export const heading: CSSProperties = {
  fontFamily: FONT.display,
  fontWeight: 700,
  fontSize: 20,
  lineHeight: 1,
  color: '#5a2f28',
};

export const hand: CSSProperties = {
  fontFamily: FONT.hand,
  fontWeight: 400,
  fontSize: 17,
  color: '#8a5f56',
};

export function dashedFooterStyle(color = '#7d5347', marginTop = 0): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 52,
    marginTop,
    borderRadius: 18,
    border: '3px dashed rgba(107,50,38,.5)',
    fontFamily: FONT.display,
    fontWeight: 700,
    fontSize: 15,
    color,
  };
}

/** Shared by the budget scope switch and the budget-settings plan-by switch. */
export function scopeBtnStyle(on: boolean): CSSProperties {
  return {
    flex: 1,
    height: 44,
    borderRadius: 15,
    border: `3px solid ${INK}`,
    background: on ? '#b9a9e0' : '#fffdfa',
    color: on ? '#2f2350' : '#5b4a80',
    fontFamily: FONT.display,
    fontWeight: 700,
    fontSize: 14,
    boxShadow: on ? '2px 3px 0 rgba(80,26,18,.45)' : '2px 3px 0 rgba(80,26,18,.2)',
  };
}

export function calcKeyStyle(kind: 'num' | 'op' | 'clear'): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 15,
    border: `3px solid ${INK}`,
    background: kind === 'op' ? '#e2dcf2' : kind === 'clear' ? '#ffd2cb' : '#fffdfa',
    color: kind === 'clear' ? '#8f2c20' : '#403060',
    fontFamily: FONT.body,
    fontWeight: 800,
    fontSize: 18,
    boxShadow: shadowInner,
  };
}

export const fieldInput: CSSProperties = {
  width: '100%',
  height: 54,
  borderRadius: 18,
  border: `3px solid ${INK}`,
  background: '#fffdfa',
  padding: '0 16px',
  fontFamily: FONT.body,
  fontWeight: 800,
  fontSize: 16,
  color: '#4a251f',
  outline: 'none',
  marginBottom: 15,
};

export const fieldInputCompact: CSSProperties = {
  width: '100%',
  height: 54,
  borderRadius: 18,
  border: `3px solid ${INK}`,
  background: '#fffdfa',
  padding: '0 14px',
  fontFamily: FONT.body,
  fontWeight: 800,
  fontSize: 16,
  color: '#4a251f',
  outline: 'none',
};

export const fieldLabel: CSSProperties = {
  fontFamily: FONT.hand,
  fontWeight: 400,
  fontSize: 18,
  color: '#7d4a41',
  marginBottom: 7,
};

export const cancelBtnStyle: CSSProperties = {
  width: 112,
  height: 56,
  borderRadius: 18,
  background: '#f1e2d8',
  border: `3px solid ${INK}`,
  boxShadow: '3px 4px 0 rgba(80,26,18,.4)',
  fontFamily: FONT.display,
  fontWeight: 700,
  fontSize: 16,
  color: '#7d4d41',
};

export function primaryBtnStyle(bg: string, color: string): CSSProperties {
  return {
    flex: 1,
    height: 56,
    borderRadius: 18,
    background: bg,
    border: `3px solid ${INK}`,
    boxShadow: '3px 4px 0 rgba(80,26,18,.5)',
    color,
    fontFamily: FONT.display,
    fontWeight: 700,
    fontSize: 17,
  };
}

/** Round chrome button (back, close, nav arrows, header actions). */
export function roundBtn(bg: string, color: string, size = 46): CSSProperties {
  return {
    width: size,
    height: size,
    flex: 'none',
    borderRadius: size / 2.6,
    background: bg,
    border: `3px solid ${INK}`,
    boxShadow: shadowBtn(0.4),
    color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}

/** The tinted square that badges a section title. */
export function badge(bg: string, size = 30): CSSProperties {
  return {
    width: size,
    height: size,
    flex: 'none',
    borderRadius: 10,
    background: bg,
    border: `3px solid ${INK}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: INK,
  };
}

export const chipStyle = (bg: string, color: string): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '4px 9px',
  borderRadius: 14,
  background: bg,
  border: `2.5px solid ${INK}`,
  fontFamily: FONT.body,
  fontWeight: 800,
  fontSize: 11.5,
  color,
  whiteSpace: 'nowrap',
});
