'use client';

import { FONT, INK } from '@/lib/constants';
import { addDays } from '@/lib/date';
import { money, perDayBudget, spentOn, tasksForDate, type CycleMark } from '@/lib/logic';
import { chipStyle, dashedFooterStyle, rowShell, shadowRow } from '@/lib/style';
import type { PersistedData } from '@/lib/types';
import { Icon } from '../icons/Icon';
import { SectionIcon } from '../icons/SectionIcon';
import { TaskRow } from '../TaskRow';
import { DeleteButton, EmptyState, IconButton, SectionLabel } from '../ui/primitives';

interface Props {
  data: PersistedData;
  date: string;
  today: string;
  mark: CycleMark | undefined;
  /** A task to mark and scroll to — the one a tapped reminder was for. */
  focusTaskId?: string | null;
  onToggleTask: (id: string, date: string) => void;
  onEditTask: (id: string) => void;
  onDeleteTask: (id: string, date: string) => void;
  onMoveTask: (id: string, dir: -1 | 1) => void;
  onChangeDate: (date: string) => void;
  onAddTask: () => void;
  onStartPeriod: () => void;
  onEndPeriod: () => void;
  onClearPeriod: () => void;
  onDeleteSpend: (id: string) => void;
}

export function DayScreen(props: Props) {
  const { data, date, mark } = props;
  const dayTasks = tasksForDate(data.tasks, date);
  const daySpends = data.spends.filter(s => s.date === date);
  const spent = spentOn(data.spends, date);
  const perDay = perDayBudget(data.budget);
  const dayNotes = data.budgetNotes.filter(n => n.date === date);
  const currency = data.settings.currency;
  // This screen shows the artwork behind it, unlike the paper tab screens, so its cards follow the transparency setting too.
  const alpha = data.settings.cardOpacity;

  const isStart = data.periods.some(p => p.start === date);
  const isEnd = data.periods.some(p => p.end === date);

  return (
    <>
      {/* Step through days without going back to the calendar first. The date
          field doubles as a jump to anywhere, using the OS picker. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <IconButton icon="chevronLeft" label="previous day" onClick={() => props.onChangeDate(addDays(date, -1))} bg="#ffe0c2" color="#8a3f31" size={42} iconSize={18} />
        <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
          <input
            type="date"
            value={date}
            onChange={e => { if (e.target.value) props.onChangeDate(e.target.value); }}
            aria-label="jump to a date"
            style={{
              width: '100%', height: 42, borderRadius: 15, border: `3px solid ${INK}`,
              background: '#fffdfa', padding: '0 10px', textAlign: 'center',
              fontFamily: FONT.body, fontWeight: 800, fontSize: 14, color: '#5a2f28', outline: 'none',
            }}
          />
        </div>
        <IconButton icon="chevronRight" label="next day" onClick={() => props.onChangeDate(addDays(date, 1))} bg="#ffe0c2" color="#8a3f31" size={42} iconSize={18} />
      </div>

      {date !== props.today && (
        <button
          type="button"
          onClick={() => props.onChangeDate(props.today)}
          style={{ ...chipStyle('#ffd2cb', '#8f2c20'), height: 34, padding: '0 12px', marginBottom: 14 }}
        >
          back to today
        </button>
      )}

      <SectionLabel>things on this day</SectionLabel>
      {dayTasks.length > 1 && (
        <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 15, color: '#a8776c', marginTop: -4, marginBottom: 8 }}>
          the one on top gives this day its colour in the calendar
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 8 }}>
        {dayTasks.map((t, i) => (
          <TaskRow
            key={t.id}
            task={t}
            alpha={alpha}
            focused={t.id === props.focusTaskId}
            onToggle={props.onToggleTask}
            onEdit={props.onEditTask}
            onDelete={props.onDeleteTask}
            onMove={dayTasks.length > 1 ? props.onMoveTask : undefined}
            canMoveUp={i > 0}
            canMoveDown={i < dayTasks.length - 1}
          />
        ))}
        {dayTasks.length === 0 && <EmptyState title="nothing here yet" hint="add something to this day" />}
      </div>

      <button type="button" onClick={props.onAddTask} style={dashedFooterStyle('#8a4032', 8)}>
        <Icon name="plus" size={17} strokeWidth={3} />add to this day
      </button>

      {data.settings.sections.budget && perDay > 0 && (
        <>
          <SectionLabel color="#6b5a8f">spending</SectionLabel>
          <div style={{ borderRadius: 22, padding: 14, ...rowShell(alpha, '247,245,255'), border: `3px solid ${INK}`, boxShadow: shadowRow, marginBottom: 10 }}>
            <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 17, lineHeight: 1.2, color: '#403060' }}>
              {spent > 0 ? `${money(spent, currency)} spent` : 'nothing logged'}
            </div>
            <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 15, lineHeight: 1.25, color: '#7a6a9c' }}>
              {spent > 0
                ? spent > perDay
                  ? `${money(spent - perDay, currency)} over your daily pace`
                  : `${money(perDay - spent, currency)} under your daily pace`
                : `daily pace is ${money(perDay, currency)}`}
            </div>
          </div>
          {daySpends.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
              {daySpends.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 16, ...rowShell(alpha), border: `3px solid ${INK}` }}>
                  <div style={{ flex: 1, minWidth: 0, fontFamily: FONT.body, fontWeight: 800, fontSize: 14.5, color: '#4a3a26' }}>
                    {money(s.amount, currency)}{s.label ? ` · ${s.label}` : ''}
                  </div>
                  <DeleteButton label={`delete spend of ${money(s.amount, currency)}`} onClick={() => props.onDeleteSpend(s.id)} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {dayNotes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
          {dayNotes.map(n => (
            <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 16, ...rowShell(alpha), border: `3px solid ${INK}` }}>
              <span aria-hidden="true" style={{ width: 12, height: 12, flex: 'none', borderRadius: '50%', background: n.done ? '#8fae74' : '#b9a9e0', boxShadow: `0 0 0 2.5px ${INK}` }} />
              <div data-selectable style={{ flex: 1, minWidth: 0, fontFamily: FONT.body, fontWeight: 800, fontSize: 14, lineHeight: 1.3, color: '#4a3a26', overflowWrap: 'anywhere', textDecoration: n.done ? 'line-through' : 'none' }}>{n.text}</div>
            </div>
          ))}
        </div>
      )}

      {data.settings.sections.cycle && (
        <>
          <SectionLabel color="#b5597e">cycle on this day</SectionLabel>
          <div style={{ display: 'flex', gap: 9, marginBottom: 10 }}>
            <button type="button" onClick={props.onStartPeriod} aria-pressed={isStart} style={periodBtn(isStart)}>
              <SectionIcon slot="cycle" size={14} strokeWidth={2.6} />started here
            </button>
            <button type="button" onClick={props.onEndPeriod} aria-pressed={isEnd} style={periodBtn(isEnd)}>
              <Icon name="check" size={14} strokeWidth={2.8} />ended here
            </button>
          </div>
          {mark === 'logged' && (
            <button type="button" onClick={props.onClearPeriod} style={{ ...chipStyle('#f1e2d8', '#8f2c20'), height: 38, padding: '0 13px' }}>
              <Icon name="trash" size={13} strokeWidth={2.6} />remove this period
            </button>
          )}
          {mark === 'predicted' && (
            <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 15, color: '#b5597e' }}>
              predicted — log it to confirm
            </div>
          )}
        </>
      )}
    </>
  );
}

function periodBtn(on: boolean): React.CSSProperties {
  return {
    flex: 1,
    height: 50,
    borderRadius: 18,
    border: `3px solid ${INK}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: on ? '#ef7a9b' : '#fff6f9',
    color: on ? '#4d112c' : '#98305a',
    fontFamily: FONT.display,
    fontWeight: 700,
    fontSize: 14,
    boxShadow: '3px 4px 0 rgba(80,26,18,.4)',
  };
}
