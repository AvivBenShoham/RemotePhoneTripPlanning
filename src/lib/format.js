// Formatting + derived-value helpers ported from the original planner.
import { optionals, NIGHTLY_DEFAULT } from '../data/optionals.js';

// HTML-escape is no longer needed for rendering (React escapes by default), but
// esc() is kept for building map popup HTML and Google Maps popups.
export function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
export function cap(s){s=String(s||'');return s?s.charAt(0).toUpperCase()+s.slice(1):s;}

// Merge an incoming record from the server while keeping the local value of the
// one leaf the user is typing in (relPath is relative to the record, e.g.
// "options/o2/name" — accommodation options nest, so it can be several levels
// deep). Returns a fresh object; `incoming` and its nested objects are never
// mutated. A parent that the server no longer has is treated as removed rather
// than resurrected from the half-typed local copy.
export function mergeKeepingFocus(cur, incoming, relPath){
  const merged = { ...incoming };
  if(!relPath) return merged;
  const segs = relPath.split('/').filter(Boolean);
  const leaf = segs.pop();
  let src = cur, dst = merged;
  for(const seg of segs){
    if(!src || typeof src !== 'object' || !(seg in src)) return merged;
    if(!dst[seg] || typeof dst[seg] !== 'object') return merged;
    src = src[seg];
    const child = { ...dst[seg] };
    dst[seg] = child; dst = child;
  }
  if(leaf && src && typeof src === 'object' && (leaf in src)) dst[leaf] = src[leaf];
  return merged;
}

// order-independent serialization so an echo compares equal regardless of key order
export function stableStr(o){
  if(o===null||typeof o!=='object')return JSON.stringify(o);
  if(Array.isArray(o))return '['+o.map(stableStr).join(',')+']';
  return '{'+Object.keys(o).sort().map(k=>JSON.stringify(k)+':'+stableStr(o[k])).join(',')+'}';
}

// ---- accommodation options -------------------------------------------------
// A night can hold SEVERAL candidate/booked options (e.g. two hotels held for
// the same date while you decide). They live under `acc/<dayId>/options/<optId>`
// and one of them is the `chosen` pick that counts toward the totals.
// Records written by the older single-option version kept the fields flat on
// `acc/<dayId>`; those are read as one option (`o1`) and rewritten into the
// nested shape on the first edit (see ensureAccOptions).
export const ACC_FIELDS = ['booked','name','price','link','cancelUntil','notes'];
export const emptyAccOption = (ts) => ({ booked:false, name:'', price:'', link:'', cancelUntil:'', notes:'', ts: ts || 0 });

// all options for a night, oldest first: [{id, booked, name, price, …}]
export function accOptions(a){
  if(!a || typeof a!=='object') return [];
  const opts = a.options;
  if(opts && typeof opts==='object'){
    return Object.keys(opts).filter(k=>opts[k]&&typeof opts[k]==='object')
      .map(k=>({ id:k, ...opts[k] }))
      .sort((x,y)=>((Number(x.ts)||0)-(Number(y.ts)||0))||(x.id<y.id?-1:x.id>y.id?1:0));
  }
  if(ACC_FIELDS.some(f=>a[f]!==undefined)) return [{ id:'o1', ...emptyAccOption(0), ...a }];   // legacy flat record
  return [];
}
// the option that counts for totals: the explicit pick, else the first booked, else the first
export function accPrimary(a){
  const opts = accOptions(a);
  if(!opts.length) return null;
  if(a && a.chosen){ const c = opts.find(o=>o.id===a.chosen); if(c) return c; }
  return opts.find(o=>o.booked) || opts[0];
}
export function accBookedOptions(a){return accOptions(a).filter(o=>o.booked);}
export function accAnyBooked(a){return accBookedOptions(a).length>0;}
export function optPrice(o){return (o&&o.price!==''&&o.price!=null&&!isNaN(o.price))?Number(o.price):NIGHTLY_DEFAULT;}
// migrate-in-place helper for store mutations: guarantees acc[dayId].options exists
export function ensureAccOptions(s,dayId){
  const rec = s.acc[dayId] = s.acc[dayId] || {};
  if(!rec.options || typeof rec.options!=='object'){
    const legacy = {};
    ACC_FIELDS.forEach(f=>{ if(rec[f]!==undefined){ legacy[f]=rec[f]; delete rec[f]; } });
    rec.options = { o1: { ...emptyAccOption(0), ...legacy } };
    if(!rec.chosen) rec.chosen = 'o1';
  }
  return rec;
}
export function nextOptId(rec){
  let i = 1;
  while(rec.options && rec.options['o'+i]) i++;
  return 'o'+i;
}

// accommodation nightly value used in totals: the chosen option's price, else default $60
export function accNightly(store,d){if(!d.stay)return 0;const p=accPrimary(store.acc[d.id]);return p?optPrice(p):NIGHTLY_DEFAULT;}
export function dayCost(store,d){
  let c=0;
  d.stops.forEach(s=>{
    if(s.optional!==undefined){c+=optionals[s.optional].choices[store.opt[s.optional]||optionals[s.optional].def].cost;}
    else if(s.book){const st=store.book[s.book.key];c+=(st&&st.price!==''&&st.price!=null&&!isNaN(st.price))?Number(st.price):s.cost;}
    else if(s.cost){c+=s.cost;}
  });
  c+=accNightly(store,d);
  return c;
}
export function gmapsDir(d){
  const pts=d.pts;
  const o=pts[0][0]+','+pts[0][1];
  const dest=pts[pts.length-1][0]+','+pts[pts.length-1][1];
  const wp=pts.slice(1,-1).map(p=>p[0]+','+p[1]).join('|');
  let u='https://www.google.com/maps/dir/?api=1&origin='+o+'&destination='+dest+'&travelmode=driving';
  if(wp)u+='&waypoints='+encodeURIComponent(wp);
  return u;
}
export function icoFor(m){return m||"🚌";}

export function accShowing(a,t){return (a.price!==''&&a.price!=null&&!isNaN(a.price))?('$'+Number(a.price)):('$'+NIGHTLY_DEFAULT+(t?t('acc_default_suffix'):' (default)'));}
// format an <input type=date> value (yyyy-mm-dd) as dd/mm for the compact summary
export function fmtCancelDate(v){if(!v)return "";const p=String(v).split('-');return p.length===3?(p[2]+'/'+p[1]):String(v);}
export function accCancelText(a,t){
  if(!t)return a.cancelUntil?('🟢 Free cancellation until '+fmtCancelDate(a.cancelUntil)):'🔒 No free cancellation';
  return a.cancelUntil?t('acc_cancel_free',{date:fmtCancelDate(a.cancelUntil)}):t('acc_cancel_none');
}
export function accCancelClass(a){return a.cancelUntil?'acccancel free':'acccancel';}
// whole days from today (device-local midnight) to a yyyy-mm-dd value; null when unset/unparseable.
// Negative means the date has passed. Email reminders fire on 2 and 1 (see scripts/cancellation-reminders.mjs).
export function daysUntil(v,now){
  if(!v)return null;
  const p=String(v).split('-');
  if(p.length!==3)return null;
  const y=Number(p[0]),m=Number(p[1]),d=Number(p[2]);
  if(!y||!m||!d)return null;
  const target=new Date(y,m-1,d);
  const base=now?new Date(now):new Date();
  const today=new Date(base.getFullYear(),base.getMonth(),base.getDate());
  return Math.round((target-today)/86400000);
}

// ---- overview helpers ----
export function transitMins(days){let m=0;days.forEach(d=>d.stops.forEach(s=>{if(s.mins)m+=Number(s.mins)||0;}));return m;}
export function fmtMins(m){const h=Math.floor(m/60),mm=m%60;return (h?h+'h':'')+(h&&mm?' ':'')+(mm||!h?mm+'m':'');}
// act emojis that are NOT attractions (meals, transport, logistics)
export const NON_ATTRACTION=new Set(['🍽️','🍹','🥂','🛬','🚌','✈️','🛫','🚕','🚐','🛏️','🧳','🏧','🎫','⚓','🤿','😎','📸']);
export function dayAttractions(store,d){
  const list=[];
  d.stops.forEach(s=>{
    if(s.optional!==undefined){
      const o=optionals[s.optional]; if(!o)return;
      const chosenKey=store.opt[s.optional]||o.def;
      if(chosenKey==='skip')return;                 // beach hop skipped → not an attraction
      list.push({emoji:'🔀',label:o.choices[chosenKey].name});
    }
    else if(s.t!==undefined&&s.title&&!NON_ATTRACTION.has(s.act)){
      list.push({emoji:s.act||'📍',label:s.title});
    }
  });
  return list;
}
export function shortAttr(label){return label.split(/ · | \+ | — /)[0].trim().replace(/\s+(stop|first)$/i,'');}

// ---- chat time formatting ----
export function fmtTime(ts,t,lang){
  if(!ts)return '';
  const d=new Date(ts),diff=(Date.now()-ts)/1000;
  const loc=lang||undefined;
  if(diff<45)return t?t('time_just_now'):'just now';
  if(diff<3600){const n=Math.floor(diff/60);return t?t('time_min_ago',{n}):n+'m ago';}
  if(diff<86400){const n=Math.floor(diff/3600);return t?t('time_hour_ago',{n}):n+'h ago';}
  return d.toLocaleDateString(loc,{month:'short',day:'numeric'})+' '+d.toLocaleTimeString(loc,{hour:'2-digit',minute:'2-digit'});
}
