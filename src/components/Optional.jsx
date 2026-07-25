import { useStore } from '../hooks/useStore';
import { useLang } from '../hooks/useLang';
import { optionals } from '../data/optionals';

export default function Optional({ optKey }) {
  const { store, update } = useStore();
  const { t } = useLang();
  const o = optionals[optKey];
  const cur = store.opt[optKey] || o.def;
  const pick = (v) => update(s => { s.opt[optKey] = v; });

  return (
    <div className="opt">
      <div className="opthead">{t('opt_head', { label: o.label })}</div>
      <div className="optbtns">
        {Object.entries(o.choices).map(([k, c]) => (
          <button key={k} className={'optbtn' + (k === cur ? ' on' : '')} onClick={() => pick(k)}>
            <div className="obn">{c.name} {c.rec && <span className="rec">{t('opt_pick')}</span>}</div>
            <div className="obc">{c.desc}</div>
            <div className="obp">{c.cost > 0 ? '$' + c.cost : t('opt_free')}</div>
          </button>
        ))}
      </div>
      <div className="optnote">{o.note}</div>
    </div>
  );
}
