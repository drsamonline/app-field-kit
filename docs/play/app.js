/* app — the Aviary page. SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0 · (c) 2026 Dr Sohil Momin
 * Wiring only: the ranking, the threshold and the lifelist live in aviary-core.js.
 * There is no microphone and no audio capture anywhere: the sketches are bundled numbers. */
(function () {
  "use strict";
  var A = window.AviaryCore;
  var $ = function (id) { return document.getElementById(id); };
  var K = "aviary:lifelist";
  var state = { list: [], chorus: A.chorusStart(Date.now()), unreadable: null };

  var els = {
    status: $("status"), pick: $("pick"), rankBtn: $("rankBtn"), speechBtn: $("speechBtn"), rankSays: $("rankSays"), rankList: $("rankList"),
    who: $("who"), place: $("place"), clip: $("clip"), logBtn: $("logBtn"), logSays: $("logSays"), lifeList: $("lifeList"),
    chorusBtn: $("chorusBtn"), chorusReset: $("chorusReset"), chorusSays: $("chorusSays"), chorusList: $("chorusList"),
    exportBtn: $("exportBtn"), ioNote: $("ioNote")
  };

  function today() { var d = new Date(), p = function (n) { return (n < 10 ? "0" : "") + n; }; return p(d.getDate()) + "/" + p(d.getMonth() + 1) + "/" + d.getFullYear(); }
  function setStatus(k, m) { els.status.className = "status show " + k; els.status.textContent = m; }
  function node(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }

  function persist() {
    try { window.localStorage.setItem(K, A.serialize(state.list)); return true; }
    catch (e) { setStatus("bad", "NOT SAVED: " + (e && e.name === "QuotaExceededError" ? "storage is full" : "storage is unavailable") + ". The sighting is not in the lifelist."); return false; }
  }

  function render() {
    els.lifeList.textContent = "";
    if (!state.list.length) els.lifeList.appendChild(node("li", null, "No bird logged yet."));
    state.list.slice().reverse().forEach(function (e) {
      var li = node("li", null, e.name);
      li.appendChild(node("span", "meta", e.on + " " + e.clock + " \u00b7 " + e.place + " \u00b7 " + e.clip));
      els.lifeList.appendChild(li);
    });
    els.chorusList.textContent = "";
    if (!state.chorus.tallies.length) els.chorusList.appendChild(node("li", null, "Nothing tallied yet."));
    state.chorus.tallies.forEach(function (t) {
      var li = node("li", null, t.name + "  \u00d7" + t.count);
      els.chorusList.appendChild(li);
    });
    els.chorusSays.textContent = state.chorus.notBirds ? state.chorus.notBirds + " sketch(es) were not a bird." : "";
  }

  function rank(bands) {
    var out = A.identify(bands);
    if (!out.ok) { setStatus("bad", out.reason); return; }
    els.rankList.textContent = "";
    els.rankSays.textContent = out.says;
    if (out.notABird) {
      setStatus("warn", out.says);
      (out.ranked || []).slice(0, 3).forEach(function (r) {
        var li = node("li", null, r.name + "  \u2014  " + Math.round(r.confidence * 100) + "% (under the threshold)");
        els.rankList.appendChild(li);
      });
      return;
    }
    setStatus("ok", out.says);
    out.ranked.forEach(function (r) {
      var li = node("li", null, r.name + "  \u2014  " + Math.round(r.confidence * 100) + "%");
      li.appendChild(node("span", "meta", r.place));
      els.rankList.appendChild(li);
    });
  }

  function logIt() {
    var out = A.confirm(state.list, { speciesId: els.who.value, place: els.place.value, clip: els.clip.value }, Date.now());
    if (!out.ok) { setStatus("bad", out.reason); return; }
    state.list = out.list;
    var saved = persist();
    render();
    els.logSays.textContent = out.says;
    if (saved) setStatus("ok", out.says);
  }

  function chorus() {
    var sp = A.species().filter(function (s) { return s.id === els.pick.value; })[0];
    if (!sp) return;
    var out = A.chorusFeed(state.chorus, sp.bands, Date.now());
    if (!out.ok) { setStatus("bad", out.reason); return; }
    state.chorus = out.session;
    render();
    setStatus("ok", out.says);
  }

  function doExport() {
    var out = A.exportFile("lifelist", { list: state.list }, { when: today() }, function (name, text, mime) {
      if (!window.Export || typeof window.Export.save !== "function") throw new Error("the export kit did not load");
      window.Export.save(name, text, mime); return true;
    });
    if (out.ok) { els.ioNote.textContent = "Wrote " + out.filename + "."; setStatus("ok", "Exported."); }
    else setStatus("bad", out.reason + ".");
  }

  els.rankBtn.addEventListener("click", function () {
    var sp = A.species().filter(function (s) { return s.id === els.pick.value; })[0];
    if (sp) rank(sp.bands);
  });
  els.speechBtn.addEventListener("click", function () { rank(A.SPEECH); });
  els.logBtn.addEventListener("click", logIt);
  els.chorusBtn.addEventListener("click", chorus);
  els.chorusReset.addEventListener("click", function () { state.chorus = A.chorusStart(Date.now()); render(); setStatus("ok", "New chorus session."); });
  els.exportBtn.addEventListener("click", doExport);

  A.species().forEach(function (s) {
    [els.pick, els.who].forEach(function (sel) {
      var o = document.createElement("option"); o.value = s.id; o.textContent = s.name; sel.appendChild(o);
    });
  });

  var raw = null;
  try { raw = window.localStorage.getItem(K); } catch (e) { raw = null; }
  if (raw) {
    var parsed = A.parseState(raw);
    if (parsed.ok) state.list = parsed.list;
    else {
      state.unreadable = parsed;
      setStatus("bad", parsed.reason);
      var keep = node("button", "small", "Export the unreadable lifelist");
      keep.addEventListener("click", function () {
        var out = A.exportFile("raw", parsed, { when: today() }, function (name, text, mime) {
          if (!window.Export || typeof window.Export.save !== "function") throw new Error("the export kit did not load");
          window.Export.save(name, text, mime); return true;
        });
        setStatus(out.ok ? "ok" : "bad", out.ok ? "Wrote " + out.filename + "." : out.reason);
      });
      els.ioNote.parentNode.insertBefore(keep, els.ioNote);
    }
  }

  render();
  if (window.Loom && window.Loom.pwa) window.Loom.pwa.register("sw.js");
})();
