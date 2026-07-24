import { useState } from 'react';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { StoreProvider } from '../hooks/useStore';
import { ChatProvider } from '../hooks/useChat';
import { days } from '../data/days';
import Login from './Login';
import Hero from './Hero';
import TopNav from './TopNav';
import Overview from './Overview';
import DayCard from './DayCard';
import Todo from './Todo';
import Alerts from './Alerts';
import NotesPanel from './NotesPanel';

function Itinerary({ active }) {
  return (
    <>
      <div className="savenote"><span>🔗</span><div>Booking details, accommodation &amp; to-dos <b>sync live for everyone</b> — edit on any phone or laptop and the change shows up for the whole group within a second. (Live sync and the maps need the hosted page online; inside the chat preview it falls back to saving on this device only.)</div></div>
      <div className="warnbanner"><span>⚠️</span><div>Prices are USD for the couple. Only <b>Scape Park ($120pp)</b> and taxi rates are your confirmed quotes; the rest are estimates (⚠ = unverified). Toggle optionals, mark things booked, add accommodation — every total updates live.</div></div>
      <div className="legend"><h3>Legend</h3>
        <div className="legrow" style={{ marginBottom: '10px' }}>
          <span className="legitem"><span className="tag spot">📍 Buy on the spot</span></span>
          <span className="legitem"><span className="tag ahead">🕓 Buy ahead</span></span>
          <span className="legitem"><span className="tag book">✅ Booked</span></span>
        </div>
        <div className="legrow">
          <span className="legitem"><span className="ico act">🏝️</span> Activity</span>
          <span className="legitem"><span className="ico cost">💵</span> Cost</span>
          <span className="legitem"><span className="rec">PICK</span> My pick</span>
        </div>
      </div>
      <div>{days.map(d => <DayCard key={d.id} d={d} active={active} />)}</div>
      <Todo />
      <div className="foot">Maps © OpenStreetMap contributors · markers are exact; the line connects stops in order (straight-line). Tap “open in Google Maps” for live road navigation.<br />Tap <b>Important Notes</b> for the reasoning behind the route.</div>
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
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
