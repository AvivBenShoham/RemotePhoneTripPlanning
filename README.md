# RemotePhoneTripPlanning

An interactive **React (Vite)** trip planner for an 11-day Dominican Republic
loop for two (Aug 11–21, 2026). Per-day Leaflet maps, live-updating cost totals,
booking & accommodation trackers (several options per night), a **Booked** tab
listing everything already locked in, toggleable optional activities, a trip
to-do checklist, and **email reminders before each free-cancellation date**. It
builds to static files and deploys to GitHub Pages.

An **EN/ES language toggle** (top-left of the header) switches the whole
interface between English and Spanish; the choice is remembered per device.
Translations cover the UI chrome only — the editorial trip content (day titles,
stop descriptions, and the Important Notes) stays in English. Strings live in
`src/i18n/strings.js`.

## Local development

```bash
npm install      # install dependencies
npm run dev      # start the dev server (prints a local URL)
npm run build    # production build into dist/
npm run preview  # serve the production build locally
```

The app lives in `src/` (data in `src/data/`, Firebase config in
`src/firebase/`, UI in `src/components/`, shared state/chat hooks in
`src/hooks/`). Unlike the old single HTML file, it now requires the dev server
or a build — you can no longer just double-click a file to open it.

### Accommodation cards

Each night has an accommodation card holding one or more **options**. An option
stores its place name, nightly price, booking link, a **free-cancellation-until
date** (empty by default = no free cancellation), and free-text **booking
notes** (e.g. *"free cancellation until 28/07"*). Every field is part of the
shared state and **syncs live via Firebase** (see below), so the whole group
sees the same details.

**Several options for the same night.** When you've held two (or three) places
for one date while you decide — or booked both because they were refundable —
tap **＋ Add another option** and fill in the second one. Each option has its own
booked toggle, price and cancellation date, so a night can legitimately show
*"✅ 2 booked"*.

- One option is the **★ main pick** — the only one counted in the day total and
  the trip total, so holding a backup never inflates your budget. Tap **Use as
  main pick** on any option to switch. Without an explicit pick the first booked
  option (or simply the first) is used.
- **✕** removes an option; the last remaining one can't be removed (it just
  empties).
- Cards stay **collapsed by default** to keep day cards compact: the header
  shows the option count, whether/how many are booked, and the main pick's
  cancellation status, with any booking notes underneath. Tap to expand.

Under the hood an option lives at `acc/<dayId>/options/<optId>`, with the pick at
`acc/<dayId>/chosen`. Cards saved by the earlier single-option version are read
as one option (`o1`) and rewritten into the new shape the first time you edit
them — nothing to migrate by hand.

### ✅ Booked tab

A third tab collects **everything already booked** in one place, so you don't
have to scroll the itinerary to see what's locked in:

- **Booked stays** — every booked accommodation option (including the extra ones
  held for the same night), with its night, price, notes, booking link, and
  whether it's the main pick or a duplicate to cancel.
- **Booked activities & tours** — every booking tracker marked done, with its
  agency and the price actually paid.
- **Free-cancellation deadlines** — the still-open ones, soonest first, turning
  red inside the last two days.
- Totals at the top: booked spend, how many stays and activities are booked, and
  how many cancellation windows are still open.

## Shared, live sync

Booking details, accommodation entries, optional-activity picks, and the to-do
list are **shared across everyone who opens the page**, in real time, via a free
[Firebase Realtime Database](https://firebase.google.com/products/realtime-database).
Edit on any phone or laptop and the change appears for the whole group within a
second.

Until Firebase keys are filled in, the page still works — it just saves to the
current device only (`localStorage`), exactly as before.

### One-time setup (~5 minutes)

1. **Create a Firebase project** — <https://console.firebase.google.com> → *Add
   project* (you can skip Google Analytics).
2. **Create a Realtime Database** — left menu → *Build → Realtime Database* →
   *Create Database* → pick a region → start in **test mode** (we'll set rules
   next).
3. **Set the security rules** — in the database's *Rules* tab, paste these
   **auth-required** rules so only signed-in users can read or write:
   ```json
   {
     "rules": {
       "trips": {
         "$id": {
           ".read": "auth != null",
           ".write": "auth != null"
         }
       }
     }
   }
   ```
   With these rules, having the database URL is not enough — every read and write
   must come from an account you created (see **Sign-in** below).
4. **Paste the Web API Key** into `src/firebase/config.js` — Firebase console →
   *Project settings* (gear) → *General* → **Web API Key**. Set it as `apiKey`
   in the `FIREBASE_CONFIG` block. This key is
   **public by design** (it only names the project; it grants no access on its
   own — the rules do), so it's fine to commit. The `authDomain`, `projectId`,
   and `databaseURL` are already filled in for this project.
5. That's it — do the **Sign-in** setup below and the page syncs live for anyone
   with a valid account.

> Want a separate, independent copy of the planner? Change `TRIP_ID` in
> `src/firebase/config.js` (e.g. `"dr2026"` → `"europe2027"`). Each id is its own
> isolated dataset.

## Sign-in (real Firebase Authentication)

Opening the page shows a sign-in screen, and **the itinerary won't load or sync
until you sign in** — enforced by the database rules above, not just the UI.
Passwords are stored and verified by Firebase; they are **not** in the page
source.

**How a typed "name" becomes an account:** the login form lowercases the name and
maps it to a Firebase email `name@tripvisualize.app` (the `EMAIL_DOMAIN` constant
in `src/firebase/config.js`). Both name and password are lowercased before sign-in, so
capitalization never matters.

### Create the accounts (one-time)

1. Firebase console → *Build → Authentication* → *Get started* → enable the
   **Email/Password** provider.
2. *Authentication → Users → Add user*, once per person. Use the mapped email and
   a **lowercase password of at least 6 characters** (Firebase's minimum — so the
   old `aviv`/`karol` are too short):

   | Person | Email (Add user)          | Example password |
   |--------|---------------------------|------------------|
   | Aviv   | `aviv@tripvisualize.app`  | `avivtrip`       |
   | Karol  | `karol@tripvisualize.app` | `karoltrip`      |

   They then sign in by typing just **Aviv** / **Karol** and the password.
3. To add someone later, add another user with `<name>@tripvisualize.app`. No code
   change needed. "Log out" is in the top-right of the header; Firebase keeps you
   signed in across reloads on that device.

> **This is real access control.** Passwords live only in Firebase, and the rules
> reject any read/write without a signed-in account — so the database is no longer
> open even to someone who has the URL. The one public value in the file (the Web
> API Key) grants nothing on its own.

## Per-day chat

Every day card has a collapsible **💬 Day chat** panel for notes, reminders, and
debates about that day. Messages are **shared and persistent** — they sync live
for everyone signed in and survive reloads.

- **Who's posting** is taken from your signed-in account (Aviv / Karol) — no name
  to type. Message text is escaped, so pasted links or code can't break the page.
- **Storage:** each message is its own record under
  `trips/<TRIP_ID>_chat/<dayId>` (a separate node from the itinerary, written one
  message at a time with `push()`), so nothing is lost if two people post at once
  and the itinerary's whole-blob save can never overwrite the chat. It's covered
  by the same `auth != null` rules — **no Firebase rules change is needed**.
- **Deleting:** only **Aviv** sees the delete (✕) control on messages; for anyone
  else it isn't shown. This is a UI-level rule (any signed-in account still has
  database-level write access, per the open-within-the-group rules above). If you
  later want deletion enforced by the database itself, that's a small rules
  addition — ask and it can be added.
- **Live notifications:** when someone else posts, you get a browser notification
  (e.g. *"Karol · Day 5"*) plus a tap-to-open in-page toast. The browser asks for
  notification permission once, the first time you open or post in a chat; if you
  decline (or the browser doesn't support it), the in-page toast still shows.
  Notifications only fire for genuinely new messages from other people — never for
  your own, never for the existing backlog, and they stay quiet if you're already
  looking at that open thread. (Works while the page is open in a tab, including a
  background tab; it isn't full push-when-closed — that would need Firebase Cloud
  Messaging.)
- **Unread alerts:** a floating **🔔** button shows a badge with how many messages
  you haven't read yet, and each day's chat header shows its own unread count.
  Tap the bell to see the unread messages (grouped newest-first) and jump straight
  to any of them; opening a day's chat — or hitting **Mark all as read** — clears
  it. Read state is per account and remembered on the device, so it persists across
  reloads and logins (it's tracked per device — reading on your phone doesn't clear
  the badge on your laptop). Your own messages never count as unread.
- **Offline / preview:** with no live backend (the in-chat preview, or before the
  API key is set) the panel shows a short "needs the live page" note instead of a
  composer, matching how maps and sync already degrade.

## Hosting one shared link (GitHub Pages)

So everyone opens the same URL instead of passing files around, the repo ships
a GitHub Actions workflow — [`.github/workflows/pages.yml`](.github/workflows/pages.yml)
— that publishes to GitHub Pages automatically:

1. Every push to **`main`** runs `npm ci && npm run build` and deploys Vite's
   `dist/` output (the workflow enables Pages for the repo on its first run, so no
   manual *Settings → Pages* step is needed). You can also run it on demand from
   the **Actions** tab (*Deploy to GitHub Pages → Run workflow*).
2. Once the first run finishes, the planner is served at
   `https://<user>.github.io/RemotePhoneTripPlanning/`. The old
   `dr-itinerary.html` URL still works — it now redirects to the app root.

> The site is served under the `/RemotePhoneTripPlanning/` sub-path, which the
> `base` option in [`vite.config.js`](vite.config.js) matches so asset URLs
> resolve. Deploying to a custom domain or repo root? Build with
> `BASE_PATH=/ npm run build`.

> Because the app is now built (not a static file), *Deploy from a branch* would
> serve raw source instead of the build — keep the Actions workflow.

## Email reminders before a free-cancellation date

Two days before, and again one day before, an accommodation option's
**free-cancellation date**, the trip gets an email listing what's about to stop
being refundable — so nothing you're holding "just in case" quietly turns into a
charge.

The planner is a static site, so nothing in the browser can send mail on a
schedule. Instead a daily GitHub Actions job —
[`.github/workflows/cancellation-reminders.yml`](.github/workflows/cancellation-reminders.yml)
— runs [`scripts/cancellation-reminders.mjs`](scripts/cancellation-reminders.mjs),
which signs in to the same Firebase project the app uses, reads the shared trip
state, and mails whatever is due. It runs at **13:00 UTC (09:00 in the Dominican
Republic)**; you can also trigger it by hand from the **Actions** tab.

Every option with a cancellation date is covered, booked or not (the mail says
which). Each send is recorded under `trips/<TRIP_ID>_notify`, so a re-run — or
GitHub firing the schedule twice — never sends the same reminder again.

### Setup (repo secrets)

*Settings → Secrets and variables → Actions → New repository secret:*

| Secret | What it is |
|--------|------------|
| `FIREBASE_EMAIL` | a trip account, e.g. `aviv@tripvisualize.app` |
| `FIREBASE_PASSWORD` | that account's password |
| `SMTP_HOST` | e.g. `smtp.gmail.com` |
| `SMTP_PORT` | `587` (STARTTLS) or `465` (TLS) — defaults to 587 |
| `SMTP_USER` / `SMTP_PASS` | mailbox login. For Gmail use an **app password**, not the account password |
| `SMTP_FROM` | optional `From:` address (defaults to `SMTP_USER`) |
| `NOTIFY_TO` | comma-separated recipients, e.g. `aviv@…,karol@…` |

Optional: `FIREBASE_API_KEY` (only if the key in `src/firebase/config.js` is
rotated) and the repo **variable** `NOTIFY_TZ` (the timezone "today" is measured
in; defaults to `America/Santo_Domingo`).

Until the secrets exist the job just fails fast with a one-line message and sends
nothing. To check it without emailing anyone, run *Actions → Free-cancellation
email reminders → Run workflow* with **dry run** ticked — it prints the mail it
would have sent. Locally the same thing is:

```bash
FIREBASE_EMAIL=… FIREBASE_PASSWORD=… DRY_RUN=1 npm run reminders
```

Ticking **force** (or `NOTIFY_FORCE=1`) ignores the already-sent markers and
resends.

## Notes & trade-offs

- **Concurrency:** every edit writes only the leaf that changed (e.g.
  `acc/d1/options/o2/price`), so two people editing different fields — even in
  the same accommodation card — merge server-side instead of clobbering each
  other. The only value held back while you type is the exact field under your
  cursor.
- **Reminder timing:** GitHub's cron can lag by several minutes and very
  occasionally skips a run. The reminders are per-date rather than per-hour, and
  they fire twice (2 days and 1 day out), so a late or missed run isn't a
  missed deadline.
- **Offline / chat preview:** if Firebase or the network isn't available (e.g. the
  in-chat preview, or before the API key is set), the page skips the sign-in gate
  and runs locally with `localStorage` so the itinerary is still viewable; maps
  also need a network connection to load. Live sync and the sign-in gate are
  active only on the hosted/online page with the API key filled in.
- **Also secure Realtime Database reads app-wide:** the rules above only cover
  `/trips`. If you keep other data in this database, add a top-level default like
  `".read": false, ".write": false` outside `trips` so nothing else is exposed.
