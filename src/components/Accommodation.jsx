import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { useLang } from '../hooks/useLang';
import { NIGHTLY_DEFAULT } from '../data/optionals';
import {
  accShowing, accCancelText, accCancelClass, accOptions, accPrimary, accAnyBooked,
  accBookedOptions, emptyAccOption, ensureAccOptions, nextOptId,
} from '../lib/format';

// One night's accommodation. A night can hold several options (two hotels held
// for the same date while you decide); one is the "main pick" that counts
// toward the day/trip totals.
export default function Accommodation({ d }) {
  const { store, update } = useStore();
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  if (!d.stay) return null;

  const a = store.acc[d.id];
  // a night that has never been touched still shows one blank option form
  const opts = accOptions(a);
  const shown = opts.length ? opts : [{ id: 'o1', ...emptyAccOption(0) }];
  const primary = accPrimary(a) || shown[0];
  const booked = accBookedOptions(a);
  const anyBooked = accAnyBooked(a);
  const notes = shown.map(o => o.notes).filter(Boolean);

  const setField = (optId, f, v) => update(s => {
    const rec = ensureAccOptions(s, d.id);
    rec.options[optId] = rec.options[optId] || emptyAccOption(Date.now());
    rec.options[optId][f] = v;
  });
  const setChosen = (optId) => update(s => { ensureAccOptions(s, d.id).chosen = optId; });
  const addOption = () => update(s => {
    const rec = ensureAccOptions(s, d.id);
    rec.options[nextOptId(rec)] = emptyAccOption(Date.now());
  });
  const removeOption = (optId) => {
    if (!confirm(t('acc_remove_confirm'))) return;
    update(s => {
      const rec = ensureAccOptions(s, d.id);
      delete rec.options[optId];
      if (!Object.keys(rec.options).length) rec.options[nextOptId(rec)] = emptyAccOption(Date.now());
      if (rec.chosen === optId) rec.chosen = Object.keys(rec.options)[0] || '';
    });
  };

  return (
    <div className={'acc' + (anyBooked ? ' booked' : '') + (open ? ' open' : '')}>
      <div className="acchead" onClick={() => setOpen(o => !o)}>
        <span className="acctitle">{t('acc_title', { stay: d.stay })}</span>
        <span className="accsum">
          {shown.length > 1 && <span className="accopts">{t('acc_options_count', { n: shown.length })}</span>}
          <span className={'accstatus' + (anyBooked ? ' on' : '')}>
            {booked.length > 1 ? t('acc_booked_n', { n: booked.length }) : anyBooked ? t('acc_booked') : t('acc_not_booked')}
          </span>
          <span className={accCancelClass(primary)}>{accCancelText(primary, t)}</span>
        </span>
        <span className="accchev">▾</span>
      </div>
      {notes.length > 0 && <div>{notes.map((n, i) => <div className="accnote" key={i}>📝 {n}</div>)}</div>}
      <div className="accbody">
        {shown.map((o, i) => {
          const isMain = o.id === primary.id;
          const p = `acc/${d.id}/options/${o.id}`;
          return (
            <div className={'accopt' + (o.booked ? ' isbooked' : '') + (isMain ? ' ismain' : '')} key={o.id}>
              <div className="accopthead">
                <span className="accoptname">
                  {t('acc_option', { n: i + 1 })}{o.name ? ' · ' + o.name : ''}
                </span>
                {isMain
                  ? <span className="accmain">{t('acc_chosen')}</span>
                  : <button type="button" className="accpick" onClick={() => setChosen(o.id)}>{t('acc_pick_main')}</button>}
                {shown.length > 1 && (
                  <button type="button" className="accrm" title={t('acc_remove_option')}
                    onClick={() => removeOption(o.id)}>✕</button>
                )}
              </div>
              <div className="switch" style={{ marginTop: '6px' }}>
                <label className="toggle">
                  <input type="checkbox" checked={!!o.booked} onChange={e => setField(o.id, 'booked', e.target.checked)} />
                  <span className="slider"></span>
                </label>
                <span className="swlbl">{o.booked ? t('acc_booked_short') : t('acc_not_booked_short')}</span>
              </div>
              <div className="accprice-line">
                {t('acc_nightly_rate')} <span>{accShowing(o, t)}</span>
                {isMain && <em className="accintotal"> · {t('acc_in_total')}</em>}
              </div>
              <div className="btrow">
                <label>{t('acc_place_name')}
                  <input type="text" data-sync={`${p}/name`} value={o.name || ''} placeholder={t('acc_place_name_ph')}
                    onChange={e => setField(o.id, 'name', e.target.value)} />
                </label>
                <label>{t('acc_price_night')}
                  <input type="number" inputMode="decimal" data-sync={`${p}/price`} value={o.price !== '' && o.price != null ? o.price : ''}
                    placeholder={NIGHTLY_DEFAULT} onChange={e => setField(o.id, 'price', e.target.value)} />
                </label>
              </div>
              <div className="btrow">
                <label>{t('acc_free_cancel_until')}
                  <input type="date" data-sync={`${p}/cancelUntil`} value={o.cancelUntil || ''}
                    onChange={e => setField(o.id, 'cancelUntil', e.target.value)} />
                </label>
              </div>
              <div className="btrow">
                <label>{t('acc_booking_notes')}
                  <input type="text" data-sync={`${p}/notes`} value={o.notes || ''} placeholder={t('acc_booking_notes_ph')}
                    onChange={e => setField(o.id, 'notes', e.target.value)} />
                </label>
              </div>
              <div className="btrow">
                <label>{t('acc_booking_link')}
                  <input type="url" data-sync={`${p}/link`} value={o.link || ''} placeholder="https://…"
                    onChange={e => setField(o.id, 'link', e.target.value)} />
                </label>
              </div>
              {o.link && (
                <div>
                  <a className="maplink" style={{ borderRadius: '8px', marginTop: '8px', border: '1px solid var(--line)' }}
                    href={o.link} target="_blank" rel="noopener">{t('acc_open_booking')}</a>
                </div>
              )}
            </div>
          );
        })}
        <button type="button" className="accadd" onClick={addOption}>{t('acc_add_option')}</button>
      </div>
    </div>
  );
}
