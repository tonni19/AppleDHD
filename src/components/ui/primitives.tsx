'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { FONT, INK } from '@/lib/constants';
import { shadowBtn } from '@/lib/style';
import { Icon, type IconName } from '../icons/Icon';
import { SectionIcon, type ArtSlot } from '../icons/SectionIcon';

// ---------------------------------------------------------------- buttons

/**
 * A button that is just a drawing — no chip behind it, a soft shadow following
 * its outline. The tap area stays a little larger than the art.
 */
export function ArtButton({ slot, label, onClick, size = 42 }: { slot: ArtSlot; label: string; onClick: () => void; size?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{ flex: 'none', width: size + 6, height: size + 6, padding: 0, background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <SectionIcon slot={slot} size={size} style={{ filter: 'drop-shadow(2px 3px 0 rgba(80,26,18,.35))' }} />
    </button>
  );
}

// ---------------------------------------------------------------- dropdown

interface DropdownOption {
  value: number;
  label: string;
}

/**
 * A themed stand-in for a native <select>. A bare <select> cannot be restyled
 * once it is open — every browser paints its list itself — and the plain grey
 * popup that came with it looked like it belonged to a different app. This
 * opens a small card of its own instead, sized and bordered like everything
 * else here, right under the trigger. Closes on a pick, a tap outside, or
 * Escape.
 */
export function Dropdown({ value, options, onChange, label }: { value: number; options: DropdownOption[]; onChange: (v: number) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = options.find(o => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDocDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: 'relative', flex: 'none' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          height: 44, padding: '0 12px 0 14px', borderRadius: 15,
          border: `3px solid ${INK}`, background: '#fffdfa',
          fontFamily: FONT.body, fontWeight: 800, fontSize: 14, color: '#4a251f',
        }}
      >
        {current?.label}
        <Icon name="chevronDown" size={13} strokeWidth={3} style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform .15s ease' }} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label}
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 40,
            minWidth: '100%', maxHeight: 260, overflowY: 'auto',
            padding: 6, borderRadius: 18,
            background: '#fffdfa', border: `3px solid ${INK}`,
            boxShadow: shadowBtn(0.4),
          }}
        >
          {options.map(o => {
            const on = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={on}
                onClick={() => { onChange(o.value); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
                  width: '100%', height: 40, padding: '0 10px', borderRadius: 12,
                  background: on ? '#ffd2cb' : 'transparent',
                  fontFamily: FONT.body, fontWeight: on ? 800 : 700, fontSize: 14,
                  color: on ? '#8f2c20' : '#5b4a80', textAlign: 'left', whiteSpace: 'nowrap',
                }}
              >
                {o.label}
                {on && <Icon name="check" size={13} strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface IconButtonProps {
  icon: IconName;
  label: string;
  onClick: () => void;
  bg?: string;
  color?: string;
  size?: number;
  iconSize?: number;
  radius?: number;
  style?: CSSProperties;
}

/**
 * A labelled icon button. Every icon-only control in the app goes through here so
 * it always carries an accessible name — the old emoji buttons announced
 * themselves as "flower" or nothing at all.
 */
export function IconButton({ icon, label, onClick, bg = '#fffdfa', color = '#7d4d41', size = 40, iconSize = 18, radius, style }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        width: size,
        height: size,
        flex: 'none',
        borderRadius: radius ?? size / 2.6,
        background: bg,
        border: `3px solid ${INK}`,
        boxShadow: shadowBtn(0.35),
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <Icon name={icon} size={iconSize} strokeWidth={2.6} />
    </button>
  );
}

/** Trailing delete control for list rows. Safe to be one tap because of undo. */
export function DeleteButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <IconButton icon="trash" label={label} onClick={onClick} bg="#ffd2cb" color="#8f2c20" size={38} iconSize={17} />;
}

// ---------------------------------------------------------------- empty state

interface EmptyProps {
  /** A line icon, shown dimmed. */
  icon?: ReactNode;
  /** A drawing, shown at full strength — dimming washes out its colours. */
  art?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}

/** The designed nothing-here state, shown instead of fabricated sample rows. */
export function EmptyState({ icon, art, title, hint, action }: EmptyProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '24px 16px',
        borderRadius: 22,
        border: '3px dashed rgba(107,50,38,.4)',
        textAlign: 'center',
      }}
    >
      {art && <div style={{ marginBottom: 2 }}>{art}</div>}
      {icon && <div style={{ opacity: 0.55, marginBottom: 2 }}>{icon}</div>}
      <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 22, lineHeight: 1.1, color: '#8a5148' }}>{title}</div>
      {hint && <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 16, lineHeight: 1.25, color: '#a8776c', maxWidth: 260 }}>{hint}</div>}
      {action && <div style={{ marginTop: 6 }}>{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------- toast

interface ToastProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
}

/** Sits above the tab bar and inside the safe area. */
export function Toast({ message, actionLabel, onAction, onDismiss }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'absolute',
        left: 14,
        right: 14,
        bottom: 'calc(var(--tabbar-h) + var(--tabbar-gap) + var(--sa-bottom) + 14px)',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '11px 12px',
        borderRadius: 20,
        background: '#fff6f0',
        border: `3px solid ${INK}`,
        boxShadow: '4px 5px 0 rgba(80,26,18,.45)',
        animation: 'apToastIn .2s ease',
      }}
    >
      <div style={{
        flex: 1, minWidth: 0, fontFamily: FONT.body, fontWeight: 800, fontSize: 14,
        lineHeight: 1.35, color: '#5a2f28',
        // Wraps rather than truncating: a clipped message is unreadable exactly
        // when it matters, which is when something has gone wrong.
        display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 4, overflow: 'hidden',
        overflowWrap: 'anywhere',
      }}>
        {message}
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 12px', borderRadius: 14,
            background: '#dcecc9', border: `3px solid ${INK}`, color: '#3a5a29',
            fontFamily: FONT.display, fontWeight: 700, fontSize: 14,
          }}
        >
          <Icon name="undo" size={15} strokeWidth={2.8} />{actionLabel}
        </button>
      )}
      <IconButton icon="close" label="dismiss" onClick={onDismiss} size={34} iconSize={15} bg="#f1e2d8" />
    </div>
  );
}

// ---------------------------------------------------------------- switch

interface SwitchProps {
  on: boolean;
  onChange: (next: boolean) => void;
  label: string;
}

export function Switch({ on, onChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      style={{
        width: 58,
        height: 34,
        flex: 'none',
        borderRadius: 18,
        background: on ? '#8fae74' : '#f1e2d8',
        border: `3px solid ${INK}`,
        boxShadow: shadowBtn(0.3),
        display: 'flex',
        alignItems: 'center',
        justifyContent: on ? 'flex-end' : 'flex-start',
        padding: 2,
        transition: 'background .18s ease',
      }}
    >
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: '#fffdfa',
          border: `2.5px solid ${INK}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#3a5a29',
          transition: 'transform .18s ease',
        }}
      >
        {on && <Icon name="check" size={12} strokeWidth={3.4} />}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------- rows

/** A settings/list row: label, optional hint, trailing control. */
export function SettingRow({ title, hint, leading, trailing, onClick }: { title: string; hint?: string; leading?: ReactNode; trailing?: ReactNode; onClick?: () => void }) {
  const inner = (
    <>
      {leading}
      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 15, lineHeight: 1.3, color: '#4a251f' }}>{title}</div>
        {hint && <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 14.5, lineHeight: 1.25, color: '#a8776c' }}>{hint}</div>}
      </div>
      {trailing}
    </>
  );

  const style: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '12px 13px',
    borderRadius: 18,
    background: '#fffdfa',
    border: `3px solid ${INK}`,
    boxShadow: '2px 3px 0 rgba(80,26,18,.25)',
  };

  return onClick
    ? <button type="button" onClick={onClick} style={style}>{inner}</button>
    : <div style={style}>{inner}</div>;
}

export function SectionLabel({ children, color = '#7d4a41' }: { children: ReactNode; color?: string }) {
  return (
    <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 18, color, margin: '2px 0 8px' }}>{children}</div>
  );
}
