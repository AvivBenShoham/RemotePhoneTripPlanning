import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { esc } from '../lib/format';

function pinIcon(i, total) {
  const cls = i === 0 ? 'start' : (i === total - 1 ? 'end' : '');
  return L.divIcon({ className: '', html: `<div class="marker-pin ${cls}"><span>${i + 1}</span></div>`, iconSize: [26, 26], iconAnchor: [13, 26] });
}

export default function DayMap({ d, active }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const latlngsRef = useRef([]);

  // Recompute container size, then re-fit the route. fitBounds must run while
  // the map has real size — if it ran at 0×0 (e.g. built inside the hidden
  // Overview pane) it would lock to max zoom, which is the bug this fixes.
  const refit = () => {
    const map = mapRef.current;
    if (!map) return;
    map.invalidateSize();
    const latlngs = latlngsRef.current;
    if (latlngs.length === 1) map.setView(latlngs[0], 13);
    else if (latlngs.length > 1) map.fitBounds(latlngs, { padding: [30, 30] });
  };

  useEffect(() => {
    const el = elRef.current;
    if (!el || mapRef.current) return;
    const latlngs = d.pts.map(p => [p[0], p[1]]);
    latlngsRef.current = latlngs;
    const map = L.map(el, { scrollWheelZoom: false, attributionControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
    L.polyline(latlngs, { color: '#e5533f', weight: 3, dashArray: '2 8', opacity: .85 }).addTo(map);
    d.pts.forEach((p, i) => { L.marker([p[0], p[1]], { icon: pinIcon(i, d.pts.length) }).addTo(map).bindPopup('<b>' + (i + 1) + '.</b> ' + esc(p[2])); });
    mapRef.current = map;
    refit();
    setTimeout(refit, 200);   // after tiles/layout settle
    return () => { try { map.remove(); } catch (e) {} mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The itinerary pane is hidden (display:none) while Overview is active, so a
  // map initialized then has zero size and mis-zooms — re-fit once it's shown.
  useEffect(() => {
    if (active && mapRef.current) setTimeout(refit, 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return <div ref={elRef} className="lmap"></div>;
}
