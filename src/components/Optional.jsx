import { useStore } from '../hooks/useStore';
import { optionals } from '../data/optionals';

export default function Optional({ optKey }) {
  const { store, update } = useStore();
  const o = optionals[optKey];
  const cur = store.opt[optKey] || o.def;
  const pick = (v) => update(s => { s.opt[optKey] = v; });

  return (
    <div className="opt">
      <div className="opthead">🔀 {o.label} — tap to choose</div>
      <div className="optbtns">
        {Object.entries(o.choices).map(([k, c]) => (
          <button key={k} className={'optbtn' + (k === cur ? ' on' : '')} onClick={() => pick(k)}>
            <div className="obn">{c.name} {c.rec && <span className="rec">PICK</span>}</div>
            <div className="obc">{c.desc}</div>
            <div className="obp">{c.cost > 0 ? '$' + c.cost : 'Free'}</div>
          </button>
        ))}
      </div>
      <div className="optnote">{o.note}</div>
    </div>
  );
}
