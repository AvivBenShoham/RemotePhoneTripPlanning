import { useStore } from '../hooks/useStore';
import { useLang } from '../hooks/useLang';
import { days } from '../data/days';
import { dayCost, transitMins, fmtMins, dayAttractions, shortAttr } from '../lib/format';

export default function Overview() {
  const { store } = useStore();
  const { t } = useLang();

  const total = days.reduce((s, d) => s + dayCost(store, d), 0);
  const nights = days.filter(d => d.stay).length;
  const tmins = transitMins(days);
  const transCost = days.reduce((s, d) => s + d.stops.reduce((a, x) => a + (x.leg !== undefined && x.cost ? x.cost : 0), 0), 0);

  // group consecutive days by stay (skip fly-home null day)
  const groups = []; let cur = null;
  days.forEach(d => {
    if (!d.stay) return;
    if (cur && cur.stay === d.stay) { cur.days.push(d); }
    else { cur = { stay: d.stay, days: [d], startN: d.n }; groups.push(cur); }
  });

  const parts = [];
  days.forEach(d => {
    const legs = d.stops.filter(s => s.mins).map(s => ({ label: s.leg || s.title, mins: Number(s.mins) || 0 }));
    if (!legs.length) return;
    parts.push({ label: d.n + ' · ' + d.title, sub: legs.reduce((a, l) => a + l.mins, 0), legs });
  });

  return (
    <div>
      <div className="ovstats">
        <div className="ovstat"><div className="n">${total.toLocaleString()}</div><div className="l">{t('ov_total_cost')}</div></div>
        <div className="ovstat"><div className="n">~{fmtMins(tmins)}</div><div className="l">{t('ov_in_transit')}</div></div>
        <div className="ovstat"><div className="n">{days.length}</div><div className="l">{t('ov_days')}</div></div>
        <div className="ovstat"><div className="n">{nights}</div><div className="l">{t('ov_nights')}</div></div>
      </div>

      <div className="ovcard">
        <h3>{t('ov_where_sleep')}</h3>
        {groups.map((g, gi) => {
          const n = g.days.length;
          const dayNums = g.days.map(d => d.n.replace('Day ', '')).filter((v, i, a) => a.indexOf(v) === i);
          const range = dayNums.length > 1
            ? t('ov_days_range', { a: dayNums[0], b: dayNums[dayNums.length - 1] })
            : t('ov_day_single', { a: dayNums[0] });
          const attrs = []; g.days.forEach(d => dayAttractions(store, d).forEach(a => attrs.push(a)));
          return (
            <div className="ovplace" key={gi}>
              <div className="ph"><span className="pn">{g.stay}</span><span className="pd">{n} {t(n > 1 ? 'ov_nights_plural' : 'ov_night')} · {range}</span></div>
              {attrs.length > 0 && (
                <ul className="ovlist">
                  {attrs.map((a, ai) => <li key={ai}><span className="em">{a.emoji}</span>{shortAttr(a.label)}</li>)}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <div className="ovcard">
        <h3>{t('ov_getting_around')}</h3>
        <div className="ovtrans" style={{ borderBottom: '2px solid var(--line)' }}>
          <span className="tt"><b>{t('ov_total_ground')}</b></span>
          <span className="tm">~{fmtMins(tmins)} · ${transCost}</span>
        </div>
        {parts.map((p, pi) => (
          <div className="ovpart" key={pi}>
            <div className="ph"><span className="pl">{p.label}</span><span className="pm">~{fmtMins(p.sub)}</span></div>
            {p.legs.map((l, li) => (
              <div className="ovsub" key={li}><span className="tt">{l.label}</span><span className="tm">~{fmtMins(l.mins)}</span></div>
            ))}
          </div>
        ))}
        <div className="ovnote">{t('ov_note')}</div>
      </div>
    </div>
  );
}
