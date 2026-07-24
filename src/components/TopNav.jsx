export default function TopNav({ tab, onTab }) {
  return (
    <nav className="topnav">
      <div className="wrap topnavwrap">
        <button className={'navbtn' + (tab === 'overview' ? ' active' : '')} onClick={() => onTab('overview')}>🗺️ Overview</button>
        <button className={'navbtn' + (tab === 'itinerary' ? ' active' : '')} onClick={() => onTab('itinerary')}>📅 Itinerary</button>
      </div>
    </nav>
  );
}
