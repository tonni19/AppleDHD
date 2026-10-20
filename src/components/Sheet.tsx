'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { FONT, INK } from '@/lib/constants';
import { IconButton } from './ui/primitives';

interface Props {
  onClose: () => void;
  zIndex?: number;
  bg?: string;
  title?: string;
  /** Leading badge beside the title. */
  badge?: ReactNode;
  titleColor?: string;
  padding?: string;
  children: ReactNode;
}

/**
 * The bottom-sheet shell shared by every modal.
 *
 * Beyond the scrim and rise-in, this now handles the things that made sheets feel
 * like a dead end: an explicit close button, Escape to dismiss, focus moved into
 * the sheet and restored on exit, and bottom padding that tracks the on-screen
 * keyboard so the last field is never hidden behind it.
 */
export function Sheet({ onClose, zIndex = 60, bg = '#fff7f2', title, badge, titleColor = '#5a2f28', padding = '16px 18px 20px', children }: Props) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    restoreTo.current = document.activeElement as HTMLElement | null;
    // Focus the sheet itself rather than its first field, so opening one does not
    // immediately throw up the keyboard.
    cardRef.current?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !cardRef.current) return;
      const focusable = cardRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      restoreTo.current?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <button
        type="button"
        onClick={onClose}
        aria-label="dismiss"
        tabIndex={-1}
        style={{
          position: 'absolute', inset: 0, background: 'rgba(70,16,10,.42)',
          backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', animation: 'apFade .18s ease',
        }}
      />
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        style={{
          position: 'relative',
          margin: '0 8px 8px',
          // Clears the home indicator, and rises with the keyboard where the
          // browser reports it via the virtual keyboard inset.
          marginBottom: 'calc(var(--sa-bottom) + 8px)',
          maxHeight: 'calc(100% - var(--sa-top) - 24px)',
          overflowY: 'auto',
          borderRadius: 34,
          padding,
          background: bg,
          border: `4px solid ${INK}`,
          boxShadow: '0 -10px 40px rgba(70,16,10,.35)',
          animation: 'apRise .26s cubic-bezier(.2,.9,.3,1)',
          outline: 'none',
        }}
        className="ap-scroll"
      >
        <div aria-hidden="true" style={{ width: 48, height: 6, borderRadius: 4, background: 'rgba(107,50,38,.35)', margin: '0 auto 12px' }} />

        {title && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            {badge}
            <div style={{ flex: 1, minWidth: 0, fontFamily: FONT.display, fontWeight: 700, fontSize: 20, lineHeight: 1.15, color: titleColor }}>
              {title}
            </div>
            <IconButton icon="close" label="close" onClick={onClose} size={38} iconSize={16} bg="#f1e2d8" />
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
