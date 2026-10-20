'use client';

import { useState } from 'react';
import { CAT_KEYS, catOf, FONT, INK, REMIND_OPTIONS } from '@/lib/constants';
import { addDays, pretty, prettyFull } from '@/lib/date';
import { canScheduleReminders } from '@/lib/platform';
import { money } from '@/lib/logic';
import { cancelBtnStyle, chipStyle, fieldInput, fieldInputCompact, fieldLabel, primaryBtnStyle, scopeBtnStyle } from '@/lib/style';
import type { Draft, Goal, NoteKind, PeriodEntry, RepeatEvery, Scope } from '@/lib/types';
import { Icon } from '../icons/Icon';
import { SectionIcon } from '../icons/SectionIcon';
import { Sheet } from '../Sheet';
import { DeleteButton } from '../ui/primitives';

const badgeStyle = (bg: string, color: string): React.CSSProperties => ({
  width: 32, height: 32, flex: 'none', borderRadius: 11, background: bg,
  border: `3px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color,
});

// ---------------------------------------------------------------- task

interface TaskSheetProps {
  draft: Draft;
  editing: boolean;
  onClose: () => void;
  onChange: (patch: Partial<Draft>) => void;
  onSave: () => void;
  /** Deletes the whole task, series included. */
  onDelete?: () => void;
}

const REPEATS: [RepeatEvery | null, string][] = [
  [null, 'never'],
  ['day', 'every day'],
  ['week', 'every week'],
  ['month', 'every month'],
];

export function TaskSheet({ draft, editing, onClose, onChange, onSave, onDelete }: TaskSheetProps) {
  const allDay = draft.time === null;

  return (
    <Sheet
      onClose={onClose}
      title={editing ? 'edit this' : 'what is it?'}
      badge={<SectionIcon slot="today" size={32} strokeWidth={2.6} style={{ filter: 'drop-shadow(1px 2px 0 rgba(80,26,18,.3))' }} />}
    >
      <input
        value={draft.title}
        onChange={e => onChange({ title: e.target.value })}
        placeholder="e.g. dsa exam"
        aria-label="what is it"
        autoFocus={!editing}
        style={fieldInput}
      />

      <div style={fieldLabel}>how urgent is it?</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 15 }}>
        {CAT_KEYS.map(k => {
          const c = catOf(k);
          const on = draft.cat === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => onChange({ cat: k })}
              aria-pressed={on}
              style={{
                height: 46, padding: '0 15px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: FONT.body, fontWeight: 800, fontSize: 14,
                background: on ? c.color : c.soft, color: on ? '#fff6f0' : c.ink,
                border: `3px solid ${INK}`, boxShadow: on ? '3px 4px 0 rgba(80,26,18,.45)' : 'none',
              }}
            >
              <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: '50%', background: on ? '#fff6f0' : c.color, boxShadow: `0 0 0 2.5px ${INK}` }} />
              {c.full}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={fieldLabel}>date</div>
          <input type="date" value={draft.date} onChange={e => onChange({ date: e.target.value })} aria-label="date" style={fieldInputCompact} />
        </div>
        <div style={{ width: 128, flex: 'none' }}>
          <div style={fieldLabel}>time</div>
          <input
            type="time"
            value={draft.time ?? ''}
            disabled={allDay}
            onChange={e => onChange({ time: e.target.value || null })}
            aria-label="time"
            style={{ ...fieldInputCompact, opacity: allDay ? 0.45 : 1 }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange({ time: allDay ? '09:00' : null })}
        aria-pressed={allDay}
        style={{ ...chipStyle(allDay ? '#dcecc9' : '#f1e2d8', allDay ? '#3a5a29' : '#7d4d41'), height: 38, padding: '0 13px', fontSize: 13, marginBottom: 14 }}
      >
        {allDay && <Icon name="check" size={13} strokeWidth={3} />}all day
      </button>

      {canScheduleReminders() && <div style={fieldLabel}>remind me</div>}
      <div style={{ display: canScheduleReminders() ? 'flex' : 'none', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
        {REMIND_OPTIONS.map(opt => {
          const on = draft.remind === opt.value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => onChange({ remind: opt.value })}
              aria-pressed={on}
              style={{ ...chipStyle(on ? '#ffe6b3' : '#fffdfa', on ? '#7a5312' : '#8a5f56'), height: 38, padding: '0 12px', fontSize: 13 }}
            >
              {opt.value !== null && <Icon name="bell" size={12} strokeWidth={2.6} />}{opt.label}
            </button>
          );
        })}
      </div>

      <div style={fieldLabel}>does it repeat?</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: draft.repeat ? 10 : 16 }}>
        {REPEATS.map(([every, label]) => {
          const on = (draft.repeat?.every ?? null) === every;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onChange({ repeat: every ? { every, until: draft.repeat?.until ?? null } : null })}
              aria-pressed={on}
              style={{ ...chipStyle(on ? '#dcecc9' : '#fffdfa', on ? '#3a5a29' : '#8a5f56'), height: 38, padding: '0 12px', fontSize: 13 }}
            >
              {every && <Icon name="refresh" size={12} strokeWidth={2.6} />}{label}
            </button>
          );
        })}
      </div>

      {draft.repeat && (
        <div style={{ marginBottom: 16 }}>
          <div style={fieldLabel}>until (leave blank to keep going)</div>
          <input
            type="date"
            value={draft.repeat.until ?? ''}
            min={draft.date}
            onChange={e => onChange({ repeat: { every: draft.repeat!.every, until: e.target.value || null } })}
            aria-label="repeat until"
            style={fieldInputCompact}
          />
        </div>
      )}

      <div style={fieldLabel}>anything to remember?</div>
      <textarea
        value={draft.note}
        onChange={e => onChange({ note: e.target.value })}
        placeholder="room 302 · bring the calculator"
        aria-label="notes for this task"
        rows={3}
        style={{
          width: '100%', borderRadius: 18, border: `3px solid ${INK}`, background: '#fffdfa',
          padding: '12px 14px', marginBottom: 16, resize: 'none',
          fontFamily: FONT.body, fontWeight: 700, fontSize: 15, lineHeight: 1.4,
          color: '#4a251f', outline: 'none',
        }}
      />

      <div style={{ display: 'flex', gap: 10 }}>
        {editing && onDelete ? (
          <DeleteButton label={draft.repeat ? 'delete the whole series' : 'delete this task'} onClick={onDelete} />
        ) : null}
        <button type="button" onClick={onClose} style={cancelBtnStyle}>cancel</button>
        <button type="button" onClick={onSave} style={primaryBtnStyle('#e0503a', '#fff6f0')}>
          {editing ? 'save' : 'add it'}
        </button>
      </div>
    </Sheet>
  );
}

// ---------------------------------------------------------------- goal

interface GoalSheetProps {
  goal: Goal | null;
  today: string;
  onClose: () => void;
  onSave: (name: string, hours: number, days: number) => void;
  onDelete?: () => void;
}

export function GoalSheet({ goal, today, onClose, onSave, onDelete }: GoalSheetProps) {
  const [name, setName] = useState(goal?.name ?? '');
  const [hours, setHours] = useState(String(goal?.perDay ?? 2));
  const [days, setDays] = useState(String(goal?.targetD ?? 10));

  const perDay = Math.max(0.25, Number(hours) || 1);
  const d = Math.max(1, Math.round(Number(days) || 1));
  const total = Math.round(perDay * d * 10) / 10;

  return (
    <Sheet
      onClose={onClose}
      bg="#fcfbf2"
      title={goal ? 'edit this goal' : 'what do you want to work on?'}
      badge={<SectionIcon slot="goals" size={32} strokeWidth={2.6} style={{ filter: 'drop-shadow(1px 2px 0 rgba(80,26,18,.3))' }} />}
    >
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="e.g. animation practice"
        aria-label="goal name"
        autoFocus={!goal}
        style={fieldInput}
      />

      <div style={{ display: 'flex', gap: 10, marginBottom: 13 }}>
        <div style={{ flex: 1 }}>
          <div style={fieldLabel}>hours a day</div>
          <input type="number" min={0.25} step={0.25} value={hours} onChange={e => setHours(e.target.value)} aria-label="hours a day" style={fieldInputCompact} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={fieldLabel}>over days</div>
          <input type="number" min={1} value={days} onChange={e => setDays(e.target.value)} aria-label="over days" style={fieldInputCompact} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', borderRadius: 20, background: '#dcecc9', border: `3px solid ${INK}`, marginBottom: 15 }}>
        <span style={badgeStyle('#fffdfa', '#3a5a29')}><Icon name="check" size={15} strokeWidth={3} /></span>
        <div>
          <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 16, lineHeight: 1.2, color: '#3a5a29' }}>that adds up to</div>
          <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 15, lineHeight: 1.4, color: '#2f4a22' }}>
            {total} hrs · finish by {pretty(addDays(goal?.startDate || today, d - 1))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {goal && onDelete ? <DeleteButton label="delete this goal" onClick={onDelete} /> : null}
        <button type="button" onClick={onClose} style={cancelBtnStyle}>cancel</button>
        <button type="button" onClick={() => onSave(name, perDay, d)} style={primaryBtnStyle('#8fae74', '#fffdfa')}>
          {goal ? 'save' : 'start it'}
        </button>
      </div>
    </Sheet>
  );
}

// ---------------------------------------------------------------- hours

interface HoursSheetProps {
  goal: Goal;
  today: string;
  onClose: () => void;
  onSave: (hours: number) => void;
}

export function HoursSheet({ goal, today, onClose, onSave }: HoursSheetProps) {
  const [value, setValue] = useState(String(goal.log[today] ?? goal.perDay));

  return (
    <Sheet
      onClose={onClose}
      bg="#fcfbf2"
      title={`hours on ${goal.name}`}
      badge={<span style={badgeStyle('#dcecc9', '#3a5a29')}><Icon name="clock" size={16} strokeWidth={2.6} /></span>}
    >
      <div style={fieldLabel}>how many hours today?</div>
      <input
        type="number"
        min={0}
        max={24}
        step={0.25}
        value={value}
        onChange={e => setValue(e.target.value)}
        aria-label="hours today"
        autoFocus
        style={fieldInput}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
        {[0.5, 1, 1.5, 2, 3, 4].map(h => (
          <button key={h} type="button" onClick={() => setValue(String(h))} style={{ ...chipStyle('#fffdfa', '#3a5a29'), height: 38, padding: '0 13px', fontSize: 13.5 }}>
            {h} hrs
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" onClick={() => onSave(0)} style={cancelBtnStyle}>clear</button>
        <button type="button" onClick={() => onSave(Number(value) || 0)} style={primaryBtnStyle('#8fae74', '#fffdfa')}>save</button>
      </div>
    </Sheet>
  );
}

// ---------------------------------------------------------------- budget

interface BudgetSheetProps {
  scope: Scope;
  amount: number;
  saving: number;
  currency: string;
  onClose: () => void;
  onSave: (scope: Scope, amount: number, saving: number) => void;
}

const SCOPES: [Scope, string][] = [['day', 'day'], ['week', 'week'], ['month', 'month']];

export function BudgetSettingsSheet({ scope, amount, saving, currency, onClose, onSave }: BudgetSheetProps) {
  const [sc, setSc] = useState<Scope>(scope);
  const [amt, setAmt] = useState(String(amount || ''));
  const [sav, setSav] = useState(String(saving || ''));

  const a = Number(amt) || 0;
  const perDay = sc === 'day' ? a : sc === 'week' ? a / 7 : a / 30;

  return (
    <Sheet
      onClose={onClose}
      bg="#f9f7ff"
      title="how do you budget?"
      titleColor="#463668"
      badge={<SectionIcon slot="budget" size={32} strokeWidth={2.6} style={{ filter: 'drop-shadow(1px 2px 0 rgba(80,26,18,.3))' }} />}
    >
      <div style={fieldLabel}>i plan by</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {SCOPES.map(([k, label]) => (
          <button key={k} type="button" onClick={() => setSc(k)} aria-pressed={sc === k} style={scopeBtnStyle(sc === k)}>{label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={fieldLabel}>amount a {sc}</div>
          <input type="number" min={0} inputMode="decimal" value={amt} onChange={e => setAmt(e.target.value)} placeholder="0" aria-label={`amount a ${sc}`} style={fieldInputCompact} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={fieldLabel}>saving goal</div>
          <input type="number" min={0} inputMode="decimal" value={sav} onChange={e => setSav(e.target.value)} placeholder="0" aria-label="saving goal" style={fieldInputCompact} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', borderRadius: 20, background: '#e2dcf2', border: `3px solid ${INK}`, marginBottom: 15 }}>
        <span style={badgeStyle('#fffdfa', '#463668')}><Icon name="check" size={15} strokeWidth={3} /></span>
        <div>
          <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 16, lineHeight: 1.2, color: '#5c4a80' }}>that works out to</div>
          <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 14.5, lineHeight: 1.4, color: '#2f2350' }}>
            {money(perDay, currency)} a day · {money(perDay * 7, currency)} a week · {money(perDay * 30, currency)} a month
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" onClick={onClose} style={cancelBtnStyle}>cancel</button>
        <button type="button" onClick={() => onSave(sc, a, Number(sav) || 0)} style={primaryBtnStyle('#b9a9e0', '#2f2350')}>save it</button>
      </div>
    </Sheet>
  );
}

// ---------------------------------------------------------------- note

interface NoteNameProps {
  /** Existing title when renaming; empty when creating. */
  initial?: string;
  onClose: () => void;
  onSave: (title: string, kind: NoteKind) => void;
}

/** Names a note, whether it is being created or renamed. */
export function NoteNameSheet({ initial = '', onClose, onSave }: NoteNameProps) {
  const [title, setTitle] = useState(initial);
  const [kind, setKind] = useState<NoteKind>('page');
  const renaming = initial.length > 0;

  return (
    <Sheet
      onClose={onClose}
      bg="#fffdf7"
      title={renaming ? 'rename this note' : 'name the note'}
      badge={<SectionIcon slot="notes" size={32} strokeWidth={2.6} style={{ filter: 'drop-shadow(1px 2px 0 rgba(80,26,18,.3))' }} />}
    >
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && title.trim()) onSave(title, kind); }}
        placeholder="e.g. monthly rent · resolutions"
        aria-label="note name"
        autoFocus
        style={fieldInput}
      />
      {!renaming && (
        <>
          <div style={fieldLabel}>what kind?</div>
          <div style={{ display: 'flex', gap: 9, marginBottom: 16 }}>
            <button type="button" onClick={() => setKind('page')} aria-pressed={kind === 'page'} style={kindBtn(kind === 'page')}>
              <Icon name="note" size={17} strokeWidth={2.6} />
              <span>
                <span style={{ display: 'block', fontSize: 14 }}>page</span>
                <span style={{ display: 'block', fontFamily: FONT.hand, fontSize: 13.5, opacity: 0.8 }}>write and tick</span>
              </span>
            </button>
            <button type="button" onClick={() => setKind('board')} aria-pressed={kind === 'board'} style={kindBtn(kind === 'board')}>
              <Icon name="board" size={17} strokeWidth={2.6} />
              <span>
                <span style={{ display: 'block', fontSize: 14 }}>board</span>
                <span style={{ display: 'block', fontFamily: FONT.hand, fontSize: 13.5, opacity: 0.8 }}>sticky notes</span>
              </span>
            </button>
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" onClick={onClose} style={cancelBtnStyle}>cancel</button>
        <button
          type="button"
          onClick={() => onSave(title, kind)}
          disabled={!title.trim()}
          style={{ ...primaryBtnStyle('#e8b13a', '#5a2f28'), opacity: title.trim() ? 1 : 0.5 }}
        >
          {renaming ? 'save' : 'make it'}
        </button>
      </div>
    </Sheet>
  );
}

// ---------------------------------------------------------------- period

interface PeriodSheetProps {
  period: PeriodEntry | null;
  today: string;
  onClose: () => void;
  onSave: (start: string, end: string | null) => void;
  onDelete?: () => void;
}

export function PeriodSheet({ period, today, onClose, onSave, onDelete }: PeriodSheetProps) {
  const [start, setStart] = useState(period?.start ?? today);
  const [end, setEnd] = useState(period?.end ?? '');

  return (
    <Sheet
      onClose={onClose}
      bg="#fff6f9"
      title={period ? 'edit this period' : 'log a period'}
      titleColor="#98305a"
      badge={<SectionIcon slot="cycle" size={32} strokeWidth={2.6} style={{ filter: 'drop-shadow(1px 2px 0 rgba(80,26,18,.3))' }} />}
    >
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={fieldLabel}>started</div>
          <input type="date" value={start} max={today} onChange={e => setStart(e.target.value)} aria-label="start date" style={fieldInputCompact} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={fieldLabel}>ended</div>
          <input type="date" value={end} min={start} onChange={e => setEnd(e.target.value)} aria-label="end date" style={fieldInputCompact} />
        </div>
      </div>

      <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 15.5, color: '#b5597e', marginBottom: 15 }}>
        {end ? `${prettyFull(start)} → ${prettyFull(end)}` : 'leave the end blank if it is still going'}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {period && onDelete ? <DeleteButton label="delete this period" onClick={onDelete} /> : null}
        <button type="button" onClick={onClose} style={cancelBtnStyle}>cancel</button>
        <button type="button" onClick={() => onSave(start, end || null)} style={primaryBtnStyle('#ef7a9b', '#4d112c')}>save</button>
      </div>
    </Sheet>
  );
}

function kindBtn(on: boolean): React.CSSProperties {
  return {
    flex: 1,
    display: 'flex', alignItems: 'center', gap: 9,
    padding: '11px 12px', borderRadius: 16, textAlign: 'left',
    background: on ? '#ffe6b3' : '#fffdfa',
    border: `3px solid ${INK}`,
    color: on ? '#7a5312' : '#a8776c',
    boxShadow: on ? '2px 3px 0 rgba(80,26,18,.4)' : 'none',
    fontFamily: FONT.display, fontWeight: 700,
  };
}
