import { useStore } from '../hooks/useStore';
import { useLang } from '../hooks/useLang';
import { days } from '../data/days';
import { accOptions, accPrimary, optPrice, fmtCancelDate, daysUntil } from '../lib/format';

// "Booked" tab — everything already booked in one place: booked accommodation
// options (a night can have more than one) and booked activities/tours, plus
// the free-cancellation deadlines that are still open.
export default function Booked() {
  const { store } = useStore();
  const { t } = useLang();

  // booked stays: every booked option of every night, not just the main pick
  const stays = [];
  days.forEach(d => {
    if (!d.stay) return;
    const rec = store.acc[d.id];
    const opts = accOptions(rec);
    const main = accPrimary(rec);
    opts.forEach((o, i) => {
      if (!o.booked) return;
      stays.push({ d, o, n: i + 1, of: opts.length, isMain: !!main && main.id === o.id });
    });
  });

  // booked activities / tours (booking trackers marked done)
  const acts = [];
  days.forEach(d => d.stops.forEach(s => {
    if (!s.book) return;
    const st = store.book[s.book.key];
    if (st && st.done) acts.push({ d, b: s.book, st });
  }));

  const actPrice = (x) => (x.st.price !== '' && x.st.price != null && !isNaN(x.st.price)) ? Number(x.st.price) : (x.b.defPrice || 0);
  const stayTotal = stays.reduce((s, x) => s + optPrice(x.o), 0);
  const actTotal = acts.reduce((s, x) => s + actPrice(x), 0);
  const extras = stays.filter(x => !x.isMain).length;   // held duplicates for a night

  // open free-cancellation deadlines across booked stays, soonest first
  const deadlines = stays
    .map(x => ({ ...x, left: daysUntil(x.o.cancelUntil) }))
    .filter(x => x.left != null && x.left >= 0)
    .sort((a, b) => a.left - b.left);

  const nothing = !stays.length && !acts.length;

  const leftText = (left, date) => left === 0 ? t('bk_cancel_today')
    : left === 1 ? t('bk_cancel_tomorrow')
    : t('bk_cancel_in', { date: fmtCancelDate(date), n: left });

  return (
    <div>
      <div className="ovstats">
        <div className="ovstat"><div className="n">${(stayTotal + actTotal).toLocaleString()}</div><div className="l">{t('bk_total_booked')}</div></div>
        <div className="ovstat"><div className="n">{stays.length}</div><div className="l">{t('bk_stays_count')}</div></div>
        <div className="ovstat"><div className="n">{acts.length}</div><div className="l">{t('bk_acts_count')}</div></div>
        <div className="ovstat"><div className="n">{deadlines.length}</div><div className="l">{t('bk_open_deadlines')}</div></div>
      </div>

      {nothing && <div className="ovcard"><div className="bkempty">{t('bk_empty')}</div></div>}

      {deadlines.length > 0 && (
        <div className="ovcard">
          <h3>{t('bk_head_deadlines')}</h3>
          {deadlines.map((x, i) => (
            <div className={'bkdl' + (x.left <= 2 ? ' soon' : '')} key={i}>
              <span className="bkdlname">{x.o.name || t('bk_unnamed')} <span className="bkdlday">· {x.d.n}</span></span>
              <span className="bkdlleft">{leftText(x.left, x.o.cancelUntil)}</span>
            </div>
          ))}
          <div className="ovnote">{t('bk_reminders_note')}</div>
        </div>
      )}

      {stays.length > 0 && (
        <div className="ovcard">
          <h3>{t('bk_head_stays')} · ${stayTotal.toLocaleString()}</h3>
          {stays.map((x, i) => {
            const left = daysUntil(x.o.cancelUntil);
            return (
              <div className="bkitem" key={i}>
                <div className="bkhead">
                  <span className="bkname">{x.o.name || t('bk_unnamed')}</span>
                  <span className="bkprice">${optPrice(x.o).toLocaleString()}<small>{t('bk_per_night')}</small></span>
                </div>
                <div className="bkmeta">
                  <span className="bkwhen">{x.d.n} · {x.d.date} · {x.d.stay}</span>
                  {x.of > 1 && <span className={'bktag' + (x.isMain ? ' main' : '')}>{x.isMain ? t('bk_main_pick') : t('bk_extra_option', { n: x.n, m: x.of })}</span>}
                </div>
                <div className="bkmeta">
                  {x.o.cancelUntil
                    ? <span className={'bkcancel' + (left != null && left >= 0 && left <= 2 ? ' soon' : '') + (left != null && left < 0 ? ' gone' : '')}>
                        {left != null && left < 0
                          ? t('bk_cancel_passed', { date: fmtCancelDate(x.o.cancelUntil) })
                          : '🟢 ' + leftText(left, x.o.cancelUntil)}
                      </span>
                    : <span className="bkcancel gone">{t('acc_cancel_none')}</span>}
                </div>
                {x.o.notes && <div className="bknote">📝 {x.o.notes}</div>}
                {x.o.link && <a className="bklink" href={x.o.link} target="_blank" rel="noopener">{t('acc_open_booking')}</a>}
              </div>
            );
          })}
          {extras > 0 && <div className="ovnote">{t('bk_note_multi')}</div>}
        </div>
      )}

      {acts.length > 0 && (
        <div className="ovcard">
          <h3>{t('bk_head_acts')} · ${actTotal.toLocaleString()}</h3>
          {acts.map((x, i) => (
            <div className="bkitem" key={i}>
              <div className="bkhead">
                <span className="bkname">{x.b.label}</span>
                <span className="bkprice">${actPrice(x).toLocaleString()}</span>
              </div>
              <div className="bkmeta">
                <span className="bkwhen">{x.d.n} · {x.d.date}</span>
                {x.st.agency && <span className="bktag">{t('bk_agency')}: {x.st.agency}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
