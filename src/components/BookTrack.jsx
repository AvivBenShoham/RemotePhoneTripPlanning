import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { useLang } from '../hooks/useLang';

export default function BookTrack({ b }) {
  const { store, update } = useStore();
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const st = store.book[b.key] || { done: false, agency: b.defAgency || '', price: b.defPrice || '' };

  const setBooked = (v) => update(s => { s.book[b.key] = s.book[b.key] || {}; s.book[b.key].done = v; });
  const setField = (f, v) => update(s => { s.book[b.key] = s.book[b.key] || {}; s.book[b.key][f] = v; });

  return (
    <div className={'booktrack' + (st.done ? ' isdone' : '') + (open ? ' open' : '')}>
      <div className="bthead" onClick={() => setOpen(o => !o)}>
        <span>{t('bt_tracker', { label: b.label })}</span>
        <span className="status">{st.done ? t('bt_booked') : t('bt_buy_ahead')}</span>
      </div>
      <div className="btbody">
        <div className="switch">
          <label className="toggle">
            <input type="checkbox" checked={!!st.done} onChange={e => setBooked(e.target.checked)} />
            <span className="slider"></span>
          </label>
          <span className="swlbl">{t('bt_mark_booked')}</span>
        </div>
        <div className="btrow">
          <label>{t('bt_agency')}
            <input type="text" data-sync={`book/${b.key}/agency`} value={st.agency || ''} placeholder={b.placeAg || 'Agency name'}
              onChange={e => setField('agency', e.target.value)} />
          </label>
          <label>{t('bt_price_couple')}
            <input type="number" inputMode="decimal" data-sync={`book/${b.key}/price`} value={st.price !== '' && st.price != null ? st.price : ''}
              placeholder={b.defPrice || ''} onChange={e => setField('price', e.target.value)} />
          </label>
        </div>
      </div>
    </div>
  );
}
