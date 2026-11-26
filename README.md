# Field Kit — Aviary

Rank a bird call against bundled sketches and keep a lifelist with the time, the place and the clip.
**Offline, with no microphone — and it says what it is not.**

- **Demo:** https://drsamonline.github.io/app-field-kit/play/index.html
- **Landing page:** https://drsamonline.github.io/app-field-kit/
- **Release:** https://github.com/drsamonline/app-field-kit/releases/tag/app-latest
- **Plan row:** #24 of 37 in `drsamonline/forge` → `QUEUE/PLAN.json`
- **Specs absorbed:** `app-aviary` (lead) + 3 absorbed specs
- **Licence:** PolyForm Noncommercial 1.0.0

## Status

| | |
|---|---|
| **Built** | Eight bundled sketches; ranked list with confidences; a threshold below which it says **not a bird** and offers nothing; lifelist with time/place/clip surviving a reload; dawn-chorus tally that confirms nothing. |
| **Release** | Windows EXE, Android APK and Linux binary, built from this source by `app-builder` in CI. |
| **Not built** | **Recording, spectrogram computation from audio, and a trained classifier.** The eight calls are synthetic spectral sketches, not recordings. Said on the page, in the app, in NOTICE and here. |
| **Untested** | Real birdsong. The matcher is exact on its own templates and refuses what is far from them; that is a property of a nearest-neighbour matcher, not evidence that it would identify a koel in a tree. |

## The spec's "done means", counted

| The spec says | The test |
|---|---|
| every bundled reference call puts its own species first | 8/8 at confidence 1.0 |
| no two reference calls share a top result | 8 distinct top results from 8 calls |
| a speech recording returns nothing above the threshold | a speech-like sketch → `notABird: true`, `best: null`, best confidence 0.27 |
| a confirmed ID is in the lifelist with time, place and clip, and survives a reload | logged 26/11/2026 06:10 at "Pune, balcony", clip-1 — and identical after `serialize` → `parseState` |

## Why the confidence had to be rescaled

The first formula (`1 − d/1.7`) put a *speech* sketch at **89% rock dove**. The scale was wrong: the
templates sit in a small part of the unit cube, so almost any point is "close" to something.

Confidence is now scaled to the **spread of the sketches** (`1 − d/0.35`). A template scores 1.0, a call
0.05 away scores 0.86, and the speech sketch scores **0.27** — under the 0.62 threshold, so it is refused.
That change is what makes "not a bird" mean something.

## What it will not do

- **Identify a real bird** — there is no model, and the app says so above the fold.
- **Record audio** — no microphone, no capture.
- **Give a confident wrong ID** — below the threshold, nothing is offered.
- **Confirm from the chorus** — the tally is a tally.
- **Use the internet.**

## When things go wrong

| Case | Behaviour |
|---|---|
| **Bad input** | Wrong band count → refused; no place → refused; a species that is not bundled cannot be confirmed. |
| **No network** | Nothing changes; the lifelist is on the device. |
| **Storage full or unavailable** | **NOT SAVED**, and the sighting is not in the lifelist. |
| **Corrupt saved state** | Reported and offered for export, never replaced with an empty lifelist. |

## Tests

```bash
npm test                      # all three suites
node tests/self-tests.js      # engine — 48 assertions
node tests/ui-tests.js        # the page in jsdom — 16 assertions
node tests/page-smoke.js      # every local src/href resolves, nothing off-origin
```

Mutation-tested six ways on 26/11/2026, all red: the threshold disabled (crash), confidence ignoring the
distance (8 failures), the lifelist dropping the place (2), a non-bird tallied as a species (crash), a
broken lifelist starting empty (3), and any species confirmable (crash).

## A build failure worth recording

The first `Build + deploy` run failed in the **Android APK** job: `Could not resolve
com.google.errorprone:error_prone_annotations:2.3.1`. That is Maven Central rate-limiting, the same
transient failure this fleet hit on `app-voice` — not a defect in this app. Recovery is another push,
because the workflow cannot be re-run with this credential.

## Layout

```
docs/index.html            landing page
docs/play/index.html       the app — rank, log, the lifelist, the chorus
docs/play/app.js           DOM wiring: rank, log, chorus, export, save guard
docs/play/aviary-core.js   the engine — sketches, ranking, threshold, lifelist, chorus
docs/play/web-kit.js       vendored kit (unmodified)
docs/play/export-kit.js    vendored kit (unmodified)
tests/self-tests.js        engine suite (48)
tests/ui-tests.js          page suite (16, jsdom)
tests/page-smoke.js        shape on disk
PAGES.json                 landing = docs/index.html, app = docs/play/index.html
```

## Where the spec was silent, and what was chosen

- **Six bands, Euclidean distance.** A hand-written sketch is the only honest input available without a model, and six bands is enough to separate eight templates.
- **Confidence against the spread, not the cube.** The first formula called a speech sketch "89% rock dove"; the corrected one calls it 27%.
- **A refusal band rather than a least-bad answer.** The spec's own fear — a confident wrong ID — is answered by refusing.
- **The chorus confirms nothing.** Passive listening that wrote to the lifelist would fill it with guesses.
- **Species names are real; the sketches are not their calls.** Said in NOTICE, because that is the sentence someone would otherwise assume wrongly.

## What is not built, and why

**Recording, spectrograms from audio, and a trained classifier.** None exist in this estate. A microphone
button that returned confident nonsense would be worse than the honest absence, so the app ranks sketches
it can actually rank and says plainly what it is.
