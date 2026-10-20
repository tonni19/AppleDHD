'use client';

import type { ReactNode } from 'react';
import { FONT, INK, TONE, type ToneKey } from '@/lib/constants';
import { cardShell } from '@/lib/style';
import { Icon } from '../icons/Icon';
import { SectionIcon, type ArtSlot } from '../icons/SectionIcon';

interface Props {
  slot: ArtSlot;
  tone: ToneKey;
  title: string;
  /** One-line status, always visible — the point of the collapsed state. */
  summary?: string;
  open: boolean;
  onToggle: () => void;
  /** Adds an arrow into the section's own full screen. */
  onOpen?: () => void;
  openLabel?: string;
  alpha: number;
  tint?: string;
  /** Marks the section for the first-run tour. */
  tourId?: string;
  children: ReactNode;
}

/**
 * A Home section that folds shut.
 *
 * Home shows everything the user has enabled, but only the sections they leave
 * open take up room — so the page stays short without hiding anything, and the
 * collapsed header still reports the one number that matters.
 */
export function CollapsibleSection({ slot, tone, title, summary, open, onToggle, onOpen, openLabel, alpha, tint, tourId, children }: Props) {
  const t = TONE[tone];

  return (
    <section data-tour={tourId} style={{ ...cardShell(alpha, tint), padding: open ? '14px 14px 15px' : '12px 14px', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}
        >
          <SectionIcon slot={slot} size={32} strokeWidth={2.6} style={{ flex: 'none', filter: 'drop-shadow(1px 2px 0 rgba(80,26,18,.3))' }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontFamily: FONT.display, fontWeight: 700, fontSize: 17, lineHeight: 1.2, color: '#5a2f28' }}>{title}</span>
            {summary && (
              <span style={{ display: 'block', fontFamily: FONT.hand, fontWeight: 400, fontSize: 15, lineHeight: 1.25, color: '#a8776c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {summary}
              </span>
            )}
          </span>
          <span aria-hidden="true" style={{ color: '#b08b7a', flex: 'none' }}>
            <Icon name={open ? 'chevronUp' : 'chevronDown'} size={17} strokeWidth={2.8} />
          </span>
        </button>

        {onOpen && open && (
          // Just the arrow. The word "open" beside a chevron said the same thing
          // twice; the accessible name still carries it for screen readers.
          <button
            type="button"
            onClick={onOpen}
            aria-label={openLabel ?? `open ${title}`}
            title={openLabel ?? `open ${title}`}
            style={{
              flex: 'none', width: 32, height: 32, borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: t.bg, border: `2.5px solid ${INK}`, color: t.ink,
            }}
          >
            <Icon name="chevronRight" size={15} strokeWidth={3} />
          </button>
        )}
      </div>

      {open && <div style={{ marginTop: 13 }}>{children}</div>}
    </section>
  );
}
