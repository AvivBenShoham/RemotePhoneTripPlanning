import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { NIGHTLY_DEFAULT } from '../data/optionals';
import { accShowing, accCancelText, accCancelClass } from '../lib/format';

export default function Accommodation({ d }) {
  const { store, update } = useStore();
  const [open, setOpen] = useState(false);
  if (!d.stay) return null;

  const a = store.acc[d.id] || { booked: false, name: '', price: '', link: '', cancelUntil: '', notes: '' };
  const setBooked = (v) => update(s => { s.acc[d.id] = s.acc[d.id] || {}; s.acc[d.id].booked = v; });
  const setField = (f, v) => update(s => { s.acc[d.id] = s.acc[d.id] || {}; s.acc[d.id][f] = v; });

  return (
    <div className={'acc' + (a.booked ? ' booked' : '') + (open ? ' open' : '')}>
      <div className="acchead" onClick={() => setOpen(o => !o)}>
        <span className="acctitle">🏨 Accommodation — {d.stay}</span>
        <span className="accsum">
          <span className={'accstatus' + (a.booked ? ' on' : '')}>{a.booked ? '✅ Booked' : '🕓 Not booked'}</span>
          <span className={accCancelClass(a)}>{accCancelText(a)}</span>
        </span>
        <span className="accchev">▾</span>
      </div>
      {a.notes && <div><div className="accnote">📝 {a.notes}</div></div>}
      <div className="accbody">
        <div className="switch" style={{ marginTop: '8px' }}>
          <label className="toggle">
            <input type="checkbox" checked={!!a.booked} onChange={e => setBooked(e.target.checked)} />
            <span className="slider"></span>
          </label>
          <span className="swlbl">{a.booked ? 'Booked' : 'Not booked'}</span>
        </div>
        <div className="accprice-line">Nightly rate: <span>{accShowing(a)}</span></div>
        <div className="btrow">
          <label>Place name
            <input type="text" value={a.name || ''} placeholder="Hotel / Airbnb name" onChange={e => setField('name', e.target.value)} />
          </label>
          <label>Price · night (USD)
            <input type="number" inputMode="decimal" value={a.price !== '' && a.price != null ? a.price : ''}
              placeholder={NIGHTLY_DEFAULT} onChange={e => setField('price', e.target.value)} />
          </label>
        </div>
        <div className="btrow">
          <label>Free cancellation until
            <input type="date" value={a.cancelUntil || ''} onChange={e => setField('cancelUntil', e.target.value)} />
          </label>
        </div>
        <div className="btrow">
          <label>Booking notes
            <input type="text" value={a.notes || ''} placeholder="e.g. free cancellation until 28/07" onChange={e => setField('notes', e.target.value)} />
          </label>
        </div>
        <div className="btrow">
          <label>Booking link
            <input type="url" value={a.link || ''} placeholder="https://…" onChange={e => setField('link', e.target.value)} />
          </label>
        </div>
        {a.link && (
          <div>
            <a className="maplink" style={{ borderRadius: '8px', marginTop: '8px', border: '1px solid var(--line)' }}
              href={a.link} target="_blank" rel="noopener">🔗 Open booking →</a>
          </div>
        )}
      </div>
    </div>
  );
}
