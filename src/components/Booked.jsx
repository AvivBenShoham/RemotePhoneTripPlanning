import { useStore } from '../hooks/useStore';
import { useLang } from '../hooks/useLang';
import { days } from '../data/days';
import { stays } from '../data/stays';
import { accOptions, accPrimary, optNightly, optTotal, money, fmtCancelDate, daysUntil } from '../lib/format';

// "Booked" tab — everything already booked in one place: booked accommodation
// (one entry per reservation, covering all the nights of that stay) and booked
// activities, plus the free-cancellation deadlines that are still open.
export default function Booked() {
  const { store } = useStore();
  const { t } = useLang();

  // booked stays: every booked option of every stay, not just the main pick
  const booked = [];
  stays.forEach(stay => {
    const rec = store.acc[stay.id];
    const opts = accOptions(rec);
    const main = accPrimary(rec);
    opts.forEach((o, i) => {
      if (!o.booked) return;
      booked.push({ stay, o, n: i + 1, of: opts.length, isMain: !!main && main.id === o.id });
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
  const stayTotal = booked.reduce((s, x) => s + optTotal(x.o, x.stay.nights), 0);
  const actTotal = acts.reduce((s, x) => s + actPrice(x), 0);
  const extras = booked.filter(x => !x.isMain).length;   // duplicate reservations held for one place

  // open free-cancellation deadlines, soonest first
  const deadlines = booked
    .map(x => ({ ...x, left: daysUntil(x.o.cancelUntil) }))
    .filter(x => x.left != null && x.left >= 0)
    .sort((a, b) => a.left - b.left);

  const nothing = !booked.length && !acts.length;

  const leftText = (left, date) => left === 0 ? t('bk_cancel_today')
    : left === 1 ? t('bk_cancel_tomorrow')
    : t('bk_cancel_in', { date: fmtCancelDate(date), n: left });
  const rangeOf = (stay) => stay.dayNums.length > 1
    ? t('ov_days_range', { a: stay.dayNums[0], b: stay.dayNums[stay.dayNums.length - 1] })
    : t('ov_day_single', { a: stay.dayNums[0] });

  return (
    <div>
      <div className="ovstats">
        <div className="ovstat"><div className="n">{money(stayTotal + actTotal)}</div><div className="l">{t('bk_total_booked')}</div></div>
        <div className="ovstat"><div className="n">{booked.length}</div><div className="l">{t('bk_stays_count')}</div></div>
        <div className="ovstat"><div className="n">{acts.length}</div><div className="l">{t('bk_acts_count')}</div></div>
        <div className="ovstat"><div className="n">{deadlines.length}</div><div className="l">{t('bk_open_deadlines')}</div></div>
      </div>

      {nothing && <div className="ovcard"><div className="bkempty">{t('bk_empty')}</div></div>}

      {deadlines.length > 0 && (
        <div className="ovcard">
          <h3>{t('bk_head_deadlines')}</h3>
          {deadlines.map((x, i) => (
            <div className={'bkdl' + (x.left <= 2 ? ' soon' : '')} key={i}>
              <span className="bkdlname">{x.o.name || t('bk_unnamed')} <span className="bkdlday">· {x.stay.name}</span></span>
              <span className="bkdlleft">{leftText(x.left, x.o.cancelUntil)}</span>
            </div>
          ))}
          <div className="ovnote">{t('bk_reminders_note')}</div>
        </div>
      )}

      {booked.length > 0 && (
        <div className="ovcard">
          <h3>{t('bk_head_stays')} · {money(stayTotal)}</h3>
          {booked.map((x, i) => {
            const left = daysUntil(x.o.cancelUntil);
            const nights = x.stay.nights;
            return (
              <div className="bkitem" key={i}>
                <div className="bkhead">
                  <span className="bkname">{x.o.name || t('bk_unnamed')}</span>
                  <span className="bkprice">{money(optTotal(x.o, nights))}<small>{t('bk_nights_total', { n: nights })}</small></span>
                </div>
                <div className="bkmeta">
                  <span className="bkwhen">{x.stay.name} · {rangeOf(x.stay)} · {money(optNightly(x.o, nights))}{t('bk_per_night')}</span>
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
          <h3>{t('bk_head_acts')} · {money(actTotal)}</h3>
          {acts.map((x, i) => (
            <div className="bkitem" key={i}>
              <div className="bkhead">
                <span className="bkname">{x.b.label}</span>
                <span className="bkprice">{money(actPrice(x))}</span>
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
