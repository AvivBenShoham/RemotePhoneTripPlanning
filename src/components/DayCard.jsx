import { useStore } from '../hooks/useStore';
import { dayCost, gmapsDir } from '../lib/format';
import { dayWeather } from '../data/days';
import Stop from './Stop';
import DayMap from './DayMap';
import Accommodation from './Accommodation';
import Chat from './Chat';

export default function DayCard({ d, active }) {
  const { store } = useStore();
  const w = dayWeather[d.id];

  return (
    <div className="day">
      <div className="dayhead">
        <div>
          <div className="dnum">{d.n}{d.swap && <span className="tag ahead" style={{ marginLeft: '6px' }}>🔁 swappable</span>}</div>
          <h2>{d.title}</h2>
          <div className="date">{d.date}</div>
        </div>
        <div className="daycost"><div className="dc">${dayCost(store, d)}</div><div className="dcl">day total</div></div>
      </div>
      <DayMap d={d} active={active} />
      <a className="maplink" href={gmapsDir(d)} target="_blank" rel="noopener">🗺️ Open this day's route in Google Maps →</a>
      {w && <a className="maplink" href={w[1]} target="_blank" rel="noopener">🌦️ {w[0]} weather on AccuWeather →</a>}
      <div className="stops">{d.stops.map((s, i) => <Stop key={i} s={s} />)}</div>
      <Accommodation d={d} />
      <Chat d={d} />
    </div>
  );
}
