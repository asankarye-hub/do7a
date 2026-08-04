/* ---------------------------------------------------------------------------
   The entrance — الانْحِرَاف, the turn.

   The page opens facing due north, on the one star that does not move, and then
   the real sky over this city turns — measured, in degrees, counting up — until
   Makkah is at the centre of the screen and stops. The number that measured the
   turn then becomes the time to the next prayer: same face, same size, same
   place, different meaning.

   Beats, for the reader's own city at this minute:

     0.05-0.45s  Polaris alone, الجَدْي. It sits at an altitude equal to the
                 city's latitude — 36.2° from Erbil — so where it lands is a
                 fact about where you are.
     0.45-1.05s  The sky assembles, brightest first, and the horizon wipes
                 outward from the centre. A compass tape appears along it with
                 the cardinals in Arabic.
     1.05-2.70s  The turn. Critically damped, so it settles without overshoot —
                 a compass that overshoots is a lie. The field of view widens
                 through the middle of the swing and closes again exactly on
                 170°, the hero's own value. Stars carry short trails while they
                 move, so the sky reads as one body swinging.
     2.45-2.95s  Makkah arrives at the centre with its distance; the figures
                 stroke themselves in; the moon fades up at its true phase.
     2.95-3.35s  The angle becomes the countdown.

   It does not own a renderer. Stars are drawn by peace-sky.js through
   __peaceSky.renderStars, on the same projection and the same expressions, so
   the last frame of the entrance is the hero's next frame. The twinkle in
   particular is seeded from each star's index in the catalogue; a second
   implementation iterating in another order would make half the field step in
   brightness at the handoff.

   Skippable on tap or key. One settled frame under prefers-reduced-motion, and
   a hard timeout that removes the overlay whatever happens.
   --------------------------------------------------------------------------- */

(function () {
  'use strict';

  var T_TURN_START = 1050;
  var reduced = false;
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  catch (e) { /* older browsers */ }

  var root, cv, ctx, readout, started = 0, done = false, raf = 0, keep = 0;
  var prevAt = null, realScrollTo = null;

  function ease(t) { return t < 0 ? 0 : t > 1 ? 1 : 1 - Math.pow(1 - t, 3); }
  function clamp01(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }

  function turnMs() { return window.innerWidth >= 1440 ? 1950 : 1650; }
  function total() { return T_TURN_START + turnMs() + 900; }

  /* Critically damped: heavy at the start, long settle, never past the mark. */
  function damp(tau, T) {
    var w = 6;
    var f = function (x) { return 1 - Math.exp(-w * x) * (1 + w * x); };
    if (tau <= 0) return 0;
    if (tau >= T) return 1;
    return f(tau) / f(T);
  }

  function build() {
    root = document.createElement('div');
    root.id = '__peace_enter';
    root.setAttribute('aria-hidden', 'true');
    root.style.cssText =
      'position:fixed;inset:0;z-index:99999;background:#05070f;' +
      'transition:opacity .55s ease;opacity:1';
    cv = document.createElement('canvas');
    /* The hero's starfield sits at .85; the overlay matches it or the handoff
       pops. */
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;opacity:.85';
    root.appendChild(cv);

    readout = document.createElement('div');
    readout.style.cssText =
      'position:absolute;left:0;right:0;text-align:center;pointer-events:none;' +
      'font-family:Cormorant Garamond,Amiri,serif;color:#e9cd92;opacity:0;' +
      'font-variant-numeric:tabular-nums;letter-spacing:.01em';
    root.appendChild(readout);

    ctx = cv.getContext('2d');
    document.documentElement.appendChild(root);

    root.addEventListener('click', finish);
    root.addEventListener('touchstart', finish, { passive: true });
    window.addEventListener('keydown', finish);

    /* The page jumps to whichever prayer is current as soon as it mounts, which
       would drag the hero countdown off screen before the number can land on
       it. Hold the scroll until the entrance is done, then give it back. */
    try {
      realScrollTo = window.scrollTo;
      window.scrollTo = function () {};
    } catch (e) { realScrollTo = null; }
  }

  function releaseScroll() {
    if (realScrollTo) { try { window.scrollTo = realScrollTo; } catch (e) {} realScrollTo = null; }
  }

  function finish() {
    if (done) return;
    done = true;
    if (raf) cancelAnimationFrame(raf);
    if (keep) clearInterval(keep);
    window.removeEventListener('keydown', finish);
    releaseScroll();
    if (root) {
      root.style.opacity = '0';
      setTimeout(function () {
        if (root && root.parentNode) root.parentNode.removeChild(root);
      }, 600);
    }
  }

  /* The page's own countdown, measured only when it is needed. */
  function countdownEl() {
    var all = document.querySelectorAll('div,span');
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (e.children.length) continue;
      var t = (e.textContent || '').trim();
      if (/^\d{1,2}:\d{2}:\d{2}$/.test(t)) {
        var r = e.getBoundingClientRect();
        if (r.width > 40 && r.height > 14) return e;
      }
    }
    return null;
  }

  var CARDINALS = [[0, 'شَمَال'], [90, 'شَرْق'], [180, 'جَنُوب'], [270, 'غَرْب']];

  function frame(now) {
    if (done) return;
    if (root && !document.contains(root)) document.documentElement.appendChild(root);
    if (!started) started = now;
    var el = now - started;

    var S = window.__peaceSky;
    var w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) { raf = requestAnimationFrame(frame); return; }
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (cv.width !== w * dpr || cv.height !== h * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (!S) { raf = requestAnimationFrame(frame); return; }

    var c = S.city(), lat = c[0], lng = c[1], when = new Date();
    var qibla = S.qiblaAz(lat, lng);
    var horizonY = h * 0.92;

    var TT = turnMs();
    var u = damp((el - T_TURN_START) / 1000, TT / 1000);
    var centre = qibla * u;
    /* Opens and closes on exactly the hero's field of view. */
    var fov = 170 + 60 * Math.sin(Math.PI * u);

    /* --- the sky, drawn by the hero's own renderer ------------------------ */
    var moving = u > 0.001 && u < 0.999;
    var res = S.renderStars(ctx, w, h, {
      lat: lat, lng: lng, when: when, centre: centre, fov: fov, horizonY: horizonY,
      prev: moving ? prevAt : null,
      gate: function (i, mag) {
        if (el < 450) return i === POLARIS_I ? clamp01((el - 50) / 380) : 0;
        var rank = RANK[i] == null ? 0.5 : RANK[i];
        var lead = 450 + 450 * rank;
        return ease(clamp01((el - lead) / 200));
      }
    });
    prevAt = res.at;

    /* --- Polaris named while it is alone ---------------------------------- */
    var solo = clamp01((el - 250) / 200) * (1 - clamp01((el - 450) / 250));
    if (solo > 0.01 && res.pos['Polaris']) {
      var pp = res.pos['Polaris'];
      ctx.textAlign = 'center';
      ctx.font = (w < 520 ? 11 : 13) + 'px Amiri, serif';
      ctx.fillStyle = 'rgba(233,205,146,' + (0.58 * solo).toFixed(3) + ')';
      ctx.fillText('الجَدْي', pp[0], pp[1] - 14);
    }

    /* --- horizon wipes outward from the centre ---------------------------- */
    var hp = ease(clamp01((el - 450) / 350));
    if (hp > 0) {
      var band = ctx.createLinearGradient(0, horizonY - 40, 0, horizonY);
      band.addColorStop(0, 'rgba(233,205,146,0)');
      band.addColorStop(1, 'rgba(233,205,146,' + (0.10 * hp).toFixed(3) + ')');
      ctx.fillStyle = band;
      ctx.fillRect(w / 2 - (w / 2) * hp, horizonY - 40, w * hp, 40);
      ctx.strokeStyle = 'rgba(233,205,146,' + (0.20 * hp).toFixed(3) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w / 2 - (w / 2) * hp, horizonY);
      ctx.lineTo(w / 2 + (w / 2) * hp, horizonY);
      ctx.stroke();
    }

    /* --- the compass tape ------------------------------------------------- */
    var ta = ease(clamp01((el - 600) / 350)) * (1 - clamp01((el - total() + 500) / 400));
    if (ta > 0) {
      for (var a = 0; a < 360; a += 10) {
        var d = ((a - centre + 540) % 360) - 180;
        if (Math.abs(d) > fov / 2) continue;
        var tx = w * (0.5 + d / fov);
        var len = (a % 90 === 0) ? 14 : (a % 30 === 0 ? 9 : 5);
        ctx.strokeStyle = 'rgba(233,205,146,' + (0.28 * ta).toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(tx, horizonY); ctx.lineTo(tx, horizonY + len); ctx.stroke();
      }
      ctx.textAlign = 'center';
      ctx.font = (w < 520 ? 10 : 12) + 'px Amiri, serif';
      for (var ci = 0; ci < CARDINALS.length; ci++) {
        var cd = ((CARDINALS[ci][0] - centre + 540) % 360) - 180;
        if (Math.abs(cd) > fov / 2) continue;
        var cx = w * (0.5 + cd / fov);
        var near = Math.max(0, 1 - Math.abs(cd) / 6);
        ctx.fillStyle = 'rgba(233,205,146,' + ((0.50 + 0.40 * near) * ta).toFixed(3) + ')';
        ctx.fillText(CARDINALS[ci][1], cx, horizonY + 26);
      }
    }

    /* --- arrival: Makkah, the figures, the moon --------------------------- */
    var arrive = ease(clamp01((el - (T_TURN_START + TT - 250)) / 500));
    if (arrive > 0) {
      ctx.strokeStyle = 'rgba(244,223,174,' + (0.55 * arrive).toFixed(3) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w / 2, horizonY - 14); ctx.lineTo(w / 2, horizonY + 8);
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.font = '12px Amiri, serif';
      ctx.fillStyle = 'rgba(244,223,174,' + (0.62 * arrive).toFixed(3) + ')';
      ctx.fillText('مَكَّة', w / 2, horizonY + 22);

      ctx.globalAlpha = arrive;
      try { S.drawFigures(ctx, res.pos, w); } catch (e) { /* decoration only */ }
      ctx.globalAlpha = 1;
    }

    /* --- the degrees, kept small on the tape where a reading belongs ------ */
    if (ta > 0 && u < 0.999) {
      ctx.textAlign = 'center';
      ctx.font = '11px ui-monospace, Menlo, monospace';
      ctx.fillStyle = 'rgba(233,205,146,' + (0.45 * ta).toFixed(3) + ')';
      ctx.fillText((qibla * u).toFixed(1) + '°', w / 2, horizonY + 42);
    }

    /* --- the name, then the time ------------------------------------------
       The turn is not really a measurement, so the centre of the screen does
       not hold a number. It holds the name, and the name gives way to the time
       left before the next prayer. */
    var pivotAt = T_TURN_START + TT + 250;
    var nameIn = clamp01((el - 800) / 500);
    var nameOut = clamp01((el - pivotAt) / 350);
    var nameA = nameIn * (1 - nameOut);
    if (nameA > 0.002) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      var ns = Math.max(58, Math.min(150, w * 0.15));
      var nyy = horizonY - 96;
      var halo = ctx.createRadialGradient(w / 2, nyy - ns * 0.3, 0, w / 2, nyy - ns * 0.3, ns * 1.9);
      halo.addColorStop(0, 'rgba(244,223,174,' + (0.10 * nameA).toFixed(3) + ')');
      halo.addColorStop(1, 'rgba(244,223,174,0)');
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(w / 2, nyy - ns * 0.3, ns * 1.9, 0, Math.PI * 2); ctx.fill();
      ctx.font = ns.toFixed(0) + 'px Amiri, serif';
      ctx.fillStyle = 'rgba(250,240,214,' + (0.94 * nameA).toFixed(3) + ')';
      ctx.fillText('اللَّه', w / 2, nyy);
    }

    /* The countdown takes the name's place, in the page's own slot. */
    var timeIn = clamp01((el - (pivotAt + 120)) / 320);
    if (timeIn > 0) {
      var target = countdownEl();
      var tr = target ? target.getBoundingClientRect() : null;
      var live = !!(tr && tr.width > 40 && tr.top > 8 && tr.bottom < h - 8);
      var size = live ? Math.max(22, Math.min(76, tr.height * 0.82))
                      : Math.max(34, Math.min(64, w * 0.07));
      var yy = live ? tr.top + tr.height * 0.72 : horizonY - 96;
      var xx = live ? tr.left + tr.width / 2 : w / 2;
      readout.style.opacity = String(timeIn * (live ? 1 - clamp01((el - (pivotAt + 520)) / 300) : 1));
      readout.style.top = (yy - size * 0.78) + 'px';
      readout.style.fontSize = size.toFixed(1) + 'px';
      readout.style.transform = 'translateX(' + (xx - w / 2).toFixed(1) + 'px)';
      readout.textContent = (live && target) ? (target.textContent || '').trim() : '';
    }

    if (el >= total()) { finish(); return; }
    raf = requestAnimationFrame(frame);
  }

  /* Magnitude order, resolved once: rank 0 is the brightest. */
  var RANK = {}, POLARIS_I = -1;
  function index() {
    var S = window.__peaceSky;
    if (!S) return false;
    var order = [];
    for (var i = 0; i < S.STARS.length; i++) {
      order.push([i, S.STARS[i][4]]);
      if (S.STARS[i][0] === 'Polaris') POLARIS_I = i;
    }
    order.sort(function (a, b) { return a[1] - b[1]; });
    for (var k = 0; k < order.length; k++) RANK[order[k][0]] = k / Math.max(1, order.length - 1);
    return true;
  }

  function still() {
    started = -total();
    try { frame(0); } catch (e) { /* never trap the reader behind an overlay */ }
    setTimeout(finish, 700);
  }

  function go() {
    window.__enter = { built: 0, frames: 0, reduced: reduced };
    try { build(); window.__enter.built = 1; }
    catch (e) { window.__enter.err = String(e && e.message || e); releaseScroll(); return; }

    setTimeout(finish, total() + 2500);
    keep = setInterval(function () {
      if (done) { clearInterval(keep); return; }
      if (!POLARIS_I || POLARIS_I < 0) index();
      if (root && !document.contains(root)) document.documentElement.appendChild(root);
    }, 100);

    var wait = setInterval(function () {
      if (index()) {
        clearInterval(wait);
        if (reduced) { still(); return; }
        raf = requestAnimationFrame(function (ts) {
          window.__enter.frames++;
          frame(ts);
        });
      }
    }, 40);
  }

  var _f = frame;
  frame = function (ts) {
    window.__enter.frames++;
    try { return _f(ts); }
    catch (e) {
      window.__enter.frameErr = String(e && e.message || e);
      finish();
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
  else go();
})();
