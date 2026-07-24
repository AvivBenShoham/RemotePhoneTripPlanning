# Plan: per-field sync (no more clobbering, live propagation)

## What you asked for

> When I'm editing a field and the other person is also editing, they should
> **not override** my input — and I should get their new inputs, either in real
> time or by pulling.

This is exactly the concurrency caveat the project has had since the first
Firebase version: the itinerary is written as **one whole blob**, last-write
wins on the entire node. This document plans the fix. It is a design only — no
code is changed here.

## How sync works today (and where it breaks)

All shared state lives under one Realtime Database node
(`trips/dr2026`) with a shallow, scalar-leaf shape:

```
trips/dr2026/
  opt/<key>            "moron" | "coson" | "strip" | ...   (optional-activity pick)
  book/<key>/<field>   done:bool, agency:string, price:string
  acc/<dayId>/<field>  booked:bool, name, price, link, cancelUntil, notes
  todo/<id>            { label, done, ts }
```

Everything flows through **`src/hooks/useStore.jsx`**:

- **Write** — every edit calls `update(mutator)` (`Accommodation.jsx`,
  `BookTrack.jsx`, `Todo.jsx`, `Optional.jsx`). It clones the whole store,
  applies the mutation, then `scheduleRemote()` debounces 400 ms and does
  **`dbRef.set(storeRef.current)`** — it replaces the *entire* trip node.
- **Read** — a single **`dbRef.on('value')`** listener receives the *whole*
  snapshot, ignores the echo of its own write (`stableStr` compare against
  `lastWritten`), otherwise `applyRemote()` replaces the whole local store.
- **Type-guard** — if *any* input is focused when a snapshot arrives,
  `applyRemote` holds the *entire* snapshot until `blur`.

### The three failure modes

1. **Cross-field clobber (your bug).** `dbRef.set(whole store)` overwrites the
   whole node with this client's copy. If Karol ticks `todo/t3` while Aviv edits
   `acc/d1/price` inside the debounce + network window, the later `set()` wins
   the *whole node* and drops the other's field. Worse: a client that hasn't yet
   merged a remote change will, on its next edit, write its stale full blob and
   **silently revert** fields it never touched.
2. **Blur-gated visibility.** While you type in *any* field, *all* incoming
   remote updates — even to unrelated fields or the other person's to-dos — are
   frozen until you blur. So you don't see their inputs live.
3. **Whole-store churn.** Applying a snapshot swaps the entire store object, so
   every component re-renders.

The chat feature already avoids all of this: `src/hooks/useChat.jsx` writes each
message with `push()` and listens with `child_added/child_changed/child_removed`
per day. **We should bring the itinerary store up to the same per-record model.**

## Goal

- Concurrent edits to **different** fields never clobber each other.
- Edits to the **same** field resolve predictably (last-write, and *localized* to
  that one field instead of dropping unrelated ones).
- Remote inputs propagate **live** (with a documented pull fallback), without
  freezing the field you're typing in.

## Design — per-leaf writes + granular listeners + surgical merge

Because the tree is already shallow scalars, each leaf maps 1:1 onto an RTDB
path, and `ref.child(path).set(v)` writes **only** that leaf — siblings are
untouched, so two clients writing disjoint paths merge on the server with zero
clobber. Four changes, all inside `useStore.jsx`.

### Change 1 — write only the changed path

Keep the existing `update(mutator)` API so **components don't change**. In the
hook, after mutating the clone, **diff `next` vs the previous store** and write
only the changed leaf paths:

- changed/added leaf → `dbRef.child(path).set(value)`
- removed key (e.g. `Todo.remove` deletes `s.todo[id]`) → `dbRef.child(path).remove()`
- empty string clear → `.remove()` (matches today's "no value" behavior)

The tree is 4 shallow keys, so diffing is trivial. Route text-field writes
through a **per-path debounce** (`Map<path, timer>`, ~300–400 ms) so fast typing
in one field debounces *that path only*; a checkbox toggle can flush
immediately. (Today's single global timer couples every pending field into one
blob write — that coupling goes away.)

> Alternative considered: add an explicit `updatePath(path, value)` API and
> migrate the ~8 call sites. More efficient but touches every component. The
> diff approach keeps the ergonomic `update(mutator)` and is automatically
> correct for any future field, so it's preferred.

### Change 2 — listen per record, merge per leaf

Replace the single whole-node `dbRef.on('value')` with child listeners per
section, mirroring `useChat.jsx`:

```js
for (const section of ['opt', 'book', 'acc', 'todo']) {
  const ref = dbRef.child(section);
  ref.on('child_added',   s => mergeChild(section, s.key, s.val()));
  ref.on('child_changed', s => mergeChild(section, s.key, s.val()));
  ref.on('child_removed', s => dropChild(section, s.key));
}
```

`mergeChild` returns a new store with just `store[section][key]` replaced
(immutable update, so React re-renders only the subtree that consumes it) and
`persistLocal`s it. Granularity is one accommodation / booking / to-do / opt
pick — which is exactly the existing component boundary, so re-renders stay
scoped.

**Echo suppression:** keep a `recentWrites` map (`path → { value, ts }`); skip an
incoming child event whose value matches what we just wrote (within a few
seconds). This is the per-path version of today's `lastWritten`. Even without
it, re-applying our own value is idempotent — the map just avoids a redundant
re-render.

### Change 3 — never freeze the field you're typing in

With per-leaf merges we can be surgical instead of blur-gating the whole app:

- Always merge incoming remote leaves into state immediately — state never goes
  stale.
- Only the **one leaf** you're actively editing needs protection (a remote write
  to that same field would jump your caret, since inputs are controlled off
  `store`). Guard just that case: if `document.activeElement` maps to the same
  `section/key/field` being merged, hold that single leaf until `blur` (a
  per-path version of today's `pendingVal`) and apply every other leaf live.

Result: you keep typing in the price field while the other person's to-do tick
and their edit to a *different* accommodation appear within a second. When you
blur, your field is already saved and was never overwritten.

### Change 4 — seeding, migration, reset (unchanged behavior)

- **First-run seed** (`val === null`): seed once with `dbRef.set(defaultStore)`
  guarded by a flag (or `dbRef.update(store)`), only while the node is empty.
- **To-do migration** (the existing idempotent effect): unchanged — it already
  flows through `update` (now a per-item write) or `applyIncoming` locally.
- **`resetAll()`**: keep it as a deliberate whole-node `dbRef.set(defaultStore)`.
  This is the one place a whole-blob write is correct — an explicit destructive
  reset.
- **Back-compat:** RTDB doesn't care the node was historically written as a blob.
  Child listeners and leaf writes work against the existing data with **no schema
  change, no data migration, and no Firebase rules change** (the `auth != null`
  rules already cover child paths).

## Real-time vs. pull (your "real time or pulling")

Recommend **real-time** via the child listeners above — it's barely more code
than today, matches what chat already does, and gives the "within a second"
experience. If you'd rather not run always-on listeners, the *same* per-leaf
writers work with a manual **Refresh** button doing `dbRef.once('value')` +
merge. Keep pull as a documented fallback, not the default.

## Scope, effort, risk

- **Localized to `src/hooks/useStore.jsx`**: the writer (diff + per-path
  debounce), the listener (child events + merge), and the `recentWrites` echo
  map. **No component edits** under the diff approach; their existing `update()`
  calls simply flow through the new granular path.
- Mirrors a proven in-repo pattern (`useChat.jsx`). Rough size: ~60–90 lines
  changed in one file.
- **Risks / details to get right:**
  - Deletions must go through `child_removed` → `dropChild` (to-do removal, field
    clears).
  - `price` is stored as a string today; leaf writes preserve type — keep empty
    string → `.remove()` so totals still fall back to the default.
  - The whole-blob echo logic (`stableStr` / `lastWritten`) is retired for normal
    edits and kept only on the seed/reset paths.
  - Same-field simultaneous edits still resolve last-write — acceptable, and now
    contained to that field instead of dropping others.

> Not proposing CRDTs / operational transforms — overkill for a two-person trip
> planner. RTDB per-path last-write is sufficient and simple.

## Suggested implementation order

1. Add the per-path writer + `recentWrites` map; make `update(mutator)` diff and
   write leaves. Keep the old `on('value')` listener temporarily.
2. Swap the listener to per-section `child_*` with `mergeChild` / `dropChild`.
3. Add the focused-leaf guard (Change 3); delete the blur-gating of whole
   snapshots.
4. Verify: two browser sessions editing different fields simultaneously (no
   clobber), same field (last-write), and live propagation while typing.
