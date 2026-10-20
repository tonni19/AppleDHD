'use client';

import { INK } from '@/lib/constants';
import { Icon } from './icons/Icon';
import { SectionIcon } from './icons/SectionIcon';

/** The add button: the drawn apple, at the end of the tab row. */
export function Fab({ onClick, label = 'add a task' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      data-tour="add"
      style={{
        position: 'relative',
        // Larger than a tab — it is the one thing on this row that makes something.
        flex: '0 1 74px',
        minWidth: 0,
        aspectRatio: '1 / 1',
        padding: 0,
        background: 'transparent',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* A drop shadow follows the apple's outline, matching the sticker shadows elsewhere. */}
      <SectionIcon slot="brand" size={74} style={{ width: '100%', height: '100%', filter: 'drop-shadow(3px 4px 0 rgba(80,26,18,.45))' }} />
      {/* A + badge on the corner says what the apple does, without covering its face. */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute', right: -3, bottom: -1, width: 28, height: 28,
          borderRadius: '50%', background: '#e0503a', border: `3px solid ${INK}`,
          boxShadow: '2px 3px 0 rgba(80,26,18,.45)', color: '#fff6f0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Icon name="plus" size={15} strokeWidth={3.4} />
      </span>
    </button>
  );
}
