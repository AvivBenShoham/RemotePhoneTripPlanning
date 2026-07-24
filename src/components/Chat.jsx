import { useEffect, useRef, useState } from 'react';
import { useChat } from '../hooks/useChat';
import { cap, fmtTime } from '../lib/format';

function Msg({ dayId, m, canDelete, onDelete }) {
  return (
    <div className="msg">
      <div className="msgmeta">
        <span className="msgname">{cap(m.name || 'Someone')}</span>
        <span className="msgtime">{fmtTime(m.ts)}</span>
        {canDelete && <button className="msgdel" title="Delete message" onClick={() => onDelete(dayId, m.id)}>✕</button>}
      </div>
      <div className="msgtext">{(m.text || '').split('\n').map((line, i, arr) => (
        <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
      ))}</div>
    </div>
  );
}

export default function Chat({ d }) {
  const { remoteReady, openChats, toggleChat, sendMsg, deleteMsg, isAviv, chatCount, sortedMsgs, unreadForDay } = useChat();
  const open = !!openChats[d.id];
  const msgs = sortedMsgs(d.id);
  const n = chatCount(d.id);
  const unread = unreadForDay(d.id);

  const [text, setText] = useState('');
  const listRef = useRef(null);
  const taRef = useRef(null);

  // keep scrolled to bottom when near the bottom and new messages arrive
  useEffect(() => {
    const list = listRef.current; if (!list) return;
    const atBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 40;
    if (atBottom) list.scrollTop = list.scrollHeight;
  }, [msgs.length, open]);

  // focus the composer shortly after the panel opens (matches original)
  useEffect(() => { if (open && taRef.current) { const id = setTimeout(() => taRef.current && taRef.current.focus(), 60); return () => clearTimeout(id); } }, [open]);

  const autosize = (ta) => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'; };
  const onInput = (e) => { setText(e.target.value); autosize(e.target); };
  const send = () => { const t = text; setText(''); if (taRef.current) { taRef.current.style.height = 'auto'; } sendMsg(d.id, t); };
  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <div className={'chat' + (open ? ' open' : '')} id={'chat-' + d.id}>
      <div className="chathead" onClick={() => toggleChat(d.id)}>
        <span>💬 Day chat</span>
        <span className="chatcount">{n ? n : ''}</span>
        <span className={'chatunread' + (unread ? ' on' : '')}>{unread ? String(unread) : ''}</span>
        <span className="chatchev">▾</span>
      </div>
      <div className="chatbody">
        {remoteReady ? (
          <>
            <div className="chatlist" ref={listRef}>
              {msgs.length
                ? msgs.map(m => <Msg key={m.id} dayId={d.id} m={m} canDelete={isAviv()} onDelete={deleteMsg} />)
                : <div className="chatempty">No messages yet — start the conversation.</div>}
            </div>
            <div className="chatcompose">
              <textarea ref={taRef} className="chatinput" rows="1" maxLength="2000"
                placeholder="Write a note, reminder or debate for this day…"
                value={text} onChange={onInput} onKeyDown={onKey} />
              <button className="chatsend" onClick={send} aria-label="Send message">➤</button>
            </div>
          </>
        ) : (
          <div className="chatoffline">💤 Day chat needs the live online page to sync.</div>
        )}
      </div>
    </div>
  );
}
