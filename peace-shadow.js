/* ---------------------------------------------------------------------------
   The shadow.

   Asr is not defined by a clock. It is defined by a shadow: when the shadow of
   an upright thing equals its own length, plus whatever shadow it already cast
   at noon. Every other prayer in the app is a time; this one is a measurement,
   and the page never showed the measurement.

   So this draws it. An upright gnomon, its shadow at this moment computed from
   the sun's real altitude, and the mark it has to reach for Asr to begin. The
   shadow lengthens through the afternoon and crosses the mark exactly when the
   time in the table says Asr.

   It appends one card to the Asr section and matches the surrounding style.
   Nothing else is touched.
   --------------------------------------------------------------------------- */

(function () {
  'use strict';

  var D2R = Math.PI / 180;

  var CITIES = [
    [36.8671, 42.9880], [36.1911, 44.0092], [35.5556, 45.4351],
    [35.1778, 45.9864], [37.1439, 42.6817], [35.4681, 44.3922]
  ];

  function prefs() {
    try { return JSON.parse(localStorage.getItem('peace.prefs') || '{}'); }
    catch (e) { return {}; }
  }
  function city() {
    var p = prefs();
    var i = typeof p.cityIdx === 'number' && CITIES[p.cityIdx] ? p.cityIdx : 1;
    return CITIES[i];
  }
  function lang() {
    var l = prefs().lang;
    return (l === 'ku' || l === 'ar' || l === 'bad') ? l : 'en';
  }

  /* Sun declination and equation of time, low precision but ample here. */
  function sun(jd) {
    var D = jd - 2451545.0;
    var g = (357.529 + 0.98560028 * D) * D2R;
    var q = 280.459 + 0.98564736 * D;
    var L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * D2R;
    var e = (23.439 - 0.00000036 * D) * D2R;
    var ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / D2R / 15;
    ra = ((ra % 24) + 24) % 24;
    return { dec: Math.asin(Math.sin(e) * Math.sin(L)) / D2R, eqt: q / 15 - ra };
  }

  function altitudeNow(lat, lng, when) {
    var jd = when.getTime() / 86400000 + 2440587.5;
    var s = sun(jd);
    var ut = (jd + 0.5 - Math.floor(jd + 0.5)) * 24;
    var ha = 15 * (ut - 12) + lng + s.eqt * 15;
    ha = ((ha + 180) % 360 + 360) % 360 - 180;
    var sinAlt = Math.sin(lat * D2R) * Math.sin(s.dec * D2R)
               + Math.cos(lat * D2R) * Math.cos(s.dec * D2R) * Math.cos(ha * D2R);
    return { alt: Math.asin(Math.max(-1, Math.min(1, sinAlt))) / D2R, dec: s.dec };
  }

  /* Shadow at local noon, in gnomon heights: the shortest shadow of the day. */
  function noonRatio(lat, dec) {
    var a = 90 - Math.abs(lat - dec);
    if (a <= 0) return 40;
    return Math.abs(1 / Math.tan(a * D2R));
  }

  var T = {
    en: { title: 'The shadow now', now: 'shadow now', at: 'Asr begins at',
          note: 'Asr begins when a thing’s shadow equals the thing, added to its shadow at noon.',
          gone: 'The sun is down. The shadow returns at sunrise.' },
    ku: { title: 'سێبەر ئێستا', now: 'سێبەر ئێستا', at: 'عەصر دەست پێدەکات لە',
          note: 'عەصر دەست پێدەکات کاتێک سێبەری شتێک یەکسان دەبێت لەگەڵ خۆی، زیاد لە سێبەری نیوەڕۆ.',
          gone: 'خۆر ئاوا بووە. سێبەر لە خۆرهەڵاتن دەگەڕێتەوە.' },
    bad: { title: 'سیبەر نوکە', now: 'سیبەر نوکە', at: 'عەصر دەست پێدکەت ل',
           note: 'عەصر دەست پێدکەت دەمێ سیبەرێ تشتەکی وەکی وی بیت، ب سیبەرێ نیڤرۆیێ ڤە.',
           gone: 'ڕۆژ ئاڤا بوویە. سیبەر ل هەلاتنا ڕۆژێ ڤەدگەڕیت.' },
    ar: { title: 'الظِّلُّ الآن', now: 'الظِّلُّ الآن', at: 'يَبْدَأُ العَصْرُ عِنْد',
          note: 'يَبْدَأُ العَصْرُ إِذَا صَارَ ظِلُّ الشَّيْءِ مِثْلَهُ، بَعْدَ ظِلِّ الزَّوَال.',
          gone: 'غَابَتِ الشَّمْس. يَعُودُ الظِّلُّ عِنْدَ الشُّرُوق.' }
  };
  function t(k) { return (T[lang()] || T.en)[k]; }

  function fmtRatio(r) {
    if (!isFinite(r) || r > 20) return '∞';
    return r.toFixed(2) + '×';
  }

  var card = null, cv = null, capNow = null, capNote = null, title = null;

  function build() {
    var host = document.getElementById('s-asr');
    if (!host) return false;
    if (card && card.parentNode) return true;

    var box = host.querySelector('div');
    if (!box) return false;

    card = document.createElement('div');
    card.id = '__peace_shadow';
    card.style.cssText =
      'margin:26px auto 0;max-width:760px;padding:18px 20px 16px;border-radius:8px;' +
      'background:rgba(18,15,11,.88);border:1px solid rgba(233,205,146,.26);' +
      'box-shadow:0 18px 44px rgba(0,0,0,.28);' +
      'position:relative;z-index:1';

    title = document.createElement('div');
    title.style.cssText =
      'font:11px/1 ui-monospace,Menlo,monospace;letter-spacing:.2em;text-transform:uppercase;' +
      'color:rgba(233,205,146,.72);margin-bottom:14px';
    card.appendChild(title);

    cv = document.createElement('canvas');
    cv.style.cssText = 'display:block;width:100%;height:132px';
    card.appendChild(cv);

    capNow = document.createElement('div');
    capNow.style.cssText =
      'font:13px/1.5 ui-monospace,Menlo,monospace;color:rgba(244,223,174,.88);margin-top:12px';
    card.appendChild(capNow);

    capNote = document.createElement('div');
    capNote.style.cssText =
      'font:14px/1.6 Amiri,serif;color:rgba(216,208,190,.72);margin-top:6px;max-width:62ch';
    card.appendChild(capNote);

    box.appendChild(card);
    return true;
  }

  function draw() {
    if (!cv) return;
    var w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (cv.width !== w * dpr || cv.height !== h * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
    var ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    var c = city(), now = new Date();
    var a = altitudeNow(c[0], c[1], now);
    var ground = h - 26, x0 = 34;
    var rod = 52;

    /* Ground line. */
    ctx.strokeStyle = 'rgba(233,205,146,.22)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, ground + 0.5); ctx.lineTo(w, ground + 0.5); ctx.stroke();

    var n = noonRatio(c[0], a.dec);
    var target = n + 1;                        // the Asr threshold, in heights
    var scale = Math.min((w - x0 - 70) / Math.max(target, 1.2), 190);

    /* The mark the shadow must reach. */
    var tx = x0 + target * rod * (scale / rod) / 1;
    tx = x0 + target * scale;
    if (tx < w - 8) {
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = 'rgba(233,205,146,.45)';
      ctx.beginPath(); ctx.moveTo(tx, ground - 44); ctx.lineTo(tx, ground + 8); ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '10px ui-monospace,Menlo,monospace';
      ctx.fillStyle = 'rgba(233,205,146,.6)';
      ctx.textAlign = 'center';
      ctx.fillText('العَصْر', tx, ground - 50);
    }

    var up = a.alt > 0.5;
    var ratio = up ? 1 / Math.tan(a.alt * D2R) : Infinity;
    var shown = up ? Math.min(ratio, target * 1.9) : 0;

    if (up) {
      /* The shadow itself. */
      var sx = x0 + shown * scale;
      var g = ctx.createLinearGradient(x0, 0, sx, 0);
      g.addColorStop(0, 'rgba(12,10,8,.85)');
      g.addColorStop(1, 'rgba(12,10,8,.12)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x0, ground);
      ctx.lineTo(sx, ground);
      ctx.lineTo(sx, ground - 5);
      ctx.lineTo(x0, ground - 9);
      ctx.closePath();
      ctx.fill();
    }

    /* The gnomon. */
    ctx.strokeStyle = 'rgba(244,223,174,.92)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, ground); ctx.lineTo(x0, ground - rod); ctx.stroke();

    /* The sun, placed by its real altitude. */
    if (up) {
      var ang = Math.max(4, Math.min(86, a.alt)) * D2R;
      var R = Math.min(w * 0.42, 210);
      var sunX = x0 + Math.cos(ang) * R, sunY = ground - Math.sin(ang) * R;
      var halo = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 26);
      halo.addColorStop(0, 'rgba(255,238,190,.55)');
      halo.addColorStop(1, 'rgba(255,238,190,0)');
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(sunX, sunY, 26, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,244,214,.95)';
      ctx.beginPath(); ctx.arc(sunX, sunY, 6, 0, Math.PI * 2); ctx.fill();
    }

    title.textContent = t('title');
    capNow.textContent = up
      ? t('now') + ' — ' + fmtRatio(ratio) + '   ·   ' + t('at') + ' ' + fmtRatio(target)
      : t('gone');
    capNote.textContent = t('note');
  }

  function tick() {
    if (build()) { try { draw(); } catch (e) { /* decoration must never break the page */ } }
  }

  tick();
  /* The app renders after this file runs, and the bundler rebuilds the document
     more than once, so look for the section often at first and then settle. */
  var early = 0;
  var fast = setInterval(function () {
    tick();
    if (++early > 40) clearInterval(fast);
  }, 700);
  setInterval(tick, 20000);
  window.addEventListener('resize', function () { try { draw(); } catch (e) {} });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick);
})();
