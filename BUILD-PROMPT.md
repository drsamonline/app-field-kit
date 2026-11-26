BUILD PROMPT — Field Kit   (plan row #24 of 37)

## Inputs

```
APP:        Field Kit
SPEC:       QUEUE/app-aviary.md
REPO:       https://github.com/drsamonline/app-field-kit   (empty)
            the plan also matches: fieldkit, field-kit, app-aviary, aviary
PLAN_ROW:   #24
MERGED:     aviary, herbarium, constellation, sound-map
```

This build absorbs 4 specs into one app. Their must-nots still bind, and all of them are quoted below.

Needs before it can ship: on-device model/OCR, hardware access

Rule 0 — check these existing repos before writing code, in case one already does the job: `ambient-sound-studio`

---

## What you are building

One app, from its spec, into that repo. Nothing else. Not a second app, not a kit unless the
spec needs one, not a refactor of a neighbour.

### The house rules (they are not preferences)

- **Offline-first, always.** No server, no account, no telemetry, no network call at runtime.
  If the app needs a model, it ships in the app or the app says what it cannot do.
- **Single-file where possible.** One `docs/play/index.html` with its kits beside it. The
  build kit (`app-builder`) turns that into a Windows EXE and an Android APK — so the same
  bytes must work as a file:// page, an installed PWA and an APK.
- **The spec's "what it must NOT do" are test assertions, not prose.** Each one becomes a
  named test that fails if the app ever does it.
- **The spec's "what it does when things go wrong" is four cases**, and all four ship:
  bad input, no network, storage full or unavailable, corrupt saved state. An app that
  silently treats "no data" as "no matches" is not done.
- **Nothing is fabricated.** No invented data, no placeholder screenshot presented as a live
  capture, no badge nobody measures, no sample corpus passed off as the real thing. If an
  asset must be supplied by the owner, say so and leave the slot visibly empty.
- **India is the default audience**: ₹, lakh/crore, metric, dd/mm/yyyy, IST, and the local
  examples before the international ones.
- **Licence:** PolyForm Noncommercial 1.0.0 unless the spec says otherwise; SPDX headers on
  every source file; `data/SOURCE.md` recording the source, the licence of the **data**, and
  the fetch date for anything not written by us.

### Step 0 — Preflight (before you claim anything is missing)

1. Read the spec. Read its master-list row. Read its `PLAN.json` row, including `members` —
   a merged build's other specs are in `QUEUE/archive/` and their must-nots still apply.
2. **Rule 0: check the estate first.** Search the org for an app that already does this job.
   If one does, stop and report the collision with the repo name. Building the second version
   of a shipped app is the most expensive mistake available here.
3. Ask which credential you are holding. A `gh` 404 is a wrong credential, never proof of
   absence. Any finding of "impossible" must name the credential it was attempted with.
4. **You cannot create repositories.** If the repo does not exist, that is the owner's step —
   say so and stop. An empty repo that exists is yours to fill.

### Step 1 — Scope it in writing, before code

Produce a short block and keep it for the final report:

- the job, in one sentence;
- the mechanic that makes it not-generic, in one sentence;
- every **must-not**, as a test name;
- the four failure cases, as behaviour;
- the kits it needs (from the spec) and whether each already exists;
- what the app will **not** do in v1, explicitly.

If the app needs a capability no kit has: create the kit first, with its own test, and say so.

### Step 2 — Scaffold, do not hand-roll

`python3 scripts/new-app.py <app-id>` writes the shape:

```
docs/index.html          landing page (what it is, honest status, how to run it)
docs/play/index.html     the app itself
docs/play/*.js           the kits it vendors, next to the page that loads them
tests/self-tests.js      assertions, no framework
PAGES.json               the page manifest
README.md                what it does, how to run, what is not built
```

**Then prove the shape before you fill it:** every `<script src>` in the page must resolve to
a file that exists beside it. A scaffold has shipped here before with the kits in the wrong
folder, and the page 404'd its own runtime while the build stayed green.

If the repo is empty and `scripts/` is not available to you, build the same shape by hand —
the file list above is the contract, not the script.

### Step 3 — Build to the spec

Work the spec top to bottom. Where the spec is silent, choose the smaller behaviour and say
so in the report. Where the spec and the master-list one-liner disagree, **the spec body
wins** and the disagreement goes in the report (five such contradictions are already known).

### Step 4 — Tests that could fail

- `node tests/self-tests.js` — every must-not is an assertion; every failure case is a case.
- Print the count. A suite of 0 assertions is a failure, not a pass.
- **Mutation-test it**: break three things on purpose (remove a guard, make a refused input
  succeed, report a failed save as saved) and confirm the suite goes red each time. Restore.
- If the suite cannot go red, it is documentation, not a test.

### Step 5 — Deliver

- Pages on, demo live at `https://drsamonline.github.io/<repo>/`, and the demo **is** the app
  (no separate build of the page).
- A release with the EXE and APK from `app-builder`, built from the same source.
- Topics set (they are the discovery surface), licence headers, `CHANGELOG.md`, `NOTICE`.
- README states the real status: what works, what does not, what is untested.

### Step 6 — Record it

- Append one line to `PROGRESS.log`: what was built, the test counts, the demo URL, what was
  **not** built and why.
- **Do not edit `QUEUE/PLAN.json`.** `tools/queue-sync.py` flips the row to `built` when the
  repo and its Pages answer. Writing `built` by hand is how a plan starts lying.
- Do not edit `ACTIONS.md` — its build order is generated.

### Step 7 — Report in this shape

```
APP      <name>  (plan row #<order>, <n> specs merged)
REPO     <url>   commit <sha>
DEMO     <url>
TESTS    <n>/<n> assertions, mutation-tested <n> ways
BUILT    <the features that exist>
NOT BUILT <the features the spec asks for that do not, and why>
MUST-NOT <each one, and the test that holds it>
NEEDS    <what only the owner can supply: assets, keys, data, a decision>
NEXT     <the smallest honest next step for this app, or "done">
```

Never write "done" for a feature you did not prove. `unverified` with the reason is a better
line than a green claim.

---

## Definition of done (the owner's, not yours)

> A working app, with a working release, a landing page, and a live demo where the app is a
> web app — and the tests that prove the must-nots, run in CI.

Anything less is `partial`, and the report says which of the three is missing.

---

## When you are blocked

Say which of these it is, in one line, and stop:

- **no spec** → the spec is the next step, not the code;
- **the app already exists** → name the repo and the overlapping features;
- **the repo does not exist** → the owner creates it; you cannot;
- **a capability no kit has** → the kit is the next step;
- **an asset only the owner has** (a photo, a UPI ID, a licensed corpus, a key) → build the
  slot, leave it visibly empty, name what is needed;
- **a credential that cannot see the thing** → name the credential, not a verdict.

---

## The five ways this has gone wrong before

1. **Built the second version of a shipped app** — Rule 0 exists because of it.
2. **Shipped a scaffold whose page could not load its own kits** — prove every `src` resolves.
3. **Claimed a badge or a status nobody measures** — a green shield that lies is worse than none.
4. **Logged "done" from an exit code** — the verdict is the artifact on the branch, not git's
   exit status.
5. **Reported the system blocked on the strength of the wrong credential** — a 404 is a
   credential, not a fact.

---

# THE SPEC — Field Kit (`app-aviary`)

# Aviary

- **id:** app-aviary
- **category:** Offline-first
- **tier:** —
- **source:** the app master list, #82
- **status:** READY - spec written from the idea's own build prompt

## Pitch

identify birds by their song, offline

## The spec

**Prompt:**
Build an offline app called **Aviary** that listens to a bird call and identifies
the species using an **on-device acoustic model**, then logs it to a personal
lifelist.

Implement:
- Record a few seconds of birdsong; convert to a spectrogram on-device and run a
  classifier over a bundled set of regional species.
- Show ranked guesses with confidence and a playback of the reference call for
  comparison.
- Log confirmed IDs to a **lifelist** with time, place and a saved clip.
- A "dawn chorus" mode that passively listens and tallies species over a session.

Offline architecture: on-device spectrogram + TFLite classifier; the species set
is bundled (per region as downloadable packs the user installs once, then fully
offline).

Novelty: a **Shazam for birds** that lives entirely on your phone and builds a
personal field record — usable where there is no signal at all.

Stack: mobile front end + on-device audio model (YAMNet-style) + local lifelist.

Deliverable: a prototype that identifies a small set of calls and logs them.

---

## What it must NOT do

- grow a second job. If a request needs "and", it is two apps.

## What it does when things go wrong

- **Bad input** — a clip with no bird in it returns "nothing recognised" with the spectrogram shown, so
  the user can see what the app heard. It never returns a ranked guess at low confidence as if it knew.
- **No network** — nothing changes after the region pack is installed. Before that, the app says the
  pack is missing and which species set it would add; it does not fall back to a generic guess.
- **Storage full or unavailable** — the identification still runs; the lifelist entry and the saved clip
  are not written, and the app says the sighting was not kept rather than showing it as logged.
- **Corrupt saved state** — an unreadable lifelist is reported and offered for export. The app does not
  start an empty lifelist over it, which would read as a lost field record.

## The data

- everything on the device; nothing leaves it unless the user exports it.

## Done means

- Playing back **any bundled reference call** puts its own species **first** in the ranked list, and no two reference calls share a top result. A **speech recording** returns no species above the confidence threshold, or a stated 'not a bird' — never a confident wrong ID. A confirmed ID appears in the lifelist with its time, place and saved clip, and survives a reload with the network off.

---

# SPECS THIS BUILD ABSORBS (3)

## `app-herbarium` — Herbarium

**Pitch**

a field guide that learns your patch

**What it must NOT do**

- grow a second job. If a request needs "and", it is two apps.

**What it does when things go wrong**

- **Bad input** — an image too small to match, or one with no match above the stated threshold, returns
  **no match and names the threshold**. It never names a species on a weak match, and a bundled toxic
  lookalike raises the lookalike warning rather than only the species — the done-means requires both
  directions.
- **No network** — nothing changes. The reference photos are bundled and nothing is uploaded.
- **Storage full or unavailable** — a sighting that cannot be saved is reported and does not appear on the
  map.
- **Corrupt saved state** — unreadable sightings are reported rather than reset, because an empty map reads
  as "you have recorded nothing".

**The spec (the prompt it was written from)**

**Prompt:**
Build an offline app called **Herbarium** that identifies plants (and warns about
lookalike toxic species) using an **on-device vision model**, and gradually builds
a personal map of the flora around you.

Implement:
- Point the camera at a leaf/flower; an on-device classifier suggests species with
  confidence, and explicitly flags dangerous lookalikes.
- Every confirmed sighting is logged with location + date into a **personal
  herbarium** (a map of what grows where, blooming over time).
- A seasonal view: "what should be flowering near me this month."
- Notes and photos per species, all stored locally.

Offline architecture: on-device image classification (TFLite/Core ML); the whole
field guide ships in the app; no network needed for ID.

Novelty: a field guide that **becomes yours** — it accumulates a living, local
record instead of being a static reference. Safety-first lookalike warnings built in.

Stack: mobile front end + on-device vision model + local geo store.

Deliverable: a prototype identifying a small set of species from images and logging
sightings to a local map.

---

## `app-constellation` — Constellation

**Pitch**

Point at the sky and identify what you're seeing, offline.

**The job**

- Hold the phone at the sky and find out which stars, constellations and planets you are looking at, with no network.

**The mechanic**

- It computes the sky from the device's own time and position against a bundled star catalogue, so the answer is calculated rather than looked up. Orientation comes from the compass and accelerometer — and when those disagree or are missing, it says so instead of inventing a direction.

**What it must NOT do**

- claim a position it does not have a fix for, or draw a body that is below the horizon. A star that is not up is shown as not up.

**What it does when things go wrong**

- **Bad input** — a device with no compass or no orientation permission is told plainly that pointing
  cannot work, and the app offers the manual sky map instead of a wrong bearing.
- **No network** — nothing changes. The catalogue is bundled.
- **Storage full or unavailable** — there is nothing to write; the app works entirely from the bundle
  and any saved favourites fail with a notice.
- **Corrupt saved state** — an unreadable favourites list is reported and reset only with agreement; the
  catalogue itself is read-only and cannot be corrupted by use.

**Kits it will need**

- `web-kit` for the shell, storage and the PWA
- `astro-kit` for the positions
- `export-kit` for a saved sky

## `app-sound-map` — Sound Map

**Pitch**

Record and map the ambient sounds of places.

**The job**

- Map a space by its sound, not its plan.

**The mechanic**

- It records the ACOUSTIC character of a place, so a room is recognisable by how it sounds rather than how it looks.

**What it must NOT do**

- record conversations. It records the acoustic signature and stores no speech.

**What it does when things go wrong**

- **Bad input** — a recording too short to characterise a place is refused with the minimum, and a
  place with no position fix is refused rather than pinned at 0,0.
- **No network** — nothing changes. Recording and mapping are on the device.
- **Storage full or unavailable** — recording stops and the app says how much was kept; the place is
  not added to the map from a partial signature.
- **Corrupt saved state** — an unreadable map is reported and offered for export; places whose audio
  cannot be read are named as unplayable rather than deleted.

**Kits it will need**

- `web-kit` for the shell, storage and the PWA
- web-kit, audio-kit, art-kit

---

## After the build

- Append one line to `PROGRESS.log`. Do **not** edit `QUEUE/PLAN.json` — `tools/queue-sync.py` moves row #24 to `built` when the repo and its Pages answer.
- Report in the shape the brief asks for. Anything you did not prove is `unverified`, not done.
