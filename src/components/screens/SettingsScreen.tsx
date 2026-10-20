'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { FONT, INK } from '@/lib/constants';
import { DOW_LONG } from '@/lib/date';
import type { StreakInfo } from '@/lib/logic';
import { allowExactReminders, exactRemindersAllowed, onAppResume } from '@/lib/native';
import { canScheduleReminders, canVibrate } from '@/lib/platform';
import { storageIsEphemeral } from '@/lib/storage';
import { chipStyle, fieldInputCompact, panel } from '@/lib/style';
import { SECTION_KEYS, SECTION_LABEL, type PersistedData, type SectionKey, type Settings, type WeekStart } from '@/lib/types';
import { Icon } from '../icons/Icon';
import { Flame, flameStateOf } from '../streak/Flame';
import { Dropdown, IconButton, SectionLabel, SettingRow, Switch } from '../ui/primitives';

/** The transparency slider tops out here, matching the least-opaque a card is allowed to go. */
const MAX_TRANSPARENCY = 60;

const WEEK_START_OPTIONS = DOW_LONG.map((day, i) => ({ value: i, label: day }));

/** How far ahead the home "upcoming" list is allowed to look. */
const UPCOMING_OPTIONS: { value: number; label: string }[] = [
  { value: 7, label: '7 days' },
  { value: 14, label: '2 weeks' },
  { value: 30, label: '30 days' },
  { value: 60, label: '2 months' },
];

interface Props {
  data: PersistedData;
  onSet: (patch: Partial<Settings>) => void;
  onToggleSection: (key: SectionKey) => void;
  onExport: () => void;
  onImport: () => void;
  onLoadSample: () => void;
  onResetAll: () => void;
  onStartTour: () => void;
  streak: StreakInfo;
}

const CURRENCIES = ['৳', '₹', '$', '€', '£', '¥', '₦', '₨'];

export function SettingsScreen({ data, onSet, onToggleSection, onExport, onImport, onLoadSample, onResetAll, onStartTour, streak }: Props) {
  const s = data.settings;
  // Framed as transparency, not solidity: dragging the slider up makes cards
  // MORE see-through, so the displayed number is the inverse of the stored
  // opacity. cardOpacity is clamped to a 0.4 floor, so 60% is as transparent
  // as a card can go — past that, body text over busy artwork stopped reading.
  const transparencyPct = Math.round((1 - s.cardOpacity) * 100);

  // Re-checked on return, since the fix happens in Android's own settings screen.
  const [exactOk, setExactOk] = useState(true);
  useEffect(() => {
    const check = () => { void exactRemindersAllowed().then(setExactOk); };
    check();
    return onAppResume(check);
  }, []);
  const fixExact = () => { void allowExactReminders().then(setExactOk); };

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <SettingRow
          title="take the tour again"
          hint="a quick walk around the app, one step at a time"
          onClick={onStartTour}
          trailing={<IconButton icon="info" label="take the tour again" onClick={onStartTour} bg="#ffe0c2" color="#8a3f31" size={38} iconSize={17} />}
        />
      </div>

      <SectionLabel>streak</SectionLabel>
      <div style={{ marginBottom: 20 }}>
        <SettingRow
          title="daily streak"
          hint={data.settings.streak
            ? `${streak.current} ${streak.current === 1 ? 'day' : 'days'} in a row · best ${streak.best}`
            : 'hidden from home — your days are still counted'}
          leading={<Flame size={20} state={data.settings.streak ? flameStateOf(streak.current, streak.activeToday) : 'out'} strokeWidth={4.2} />}
          trailing={<Switch on={data.settings.streak} onChange={v => onSet({ streak: v })} label="daily streak" />}
        />
      </div>

      <SectionLabel>sections</SectionLabel>
      <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 15.5, color: '#a8776c', marginTop: -4, marginBottom: 10 }}>
        hide what you do not use — it disappears from home and from the tab bar.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {SECTION_KEYS.map(key => (
          <SettingRow
            key={key}
            title={SECTION_LABEL[key]}
            trailing={<Switch on={s.sections[key]} onChange={() => onToggleSection(key)} label={`show ${SECTION_LABEL[key]}`} />}
          />
        ))}
      </div>

      <SectionLabel>look</SectionLabel>
      <div style={{ ...panel('#fffdfa'), marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 15, color: '#4a251f' }}>transparency</div>
            <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 14.5, color: '#a8776c' }}>
              higher shows more of the artwork through your cards
            </div>
          </div>
          <span style={chipStyle('#f1e2d8', '#7d4d41')}>{transparencyPct}%</span>
        </div>
        <input
          type="range"
          className="ap-slider"
          min={0}
          max={MAX_TRANSPARENCY}
          step={2}
          value={transparencyPct}
          onChange={e => onSet({ cardOpacity: 1 - Number(e.target.value) / 100 })}
          aria-label="transparency"
          style={{ '--pct': `${(transparencyPct / MAX_TRANSPARENCY) * 100}%` } as CSSProperties}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        <SettingRow
          title="show artwork"
          hint="turn off for a plain painted background"
          trailing={<Switch on={s.artworkEnabled} onChange={v => onSet({ artworkEnabled: v })} label="show artwork" />}
        />
        <SettingRow
          title="week starts on"
          hint="calendars and weekly totals both follow this"
          trailing={
            <Dropdown
              value={s.weekStart}
              options={WEEK_START_OPTIONS}
              onChange={v => onSet({ weekStart: v as WeekStart })}
              label="week starts on"
            />
          }
        />
      </div>

      <SectionLabel>upcoming</SectionLabel>
      <div style={{ ...panel('#fffdfa'), marginBottom: 20 }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 15, color: '#4a251f' }}>show tasks due within</div>
        <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 14.5, color: '#a8776c', marginBottom: 9 }}>
          how far ahead the upcoming list on home looks
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {UPCOMING_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSet({ upcomingDays: opt.value })}
              aria-pressed={s.upcomingDays === opt.value}
              style={chipStyle(s.upcomingDays === opt.value ? '#ffe6b3' : '#f1e2d8', s.upcomingDays === opt.value ? '#7a5312' : '#7d4d41')}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <SectionLabel>money</SectionLabel>
      <div style={{ ...panel('#fffdfa'), marginBottom: 20 }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 15, color: '#4a251f', marginBottom: 9 }}>currency</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
          {CURRENCIES.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => onSet({ currency: c })}
              aria-pressed={s.currency === c}
              style={{
                width: 46, height: 44, borderRadius: 14, border: `3px solid ${INK}`,
                background: s.currency === c ? '#b9a9e0' : '#fffdfa',
                color: s.currency === c ? '#2f2350' : '#5b4a80',
                fontFamily: FONT.display, fontWeight: 700, fontSize: 17,
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <input
          value={s.currency}
          onChange={e => onSet({ currency: e.target.value.slice(0, 3) })}
          aria-label="custom currency symbol"
          placeholder="or type your own"
          style={fieldInputCompact}
        />
      </div>

      {(canScheduleReminders() || canVibrate()) && (
        <>
          <SectionLabel>alerts</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {canScheduleReminders() && (
              <SettingRow
                title="task reminders"
                hint="only fires for tasks you give a reminder to"
                trailing={<Switch on={s.notifications} onChange={v => onSet({ notifications: v })} label="task reminders" />}
              />
            )}
            {canScheduleReminders() && s.notifications && !exactOk && (
              <SettingRow
                title="reminders on the dot"
                hint="android is letting reminders run a few minutes late. tap to allow exact timing."
                onClick={fixExact}
                trailing={<IconButton icon="clock" label="allow exact timing" onClick={fixExact} bg="#ffe6b3" color="#7a5312" size={38} iconSize={17} />}
              />
            )}
            {canVibrate() && (
              <SettingRow
                title="haptics"
                hint="a small tap when you tick something off"
                trailing={<Switch on={s.haptics} onChange={v => onSet({ haptics: v })} label="haptics" />}
              />
            )}
          </div>
        </>
      )}

      <SectionLabel>your data</SectionLabel>
      <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 15.5, color: '#a8776c', marginTop: -4, marginBottom: 10 }}>
        everything lives on this device only. keep a backup somewhere safe.
      </div>

      {/* Private browsing and blocked site data mean nothing survives the tab
          closing. For an app whose only asset is the user's own records, that
          has to be said out loud rather than discovered later. */}
      {storageIsEphemeral() && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 13px', borderRadius: 18, background: '#ffd2cb', border: `3px solid ${INK}`, marginBottom: 12 }}>
          <span style={{ flex: 'none', color: '#8f2c20', marginTop: 1 }}><Icon name="info" size={18} strokeWidth={2.6} /></span>
          <div>
            <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 14.5, lineHeight: 1.3, color: '#8f2c20' }}>
              this device is not saving anything
            </div>
            <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 15, lineHeight: 1.3, color: '#8f2c20' }}>
              private browsing, or site data is blocked. everything will be gone when you close the app — back it up first.
            </div>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        <SettingRow
          title="back up to a file"
          hint="saves every task, goal, note and record"
          onClick={onExport}
          trailing={<IconButton icon="download" label="back up" onClick={onExport} bg="#dcecc9" color="#3a5a29" size={38} iconSize={17} />}
        />
        <SettingRow
          title="restore from a backup"
          hint="replaces what is on this device"
          onClick={onImport}
          trailing={<IconButton icon="upload" label="restore" onClick={onImport} bg="#e2dcf2" color="#463668" size={38} iconSize={17} />}
        />
        <SettingRow
          title="load sample data"
          hint="fills the app with an example week to explore"
          onClick={onLoadSample}
          trailing={<IconButton icon="refresh" label="load sample data" onClick={onLoadSample} bg="#ffe6b3" color="#7a5312" size={38} iconSize={17} />}
        />
      </div>

      <button
        type="button"
        onClick={onResetAll}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          width: '100%', height: 52, borderRadius: 18,
          background: '#ffd2cb', border: `3px solid ${INK}`, boxShadow: '3px 4px 0 rgba(80,26,18,.4)',
          fontFamily: FONT.display, fontWeight: 700, fontSize: 15, color: '#8f2c20',
        }}
      >
        <Icon name="trash" size={16} strokeWidth={2.8} />erase everything
      </button>
      <div style={{ fontFamily: FONT.hand, fontWeight: 400, fontSize: 14.5, color: '#a8776c', textAlign: 'center', marginTop: 10 }}>
        appledhd · your planner, on your device
      </div>
    </>
  );
}
