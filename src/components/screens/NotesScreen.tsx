'use client';

import { progressOf } from '@/lib/checklist';
import { FONT, INK, STICKY_TINT } from '@/lib/constants';
import { relativeDay } from '@/lib/date';
import { chipStyle, dashedFooterStyle } from '@/lib/style';
import type { ListNote } from '@/lib/types';
import { iso } from '@/lib/date';
import { Icon } from '../icons/Icon';
import { SectionIcon } from '../icons/SectionIcon';
import { DeleteButton, EmptyState } from '../ui/primitives';

interface Props {
  lists: ListNote[];
  pinnedNote: string | null;
  today: string;
  onOpen: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export function NotesScreen({ lists, pinnedNote, today, onOpen, onNew, onDelete }: Props) {
  const sorted = lists.slice().sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <>
      {sorted.length === 0 ? (
        <EmptyState
          icon={<SectionIcon slot="notes" size={44} />}
          title="no notes yet"
          hint="lists, rent, resolutions — anything you want to keep in one place."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {sorted.map(l => {
            const lines = String(l.text || '').split('\n').filter(t => t.trim());
            const progress = progressOf(l.text, l.checked);
            // A board counts stickies, a checklist counts ticks, and anything
            // else falls back to its first line.
            const preview = l.kind === 'board'
              ? (l.stickies.length ? `${l.stickies.length} ${l.stickies.length === 1 ? 'sticky' : 'stickies'}` : 'empty board')
              : progress.total > 0
                ? `${progress.done} of ${progress.total} ticked`
                : lines.length
                  ? `${lines.length} ${lines.length === 1 ? 'line' : 'lines'} · ${lines[0].slice(0, 26)}`
                  : 'empty page';
            return (
              <div
                key={l.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 11, padding: '12px 13px',
                  borderRadius: 20, background: '#fffdf7', border: `3px solid ${INK}`,
                  boxShadow: '3px 4px 0 rgba(80,26,18,.28)',
                }}
              >
                <span aria-hidden="true" style={{ width: 16, height: 16, flex: 'none', borderRadius: '50%', background: STICKY_TINT[l.color % STICKY_TINT.length], boxShadow: `0 0 0 2.5px ${INK}` }} />
                <button type="button" onClick={() => onOpen(l.id)} style={{ flex: 1, minWidth: 0, textAlign: 'left' }} aria-label={`open ${l.title}`}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ flex: 1, minWidth: 0, fontFamily: FONT.display, fontWeight: 700, fontSize: 16, lineHeight: 1.25, color: '#5a2f28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</span>
                    {pinnedNote === l.id && <span aria-label="pinned to home" style={{ flex: 'none', color: '#b08b7a' }}><Icon name="pin" size={13} strokeWidth={2.8} /></span>}
                    {l.kind === 'board' && <span style={{ ...chipStyle('#e2dcf2', '#463668'), flex: 'none', fontSize: 10.5, padding: '2px 7px' }}>board</span>}
                  </span>
                  <span style={{ display: 'block', fontFamily: FONT.hand, fontWeight: 400, fontSize: 14.5, lineHeight: 1.3, color: '#a8776c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {preview} · {relativeDay(iso(new Date(l.updatedAt)), today)}
                  </span>
                </button>
                <DeleteButton label={`delete ${l.title}`} onClick={() => onDelete(l.id)} />
              </div>
            );
          })}
        </div>
      )}

      <button type="button" onClick={onNew} style={dashedFooterStyle('#7a5312', sorted.length ? 14 : 18)}>
        <Icon name="plus" size={17} strokeWidth={3} />new note
      </button>
    </>
  );
}
