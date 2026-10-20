'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as A from '@/lib/actions';
import { STICKY_TINT, TONE } from '@/lib/constants';
import { addDays, endOfMonth, prettyFull, startOfMonth } from '@/lib/date';
import { haptic } from '@/lib/feedback';
import { toggleChecked } from '@/lib/checklist';
import { calcTotal, cycleDayMap, cycleInfo, scopeRange, streakInfo, upcomingReminders } from '@/lib/logic';
import { renderListPng } from '@/lib/exportNote';
import { allowExactReminders, exactRemindersAllowed, onHardwareBack, onReminderTap, saveFile, saveImage, syncReminders, type SaveResult } from '@/lib/native';
import { deserialise, serialise } from '@/lib/persist';
import { screen, sheet, visibleTabs, TAB_SECTION, type TabName } from '@/lib/routes';
import { chipStyle } from '@/lib/style';
import { sampleData } from '@/lib/seed';
import { uid } from '@/lib/uid';
import { emptyData } from '@/lib/defaults';
import type { Draft, ListNote, Scope, SectionKey, Settings } from '@/lib/types';
import { useNav } from '@/hooks/useNav';
import { useNow } from '@/hooks/useNow';
import { useStore, type Store } from '@/hooks/useStore';
import { ArtworkLayer } from './ArtworkLayer';
import { Fab } from './Fab';
import { SectionIcon } from './icons/SectionIcon';
import { TabBar } from './TabBar';
import { Tour } from './Tour';
import { BudgetScreen } from './screens/BudgetScreen';
import { CycleScreen } from './screens/CycleScreen';
import { DayScreen } from './screens/DayScreen';
import { GoalsScreen } from './screens/GoalsScreen';
import { HomeScreen } from './screens/HomeScreen';
import { BoardScreen } from './screens/BoardScreen';
import { NoteScreen } from './screens/NoteScreen';
import { NotesScreen } from './screens/NotesScreen';
import { SearchScreen } from './screens/SearchScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { BudgetSettingsSheet, GoalSheet, HoursSheet, NoteNameSheet, PeriodSheet, TaskSheet } from './sheets/Sheets';
import { Screen, ScreenHeader } from './ui/Screen';
import { ArtButton, EmptyState, IconButton, Toast } from './ui/primitives';

interface Notice {
  message: string;
  action?: { label: string; run: () => void };
}

/** How far ahead reminders are handed to the OS. iOS caps pending notifications, so this stays modest. */
const REMINDER_HORIZON_DAYS = 30;

const emptyDraft = (date: string): Draft => ({ id: null, repeat: null, title: '', cat: 'mild', date, time: '09:00', note: '', remind: null });

export function AppShell() {
  const { today, now } = useNow();
  const store = useStore();
  const nav = useNav();
  const { data } = store;
  // Preferences change how the app looks, not what you did, so they leave the streak alone.
  const updateQuiet = store.update;

  // ---- session-only state (never persisted) ---------------------------
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState(() => ({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 }));
  const [viewScope, setViewScope] = useState<Scope>('week');
  const [calc, setCalc] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [spendLabel, setSpendLabel] = useState('');
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(today));
  // One-off confirmations that are not undoable, like a file being saved. Some
  // carry a single action, such as opening a system setting.
  const [notice, setNotice] = useState<Notice | null>(null);
  // The task a tapped reminder was for, marked on its day for a few seconds.
  const [focusTask, setFocusTask] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const cycle = useMemo(
    () => cycleInfo(data.periods, data.settings.cycleLength, today),
    [data.periods, data.settings.cycleLength, today],
  );

  // Only the visible month plus a margin needs cycle shading. Turning the
  // section off empties the map at the source, so the calendar dots, the legend
  // entry, the day panel's caption and the day screen all go quiet together —
  // no consumer has to remember to check the setting for itself.
  const cycleMap = useMemo(
    () => (data.settings.sections.cycle
      ? cycleDayMap(
        data.periods,
        cycle,
        today,
        addDays(startOfMonth(`${view.y}-${String(view.m + 1).padStart(2, '0')}-01`), -7),
        addDays(endOfMonth(`${view.y}-${String(view.m + 1).padStart(2, '0')}-01`), 14),
      )
      : {}),
    [data.settings.sections.cycle, data.periods, cycle, today, view.y, view.m],
  );

  const tabs = useMemo(() => visibleTabs(data.settings.sections), [data.settings.sections]);

  const streak = useMemo(() => streakInfo(data.activeDays, today), [data.activeDays, today]);

  // Anything done in the app counts toward today's streak — adding, ticking,
  // editing or deleting — and the badge updates the moment it happens. Opening
  // the app alone does not count.
  const storeUpdate = store.update;
  const update = useCallback<Store['update']>(
    (fn, undoLabel) => storeUpdate(d => {
      const next = fn(d);
      return next === d ? d : A.markActive(next, today);
    }, undoLabel),
    [storeUpdate, today],
  );

  // ---- helpers ---------------------------------------------------------
  const openDay = useCallback((date: string) => {
    setSelected(date);
    nav.push(screen('day', date));
  }, [nav]);

  const goTab = useCallback((tab: TabName) => nav.push(screen(tab)), [nav]);


  const openTaskSheet = useCallback((id: string | null, date: string) => {
    const existing = id ? data.tasks.find(t => t.id === id) : null;
    setDraft(existing
      ? { id: existing.id, repeat: existing.repeat, title: existing.title, cat: existing.cat, date: existing.date, time: existing.time, note: existing.note ?? '', remind: existing.remind }
      : emptyDraft(date));
    nav.push(sheet('addTask', id ?? undefined));
  }, [data.tasks, nav]);

  const saveTask = useCallback(() => {
    if (!draft.title.trim()) { nav.pop(); return; }
    if (draft.id) update(d => A.updateTask(d, draft.id as string, draft));
    else update(d => A.addTask(d, uid(), draft, today));
    // The moment someone sets a reminder is the moment to say if Android will hold it back.
    if (draft.remind !== null && data.settings.notifications) {
      void exactRemindersAllowed().then(ok => {
        if (!ok) setNotice({ message: 'reminders may arrive a few minutes late', action: { label: 'fix', run: () => { void allowExactReminders(); } } });
      });
    }
    setSelected(draft.date);
    setView({ y: Number(draft.date.slice(0, 4)), m: Number(draft.date.slice(5, 7)) - 1 });
    nav.pop();
  }, [draft, update, today, nav, data.settings.notifications]);

  const announceSaved = useCallback((result: SaveResult, what: string) => {
    if (result.kind === 'shared') setNotice({ message: `${what} shared` });
    else if (result.kind === 'fallback') setNotice({ message: `${what} saved to ${result.folder} — gallery failed: ${result.reason}` });
    else setNotice({ message: `${what} saved to ${result.folder}` });
  }, []);

  const exportBackup = useCallback(() => {
    void saveFile(`appledhd-backup-${today}.json`, serialise(data), 'application/json', 'utf8')
      .then(r => announceSaved(r, 'backup'));
  }, [data, today, announceSaved]);

  const exportNotePng = useCallback((note: ListNote) => {
    void renderListPng(note, today).then(png => {
      if (png) void saveImage(png.fileName, png.base64).then(r => announceSaved(r, 'note'));
    });
  }, [today, announceSaved]);

  const importBackup = useCallback((file: File) => {
    file.text().then(text => {
      try {
        store.replaceAll(deserialise(text), 'restored from backup');
      } catch {
        // Malformed file — leave existing data untouched.
      }
    });
  }, [store]);

  // Physical confirmation for the actions that change something. Reads the
  // user's setting once here so no screen has to thread it through.
  const buzz = useCallback(
    (feel: 'tap' | 'success' | 'remove' = 'tap') => haptic(data.settings.haptics, feel),
    [data.settings.haptics],
  );

  /**
   * Deleting one row of a repeating task removes just that occurrence — losing
   * a whole series to a single tap would be a nasty surprise. The series itself
   * is deleted from the edit sheet, where the intent is explicit.
   */
  const removeTask = useCallback((id: string, date: string) => {
    const task = data.tasks.find(t => t.id === id);
    buzz('remove');
    if (task?.repeat) update(d => A.skipOccurrence(d, id, date), 'occurrence removed');
    else update(d => A.deleteTask(d, id), 'task deleted');
  }, [data.tasks, update, buzz]);

  const toggleTask = useCallback((id: string, date: string) => {
    buzz('success');
    update(d => A.toggleTask(d, id, date));
  }, [update, buzz]);

  // Confirmations clear themselves; there is nothing to act on.
  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), notice.action ? 7000 : 4000);
    return () => window.clearTimeout(t);
  }, [notice]);

  // Android's back button drives the same stack as the on-screen back arrow.
  // Returning false at the root lets the OS close the app, rather than trapping
  // the user on the home screen with a button that does nothing.
  const canPop = nav.canPop;
  const pop = nav.pop;
  // The step-by-step tour shows on Home until it is finished or skipped. Replaying
  // it from settings just marks it unseen again.
  const tourShowing = store.ready && !data.settings.guideSeen && nav.screen.name === 'home' && nav.sheets.length === 0;
  const finishTour = useCallback(() => {
    updateQuiet(d => A.setSettings(d, { guideSeen: true }));
  }, [updateQuiet]);
  useEffect(() => onHardwareBack(() => {
    // Back during the tour skips it, rather than navigating underneath it.
    if (tourShowing) { finishTour(); return true; }
    if (!canPop) return false;
    pop();
    return true;
  }), [canPop, pop, tourShowing, finishTour]);


  // Mirror the tasks that want a reminder into the OS scheduler. Debounced
  // because this runs on every edit, and rescheduling is not free. Repeating
  // tasks are scheduled a month ahead; `today` in the deps rolls that window
  // forward each day the app is used.
  const { tasks, settings } = data;
  useEffect(() => {
    if (!store.ready) return;
    const t = window.setTimeout(() => {
      if (!settings.notifications) {
        void syncReminders([]);
        return;
      }
      void syncReminders(upcomingReminders(tasks, Date.now(), REMINDER_HORIZON_DAYS));
    }, 800);
    return () => window.clearTimeout(t);
  }, [tasks, settings.notifications, store.ready, today]);

  // Tapping a reminder opens the day it belongs to, with that task marked. It is
  // pushed on top of wherever you were, so back returns you there.
  const pushLayer = nav.push;
  useEffect(() => {
    if (!store.ready) return;
    return onReminderTap((taskId, date) => {
      setSelected(date);
      setFocusTask(taskId);
      pushLayer(screen('day', date));
    });
  }, [store.ready, pushLayer]);

  useEffect(() => {
    if (!focusTask) return;
    const t = window.setTimeout(() => setFocusTask(null), 6000);
    return () => window.clearTimeout(t);
  }, [focusTask]);

  const currentGoal = nav.sheets.length ? data.goals.find(g => g.id === nav.sheets[nav.sheets.length - 1].param) ?? null : null;

  // ---- loading ---------------------------------------------------------
  if (!store.ready) {
    return <div style={{ position: 'absolute', inset: 0, background: '#f8a988' }} />;
  }

  // ---- screens ---------------------------------------------------------
  const { name: requested, param } = nav.screen;

  // A section switched off in Settings takes its screen with it, so you cannot
  // be left standing on one after hiding it.
  const gatedSection = TAB_SECTION[requested as TabName];
  const name = gatedSection && !data.settings.sections[gatedSection] ? 'home' : requested;

  const body = (() => {
    switch (name) {
      case 'goals':
        return (
          <Screen paper paperColor={`color-mix(in srgb, ${TONE.goals.bg} 38%, #fffdf7)`} header={<ScreenHeader title="extra goals" subtitle="hours you want to put in" tone="goals" onBack={nav.canPop ? nav.pop : undefined} badge={<SectionIcon slot="goals" size={32} strokeWidth={2.6} style={{ flex: 'none', filter: 'drop-shadow(1px 2px 0 rgba(80,26,18,.3))' }} />} />}>
            <GoalsScreen
              goals={data.goals}
              today={today}
              onAdd={() => nav.push(sheet('editGoal'))}
              onEdit={id => nav.push(sheet('editGoal', id))}
              onDelete={id => { buzz('remove'); update(d => A.deleteGoal(d, id), 'goal deleted') }}
              onNudge={(id, delta) => { buzz(); update(d => A.addGoalHours(d, id, today, delta)); }}
              onSetHours={id => nav.push(sheet('logHours', id))}
              onArchive={(id, archived) => update(d => A.archiveGoal(d, id, archived))}
            />
          </Screen>
        );

      case 'cycle':
        return (
          <Screen paper paperColor={`color-mix(in srgb, ${TONE.cycle.bg} 38%, #fffdf7)`} header={<ScreenHeader title="menstrual cycle" subtitle={cycle.estimated ? `averaging ${cycle.length} days` : 'log a period to start'} tone="cycle" onBack={nav.canPop ? nav.pop : undefined} badge={<SectionIcon slot="cycle" size={32} strokeWidth={2.6} style={{ flex: 'none', filter: 'drop-shadow(1px 2px 0 rgba(80,26,18,.3))' }} />} />}>
            <CycleScreen
              periods={data.periods}
              cycleLength={data.settings.cycleLength}
              today={today}
              onAdd={() => nav.push(sheet('logPeriod'))}
              onEdit={id => nav.push(sheet('logPeriod', id))}
              onDelete={id => { buzz('remove'); update(d => A.deletePeriod(d, id), 'period deleted') }}
              onEndOngoing={() => update(d => A.endPeriod(d, today))}
              onSetLength={n => update(d => A.setSettings(d, { cycleLength: n }))}
            />
          </Screen>
        );

      case 'budget':
        return (
          <Screen paper paperColor={`color-mix(in srgb, ${TONE.budget.bg} 38%, #fffdf7)`} header={<ScreenHeader title="budget planner" subtitle="spend within what you set" tone="budget" onBack={nav.canPop ? nav.pop : undefined} badge={<SectionIcon slot="budget" size={32} strokeWidth={2.6} style={{ flex: 'none', filter: 'drop-shadow(1px 2px 0 rgba(80,26,18,.3))' }} />} actions={<ArtButton slot="settings" label="budget settings" size={32} onClick={() => nav.push(sheet('budgetSettings'))} />} />}>
            <BudgetScreen
              data={data}
              today={today}
              viewScope={viewScope}
              calc={calc}
              spendLabel={spendLabel}
              noteDraft={noteDraft}
              onSetViewScope={setViewScope}
              onPressCalc={ch => setCalc(c => (c + ch).slice(0, 40))}
              onClearCalc={() => setCalc('')}
              onBackspaceCalc={() => setCalc(c => c.slice(0, -1))}
              onSetSpendLabel={setSpendLabel}
              onLogSpend={() => {
                const v = calcTotal(calc);
                if (v) { buzz('success'); update(d => A.logSpend(d, uid(), today, v, spendLabel)); }
                setCalc('');
                setSpendLabel('');
              }}
              onDeleteSpend={id => { buzz('remove'); update(d => A.deleteSpend(d, id), 'spend deleted') }}
              onSetNoteDraft={setNoteDraft}
              onAddNote={() => { if (noteDraft.trim()) update(d => A.addBudgetNote(d, uid(), noteDraft, today)); setNoteDraft(''); }}
              onToggleNote={id => { buzz('success'); update(d => A.toggleBudgetNote(d, id)); }}
              onDeleteNote={id => { buzz('remove'); update(d => A.deleteBudgetNote(d, id), 'note deleted') }}
              onClearDoneNotes={() => { buzz('remove'); update(d => A.clearDoneBudgetNotes(d), 'finished notes cleared'); }}
              onOpenSettings={() => nav.push(sheet('budgetSettings'))}
              onReset={() => {
                buzz('remove');
                const r = scopeRange(viewScope, today, data.settings.weekStart);
                update(d => A.clearSpends(d, r.from, r.to), 'spending cleared');
              }}
            />
          </Screen>
        );

      case 'notes':
        return (
          <Screen paper paperColor={`color-mix(in srgb, ${TONE.notes.bg} 38%, #fffdf7)`} header={<ScreenHeader title="notepad" subtitle="lists, boards and quick notes" tone="notes" onBack={nav.canPop ? nav.pop : undefined} badge={<SectionIcon slot="notes" size={32} strokeWidth={2.6} style={{ flex: 'none', filter: 'drop-shadow(1px 2px 0 rgba(80,26,18,.3))' }} />} />}>
            <NotesScreen
              lists={data.lists}
              pinnedNote={data.settings.pinnedNote}
              today={today}
              onOpen={id => nav.push(screen('note', id))}
              onNew={() => nav.push(sheet('newNote'))}
              onDelete={id => { buzz('remove'); update(d => A.deleteList(d, id), 'note deleted') }}
            />
          </Screen>
        );

      case 'note': {
        const note = data.lists.find(l => l.id === param);
        // Reachable if a note is deleted from another surface while open. Say so
        // rather than rendering an empty page that reads as a broken app.
        if (!note) {
          return (
            <Screen paper header={<ScreenHeader title="note" tone="notes" onBack={nav.pop} />}>
              <EmptyState
                title="this note is gone"
                hint="it may have been deleted"
                action={(
                  <button type="button" onClick={nav.pop} style={{ ...chipStyle(TONE.notes.bg, TONE.notes.ink), height: 42, padding: '0 15px', fontSize: 14 }}>
                    back to the notepad
                  </button>
                )}
              />
            </Screen>
          );
        }
        return (
          <Screen
            paper
            // A wash of the note's own colour rather than the full tint: the
            // page is mostly text, and a saturated sheet would fight it.
            paperColor={`color-mix(in srgb, ${STICKY_TINT[note.color % STICKY_TINT.length]} 38%, #fffdf7)`}
            header={(
              <ScreenHeader
                title={note.title}
                subtitle="saves as you type"
                tone="notes"
                onBack={nav.pop}
                actions={(
                  <>
                    <IconButton
                      icon={data.settings.pinnedNote === note.id ? 'pinOff' : 'pin'}
                      label={data.settings.pinnedNote === note.id ? 'unpin from home' : 'pin to home'}
                      onClick={() => { buzz(); update(d => A.togglePinnedNote(d, note.id)); }}
                      bg={data.settings.pinnedNote === note.id ? TONE.notes.bg : '#fffdfa'}
                      color={TONE.notes.ink}
                    />
                    <IconButton icon="pencil" label={`rename ${note.title}`} onClick={() => nav.push(sheet('renameNote', note.id))} bg={TONE.notes.bg} color={TONE.notes.ink} />
                    {note.kind === 'page' && (
                      <IconButton icon="download" label="save as image" onClick={() => exportNotePng(note)} bg={TONE.goals.bg} color={TONE.goals.ink} />
                    )}
                    <IconButton icon="trash" label={`delete ${note.title}`} onClick={() => { update(d => A.deleteList(d, note.id), 'note deleted'); nav.pop(); }} bg="#ffd2cb" color="#8f2c20" />
                  </>
                )}
              />
            )}
          >
            {note.kind === 'board' ? (
              <BoardScreen
                note={note}
                onAdd={sid => update(d => A.addSticky(d, note.id, sid, '', note.stickies.length % 6))}
                onSetText={(sid, text) => update(d => A.updateSticky(d, note.id, sid, { text }))}
                onSetColor={(sid, color) => update(d => A.updateSticky(d, note.id, sid, { color }))}
                onDelete={sid => { buzz('remove'); update(d => A.deleteSticky(d, note.id, sid), 'sticky deleted'); }}
                onMove={(sid, to) => update(d => A.moveSticky(d, note.id, sid, to))}
                onTick={() => buzz()}
              />
            ) : (
              <NoteScreen
                note={note}
                onSetText={v => update(d => A.setListText(d, note.id, v))}
                onSetChecked={c => update(d => A.setListChecked(d, note.id, c))}
                onSetContent={(t, c) => update(d => A.setListContent(d, note.id, t, c))}
                onSetColor={c => update(d => A.setListColor(d, note.id, c))}
                onTick={() => buzz('success')}
              />
            )}
          </Screen>
        );
      }

      case 'day': {
        const date = param ?? today;
        return (
          <Screen
            paper
            paperColor={`color-mix(in srgb, ${TONE.today.bg} 38%, #fffdf7)`}
            header={<ScreenHeader title={date === today ? `today · ${prettyFull(date)}` : prettyFull(date)} subtitle="everything on this day" tone="today" onBack={nav.pop} badge={<SectionIcon slot="today" size={32} strokeWidth={2.6} style={{ flex: 'none', filter: 'drop-shadow(1px 2px 0 rgba(80,26,18,.3))' }} />} />}
          >
            <DayScreen
              data={data}
              date={date}
              today={today}
              mark={cycleMap[date]}
              focusTaskId={focusTask}
              onToggleTask={toggleTask}
              onEditTask={id => openTaskSheet(id, date)}
              onDeleteTask={removeTask}
              onMoveTask={(id, dir) => update(d => A.moveTask(d, id, dir))}
              onChangeDate={d2 => { setSelected(d2); nav.replace(screen('day', d2)); }}
              onAddTask={() => openTaskSheet(null, date)}
              onStartPeriod={() => update(d => A.startPeriod(d, uid(), date))}
              onEndPeriod={() => update(d => A.endPeriod(d, date))}
              onClearPeriod={() => update(d => A.clearPeriodOn(d, date, today), 'period removed')}
              onDeleteSpend={id => { buzz('remove'); update(d => A.deleteSpend(d, id), 'spend deleted') }}
            />
          </Screen>
        );
      }

      case 'search':
        return (
          <Screen paper header={<ScreenHeader title="search" onBack={nav.pop} />}>
            <SearchScreen
              data={data}
              today={today}
              onOpenDay={openDay}
              onEditTask={id => openTaskSheet(id, today)}
              onOpenNote={id => nav.push(screen('note', id))}
              onGoGoals={() => goTab('goals')}
            />
          </Screen>
        );

      case 'settings':
        return (
          <Screen paper header={<ScreenHeader title="settings" onBack={nav.pop} />}>
            <SettingsScreen
              data={data}
              onSet={patch => updateQuiet(d => A.setSettings(d, patch as Partial<Settings>))}
              onToggleSection={(k: SectionKey) => updateQuiet(d => A.toggleSection(d, k))}
              onExport={exportBackup}
              onImport={() => fileRef.current?.click()}
              onLoadSample={() => store.replaceAll(sampleData(), 'sample data loaded')}
              onResetAll={() => store.replaceAll({ ...emptyData(), settings: { ...data.settings } }, 'everything erased')}
              onStartTour={() => { nav.selectTab('home'); updateQuiet(d => A.setSettings(d, { guideSeen: false })); }}
              streak={streak}
            />
          </Screen>
        );

      default:
        return (
          <Screen>
            <HomeScreen
              data={data}
              today={today}
              nowMs={now}
              view={view}
              selected={selected}
              cycleMap={cycleMap}
              onChangeView={setView}
              onSelectDate={setSelected}
              onToday={() => { setView({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 }); setSelected(today); }}
              onToggleTask={toggleTask}
              onEditTask={id => openTaskSheet(id, selected ?? today)}
              onDeleteTask={removeTask}
              onAddTask={date => openTaskSheet(null, date)}
              onOpenDay={openDay}
              onOpenNote={id => nav.push(screen('note', id))}
              onTickPinned={lineIndex => {
                const id = data.settings.pinnedNote;
                if (!id) return;
                const pinned = data.lists.find(l => l.id === id);
                if (!pinned) return;
                buzz('success');
                const next = toggleChecked(pinned.checked, lineIndex);
                update(d => A.setListChecked(d, id, next));
              }}
              onOpenSettings={() => nav.push(screen('settings'))}
              onOpenSearch={() => nav.push(screen('search'))}
              streak={streak}
              onToggleSection={k => updateQuiet(d => A.toggleCollapsed(d, k))}
              onGo={goTab}
            />
          </Screen>
        );
    }
  })();

  const showChrome = name !== 'note' && name !== 'settings';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#f8a988' }}>
      <ArtworkLayer artworkUrl={data.settings.artworkUrl} enabled={data.settings.artworkEnabled} />

      {body}

      {showChrome && (
        <TabBar
          tabs={tabs}
          active={nav.tab as TabName}
          onSelect={nav.selectTab}
          trailing={<Fab onClick={() => openTaskSheet(null, name === 'day' ? (param ?? today) : (selected ?? today))} />}
        />
      )}

      {store.undo ? (
        <Toast
          message={store.undo.label}
          actionLabel="undo"
          onAction={() => { buzz('success'); store.runUndo(); }}
          onDismiss={store.dismissUndo}
        />
      ) : notice ? (
        <Toast
          message={notice.message}
          actionLabel={notice.action?.label}
          onAction={notice.action ? () => { notice.action?.run(); setNotice(null); } : undefined}
          onDismiss={() => setNotice(null)}
        />
      ) : null}

      {/* Sheets, rendered from the nav stack so back dismisses them. */}
      {nav.sheets.map((s, i) => {
        const key = `${s.name}-${s.param ?? ''}-${i}`;
        switch (s.name) {
          case 'addTask':
            return (
              <TaskSheet
                key={key}
                draft={draft}
                editing={!!draft.id}
                onClose={nav.pop}
                onChange={patch => setDraft(prev => ({ ...prev, ...patch }))}
                onSave={saveTask}
                onDelete={draft.id ? () => { update(d => A.deleteTask(d, draft.id as string), 'task deleted'); nav.pop(); } : undefined}
              />
            );
          case 'editGoal':
            return (
              <GoalSheet
                key={key}
                goal={currentGoal}
                today={today}
                onClose={nav.pop}
                onSave={(nm, hrs, days) => {
                  update(d => (currentGoal ? A.updateGoal(d, currentGoal.id, { name: nm, perDay: hrs, targetD: days }) : A.addGoal(d, uid(), nm, hrs, days, today)));
                  nav.pop();
                }}
                onDelete={currentGoal ? () => { update(d => A.deleteGoal(d, currentGoal.id), 'goal deleted'); nav.pop(); } : undefined}
              />
            );
          case 'logHours':
            return currentGoal ? (
              <HoursSheet
                key={key}
                goal={currentGoal}
                today={today}
                onClose={nav.pop}
                onSave={hrs => { update(d => A.setGoalHours(d, currentGoal.id, today, hrs)); nav.pop(); }}
              />
            ) : null;
          case 'budgetSettings':
            return (
              <BudgetSettingsSheet
                key={key}
                scope={data.budget.scope}
                amount={data.budget.amount}
                saving={data.budget.saving}
                currency={data.settings.currency}
                onClose={nav.pop}
                onSave={(sc, amt, sav) => { update(d => A.setBudget(d, sc, amt, sav)); setViewScope(sc); nav.pop(); }}
              />
            );
          case 'newNote':
            return (
              <NoteNameSheet
                key={key}
                onClose={nav.pop}
                onSave={(title, kind) => {
                  const newId = uid();
                  // Cycle the palette so a new note is not always the same colour.
                  update(d => A.addList(d, newId, title, kind, d.lists.length % STICKY_TINT.length));
                  // Swap this sheet for the note screen rather than pop-then-push:
                  // pop goes through history.back(), which lands asynchronously and
                  // would race the push.
                  nav.replace(screen('note', newId));
                }}
              />
            );

          case 'renameNote': {
            const target = data.lists.find(l => l.id === s.param);
            if (!target) return null;
            return (
              <NoteNameSheet
                key={key}
                initial={target.title}
                onClose={nav.pop}
                onSave={title => { update(d => A.renameList(d, target.id, title)); nav.pop(); }}
              />
            );
          }
          case 'logPeriod': {
            const editing = data.periods.find(p => p.id === s.param) ?? null;
            return (
              <PeriodSheet
                key={key}
                period={editing}
                today={today}
                onClose={nav.pop}
                onSave={(start, end) => {
                  const newId = uid();
                  update(d => (editing
                    ? A.updatePeriod(d, editing.id, { start, end })
                    : A.endPeriodIfNeeded(A.startPeriod(d, newId, start), end)));
                  nav.pop();
                }}
                onDelete={editing ? () => { update(d => A.deletePeriod(d, editing.id), 'period deleted'); nav.pop(); } : undefined}
              />
            );
          }
          default:
            return null;
        }
      })}

      {tourShowing && (
        <Tour
          onClose={finishTour}
          onAddFirst={() => { finishTour(); openTaskSheet(null, today); }}
        />
      )}

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        onChange={e => { const f = e.target.files?.[0]; if (f) importBackup(f); e.target.value = ''; }}
        style={{ display: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}


