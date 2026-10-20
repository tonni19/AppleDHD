'use client';

import { useCallback, useRef, useState } from 'react';
import { FONT, INK, STICKY_INK, STICKY_TINT } from '@/lib/constants';
import { chipStyle } from '@/lib/style';
import type { ListNote, Sticky } from '@/lib/types';
import { uid } from '@/lib/uid';
import { Icon } from '../icons/Icon';
import { EmptyState, IconButton } from '../ui/primitives';

interface Props {
  note: ListNote;
  onAdd: (stickyId: string) => void;
  onSetText: (stickyId: string, text: string) => void;
  onSetColor: (stickyId: string, color: number) => void;
  onDelete: (stickyId: string) => void;
  onMove: (stickyId: string, toIndex: number) => void;
  onTick: () => void;
}

export function BoardScreen({ note, onAdd, onSetText, onSetColor, onDelete, onMove, onTick }: Props) {
  const stickies = note.stickies.slice().sort((a, b) => a.order - b.order);
  const [editing, setEditing] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const refs = useRef(new Map<string, HTMLDivElement>());

  // The board mints the id so it can open the new sticky for writing straight
  // away, instead of dropping a card you have to find and tap.
  const addSticky = useCallback(() => {
    const id = uid();
    onAdd(id);
    setEditing(id);
  }, [onAdd]);

  /** A sticky left blank was never really created; take it back off the board. */
  const finishEditing = useCallback((sticky: Sticky) => {
    setEditing(null);
    if (!sticky.text.trim()) onDelete(sticky.id);
  }, [onDelete]);

  /** Which slot the pointer is currently over, by hit-testing the live layout. */
  const slotAt = useCallback((x: number, y: number): number => {
    let best = -1;
    let bestDist = Infinity;
    stickies.forEach((s, i) => {
      const el = refs.current.get(s.id);
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        best = i;
        bestDist = -1;
        return;
      }
      if (bestDist === -1) return;
      const dx = x - (r.left + r.width / 2);
      const dy = y - (r.top + r.height / 2);
      const d = dx * dx + dy * dy;
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  }, [stickies]);

  const onHandleDown = (e: React.PointerEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragId(id);
    onTick();
  };

  const onHandleMove = (e: React.PointerEvent, id: string) => {
    if (dragId !== id) return;
    const to = slotAt(e.clientX, e.clientY);
    const from = stickies.findIndex(s => s.id === id);
    if (to >= 0 && to !== from) onMove(id, to);
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!dragId) return;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* already released */ }
    setDragId(null);
  };

  return (
    <>
      {stickies.length === 0 ? (
        <EmptyState
          icon={<Icon name="board" size={42} strokeWidth={2} />}
          title="an empty board"
          hint="stick anything here — ideas, reminders, things to look up."
          action={(
            <button type="button" onClick={addSticky} style={{ ...chipStyle('#e8b13a', '#5a2f28'), height: 44, padding: '0 16px', fontSize: 15 }}>
              <Icon name="plus" size={15} strokeWidth={3} />add a sticky
            </button>
          )}
        />
      ) : (
        <>
          <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 15.5, color: '#a8776c', marginBottom: 10 }}>
            tap a sticky to write on it · drag the dots to move it
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10, marginBottom: 14 }}>
            {stickies.map(s => (
              <StickyCard
                key={s.id}
                sticky={s}
                dragging={dragId === s.id}
                editing={editing === s.id}
                onRef={el => { if (el) refs.current.set(s.id, el); else refs.current.delete(s.id); }}
                onEdit={() => setEditing(s.id)}
                onDone={() => finishEditing(s)}
                onSetText={t => onSetText(s.id, t)}
                onSetColor={c => onSetColor(s.id, c)}
                onDelete={() => onDelete(s.id)}
                onHandleDown={e => onHandleDown(e, s.id)}
                onHandleMove={e => onHandleMove(e, s.id)}
                onHandleUp={endDrag}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={addSticky}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', height: 52, borderRadius: 18,
              border: '3px dashed rgba(107,50,38,.5)',
              fontFamily: FONT.display, fontWeight: 700, fontSize: 15, color: '#7a5312',
            }}
          >
            <Icon name="plus" size={17} strokeWidth={3} />add a sticky
          </button>
        </>
      )}
    </>
  );
}

interface CardProps {
  sticky: Sticky;
  dragging: boolean;
  editing: boolean;
  onRef: (el: HTMLDivElement | null) => void;
  onEdit: () => void;
  onDone: () => void;
  onSetText: (t: string) => void;
  onSetColor: (c: number) => void;
  onDelete: () => void;
  onHandleDown: (e: React.PointerEvent) => void;
  onHandleMove: (e: React.PointerEvent) => void;
  onHandleUp: (e: React.PointerEvent) => void;
}

function StickyCard({ sticky, dragging, editing, onRef, onEdit, onDone, onSetText, onSetColor, onDelete, onHandleDown, onHandleMove, onHandleUp }: CardProps) {
  const tint = STICKY_TINT[sticky.color % STICKY_TINT.length];
  const ink = STICKY_INK[sticky.color % STICKY_INK.length];
  const name = sticky.text.trim() || 'this sticky';

  return (
    <div
      ref={onRef}
      data-sticky-id={sticky.id}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 118,
        padding: '9px 10px 10px',
        borderRadius: 16,
        background: tint,
        border: `3px solid ${INK}`,
        boxShadow: dragging ? '6px 8px 0 rgba(80,26,18,.45)' : '3px 4px 0 rgba(80,26,18,.3)',
        transform: dragging ? 'scale(1.04) rotate(-1.5deg)' : 'none',
        zIndex: dragging ? 5 : 1,
        transition: dragging ? 'none' : 'transform .15s ease, box-shadow .15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
        {/* The handle owns the gesture, so a swipe anywhere else still scrolls
            the board. touch-action none is safe here because it is 28px wide. */}
        <div
          role="button"
          tabIndex={0}
          aria-label={`move ${name}`}
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
          onPointerCancel={onHandleUp}
          style={{
            width: 28, height: 24, flex: 'none', borderRadius: 7,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: ink, opacity: 0.55, cursor: 'grab', touchAction: 'none',
          }}
        >
          <Icon name="drag" size={15} strokeWidth={3} />
        </div>
        <div style={{ flex: 1 }} />
        <IconButton icon="trash" label={`delete ${name}`} onClick={onDelete} size={26} iconSize={12} bg="rgba(255,253,250,.75)" color={ink} radius={8} />
      </div>

      {editing ? (
        <textarea
          value={sticky.text}
          onChange={e => onSetText(e.target.value)}
          onBlur={onDone}
          autoFocus
          placeholder="write something…"
          aria-label="sticky text"
          style={{
            flex: 1, width: '100%', border: 0, outline: 'none', resize: 'none', background: 'transparent',
            fontFamily: FONT.body, fontWeight: 700, fontSize: 14, lineHeight: 1.35, color: ink,
            padding: 0, minHeight: 52,
          }}
        />
      ) : (
        <button
          type="button"
          onClick={onEdit}
          style={{ flex: 1, width: '100%', textAlign: 'left', color: ink }}
        >
          <span
            data-selectable
            style={{
              fontFamily: FONT.body, fontWeight: 700, fontSize: 14, lineHeight: 1.35,
              overflowWrap: 'anywhere', opacity: sticky.text ? 1 : 0.45,
            }}
          >
            {sticky.text || 'write something…'}
          </span>
        </button>
      )}

      {editing && (
        <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
          {STICKY_TINT.map((c, i) => (
            <button
              key={c}
              type="button"
              // Pointer-down rather than click: the textarea's blur would close
              // the editor before a click ever landed.
              onPointerDown={e => { e.preventDefault(); onSetColor(i); }}
              aria-label={`colour ${i + 1}`}
              style={{
                width: 18, height: 18, flex: 'none', borderRadius: '50%', background: c,
                border: `2.5px solid ${i === sticky.color ? INK : 'rgba(107,50,38,.35)'}`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
