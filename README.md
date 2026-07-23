# RemotePhoneTripPlanning

An interactive, single-file trip planner — **`dr-itinerary.html`** — for an
11-day Dominican Republic loop for two (Aug 11–21, 2026). Per-day Leaflet maps,
live-updating cost totals, booking & accommodation trackers, toggleable optional
activities, and a trip to-do checklist.

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
4. **Paste the Web API Key** into `dr-itinerary.html` — Firebase console →
   *Project settings* (gear) → *General* → **Web API Key**. Set it as `apiKey`
   in the `FIREBASE_CONFIG` block near the top of the `<script>`. This key is
   **public by design** (it only names the project; it grants no access on its
   own — the rules do), so it's fine to commit. The `authDomain`, `projectId`,
   and `databaseURL` are already filled in for this project.
5. That's it — do the **Sign-in** setup below and the page syncs live for anyone
   with a valid account.

> Want a separate, independent copy of the planner? Change `TRIP_ID` in the file
> (e.g. `"dr2026"` → `"europe2027"`). Each id is its own isolated dataset.

## Sign-in (real Firebase Authentication)

Opening the page shows a sign-in screen, and **the itinerary won't load or sync
until you sign in** — enforced by the database rules above, not just the UI.
Passwords are stored and verified by Firebase; they are **not** in the page
source.

**How a typed "name" becomes an account:** the login form lowercases the name and
maps it to a Firebase email `name@tripvisualize.app` (the `EMAIL_DOMAIN` constant
in the file). Both name and password are lowercased before sign-in, so
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

## Live weather (AccuWeather + Open-Meteo)

Each day at one of the three trip locations — **Las Terrenas** (Days 1–3),
**Bayahibe** (Days 4–6), **Punta Cana** (Days 7–9) — shows a weather card with
temperature, sky (cloudy vs. sunny), rain chance, **storm probability**, plus
RealFeel, UV and wind, a **Beach-Day Score**, and an expandable **7-day
beach-day outlook**. The data is fetched through a source cascade, best first:

1. **AccuWeather** (free tier) — used when a key is set and the date is within
   its 5-day forecast window. It's the only source with a real
   *thunderstorm probability %*, which is what the storm chip shows.
2. **Open-Meteo forecast** (free, no key) — reaches ~16 days ahead, so it fills
   days 6–16 out and is the automatic fallback if AccuWeather is unset, over
   quota, or blocked by the browser.
3. **Climatology** (Open-Meteo Historical / ERA5, free) — no daily forecast
   exists beyond ~16 days, so for trip dates further out each card shows the
   **10-year average for that exact calendar date**: typical high/low, the % of
   past years that were *wet* and *stormy*, and wind. It's labelled **📆 TYPICAL
   · N-yr average** (not a forecast) and is replaced by the live forecast
   automatically as each date enters the 16-day window.
4. **Typical-August baseline** — a hand-entered fallback shown only if even the
   historical fetch fails.

An expandable **🏖️ Trip beach-day outlook** on every card lists *all* trip
dates side by side with their beach scores, so you can compare which days are
best for the beach across the whole trip at a glance.

A badge on each card names the source in play, and the **AccuWeather →** link
opens that location's monthly page to cross-check.

**Beach-Day Score.** Each live day gets a 0–100 score for how good a beach day
it is, blended from the fields that actually matter on a beach: rain chance,
thunderstorm chance, cloud cover, how hot it *feels* (RealFeel), wind, and UV
(inputs a source doesn't provide are skipped). It shows as a colour-coded chip
on the day card and next to every day in the **🏖️ Beach-day outlook · next 7
days** panel (tap to expand), so you can pick the best beach day at a glance.

**Client-side cache.** Each source's response is cached in `localStorage` — live
forecasts for **30 minutes**, the (static) historical climatology for **30
days** — so reopening or reloading the page reuses cached data instead of
spending API calls, keeping well inside the 50/day free-tier limit even across
many visits. After the TTL the next load refetches.

### Enabling AccuWeather (optional, ~2 minutes)

The page works out of the box on Open-Meteo. To turn on the richer AccuWeather
source:

1. Register (free) at <https://developer.accuweather.com> → **My Apps** → *Add a
   new App* → copy its **API Key**. The free *Core Weather Limited Trial* plan
   allows **50 calls/day**; this page uses at most **3 per load** (one per
   location) — and thanks to the 30-minute cache, at most 3 per half-hour.
2. Open the planner and click **🔑 Set AccuWeather key** on any weather card,
   then paste the key. That's it — the cards switch to AccuWeather immediately.

> **The key is entered at runtime, not committed to the repo — on purpose.**
> This site deploys to **GitHub Pages, which is public**, so a key hardcoded in
> the HTML would be world-readable and could be abused (GitHub's push protection
> also blocks committing it). Instead the key you enter is saved to the
> **auth-gated Firebase sync**, so it reaches everyone signed in without ever
> appearing in the public page source, plus a per-device `localStorage` copy.
> To update or remove it later, click the **🔑** button again (clearing the
> field removes it and falls back to Open-Meteo). The location keys (`awKey`)
> are the numbers already in each AccuWeather URL, so no extra "find location"
> call is spent.

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
- **Offline / preview:** with no live backend (the in-chat preview, or before the
  API key is set) the panel shows a short "needs the live page" note instead of a
  composer, matching how maps and sync already degrade.

## Hosting one shared link (GitHub Pages)

So everyone opens the same URL instead of passing files around, the repo ships
a GitHub Actions workflow — [`.github/workflows/pages.yml`](.github/workflows/pages.yml)
— that publishes to GitHub Pages automatically:

1. Every push to **`main`** builds and deploys the site (the workflow enables
   Pages for the repo on its first run, so no manual *Settings → Pages* step is
   needed). You can also run it on demand from the **Actions** tab
   (*Deploy to GitHub Pages → Run workflow*).
2. Once the first run finishes, the planner is served at
   `https://<user>.github.io/RemotePhoneTripPlanning/` (a root `index.html`
   redirects to `dr-itinerary.html`, which also stays reachable directly).

> Prefer the classic *Deploy from a branch* setup instead? Delete the workflow
> and set **Settings → Pages → Deploy from a branch** to `main` / `/ (root)`.

## Notes & trade-offs

- **Concurrency:** writes save the whole state blob (last-write-wins). If two
  people edit *different* fields within the same ~0.4s window, one change can be
  dropped. Rare for a trip planner. Hardening later = per-field writes.
- **Offline / chat preview:** if Firebase or the network isn't available (e.g. the
  in-chat preview, or before the API key is set), the page skips the sign-in gate
  and runs locally with `localStorage` so the itinerary is still viewable; maps
  also need a network connection to load. Live sync and the sign-in gate are
  active only on the hosted/online page with the API key filled in.
- **Also secure Realtime Database reads app-wide:** the rules above only cover
  `/trips`. If you keep other data in this database, add a top-level default like
  `".read": false, ".write": false` outside `trips` so nothing else is exposed.
