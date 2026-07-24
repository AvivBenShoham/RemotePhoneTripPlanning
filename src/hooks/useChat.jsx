// Per-day chat, live notifications, in-page toasts, and unread tracking.
// Each message is its own record under CHAT_PATH/<dayId> written with push(),
// so concurrent posts never collide. Ports the original chat/alerts logic.
import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { chatRef, remoteReady, serverTimestamp } from '../firebase/client';
import { days } from '../data/days';
import { cap } from '../lib/format';
import { useAuth } from './useAuth';

const ChatCtx = createContext(null);
export const useChat = () => useContext(ChatCtx);

export function ChatProvider({ children }) {
  const { user, currentName, isAviv } = useAuth();

  const [chatCache, setChatCache] = useState({});   // {dayId:{msgId:msg}}
  const [openChats, setOpenChats] = useState({});   // {dayId:bool}
  const [chatSeen, setChatSeen] = useState({});     // {dayId:ts} per account/device
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const appStartTs = useRef(Date.now()).current;
  const chatPrimed = useRef({});                     // {dayId:true} once backlog loaded
  const notifyAsked = useRef(false);
  const toastSeq = useRef(0);

  // keep latest auth-derived helpers reachable from Firebase callbacks
  const userRef = useRef(user); useEffect(() => { userRef.current = user; }, [user]);
  const openChatsRef = useRef(openChats); useEffect(() => { openChatsRef.current = openChats; }, [openChats]);

  const isOwnMsg = useCallback((m) => {
    const u = userRef.current;
    if (u && m && m.uid) return m.uid === u.uid;
    const me = currentName();
    return !!me && !!m && (m.name || '').toLowerCase() === me.toLowerCase();
  }, [currentName]);

  // ---- unread "seen" state (per account, per device) ----
  const seenKey = useCallback(() => 'dr_chat_seen_' + (userRef.current ? userRef.current.uid : 'anon'), []);
  useEffect(() => {
    try { const raw = localStorage.getItem(seenKey()); setChatSeen(raw ? JSON.parse(raw) : {}); }
    catch (e) { setChatSeen({}); }
  }, [user, seenKey]);
  const persistSeen = (next) => { try { localStorage.setItem(seenKey(), JSON.stringify(next)); } catch (e) {} };

  const seenBase = useCallback((dayId) => (chatSeen[dayId] != null ? chatSeen[dayId] : appStartTs), [chatSeen, appStartTs]);
  const unreadForDay = useCallback((dayId) => {
    const c = chatCache[dayId]; if (!c) return 0;
    const base = seenBase(dayId); let n = 0;
    for (const k in c) { const m = c[k]; if (!isOwnMsg(m) && (m.ts || 0) > base) n++; }
    return n;
  }, [chatCache, seenBase, isOwnMsg]);
  const totalUnread = useCallback(() => { let n = 0; days.forEach(d => n += unreadForDay(d.id)); return n; }, [unreadForDay]);

  const markDaySeen = useCallback((dayId) => setChatSeen(prev => { const next = { ...prev, [dayId]: Date.now() }; persistSeen(next); return next; }), []);
  const markAllSeen = useCallback(() => setChatSeen(prev => { const now = Date.now(); const next = { ...prev }; days.forEach(d => next[d.id] = now); persistSeen(next); return next; }), []);

  // ---- toasts + OS notifications ----
  const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);
  const showToast = useCallback((dayId, title, body) => {
    const id = ++toastSeq.current;
    setToasts(prev => [...prev, { id, dayId, title, body }]);
    setTimeout(() => removeToast(id), 6000);
  }, [removeToast]);

  const notifySupported = () => typeof window !== 'undefined' && 'Notification' in window;
  const ensureNotifyPermission = useCallback(() => {
    if (notifyAsked.current || !notifySupported()) return;
    notifyAsked.current = true;
    if (Notification.permission !== 'default') return;
    try { const r = Notification.requestPermission(); if (r && r.then) r.catch(() => {}); } catch (e) {}
  }, []);

  const focusChat = useCallback((dayId) => {
    setOpenChats(prev => ({ ...prev, [dayId]: true }));
    requestAnimationFrame(() => {
      const box = document.getElementById('chat-' + dayId);
      if (box) { try { box.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {} }
    });
  }, []);

  const announceMsg = useCallback((dayId, m) => {
    const d = days.find(x => x.id === dayId), who = cap(m.name || 'Someone'), title = who + (d ? ' · ' + d.n : '');
    const body = (m.text || '').replace(/\s+/g, ' ').slice(0, 140);
    // already looking at this open thread → it's visible, stay quiet
    const viewing = document.visibilityState === 'visible' && openChatsRef.current[dayId] && (!document.hasFocus || document.hasFocus());
    if (viewing) { markDaySeen(dayId); return; }
    showToast(dayId, title, body);
    if (notifySupported() && Notification.permission === 'granted') {
      try {
        const n = new Notification(title, { body, tag: 'chat-' + dayId });
        n.onclick = function () { try { window.focus(); } catch (e) {} focusChat(dayId); n.close(); };
      } catch (e) {}
    }
  }, [markDaySeen, showToast, focusChat]);
  const announceRef = useRef(announceMsg); useEffect(() => { announceRef.current = announceMsg; }, [announceMsg]);
  const isOwnRef = useRef(isOwnMsg); useEffect(() => { isOwnRef.current = isOwnMsg; }, [isOwnMsg]);

  // ---- wire per-day chat listeners (append-only, own listeners) ----
  useEffect(() => {
    if (!remoteReady || !chatRef) return;
    const primed = chatPrimed.current;
    const unsubs = [];
    days.forEach(d => {
      const ref = chatRef.child(d.id);
      const onAdd = (s) => {
        const val = s.val() || {};
        setChatCache(prev => ({ ...prev, [d.id]: { ...(prev[d.id] || {}), [s.key]: val } }));
        if (primed[d.id] && !isOwnRef.current(val)) announceRef.current(d.id, val); // only after backlog, never own
      };
      const onChg = (s) => setChatCache(prev => ({ ...prev, [d.id]: { ...(prev[d.id] || {}), [s.key]: s.val() || {} } }));
      const onRem = (s) => setChatCache(prev => { const day = { ...(prev[d.id] || {}) }; delete day[s.key]; return { ...prev, [d.id]: day }; });
      ref.on('child_added', onAdd);
      ref.on('child_changed', onChg);
      ref.on('child_removed', onRem);
      ref.once('value', () => { primed[d.id] = true; });   // backlog loaded → later adds are "new"
      unsubs.push(() => { ref.off('child_added', onAdd); ref.off('child_changed', onChg); ref.off('child_removed', onRem); });
    });
    return () => unsubs.forEach(f => f());
  }, []);

  // returning to the tab clears unread on any thread already open on screen
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'visible') days.forEach(d => { if (openChatsRef.current[d.id]) markDaySeen(d.id); }); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [markDaySeen]);

  // ---- actions ----
  const toggleChat = useCallback((dayId) => {
    setOpenChats(prev => {
      const open = !prev[dayId];
      if (open) { ensureNotifyPermission(); markDaySeen(dayId); }
      return { ...prev, [dayId]: open };
    });
  }, [ensureNotifyPermission, markDaySeen]);

  const sendMsg = useCallback((dayId, rawText) => {
    if (!remoteReady || !chatRef) return;
    const text = (rawText || '').trim(); if (!text) return;
    ensureNotifyPermission();
    const u = userRef.current;
    const msg = { uid: u ? u.uid : 'anon', name: currentName() || 'Someone', text: text.slice(0, 2000), ts: serverTimestamp() };
    setOpenChats(prev => ({ ...prev, [dayId]: true }));
    chatRef.child(dayId).push(msg).catch(() => {});
  }, [ensureNotifyPermission, currentName]);

  const deleteMsg = useCallback((dayId, msgId) => {
    if (!isAviv() || !chatRef) return;
    if (!confirm('Delete this message?')) return;
    chatRef.child(dayId).child(msgId).remove().catch(() => {});
  }, [isAviv]);

  const chatCount = useCallback((dayId) => { const c = chatCache[dayId]; return c ? Object.keys(c).length : 0; }, [chatCache]);
  const sortedMsgs = useCallback((dayId) => {
    const c = chatCache[dayId] || {};
    return Object.keys(c).map(id => Object.assign({ id }, c[id])).sort((a, b) => (a.ts || 0) - (b.ts || 0));
  }, [chatCache]);

  const alertItems = useCallback(() => {
    const items = [];
    days.forEach(d => { const c = chatCache[d.id] || {}, base = seenBase(d.id);
      for (const k in c) { const m = c[k]; if (!isOwnMsg(m) && (m.ts || 0) > base) items.push({ dayId: d.id, dn: d.n, m }); } });
    items.sort((a, b) => (b.m.ts || 0) - (a.m.ts || 0));
    return items;
  }, [chatCache, seenBase, isOwnMsg]);

  const toggleAlerts = useCallback(() => setAlertsOpen(o => !o), []);
  const closeAlerts = useCallback(() => setAlertsOpen(false), []);
  const openAlertDay = useCallback((dayId) => { closeAlerts(); focusChat(dayId); markDaySeen(dayId); }, [closeAlerts, focusChat, markDaySeen]);
  const markAllAndClose = useCallback(() => { markAllSeen(); closeAlerts(); }, [markAllSeen, closeAlerts]);

  const value = {
    remoteReady,
    openChats, toggleChat, focusChat,
    sendMsg, deleteMsg, isAviv,
    chatCount, sortedMsgs,
    unreadForDay, totalUnread, markDaySeen,
    alertsOpen, toggleAlerts, closeAlerts, openAlertDay, markAllAndClose, alertItems,
    toasts, removeToast,
  };
  return <ChatCtx.Provider value={value}>{children}</ChatCtx.Provider>;
}
