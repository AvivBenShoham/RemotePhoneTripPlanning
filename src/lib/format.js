// Formatting + derived-value helpers ported from the original planner.
import { optionals, NIGHTLY_DEFAULT } from '../data/optionals';

// HTML-escape is no longer needed for rendering (React escapes by default), but
// esc() is kept for building map popup HTML and Google Maps popups.
export function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
export function cap(s){s=String(s||'');return s?s.charAt(0).toUpperCase()+s.slice(1):s;}

// order-independent serialization so an echo compares equal regardless of key order
export function stableStr(o){
  if(o===null||typeof o!=='object')return JSON.stringify(o);
  if(Array.isArray(o))return '['+o.map(stableStr).join(',')+']';
  return '{'+Object.keys(o).sort().map(k=>JSON.stringify(k)+':'+stableStr(o[k])).join(',')+'}';
}

// accommodation nightly value used in totals: entered price if any, else default $60
export function accNightly(store,d){if(!d.stay)return 0;const a=store.acc[d.id];return (a&&a.price!==''&&a.price!=null&&!isNaN(a.price))?Number(a.price):NIGHTLY_DEFAULT;}
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

export function accShowing(a){return (a.price!==''&&a.price!=null&&!isNaN(a.price))?('$'+Number(a.price)):('$'+NIGHTLY_DEFAULT+' (default)');}
// format an <input type=date> value (yyyy-mm-dd) as dd/mm for the compact summary
export function fmtCancelDate(v){if(!v)return "";const p=String(v).split('-');return p.length===3?(p[2]+'/'+p[1]):String(v);}
export function accCancelText(a){return a.cancelUntil?('🟢 Free cancellation until '+fmtCancelDate(a.cancelUntil)):'🔒 No free cancellation';}
export function accCancelClass(a){return a.cancelUntil?'acccancel free':'acccancel';}

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
export function fmtTime(ts){
  if(!ts)return '';
  const d=new Date(ts),diff=(Date.now()-ts)/1000;
  if(diff<45)return 'just now';
  if(diff<3600)return Math.floor(diff/60)+'m ago';
  if(diff<86400)return Math.floor(diff/3600)+'h ago';
  return d.toLocaleDateString(undefined,{month:'short',day:'numeric'})+' '+d.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});
}
