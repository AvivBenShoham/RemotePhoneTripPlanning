// Shared state store with PER-FIELD sync.
//
// Every edit writes only the leaf path that changed (e.g. `acc/d1/price`) via
// `ref.child(path).set(v)`, and the store listens with per-section
// `child_added/changed/removed` events (mirroring useChat.jsx). Because two
// clients editing different fields touch disjoint paths, the database merges
// them server-side — one person's write can no longer clobber another's. The
// only value held back while you type is the exact field under your cursor
// (tagged with `data-sync`); every other remote change lands live.
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { dbRef, remoteReady } from '../firebase/client';
import { LS_KEY } from '../firebase/config';
import { DEFAULT_TODO } from '../data/optionals';
import { stableStr, mergeKeepingFocus } from '../lib/format';
import { useLang } from './useLang';

const defaultStore = { opt:{beachhop:"moron",slowbeach:"coson",night:"strip"}, book:{}, acc:{}, todo:{} };
const SECTIONS = ['opt', 'book', 'acc', 'todo'];
const clone = (o) => JSON.parse(JSON.stringify(o));

function initialStore() {
  const base = clone(defaultStore);
  try { const raw = localStorage.getItem(LS_KEY); if (raw) return Object.assign(base, JSON.parse(raw)); } catch (e) {}
  return base;
}

// the leaf path of the input the user is currently editing, e.g. "acc/d1/notes"
// (only text-like inputs are tagged with data-sync; checkboxes/buttons aren't).
function focusedPath() {
  const ae = typeof document !== 'undefined' ? document.activeElement : null;
  if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA') && ae.dataset && ae.dataset.sync) return ae.dataset.sync;
  return null;
}

// Walk prev vs next and collect the scalar leaf paths that changed. Added
// objects are recursed into (so we only ever write scalar leaves, never an
// object parent that could race with a concurrent child write); a key that
// vanished is a remove of that whole subtree.
function diffLeaves(prev, next, base, writes, removes) {
  const po = (prev && typeof prev === 'object' && !Array.isArray(prev)) ? prev : {};
  const no = (next && typeof next === 'object' && !Array.isArray(next)) ? next : {};
  const keys = new Set([...Object.keys(po), ...Object.keys(no)]);
  keys.forEach((k) => {
    const p = po[k], n = no[k];
    const path = base ? base + '/' + k : k;
    if (n === undefined) { removes.push(path); return; }                 // removed subtree
    if (p === undefined) {                                                // newly added
      if (n && typeof n === 'object' && !Array.isArray(n)) diffLeaves({}, n, path, writes, removes);
      else writes.push([path, n]);
      return;
    }
    const bothObj = p && n && typeof p === 'object' && typeof n === 'object' && !Array.isArray(p) && !Array.isArray(n);
    if (bothObj) diffLeaves(p, n, path, writes, removes);
    else if (stableStr(p) !== stableStr(n)) writes.push([path, n]);       // changed scalar
  });
}

const StoreCtx = createContext(null);
export const useStore = () => useContext(StoreCtx);

export function StoreProvider({ children }) {
  const { t } = useLang();
  const [store, setStore] = useState(initialStore);
  const storeRef = useRef(store);
  useEffect(() => { storeRef.current = store; }, [store]);

  const leafTimers = useRef(new Map());   // path -> debounce timer, so typing in one field never delays another

  const persistLocal = (next) => { try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch (e) {} };

  // per-path debounced leaf write (text fields coalesce keystrokes; the write
  // touches only that one path, so a sibling field is never overwritten)
  const scheduleLeafWrite = useCallback((path, value, isRemove) => {
    if (!remoteReady) return;
    const timers = leafTimers.current;
    clearTimeout(timers.get(path));
    timers.set(path, setTimeout(() => {
      timers.delete(path);
      const ref = dbRef.child(path);
      (isRemove ? ref.remove() : ref.set(value)).catch(() => {});
    }, 350));
  }, []);

  // local edit → update state, persist to device, and write only changed leaves
  const update = useCallback((mutator) => {
    const prev = storeRef.current;
    const next = clone(prev);
    mutator(next);
    storeRef.current = next;
    setStore(next);
    persistLocal(next);
    if (remoteReady) {
      const writes = [], removes = [];
      diffLeaves(prev, next, '', writes, removes);
      writes.forEach(([path, val]) => scheduleLeafWrite(path, val, false));
      removes.forEach((path) => scheduleLeafWrite(path, undefined, true));
    }
  }, [scheduleLeafWrite]);

  // local-only whole-store apply (used by the to-do seed/migrate below)
  const applyIncoming = useCallback((val) => {
    const next = Object.assign(clone(defaultStore), val);
    storeRef.current = next;
    setStore(next);
    persistLocal(next);
  }, []);

  // merge one incoming record (section/key) from a child event. For object
  // records we take the server's fields but keep the local value of the exact
  // field under the cursor, so a remote change never yanks what you're typing.
  // The field may sit several levels deep (e.g. acc/d1/options/o2/name), so the
  // path is walked segment by segment and only the leaf is restored.
  const mergeChild = useCallback((section, key, incoming) => {
    setStore((prev) => {
      const secObj = prev[section] || {};
      const cur = secObj[key];
      let merged;
      if (incoming && typeof incoming === 'object' && !Array.isArray(incoming)) {
        const fp = focusedPath();
        const pfx = section + '/' + key + '/';
        merged = mergeKeepingFocus(cur, incoming, (fp && fp.indexOf(pfx) === 0) ? fp.slice(pfx.length) : '');
      } else {
        merged = incoming;
      }
      if (stableStr(merged) === stableStr(cur)) return prev;                 // echo of our own write / no-op
      const next = { ...prev, [section]: { ...secObj, [key]: merged } };
      storeRef.current = next;
      persistLocal(next);
      return next;
    });
  }, []);

  const dropChild = useCallback((section, key) => {
    setStore((prev) => {
      const secObj = prev[section];
      if (!secObj || !(key in secObj)) return prev;
      const nsec = { ...secObj };
      delete nsec[key];
      const next = { ...prev, [section]: nsec };
      storeRef.current = next;
      persistLocal(next);
      return next;
    });
  }, []);

  // live shared sync: seed a brand-new trip once, then listen per record
  useEffect(() => {
    if (!remoteReady) return;
    // one-time seed: only push local state up when the node doesn't exist yet,
    // so we never overwrite an existing trip with our defaults on load.
    dbRef.once('value').then((snap) => {
      if (snap.val() === null) dbRef.set(storeRef.current).catch(() => {});
    }).catch(() => {});

    const unsubs = [];
    SECTIONS.forEach((section) => {
      const ref = dbRef.child(section);
      const onAdd = (s) => mergeChild(section, s.key, s.val());
      const onChg = (s) => mergeChild(section, s.key, s.val());
      const onRem = (s) => dropChild(section, s.key);
      ref.on('child_added', onAdd);
      ref.on('child_changed', onChg);
      ref.on('child_removed', onRem);
      unsubs.push(() => { ref.off('child_added', onAdd); ref.off('child_changed', onChg); ref.off('child_removed', onRem); });
    });
    return () => unsubs.forEach((fn) => fn());
  }, [mergeChild, dropChild]);

  // Seed a fresh trip's to-do and migrate the old {id:bool} format. Local only:
  // sharing happens via the one-time seed above (fresh node) or resetAll. When
  // the server already holds to-dos, the child listeners deliver them and this
  // no-ops (they're already the new object format). Idempotent.
  useEffect(() => {
    const t = store.todo || {};
    const keys = Object.keys(t);
    const isNew = keys.length > 0 && keys.every(k => t[k] && typeof t[k] === 'object' && typeof t[k].label === 'string');
    if (isNew) return;
    const seeded = {};
    DEFAULT_TODO.forEach((label, i) => {
      const id = 't' + (i + 1); const old = t[id];
      const done = (typeof old === 'boolean') ? old : (old && typeof old === 'object' ? !!old.done : false);
      seeded[id] = { label, done, ts: i };
    });
    applyIncoming(Object.assign(clone(storeRef.current), { todo: seeded }));
  }, [store.todo, applyIncoming]);

  const resetAll = useCallback(() => {
    if (!confirm(t('reset_confirm'))) return;
    const seededTodo = {};
    DEFAULT_TODO.forEach((label, i) => { seededTodo['t' + (i + 1)] = { label, done: false, ts: i }; });
    const next = Object.assign(clone(defaultStore), { todo: seededTodo });
    storeRef.current = next;
    setStore(next);
    persistLocal(next);
    if (remoteReady) dbRef.set(next).catch(() => {});    // deliberate whole-node replace
  }, [t]);

  return <StoreCtx.Provider value={{ store, update, resetAll }}>{children}</StoreCtx.Provider>;
}
