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

  useEffect(() => {
    const el = elRef.current;
    if (!el || mapRef.current) return;
    const latlngs = d.pts.map(p => [p[0], p[1]]);
    const map = L.map(el, { scrollWheelZoom: false, attributionControl: true }).fitBounds(latlngs, { padding: [30, 30] });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
    L.polyline(latlngs, { color: '#e5533f', weight: 3, dashArray: '2 8', opacity: .85 }).addTo(map);
    d.pts.forEach((p, i) => { L.marker([p[0], p[1]], { icon: pinIcon(i, d.pts.length) }).addTo(map).bindPopup('<b>' + (i + 1) + '.</b> ' + esc(p[2])); });
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 200);
    return () => { try { map.remove(); } catch (e) {} mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The itinerary pane is hidden (display:none) while Overview is active, so a
  // map initialized then has zero size — recompute when the pane becomes visible.
  useEffect(() => {
    if (active && mapRef.current) setTimeout(() => mapRef.current && mapRef.current.invalidateSize(), 0);
  }, [active]);

  return <div ref={elRef} className="lmap"></div>;
}
