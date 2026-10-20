'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { appendItem, hasChecklist, moveChecked, moveLine, parseLines, progressOf, realign, removeChecked, toggleChecked } from '@/lib/checklist';
import { FONT, INK, STICKY_TINT } from '@/lib/constants';
import { chipStyle } from '@/lib/style';
import type { ListNote } from '@/lib/types';
import { Icon } from '../icons/Icon';
import { IconButton } from '../ui/primitives';

interface Props {
  note: ListNote;
  onSetText: (v: string) => void;
  onSetChecked: (checked: number[]) => void;
  onSetContent: (text: string, checked: number[]) => void;
  onSetColor: (color: number) => void;
  onTick: () => void;
}

/**
 * A page: ruled paper you can write on, or tick through.
 *
 * The text is the only stored form. Check mode reads checklist lines back out of
 * it and writes changes straight back, so a note is never trapped in one shape —
 * delete a dash in write mode and that line stops being a checkbox.
 */
export function NoteScreen({ note, onSetText, onSetChecked, onSetContent, onSetColor, onTick }: Props) {
  const [checkMode, setCheckMode] = useState(() => hasChecklist(note.text));
  const [newItem, setNewItem] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const rows = useRef(new Map<number, HTMLDivElement>());

  const lines = parseLines(note.text, note.checked);
  const progress = progressOf(note.text, note.checked);
  const items = lines.filter(l => l.isItem);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.max(420, el.scrollHeight) + 'px';
  }, [note.text, note.id, checkMode]);

  const addItem = () => {
    if (!newItem.trim()) return;
    onSetText(appendItem(note.text, newItem));
    setNewItem('');
  };

  /** Which item row the pointer is over, as a raw line index. */
  const rowAt = useCallback((y: number): number | null => {
    let hit: number | null = null;
    rows.current.forEach((el, index) => {
      const r = el.getBoundingClientRect();
      if (y >= r.top && y <= r.bottom) hit = index;
    });
    return hit;
  }, []);

  const startDrag = (e: React.PointerEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragIndex(index);
    onTick();
  };

  const moveDrag = (e: React.PointerEvent, index: number) => {
    if (dragIndex !== index) return;
    const over = rowAt(e.clientY);
    if (over !== null && over !== index) {
      onSetContent(moveLine(note.text, index, over), moveChecked(note.checked, index, over));
      setDragIndex(over);
    }
  };

  const endDrag = (e: React.PointerEvent) => {
    if (dragIndex === null) return;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* already gone */ }
    setDragIndex(null);
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button type="button" onClick={() => setCheckMode(false)} aria-pressed={!checkMode} style={modeBtn(!checkMode)}>
          <Icon name="pencil" size={15} strokeWidth={2.6} />write
        </button>
        <button type="button" onClick={() => setCheckMode(true)} aria-pressed={checkMode} style={modeBtn(checkMode)}>
          <Icon name="checklist" size={15} strokeWidth={2.6} />check
        </button>
        <div style={{ flex: 1 }} />
        {progress.total > 0 && (
          <span style={chipStyle(progress.done === progress.total ? '#dcecc9' : '#f1e2d8', progress.done === progress.total ? '#3a5a29' : '#7d4d41')}>
            {progress.done}/{progress.total}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        {STICKY_TINT.map((c, i) => (
          <button
            key={c}
            type="button"
            onClick={() => onSetColor(i)}
            aria-label={`colour ${i + 1}`}
            aria-pressed={i === note.color}
            style={{
              width: 26, height: 26, flex: 'none', borderRadius: '50%', background: c,
              border: `3px solid ${i === note.color ? INK : 'rgba(107,50,38,.3)'}`,
              boxShadow: i === note.color ? '2px 2px 0 rgba(80,26,18,.35)' : 'none',
            }}
          />
        ))}
      </div>

      {checkMode ? (
        <>
          {items.length === 0 && (
            <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 16.5, lineHeight: 1.4, color: '#a8776c', marginBottom: 14 }}>
              nothing to tick yet. add one below, or start a line with a dash in write mode.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {lines.map(line => (line.isItem ? (
              <div
                key={line.index}
                ref={el => { if (el) rows.current.set(line.index, el); else rows.current.delete(line.index); }}
                style={{
                  position: 'relative',
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 10px 11px 12px', borderRadius: 18,
                  background: line.checked ? '#f4ece4' : '#fffdfa',
                  border: `3px solid ${INK}`,
                  boxShadow: dragIndex === line.index ? '5px 6px 0 rgba(80,26,18,.4)' : '2px 3px 0 rgba(80,26,18,.25)',
                  transform: dragIndex === line.index ? 'scale(1.02)' : 'none',
                  opacity: line.checked ? 0.72 : 1,
                  zIndex: dragIndex === line.index ? 3 : 1,
                }}
              >
                <button
                  type="button"
                  onClick={() => { onTick(); onSetChecked(toggleChecked(note.checked, line.index)); }}
                  aria-pressed={line.checked}
                  aria-label={`${line.checked ? 'untick' : 'tick'} ${line.label || 'item'}`}
                  style={{
                    width: 28, height: 28, flex: 'none', borderRadius: 9,
                    border: `3px solid ${INK}`, background: line.checked ? '#8fae74' : '#fffdfa',
                    color: '#fffdfa', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {line.checked && <Icon name="check" size={14} strokeWidth={3.4} />}
                </button>

                <button
                  type="button"
                  onClick={() => { onTick(); onSetChecked(toggleChecked(note.checked, line.index)); }}
                  style={{ flex: 1, minWidth: 0, textAlign: 'left' }}
                >
                  <span data-selectable style={{
                    fontFamily: FONT.body, fontWeight: 700, fontSize: 15.5, lineHeight: 1.35,
                    color: '#4a3a26', overflowWrap: 'anywhere',
                  }}>
                    {line.label || '—'}
                  </span>
                </button>

                {/* The handle owns the gesture so a swipe on the row still
                    scrolls the page; touch-action none is safe on 30px. */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`move ${line.label || 'item'}`}
                  onPointerDown={e => startDrag(e, line.index)}
                  onPointerMove={e => moveDrag(e, line.index)}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  style={{
                    width: 30, height: 30, flex: 'none', borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#a8776c', cursor: 'grab', touchAction: 'none',
                  }}
                >
                  <Icon name="drag" size={15} strokeWidth={3} />
                </div>

                {/* A struck item is crossed right through, the way you would on
                    paper — the old line-through only marked the words. */}
                {line.checked && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute', left: 48, right: 10, top: '50%',
                      height: 2.5, borderRadius: 2, background: 'rgba(107,50,38,.75)',
                    }}
                  />
                )}
              </div>
            ) : line.raw.trim() ? (
              <div key={line.index} data-selectable style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 17, lineHeight: 1.35, color: '#8a5f56', padding: '2px 4px' }}>
                {line.raw}
              </div>
            ) : null))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addItem(); }}
              placeholder="add an item"
              aria-label="add a checklist item"
              style={{
                flex: 1, minWidth: 0, height: 50, borderRadius: 18, border: `3px solid ${INK}`,
                background: '#fffdfa', padding: '0 14px',
                fontFamily: FONT.body, fontWeight: 700, fontSize: 15, color: '#4a251f', outline: 'none',
              }}
            />
            <IconButton icon="plus" label="add item" onClick={addItem} size={50} iconSize={20} bg="#e8b13a" color="#5a2f28" radius={18} />
          </div>

          {progress.done > 0 && (
            <button
              type="button"
              onClick={() => { const r = removeChecked(note.text, note.checked); onSetContent(r.text, r.checked); }}
              style={{ ...chipStyle('#f1e2d8', '#7d4d41'), height: 38, padding: '0 13px' }}
            >
              <Icon name="trash" size={13} strokeWidth={2.6} />clear the {progress.done} ticked
            </button>
          )}
        </>
      ) : (
        // A textarea cannot style one line differently from another, so the
        // struck-through text is a mirror layer underneath with identical
        // metrics. The textarea sits on top with transparent glyphs, keeping
        // real editing, selection and the caret — only the painting moves.
        <div
          style={{
            position: 'relative',
            minHeight: 420,
            background: 'repeating-linear-gradient(180deg, transparent 0 31px, rgba(107,50,38,.16) 31px 33px)',
          }}
        >
          <div aria-hidden="true" style={{ ...writeType, position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {note.text === '' && (
              <div style={{ color: '#b49a8c' }}>write anything here…</div>
            )}
            {note.text !== '' && lines.map(line => (
              <div
                key={line.index}
                style={{
                  textDecoration: line.isItem && line.checked ? 'line-through' : 'none',
                  textDecorationThickness: 2,
                  textDecorationColor: 'rgba(107,50,38,.8)',
                  color: line.isItem && line.checked ? 'rgba(74,58,38,.55)' : '#4a3a26',
                }}
              >
                {/* An empty line still has to occupy its row. */}
                {line.raw === '' ? '​' : line.raw}
              </div>
            ))}
          </div>

          <textarea
            ref={ref}
            value={note.text}
            onChange={e => onSetContent(e.target.value, realign(note.text, e.target.value, note.checked))}
            placeholder={'write anything here…\n\nstart a line with - to make it tickable'}
            aria-label={`contents of ${note.title}`}
            style={{
              ...writeType,
              position: 'relative',
              display: 'block',
              minHeight: 420,
              border: 0,
              outline: 'none',
              resize: 'none',
              background: 'transparent',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
              caretColor: INK,
              overflow: 'hidden',
            }}
          />
        </div>
      )}
    </>
  );
}

/**
 * The typography both write-mode layers share.
 *
 * Wrapping has to be byte-identical between the mirror and the textarea, so
 * every property that can influence a line break lives here and nowhere else.
 */
const writeType: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 0,
  margin: 0,
  border: 0,
  fontFamily: FONT.body,
  fontWeight: 700,
  fontSize: 16,
  lineHeight: '33px',
  letterSpacing: 'normal',
  whiteSpace: 'pre-wrap',
  overflowWrap: 'break-word',
  wordBreak: 'normal',
  textAlign: 'left',
};

function modeBtn(on: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 6,
    height: 38, padding: '0 14px', borderRadius: 14,
    background: on ? '#ffe6b3' : '#fffdfa',
    border: `3px solid ${INK}`,
    color: on ? '#7a5312' : '#a8776c',
    boxShadow: on ? '2px 3px 0 rgba(80,26,18,.35)' : 'none',
    fontFamily: FONT.display, fontWeight: 700, fontSize: 14,
  };
}
