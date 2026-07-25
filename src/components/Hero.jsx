import { useAuth } from '../hooks/useAuth';
import { useStore } from '../hooks/useStore';
import { useLang } from '../hooks/useLang';
import { days } from '../data/days';
import { dayCost } from '../lib/format';
import { cap } from '../lib/format';

export default function Hero() {
  const { authReady, user, logout, currentName } = useAuth();
  const { store } = useStore();
  const { lang, setLang, t } = useLang();
  const grand = days.reduce((s, d) => s + dayCost(store, d), 0);

  // Log out control only shows when a real auth session exists (matches original).
  const showLogout = authReady && !!user;
  const name = currentName();
  const logoutLabel = t('logout') + (name ? ' (' + cap(name) + ')' : '');

  return (
    <header className="hero">
      <div className="langtoggle" role="group" aria-label="Language">
        <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')} aria-pressed={lang === 'en'}>EN</button>
        <button className={lang === 'es' ? 'on' : ''} onClick={() => setLang('es')} aria-pressed={lang === 'es'}>ES</button>
      </div>
      {showLogout && <button className="logoutbtn" onClick={logout}>{logoutLabel}</button>}
      <div className="wrap">
        <h1>🌴 Dominican Republic</h1>
        <div className="sub">{t('hero_sub')}</div>
        <div className="statgrid">
          <div className="stat"><div className="n">10</div><div className="l">{t('stat_days')}</div></div>
          <div className="stat"><div className="n">9</div><div className="l">{t('stat_nights')}</div></div>
          <div className="stat"><div className="n">4</div><div className="l">{t('stat_regions')}</div></div>
        </div>
        <div className="route-pill">📍 Santo Domingo <span className="arw">→</span> Samaná <span className="arw">→</span>
          Bayahibe / Saona <span className="arw">→</span> Punta Cana <span className="arw">→</span> Santo Domingo</div>
        <div className="livewrap"><div className="lbl">{t('total_trip_cost')}</div>
          <div className="amt">$<span>{grand.toLocaleString()}</span> <small>USD</small></div></div>
      </div>
    </header>
  );
}
