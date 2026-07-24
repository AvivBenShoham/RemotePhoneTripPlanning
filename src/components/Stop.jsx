import Leg from './Leg';
import Optional from './Optional';
import BookTrack from './BookTrack';

export default function Stop({ s }) {
  if (s.leg !== undefined) return <Leg s={s} />;
  if (s.optional !== undefined) return <Optional optKey={s.optional} />;

  const tag = s.book
    ? <span className="tag ahead">🕓 Buy ahead</span>
    : s.spot ? <span className="tag spot">📍 On the spot</span>
    : s.free ? <span className="tag spot">📍 Free</span> : null;

  return (
    <div className="stop">
      <div className="stime">{s.t}</div>
      <div className="sbody">
        <div className="stitle"><span className="ico act">{s.act || '📍'}</span> {s.title} {tag}</div>
        <div className="sdesc">{s.desc || ''}</div>
        <div className="meta">
          {s.cost > 0 && <span className="chip money"><span className="ico cost">💵</span>${s.cost}{s.range ? ' *' : ''}</span>}
          {s.op && <span className="chip">{s.op}</span>}
        </div>
        {s.book && <BookTrack b={s.book} />}
      </div>
    </div>
  );
}
