import { useState } from 'react';
import { useStore } from '../hooks/useStore';

export default function Todo() {
  const { store, update } = useStore();
  const [input, setInput] = useState('');

  const ordered = Object.keys(store.todo || {})
    .map(id => Object.assign({ id }, store.todo[id]))
    .sort((a, b) => (a.ts || 0) - (b.ts || 0));

  const toggle = (id) => update(s => { const it = s.todo[id]; if (it) it.done = !it.done; });
  const remove = (id, ev) => { if (ev) ev.stopPropagation(); update(s => { delete s.todo[id]; }); };
  const add = () => {
    const label = (input || '').trim(); if (!label) return;
    const id = 't' + Date.now();
    update(s => { s.todo[id] = { label, done: false, ts: Date.now() }; });
    setInput('');
  };

  return (
    <div className="todo">
      <div className="todohead">✅ Trip To-Do</div>
      <div>
        {ordered.map(it => (
          <div key={it.id} className={'todoitem' + (it.done ? ' done' : '')} onClick={() => toggle(it.id)}>
            <div className="todocheck">{it.done ? '✓' : ''}</div>
            <div className="todotext">{it.label}</div>
            <button className="todorm" title="Remove" onClick={(e) => remove(it.id, e)}>×</button>
          </div>
        ))}
        <div className="todoadd">
          <input type="text" value={input} placeholder="Add a task…"
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
          <button className="todoaddbtn" onClick={add}>Add</button>
        </div>
      </div>
    </div>
  );
}
