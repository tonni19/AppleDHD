'use client';

import type { ReactNode } from 'react';
import { INK } from '@/lib/constants';
import { TAB_LABEL, type TabName } from '@/lib/routes';
import { SectionIcon, type ArtSlot } from './icons/SectionIcon';

const TAB_ART: Record<TabName, ArtSlot> = {
  home: 'calendar',
  goals: 'goals',
  cycle: 'cycle',
  budget: 'budget',
  notes: 'notes',
};

interface Props {
  tabs: TabName[];
  active: TabName;
  onSelect: (tab: TabName) => void;
  /** Sits at the end of the same row — the add button. */
  trailing?: ReactNode;
}

/**
 * One row along the bottom: the tab icons, then the add button. No bar behind
 * them — each button wears the full ink outline and a solid shadow so it stands
 * apart from the cards it floats over.
 *
 * The add button sits in the same spread as the tabs rather than in a group of
 * its own, so hiding a section leaves the row evenly spaced instead of opening a
 * gap in the middle.
 *
 * The current tab keeps its icon exactly as drawn and is marked instead by a pink
 * fill and being lifted off the page, with a deeper shadow under it.
 */
export function TabBar({ tabs, active, onSelect, trailing }: Props) {
  return (
    <nav
      aria-label="sections"
      data-tour="tabs"
      style={{
        position: 'absolute',
        left: 'calc(var(--sa-left) + 10px)',
        right: 'calc(var(--sa-right) + 10px)',
        bottom: 'calc(var(--sa-bottom) + var(--tabbar-gap))',
        height: 'var(--tabbar-h)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 4,
        zIndex: 25,
      }}
    >
      {tabs.map(t => {
        const on = active === t;
        return (
          <button
            key={t}
            type="button"
            onClick={() => onSelect(t)}
            aria-current={on ? 'page' : undefined}
            aria-label={TAB_LABEL[t]}
            title={TAB_LABEL[t]}
            style={{
              // Up to 56px, shrinking evenly on narrow phones so the row always fits.
              flex: '0 1 56px',
              minWidth: 0,
              aspectRatio: '1 / 1',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: on ? '#ffc9bf' : '#fffaf5',
              border: `3.5px solid ${INK}`,
              boxShadow: on ? '3px 7px 0 rgba(80,26,18,.6)' : '2px 3px 0 rgba(80,26,18,.5)',
              transform: on ? 'translateY(-4px)' : undefined,
              color: INK,
            }}
          >
            <SectionIcon slot={TAB_ART[t]} size={27} strokeWidth={2.6} />
          </button>
        );
      })}
      {trailing}
    </nav>
  );
}
