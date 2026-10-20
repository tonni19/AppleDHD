'use client';

import { FONT, INK } from '@/lib/constants';
import { daysBetween, prettyFull, relativeDay } from '@/lib/date';
import { cycleInfo } from '@/lib/logic';
import { chipStyle, dashedFooterStyle, panel } from '@/lib/style';
import type { PeriodEntry } from '@/lib/types';
import { Icon } from '../icons/Icon';
import { SectionIcon } from '../icons/SectionIcon';
import { DeleteButton, EmptyState, IconButton, SectionLabel } from '../ui/primitives';

interface Props {
  periods: PeriodEntry[];
  cycleLength: number | null;
  today: string;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onEndOngoing: () => void;
  onSetLength: (n: number | null) => void;
}

export function CycleScreen({ periods, cycleLength, today, onAdd, onEdit, onDelete, onEndOngoing, onSetLength }: Props) {
  const info = cycleInfo(periods, cycleLength, today);
  const sorted = periods.slice().sort((a, b) => b.start.localeCompare(a.start));

  return (
    <>
      <div style={{ ...panel('#fff6f9'), marginBottom: 14 }}>
        {info.lastStart ? (
          <>
            <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 17, lineHeight: 1.2, color: '#b5597e' }}>
              {info.ongoing ? 'period ongoing' : 'next expected'}
            </div>
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 26, lineHeight: 1.2, color: '#98305a', marginBottom: 8 }}>
              {info.ongoing
                ? `day ${Math.max(1, daysBetween(info.ongoing.start, today) + 1)}`
                : info.nextStart ? relativeDay(info.nextStart, today) : '—'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {info.nextStart && !info.ongoing && (
                <span style={chipStyle('#ffd6e3', '#98305a')}>{prettyFull(info.nextStart)}</span>
              )}
              <span style={chipStyle('#fff0f5', '#b5597e')}>
                {info.length} day cycle{info.estimated ? ' · averaged' : cycleLength ? ' · set by you' : ' · default'}
              </span>
              <span style={chipStyle('#fff0f5', '#b5597e')}>~{info.duration} day period</span>
            </div>
            {info.ongoing && (
              <button
                type="button"
                onClick={onEndOngoing}
                style={{ ...chipStyle('#ef7a9b', '#4d112c'), height: 40, padding: '0 14px', fontSize: 14, marginTop: 11 }}
              >
                <Icon name="check" size={14} strokeWidth={3} />mark it ended today
              </button>
            )}
          </>
        ) : (
          <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 17, lineHeight: 1.35, color: '#b5597e' }}>
            log your first period and appledhd will start predicting the next one. two or more and it averages your own cycle length instead of guessing.
          </div>
        )}
      </div>

      <button type="button" onClick={onAdd} style={dashedFooterStyle('#98305a', 0)}>
        <Icon name="plus" size={17} strokeWidth={3} />log a period
      </button>

      <SectionLabel color="#b5597e">history</SectionLabel>

      {sorted.length === 0 ? (
        <EmptyState icon={<SectionIcon slot="cycle" size={40} />} title="nothing logged yet" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {sorted.map((p, i) => {
            const next = sorted[i + 1];
            const gap = next ? daysBetween(next.start, p.start) : null;
            const len = p.end ? daysBetween(p.start, p.end) + 1 : null;
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 18, background: '#fffdfa', border: `3px solid ${INK}`, boxShadow: '2px 3px 0 rgba(80,26,18,.25)' }}>
                <SectionIcon slot="cycle" size={30} strokeWidth={2.6} style={{ flex: 'none', filter: 'drop-shadow(1px 1px 0 rgba(80,26,18,.3))' }} />
                <button type="button" onClick={() => onEdit(p.id)} style={{ flex: 1, minWidth: 0, textAlign: 'left' }} aria-label={`edit period starting ${p.start}`}>
                  <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 14.5, lineHeight: 1.3, color: '#4a251f' }}>
                    {prettyFull(p.start)}{p.end ? ` → ${prettyFull(p.end)}` : ' → ongoing'}
                  </div>
                  <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 14.5, lineHeight: 1.25, color: '#a8776c' }}>
                    {len ? `${len} days` : 'not ended yet'}{gap ? ` · ${gap} days after the last` : ''}
                  </div>
                </button>
                <DeleteButton label={`delete period from ${p.start}`} onClick={() => onDelete(p.id)} />
              </div>
            );
          })}
        </div>
      )}

      <SectionLabel color="#b5597e">cycle length</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 18, background: '#fffdfa', border: `3px solid ${INK}` }}>
        <IconButton icon="minus" label="shorter cycle" onClick={() => onSetLength(Math.max(15, info.length - 1))} size={38} iconSize={17} bg="#fff0f5" color="#98305a" />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 19, color: '#98305a' }}>{info.length} days</div>
          <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 14, color: '#a8776c' }}>
            {cycleLength === null ? (info.estimated ? 'averaged from your history' : 'default estimate') : 'set by you'}
          </div>
        </div>
        <IconButton icon="plus" label="longer cycle" onClick={() => onSetLength(Math.min(60, info.length + 1))} size={38} iconSize={17} bg="#ffd6e3" color="#98305a" />
      </div>
      {cycleLength !== null && (
        <button type="button" onClick={() => onSetLength(null)} style={{ ...chipStyle('#f1e2d8', '#7d4d41'), height: 36, padding: '0 12px', marginTop: 9 }}>
          <Icon name="refresh" size={13} strokeWidth={2.8} />go back to averaging my history
        </button>
      )}
    </>
  );
}
