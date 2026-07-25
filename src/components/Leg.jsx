import { icoFor } from '../lib/format';
import { useLang } from '../hooks/useLang';

export default function Leg({ s }) {
  const { t } = useLang();
  return (
    <div className="leg"><div className="rail"><div className="dot"></div></div>
      <div className="legpill">{icoFor(s.mode)} {s.leg} {s.op && <span className="op">· {s.op}</span>}
        {s.cost > 0
          ? <span className="chip money"><span className="ico cost">💵</span>${s.cost}</span>
          : <span className="op">{t('leg_incl')}</span>}
      </div>
    </div>
  );
}
