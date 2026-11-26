/* aviary-core — the engine behind Field Kit.
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * (c) 2026 Dr Sohil Momin
 *
 * ONE JOB: listen to a bird call and log what it was.
 *
 * WHAT THIS IS NOT: there is no trained acoustic model in this estate. The bundled "reference calls"
 * are SYNTHETIC feature templates — six-band spectral sketches written by hand, not recordings of real
 * birds — and identification is nearest-neighbour over those templates. It is a real matcher over
 * illustrative data, and the app says so everywhere. It does not identify a bird you heard in a tree.
 *
 * WHAT THIS IS: the ranking, the confidence threshold, the "not a bird" band, and the lifelist are
 * real, and they are the parts the spec's done-means can test.
 *
 * Pure functions: no DOM, no network, no storage, no audio capture.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.AviaryCore = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var VERSION = "1.0.0";
  var BANDS = 6;
  var THRESHOLD = 0.62;
  /* the distance at which a sketch counts as unlike any bundled call */
  var SPREAD = 0.35;

  var DISCLAIMER = "The reference calls in this app are synthetic spectral sketches, not recordings, and there is no trained acoustic model here. The ranking, the confidence and the lifelist are real; the identification is not a real bird identification.";

  /* Six bands, low to high. Templates, not audio. */
  var SPECIES = [
    { id: "koel", name: "Asian koel", place: "common in Indian cities", bands: [0.10, 0.18, 0.55, 0.85, 0.40, 0.12] },
    { id: "bulbul", name: "Red-vented bulbul", place: "gardens and scrub", bands: [0.30, 0.65, 0.80, 0.45, 0.20, 0.08] },
    { id: "tailorbird", name: "Common tailorbird", place: "hedges", bands: [0.55, 0.85, 0.60, 0.30, 0.15, 0.10] },
    { id: "myna", name: "Common myna", place: "everywhere", bands: [0.35, 0.50, 0.45, 0.60, 0.55, 0.30] },
    { id: "pigeon", name: "Rock dove", place: "ledges and stations", bands: [0.80, 0.60, 0.25, 0.10, 0.05, 0.02] },
    { id: "crow", name: "House crow", place: "everywhere", bands: [0.70, 0.72, 0.40, 0.20, 0.10, 0.05] },
    { id: "sparrow", name: "House sparrow", place: "eaves and markets", bands: [0.45, 0.55, 0.70, 0.65, 0.35, 0.15] },
    { id: "owl", name: "Spotted owlet", place: "old trees at night", bands: [0.20, 0.30, 0.35, 0.50, 0.75, 0.60] }
  ];

  /* A speech-like sketch: energy spread across the mid bands, no harmonic peak — unlike every template
   * above, so it must land under the threshold. It is a sketch, not a recording of anyone talking. */
  var SPEECH = [0.30, 0.50, 0.55, 0.50, 0.35, 0.25];

  function clean(s) { return String(s == null ? "" : s).replace(/\s+/g, " ").trim(); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function ddmm(ms) { var d = new Date(ms); return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear(); }
  function hhmm(ms) { var d = new Date(ms); return pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  function stamp(when) { var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(when || "")); return m ? m[3] + "-" + m[2] + "-" + m[1] : "undated"; }

  function species() { return SPECIES.map(function (s) { return { id: s.id, name: s.name, place: s.place, bands: s.bands.slice() }; }); }
  function reference(id) { var s = SPECIES.filter(function (x) { return x.id === id; })[0]; return s ? { id: s.id, name: s.name, bands: s.bands.slice() } : null; }

  function distance(a, b) {
    var sum = 0;
    for (var i = 0; i < BANDS; i++) { var d = (a[i] || 0) - (b[i] || 0); sum += d * d; }
    return Math.sqrt(sum);
  }

  /* Ranked guesses, with a confidence and a threshold. Below the threshold the app says "not a bird"
   * rather than picking the least-bad species — a confident wrong ID is the one failure that matters. */
  function identify(bands) {
    if (!Array.isArray(bands) || bands.length !== BANDS) {
      return { ok: false, field: "bands", reason: "a call needs " + BANDS + " spectral bands" };
    }
    var ranked = SPECIES.map(function (s) {
      var d = distance(bands, s.bands);
      /* confidence is scaled to the SPREAD of these sketches, not to the whole unit cube: two templates
       * are often only 0.2 apart, so a call 0.25 from the nearest one is genuinely unlike all of them */
      return { id: s.id, name: s.name, place: s.place, distance: Math.round(d * 1000) / 1000, confidence: Math.max(0, Math.round((1 - d / SPREAD) * 100) / 100) };
    }).sort(function (a, b) { return a.distance - b.distance || a.name.localeCompare(b.name); });

    var best = ranked[0];
    var above = ranked.filter(function (r) { return r.confidence >= THRESHOLD; });
    if (!above.length) {
      return {
        ok: true, notABird: true, ranked: ranked, threshold: THRESHOLD, best: null,
        says: "Not a bird, or not one of the " + SPECIES.length + " bundled sketches: the best match is " + best.name + " at " +
          Math.round(best.confidence * 100) + "%, under the " + Math.round(THRESHOLD * 100) + "% threshold. No species is offered.",
        disclaimer: DISCLAIMER
      };
    }
    return {
      ok: true, notABird: false, ranked: above, all: ranked, threshold: THRESHOLD, best: above[0],
      says: "Most likely " + above[0].name + " at " + Math.round(above[0].confidence * 100) + "% — one of " + above.length + " above the threshold.",
      disclaimer: DISCLAIMER
    };
  }

  /* ---------------------------------------------------------------- lifelist */

  function confirm(list, input, now) {
    var id = clean(input && input.speciesId);
    var sp = SPECIES.filter(function (s) { return s.id === id; })[0];
    if (!sp) return { ok: false, field: "speciesId", reason: "a confirmed ID has to be one of the bundled species" };
    var place = clean(input && input.place);
    if (!place) return { ok: false, field: "place", reason: "a lifelist entry needs a place" };
    var at = now || Date.now();
    var entry = {
      id: "l" + ((list || []).length + 1) + "-" + at,
      speciesId: sp.id, name: sp.name,
      at: at, on: ddmm(at), clock: hhmm(at), place: place,
      clip: clean(input && input.clip) || "clip-" + at,
      confidence: Number(input && input.confidence) || 0
    };
    return { ok: true, list: (list || []).concat([entry]), entry: entry, says: sp.name + " logged at " + place + " on " + ddmm(at) + " " + hhmm(at) + "." };
  }

  /* ------------------------------------------------------------- dawn chorus */

  /* Passive tally: feed sketches in, get species counts out. Nothing is confirmed by this — it is a
   * tally, and the app says so. */
  function chorusStart(now) {
    return { startedAt: now || Date.now(), tallies: [], notBirds: 0 };
  }
  function chorusFeed(session, bands, now) {
    var out = identify(bands);
    if (!out.ok) return { ok: false, reason: out.reason };
    var s = { startedAt: session.startedAt, tallies: session.tallies.slice(), notBirds: session.notBirds, lastAt: now || Date.now() };
    if (out.notABird) s.notBirds++;
    else {
      var hit = s.tallies.filter(function (t) { return t.id === out.best.id; })[0];
      if (hit) hit.count++; else s.tallies.push({ id: out.best.id, name: out.best.name, count: 1 });
    }
    s.tallies.sort(function (a, b) { return b.count - a.count || a.name.localeCompare(b.name); });
    return { ok: true, session: s, says: out.says };
  }

  function serialize(list) {
    return JSON.stringify({ version: VERSION, format: "aviary-lifelist-1", list: (list || []).map(function (e) {
      return { id: e.id, speciesId: e.speciesId, name: e.name, at: e.at, on: e.on, clock: e.clock, place: e.place, clip: e.clip, confidence: e.confidence };
    }) }, null, 2);
  }
  function parseState(text) {
    var raw = String(text == null ? "" : text);
    if (!raw.trim()) return { ok: false, empty: true, reason: "no bird has been logged on this device yet", raw: raw };
    var data;
    try { data = JSON.parse(raw); }
    catch (e) { return { ok: false, unreadable: true, reason: "The saved lifelist cannot be read. It was NOT replaced with an empty one; export it to keep it.", raw: raw }; }
    if (!data || !Array.isArray(data.list)) return { ok: false, unreadable: true, reason: "The saved file holds no lifelist. Nothing was started over it; export it to keep it.", raw: raw };
    return { ok: true, list: data.list.map(function (e) {
      return { id: String(e.id || ""), speciesId: String(e.speciesId || ""), name: String(e.name || ""), at: Number(e.at) || 0, on: String(e.on || ""), clock: String(e.clock || ""), place: String(e.place || ""), clip: String(e.clip || ""), confidence: Number(e.confidence) || 0 };
    }), raw: raw };
  }
  function exportFile(what, payload, meta, writer) {
    meta = meta || {};
    if (typeof writer !== "function") return { ok: false, reason: "the file was not written: no writer is available in this browser" };
    var name, body, mime = "application/json";
    if (what === "lifelist") { name = "aviary-lifelist-" + stamp(meta.when) + ".json"; body = serialize(payload.list); }
    else if (what === "raw") { name = "aviary-unreadable-" + stamp(meta.when) + ".txt"; body = String(payload.raw || ""); mime = "text/plain;charset=utf-8"; }
    else return { ok: false, reason: "nothing was written: unknown export \u201c" + what + "\u201d" };
    try {
      var wrote = writer(name, body, mime);
      if (wrote === false) return { ok: false, filename: name, reason: "the file was not written: the browser refused the save" };
      return { ok: true, filename: name, bytes: body.length };
    } catch (e) {
      var why = e && e.name === "QuotaExceededError" ? "storage is full" : (e && e.message ? e.message : "storage is unavailable");
      return { ok: false, filename: name, reason: "the file was not written: " + why };
    }
  }

  return {
    version: VERSION, BANDS: BANDS, THRESHOLD: THRESHOLD, DISCLAIMER: DISCLAIMER,
    species: species, reference: reference, identify: identify,
    confirm: confirm, chorusStart: chorusStart, chorusFeed: chorusFeed,
    serialize: serialize, parseState: parseState, exportFile: exportFile,
    SPEECH: SPEECH.slice()
  };
});
