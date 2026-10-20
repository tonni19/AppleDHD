'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FONT, INK } from '@/lib/constants';
import { SectionIcon } from './icons/SectionIcon';

/**
 * The first-run tour: one thing at a time instead of a wall of instructions.
 *
 * Each step dims the app, lifts one real part of the Home screen out of the dim,
 * and says a sentence or two about it. Places are marked in the UI with
 * `data-tour="…"`; a step whose place is not on screen (a hidden section, the
 * streak switched off) is simply left out. Skippable from every step.
 */

interface Step {
  /** The `data-tour` value to point at. Omitted for the opening and closing cards. */
  target?: string;
  title: string;
  text: string;
  /** Corner rounding of the lifted-out area, to match the thing inside it. */
  radius?: number;
}

const STEPS: Step[] = [
  {
    title: 'hi, welcome to appledhd',
    text: "a planner that lives on your phone. let's take a quick look around, one thing at a time. it takes less than a minute.",
  },
  {
    target: 'calendar',
    title: 'your month',
    text: "tap any day to see what's on it. the dots are your tasks, and a day takes its colour from whatever sits at the top.",
    radius: 32,
  },
  {
    target: 'today',
    title: "today's list",
    text: 'tap the circle to tick something off. every section folds shut too: tap its title to open or close it.',
    radius: 32,
  },
  {
    target: 'add',
    title: 'add anything',
    text: 'tap the apple to add a task, an exam or a reminder. give it a day and say how urgent it is.',
    radius: 999,
  },
  {
    target: 'tabs',
    title: 'your other pages',
    text: "goals, cycle, budget and notes each have a page of their own. the one you're on sits lifted up.",
    radius: 40,
  },
  {
    target: 'streak',
    title: 'your streak',
    text: 'do one thing in the app each day, like adding or ticking something off, and your flame keeps growing.',
    radius: 999,
  },
  {
    target: 'settings',
    title: 'make it yours',
    text: "hide what you don't use and change how it looks. everything stays on this phone, so back it up now and then from here.",
    radius: 999,
  },
  {
    title: "you're all set",
    text: 'a good first step: add one small thing for today.',
  },
];

interface Rect { x: number; y: number; w: number; h: number }
interface Layout {
  rect: Rect | null;
  rootH: number;
  cardH: number;
  /** Which steps have their place on screen — the rest are skipped. */
  present: boolean[];
}

const PAD = 7;
const CARD_GAP = 14;

function findTarget(name: string): HTMLElement | null {
  const el = document.querySelector<HTMLElement>(`[data-tour="${name}"]`);
  if (!el) return null;
  // Wrappers use display: contents, which has no box of its own.
  return getComputedStyle(el).display === 'contents' ? (el.firstElementChild as HTMLElement | null) : el;
}

interface Props {
  onClose: () => void;
  /** The closing card's main button: finish and open the add sheet. */
  onAddFirst: () => void;
}

export function Tour({ onClose, onAddFirst }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [layout, setLayout] = useState<Layout>({ rect: null, rootH: 0, cardH: 0, present: STEPS.map(s => !s.target) });

  const step = STEPS[index];
  const last = index === STEPS.length - 1;
  const first = index === 0;

  const measure = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const el = step?.target ? findTarget(step.target) : null;
    let rect: Rect | null = null;
    if (el) {
      const o = root.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      rect = { x: r.left - o.left - PAD, y: r.top - o.top - PAD, w: r.width + PAD * 2, h: r.height + PAD * 2 };
    }
    setLayout({
      rect,
      rootH: root.clientHeight,
      cardH: cardRef.current?.offsetHeight ?? 0,
      present: STEPS.map(s => !s.target || !!findTarget(s.target)),
    });
  }, [step]);

  // Bring the target into view, then measure where it landed on the next frame.
  useLayoutEffect(() => {
    if (step?.target) findTarget(step.target)?.scrollIntoView({ block: 'center' });
    const frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [step, measure]);

  // Follow the target if anything moves it: rotation, scrolling, or the page
  // settling (fonts and the calendar can still be laying out when the tour opens).
  useEffect(() => {
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    const el = step?.target ? findTarget(step.target) : null;
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (el) observer?.observe(el);
    if (rootRef.current) observer?.observe(rootRef.current);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      observer?.disconnect();
    };
  }, [measure, step]);

  // Put the card below the lifted-out area when it fits, otherwise above it.
  const { rect, rootH, cardH } = layout;
  let cardTop: string | number = '50%';
  let cardTransform = 'translateY(-50%)';
  if (rect) {
    const below = rect.y + rect.h + CARD_GAP;
    const fitsBelow = below + cardH < rootH - 12;
    cardTop = fitsBelow ? below : Math.max(12, rect.y - CARD_GAP - cardH);
    cardTransform = 'none';
  }

  // Moving on skips any step whose place is not on screen (a hidden section, the streak switched off).
  const go = (dir: 1 | -1) => {
    let i = index + dir;
    while (i > 0 && i < STEPS.length - 1 && STEPS[i].target && !findTarget(STEPS[i].target as string)) i += dir;
    setIndex(Math.max(0, Math.min(STEPS.length - 1, i)));
  };
  const next = () => go(1);
  const back = () => go(-1);

  // Progress counts only the steps that will actually be shown.
  const shown = STEPS.map((_, i) => i).filter(i => layout.present[i]);
  const position = shown.indexOf(index);

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="app tour"
      style={{ position: 'absolute', inset: 0, zIndex: 100 }}
    >
      {/* The dim. With a target, it is the huge shadow of the lifted-out area, so the hole needs no masking. */}
      {rect ? (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: rect.x, top: rect.y, width: rect.w, height: rect.h,
            borderRadius: Math.min(step.radius ?? 24, rect.h / 2 + PAD),
            boxShadow: '0 0 0 3px #ffd166, 0 0 0 9999px rgba(42,16,10,.62)',
            transition: 'left .3s ease, top .3s ease, width .3s ease, height .3s ease, border-radius .3s ease',
            pointerEvents: 'none',
          }}
        />
      ) : (
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'rgba(42,16,10,.62)' }} />
      )}

      {/* Catches taps on the rest of the app, so nothing changes underneath mid-tour. */}
      <div style={{ position: 'absolute', inset: 0 }} />

      <div
        ref={cardRef}
        aria-live="polite"
        style={{
          position: 'absolute',
          left: 14, right: 14,
          top: cardTop,
          transform: cardTransform,
          maxWidth: 420,
          margin: '0 auto',
          padding: '16px 16px 14px',
          borderRadius: 26,
          background: '#fff7f2',
          border: `3px solid ${INK}`,
          boxShadow: '5px 6px 0 rgba(80,26,18,.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          {(first || last) && <SectionIcon slot="brand" size={42} />}
          <div style={{ flex: 1, minWidth: 0, fontFamily: FONT.display, fontWeight: 700, fontSize: 20, lineHeight: 1.15, color: '#5a2f28' }}>
            {step.title}
          </div>
          {!last && (
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 'none', height: 34, padding: '0 12px', borderRadius: 12, background: 'transparent', border: 'none', fontFamily: FONT.body, fontWeight: 800, fontSize: 14, color: '#a8776c' }}
            >
              skip
            </button>
          )}
        </div>

        <p style={{ margin: '0 0 14px', fontFamily: FONT.body, fontWeight: 700, fontSize: 15, lineHeight: 1.45, color: '#5a3f35' }}>
          {step.text}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          {/* Progress: which step of how many, without numbers to parse. */}
          <div aria-label={`step ${position + 1} of ${shown.length}`} style={{ display: 'flex', gap: 5, flex: 1, minWidth: 0 }}>
            {!first && !last && shown.map((stepIndex, i) => (
              <span
                key={stepIndex}
                style={{
                  width: stepIndex === index ? 18 : 8, height: 8, borderRadius: 4,
                  background: i <= position ? '#e0503a' : '#ecd5ca',
                  transition: 'width .25s ease',
                }}
              />
            ))}
          </div>

          {!first && !last && (
            <button type="button" onClick={back} style={secondaryBtn}>back</button>
          )}
          {last ? (
            <>
              <button type="button" onClick={onClose} style={secondaryBtn}>look around</button>
              <button type="button" onClick={onAddFirst} style={primaryBtn}>add something</button>
            </>
          ) : (
            <button type="button" onClick={next} style={primaryBtn}>{first ? 'show me' : 'next'}</button>
          )}
        </div>
      </div>
    </div>
  );
}

const secondaryBtn: React.CSSProperties = {
  flex: 'none', height: 44, padding: '0 14px', borderRadius: 15,
  background: '#fffdfa', border: `3px solid ${INK}`,
  fontFamily: FONT.display, fontWeight: 700, fontSize: 14.5, color: '#7d4d41',
};

const primaryBtn: React.CSSProperties = {
  flex: 'none', height: 44, padding: '0 18px', borderRadius: 15,
  background: '#e0503a', border: `3px solid ${INK}`,
  boxShadow: '3px 4px 0 rgba(80,26,18,.5)',
  fontFamily: FONT.display, fontWeight: 700, fontSize: 15, color: '#fff6f0',
};
