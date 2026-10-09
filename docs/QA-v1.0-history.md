# Verification record — 1.0.0-rc.1

Date: 2026-10-08. Environment: Linux x64, Node.js v24.19.0. Checks were run against the deployable ES modules and bundled dependencies.

## Passed: 28 automated checks

- 17 model/export checks: clean and diagnostic example validation; JSON round trip; explicit units and malformed quantities; front/rear fixture; rotated bounds; SVG units/origin/circular opening/fit allowance; outlined text and unsupported glyph error; library isolation; expected deliberate physical/electrical conflicts; no modeled errors in the clean example; legitimate shared I²C and power; deterministic rehearsal/reset; manufacturing provenance independent of layer view/lock state; baseline isolation/change list; schema migration/malformed/future/prototype rejection; restricted path parser; CSV escaping and code identifiers; A4/true-sheet PDF dimensions and frozen ZIP snapshot/hash manifest.
- 7 interface-logic checks using a minimal DOM contract: storage-unavailable first launch; welcome/editor templates; duplicate/rotate/undo; exact numeric edits and unit display; all workflow stages; custom definition dialog fields; invalid import non-destruction and baseline preservation; locks and multi-selection alignment. These do not simulate actual layout, pointer delivery, browser security or accessibility.
- 4 storage transaction-contract fault-injection checks: successful generation/snapshot saves; interrupted/quota-failed writes preserving the last good state; stale second writer rejection; ten-snapshot retention. A deterministic in-memory transaction fixture was used. This is not actual browser IndexedDB testing.

Command: `node --test tests/*.test.mjs`.

## Independent output verification

`tests/output-fixtures.mjs` exports a 100 × 80 mm panel with a 10 mm circular opening at model (25,30) mm. PyMuPDF independently read the generated PDF paths. With a (10,27) mm page placement, expected opening bounds were (30,52,40,62) mm. Measured maximum bounds error was approximately 0.0000025 mm from PDF numeric encoding. The 20 mm calibration square and 120 × 142 mm page size were also checked. See `qa/independent-dimensions.json`.

Poppler rasterized the actual-size sheet and both A4 pages. Visual inspection caught malformed substituted heading text; headings were changed to bundled outlined DejaVu Sans, regenerated and visually rechecked. Scale/labels/cut geometry/calibration/overlap were legible after correction. Canvas front/rear geometry was rendered separately with Sharp/librsvg for geometry review. These are generated geometry previews, not browser screenshots.

Sharp independently rasterized the exported SVG at the expected 300 DPI dimensions for the 280 × 180 mm example: 3307 × 2126 pixels, four channels, with transparent and opaque pixels. The browser's own Canvas PNG download path still needs browser verification.

The example Arduino sketch passed `g++ -std=c++11 -Wall -Wextra -fsyntax-only` against a minimal Arduino API declaration fixture. Expected unused-input-variable warnings remain in scaffolding. **arduino-cli was unavailable; no target-core compile, linking, upload or hardware test is claimed.**

## Performance fixture

`examples/performance-100-200.json`: 100 components and 200 artwork objects. Five Node runs were measured for validation/clone, checks, SVG generation and PDF generation. Full results and the exact environment are in `qa/performance.json`. These are module timings, not browser dragging, zooming, save latency or frame-rate results. They do not establish universal performance.

## Blocked browser acceptance gates

The required managed preview failed with `bwrap: Can't mount proc on /newroot/proc: Operation not permitted`. `sites-preview status` reported stopped. The configured Chromium executable was absent. The environment's preview guidance does not allow substituting a different unmanaged preview service. No public deployment was authorized or attempted. These are the reason this build remains **1.0.0-rc.1**, not v1.0.0.

Before release, run `tests/browser-journeys.mjs` in a working browser environment, inspect its screenshots and complete the following manual checks:

1. Cold start on `/interfacebench/`: blank panel → component → exact position → export in under a minute. Explore examples without overwriting a saved project.
2. Drag/marquee/pan/pointer-anchored zoom; one drag = one undo; Escape cancellation; multi-touch/pinch and keyboard alternatives; rulers/snap/alignment and lock behavior.
3. Custom compound openings, photos, SVGs and raster images; library save/import/replace with assignments; no change to old instances.
4. Actual IndexedDB reload; multiple tabs; induced quota/blocked-storage failures; recovered copies; no successful status on a failed save.
5. Native file dialogs, JSON/library import round trips, rejected executable SVG, unsupported geometry diagnostics and all download paths.
6. Wiring sorting/search, exclusive conflicts, valid shared buses, unknown compatibility, voltage-domain/interface notes; reference renaming preserves identities.
7. Rehearsal press/release/toggle/encoder/pot operations, target display/indicator, rule order, reset and geometry protection.
8. Matching all selected outputs from one frozen revision; transparent PNG physical dimensions; image-bearing PDFs; nominal vs compensated geometry; A4 overlap alignment on an actual printed calibration fixture.
9. Browser export history survives reload; camera/theme/selection changes do not stale exports; relevant geometry/artwork/wiring changes do.
10. Desktop, tablet and phone layouts, enlarged browser zoom, all three themes, reduced motion, full keyboard navigation, modal focus, accessible labels and status announcements. Review screenshots; DOM-contract checks cannot replace this.
11. HTTPS/localhost installation in a static subdirectory, offline reload after caching, update waiting/activation without data loss and no hidden external requests.
12. Repeat the 100/200 performance fixture in an actual named browser, measure drag/zoom and save behavior, and record machine/browser details.
