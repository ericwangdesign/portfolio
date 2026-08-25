/**
 * One script for every page on the site.
 *
 * Loads Microsoft Clarity (recordings, heat + scroll maps, rage clicks) and
 * Vercel Web Analytics (pageviews, referrers, uniques), then reports the two
 * things a portfolio cannot learn from pageviews alone: whether someone
 * actually *played* with a piece, and which work they reached for.
 *
 * Include it once per page, before </head>:
 *   <script defer src="/track.js" data-piece="shape"></script>
 *
 * `data-piece` names the event prefix. Without it the pathname is used, so a
 * missing attribute degrades to something readable rather than to nothing.
 */
(function () {
  var CLARITY_ID = "xprgtw49pv";

  /* The homepage tiles run the pieces live in iframes. Left alone, every visit
     to the homepage would log a pageview and a session on /writing and
     /cities that nobody actually opened. A framed page reports nothing. */
  if (window.top !== window.self) return;

  var self = document.currentScript;
  var piece =
    (self && self.getAttribute("data-piece")) ||
    location.pathname.replace(/^\/|\/$/g, "").replace(/[^a-z0-9]+/gi, "_") ||
    "home";

  /* ---- Clarity ------------------------------------------------------- */
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1;
    t.src = "https://www.clarity.ms/tag/" + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", CLARITY_ID);

  /* ---- Vercel Web Analytics ------------------------------------------
     Served by the platform at this path once Web Analytics is switched on in
     the Vercel dashboard. Until then the request 404s and nothing breaks. */
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  var va = document.createElement("script");
  va.defer = true;
  va.src = "/_vercel/insights/script.js";
  document.head.appendChild(va);

  /* ---- Reporting -----------------------------------------------------
     Clarity events carry a name only; anything with a value goes through
     `set`, which becomes a filter dimension in the dashboard. */
  function ev(name, key, value) {
    try {
      if (key && value) window.clarity("set", key, String(value).slice(0, 120));
      window.clarity("event", name);
    } catch (e) {}
  }
  ev.piece = piece;
  window.__track = ev;

  try { window.clarity("set", "piece", piece); } catch (e) {}

  /* ---- Did they play with it? ----------------------------------------
     "Opened it" and "used it" are different numbers, and only the second one
     means anything for work that is meant to be touched. First genuine input
     counts; scrolling and following a link do not. */
  var engaged = false;
  function markEngaged(how) {
    if (engaged) return;
    engaged = true;
    ev(piece + "_engaged", piece + "_entry", how);
  }

  var NAV = "a, nav, #links, footer";
  document.addEventListener("pointerdown", function (e) {
    if (e.target.closest && e.target.closest(NAV)) return;
    markEngaged("pointer");
    beat();
  }, { capture: true, passive: true });

  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key && e.key.length > 1 && e.key !== "Backspace" && e.key !== "Enter") return;
    markEngaged("keys");
    beat();
  }, { capture: true, passive: true });

  document.addEventListener("input", function () {
    markEngaged("control");
    beat();
  }, { capture: true, passive: true });

  /* ---- How long they stayed with it ----------------------------------
     Wall-clock time on page counts open tabs. This counts only seconds the
     page is visible and within 15s of a real input, then reports once at the
     half-minute mark — the point where someone has stopped skimming. */
  var activeMs = 0, lastInput = 0, deepSent = false, timer = null;
  var IDLE = 15000, DEEP = 30000;

  function beat() {
    lastInput = performance.now();
    if (!timer && !deepSent) timer = setInterval(sample, 1000);
  }
  function sample() {
    if (document.hidden) return;
    if (performance.now() - lastInput > IDLE) return;
    activeMs += 1000;
    if (activeMs >= DEEP && !deepSent) {
      deepSent = true;
      ev(piece + "_deep");
      clearInterval(timer); timer = null;
    }
  }

  /* ---- Which work they reached for -----------------------------------
     Homepage rows. A locked row is the more interesting of the two: it is
     someone trying to open work that isn't public, which is a real signal
     about what people want to see. */
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

    var row = t.closest(".row");
    if (row) {
      var title = (row.querySelector(".title") || {}).textContent || "";
      title = title.trim();
      if (row.classList.contains("locked")) ev("work_locked_click", "work", title);
      else if (row.tagName === "A") ev("work_click", "work", title);
      return;
    }

    /* Taking the output home — the strongest signal a piece can give. */
    var out = t.closest("#dlsvg, #dlpng, #dlanim, #cpjson, [data-export]");
    if (out) { ev(piece + "_export", "export", out.id || "export"); return; }

    var a = t.closest("a[href]");
    if (a && a.host && a.host !== location.host) {
      ev("outbound", "outbound_to", a.host);
    }
  }, { capture: true, passive: true });
})();
