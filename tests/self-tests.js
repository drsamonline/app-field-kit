#!/usr/bin/env node
/* self-tests — Field Kit (Aviary). SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0 · (c) 2026 Dr Sohil Momin
 * Done-means: every bundled reference call puts its own species first and no two share a top result; a
 * speech recording returns nothing above the threshold or a stated 'not a bird'; a confirmed ID is in the
 * lifelist with time, place and clip, and survives a reload. */
"use strict";
var fs = require("fs"), path = require("path");
var ROOT = path.join(__dirname, "..");
var A = require(path.join(ROOT, "docs", "play", "aviary-core.js"));
var passed = 0, failed = [], group = "";
function section(n) { group = n; }
function ok(n, c, d) { if (c) { passed++; return; } failed.push(group + " :: " + n + (d ? " — " + d : "")); }
function eq(n, a, b) { ok(n, a === b, "expected " + JSON.stringify(b) + ", got " + JSON.stringify(a)); }
function read(f) { return fs.readFileSync(path.join(ROOT, f), "utf8"); }
function strip(s) { return s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, ""); }

section("done means — every bundled reference call puts its own species first");
var tops = A.species().map(function (s) { return { want: s.id, got: A.identify(s.bands).best.id, conf: A.identify(s.bands).best.confidence }; });
ok("every call identifies as its own species", tops.every(function (t) { return t.want === t.got; }), JSON.stringify(tops));
ok("at full confidence", tops.every(function (t) { return t.conf === 1; }));
eq("eight species are bundled", A.species().length, 8);

section("done means — no two reference calls share a top result");
var distinct = {};
tops.forEach(function (t) { distinct[t.got] = true; });
eq("eight distinct top results", Object.keys(distinct).length, 8);
ok("and no two are the same", new Set(tops.map(function (t) { return t.got; })).size === tops.length);

section("done means — a speech recording returns nothing above the threshold");
var speech = A.identify(A.SPEECH);
eq("it is not called a bird", speech.notABird, true);
eq("no species is offered", speech.best, null);
ok("and it says 'not a bird' in words", /^Not a bird/.test(speech.says), speech.says);
ok("the best match is named but under the threshold", speech.ranked[0].confidence < A.THRESHOLD, speech.ranked[0].confidence);
ok("and the reason says no species is offered", /No species is offered/.test(speech.says), speech.says);
ok("a call slightly off a template still identifies, so the threshold is not just refusing everything", (function () {
  var off = A.species()[0].bands.map(function (b) { return Math.min(1, Math.max(0, b + 0.05)); });
  var r = A.identify(off);
  return !r.notABird && r.best.id === "koel";
})());
eq("a call with the wrong number of bands is refused", A.identify([1, 2]).field, "bands");

section("done means — a confirmed ID is in the lifelist with time, place and clip");
var at = Date.UTC(2026, 10, 26, 6, 10);
var made = A.confirm([], { speciesId: "koel", place: "Pune, balcony", clip: "clip-1", confidence: 1 }, at);
eq("the entry is made", made.ok, true);
eq("with the species", made.entry.name, "Asian koel");
eq("with the date", made.entry.on, "26/11/2026");
eq("with the time", made.entry.clock, "06:10");
eq("with the place", made.entry.place, "Pune, balcony");
eq("with the clip", made.entry.clip, "clip-1");
eq("a confirmed ID must be a bundled species", A.confirm([], { speciesId: "unicorn", place: "x" }, at).field, "speciesId");
eq("a lifelist entry needs a place", A.confirm([], { speciesId: "koel" }, at).field, "place");

section("done means — and survives a reload with the network off");
var file = A.serialize(made.list);
var back = A.parseState(file);
eq("the lifelist parses", back.ok, true);
eq("the entry survives", back.list.length, 1);
eq("with its place", back.list[0].place, "Pune, balcony");
eq("with its time", back.list[0].clock, "06:10");
eq("with its clip", back.list[0].clip, "clip-1");
ok("no network code anywhere", !/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/.test(strip(read("docs/play/aviary-core.js") + read("docs/play/app.js"))));
ok("the page forbids connections", /connect-src 'none'/.test(read("docs/play/index.html")));

section("must-not — never a confident wrong ID");
ok("the threshold exists and is stated", A.THRESHOLD > 0 && A.THRESHOLD < 1);
ok("below it, nothing is offered", A.identify([0.5, 0.5, 0.5, 0.5, 0.5, 0.5]).notABird === true);
ok("the app carries the disclaimer", /no trained acoustic model here/.test(A.DISCLAIMER), A.DISCLAIMER);
ok("and every result repeats it", /synthetic spectral sketches/.test(speech.disclaimer));
ok("the bundled calls are called sketches, not recordings", /not recordings/.test(A.DISCLAIMER));

section("the dawn chorus tallies, and confirms nothing");
var c = A.chorusStart(1);
c = A.chorusFeed(c, A.species()[0].bands, 2).session;
c = A.chorusFeed(c, A.species()[0].bands, 3).session;
c = A.chorusFeed(c, A.SPEECH, 4).session;
eq("the koel is tallied twice", c.tallies[0].count, 2);
eq("the speech is counted as not-a-bird, not as a species", c.notBirds, 1);
eq("and only one species is in the tally", c.tallies.length, 1);

section("storage");
var bad = A.parseState("{ broken list");
eq("a broken lifelist is reported", bad.ok, false);
eq("it is marked unreadable", bad.unreadable, true);
ok("it was not replaced", /NOT replaced with an empty one/.test(bad.reason), bad.reason);
eq("nothing saved yet is distinguished", A.parseState("").empty, true);
var thrown = A.exportFile("lifelist", { list: made.list }, { when: "26/11/2026" }, function () { var e = new Error("q"); e.name = "QuotaExceededError"; throw e; });
eq("a failed write is reported", thrown.ok, false);
ok("it says the file was not written", /not written/.test(thrown.reason));

section("shape — every script the page loads exists beside it");
var page = read("docs/play/index.html");
var srcs = (page.match(/<script[^>]+src="([^"]+)"/g) || []).map(function (t) { return t.replace(/.*src="([^"]+)"/, "$1"); });
srcs.forEach(function (x) { ok("script src resolves: " + x, fs.existsSync(path.join(ROOT, "docs", "play", x.replace(/^\.\//, "")))); });
ok("the landing page exists", fs.existsSync(path.join(ROOT, "docs", "index.html")));
ok("the page manifest exists", fs.existsSync(path.join(ROOT, "PAGES.json")));
ok("the web manifest exists", fs.existsSync(path.join(ROOT, "docs", "play", "manifest.webmanifest")));

var total = passed + failed.length;
if (!total) { console.error("self-tests: 0 assertions ran."); process.exit(1); }
if (failed.length) { console.error("self-tests: " + passed + "/" + total + " passed, " + failed.length + " FAILED"); failed.slice(0, 12).forEach(function (f) { console.error("  FAIL " + f); }); process.exit(1); }
console.log("self-tests: " + passed + "/" + total + " assertions passed");
