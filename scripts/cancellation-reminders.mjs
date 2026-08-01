#!/usr/bin/env node
// Free-cancellation email reminders.
//
// The planner is a static site, so nothing in the browser can send mail on a
// schedule. This script runs once a day from GitHub Actions
// (.github/workflows/cancellation-reminders.yml): it signs in to the same
// Firebase project the app uses, reads the shared trip state over the REST API,
// and emails whoever is listed in NOTIFY_TO when an accommodation option's
// free-cancellation date is exactly 2 days or 1 day away.
//
// Every send is recorded under trips/<TRIP_ID>_notify so a second run on the
// same day (or a manual re-run) never sends the same reminder twice.
//
// Env (all from GitHub Actions secrets/vars):
//   FIREBASE_EMAIL / FIREBASE_PASSWORD  a trip account (e.g. aviv@tripvisualize.app)
//   FIREBASE_API_KEY                    optional override of the key in src/firebase/config.js
//   SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS   outgoing mail server
//   SMTP_FROM                           optional From: (defaults to SMTP_USER)
//   NOTIFY_TO                           comma-separated recipients
//   NOTIFY_TZ                           timezone "today" is measured in (default America/Santo_Domingo)
//   DRY_RUN=1                           print the mail instead of sending, don't write markers
//   NOTIFY_FORCE=1                      ignore the already-sent markers
import { pathToFileURL } from 'node:url';
import nodemailer from 'nodemailer';
import { FIREBASE_CONFIG, TRIP_ID, DB_PATH } from '../src/firebase/config.js';
import { stays } from '../src/data/stays.js';
import { accOptions, optNightly, optTotal, optHasPrice, money } from '../src/lib/format.js';

const LEAD_DAYS = [2, 1];                       // reminders fire this many days before the date
const NOTIFY_PATH = 'trips/' + TRIP_ID + '_notify';
const TZ = process.env.NOTIFY_TZ || 'America/Santo_Domingo';
const DRY_RUN = process.env.DRY_RUN === '1' || process.argv.includes('--dry-run');
const FORCE = process.env.NOTIFY_FORCE === '1' || process.argv.includes('--force');
const API_KEY = process.env.FIREBASE_API_KEY || FIREBASE_CONFIG.apiKey;
const DB_URL = FIREBASE_CONFIG.databaseURL.replace(/\/$/, '');

const log = (...a) => console.log(...a);
const fail = (msg) => { console.error('✖ ' + msg); process.exit(1); };

// ---- dates -----------------------------------------------------------------
// "today" in the trip's timezone as yyyy-mm-dd, so a run just after midnight UTC
// doesn't jump a day ahead of the people the mail is for.
function todayInTz(tz) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date()).reduce((o, p) => (o[p.type] = p.value, o), {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}
const asUTC = (ymd) => { const [y, m, d] = ymd.split('-').map(Number); return Date.UTC(y, m - 1, d); };
// whole days from today to a yyyy-mm-dd value; null when unset/unparseable
function daysUntil(value, today) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value).trim())) return null;
  return Math.round((asUTC(String(value).trim()) - asUTC(today)) / 86400000);
}
const fmtDate = (ymd) => {
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
};

// ---- firebase REST ---------------------------------------------------------
async function signIn(email, password) {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.idToken) fail(`Firebase sign-in failed (${res.status}): ${body.error?.message || 'unknown error'}`);
  return body.idToken;
}
async function dbGet(path, token) {
  const res = await fetch(`${DB_URL}/${path}.json?auth=${encodeURIComponent(token)}`);
  if (!res.ok) fail(`Database read of /${path} failed (${res.status})`);
  return res.json();
}
async function dbPatch(path, token, payload) {
  const res = await fetch(`${DB_URL}/${path}.json?auth=${encodeURIComponent(token)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) fail(`Database write to /${path} failed (${res.status})`);
}

// ---- trip state ------------------------------------------------------------
// Accommodation is keyed by stay (one reservation covers all its nights); the
// option reader, pricing and stay grouping are shared with the app so the mail
// can never disagree with what the page shows.

// every option whose free-cancellation date is LEAD_DAYS away
function dueReminders(acc, today) {
  const out = [];
  stays.forEach((stay) => {
    const opts = accOptions(acc[stay.id]);
    opts.forEach((o, i) => {
      const left = daysUntil(o.cancelUntil, today);
      if (left == null || !LEAD_DAYS.includes(left)) return;
      out.push({
        key: `${stay.id}_${o.id}`,
        marker: `${o.cancelUntil}_${left}`,
        left,
        stay,
        opt: o,
        n: i + 1,
        of: opts.length,
      });
    });
  });
  return out.sort((a, b) => a.left - b.left || a.stay.id.localeCompare(b.stay.id));
}

// ---- mail ------------------------------------------------------------------
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nightsWord = (n) => `${n} night${n === 1 ? '' : 's'}`;
// a reservation covers the whole stay, so quote the total and the nightly rate
const priceOf = (o, nights) => optHasPrice(o)
  ? `${money(optTotal(o, nights))} for ${nightsWord(nights)} (${money(optNightly(o, nights))}/night)`
  : 'price not set';
const whenText = (left) => left === 1 ? 'TOMORROW is the last day to cancel free' : `${left} days left to cancel free`;
const whereText = (stay) => {
  const nums = stay.dayNums;
  const range = nums.length > 1 ? `Days ${nums[0]}–${nums[nums.length - 1]}` : `Day ${nums[0]}`;
  return `${stay.name} · ${range} · ${nightsWord(stay.nights)}`;
};

function buildMail(items, today) {
  const soonest = Math.min(...items.map(i => i.left));
  const subject = items.length === 1
    ? `⏳ ${whenText(soonest)} — ${items[0].opt.name || items[0].stay.name} (${items[0].stay.name})`
    : `⏳ ${items.length} bookings reaching their free-cancellation date (soonest: ${soonest} day${soonest === 1 ? '' : 's'})`;

  const lines = items.map((it) => {
    const o = it.opt;
    const bits = [
      whereText(it.stay),
      `${o.name || '(unnamed option)'}${it.of > 1 ? ` — option ${it.n} of ${it.of}` : ''}`,
      `${priceOf(o, it.stay.nights)} · ${o.booked ? 'marked BOOKED' : 'not marked booked'}`,
      `Free cancellation until ${fmtDate(o.cancelUntil)} — ${whenText(it.left)}`,
    ];
    if (o.notes) bits.push(`Notes: ${o.notes}`);
    if (o.link) bits.push(`Booking: ${o.link}`);
    return bits;
  });

  const text = [
    `Free-cancellation deadlines coming up (as of ${fmtDate(today)}, ${TZ}):`,
    '',
    ...lines.flatMap(b => ['• ' + b[0], ...b.slice(1).map(l => '  ' + l), '']),
    'Cancel anything you no longer want before the date above, or the booking stops being refundable.',
    '',
    '— RemotePhoneTripPlanning',
  ].join('\n');

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,sans-serif;color:#1f2d34;line-height:1.5">
  <h2 style="color:#07837c;margin:0 0 4px">⏳ Free-cancellation deadlines</h2>
  <p style="color:#5d6f78;font-size:14px;margin:0 0 16px">As of ${esc(fmtDate(today))} (${esc(TZ)}).</p>
  ${items.map((it) => {
    const o = it.opt;
    return `<div style="border:1px solid #dfe8e8;border-left:4px solid ${it.left === 1 ? '#e5533f' : '#f2b134'};border-radius:10px;padding:12px 14px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:700;color:#ff6b57;text-transform:uppercase;letter-spacing:.6px">${esc(whereText(it.stay))}</div>
      <div style="font-size:17px;font-weight:700;margin-top:3px">${esc(o.name || '(unnamed option)')}${it.of > 1 ? ` <span style="font-size:12px;font-weight:600;color:#5d6f78">option ${it.n} of ${it.of}</span>` : ''}</div>
      <div style="font-size:14px;color:#5d6f78;margin-top:4px">${esc(priceOf(o, it.stay.nights))} · ${o.booked ? '✅ marked booked' : '🕓 not marked booked'}</div>
      <div style="font-size:14px;font-weight:700;color:${it.left === 1 ? '#e5533f' : '#a9761a'};margin-top:6px">Free cancellation until ${esc(fmtDate(o.cancelUntil))} — ${esc(whenText(it.left))}</div>
      ${o.notes ? `<div style="font-size:13px;color:#5a4b2a;background:#fffaf0;border-radius:8px;padding:6px 9px;margin-top:8px">📝 ${esc(o.notes)}</div>` : ''}
      ${o.link ? `<div style="margin-top:8px"><a href="${esc(o.link)}" style="color:#07837c;font-weight:700;font-size:13px">🔗 Open booking</a></div>` : ''}
    </div>`;
  }).join('')}
  <p style="font-size:13px;color:#5d6f78">Cancel anything you no longer want before the date above, or the booking stops being refundable.</p>
</div>`;

  return { subject, text, html };
}

// ---- main ------------------------------------------------------------------
async function main() {
  const email = process.env.FIREBASE_EMAIL, password = process.env.FIREBASE_PASSWORD;
  const to = (process.env.NOTIFY_TO || '').split(',').map(s => s.trim()).filter(Boolean);
  const smtp = {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
  };

  // Nothing configured at all = the secrets haven't been added yet. Skip quietly
  // instead of failing, so the daily schedule doesn't mail a red ❌ every morning
  // before setup. A *partly* filled setup still fails loudly below.
  const configured = [email, password, process.env.SMTP_HOST, process.env.SMTP_USER, process.env.SMTP_PASS, process.env.NOTIFY_TO]
    .filter(v => v && String(v).trim());
  if (!configured.length) {
    log('Reminders are not configured yet (no Firebase/SMTP secrets set) — nothing to do. See README → "Email reminders".');
    return;
  }

  if (!email || !password) fail('FIREBASE_EMAIL / FIREBASE_PASSWORD are not set — cannot read the shared trip.');
  if (!API_KEY || API_KEY.includes('PASTE')) fail('No Firebase Web API key (set FIREBASE_API_KEY or fill src/firebase/config.js).');
  if (!DRY_RUN) {
    if (!to.length) fail('NOTIFY_TO is empty — nobody to email.');
    if (!smtp.host || !smtp.user || !smtp.pass) fail('SMTP_HOST / SMTP_USER / SMTP_PASS are not set.');
  }

  const today = todayInTz(TZ);
  log(`Today is ${today} (${TZ}); reminding ${LEAD_DAYS.join(' and ')} day(s) ahead.`);

  const token = await signIn(email, password);
  const trip = (await dbGet(DB_PATH, token)) || {};
  const due = dueReminders(trip.acc || {}, today);
  if (!due.length) { log('No free-cancellation dates due today — nothing to send.'); return; }

  const sentMarkers = (await dbGet(NOTIFY_PATH, token)) || {};
  const items = due.filter((it) => {
    const already = sentMarkers[it.key] && sentMarkers[it.key][it.marker];
    if (already && !FORCE) { log(`· skipping ${it.key} (${it.marker}) — already sent`); return false; }
    return true;
  });
  if (!items.length) { log('All due reminders were already sent.'); return; }

  const mail = buildMail(items, today);
  log(`${items.length} reminder(s) to send: ${items.map(i => `${i.stay.id}/${i.opt.id}@${i.left}d`).join(', ')}`);

  if (DRY_RUN) {
    log('\n--- DRY RUN, not sending ---');
    log('To:      ' + (to.join(', ') || '(NOTIFY_TO unset)'));
    log('Subject: ' + mail.subject);
    log('\n' + mail.text);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,           // 465 = implicit TLS, 587 = STARTTLS
    auth: { user: smtp.user, pass: smtp.pass },
  });
  await transporter.sendMail({ from: smtp.from, to: to.join(', '), subject: mail.subject, text: mail.text, html: mail.html });
  log(`✔ Sent to ${to.join(', ')}`);

  // record the sends only after the mail actually went out
  const stamp = new Date().toISOString();
  await Promise.all(items.map(it => dbPatch(`${NOTIFY_PATH}/${it.key}`, token, { [it.marker]: stamp })));
  log('✔ Markers written — these reminders will not be sent again.');
}

// run only when invoked directly, so the pure helpers above can be imported by tests
const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) main().catch((e) => fail(e && e.message ? e.message : String(e)));

export { daysUntil, dueReminders, buildMail, todayInTz, LEAD_DAYS };
