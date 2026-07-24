// Shared state store: seeds from localStorage, syncs the whole blob to Firebase
// (debounced, last-write-wins), and applies incoming remote snapshots without
// clobbering a field being typed in. Ports the original store/save/applyRemote.
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { dbRef, remoteReady } from '../firebase/client';
import { LS_KEY } from '../firebase/config';
import { DEFAULT_TODO } from '../data/optionals';
import { stableStr } from '../lib/format';

const defaultStore = { opt:{beachhop:"moron",slowbeach:"coson",night:"strip"}, book:{}, acc:{}, todo:{} };
const clone = (o) => JSON.parse(JSON.stringify(o));

function initialStore() {
  const base = clone(defaultStore);
  try { const raw = localStorage.getItem(LS_KEY); if (raw) return Object.assign(base, JSON.parse(raw)); } catch (e) {}
  return base;
}

const StoreCtx = createContext(null);
export const useStore = () => useContext(StoreCtx);

export function StoreProvider({ children }) {
  const [store, setStore] = useState(initialStore);
  const storeRef = useRef(store);
  useEffect(() => { storeRef.current = store; }, [store]);

  const writeTimer = useRef(null);
  const lastWritten = useRef(null);
  const pendingVal = useRef(null);
  const blurHooked = useRef(false);

  const persistLocal = (next) => { try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch (e) {} };
  // Debounced whole-blob write. Reads storeRef.current at fire time (not a
  // captured snapshot) so a remote snapshot that lands during the debounce
  // window is what gets written back, never an already-stale local blob.
  const scheduleRemote = () => {
    if (!remoteReady) return;
    clearTimeout(writeTimer.current);
    writeTimer.current = setTimeout(() => {
      lastWritten.current = stableStr(storeRef.current);
      dbRef.set(storeRef.current).catch(() => {});
    }, 400);
  };

  // local edit → update state, persist to device, and schedule the shared write
  const update = useCallback((mutator) => {
    const next = clone(storeRef.current);
    mutator(next);
    storeRef.current = next;
    setStore(next);
    persistLocal(next);
    scheduleRemote();
  }, []);

  // apply an incoming remote snapshot to local state (no re-write of remote)
  const applyIncoming = useCallback((val) => {
    const next = Object.assign(clone(defaultStore), val);
    storeRef.current = next;
    setStore(next);
    persistLocal(next);
  }, []);

  // defer applying a remote snapshot to a field being typed in until blur
  const applyRemote = useCallback((val) => {
    const ae = document.activeElement;
    if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) {
      pendingVal.current = val;
      if (!blurHooked.current) {
        blurHooked.current = true;
        ae.addEventListener('blur', function () {
          blurHooked.current = false;
          if (pendingVal.current !== null) { const v = pendingVal.current; pendingVal.current = null; applyIncoming(v); }
        }, { once: true });
      }
    } else {
      applyIncoming(val);
    }
  }, [applyIncoming]);

  // live shared sync
  useEffect(() => {
    if (!remoteReady) return;
    const handler = (snap) => {
      const val = snap.val();
      if (val === null) { scheduleRemote(); return; }                   // first run: seed node from local
      if (stableStr(val) === lastWritten.current) return;               // ignore the echo of our own write
      applyRemote(val);
    };
    dbRef.on('value', handler);
    return () => dbRef.off('value', handler);
  }, [applyRemote]);

  // Seed a fresh trip's to-do and migrate the old {id:bool} format. Idempotent.
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
    if (keys.length === 0) update(s => { s.todo = seeded; });      // fresh: seed + share
    else applyIncoming(Object.assign(clone(store), { todo: seeded })); // migrate locally only
  }, [store.todo, update, applyIncoming]);

  const resetAll = useCallback(() => {
    if (!confirm('Clear all shared booking, accommodation & to-do entries and reset optionals to the recommended picks?')) return;
    const next = clone(defaultStore);
    storeRef.current = next;
    setStore(next);
    persistLocal(next);
    scheduleRemote();
  }, []);

  return <StoreCtx.Provider value={{ store, update, resetAll }}>{children}</StoreCtx.Provider>;
}
