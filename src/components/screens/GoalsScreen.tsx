'use client';

import { FONT, INK } from '@/lib/constants';
import { addDays, parseISO, pretty } from '@/lib/date';
import { goalStats, round1 } from '@/lib/logic';
import { chipStyle, dashedFooterStyle, heading } from '@/lib/style';
import type { Goal } from '@/lib/types';
import { Icon } from '../icons/Icon';
import { SectionIcon } from '../icons/SectionIcon';
import { DeleteButton, EmptyState, IconButton } from '../ui/primitives';

interface Props {
  goals: Goal[];
  today: string;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onNudge: (id: string, delta: number) => void;
  onSetHours: (id: string) => void;
  onArchive: (id: string, archived: boolean) => void;
}

export function GoalsScreen({ goals, today, onAdd, onEdit, onDelete, onNudge, onSetHours, onArchive }: Props) {
  const active = goals.filter(g => !g.archived);
  const archived = goals.filter(g => g.archived);

  return (
    <>
      {active.length === 0 && archived.length === 0 && (
        <EmptyState
          icon={<SectionIcon slot="goals" size={44} />}
          title="no goals yet"
          hint="set something you want to chip away at — so many hours a day, over so many days."
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {active.map(g => (
          <GoalCard
            key={g.id}
            goal={g}
            today={today}
            onEdit={onEdit}
            onDelete={onDelete}
            onNudge={onNudge}
            onSetHours={onSetHours}
            onArchive={onArchive}
          />
        ))}
      </div>

      <button type="button" onClick={onAdd} style={dashedFooterStyle('#3a5a29', active.length ? 14 : 18)}>
        <Icon name="plus" size={17} strokeWidth={3} />new goal
      </button>

      {archived.length > 0 && (
        <>
          <div style={{ ...heading, fontSize: 17, margin: '22px 0 10px', color: '#8a5f56' }}>finished</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {archived.map(g => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 18, background: '#f6efe8', border: `3px solid ${INK}`, opacity: 0.85 }}>
                <div style={{ flex: 1, minWidth: 0, fontFamily: FONT.body, fontWeight: 800, fontSize: 14.5, color: '#6b4a3f', textDecoration: 'line-through' }}>{g.name}</div>
                <IconButton icon="refresh" label={`restore ${g.name}`} onClick={() => onArchive(g.id, false)} size={36} iconSize={16} bg="#dcecc9" color="#3a5a29" />
                <DeleteButton label={`delete ${g.name}`} onClick={() => onDelete(g.id)} />
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

interface CardProps {
  goal: Goal;
  today: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onNudge: (id: string, delta: number) => void;
  onSetHours: (id: string) => void;
  onArchive: (id: string, archived: boolean) => void;
}

function GoalCard({ goal, today, onEdit, onDelete, onNudge, onSetHours, onArchive }: CardProps) {
  const s = goalStats(goal, today);
  const behind = s.hoursDone < s.expectedByNow - 0.01;

  return (
    <article style={{ padding: 14, borderRadius: 24, background: '#fffdfa', border: `3px solid ${INK}`, boxShadow: '3px 4px 0 rgba(80,26,18,.3)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <SectionIcon slot="goals" size={34} strokeWidth={2.6} style={{ flex: 'none', filter: 'drop-shadow(1px 2px 0 rgba(80,26,18,.3))' }} />
        <button type="button" onClick={() => onEdit(goal.id)} style={{ flex: 1, minWidth: 0, textAlign: 'left' }} aria-label={`edit ${goal.name}`}>
          <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 15.5, lineHeight: 1.25, color: '#4a251f' }}>{goal.name}</div>
          <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 15, lineHeight: 1.3, color: '#8a5f56' }}>
            {goal.perDay} hrs a day × {goal.targetD} days · {s.targetHours} hrs total
          </div>
        </button>
        <DeleteButton label={`delete ${goal.name}`} onClick={() => onDelete(goal.id)} />
      </div>

      {/* Today's hours — the control the old tick-only card could not express. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', borderRadius: 18, background: s.todayHours > 0 ? '#eef6e4' : '#fff6f0', border: `3px solid ${INK}`, marginBottom: 11 }}>
        <IconButton icon="minus" label={`log an hour less on ${goal.name}`} onClick={() => onNudge(goal.id, -0.5)} size={38} iconSize={17} bg="#fffdfa" color="#7d4d41" />
        <button type="button" onClick={() => onSetHours(goal.id)} style={{ flex: 1, minWidth: 0, textAlign: 'center' }} aria-label={`set exact hours for ${goal.name} today`}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 19, lineHeight: 1.1, color: s.todayHours > 0 ? '#3a5a29' : '#8a5f56' }}>
            {s.todayHours > 0 ? `${s.todayHours} hrs today` : 'nothing logged today'}
          </div>
          <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 14, color: '#a8776c' }}>tap to type an exact amount</div>
        </button>
        <IconButton icon="plus" label={`log half an hour more on ${goal.name}`} onClick={() => onNudge(goal.id, 0.5)} size={38} iconSize={17} bg="#dcecc9" color="#3a5a29" />
      </div>

      <div style={{ height: 14, borderRadius: 9, background: '#fff6f0', border: `3px solid ${INK}`, overflow: 'hidden' }}>
        <div style={{ width: s.pct + '%', height: '100%', background: s.complete ? '#6ea45f' : behind ? '#e8b13a' : '#8fae74', borderRight: s.pct > 0 && s.pct < 100 ? `3px solid ${INK}` : 'none', transition: 'width .35s ease' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 8 }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 12.5, color: '#3a5a29' }}>
          {s.hoursDone} / {s.targetHours} hrs · {s.daysDone} days
        </div>
        <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 15, color: '#a8776c' }}>
          finish by {pretty(s.finishBy)}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 10 }}>
        {s.complete ? (
          <span style={chipStyle('#dcecc9', '#3a5a29')}><Icon name="check" size={12} strokeWidth={3.2} />done</span>
        ) : (
          <span style={chipStyle(behind ? '#ffe6b3' : '#dcecc9', behind ? '#7a5312' : '#3a5a29')}>
            {behind ? `${round1(s.expectedByNow - s.hoursDone)} hrs behind` : 'on track'}
          </span>
        )}
        <div style={{ flex: 1 }} />
        <button type="button" onClick={() => onArchive(goal.id, true)} style={{ ...chipStyle('#f1e2d8', '#7d4d41'), height: 30 }}>
          mark finished
        </button>
      </div>

      <WeekStrip goal={goal} today={today} />
    </article>
  );
}

/** Last 7 days at a glance, so progress reads as a habit rather than a number. */
function WeekStrip({ goal, today }: { goal: Goal; today: string }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  return (
    <div style={{ display: 'flex', gap: 5, marginTop: 11, paddingTop: 11, borderTop: '3px dotted rgba(107,50,38,.3)' }}>
      {days.map(d => {
        const hrs = goal.log[d] ?? 0;
        const ratio = goal.perDay > 0 ? Math.min(1, hrs / goal.perDay) : 0;
        return (
          <div key={d} style={{ flex: 1, textAlign: 'center' }}>
            <div
              title={`${d}: ${hrs} hrs`}
              style={{
                height: 26, borderRadius: 8, border: `2.5px solid ${INK}`,
                background: hrs > 0 ? `rgba(143,174,116,${0.35 + ratio * 0.65})` : '#fff6f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: FONT.body, fontWeight: 800, fontSize: 10.5, color: hrs > 0 ? '#2f4a22' : '#c0a294',
              }}
            >
              {hrs > 0 ? hrs : ''}
            </div>
            <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 12, color: d === today ? '#8f2c20' : '#a8776c', marginTop: 2 }}>
              {d === today ? 'today' : parseISO(d).getDate()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
