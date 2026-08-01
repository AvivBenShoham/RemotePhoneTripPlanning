// Stays — you book a PLACE, not a night.
//
// Consecutive days sharing a `stay` name are one booking that covers all of
// them (Bayahibe d4–d6 = three nights on a single reservation), so accommodation
// state is keyed by stay rather than by day: `acc/<stayId>/options/<optId>`.
// The id is a slug of the place name, stable and readable in the database.
import { days } from './days.js';

export function slugify(s) {
  return String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // Bávaro -> Bavaro
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'stay';
}

// [{ id, name, days:[day], dayIds:[], dayNums:['1','2','3'], nights }]
export function groupStays(list) {
  const out = [];
  let cur = null;
  list.forEach((d) => {
    if (!d.stay) { cur = null; return; }               // fly-home day: no stay
    if (!cur || cur.name !== d.stay) {
      cur = { id: slugify(d.stay), name: d.stay, days: [] };
      out.push(cur);
    }
    cur.days.push(d);
  });
  out.forEach((g) => {
    g.dayIds = g.days.map(d => d.id);
    g.dayNums = g.days.map(d => d.n.replace(/^Day\s*/, '')).filter((v, i, a) => a.indexOf(v) === i);
    g.nights = g.days.length;
  });
  return out;
}

export const stays = groupStays(days);
export const STAY_IDS = new Set(stays.map(s => s.id));
// dayId -> the stay that covers that night (absent for days with no stay)
export const stayOfDay = stays.reduce((m, s) => { s.dayIds.forEach(id => { m[id] = s; }); return m; }, {});
export const stayById = stays.reduce((m, s) => (m[s.id] = s, m), {});
