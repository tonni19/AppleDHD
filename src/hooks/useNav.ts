'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { activeScreen, activeSheets, sameLayer, screen, type Layer, type ScreenName, type SheetName, type TabName } from '@/lib/routes';

export interface Nav {
  stack: Layer[];
  screen: { name: ScreenName; param?: string };
  sheets: { name: SheetName; param?: string }[];
  /** Which tab is highlighted — the root of the current stack. */
  tab: TabName;
  canPop: boolean;
  /** Direction of the last transition, so screens animate in the right way. */
  dir: 'push' | 'pop' | 'tab';
  push: (layer: Layer) => void;
  pop: () => void;
  popTo: (depth: number) => void;
  replace: (layer: Layer) => void;
  selectTab: (tab: TabName) => void;
  closeSheets: () => void;
}

const ROOT: Layer[] = [screen('home')];

export function useNav(): Nav {
  const [stack, setStack] = useState<Layer[]>(ROOT);
  const [dir, setDir] = useState<'push' | 'pop' | 'tab'>('tab');
  // Mirrors stack.length so the popstate listener can tell a back from a forward.
  const depth = useRef(1);
  const suppress = useRef(false);

  const sync = useCallback((next: Layer[], how: 'push' | 'pop' | 'tab') => {
    setStack(next);
    setDir(how);
    depth.current = next.length;
  }, []);

  const push = useCallback((layer: Layer) => {
    setStack(prev => {
      const top = prev[prev.length - 1];
      // Guard against double-taps pushing the same destination twice.
      if (top && sameLayer(top, layer)) return prev;
      const next = prev.concat(layer);
      depth.current = next.length;
      suppress.current = true;
      try {
        window.history.pushState({ d: next.length }, '');
      } catch {
        // History unavailable (some webview configurations) — navigation still works.
      }
      suppress.current = false;
      return next;
    });
    setDir('push');
  }, []);

  const pop = useCallback(() => {
    // Let the browser/OS drive the pop so the history entry is consumed too;
    // the popstate handler below trims the stack.
    if (depth.current > 1) {
      try {
        window.history.back();
        return;
      } catch {
        // fall through to a manual pop
      }
    }
    setStack(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
    setDir('pop');
  }, []);

  const popTo = useCallback((target: number) => {
    const back = depth.current - Math.max(1, target);
    if (back > 0) {
      try {
        window.history.go(-back);
        return;
      } catch {
        // fall through
      }
    }
    sync(stack.slice(0, Math.max(1, target)), 'pop');
  }, [stack, sync]);

  const replace = useCallback((layer: Layer) => {
    setStack(prev => prev.slice(0, -1).concat(layer));
    setDir('push');
  }, []);

  const closeSheets = useCallback(() => {
    let sheetCount = 0;
    for (let i = stack.length - 1; i >= 0; i--) {
      if (stack[i].t === 'sheet') sheetCount++;
      else break;
    }
    if (sheetCount > 0) popTo(stack.length - sheetCount);
  }, [stack, popTo]);

  const selectTab = useCallback((tab: TabName) => {
    // Tabs reset to a single-entry stack: a tab is a root, never something you
    // go "back" into. Collapse any history so back from a tab root exits cleanly.
    const back = depth.current - 1;
    if (back > 0) {
      try {
        window.history.go(-back);
      } catch {
        // ignore
      }
    }
    sync([screen(tab)], 'tab');
  }, [sync]);

  useEffect(() => {
    const onPop = () => {
      if (suppress.current) return;
      setStack(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
      setDir('pop');
      depth.current = Math.max(1, depth.current - 1);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const current = activeScreen(stack);
  const root = stack[0];
  const tab = (root && root.t === 'screen' ? root.name : 'home') as TabName;

  return {
    stack,
    screen: current,
    sheets: activeSheets(stack),
    tab,
    canPop: stack.length > 1,
    dir,
    push,
    pop,
    popTo,
    replace,
    selectTab,
    closeSheets,
  };
}
