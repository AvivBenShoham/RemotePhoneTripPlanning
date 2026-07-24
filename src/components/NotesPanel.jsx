import { useState } from 'react';

export default function NotesPanel() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="notesbtn" onClick={() => setOpen(true)}>💡 Important Notes</button>
      <div className={'overlay' + (open ? ' open' : '')} onClick={() => setOpen(false)}></div>
      <aside className={'panel' + (open ? ' open' : '')}>
        <div className="panelhead"><h2>💡 Important Notes</h2><button className="x" onClick={() => setOpen(false)}>✕</button></div>
        <div className="noteblk warn"><h4>🌦️ Check the weather — it will change</h4><p>This plan is built for typical August conditions, but the forecast <b>will shift</b> before you travel. A few days out, check the forecast and any tropical advisories (the US National Hurricane Center, nhc.noaa.gov, is the authority) and re-check each morning on the ground.</p><p>Rain rarely cancels a bus, but it can slow the roads and scrub a boat day. Keep the outdoor days (El Limón, Saona, the dive, Scape Park) flexible enough to swap with an indoor/town day if a storm lands — and if anything tropical is genuinely brewing, lean on the Aug 21 buffer and consider moving the SD return a day earlier.</p></div>
        <div className="noteblk warn"><h4>🧳 Check-in / check-out & luggage aren't in the schedule</h4><p>The hourly times don't include hotel check-in or check-out — those depend on each place (often check-in ~2–3pm, check-out ~11am–12pm). Build them in yourself, especially on the travel days.</p><p>On days you leave a town, remember you may need to <b>go back to collect your luggage</b> after check-out before heading to the bus — or ask the hotel to hold your bags so you can enjoy the morning and grab them on the way out. Confirm each place's exact times when you book.</p></div>
        <div className="noteblk gold"><h4>📱 TikTok input</h4><p>Beaches other travelers most often flagged as the area's most beautiful: <b>Playa Ermitaño</b>, <b>Playa Rincón</b>, and <b>Isla Saona</b>. Ermitaño and Saona are both in this plan (Day 2 optional and Day 6). Rincón was dropped because reaching it takes several guaguas plus a boat — worth knowing if you'd rather swap it back in.</p></div>
        <div className="noteblk gold"><h4>🧭 North first, off the plane</h4><p>Samaná is a dead-end peninsula that only connects through Santo Domingo. Doing it first pays the backtrack <b>once</b>, not twice.</p></div>
        <div className="noteblk"><h4>🛬 Front-loaded travel</h4><p>The hardest legs sit early while you're fresh. The back half is a clean eastward line with short, cheap hops.</p></div>
        <div className="noteblk warn"><h4>🛡️ The buffer day (Aug 21)</h4><p>You sleep in Santo Domingo the night <b>before</b> the 11:01 AM flight — never bussing to the airport that morning. Expreso Bávaro can't be pre-booked (cash, day-of), so a delayed bus has no fallback. The buffer removes the biggest risk to your flight.</p></div>
        <div className="noteblk"><h4>📅 Holiday timing</h4><p>Aug 16 (Día de la Restauración) lands on a Sunday, but on these dates it's your <b>travel day</b> to Bayahibe — so the dive (Aug 17) and Saona (Aug 18) both fall clear of the holiday crowds. The two are still <b>swappable</b> if your operator prefers one day over the other.</p></div>
        <div className="noteblk"><h4>🏖️ Why keep 3 nights north?</h4><p>Samaná owns three things the east can't: <b>El Limón</b>, a real <b>over-water sunset</b> (Punta Cana faces east), and genuine <b>town nightlife</b>. The slow beach day is the rest you'll want mid-sprint.</p></div>
        <div className="noteblk gold"><h4>🚗 Buses over a car</h4><p>Your route is a straight spine on cheap A/C express buses. A car means paid parking, aggressive driving, and idle time while you're on boats.</p></div>
        <div className="noteblk warn"><h4>🌊 Sargassum on the Punta Cana beaches</h4><p>Bayahibe, Saona & Macao are among the cleanest; Bávaro is the weak link. It shifts overnight — check local beach-photo groups and pivot to Macao or the Ojos Indígenas lagoons if needed.</p></div>
        <div className="noteblk"><h4>🎫 Mandatory E-Ticket</h4><p>Free entry <i>and</i> exit form at <b>eticket.migracion.gob.do</b> — copycat sites asking for a card are scams. Do the exit form on the Aug 21 buffer day.</p></div>
        <div style={{ height: '20px' }}></div>
      </aside>
    </>
  );
}
