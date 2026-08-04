# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Peace (do7a) is an offline-first Islamic companion app calculating prayer times, Qibla direction, providing Quran access in multiple languages, adhkar (remembrances), Islamic calendar, zakat calculator, 99 Names of Allah, and Seerah - all computed locally from device sensors without tracking, accounts, or unnecessary network requests.

## Core Technology

- **Danfo.js-inspired Custom Framework**: The app uses a custom reactive compiler ("dc-runtime") that processes `<x-dc>` custom elements with data-binding
- **Vanilla Web Technologies**: HTML5, CSS3, JavaScript ES6+
- **Offirst-First**: All calculations (prayer times, Quran text, etc.) happen client-side
- **PWA Capabilities**: Manifest-based installable offline app
- **Custom Quran Format**: Efficient binary-like JSON structures for religious texts

## Development Workflow

### Prerequisites
- Modern browser (Chrome/Firefox/Safari/Edge)
- For development: bun or node (for dc-runtime builds)
- Text editor (VSCode recommended)

### Local Development
1. Open `index.html` directly in browser (file://) OR
2. Serve via static server: `python -m http.server 8000` or `npx serve`
3. **No build step required for UI/code changes** - changes reflect immediately
4. **Qur'an/data files**: Large `.js` data files are lazy-loaded when needed

### Critical Build Process (dc-runtime)
The `decoded.js` file is generated from source in external dc-runtime repo:
```
# To rebuild decoded.js (only needed when modifying framework):
cd /path/to/dc-runtime  # External repo not in this project
bun run build            # Produces updated runtime
# Output automatically copied to ./decoded.js in this project
```
⚠️ **NEVER EDIT `decoded.js` DIRECTLY** - changes will be lost on rebuild

## File Structure & Key Components

### Core Files
- `index.html` - Main application shell (~300KB gzipped)
- `decoded.js` - Compiled dc-runtime framework (DO NOT MODIFY)
- `manifest.json` - PWA configuration for installation
- `*.txt` files - Manifest variants for debugging

### Quran Data (Lazy-loaded)
Loaded only when user opens specific surah/translation:
- `peace-quran-ar.js` - Arabic Quran (Uthmani script via Tanzil)
- `peace-quran-en.js` - English Translation (Marmaduke Pickthall, PD)
- `peace-quran-ckb.js` - Kurdish Soranî Translation (via alquran.cloud)
- `peace-quran-kmr.js` - Kurdish Badînî Translation (Ismail Sigêrî, complete 6,236 ayat)
- `peace-lang-kmr.js` - Kurdish Badînî UI Strings (intentionally incomplete - falls back to Soranî→English)

### Content & Reference Files
- `legacy.html` - Previous version kept for reference
- `template*.json` - UI template definitions used by dc-runtime

## Key Features Implementation Details

### Prayer Time Calculation
- **Algorithm**: Astronomical Almanac formulas for solar position
- **Adjustable Parameters**:
  - Fajr/Isha: Twilight angles (customizable per calculation method)
  - Asr: Standard (1x shadow) vs Hanafi (2x shadow) 
  - High-Latitude Adjustments: Multiple methods available
  - Per-Prayer Offsets: Fine-tune for local mosque discrepancies
- **Validation**: Checked against NOAA solar calculator and Umm al-Qura (Makkah)

### Qibla Direction
- Uses spherical trigonometry for great-circle calculation
- Accounts for Earth's oblateness for improved accuracy
- Visualized via compass-like interface in UI

### Quran Rendering System
- **Lazy Loading**: ~300KB initial load, language packs loaded on-demand
- **Text Rendering**: Optimized for Arabic script rendering with proper shaping
- **Navigation**: Juza' (para), hizb (quarter), sajdah (prostration) markers
- **Search**: Arabic/Unicode-aware indexing within loaded surat
- **Bookmarking**: Persisted via localStorage with surah:ayah precision

### Adhkar (Remembrances) System
- Context-aware: Different azkar for morning/evening/before/after salah/sleep/wake
- **Source Citations**: Eachadhkareference includes hadith source (Bukhari, Muslim, etc.)
- **Audio Integration**: Optional audio playback for specificadhkar
- **Customization**: Users can add personaladhkarto collections

### Islamic Calendar (Hijri)
- **Conversion Algorithm**: Based on Kuwaiti moonsighting simulation
- **Features**: 
  - Gregorian ↔ Hijri bidirectional conversion
  - Islamic month names with cultural context
  - Hijri holidays (Eidain, Ramadan start/end, Ashura, etc.)
  - Moon phase visualization

### Zakat Calculator
- **Nisab Calculation**: Real-time gold/silver price integration (optional network)
- **Asset Types**: Cash, gold/silver jewelry, business inventory, livestock, crops
- **Liability Deduction**: Debt subtraction per fiqh principles
- **Hawl (Year) Tracking**: Gregorian and Hijri-based anniversary calculation

### 99 Names of Allah (Asma ul Husna)
- **Multilingual**: Arabic with transliteration and meaning in UI language
- **Audio**: Optional pronunciation recordings
- **Tajweed Guidance**: Proper articulation points for complex names
- **Reflection Prompts**: Contemplation prompts for each name

## Technical Architecture Deep Dive

### DC-Runtime Custom Elements
The framework extends HTML with `<x-dc>` components featuring:
- **Reactive Data Binding**: `data-bind="property:expression"` syntax
- **Computed Properties**: Auto-updating derived values
- **Event Handling**: `data-on="event:handler"` 
- **Templates**: `<template>` elements with conditional rendering (`data-if`, `data-for`)
- **State Management**: Hierarchical scope inheritance
- **Lifecycle Callbacks**: `created()`, `attached()`, `detached()`, `updated()`

Example from index.html:
```html
<x-dc data-bind="currentTime:now() | formatTime" 
      data-on="visibilitychange:handleVisibility">
  <!-- Template content -->
</x-dc>
```

### Performance Optimizations
1. **Code Splitting**: Quran loader only fetches needed language/surah
2. **Virtual Scrolling**: Long lists (ayah lists, names) render only visible items
3. **RequestAnimationFrame**: Animations and UI updates synced to display refresh
4. **Web Workers**: Heavy calculations (prayer times for months) offloaded
5. **IndexedDB**: Optional caching for frequently accessed content
6. **CSS Containment**: Layout isolation for complex widgets

### Data Persistence Strategy
- **User Preferences**: Theme, calculation methods, locale (localStorage)
- **Progress Tracking**: Quran bookmarks, adhkar completion (IndexedDB fallback to localStorage)
- **Cache Control**: Service Worker NOT used (by design for transparency) - relies on HTTP caching headers sufficient

## Development Guidelines

### Adding New Features
1. **Stay Offline-First**: Any network calls must be optional with clear fallbacks
2. **Preserve Privacy**: No analytics, telemetry, or unnecessary permissions
3. **Maintain Performance**: Budget <16ms frame time for animations
4. **Respect Religious Sensitivities**: 
   - Quran text must be from authenticated sources
   - Adhkarcitations must include proper references
   - Qibla calculations verified against authoritative sources
5. **Follow Existing Patterns**: 
   - Use dc-runtime bindings for reactive UIs
   - Module pattern for feature isolation
   - Semantic HTML with ARIA accessibility

### Modifying Quran/Data Content
- **Source Integrity**: Only use public domain or clearly licensed translations
- **Encoding**: UTF-8 without BOM
- **Validation**: 
  - Ayah counts must match standard mushaf (6236 total ayat)
  - Surah order must be correct
  - Basmalah placement according to target mushaf
- **File Size**: Keep individual files <3MB for reasonable mobile download

### Internationalization (i18n)
- **Primary Method**: Language-specific JS files (peace-lang-*.js)
- **Pattern**: 
  ```javascript
  // Example structure in peace-lang-kmr.js
  window.LOCALE = {
    appName: "Peyace",
    prayerFajr: "Bêyanín",
    // ... hundreds of keys
  };
  ```
- **RTL Support**: Automatic for Arabic/Persian/Urdu modes
- **Fallback Chain**: Requested → Available → English

### Accessibility (a11y)
- **Screen Reader**: ARIA labels for all interactive components
- **Keyboard Navigation**: Full tab order with logical sequencing
- **Focus Management**: Traps in modals, returns to trigger on close
- **Color Contrast**: Minimum 4.5:1 for text, 3:1 for large text/UI components
- **Reduce Motion**: Respects `prefers-reduced-motion` media query

## Build & Deployment

### Production Build
Since this is primarily a static site:
1. **Asset Optimization**: 
   - Minify HTML/CSS/JS (preserving functionality)
   - Optimize images (SVG preferred where possible)
   - Consider Brotli/Gzip compression on server
2. **Cache Headers**: 
   - `index.html`: `Cache-Control: no-cache` (for version updates)
   - `.js` data files: `Cache-Control: max-age=31536000, immutable`
   - `decoded.js`: `Cache-Control: max-age=86400, must-revalidate` (updated occasionally)
3. **Deployment Targets**: 
   - Any static host (Netlify, Vercel, GitHub Pages, Firebase, S3+CloudFront)
   - Ensure correct MIME types: `.js` → `application/javascript`, `.json` → `application/json`

### Testing Protocol
1. **Prayer Time Verification**:
   - Test against known locations (Makkah, Madinah, Jerusalem, etc.)
   - Verify extreme latitudes (Northern Norway, Antarctica research stations)
   - Cross-reference with IslamicFinder.org, MuslimPro (for comparison only)
   
2. **Quran Validation**:
   - Random spot-check against printed mushaf
   - Verify sajdah marks (14 locations in Quran)
   - Confirm basmalah handling (Surah 9 exemption, others present)
   
3. **Performance Benchmarks**:
   - First Paint < 1s on 3G-like throttling
   - Time to Interactive < 3s on mid-tier mobile
   - Memory usage < 100MB steady state
   - 60fps animation during transitions

4. **Offline Validation**:
   - Airplane mode test all core features
   - Service worker simulation (network tab offline)
   - Confirm data persists after browser restart

## Known Constraints & Design Choices

### Intentional Limitations
- **No Network by Design**: Except optional audio/Quran downloads (explicit user action)
- **No Accounts/Sync**: Data stays on device - privacy feature
- **No Cloud Backup**: Users responsible for device backups
- **Minimal Permissions**: Only location (for prayer/qibla) if granted

### Technical Tradeoffs
- **Bundle Size vs Features**: Large Quran files traded for offline guarantee
- **Calculation Accuracy vs Battery**: Tradeoffs in prayer time calculation frequency
- **UI Richness vs Performance**: Heavy use of CSS filters/blurs balanced withwill-change optimizations

### Future-Proofing Considerations
1. **Calendar Drift**: Hijri-Gregorian conversion formulas valid for centuries
2. **Quran Preservation**: Text formats designed for longevity beyond specific frameworks
3. **Standard Compliance**: Uses web standards that will remain viable
4. **Graceful Degradation**: Core prayer/Qibla functions work even if JS fails partially

## Contribution Principles

### For Code Contributions
1. **Maintain Offline Ethos**: New features should work without network
2. **Preserve Performance**: Profile changes with Chrome DevTools Performance tab
3. **Respect Sacred Texts**: 
   - Never alter Quranic Arabic text
   - Translation changes require scholarly review
   - Adhkarmodifications need source verification
4. **Follow Existing Patterns**: 
   - Use dc-restore patterns for reactivity
   - Keep components small and focused
   - Use semantic HTML5 elements

### For Content/Linguistic Contributions
1. **Source Verification**: 
   - Quran translations: Must be public domain or appropriately licensed
   - Adhkarcitations: Must include book/hadith number
   - Names/meanings: Cross-reference with authoritative sources
2. **Cultural Sensitivity**: 
   - Gender-neutral language where appropriate
   - Respect for different madhahib (schools of thought) in fiqh-related features
   - Appropriate terminology for concepts of faith
3. **Localization Quality**: 
   - Native speaker review preferred
   - Avoid literal translations that lose meaning
   - Consider cultural idioms and expressions

## Troubleshooting Common Issues

### "Quran text not displaying"
1. Check network tab for failed `.js` data file loads
2. Verify browser console for parsing errors
3. Confirm correct language file exists and loads
4. Try hard refresh (Ctrl+Shift+R) to clear any cached malformed data

### Prayer times seem incorrect
1. Verify device date/time and timezone settings
2. Check calculation method selected in settings
3. Confirm latitude/longitude permissions granted (if using auto-location)
4. Compare with known reference point (e.g., Makkah should be consistent globally)

### Performance issues on low-end devices
1. Reduce animation intensity in settings
2. Clear site data and reload (may resolve corrupted IndexedDB)
3. Disable optional audio features if enabled
4. Consider using lighter weight browser (Firefox Lite, Opera Mini variants)

## Legal & Ethical Considerations

### Content Licensing
- Quran Arabic: Tanzil.org (CC BY-NC for non-commercial use - we comply via offline/no distribution)
- English Quran: Marmaduke Pickthall (1930) - Public Domain
- Kurdish Soranî: Alquran.cloud (used per their terms for personal use)
- Kurdish Badînî: Ismail Sigêrî translation - used with permission/acknowledgement
- Adhkarsources: Cited hadith collections (Bukhari, Muslim, etc.) - public domain texts
- Prayer time algorithms: Based on published astronomical formulas (public domain)

### Religious Authority Disclaimer
The app provides tools for Islamic practice but does not replace consultation with knowledgeable scholars. Users should:
- Verify prayer times with local mosque when uncertain
- Consult scholars for complex fiqh questions (zakat, inheritance, etc.)
- Use Quran translations as aids, not replacements for Arabic study
- Cross-reference adhkarswith trusted scholars when possible

### Data Privacy Commitment
- **Zero Telemetry**: No analytics, crash reporting, or usage tracking
- **No Fingerprinting**: Canvas/font fingerprinting techniques avoided
- **Local Storage Only**: All data remains on user's device unless explicitly exported
- **Open Source Transparency**: All code inspectable for verification
- **No Third-Party Scripts**: No external libraries, CDNs, or frameworks beyond web standards

This application is provided as a tool to facilitate remembrance of Allah (dhikr) and ease of worship. May it be beneficial and accepted. Ameen.

Ready to assist with development, feature enhancements, bug fixes, or content additions for this Islamic companion application.