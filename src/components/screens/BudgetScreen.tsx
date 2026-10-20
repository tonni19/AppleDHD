'use client';

import { FONT, INK } from '@/lib/constants';
import { relativeDay } from '@/lib/date';
import { calcTotal, elapsedInRange, money, perDayBudget, scopeRange, spentIn } from '@/lib/logic';
import { calcKeyStyle, chipStyle, dashedFooterStyle, panel, scopeBtnStyle, shadowInner } from '@/lib/style';
import type { PersistedData, Scope } from '@/lib/types';
import { Icon } from '../icons/Icon';
import { SectionIcon } from '../icons/SectionIcon';
import { DeleteButton, EmptyState, IconButton, SectionLabel } from '../ui/primitives';

interface Props {
  data: PersistedData;
  today: string;
  viewScope: Scope;
  calc: string;
  spendLabel: string;
  noteDraft: string;
  onSetViewScope: (s: Scope) => void;
  onPressCalc: (ch: string) => void;
  onClearCalc: () => void;
  onBackspaceCalc: () => void;
  onSetSpendLabel: (v: string) => void;
  onLogSpend: () => void;
  onClearDoneNotes: () => void;
  onDeleteSpend: (id: string) => void;
  onSetNoteDraft: (v: string) => void;
  onAddNote: () => void;
  onToggleNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onOpenSettings: () => void;
  onReset: () => void;
}

const SCOPES: [Scope, string][] = [['day', 'today'], ['week', 'this week'], ['month', 'this month']];
const KEYS = ['7', '8', '9', 'C', '4', '5', '6', '+', '1', '2', '3', '−', '0', '.', '00', '⌫'];

export function BudgetScreen(props: Props) {
  const { data, today, viewScope, calc, spendLabel, noteDraft } = props;
  const { settings, budget, spends, budgetNotes } = data;
  const currency = settings.currency;

  const perDay = perDayBudget(budget);
  const range = scopeRange(viewScope, today, settings.weekStart);
  const scopeBudget = perDay * range.days;
  const scopeSpent = spentIn(spends, range);
  const left = scopeBudget - scopeSpent;
  const over = left < 0;
  const spentPct = scopeBudget > 0 ? Math.min(100, Math.round((scopeSpent / scopeBudget) * 100)) : 0;
  const calcVal = calcTotal(calc);

  // Pace is measured against the scope on screen, not always the month.
  const elapsed = elapsedInRange(range, today);
  const paceTarget = perDay * elapsed;
  const underPace = paceTarget - scopeSpent;

  const recent = spends.slice().sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 8);
  const notes = budgetNotes.slice().sort((a, b) => b.date.localeCompare(a.date));

  if (scopeBudget <= 0) {
    return (
      <EmptyState
        icon={<SectionIcon slot="budget" size={44} />}
        title="no budget set"
        hint="tell appledhd how much you plan to spend and it will track the rest."
        action={
          <button type="button" onClick={props.onOpenSettings} style={{ ...chipStyle('#b9a9e0', '#2f2350'), height: 44, padding: '0 16px', fontSize: 15 }}>
            <Icon name="plus" size={15} strokeWidth={3} />set a budget
          </button>
        }
      />
    );
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 7, marginBottom: 13 }}>
        {SCOPES.map(([k, label]) => (
          <button key={k} type="button" onClick={() => props.onSetViewScope(k)} style={scopeBtnStyle(viewScope === k)} aria-pressed={viewScope === k}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ ...panel('#fffdfa'), marginBottom: 12 }}>
        <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 16, lineHeight: 1.2, color: '#6b5a8f' }}>
          {over ? 'over budget' : 'left'} {viewScope === 'day' ? 'today' : viewScope === 'week' ? 'this week' : 'this month'}
        </div>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 30, lineHeight: 1.15, color: over ? '#8f2c20' : '#403060', marginBottom: 9 }}>
          {money(Math.abs(left), currency)}
        </div>
        <div style={{ height: 14, borderRadius: 9, background: '#f1edfa', border: `3px solid ${INK}`, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ width: spentPct + '%', height: '100%', background: over ? '#e0503a' : spentPct > 80 ? '#e8b13a' : '#8fae74', borderRight: spentPct > 0 && spentPct < 100 ? `3px solid ${INK}` : 'none', transition: 'width .35s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 12.5, color: '#5b4a80' }}>spent {money(scopeSpent, currency)}</span>
          <span style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 15, color: '#7a6a9c' }}>of {money(scopeBudget, currency)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 13px', borderRadius: 20, background: underPace >= 0 ? '#dcecc9' : '#ffe6b3', border: `3px solid ${INK}`, marginBottom: 14 }}>
        <span style={{ width: 32, height: 32, flex: 'none', borderRadius: '50%', background: '#fffdfa', border: `3px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: underPace >= 0 ? '#3a5a29' : '#7a5312' }}>
          <Icon name={underPace >= 0 ? 'leaf' : 'info'} size={15} strokeWidth={2.6} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 16, lineHeight: 1.2, color: underPace >= 0 ? '#3a5a29' : '#7a5312' }}>
            {elapsed} of {range.days} days in
          </div>
          <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 14, lineHeight: 1.35, color: underPace >= 0 ? '#2f4a22' : '#6b4710' }}>
            {underPace >= 0
              ? `${money(underPace, currency)} under your pace`
              : `${money(-underPace, currency)} ahead of your pace`}
            {budget.saving > 0 ? ` · saving goal ${money(budget.saving, currency)}` : ''}
          </div>
        </div>
      </div>

      <SectionLabel color="#6b5a8f">what did you spend?</SectionLabel>
      <div style={{ padding: '12px 13px', borderRadius: 20, background: '#fffdfa', border: `3px solid ${INK}`, marginBottom: 10 }}>
        <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 15, lineHeight: 1.3, color: '#7a6a9c', minHeight: 20, wordBreak: 'break-all' }}>
          {calc ? calc.replace(/-/g, ' − ').replace(/\+/g, ' + ') : 'tap the numbers — 40+25+15'}
        </div>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 26, lineHeight: 1.2, color: '#403060' }}>{money(calcVal, currency)}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 7, marginBottom: 10 }}>
        {KEYS.map(k => {
          const kind = k === 'C' ? 'clear' : k === '+' || k === '−' ? 'op' : 'num';
          const label = k === '⌫' ? 'backspace' : k === 'C' ? 'clear' : k === '−' ? 'minus' : k === '+' ? 'plus' : k;
          const onClick = k === 'C' ? props.onClearCalc
            : k === '⌫' ? props.onBackspaceCalc
            : k === '−' ? () => props.onPressCalc('-')
            : () => props.onPressCalc(k);
          return (
            <button key={k} type="button" onClick={onClick} aria-label={label} style={calcKeyStyle(kind)}>
              {k === '⌫' ? <Icon name="backspace" size={19} strokeWidth={2.6} /> : k}
            </button>
          );
        })}
      </div>

      <input
        value={spendLabel}
        onChange={e => props.onSetSpendLabel(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && calcVal > 0) props.onLogSpend(); }}
        placeholder="what was it for? (optional)"
        aria-label="what the spending was for"
        style={{
          width: '100%', height: 48, borderRadius: 18, border: `3px solid ${INK}`,
          background: '#fffdfa', padding: '0 14px', marginBottom: 10,
          fontFamily: FONT.body, fontWeight: 700, fontSize: 15, color: '#4a251f', outline: 'none',
        }}
      />

      <button
        type="button"
        onClick={props.onLogSpend}
        disabled={calcVal <= 0}
        style={{
          width: '100%', height: 52, borderRadius: 18, background: calcVal > 0 ? '#b9a9e0' : '#ece7f6',
          border: `3px solid ${INK}`, boxShadow: '3px 4px 0 rgba(80,26,18,.45)',
          fontFamily: FONT.display, fontWeight: 700, fontSize: 16, color: calcVal > 0 ? '#2f2350' : '#9b8fb8', marginBottom: 16,
        }}
      >
        {calcVal > 0 ? `log ${money(calcVal, currency)} for today` : 'log spending'}
      </button>

      <SectionLabel color="#6b5a8f">recent spending</SectionLabel>
      {recent.length === 0 ? (
        <EmptyState title="nothing logged yet" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recent.map(sp => {
            const ratio = perDay > 0 ? sp.amount / perDay : 1;
            const col = ratio <= 0.7 ? '#6ea45f' : ratio <= 1 ? '#e8b13a' : '#e0503a';
            return (
              <div key={sp.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 18, background: '#fffdfa', border: `3px solid ${INK}`, boxShadow: shadowInner }}>
                <span aria-hidden="true" style={{ width: 12, height: 12, flex: 'none', borderRadius: '50%', background: col, boxShadow: `0 0 0 2.5px ${INK}` }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 14.5, color: '#4a3a26' }}>{money(sp.amount, currency)}</div>
                  <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 14, color: '#a8776c' }}>
                    {relativeDay(sp.date, today)}{sp.label ? ` · ${sp.label}` : ''}
                  </div>
                </div>
                <DeleteButton label={`delete spend of ${money(sp.amount, currency)}`} onClick={() => props.onDeleteSpend(sp.id)} />
              </div>
            );
          })}
        </div>
      )}

      <SectionLabel color="#6b5a8f">notes · to buy, bought, remember</SectionLabel>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input
          value={noteDraft}
          onChange={e => props.onSetNoteDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') props.onAddNote(); }}
          placeholder="e.g. bought bazar"
          aria-label="new budget note"
          style={{ flex: 1, minWidth: 0, height: 50, borderRadius: 18, border: `3px solid ${INK}`, background: '#fffdfa', padding: '0 14px', fontFamily: FONT.body, fontWeight: 700, fontSize: 15, color: '#4a251f', outline: 'none' }}
        />
        <IconButton icon="plus" label="add note" onClick={props.onAddNote} size={50} iconSize={20} bg="#b9a9e0" color="#2f2350" radius={18} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {notes.map(n => (
          <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 18, background: n.done ? '#f1edfa' : '#fffdfa', border: `3px solid ${INK}`, boxShadow: shadowInner, opacity: n.done ? 0.75 : 1 }}>
            <button
              type="button"
              onClick={() => props.onToggleNote(n.id)}
              role="checkbox"
              aria-checked={n.done}
              aria-label={`mark ${n.text} as ${n.done ? 'not done' : 'done'}`}
              style={{ width: 30, height: 30, flex: 'none', borderRadius: 10, border: `3px solid ${INK}`, background: n.done ? '#b9a9e0' : '#fffdfa', color: '#2f2350', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {n.done && <Icon name="check" size={14} strokeWidth={3.2} />}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div data-selectable style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 14.5, lineHeight: 1.3, color: '#4a3a26', overflowWrap: 'anywhere', textDecoration: n.done ? 'line-through' : 'none' }}>{n.text}</div>
              <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 14, color: '#a8776c' }}>{n.date ? relativeDay(n.date, today) : ''}</div>
            </div>
            <DeleteButton label={`delete note ${n.text}`} onClick={() => props.onDeleteNote(n.id)} />
          </div>
        ))}
        {notes.length === 0 && <EmptyState title="nothing noted yet" />}
      </div>

      {notes.some(n => n.done) && (
        <button
          type="button"
          onClick={props.onClearDoneNotes}
          style={{ ...chipStyle('#f1e2d8', '#7d4d41'), height: 38, padding: '0 13px', marginBottom: 14 }}
        >
          <Icon name="trash" size={13} strokeWidth={2.6} />clear the {notes.filter(n => n.done).length} finished
        </button>
      )}

      <button type="button" onClick={props.onOpenSettings} style={dashedFooterStyle('#5c4a80')}>
        <Icon name="pencil" size={16} strokeWidth={2.8} />budget &amp; saving goal
      </button>
      <button type="button" onClick={props.onReset} style={{ ...dashedFooterStyle('#8f2c20', 10), borderColor: 'rgba(143,44,32,.45)' }}>
        <Icon name="refresh" size={16} strokeWidth={2.8} />
        clear {viewScope === 'day' ? "today's" : viewScope === 'week' ? "this week's" : "this month's"} spending
      </button>
    </>
  );
}
