'use client';

import { useMemo, useState } from 'react';
import { catOf, FONT, INK } from '@/lib/constants';
import { dayHeading, relativeDay } from '@/lib/date';
import { chipStyle, shadowRow } from '@/lib/style';
import type { PersistedData } from '@/lib/types';
import { Icon } from '../icons/Icon';
import { SectionIcon, type ArtSlot } from '../icons/SectionIcon';
import { EmptyState } from '../ui/primitives';

interface Props {
  data: PersistedData;
  today: string;
  onOpenDay: (date: string) => void;
  onEditTask: (id: string) => void;
  onOpenNote: (id: string) => void;
  onGoGoals: () => void;
}

interface Hit {
  id: string;
  slot: ArtSlot;
  kind: string;
  title: string;
  sub: string;
  tint: string;
  ink: string;
  onOpen: () => void;
}

export function SearchScreen({ data, today, onOpenDay, onEditTask, onOpenNote, onGoGoals }: Props) {
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();

  const hits = useMemo<Hit[]>(() => {
    if (term.length < 1) return [];
    const out: Hit[] = [];

    data.tasks
      .filter(t => t.title.toLowerCase().includes(term) || (t.note ?? '').toLowerCase().includes(term))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 20)
      .forEach(t => {
        const c = catOf(t.cat);
        out.push({
          id: 'task-' + t.id,
          slot: 'today',
          kind: t.done ? 'done' : 'task',
          title: t.title,
          sub: dayHeading(t.date, today),
          tint: c.soft,
          ink: c.ink,
          onOpen: () => onEditTask(t.id),
        });
      });

    data.lists
      .filter(l => l.title.toLowerCase().includes(term) || l.text.toLowerCase().includes(term))
      .slice(0, 12)
      .forEach(l => {
        // Show the matching line, not just the note title.
        const line = l.text.split('\n').find(x => x.toLowerCase().includes(term));
        out.push({
          id: 'note-' + l.id,
          slot: 'notes',
          kind: 'note',
          title: l.title,
          sub: line ? line.trim().slice(0, 60) : 'matches the title',
          tint: '#ffe6b3',
          ink: '#7a5312',
          onOpen: () => onOpenNote(l.id),
        });
      });

    data.goals
      .filter(g => g.name.toLowerCase().includes(term))
      .slice(0, 8)
      .forEach(g => {
        out.push({
          id: 'goal-' + g.id,
          slot: 'goals',
          kind: 'goal',
          title: g.name,
          sub: `${g.perDay} hrs a day × ${g.targetD} days`,
          tint: '#dcecc9',
          ink: '#3a5a29',
          onOpen: onGoGoals,
        });
      });

    data.budgetNotes
      .filter(n => n.text.toLowerCase().includes(term))
      .slice(0, 8)
      .forEach(n => {
        out.push({
          id: 'bnote-' + n.id,
          slot: 'budget',
          kind: 'budget note',
          title: n.text,
          sub: n.date ? relativeDay(n.date, today) : '',
          tint: '#e2dcf2',
          ink: '#463668',
          onOpen: () => { if (n.date) onOpenDay(n.date); },
        });
      });

    return out;
  }, [term, data, today, onEditTask, onOpenNote, onGoGoals, onOpenDay]);

  return (
    <>
      {/* The magnifier sits inside the field, where people look for it. */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <span aria-hidden="true" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', display: 'flex', color: '#a8776c', pointerEvents: 'none' }}>
          <Icon name="search" size={19} strokeWidth={2.6} />
        </span>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="search tasks, notes, goals…"
          aria-label="search"
          autoFocus
          style={{
            width: '100%', height: 52, borderRadius: 18, border: `3px solid ${INK}`,
            background: '#fffdfa', padding: '0 15px 0 44px',
            fontFamily: FONT.body, fontWeight: 800, fontSize: 16, color: '#4a251f', outline: 'none',
          }}
        />
      </div>

      {/* Each state fades in as it replaces the last, so typing never jumps. The
          mouse settles in once when the page opens; nothing keeps moving. */}
      {term.length === 0 && (
        <div style={{ animation: 'apFade .25s ease both' }}>
          <EmptyState
            art={
              <SectionIcon
                slot="search"
                size={92}
                style={{ animation: 'apSettle .5s cubic-bezier(.22,1,.36,1) .05s both', filter: 'drop-shadow(2px 3px 0 rgba(80,26,18,.25))' }}
              />
            }
            title="search everything"
            hint="tasks, notepad pages, goals and budget notes — all at once."
          />
        </div>
      )}

      {term.length > 0 && hits.length === 0 && (
        <div style={{ animation: 'apFade .2s ease both' }}>
          <EmptyState title="nothing found" hint={`no match for “${q.trim()}”`} />
        </div>
      )}

      {hits.length > 0 && (
        <div style={{ animation: 'apFade .2s ease both' }}>
          <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 16, color: '#a8776c', marginBottom: 9 }}>
            {hits.length} {hits.length === 1 ? 'result' : 'results'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {hits.map(h => (
              <button
                type="button"
                key={h.id}
                onClick={h.onOpen}
                style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '11px 12px', borderRadius: 18, background: '#fffdfa', border: `3px solid ${INK}`, boxShadow: shadowRow, textAlign: 'left' }}
              >
                <SectionIcon slot={h.slot} size={30} strokeWidth={2.6} style={{ flex: 'none', filter: 'drop-shadow(1px 1px 0 rgba(80,26,18,.3))' }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontFamily: FONT.body, fontWeight: 800, fontSize: 15, lineHeight: 1.25, color: '#4a251f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.title}</span>
                  <span style={{ display: 'block', fontFamily: FONT.hand, fontWeight: 400, fontSize: 14.5, lineHeight: 1.25, color: '#a8776c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.sub}</span>
                </span>
                <span style={chipStyle(h.tint, h.ink)}>{h.kind}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
