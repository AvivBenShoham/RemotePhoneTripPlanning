# RemotePhoneTripPlanning

An interactive **React (Vite)** trip planner for an 11-day Dominican Republic
loop for two (Aug 11–21, 2026). Per-day Leaflet maps, live-updating cost totals,
booking & accommodation trackers, toggleable optional activities, and a trip
to-do checklist. It builds to static files and deploys to GitHub Pages.

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

Each night has an accommodation card that stores its place name, nightly price,
booking link, a **free-cancellation-until date** (empty by default = no free
cancellation), and free-text **booking notes** (e.g. *"free cancellation until
28/07"*). Every field — including the new cancellation date and notes — is part
of the shared state and **syncs live via Firebase** (see below), so the whole
group sees the same details.

Cards are **collapsed by default** to keep day cards compact: the collapsed
header shows only whether the stay is booked and its cancellation status (plus
any booking note underneath). Tap the header to expand and edit.

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
