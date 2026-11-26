#!/usr/bin/env node
/* ui-tests — the Aviary page in a real DOM (jsdom). SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0 · (c) 2026 Dr Sohil Momin */
"use strict";
var fs = require("fs"), path = require("path"), { JSDOM } = require("jsdom");
var ROOT = path.join(__dirname, ".."), PLAY = path.join(ROOT, "docs", "play");
var passed = 0, failed = [];
function ok(n, c, d) { if (c) { passed++; return; } failed.push(n + (d ? " — " + d : "")); }
function eq(n, a, b) { ok(n, a === b, "expected " + JSON.stringify(b) + ", got " + JSON.stringify(a)); }
function build(seed) {
  var dom = new JSDOM(fs.readFileSync(path.join(PLAY, "index.html"), "utf8"), { url: "https://example.test/play/index.html", runScripts: "outside-only", pretendToBeVisual: true });
  var w = dom.window;
  if (seed) Object.keys(seed).forEach(function (k) { w.localStorage.setItem(k, seed[k]); });
  w.URL.createObjectURL = function () { return "blob:x"; }; w.URL.revokeObjectURL = function () {};
  w.HTMLAnchorElement.prototype.click = function () {};
  ["web-kit.js", "export-kit.js", "aviary-core.js", "app.js"].forEach(function (f) { w.eval(fs.readFileSync(path.join(PLAY, f), "utf8")); });
  return dom;
}
var dom = build(null), w = dom.window, d = w.document, $ = function (id) { return d.getElementById(id); };
ok("the engine loaded", !!w.AviaryCore);
ok("the page says what it is not", /This is not a bird identifier/.test(d.body.textContent));
eq("eight species in the picker", d.querySelectorAll("#pick option").length, 8);

$("pick").value = "koel"; $("rankBtn").click();
ok("the selected call ranks first as itself", /Most likely Asian koel at 100%/.test($("status").textContent), $("status").textContent);
ok("the ranked list is shown", /Asian koel/.test($("rankList").textContent));

$("speechBtn").click();
ok("a speech sketch is refused", /Not a bird/.test($("status").textContent), $("status").textContent);
ok("and no species is offered as the answer", /No species is offered/.test($("rankSays").textContent), $("rankSays").textContent);

$("who").value = "koel"; $("place").value = "Pune, balcony"; $("clip").value = "clip-1"; $("logBtn").click();
ok("a sighting is logged", /Asian koel logged at Pune, balcony/.test($("status").textContent), $("status").textContent);
ok("with time, place and clip on screen", /Pune, balcony · clip-1/.test($("lifeList").textContent), $("lifeList").textContent);
$("place").value = ""; $("logBtn").click();
ok("a sighting with no place is refused", /needs a place/.test($("status").textContent), $("status").textContent);

$("pick").value = "koel"; $("chorusBtn").click(); $("chorusBtn").click();
ok("the chorus tallies", /×2/.test($("chorusList").textContent), $("chorusList").textContent);

$("exportBtn").click();
ok("the lifelist exports", /Wrote aviary-lifelist-\d{4}-\d\d-\d\d\.json/.test($("ioNote").textContent), $("ioNote").textContent);
var saved = w.localStorage.getItem("aviary:lifelist");
var dom2 = build({ "aviary:lifelist": saved });
var d2 = dom2.window.document;
ok("the reload keeps the sighting with its place and clip", /Pune, balcony · clip-1/.test(d2.getElementById("lifeList").textContent), d2.getElementById("lifeList").textContent);

var dom3 = build({ "aviary:lifelist": "{ broken list" });
var d3 = dom3.window.document;
ok("a broken lifelist is reported", /cannot be read/.test(d3.getElementById("status").textContent));
ok("and not replaced", /NOT replaced with an empty one/.test(d3.getElementById("status").textContent));

var dom4 = build(null), w4 = dom4.window, d4 = dom4.window.document;
Object.defineProperty(w4, "localStorage", { configurable: true, get: function () {
  return { getItem: function () { return null; }, setItem: function () { var e = new Error("q"); e.name = "QuotaExceededError"; throw e; }, removeItem: function () {}, clear: function () {} }; } });
d4.getElementById("who").value = "koel"; d4.getElementById("place").value = "x"; d4.getElementById("logBtn").click();
ok("a failed save says NOT SAVED", /NOT SAVED:/.test(d4.getElementById("status").textContent), d4.getElementById("status").textContent);

var total = passed + failed.length;
if (!total) { console.error("ui-tests: 0 assertions ran."); process.exit(1); }
if (failed.length) { console.error("ui-tests: " + passed + "/" + total + " passed, " + failed.length + " FAILED"); failed.forEach(function (f) { console.error("  FAIL " + f); }); process.exit(1); }
console.log("ui-tests: " + passed + "/" + total + " assertions passed");
