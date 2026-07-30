import { useState } from 'react';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { StoreProvider } from '../hooks/useStore';
import { ChatProvider } from '../hooks/useChat';
import { LanguageProvider, useLang } from '../hooks/useLang';
import { days } from '../data/days';
import Login from './Login';
import Hero from './Hero';
import TopNav from './TopNav';
import Overview from './Overview';
import Booked from './Booked';
import DayCard from './DayCard';
import Todo from './Todo';
import Alerts from './Alerts';
import NotesPanel from './NotesPanel';
import Rich from './Rich';

function Itinerary({ active }) {
  const { t } = useLang();
  return (
    <>
      <div className="savenote"><span>🔗</span><div><Rich text={t('savenote_html')} /></div></div>
      <div className="warnbanner"><span>⚠️</span><div><Rich text={t('warnbanner_html')} /></div></div>
      <div className="legend"><h3>{t('legend_title')}</h3>
        <div className="legrow" style={{ marginBottom: '10px' }}>
          <span className="legitem"><span className="tag spot">{t('legend_buy_spot')}</span></span>
          <span className="legitem"><span className="tag ahead">{t('legend_buy_ahead')}</span></span>
          <span className="legitem"><span className="tag book">{t('legend_booked')}</span></span>
        </div>
        <div className="legrow">
          <span className="legitem"><span className="ico act">🏝️</span> {t('legend_activity')}</span>
          <span className="legitem"><span className="ico cost">💵</span> {t('legend_cost')}</span>
          <span className="legitem"><span className="rec">{t('opt_pick')}</span> {t('legend_my_pick')}</span>
        </div>
      </div>
      <div>{days.map(d => <DayCard key={d.id} d={d} active={active} />)}</div>
      <Todo />
      <div className="foot"><Rich text={t('foot_html')} /></div>
    </>
  );
}

function Main() {
  const [tab, setTab] = useState('overview');
  const onTab = (t) => { setTab(t); window.scrollTo(0, 0); };

  return (
    <>
      <Hero />
      <TopNav tab={tab} onTab={onTab} />
      <div className="wrap">
        <section className={'tabpane' + (tab === 'overview' ? ' active' : '')}><Overview /></section>
        <section className={'tabpane' + (tab === 'itinerary' ? ' active' : '')}>
          <Itinerary active={tab === 'itinerary'} />
        </section>
        <section className={'tabpane' + (tab === 'booked' ? ' active' : '')}><Booked /></section>
      </div>
      <Alerts />
      <NotesPanel />
    </>
  );
}

function Gate() {
  const { entered } = useAuth();
  if (!entered) return <Login />;
  return (
    <StoreProvider>
      <ChatProvider>
        <Main />
      </ChatProvider>
    </StoreProvider>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </LanguageProvider>
  );
}
