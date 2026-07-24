import { useAuth } from '../hooks/useAuth';
import { useStore } from '../hooks/useStore';
import { days } from '../data/days';
import { dayCost } from '../lib/format';
import { cap } from '../lib/format';

export default function Hero() {
  const { authReady, user, logout, currentName } = useAuth();
  const { store } = useStore();
  const grand = days.reduce((s, d) => s + dayCost(store, d), 0);

  // Log out control only shows when a real auth session exists (matches original).
  const showLogout = authReady && !!user;
  const name = currentName();
  const logoutLabel = 'Log out' + (name ? ' (' + cap(name) + ')' : '');

  return (
    <header className="hero">
      {showLogout && <button className="logoutbtn" onClick={logout}>{logoutLabel}</button>}
      <div className="wrap">
        <h1>🌴 Dominican Republic</h1>
        <div className="sub">A high-energy 10-day loop for two · Aug 13 – 22, 2026</div>
        <div className="statgrid">
          <div className="stat"><div className="n">10</div><div className="l">Days</div></div>
          <div className="stat"><div className="n">9</div><div className="l">Nights</div></div>
          <div className="stat"><div className="n">4</div><div className="l">Regions</div></div>
        </div>
        <div className="route-pill">📍 Santo Domingo <span className="arw">→</span> Samaná <span className="arw">→</span>
          Bayahibe / Saona <span className="arw">→</span> Punta Cana <span className="arw">→</span> Santo Domingo</div>
        <div className="livewrap"><div className="lbl">Total Trip Cost</div>
          <div className="amt">$<span>{grand.toLocaleString()}</span> <small>USD</small></div></div>
      </div>
    </header>
  );
}
