import { useEffect, useState } from 'react';
import { useChat } from '../hooks/useChat';
import { cap, fmtTime } from '../lib/format';

function Toast({ t, onClick, onClose }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setShow(true)); return () => cancelAnimationFrame(id); }, []);
  return (
    <div className={'toast' + (show ? ' show' : '')} onClick={onClick}>
      <span>💬</span>
      <div style={{ minWidth: 0 }}>
        <div className="tname">{t.title}</div>
        <div className="ttext">{t.body}</div>
      </div>
      <span className="tclose" onClick={(e) => { e.stopPropagation(); onClose(); }}>✕</span>
    </div>
  );
}

export default function Alerts() {
  const {
    remoteReady, totalUnread, alertsOpen, toggleAlerts, closeAlerts, openAlertDay,
    markAllAndClose, alertItems, toasts, removeToast, focusChat,
  } = useChat();

  const n = totalUnread();
  const items = alertItems();

  return (
    <>
      <div className="toastwrap">
        {toasts.map(t => (
          <Toast key={t.id} t={t}
            onClick={() => { focusChat(t.dayId); removeToast(t.id); }}
            onClose={() => removeToast(t.id)} />
        ))}
      </div>

      <button className={'alertsbtn' + (remoteReady ? ' on' : '')} onClick={toggleAlerts}>
        🔔<span className={'alertsbadge' + (n ? ' on' : '')}>{n ? (n > 99 ? '99+' : String(n)) : ''}</span>
      </button>

      <div className={'overlay' + (alertsOpen ? ' open' : '')} onClick={closeAlerts}></div>
      <aside className={'panel' + (alertsOpen ? ' open' : '')}>
        <div className="panelhead"><h2>🔔 Unread messages</h2><button className="x" onClick={closeAlerts}>✕</button></div>
        <button className="markall" onClick={markAllAndClose}>Mark all as read</button>
        <div>
          {items.length === 0
            ? <div className="alertsempty">🎉 You're all caught up — no unread messages.</div>
            : items.map((it, i) => (
              <div className="alertitem" key={i} onClick={() => openAlertDay(it.dayId)}>
                <div className="alertmeta">
                  <span className="alertday">{it.dn}</span>
                  <span className="alertname">{cap(it.m.name || 'Someone')}</span>
                  <span className="alerttime">{fmtTime(it.m.ts)}</span>
                </div>
                <div className="alerttext">{(it.m.text || '').slice(0, 160).split('\n').map((line, li, arr) => (
                  <span key={li}>{line}{li < arr.length - 1 && <br />}</span>
                ))}</div>
              </div>
            ))}
        </div>
      </aside>
    </>
  );
}
