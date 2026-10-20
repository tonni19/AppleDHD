'use client';

import { useEffect, useRef } from 'react';
import { catOf, FONT, INK } from '@/lib/constants';
import { hhmm } from '@/lib/date';
import { canScheduleReminders } from '@/lib/platform';
import { chipStyle, hexRgb, rowShell, shadowRow } from '@/lib/style';
import type { Task } from '@/lib/types';
import { Icon } from './icons/Icon';
import { DeleteButton } from './ui/primitives';

interface MoveProps {
  dir: -1 | 1;
  enabled: boolean;
  title: string;
  id: string;
  onMove: (id: string, dir: -1 | 1) => void;
}

function MoveButton({ dir, enabled, title, id, onMove }: MoveProps) {
  return (
    <button
      type="button"
      disabled={!enabled}
      onClick={() => onMove(id, dir)}
      aria-label={`move ${title} ${dir === -1 ? 'up' : 'down'}`}
      style={{
        width: 30, height: 21, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#fffdfa', border: `2.5px solid ${INK}`,
        color: '#7d4d41', opacity: enabled ? 1 : 0.32,
      }}
    >
      <Icon name={dir === -1 ? 'chevronUp' : 'chevronDown'} size={13} strokeWidth={3} />
    </button>
  );
}

interface Props {
  task: Task;
  onToggle: (id: string, date: string) => void;
  /** Opens the edit sheet. Omit to make the row non-editable. */
  onEdit?: (id: string) => void;
  /** Shows the trailing delete control. */
  onDelete?: (id: string, date: string) => void;
  /** Shows the reorder control. Pass null for an end of the list to disable it. */
  onMove?: (id: string, dir: -1 | 1) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  /** Marked with a yellow ring and scrolled into view — used when a reminder is tapped. */
  focused?: boolean;
  /** The card transparency setting — this row only ever sits on the artwork, never on paper. */
  alpha: number;
}

export function TaskRow({ task, onToggle, onEdit, onDelete, onMove, canMoveUp, canMoveDown, focused, alpha }: Props) {
  const c = catOf(task.cat);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focused) ref.current?.scrollIntoView({ block: 'center' });
  }, [focused]);

  return (
    <div
      ref={ref}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '11px 12px',
        borderRadius: 20,
        ...rowShell(alpha, hexRgb(c.soft)),
        border: `3px solid ${INK}`,
        boxShadow: focused ? `0 0 0 4px #ffd166, ${shadowRow}` : shadowRow,
        opacity: task.done ? 0.68 : 1,
      }}
    >
      <button
        type="button"
        onClick={() => onToggle(task.id, task.date)}
        role="checkbox"
        aria-checked={task.done}
        aria-label={task.done ? `mark ${task.title} as not done` : `mark ${task.title} as done`}
        style={{
          width: 34, height: 34, flex: 'none', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `3px solid ${INK}`, background: task.done ? c.color : '#fffdfa', color: '#fff6f0',
        }}
      >
        {task.done && <Icon name="check" size={15} strokeWidth={3.4} />}
      </button>

      <button
        type="button"
        onClick={onEdit ? () => onEdit(task.id) : undefined}
        disabled={!onEdit}
        aria-label={onEdit ? `edit ${task.title}` : undefined}
        style={{ flex: 1, minWidth: 0, textAlign: 'left', cursor: onEdit ? 'pointer' : 'default' }}
      >
        <div
          data-selectable
          style={{
            fontFamily: FONT.body, fontWeight: 800, fontSize: 15.5, lineHeight: 1.25, color: '#4a251f',
            textDecoration: task.done ? 'line-through' : 'none',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >
          {task.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginTop: 3 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: FONT.body, fontWeight: 700, fontSize: 12.5, color: '#8a5f56' }}>
            {task.time ? <Icon name="clock" size={12} strokeWidth={2.6} /> : null}
            {task.time ? hhmm(task.time) : 'all day'}
          </span>
          <span style={chipStyle('#fffdfa', c.ink)}>{c.label}</span>
          {task.repeat && (
            <span aria-label={`repeats every ${task.repeat.every}`} title={`repeats every ${task.repeat.every}`} style={{ display: 'inline-flex', color: '#8a5f56' }}>
              <Icon name="refresh" size={12} strokeWidth={2.6} />
            </span>
          )}
          {task.note && (
            <span aria-label="has notes" title={task.note} style={{ display: 'inline-flex', color: '#8a5f56' }}>
              <Icon name="note" size={12} strokeWidth={2.6} />
            </span>
          )}
          {task.remind !== null && canScheduleReminders() && (
            <span aria-label="reminder set" style={{ display: 'inline-flex', color: '#8a5f56' }}>
              <Icon name="bell" size={12} strokeWidth={2.6} />
            </span>
          )}
        </div>
      </button>

      {onMove && (
        // A stacked pair rather than drag handles: reliable under a thumb, and
        // it works for keyboard and switch users without a pointer gesture.
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 'none' }}>
          <MoveButton dir={-1} enabled={!!canMoveUp} title={task.title} onMove={onMove} id={task.id} />
          <MoveButton dir={1} enabled={!!canMoveDown} title={task.title} onMove={onMove} id={task.id} />
        </div>
      )}

      {onDelete && <DeleteButton label={`delete ${task.title}`} onClick={() => onDelete(task.id, task.date)} />}
    </div>
  );
}
