'use client';

import { useMemo } from 'react';
import { CATS, catOf, FONT, INK } from '@/lib/constants';
import { dayHeading, MONTHS, prettyFull, weekdayLabels } from '@/lib/date';
import { leadTask, monthGrid, occurrencesInRange, tasksForDate, type CycleMark } from '@/lib/logic';
import { chipStyle, rowShell } from '@/lib/style';
import type { Task, WeekStart } from '@/lib/types';
import { Icon } from '../icons/Icon';
import { TaskRow } from '../TaskRow';
import { IconButton } from '../ui/primitives';

interface Props {
  view: { y: number; m: number };
  tasks: Task[];
  cycleMap: Record<string, CycleMark>;
  /** null when nothing is open — tapping the open day closes it again. */
  selected: string | null;
  today: string;
  weekStart: WeekStart;
  alpha: number;
  onSelectDate: (key: string | null) => void;
  onChangeView: (v: { y: number; m: number }) => void;
  onToday: () => void;
  onToggleTask: (id: string, date: string) => void;
  onEditTask: (id: string) => void;
  onDeleteTask: (id: string, date: string) => void;
  onAddTask: (date: string) => void;
  onOpenDay: (date: string) => void;
}

export function CalendarCard(props: Props) {
  const { view, tasks, cycleMap, selected, today, weekStart } = props;
  const cells = useMemo(() => monthGrid(view.y, view.m, weekStart), [view.y, view.m, weekStart]);

  // Expand the visible window once — including repeating tasks — rather than
  // asking every task whether it lands on each of the 42 cells.
  const byDate = useMemo(
    () => occurrencesInRange(tasks, cells[0].key, cells[cells.length - 1].key),
    [tasks, cells],
  );

  const prev = () => props.onChangeView(view.m === 0 ? { y: view.y - 1, m: 11 } : { y: view.y, m: view.m - 1 });
  const next = () => props.onChangeView(view.m === 11 ? { y: view.y + 1, m: 0 } : { y: view.y, m: view.m + 1 });
  const viewingNow = today.startsWith(`${view.y}-${String(view.m + 1).padStart(2, '0')}`);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0, fontFamily: FONT.display, fontWeight: 700, fontSize: 19, lineHeight: 1, color: '#5a2f28' }}>
          {MONTHS[view.m]} {view.y}
        </div>
        {!viewingNow && (
          <button type="button" onClick={props.onToday} style={{ ...chipStyle('#ffd2cb', '#8f2c20'), height: 32, padding: '0 11px', fontSize: 12.5 }}>
            today
          </button>
        )}
        <IconButton icon="chevronLeft" label="previous month" onClick={prev} bg="#ffe0c2" color="#8a3f31" size={36} iconSize={16} />
        <IconButton icon="chevronRight" label="next month" onClick={next} bg="#ffe0c2" color="#8a3f31" size={36} iconSize={16} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
        {weekdayLabels(weekStart).map(d => (
          <div key={d} style={{ textAlign: 'center', fontFamily: FONT.hand, fontWeight: 400, fontSize: 15, color: '#a8776c' }}>{d}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
        {cells.map(cell => {
          const dayTasks = byDate.get(cell.key) ?? [];
          const mark = cycleMap[cell.key];
          const isSel = cell.key === selected;
          const isToday = cell.key === today;

          // The first unfinished task tints the whole cell, so reordering a day
          // decides what the month shows for it. Colour at a glance is what
          // makes the grid readable without reading it.
          const lead = leadTask(dayTasks);
          const c = lead ? catOf(lead.cat) : null;
          const allDone = dayTasks.length > 0 && !lead;

          const bg = isSel
            ? '#e0503a'
            : c ? c.soft
            : mark === 'logged' ? '#ffd6e3'
            : allDone ? '#f0eae4'
            : 'transparent';

          const fg = isSel ? '#fff6f0' : c ? c.ink : mark === 'logged' ? '#98305a' : '#5a3229';

          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => props.onSelectDate(isSel ? null : cell.key)}
              aria-label={`${prettyFull(cell.key)}${dayTasks.length ? `, ${dayTasks.length} item${dayTasks.length === 1 ? '' : 's'}` : ', nothing planned'}${isToday ? ', today' : ''}`}
              aria-current={isToday ? 'date' : undefined}
              aria-expanded={isSel}
              style={{
                position: 'relative',
                height: 44,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                borderRadius: 13,
                // Out-of-month days stay legible but recede, instead of the
                // heavy grey wash that made the old grid look noisy.
                opacity: cell.inMonth ? 1 : 0.3,
                background: bg,
                border: isSel || (c && cell.inMonth) || mark === 'logged' ? `2.5px solid ${INK}` : '2.5px solid transparent',
              }}
            >
              {/* Cycle rides in the corner, never in the background: a day with
                  a task takes the category tint, which used to hide the cycle
                  entirely. Filled means logged, hollow means predicted. */}
              {mark && (
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute', top: 3, right: 4,
                    width: 7, height: 7, borderRadius: '50%',
                    background: mark === 'logged' ? '#ef7a9b' : 'transparent',
                    border: mark === 'logged'
                      ? `1.5px solid ${isSel ? '#fff6f0' : INK}`
                      : `2px solid ${isSel ? '#fff6f0' : '#ef7a9b'}`,
                  }}
                />
              )}

              {/* Today is ringed rather than filled — a solid brown disc sat
                  like a blot over the pastel grid. */}
              <span
                style={isToday ? {
                  width: 23, height: 23, borderRadius: '50%',
                  background: '#fffdfa',
                  border: `2.5px solid ${isSel ? '#fff6f0' : '#e0503a'}`,
                  color: '#c0392b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: FONT.body, fontWeight: 800, fontSize: 13.5,
                } : {
                  fontFamily: FONT.body, fontWeight: 800, fontSize: 14.5, color: fg,
                }}
              >
                {cell.day}
              </span>
              <span aria-hidden="true" style={{ display: 'flex', gap: 2, height: 5, alignItems: 'center' }}>
                {dayTasks.slice(0, 3).map(t => (
                  <span
                    key={t.id}
                    style={{
                      width: 4.5, height: 4.5, borderRadius: '50%',
                      background: isSel ? '#fff6f0' : t.done ? 'rgba(107,50,38,.3)' : catOf(t.cat).color,
                      boxShadow: isSel || t.done ? 'none' : `0 0 0 1.2px ${INK}`,
                    }}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      {selected
        ? <DayPanel {...props} date={selected} tasks={tasksForDate(tasks, selected)} mark={cycleMap[selected]} />
        : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, fontFamily: FONT.hand, fontWeight: 400, fontSize: 15, color: '#a8776c' }}>
            <Icon name="info" size={13} strokeWidth={2.4} />
            tap a date to peek at it
          </div>
        )}

      <Legend showCycle={Object.keys(cycleMap).length > 0} />
    </>
  );
}

// ---------------------------------------------------------------- legend

/**
 * Only the colour language, nothing else.
 *
 * An earlier version keyed all eight cell states, which buried the three that
 * actually carry meaning. Today marks itself with a filled disc and the dots
 * read as a count without being told, so neither needs a line here.
 */
function Legend({ showCycle }: { showCycle: boolean }) {
  const items: [string, string, string, string][] = [
    [CATS.mild.soft, CATS.mild.ink, CATS.mild.color, 'mild'],
    [CATS.important.soft, CATS.important.ink, CATS.important.color, 'important'],
    [CATS.vimp.soft, CATS.vimp.ink, CATS.vimp.color, 'very important'],
  ];
  if (showCycle) items.push(['#ffd6e3', '#98305a', '#ef7a9b', 'cycle']);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 11, paddingTop: 11, borderTop: '3px dotted rgba(107,50,38,.3)' }}>
      {items.map(([bg, ink, dot, label]) => (
        <span key={label} style={chipStyle(bg, ink)}>
          <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: dot, boxShadow: `0 0 0 2px ${INK}` }} />
          {label}
        </span>
      ))}
    </div>
  );
}

interface PanelProps extends Props {
  date: string;
  tasks: Task[];
  mark: CycleMark | undefined;
}

/** The drop-down that opens under the grid for whichever date is selected. */
function DayPanel({ date, tasks, mark, today, alpha, onSelectDate, onToggleTask, onEditTask, onDeleteTask, onAddTask, onOpenDay }: PanelProps) {
  const toGo = tasks.filter(t => !t.done).length;

  return (
    <div
      style={{
        marginTop: 11,
        padding: 12,
        borderRadius: 22,
        ...rowShell(alpha),
        border: `3px solid ${INK}`,
        boxShadow: '3px 4px 0 rgba(80,26,18,.3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: tasks.length ? 10 : 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 17, lineHeight: 1.15, color: '#5a2f28' }}>
            {dayHeading(date, today)}
          </div>
          <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 14.5, lineHeight: 1.2, color: '#a8776c' }}>
            {tasks.length ? (toGo ? `${toGo} still to do` : 'all done') : 'nothing planned'}
            {mark === 'logged' ? ' · cycle day' : mark === 'predicted' ? ' · cycle expected' : ''}
          </div>
        </div>
        <IconButton icon="close" label="close this day" onClick={() => onSelectDate(null)} size={34} iconSize={15} bg="#f1e2d8" />
      </div>

      {tasks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
          {tasks.slice(0, 4).map(t => (
            <TaskRow key={t.id} task={t} alpha={alpha} onToggle={onToggleTask} onEdit={onEditTask} onDelete={onDeleteTask} />
          ))}
          {tasks.length > 4 && (
            <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 15, color: '#a8776c', textAlign: 'center' }}>
              +{tasks.length - 4} more
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => onAddTask(date)}
          style={{ flex: 1, height: 44, borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: '#ffe0c2', border: `3px solid ${INK}`, boxShadow: '2px 3px 0 rgba(80,26,18,.35)', fontFamily: FONT.display, fontWeight: 700, fontSize: 14, color: '#8a3f31' }}
        >
          <Icon name="plus" size={15} strokeWidth={3} />add
        </button>
        <button
          type="button"
          onClick={() => onOpenDay(date)}
          style={{ flex: 1, height: 44, borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: '#fffdfa', border: `3px solid ${INK}`, boxShadow: '2px 3px 0 rgba(80,26,18,.25)', fontFamily: FONT.display, fontWeight: 700, fontSize: 14, color: '#7d4d41' }}
        >
          open day<Icon name="chevronRight" size={15} strokeWidth={2.8} />
        </button>
      </div>
    </div>
  );
}
