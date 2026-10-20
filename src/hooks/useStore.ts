'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { emptyData } from '@/lib/defaults';
import { initNative } from '@/lib/native';
import { loadData, saveData } from '@/lib/persist';
import type { PersistedData } from '@/lib/types';

export interface UndoEntry {
  label: string;
  snapshot: PersistedData;
  at: number;
}

export interface Store {
  data: PersistedData;
  /** False until storage has been read, so the UI can hold back a flash of empty state. */
  ready: boolean;
  /** Apply a change. Pass a label to make it undoable. */
  update: (fn: (d: PersistedData) => PersistedData, undoLabel?: string) => void;
  /** Replace everything — used by import and reset. */
  replaceAll: (next: PersistedData, undoLabel?: string) => void;
  undo: UndoEntry | null;
  runUndo: () => void;
  dismissUndo: () => void;
}

const UNDO_TTL = 7000;

export function useStore(): Store {
  const [data, setData] = useState<PersistedData>(emptyData);
  const [ready, setReady] = useState(false);
  const [undo, setUndo] = useState<UndoEntry | null>(null);
  const undoTimer = useRef<number | null>(null);

  // ---- load once -------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    // The native storage driver has to be registered before the first read, or
    // the app would load from the webview's evictable localStorage instead.
    initNative().then(loadData).then(loaded => {
      if (cancelled) return;
      setData(loaded);
      setReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  // ---- persist (debounced) --------------------------------------------
  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(() => { void saveData(data); }, 400);
    return () => window.clearTimeout(t);
  }, [data, ready]);

  // A backgrounded app can be killed by the OS without warning; flush immediately
  // rather than losing whatever the 400ms debounce was still holding.
  useEffect(() => {
    if (!ready) return;
    const flush = () => { if (document.visibilityState === 'hidden') void saveData(data); };
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', flush);
      window.removeEventListener('pagehide', flush);
    };
  }, [data, ready]);

  const armUndo = useCallback((label: string, snapshot: PersistedData) => {
    setUndo({ label, snapshot, at: Date.now() });
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
    undoTimer.current = window.setTimeout(() => setUndo(null), UNDO_TTL);
  }, []);

  const update = useCallback((fn: (d: PersistedData) => PersistedData, undoLabel?: string) => {
    setData(prev => {
      const next = fn(prev);
      if (next === prev) return prev;
      if (undoLabel) armUndo(undoLabel, prev);
      return next;
    });
  }, [armUndo]);

  const replaceAll = useCallback((next: PersistedData, undoLabel?: string) => {
    setData(prev => {
      if (undoLabel) armUndo(undoLabel, prev);
      return next;
    });
  }, [armUndo]);

  const runUndo = useCallback(() => {
    setUndo(current => {
      if (current) setData(current.snapshot);
      return null;
    });
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
  }, []);

  const dismissUndo = useCallback(() => {
    setUndo(null);
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
  }, []);

  useEffect(() => () => { if (undoTimer.current) window.clearTimeout(undoTimer.current); }, []);

  return { data, ready, update, replaceAll, undo, runUndo, dismissUndo };
}
