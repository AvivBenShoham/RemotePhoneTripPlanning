import { useLang } from '../hooks/useLang';

export default function TopNav({ tab, onTab }) {
  const { t } = useLang();
  return (
    <nav className="topnav">
      <div className="wrap topnavwrap">
        <button className={'navbtn' + (tab === 'overview' ? ' active' : '')} onClick={() => onTab('overview')}>{t('nav_overview')}</button>
        <button className={'navbtn' + (tab === 'itinerary' ? ' active' : '')} onClick={() => onTab('itinerary')}>{t('nav_itinerary')}</button>
      </div>
    </nav>
  );
}
