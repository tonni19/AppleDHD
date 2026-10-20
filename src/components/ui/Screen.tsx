'use client';

import type { ReactNode } from 'react';
import { FONT, INK, TONE, type ToneKey } from '@/lib/constants';
import { hexRgb, roundBtn } from '@/lib/style';
import { Icon } from '../icons/Icon';

interface HeaderProps {
  title: string;
  subtitle?: string;
  tone?: ToneKey;
  onBack?: () => void;
  /** Rendered at the trailing edge — usually one or two round buttons. */
  actions?: ReactNode;
  /** Leading badge, typically a SectionIcon in a tinted square. */
  badge?: ReactNode;
}

/**
 * The bar at the top of every pushed screen. Back is always present when there is
 * somewhere to go back to, which is what makes every destination escapable —
 * previously several surfaces could only be left by scrolling or guessing.
 *
 * Styled as the same sticker card every section on Home sits in — its tone's
 * own tint, the full ink outline, and a dropped-corner shadow — rather than a
 * flat, neutral bar. Flush and square against the very top (where the status
 * bar sits) and rounded only where it meets the page below, so it reads as a
 * card dropping down from the notch instead of a generic toolbar.
 */
export function ScreenHeader({ title, subtitle, tone = 'neutral', onBack, actions, badge }: HeaderProps) {
  const t = TONE[tone];
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: 'calc(var(--sa-top) + 10px) 14px 14px',
        background: `rgba(${hexRgb(t.bg)},.97)`,
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderLeft: `3px solid ${INK}`,
        borderRight: `3px solid ${INK}`,
        borderBottom: `3px solid ${INK}`,
        borderBottomLeftRadius: 26,
        borderBottomRightRadius: 26,
        boxShadow: '4px 5px 0 rgba(80,26,18,.4)',
      }}
    >
      {onBack && (
        <button type="button" onClick={onBack} aria-label="go back" style={roundBtn('#fffdfa', t.ink)}>
          <Icon name="chevronLeft" size={20} strokeWidth={2.8} />
        </button>
      )}
      {badge}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 20, lineHeight: 1.15, color: '#5a2f28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 15, lineHeight: 1.2, color: '#a8776c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {subtitle}
          </div>
        )}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, flex: 'none' }}>{actions}</div>}
    </div>
  );
}

interface ScreenProps {
  children: ReactNode;
  header?: ReactNode;
  /** Solid page background — detail screens sit on paper, not on the artwork. */
  paper?: boolean;
  /** Overrides the paper colour, so a note can wear its own tint. */
  paperColor?: string;
}

export function Screen({ children, header, paper = false, paperColor }: ScreenProps) {
  return (
    // Screens swap instantly. Animating every navigation made ordinary tapping
    // feel heavy; the only motion left in the app is the sheet rise, where it
    // actually communicates where the panel came from.
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        background: paper ? (paperColor ?? '#fffdf7') : 'transparent',
      }}
    >
      {header}
      <div
        className="ap-scroll"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: header ? '14px 16px var(--content-bottom)' : 'calc(var(--sa-top) + 14px) 16px var(--content-bottom)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
