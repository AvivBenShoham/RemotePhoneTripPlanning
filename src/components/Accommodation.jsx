import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { useLang } from '../hooks/useLang';
import { NIGHTLY_DEFAULT } from '../data/optionals';
import { accShowing, accCancelText, accCancelClass } from '../lib/format';

export default function Accommodation({ d }) {
  const { store, update } = useStore();
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  if (!d.stay) return null;

  const a = store.acc[d.id] || { booked: false, name: '', price: '', link: '', cancelUntil: '', notes: '' };
  const setBooked = (v) => update(s => { s.acc[d.id] = s.acc[d.id] || {}; s.acc[d.id].booked = v; });
  const setField = (f, v) => update(s => { s.acc[d.id] = s.acc[d.id] || {}; s.acc[d.id][f] = v; });

  return (
    <div className={'acc' + (a.booked ? ' booked' : '') + (open ? ' open' : '')}>
      <div className="acchead" onClick={() => setOpen(o => !o)}>
        <span className="acctitle">{t('acc_title', { stay: d.stay })}</span>
        <span className="accsum">
          <span className={'accstatus' + (a.booked ? ' on' : '')}>{a.booked ? t('acc_booked') : t('acc_not_booked')}</span>
          <span className={accCancelClass(a)}>{accCancelText(a, t)}</span>
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
          <span className="swlbl">{a.booked ? t('acc_booked_short') : t('acc_not_booked_short')}</span>
        </div>
        <div className="accprice-line">{t('acc_nightly_rate')} <span>{accShowing(a, t)}</span></div>
        <div className="btrow">
          <label>{t('acc_place_name')}
            <input type="text" data-sync={`acc/${d.id}/name`} value={a.name || ''} placeholder={t('acc_place_name_ph')} onChange={e => setField('name', e.target.value)} />
          </label>
          <label>{t('acc_price_night')}
            <input type="number" inputMode="decimal" data-sync={`acc/${d.id}/price`} value={a.price !== '' && a.price != null ? a.price : ''}
              placeholder={NIGHTLY_DEFAULT} onChange={e => setField('price', e.target.value)} />
          </label>
        </div>
        <div className="btrow">
          <label>{t('acc_free_cancel_until')}
            <input type="date" data-sync={`acc/${d.id}/cancelUntil`} value={a.cancelUntil || ''} onChange={e => setField('cancelUntil', e.target.value)} />
          </label>
        </div>
        <div className="btrow">
          <label>{t('acc_booking_notes')}
            <input type="text" data-sync={`acc/${d.id}/notes`} value={a.notes || ''} placeholder={t('acc_booking_notes_ph')} onChange={e => setField('notes', e.target.value)} />
          </label>
        </div>
        <div className="btrow">
          <label>{t('acc_booking_link')}
            <input type="url" data-sync={`acc/${d.id}/link`} value={a.link || ''} placeholder="https://…" onChange={e => setField('link', e.target.value)} />
          </label>
        </div>
        {a.link && (
          <div>
            <a className="maplink" style={{ borderRadius: '8px', marginTop: '8px', border: '1px solid var(--line)' }}
              href={a.link} target="_blank" rel="noopener">{t('acc_open_booking')}</a>
          </div>
        )}
      </div>
    </div>
  );
}
