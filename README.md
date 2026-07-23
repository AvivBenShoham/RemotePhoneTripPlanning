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
3. **Set the security rules** — in the database's *Rules* tab, paste:
   ```json
   {
     "rules": {
       "trips": {
         "$id": { ".read": true, ".write": true }
       }
     }
   }
   ```
   This is intentionally open (anyone with the link can view/edit) — privacy
   relies on keeping the database URL and trip id unshared. Fine for a private
   trip; see *Locking it down* below to add a gate later.
4. **Copy the database URL** — shown at the top of the Realtime Database page
   (e.g. `https://<project>-default-rtdb.<region>.firebasedatabase.app/`). For a
   database with the public rules above, the URL is all the app needs — there's
   no need to register a web app or copy an API key (those are for Firebase Auth,
   which this app doesn't use).
5. **Paste the URL** into `dr-itinerary.html` — set `databaseURL` in the
   `FIREBASE_CONFIG` block near the top of the `<script>`.
6. That's it. Open the file — edits now sync live for everyone who opens it.

> Want a separate, independent copy of the planner? Change `TRIP_ID` in the file
> (e.g. `"dr2026"` → `"europe2027"`). Each id is its own isolated dataset.

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
- **Offline / chat preview:** if Firebase or the network isn't available, the
  page falls back to device-only `localStorage` and keeps working; maps also need
  a network connection to load.
- **Locking it down:** to gate access, add a shared trip code and tighten the
  Firebase rules (e.g. require an auth token or a secret path segment) — happy to
  add this on request.
