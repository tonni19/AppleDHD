'use client';

import { parseLines, progressOf } from '@/lib/checklist';
import { FONT, INK, PIN, STICKY_TINT, TONE } from '@/lib/constants';
import { atTime, countdown, pretty, relativeDay } from '@/lib/date';
import { cycleInfo, goalStats, money, perDayBudget, scopeRange, spentIn, tasksForDate, upcomingTasks, type CycleMark } from '@/lib/logic';
import type { TabName } from '@/lib/routes';
import type { StreakInfo } from '@/lib/logic';
import { cardShell, chipStyle, hexRgb, rowShell, shadowRow } from '@/lib/style';
import type { PersistedData, SectionKey } from '@/lib/types';
import { Icon } from '../icons/Icon';
import { SectionIcon } from '../icons/SectionIcon';
import { TaskRow } from '../TaskRow';
import { CalendarCard } from '../cards/CalendarCard';
import { StreakBadge } from '../streak/StreakBadge';
import { CollapsibleSection } from '../ui/CollapsibleSection';
import { ArtButton, EmptyState } from '../ui/primitives';

interface Props {
  data: PersistedData;
  today: string;
  nowMs: number;
  view: { y: number; m: number };
  selected: string | null;
  cycleMap: Record<string, CycleMark>;
  onChangeView: (v: { y: number; m: number }) => void;
  onSelectDate: (d: string | null) => void;
  onToday: () => void;
  onToggleTask: (id: string, date: string) => void;
  onEditTask: (id: string) => void;
  onDeleteTask: (id: string, date: string) => void;
  onAddTask: (date: string) => void;
  onOpenDay: (date: string) => void;
  onOpenNote: (id: string) => void;
  onTickPinned: (lineIndex: number) => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  streak: StreakInfo;
  onToggleSection: (key: SectionKey) => void;
  onGo: (tab: TabName) => void;
}

export function HomeScreen(props: Props) {
  const { data, today, nowMs, selected, view, cycleMap } = props;
  const { settings } = data;
  const alpha = settings.cardOpacity;
  const shown = settings.sections;
  const open = (k: SectionKey) => !settings.collapsed[k];

  const todayTasks = tasksForDate(data.tasks, today);
  const toGo = todayTasks.filter(t => !t.done).length;
  // The setting decides how far ahead a task can qualify; Home stays a preview
  // regardless, so only the nearest handful actually render.
  const UPCOMING_SHOWN = 6;
  const upcomingAll = upcomingTasks(data.tasks, nowMs, settings.upcomingDays);
  const upcoming = upcomingAll.slice(0, UPCOMING_SHOWN);

  const activeGoals = data.goals.filter(g => !g.archived);
  const goalsLoggedToday = activeGoals.filter(g => (g.log[today] ?? 0) > 0).length;

  const cycle = cycleInfo(data.periods, settings.cycleLength, today);
  const range = scopeRange(data.budget.scope, today, settings.weekStart);
  const budgeted = perDayBudget(data.budget) * range.days;
  const spent = spentIn(data.spends, range);
  const left = budgeted - spent;
  const spentPct = budgeted > 0 ? Math.min(100, Math.round((spent / budgeted) * 100)) : 0;

  return (
    <>
      {/* Tight gaps and no spacer element: the row has to fit a 360px-wide phone. */}
      <header style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 2, marginBottom: 15 }}>
        <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 9, padding: '6px 14px 6px 7px', borderRadius: 24, background: `rgba(255,246,240,${Math.max(0.82, alpha)})`, border: `3px solid ${INK}`, boxShadow: '3px 4px 0 rgba(80,26,18,.45)' }}>
          <SectionIcon slot="brand" size={32} style={{ margin: '-4px 0' }} />
          <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 18, lineHeight: 1, color: '#5a2f28', letterSpacing: 0.2 }}>appledhd</span>
        </div>
        {settings.streak && <span data-tour="streak" style={{ display: 'contents' }}><StreakBadge info={props.streak} /></span>}
        {/* Drawings are the buttons here, the same way the flame and the apple are. */}
        <ArtButton slot="search" label="search" onClick={props.onOpenSearch} />
        <span data-tour="settings" style={{ display: 'contents' }}>
          <ArtButton slot="settings" label="settings" onClick={props.onOpenSettings} />
        </span>
      </header>

      {shown.calendar && (
        <CollapsibleSection
          slot="calendar" tone="brand" title="calendar" alpha={alpha} tint={hexRgb(TONE.brand.bg)} tourId="calendar"
          summary={open('calendar') ? undefined : `${pretty(today)} · ${toGo} today`}
          onToggle={() => props.onToggleSection('calendar')}
          open={open('calendar')}
        >
          <CalendarCard
            view={view}
            tasks={data.tasks}
            cycleMap={cycleMap}
            selected={selected}
            today={today}
            weekStart={settings.weekStart}
            alpha={alpha}
            onSelectDate={props.onSelectDate}
            onChangeView={props.onChangeView}
            onToday={props.onToday}
            onToggleTask={props.onToggleTask}
            onEditTask={props.onEditTask}
            onDeleteTask={props.onDeleteTask}
            onAddTask={props.onAddTask}
            onOpenDay={props.onOpenDay}
          />
        </CollapsibleSection>
      )}

      {shown.today && (
        <CollapsibleSection
          slot="today" tone="today" title="today" alpha={alpha} tint={hexRgb(TONE.today.bg)} tourId="today"
          summary={open('today') ? undefined : (todayTasks.length ? `${toGo} to go` : 'nothing planned')}
          onToggle={() => props.onToggleSection('today')}
          open={open('today')}
          onOpen={() => props.onOpenDay(today)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {todayTasks.map(t => (
              <TaskRow key={t.id} task={t} alpha={alpha} onToggle={props.onToggleTask} onEdit={props.onEditTask} />
            ))}
            {todayTasks.length === 0 && (
              <EmptyState title="nothing planned" hint="tap + to add something" />
            )}
          </div>
        </CollapsibleSection>
      )}

      {(() => {
        const pinned = settings.pinnedNote ? data.lists.find(l => l.id === settings.pinnedNote) : null;
        if (!pinned) return null;
        const progress = progressOf(pinned.text, pinned.checked);
        const items = parseLines(pinned.text, pinned.checked).filter(l => l.isItem).slice(0, 5);

        return (
          <section
            aria-label={`pinned note: ${pinned.title}`}
            style={{ ...cardShell(alpha, hexRgb(TONE.notes.bg)), padding: '13px 14px 14px', marginBottom: 14 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
              <span style={{ width: 30, height: 30, flex: 'none', borderRadius: 11, background: TONE.notes.bg, border: `3px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TONE.notes.ink }}>
                <Icon name="pin" size={15} strokeWidth={2.6} />
              </span>
              <button type="button" onClick={() => props.onOpenNote(pinned.id)} style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <span style={{ display: 'block', fontFamily: FONT.display, fontWeight: 700, fontSize: 17, lineHeight: 1.2, color: '#5a2f28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pinned.title}</span>
                {progress.total > 0 && (
                  <span style={{ display: 'block', fontFamily: FONT.hand, fontWeight: 400, fontSize: 15, lineHeight: 1.25, color: '#a8776c' }}>
                    {progress.done} of {progress.total} ticked
                  </span>
                )}
              </button>
              <span aria-hidden="true" style={{ color: '#c09a86' }}><Icon name="chevronRight" size={16} strokeWidth={2.8} /></span>
            </div>

            {pinned.kind === 'board' ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {pinned.stickies.slice(0, 4).map(st => (
                  <span key={st.id} style={{ maxWidth: '100%', padding: '6px 10px', borderRadius: 12, background: STICKY_TINT[st.color % STICKY_TINT.length], border: `2.5px solid ${INK}`, fontFamily: FONT.body, fontWeight: 700, fontSize: 12.5, color: '#4a3a26', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {st.text}
                  </span>
                ))}
                {pinned.stickies.length === 0 && (
                  <span style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 15.5, color: '#a8776c' }}>empty board</span>
                )}
              </div>
            ) : items.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {items.map(line => (
                  <button
                    type="button"
                    key={line.index}
                    onClick={() => props.onTickPinned(line.index)}
                    aria-pressed={line.checked}
                    style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '8px 10px', borderRadius: 14, ...rowShell(alpha, line.checked ? '244,236,228' : '255,253,250'), border: `2.5px solid ${INK}`, textAlign: 'left', opacity: line.checked ? 0.72 : 1 }}
                  >
                    <span style={{ width: 22, height: 22, flex: 'none', borderRadius: 7, border: `2.5px solid ${INK}`, background: line.checked ? '#8fae74' : '#fffdfa', color: '#fffdfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {line.checked && <Icon name="check" size={12} strokeWidth={3.4} />}
                    </span>
                    <span style={{ flex: 1, minWidth: 0, fontFamily: FONT.body, fontWeight: 700, fontSize: 14, lineHeight: 1.3, color: '#4a3a26', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {line.label || '—'}
                    </span>
                    {line.checked && (
                      <span aria-hidden="true" style={{ position: 'absolute', left: 40, right: 10, top: '50%', height: 2, borderRadius: 2, background: 'rgba(107,50,38,.75)' }} />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 15.5, color: '#a8776c' }}>
                {pinned.text.trim() ? pinned.text.trim().split('\n')[0].slice(0, 60) : 'empty page'}
              </div>
            )}
          </section>
        );
      })()}

      {shown.upcoming && (
        <CollapsibleSection
          slot="upcoming" tone="notes" title="upcoming" alpha={alpha} tint={hexRgb(TONE.notes.bg)}
          summary={open('upcoming') ? undefined : (upcoming.length ? `next: ${upcoming[0].title}` : 'nothing ahead')}
          onToggle={() => props.onToggleSection('upcoming')}
          open={open('upcoming')}
        >
          {upcoming.length === 0 ? (
            <EmptyState title="nothing ahead" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {upcoming.map(t => {
                const ms = atTime(t.date, t.time);
                const urgent = ms - nowMs < 3 * 86400000;
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => props.onEditTask(t.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '11px 12px', borderRadius: 18, ...rowShell(alpha), border: `3px solid ${INK}`, boxShadow: shadowRow, textAlign: 'left' }}
                  >
                    <span aria-hidden="true" style={{ width: 13, height: 13, flex: 'none', borderRadius: '50%', background: TONE.today.solid, border: `3px solid ${INK}` }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontFamily: FONT.body, fontWeight: 800, fontSize: 15, lineHeight: 1.25, color: '#4a251f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                      <span style={{ display: 'block', fontFamily: FONT.hand, fontWeight: 400, fontSize: 15, lineHeight: 1.25, color: '#a8776c' }}>{relativeDay(t.date, today)}</span>
                    </span>
                    <span style={chipStyle(urgent ? '#ffd2cb' : '#f1e2d8', urgent ? '#8f2c20' : '#7d4d41')}>{countdown(ms, nowMs)}</span>
                  </button>
                );
              })}
              {upcomingAll.length > UPCOMING_SHOWN && (
                <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 15, color: '#a8776c', textAlign: 'center' }}>
                  +{upcomingAll.length - UPCOMING_SHOWN} more in the next {settings.upcomingDays} days
                </div>
              )}
            </div>
          )}
        </CollapsibleSection>
      )}

      {shown.goals && (
        <CollapsibleSection
          slot="goals" tone="goals" title="extra goals" alpha={alpha} tint={hexRgb(TONE.goals.bg)}
          summary={activeGoals.length ? `${goalsLoggedToday} of ${activeGoals.length} logged today` : 'none yet'}
          onToggle={() => props.onToggleSection('goals')}
          open={open('goals')}
          onOpen={() => props.onGo('goals')}
        >
          {activeGoals.length === 0 ? (
            <EmptyState title="no goals yet" hint="open goals to set one" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {activeGoals.slice(0, 4).map(g => {
                const s = goalStats(g, today);
                return (
                  <button
                    type="button"
                    key={g.id}
                    onClick={() => props.onGo('goals')}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 11px', borderRadius: 18, ...rowShell(alpha), border: `3px solid ${INK}`, boxShadow: shadowRow, textAlign: 'left' }}
                  >
                    <SectionIcon slot="goals" size={28} strokeWidth={2.6} style={{ flex: 'none', filter: 'drop-shadow(1px 1px 0 rgba(80,26,18,.3))' }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontFamily: FONT.body, fontWeight: 800, fontSize: 14.5, lineHeight: 1.3, color: '#4a251f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</span>
                      <span style={{ display: 'block', height: 9, borderRadius: 6, background: '#fff6f0', border: `2px solid ${INK}`, overflow: 'hidden', marginTop: 4 }}>
                        <span style={{ display: 'block', width: s.pct + '%', height: '100%', background: s.complete ? '#6ea45f' : '#8fae74' }} />
                      </span>
                    </span>
                    <span style={chipStyle(s.todayHours > 0 ? '#dcecc9' : '#f1e2d8', s.todayHours > 0 ? '#3a5a29' : '#7d4d41')}>
                      {s.todayHours > 0 ? `${s.todayHours}h` : '—'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </CollapsibleSection>
      )}

      {shown.cycle && (
        <CollapsibleSection
          slot="cycle" tone="cycle" title="menstrual cycle" alpha={alpha} tint={hexRgb(TONE.cycle.bg)}
          summary={cycle.ongoing ? `day ${cycle.dayOfCycle} · ongoing` : cycle.daysUntilNext !== null ? (cycle.daysUntilNext === 0 ? 'expected today' : `${cycle.daysUntilNext} days to next`) : 'nothing logged'}
          onToggle={() => props.onToggleSection('cycle')}
          open={open('cycle')}
          onOpen={() => props.onGo('cycle')}
        >
          {cycle.lastStart ? (
            <div style={{ padding: 12, borderRadius: 18, ...rowShell(alpha, '255,246,249'), border: `3px solid ${INK}` }}>
              <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 16, color: '#b5597e' }}>
                {cycle.ongoing ? 'period ongoing' : 'next expected'}
              </div>
              <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 22, lineHeight: 1.2, color: '#98305a', marginBottom: 7 }}>
                {cycle.ongoing ? `day ${cycle.dayOfCycle}` : cycle.nextStart ? relativeDay(cycle.nextStart, today) : '—'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <span style={chipStyle('#ffd6e3', '#98305a')}>{cycle.length} day cycle</span>
                <span style={chipStyle('#fff0f5', '#b5597e')}>~{cycle.duration} day period</span>
              </div>
            </div>
          ) : (
            <EmptyState title="nothing logged" hint="open cycle to log your first period" />
          )}
        </CollapsibleSection>
      )}

      {shown.budget && (
        <CollapsibleSection
          slot="budget" tone="budget" title="budget" alpha={alpha} tint={hexRgb(TONE.budget.bg)}
          summary={budgeted > 0 ? `${money(Math.abs(left), settings.currency)} ${left < 0 ? 'over' : 'left'} this ${data.budget.scope}` : 'not set up'}
          onToggle={() => props.onToggleSection('budget')}
          open={open('budget')}
          onOpen={() => props.onGo('budget')}
        >
          {budgeted > 0 ? (
            <div style={{ padding: 12, borderRadius: 18, ...rowShell(alpha), border: `3px solid ${INK}` }}>
              <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 15.5, color: '#6b5a8f' }}>
                {left < 0 ? 'over budget' : 'left'} this {data.budget.scope}
              </div>
              <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 24, lineHeight: 1.2, color: left < 0 ? '#8f2c20' : '#403060', marginBottom: 8 }}>
                {money(Math.abs(left), settings.currency)}
              </div>
              <div style={{ height: 12, borderRadius: 8, background: '#f1edfa', border: `2.5px solid ${INK}`, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ width: spentPct + '%', height: '100%', background: left < 0 ? '#e0503a' : spentPct > 80 ? '#e8b13a' : '#8fae74' }} />
              </div>
              <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 12.5, color: '#5b4a80' }}>
                spent {money(spent, settings.currency)} of {money(budgeted, settings.currency)}
              </div>
            </div>
          ) : (
            <EmptyState title="no budget set" hint="open budget to set one up" />
          )}
        </CollapsibleSection>
      )}

      {shown.notes && (
        <CollapsibleSection
          slot="notes" tone="notes" title="notepad" alpha={alpha} tint={hexRgb(TONE.notes.bg)}
          summary={data.lists.length ? `${data.lists.length} ${data.lists.length === 1 ? 'note' : 'notes'}` : 'none yet'}
          onToggle={() => props.onToggleSection('notes')}
          open={open('notes')}
          onOpen={() => props.onGo('notes')}
        >
          {data.lists.length === 0 ? (
            <EmptyState title="no notes yet" hint="open the notepad to start one" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.lists.slice().sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4).map((l, i) => {
                const lines = String(l.text || '').split('\n').filter(t => t.trim());
                return (
                  <button
                    type="button"
                    key={l.id}
                    onClick={() => props.onOpenNote(l.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 11px', borderRadius: 18, ...rowShell(alpha, '255,253,247'), border: `3px solid ${INK}`, boxShadow: shadowRow, textAlign: 'left' }}
                  >
                    <span aria-hidden="true" style={{ width: 13, height: 13, flex: 'none', borderRadius: '50%', background: PIN[i % PIN.length], boxShadow: `0 0 0 2.5px ${INK}` }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontFamily: FONT.display, fontWeight: 700, fontSize: 15, lineHeight: 1.25, color: '#5a2f28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</span>
                      <span style={{ display: 'block', fontFamily: FONT.hand, fontWeight: 400, fontSize: 14, lineHeight: 1.25, color: '#a8776c' }}>
                        {lines.length ? `${lines.length} ${lines.length === 1 ? 'line' : 'lines'}` : 'empty page'}
                      </span>
                    </span>
                    <span aria-hidden="true" style={{ color: '#c09a86' }}><Icon name="chevronRight" size={15} strokeWidth={2.8} /></span>
                  </button>
                );
              })}
            </div>
          )}
        </CollapsibleSection>
      )}
    </>
  );
}
