/* ---------------------------------------------------------------------------
   The real sky.

   The hero already had a decorative starfield. This replaces it with the sky
   that is actually overhead: each star is drawn at its true altitude and
   azimuth for the chosen city and the current minute, computed from its right
   ascension and declination via local sidereal time.

   The view is framed so that the centre of the picture is the direction of
   Makkah. Facing the middle of this sky is facing the qibla.

   The labels are the Arabic names. Most bright stars carry them in every
   language — Aldebaran is al-Dabarān, Altair is al-Ṭāʾir, Deneb is al-Dhanab,
   Betelgeuse is Yad al-Jawzāʾ — because these are the names that came down
   through Arabic astronomy.

   Nothing here changes the layout. It draws into the existing starfield
   container, behind everything, and ignores pointer events.
   --------------------------------------------------------------------------- */

(function () {
  'use strict';

  /* name, Arabic name (empty if none), RA hours, Dec degrees, magnitude */
  var STARS = [
    ['Sirius', 'الشِّعْرَى', 6.752, -16.716, -1.46],
    ['Canopus', 'سُهَيْل', 6.399, -52.696, -0.72],
    ['Arcturus', 'السِّمَاك الرَّامِح', 14.261, 19.182, -0.05],
    ['Vega', 'النَّسْر الوَاقِع', 18.615, 38.784, 0.03],
    ['Capella', 'العَيُّوق', 5.278, 45.998, 0.08],
    ['Rigel', 'رِجْل الجَبَّار', 5.242, -8.202, 0.12],
    ['Procyon', 'الشِّعْرَى الشَّامِيَّة', 7.655, 5.225, 0.34],
    ['Achernar', 'آخِر النَّهْر', 1.629, -57.237, 0.46],
    ['Betelgeuse', 'يَد الجَوْزَاء', 5.919, 7.407, 0.50],
    ['Altair', 'الطَّائِر', 19.846, 8.868, 0.77],
    ['Acrux', '', 12.443, -63.099, 0.77],
    ['Aldebaran', 'الدَّبَران', 4.599, 16.509, 0.85],
    ['Spica', 'السِّمَاك الأَعْزَل', 13.420, -11.161, 1.04],
    ['Antares', 'قَلْب العَقْرَب', 16.490, -26.432, 1.09],
    ['Pollux', '', 7.755, 28.026, 1.14],
    ['Fomalhaut', 'فَم الحُوت', 22.961, -29.622, 1.16],
    ['Deneb', 'الذَّنَب', 20.690, 45.280, 1.25],
    ['Regulus', 'قَلْب الأَسَد', 10.139, 11.967, 1.35],
    ['Adhara', 'العَذَارَى', 6.977, -28.972, 1.50],
    ['Castor', '', 7.577, 31.888, 1.58],
    ['Shaula', 'الشَّوْلَة', 17.560, -37.104, 1.62],
    ['Bellatrix', 'النَّجِيد', 5.418, 6.350, 1.64],
    ['Elnath', 'النَّطْح', 5.438, 28.608, 1.65],
    ['Alnilam', 'النِّظَام', 5.604, -1.202, 1.69],
    ['Alnitak', 'النِّطَاق', 5.679, -1.943, 1.74],
    ['Alnair', 'النَّيِّر', 22.137, -46.961, 1.74],
    ['Alioth', 'الجَون', 12.900, 55.960, 1.76],
    ['Dubhe', 'الدُّب', 11.062, 61.751, 1.79],
    ['Mirfak', 'مِرفَق الثُّرَيَّا', 3.405, 49.861, 1.79],
    ['Wezen', 'الوَزْن', 7.140, -26.393, 1.83],
    ['Kaus Australis', 'القَوْس', 18.403, -34.385, 1.85],
    ['Alkaid', 'القَائِد', 13.792, 49.313, 1.85],
    ['Sargas', '', 17.622, -42.998, 1.86],
    ['Menkalinan', 'مَنْكِب ذِي العِنَان', 5.995, 44.947, 1.90],
    ['Alhena', 'الهَنْعَة', 6.629, 16.399, 1.93],
    ['Mirzam', 'المِرْزَم', 6.378, -17.956, 1.98],
    ['Alphard', 'الفَرْد', 9.460, -8.659, 1.98],
    ['Polaris', 'الجَدْي', 2.530, 89.264, 1.98],
    ['Hamal', 'الحَمَل', 2.120, 23.462, 2.00],
    ['Diphda', 'الضِّفْدَع', 0.726, -17.987, 2.04],
    ['Nunki', 'النَّسْق', 18.921, -26.297, 2.05],
    ['Mirach', 'المِئْزَر', 1.162, 35.621, 2.05],
    ['Alpheratz', 'سُرَّة الفَرَس', 0.140, 29.091, 2.06],
    ['Saiph', 'سَيْف الجَبَّار', 5.796, -9.670, 2.06],
    ['Menkent', 'مَنْكِب قِنْطُورُس', 14.111, -36.370, 2.06],
    ['Rasalhague', 'رَأْس الحَوَّاء', 17.582, 12.560, 2.08],
    ['Kochab', 'الكَوْكَب', 14.845, 74.156, 2.08],
    ['Algieba', 'الجَبْهَة', 10.333, 19.841, 2.08],
    ['Algol', 'رَأْس الغُول', 3.136, 40.956, 2.09],
    ['Almach', 'العَنَاق', 2.065, 42.330, 2.10],
    ['Denebola', 'ذَنَب الأَسَد', 11.818, 14.572, 2.14],
    ['Alphecca', 'الفَكَّة', 15.578, 26.715, 2.22],
    ['Sadr', 'الصَّدْر', 20.371, 40.257, 2.23],
    ['Mizar', 'المِئْزَر', 13.399, 54.925, 2.23],
    ['Suhail', 'سُهَيْل المُحْلِف', 9.133, -43.433, 2.23],
    ['Schedar', 'الصَّدْر', 0.675, 56.537, 2.24],
    ['Eltanin', 'التِّنِّين', 17.944, 51.489, 2.24],
    ['Naos', '', 8.060, -40.003, 2.25],
    ['Caph', 'الكَف', 0.153, 59.150, 2.28],
    ['Dschubba', 'الجَبْهَة', 16.005, -22.622, 2.29],
    ['Larawag', '', 16.836, -34.293, 2.29],
    ['Merak', 'المَراق', 11.031, 56.382, 2.37],
    ['Izar', 'الإِزَار', 14.750, 27.074, 2.37],
    ['Enif', 'الأَنْف', 21.736, 9.875, 2.38],
    ['Girtab', '', 17.708, -39.030, 2.39],
    ['Ankaa', 'العَنْقَاء', 0.438, -42.306, 2.40],
    ['Scheat', 'السَّاق', 23.063, 28.083, 2.42],
    ['Sabik', 'السَّابِق', 17.173, -15.725, 2.43],
    ['Phecda', 'الفَخِذ', 11.897, 53.695, 2.44],
    ['Aludra', 'الأَعْذَار', 7.402, -29.303, 2.45],
    ['Aljanah', 'الجَنَاح', 20.770, 33.970, 2.46],
    ['Markab', 'المَرْكَب', 23.079, 15.205, 2.49],
    ['Sheratan', 'الشَّرَطَان', 1.911, 20.808, 2.64],
    ['Megrez', 'المَغْرِز', 12.257, 57.033, 3.31],
    ['Mintaka', 'المِنْطَقَة', 5.533, -0.299, 2.23],
    ['Rasalgethi', 'رَأْس الجَاثِي', 17.244, 14.390, 3.35],
    ['Albireo', 'مِنْقَار الدَّجَاجَة', 19.512, 27.960, 3.18],
    ['Alfirk', 'الفِرْق', 21.478, 70.561, 3.23],
    ['Alderamin', 'الذِّرَاع اليَمِين', 21.310, 62.586, 2.45],
    ['Thuban', 'الثُّعْبَان', 14.073, 64.376, 3.65],
    ['Alcyone', 'الثُّرَيَّا', 3.791, 24.105, 2.87],
    ['Zubeneschamali', 'الزُّبَانَى الشَّمَالِيَّة', 15.283, -9.383, 2.61],
    ['Unukalhai', 'عُنُق الحَيَّة', 15.738, 6.426, 2.63],
    ['Alrescha', 'الرِّشَاء', 2.033, 2.764, 3.82],
    ['Nashira', 'سَعْد نَاشِرَة', 21.668, -16.662, 3.68],
    ['Sadalsuud', 'سَعْد السُّعُود', 21.526, -5.571, 2.87],
    ['Sadalmelik', 'سَعْد المَلِك', 22.096, -0.320, 2.95],
    ['Gamma Cas', '', 0.945, 60.717, 2.47],
    ['Ruchbah', 'الرُّكْبَة', 1.430, 60.235, 2.68],
    ['Segin', '', 1.906, 63.670, 3.38],
    ['Delta Cyg', '', 19.749, 45.131, 2.87],
    ['Rigel Kentaurus', 'رِجْل قِنْطُورُس', 14.660, -60.834, -0.27],
    ['Hadar', '', 14.064, -60.373, 0.61],
    ['Alcor', 'السُّهَا', 13.421, 54.988, 3.99],
    ['Tarazed', 'الطَّرَازِد', 19.771, 10.613, 2.72],
    ['Alshain', 'الشَّاهِين', 19.922, 6.407, 3.71]
  ];

  /* The six cities the page offers, in the order its own list uses. */
  var CITIES = [
    [36.8671, 42.9880], [36.1911, 44.0092], [35.5556, 45.4351],
    [35.1778, 45.9864], [37.1439, 42.6817], [35.4681, 44.3922]
  ];
  var KAABA = [21.4224779, 39.8251832];

  var D2R = Math.PI / 180;

  function julianDay(d) {
    return d.getTime() / 86400000 + 2440587.5;
  }

  /* Greenwich mean sidereal time in degrees. */
  function gmst(d) {
    var jd = julianDay(d), T = (jd - 2451545.0) / 36525.0;
    var g = 280.46061837 + 360.98564736629 * (jd - 2451545.0)
          + 0.000387933 * T * T - T * T * T / 38710000.0;
    return ((g % 360) + 360) % 360;
  }

  /* Altitude and azimuth of a star, in degrees, azimuth measured from north. */
  function altAz(raHours, decDeg, lat, lng, when) {
    var lst = gmst(when) + lng;
    var ha = (lst - raHours * 15) * D2R;
    var dec = decDeg * D2R, la = lat * D2R;
    var sinAlt = Math.sin(dec) * Math.sin(la) + Math.cos(dec) * Math.cos(la) * Math.cos(ha);
    var alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
    var az = Math.atan2(-Math.sin(ha) * Math.cos(dec),
                        Math.cos(la) * Math.sin(dec) - Math.sin(la) * Math.cos(dec) * Math.cos(ha));
    az = (az / D2R + 360) % 360;
    return [alt / D2R, az];
  }

  function qiblaAz(lat, lng) {
    var dL = (KAABA[1] - lng) * D2R, la = lat * D2R, lb = KAABA[0] * D2R;
    var y = Math.sin(dL);
    var x = Math.cos(la) * Math.tan(lb) - Math.sin(la) * Math.cos(dL);
    return (Math.atan2(y, x) / D2R + 360) % 360;
  }

  function city() {
    var idx = 1;
    try {
      var p = JSON.parse(localStorage.getItem('peace.prefs') || '{}');
      if (typeof p.cityIdx === 'number' && CITIES[p.cityIdx]) idx = p.cityIdx;
    } catch (e) { /* defaults are fine */ }
    return CITIES[idx];
  }

  var FOV = 170;          // degrees of sky across the width
  var reduced = false;
  try {
    reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { /* older browsers */ }

  function draw(cv) {
    var ctx = cv.getContext('2d');
    if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    if (cv.width !== w * dpr || cv.height !== h * dpr) {
      cv.width = w * dpr; cv.height = h * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    var c = city(), lat = c[0], lng = c[1];
    var now = new Date();
    var centre = qiblaAz(lat, lng);
    var t = now.getTime() / 1000;

    /* Horizon sits low; the sky fills the rest. */
    var horizonY = h * 0.92;

    var R = renderStars(ctx, w, h, {
      lat: lat, lng: lng, when: now, centre: centre, fov: FOV, horizonY: horizonY
    });
    var drawn = R.drawn, pos = R.pos;

    var figs = drawFigures(ctx, pos, w);

    /* Name only the few brightest on screen, so it stays a sky and not a chart. */
    drawn.sort(function (a, b) { return a[2] - b[2]; });
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    /* The middle of the hero belongs to the headline and the countdown; names
       that would land there are skipped rather than drawn behind the type. */
    var keepOutX0 = w * 0.34, keepOutX1 = w * 0.80;
    var keepOutY0 = h * 0.08, keepOutY1 = h * 0.72;
    var placed = [], want = w < 520 ? 4 : 9;
    for (var k = 0; k < drawn.length && placed.length < want; k++) {
      var p = drawn[k];
      var lx = p[0], ly = p[1] - p[4] - 10;
      if (lx > keepOutX0 && lx < keepOutX1 && ly > keepOutY0 && ly < keepOutY1) continue;
      var clash = false;
      for (var q = 0; q < placed.length; q++) {
        if (Math.abs(placed[q][0] - lx) < 96 && Math.abs(placed[q][1] - ly) < 22) { clash = true; break; }
      }
      if (clash) continue;
      placed.push([lx, ly]);
      ctx.font = (w < 520 ? 11 : 13) + 'px Amiri, serif';
      ctx.fillStyle = 'rgba(233,205,146,0.58)';
      ctx.fillText(p[3], lx, ly);
    }

    /* The horizon, and Makkah dead centre. */
    var g = ctx.createLinearGradient(0, horizonY - 40, 0, horizonY);
    g.addColorStop(0, 'rgba(233,205,146,0)');
    g.addColorStop(1, 'rgba(233,205,146,0.10)');
    ctx.fillStyle = g;
    ctx.fillRect(0, horizonY - 40, w, 40);

    ctx.strokeStyle = 'rgba(233,205,146,0.20)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(w, horizonY);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(244,223,174,0.55)';
    ctx.beginPath();
    ctx.moveTo(w / 2, horizonY - 14);
    ctx.lineTo(w / 2, horizonY + 8);
    ctx.stroke();

    var moon = drawMoon(ctx, w, h, horizonY, lat, lng, now, centre);

    ctx.font = '12px Amiri, serif';
    ctx.fillStyle = 'rgba(244,223,174,0.62)';
    ctx.fillText('مَكَّة', w / 2, horizonY + 22);
    return { w: w, h: h, drawn: drawn.length, centre: Math.round(centre), figures: figs, moon: moon ? Math.round(moon.phase * 100) : null };
  }



  /* The old figures, drawn only when the whole shape is above the horizon and
     inside the view. The names are the Arabic ones: the Plough is the
     Daughters of the Bier, Orion is al-Jawzāʾ, Cygnus is the Hen. */
  var FIGURES = [
    { name: 'بَنَات نَعْش', lines: [
      ['Dubhe', 'Merak'], ['Merak', 'Phecda'], ['Phecda', 'Megrez'], ['Megrez', 'Dubhe'],
      ['Megrez', 'Alioth'], ['Alioth', 'Mizar'], ['Mizar', 'Alkaid']] },
    { name: 'الجَوْزَاء', lines: [
      ['Betelgeuse', 'Bellatrix'], ['Bellatrix', 'Mintaka'], ['Mintaka', 'Alnilam'],
      ['Alnilam', 'Alnitak'], ['Alnitak', 'Betelgeuse'], ['Mintaka', 'Rigel'],
      ['Alnitak', 'Saiph'], ['Rigel', 'Saiph']] },
    { name: 'الدَّجَاجَة', lines: [
      ['Deneb', 'Sadr'], ['Sadr', 'Albireo'], ['Aljanah', 'Sadr'], ['Sadr', 'Delta Cyg']] },
    { name: 'ذَات الكُرْسِي', lines: [
      ['Caph', 'Schedar'], ['Schedar', 'Gamma Cas'], ['Gamma Cas', 'Ruchbah'], ['Ruchbah', 'Segin']] },
    { name: 'العَقْرَب', lines: [
      ['Dschubba', 'Antares'], ['Antares', 'Larawag'], ['Larawag', 'Sargas'], ['Sargas', 'Shaula']] },
    { name: 'النَّسْر الطَّائِر', lines: [
      ['Tarazed', 'Altair'], ['Altair', 'Alshain']] }
  ];


  /* One renderer, used by the hero and by the entrance. They must not keep
     separate copies of these expressions: the twinkle alone is seeded from the
     star's index in STARS, so a second implementation that iterates in another
     order makes half the field step in brightness at the handoff. */
  function renderStars(ctx, w, h, o) {
    var lat = o.lat, lng = o.lng, when = o.when;
    var centre = o.centre, fov = o.fov, horizonY = o.horizonY;
    var t = when.getTime() / 1000;
    var drawn = [], pos = {}, now = {};
    for (var i = 0; i < STARS.length; i++) {
      var s = STARS[i];
      var aa = altAz(s[2], s[3], lat, lng, when);
      var alt = aa[0], az = aa[1];
      if (alt <= 0) continue;
      var d = ((az - centre + 540) % 360) - 180;
      if (Math.abs(d) > fov / 2) continue;
      var x = w * (0.5 + d / fov);
      var y = horizonY - (alt / 90) * (horizonY - h * 0.04);
      var mag = s[4];
      var gate = o.gate ? o.gate(i, mag) : 1;
      if (gate <= 0) { now[i] = [x, y]; continue; }
      var r = Math.max(0.9, 3.4 - mag * 0.52);
      var base = Math.max(0.30, Math.min(1, 1.15 - mag * 0.17));
      var tw = (o.reduced == null ? reduced : o.reduced) ? 1 : 0.82 + 0.18 * Math.sin(t * 1.1 + i * 2.3);
      var A = base * tw * gate;

      /* During the turn a star leaves a short trail, so the sky reads as one
         body swinging rather than points jumping. */
      var prev = o.prev && o.prev[i];
      if (prev && Math.abs(prev[0] - x) > 1.5) {
        ctx.strokeStyle = 'rgba(246,238,220,' + (A * 0.55).toFixed(3) + ')';
        ctx.lineWidth = Math.max(1, r * 2);
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(x, y); ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(246,238,220,' + A.toFixed(3) + ')';
      ctx.fill();
      if (r > 1.4) {
        var gl = ctx.createRadialGradient(x, y, 0, x, y, r * 5.5);
        gl.addColorStop(0, 'rgba(246,238,220,' + (0.30 * tw * gate).toFixed(3) + ')');
        gl.addColorStop(1, 'rgba(246,238,220,0)');
        ctx.fillStyle = gl;
        ctx.beginPath(); ctx.arc(x, y, r * 5.5, 0, Math.PI * 2); ctx.fill();
      }
      drawn.push([x, y, mag, s[1] || s[0], r]);
      pos[s[0]] = [x, y];
      now[i] = [x, y];
    }
    return { drawn: drawn, pos: pos, at: now };
  }

  function drawFigures(ctx, pos, w) {
    ctx.lineWidth = 1;
    var count = 0;
    for (var f = 0; f < FIGURES.length; f++) {
      var fig = FIGURES[f], seg = [], cx = 0, cy = 0, n = 0;
      for (var i = 0; i < fig.lines.length; i++) {
        var a = pos[fig.lines[i][0]], b = pos[fig.lines[i][1]];
        if (!a || !b) continue;                 // draw the part that is up
        seg.push([a, b]);
        cx += a[0] + b[0]; cy += a[1] + b[1]; n += 2;
      }
      if (!seg.length) continue;
      count++;
      ctx.strokeStyle = 'rgba(233,205,146,0.16)';
      ctx.beginPath();
      for (var k = 0; k < seg.length; k++) {
        ctx.moveTo(seg[k][0][0], seg[k][0][1]);
        ctx.lineTo(seg[k][1][0], seg[k][1][1]);
      }
      ctx.stroke();
      /* Name it only when most of the figure is actually up, so a stray pair of
         stars is not labelled as a constellation. */
      if (seg.length >= Math.ceil(fig.lines.length * 0.6)) {
        ctx.font = (w < 520 ? 11 : 13) + 'px Amiri, serif';
        ctx.fillStyle = 'rgba(233,205,146,0.36)';
        ctx.fillText(fig.name, cx / n, cy / n);
      }
    }
    return count;
  }


  /* Low-precision lunar position, good to a fraction of a degree — plenty for
     placing it in a picture of the sky. */
  function moonPos(when) {
    var jd = julianDay(when), d = jd - 2451545.0;
    var L = 218.316 + 13.176396 * d;          // mean longitude
    var M = 134.963 + 13.064993 * d;          // mean anomaly
    var F = 93.272 + 13.229350 * d;           // argument of latitude
    var lam = (L + 6.289 * Math.sin(M * D2R)) * D2R;
    var bet = (5.128 * Math.sin(F * D2R)) * D2R;
    var eps = 23.439 * D2R;
    var ra = Math.atan2(Math.sin(lam) * Math.cos(eps) - Math.tan(bet) * Math.sin(eps), Math.cos(lam));
    var dec = Math.asin(Math.sin(bet) * Math.cos(eps) + Math.cos(bet) * Math.sin(eps) * Math.sin(lam));
    /* Illuminated fraction from the elongation to the mean sun. */
    var Ms = 357.529 + 0.98560028 * d;
    var Ls = 280.459 + 0.98564736 * d;
    var sunLam = (Ls + 1.915 * Math.sin(Ms * D2R)) * D2R;
    var elong = Math.acos(Math.cos(bet) * Math.cos(lam - sunLam));
    var phase = (1 - Math.cos(elong)) / 2;
    var waxing = Math.sin(lam - sunLam) > 0;
    return { ra: ((ra / D2R) / 15 + 24) % 24, dec: dec / D2R, phase: phase, waxing: waxing };
  }

  function drawMoon(ctx, w, h, horizonY, lat, lng, now, centre) {
    var m = moonPos(now);
    var aa = altAz(m.ra, m.dec, lat, lng, now);
    if (aa[0] <= 0) return null;
    var d = ((aa[1] - centre + 540) % 360) - 180;
    if (Math.abs(d) > FOV / 2) return null;
    var x = w * (0.5 + d / FOV);
    var y = horizonY - (aa[0] / 90) * (horizonY - h * 0.04);
    var R = Math.max(11, Math.min(20, w / 64));

    var halo = ctx.createRadialGradient(x, y, R, x, y, R * 6);
    halo.addColorStop(0, 'rgba(244,223,174,0.16)');
    halo.addColorStop(1, 'rgba(244,223,174,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(x, y, R * 6, 0, Math.PI * 2); ctx.fill();

    /* The lit limb, carved by a second circle so the terminator curves. */
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = 'rgba(250,243,226,0.94)';
    ctx.fillRect(x - R, y - R, R * 2, R * 2);
    var k = Math.abs(1 - 2 * m.phase);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    var off = R * k * (m.waxing ? -1 : 1);
    if (m.phase < 0.5) {
      ctx.ellipse(x + (m.waxing ? -R * 0 : R * 0), y, R, R, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(250,243,226,0.94)';
      ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.ellipse(x + (m.waxing ? -R * k : R * k), y, R, R, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(x + off, y, R * k, R, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return { x: x, y: y, r: R, phase: m.phase };
  }

  var canvas = null;

  function ensure() {
    var host = document.querySelector('[data-stars]');
    if (!host) return;
    if (canvas && canvas.parentNode === host) return;
    canvas = document.createElement('canvas');
    canvas.id = '__peace_sky';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0';
    host.appendChild(canvas);
    /* The decorative dots underneath would fight the real ones. */
    for (var i = 0; i < host.children.length; i++) {
      var ch = host.children[i];
      if (ch !== canvas) ch.style.opacity = '0.22';
    }
  }

  var last = 0;
  function frame(ts) {
    ensure();
    if (canvas && (reduced ? ts - last > 60000 : ts - last > 40)) {
      last = ts;
      try { window.__sky = draw(canvas) || window.__sky; }
      catch (e) { window.__skyErr = String(e && e.message || e); }
    }
    requestAnimationFrame(frame);
  }

  function start() {
    ensure();
    requestAnimationFrame(frame);
  }

  /* Shared with the entrance sequence so it can draw the same sky rather than
     carrying a second copy of the catalogue and the maths. */
  window.__peaceSky = {
    STARS: STARS, FIGURES: FIGURES,
    altAz: altAz, qiblaAz: qiblaAz, city: city, moonPos: moonPos,
    renderStars: renderStars, drawFigures: drawFigures,
    fov: function () { return FOV; }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
