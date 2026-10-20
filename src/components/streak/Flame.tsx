'use client';

import { useId } from 'react';
import { INK } from '@/lib/constants';

export type FlameState = 'lit' | 'risk' | 'out';

/**
 * The streak flame, in the style of a game streak badge: a golden body with two
 * tongues, a glowing core, and a glossy highlight. Drawn in a square box so it
 * sits compact rather than tall.
 *
 * Three states, so it reads without words: lit (today counted), risk (a streak
 * is running but today has not been logged yet), out (no streak).
 */

const PATH = {
  outer: 'M30 2 C26 11 35 15 37 21 C40 16 40 12 39 8 C49 15 57 26 57 39 C57 53 46 62 32 62 C18 62 7 53 7 40 C7 29 14 21 21 15 C21 22 24 26 27 27 C24 19 24 9 30 2 Z',
  inner: 'M32 17 C37 26 49 32 49 45 C49 54 41 60 32 60 C23 60 15 54 15 46 C15 37 22 33 26 30 C26 36 28 39 31 39 C28 32 28 24 32 17 Z',
  gloss: 'M44 25 C49 29 52 34 52 40',
};

const TONES: Record<FlameState, { outer: [string, string, string]; inner: [string, string]; core: string }> = {
  lit: { outer: ['#ffe872', '#ffb81f', '#f27d10'], inner: ['#fff9d6', '#ffd23a'], core: '#fffdf2' },
  risk: { outer: ['#fbe9c2', '#f3cf93', '#dcaa70'], inner: ['#fff8e6', '#f7e0b0'], core: '#fffcf4' },
  out: { outer: ['#ece4df', '#d3c6be', '#b5a399'], inner: ['#f5f0ed', '#e0d6cf'], core: '#fbf9f7' },
};

interface Props {
  size: number;
  state?: FlameState;
  /**
   * Plays the ignite once: a gentle swell and a sway that settles to rest. Never
   * a loop — a permanently moving element in view keeps pulling attention, which
   * is the opposite of what an app for focusing should do.
   */
  animated?: boolean;
  strokeWidth?: number;
}

export function Flame({ size, state = 'lit', animated = false, strokeWidth = 3.4 }: Props) {
  const id = useId().replace(/:/g, '');
  const t = TONES[state];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', flex: 'none', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={`fo${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={t.outer[0]} />
          <stop offset=".5" stopColor={t.outer[1]} />
          <stop offset="1" stopColor={t.outer[2]} />
        </linearGradient>
        <radialGradient id={`fi${id}`} cx=".5" cy=".75" r=".7">
          <stop offset="0" stopColor={t.inner[0]} />
          <stop offset="1" stopColor={t.inner[1]} />
        </radialGradient>
        {/* The core is a glow that fades out, not a shape — a solid fill read as a hard fin. */}
        <radialGradient id={`fc${id}`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor={t.core} stopOpacity="1" />
          <stop offset=".55" stopColor={t.core} stopOpacity=".75" />
          <stop offset="1" stopColor={t.core} stopOpacity="0" />
        </radialGradient>
      </defs>
      <g style={animated ? { transformOrigin: '32px 60px', animation: 'apIgnite 1.9s cubic-bezier(.37,0,.63,1) both' } : undefined}>
        <path d={PATH.outer} fill={`url(#fo${id})`} stroke={INK} strokeWidth={strokeWidth} strokeLinejoin="round" />
        <path d={PATH.inner} fill={`url(#fi${id})`} />
        <ellipse cx="32" cy="47" rx="15" ry="13" fill={`url(#fc${id})`} />
        <path d={PATH.gloss} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity={state === 'out' ? 0.35 : 0.6} />
      </g>
    </svg>
  );
}

export function flameStateOf(current: number, activeToday: boolean): FlameState {
  if (activeToday) return 'lit';
  return current > 0 ? 'risk' : 'out';
}
