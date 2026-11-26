# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Dates: dd/mm/yyyy.

## [Unreleased]

## [1.0.0] — 26/11/2026

### Added
- **Ranked identification** of a six-band spectral sketch against eight bundled templates, with a
  confidence per species.
- A **threshold** (0.62) below which the app says **not a bird** and offers **no species** — a confident
  wrong ID is the one failure that matters, so the app would rather say nothing.
- Confidence scaled to the **spread of the bundled sketches**, not to the whole unit cube: two templates
  are often only 0.2 apart, so a call 0.25 from the nearest is genuinely unlike all of them.
- A **lifelist** — species, time, place, clip — that survives a reload with no network.
- A **dawn chorus** tally that counts species over a session and counts a non-bird as a non-bird, and
  confirms nothing.
- Refusals: a sketch with the wrong number of bands, a sighting with no place, a species that is not
  bundled.
- An unreadable lifelist is reported and offered for export, never replaced with an empty one.
- A failed save says **NOT SAVED**, and the sighting is not in the lifelist.
- PWA shell, CI (48 engine assertions + 16 in jsdom + page smoke), and the app-builder pipeline pinned to
  the canonical SHA for the EXE/APK/Linux release.

### Not built
- **Recording, spectrogram computation from audio, and a trained classifier.** None of those exist in
  this estate. The bundled calls are synthetic sketches, and the app says so on the page, in the app, in
  NOTICE and here.
