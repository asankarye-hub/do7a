# Peace — سَلَام

Prayer times, qibla, remembrance and the Qur'an for Kurdistan, computed on the
device from the position of the sun. No account, no tracking, and no network
call except for the optional adhan audio and the Qur'an recitation.

English, Kurdish Soranî, Kurdish Badînî and Arabic.

## Every file here must be published together

This is the failure that shaped the whole layout, so it is worth stating first.
The page loads its content from five sibling scripts. They were never committed,
so on the live site every one of them returned 404, the page caught the failures
silently, and every content section rendered empty — the Qur'an, the duas, the
ninety-nine names, the Prophet sections, all blank — while the prayer times kept
working, because that code is inline. If any of these files is missing, the same
thing happens again.

| File | Size | Holds |
| --- | --- | --- |
| `index.html` | 1.4 MB | The app itself |
| `peace-quran.js` | 1.4 MB | The surah list and the Arabic, all 6,236 ayat |
| `peace-quran-en.js` | 0.8 MB | English translation, fetched only if in use |
| `peace-quran-ku.js` | 2.4 MB | Soranî translation, fetched only if in use |
| `peace-quran-ba.js` | 1.8 MB | Badînî translation, fetched only if in use |
| `peace-data.js` | 45 KB | Verses and hadith of the day, the ninety-nine names, duas, dhikr, Hijri months, holy days |
| `peace-rabbana.js` | 52 KB | 45 rabbana supplications |
| `peace-data2.js` | 20 KB | Adhkār, post-prayer, rakʿas, wudu, pillars, fasts, Jumuʿa, Duha, Fajr, surah index |
| `peace-nabi.js` | 9 KB | His names, sifāt, seerah, salawāt, wasiyya |
| `peace-sky.js` | 22 KB | The real sky behind the hero |
| `peace-shadow.js` | 11 KB | The gnomon that shows why Asr begins when it does |
| `peace-enter.js` | 14 KB | The entrance: north, the turn, the name, the countdown |

They are plain scripts, not ES modules, deliberately: `file://` refuses module
imports, so opening `index.html` by double-clicking it would otherwise leave
every tab empty. They are deferred and resolved through a small waiter, so
nothing blocks first paint.

Only one translation is ever downloaded — the one the reader is using. Changing
language fetches the next one and swaps it in. A first visit costs about 1.5 MB
over the wire in English, 1.7 MB in Badînî, against 2.4 MB when all three
shipped together.

## How the times are worked out

Solar position from the low-precision Astronomical Almanac formulae, then the
standard definitions: Fajr and Isha as depression angles, Asr by shadow ratio,
Maghrib at sunset. The default is the `kurdistan` method — Fajr 16.5°, Isha 79
minutes after Maghrib, plus per-prayer offsets matching the local mosque tables.

Cross-checked against an independently written implementation for Erbil on
4 August 2026: Fajr, sunrise, Dhuhr, Asr and Isha agree to the minute; Maghrib
differs by one minute of rounding.

## The sky

The starfield behind the hero is not decoration. Eighty-seven bright stars are
placed at their true altitude and azimuth for the selected city and the current
minute, through local sidereal time, and the Moon is drawn at its real position
with its real illuminated fraction. The view is centred on the direction of
Makkah, so the middle of the picture is the qibla.

The stars carry their Arabic names, because that is where the names came from:
Aldebaran is al-Dabarān, Altair is al-Ṭāʾir, Deneb is al-Dhanab, Betelgeuse is
Yad al-Jawzāʾ. The old figures are drawn and named too — بَنَات نَعْش for the
Plough, الجَوْزَاء for Orion — showing only the part that is genuinely above the
horizon.

## The shadow

Asr is the one prayer defined by a measurement rather than a clock: it begins
when a thing's shadow equals the thing, added to the shadow it cast at noon. The
Asr section draws that, live, from the sun's real altitude. At Erbil in August
the noon shadow is 0.34 of a height, so Asr begins at 1.34 — and the shadow
crosses the mark at the time the table already gives.

## Languages

The interface strings live inside `index.html`, with a Badini override table
covering 110 of 243 strings; anything missing falls back to Soranî, never to
English, so the page never changes script mid-view.

The Qur'an translation follows the interface language live: English (Pickthall),
Soranî (Burhan Muhammad-Amin) or Badînî (Ismail Sigêrî).

**The Badini wording has not been checked by a native speaker.** It is the one
part of this that most wants a second pair of eyes.

## Sources

- Qur'an, Arabic: Tanzil (Uthmani). Free for non-commercial use with attribution.
- Qur'an, English: Marmaduke Pickthall (public domain).
- Qur'an, Kurdish Soranî: Burhan Muhammad-Amin, via <https://alquran.cloud>.
- Qur'an, Kurdish Badînî (Kurmancî): Ismail Sigêrî, via <https://quranenc.com>.
- Hadith and supplications carry their source inline (Bukhārī, Muslim, Abū
  Dāwūd, Tirmidhī). The seerah dates use the common reckoning; the year of birth
  in particular is reported differently by different historians.
- Adhan recordings stream from praytimes.org and are the only thing here that
  needs a network. They are off until chosen.
