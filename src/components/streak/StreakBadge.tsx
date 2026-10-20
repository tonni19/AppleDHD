'use client';

import { useEffect, useState } from 'react';
import { FONT, INK } from '@/lib/constants';
import type { StreakInfo } from '@/lib/logic';
import { Flame, flameStateOf, type FlameState } from './Flame';

/** The count's label. Muted when today has not been logged, so the state reads twice. */
const PILL: Record<FlameState, string> = {
  lit: '#5a2410',
  risk: '#8a5a34',
  out: '#8a766c',
};

const SIZE = 50;
/** How long the "days in a row" bubble stays before it has fully faded. */
const NOTE_MS = 2800;
/** The bubble waits for the flame to swell before it appears. */
const NOTE_DELAY_MS = 400;

/**
 * The last count this session put on screen. Module-level on purpose: Home
 * remounts whenever you navigate back to it, and the celebration should mark
 * the count actually going up — not replay every time the screen reappears.
 */
let lastShown: number | null = null;

/**
 * The streak in the header: a flame with the day count on it. Display only.
 *
 * It stays completely still except for one moment — the day the count goes up —
 * when a warm glow rises behind the flame, the flame swells and settles, the new
 * number rolls into its label, and a small bubble says so beneath it. Everything
 * eases to a stop on its own. No overlay, nothing to dismiss.
 */
export function StreakBadge({ info }: { info: StreakInfo }) {
  const state = flameStateOf(info.current, info.activeToday);
  const label = info.current === 1 ? '1 day streak' : `${info.current} day streak`;

  // Keyed by the count, so a new number mounts fresh and can celebrate.
  return <Badge key={info.current} value={info.current} state={state} label={label} />;
}

function Badge({ value, state, label }: { value: number; state: FlameState; label: string }) {
  // Decided once, at mount: did the count just go up since it was last shown?
  const [grew] = useState(() => lastShown !== null && value > lastShown);
  const [showNote, setShowNote] = useState(grew);

  useEffect(() => { lastShown = value; }, [value]);

  // The bubble is removed when its own fade finishes, not on a timer: a timer and
  // a CSS animation drift apart by a frame or two, and removing it early cut the
  // fade off at a visible sliver. The timer is only a backstop in case the
  // animation never reports finishing.
  useEffect(() => {
    if (!grew) return;
    const t = window.setTimeout(() => setShowNote(false), NOTE_MS + NOTE_DELAY_MS + 600);
    return () => window.clearTimeout(t);
  }, [grew]);

  const pillH = 20;

  return (
    <div
      role="img"
      aria-label={label}
      title={label}
      style={{
        position: 'relative',
        // Fixed and never allowed to shrink, so a crowded header cannot squash it.
        flex: 'none',
        width: SIZE,
        height: SIZE,
        zIndex: 5,
      }}
    >
      {grew && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: -12,
            top: -10,
            width: SIZE + 24,
            height: SIZE + 24,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,214,110,.85) 0%, rgba(255,170,60,.35) 45%, rgba(255,150,40,0) 70%)',
            pointerEvents: 'none',
            animation: 'apGlow 1.9s cubic-bezier(.33,0,.2,1) both',
          }}
        />
      )}

      <div style={{ position: 'relative', filter: 'drop-shadow(0 2px 0 rgba(60,20,8,.35))' }}>
        <Flame size={SIZE} state={state} animated={grew} />
      </div>

      {/* The label stays put while the flame settles, so the number is always readable. */}
      <span
        style={{
          position: 'absolute',
          left: '50%',
          bottom: -3,
          transform: 'translateX(-50%)',
          minWidth: pillH,
          height: pillH,
          padding: '0 5px',
          boxSizing: 'border-box',
          borderRadius: pillH / 2,
          background: PILL[state],
          border: '2px solid #fff3d6',
          boxShadow: '0 2px 0 rgba(60,20,8,.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT.display,
          fontWeight: 700,
          fontSize: value > 99 ? 12 : 14,
          lineHeight: 1,
          color: '#fffdfa',
          whiteSpace: 'nowrap',
          // Clips the number as it rolls up into the label.
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            display: 'block',
            animation: grew ? 'apTick .7s cubic-bezier(.22,1,.36,1) .35s both' : undefined,
          }}
        >
          {value}
        </span>
      </span>

      {showNote && (
        <span
          // Announced once for screen readers, then gone with the bubble.
          role="status"
          onAnimationEnd={e => { if (e.animationName === 'apNote') setShowNote(false); }}
          style={{
            position: 'absolute',
            top: SIZE + 9,
            left: '50%',
            transform: 'translateX(-50%)',
            // Never catches a tap meant for the card underneath it.
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            padding: '7px 12px',
            borderRadius: 14,
            background: '#5a2410',
            border: `2.5px solid ${INK}`,
            boxShadow: '3px 4px 0 rgba(60,20,8,.35)',
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 13.5,
            lineHeight: 1,
            color: '#fff3d6',
            animation: `apNote ${NOTE_MS}ms cubic-bezier(.4,0,.2,1) ${NOTE_DELAY_MS}ms both`,
          }}
        >
          {/* A small pointer up to the flame, so it is clear what the bubble is about. */}
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: -7,
              left: '50%',
              width: 10,
              height: 10,
              marginLeft: -5,
              background: '#5a2410',
              borderLeft: `2.5px solid ${INK}`,
              borderTop: `2.5px solid ${INK}`,
              transform: 'rotate(45deg)',
            }}
          />
          {value === 1 ? 'streak started' : `${value} days in a row`}
        </span>
      )}
    </div>
  );
}
