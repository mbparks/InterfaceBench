# Verification record — 1.3.0-rc.1

Date:2026-10-09. Node24.19.0/Linux x64. Tests import the same modules copied into the server distribution.

## Passed

- **50 automated tests**:17 original model/export,10 UI-contract,4 storage-transaction contract,4 authoring geometry/legends,6 catalog/revisions,6 interchange,3 XML-tree SVG integration. Result: `qa/v13-test-results.txt`.
- **Native companion parsers:** PINNOTE2.0.0 and REFLEX1.1.0-rc.1 accept generated native files. Parsed PINNOTE assignments round-trip exactly. COPPERBENCH1.7.1 validates the imported native fixture. Source hashes and results: `qa/companion-parsers.json`.
- **Physical file geometry:** regenerated10 mm circle fixture and20 mm calibration square independently measured with PyMuPDF; maximum opening bounds error about0.0000025 mm. Script: `scripts/check-output-dimensions.py`; report:`qa/independent-dimensions.json`.
- **Visual export review:** Poppler rendered the v1.3 studio-panel PDF; labels, legends, outlines and calibration area were inspected. `qa/v13-panel.png` is a rendered PDF, not an application screenshot.
- **Performance:**100 components/200 artwork, five Node measurements per operation. `qa/performance.json` holds current values. No browser frame-rate claim.

XML integration uses the dev-only xml-js parser to supply an XML-tree DOM contract. UI tests use a minimal DOM contract; storage tests use a deterministic transaction fixture. They do not simulate layout, pointer delivery, browser security or native IndexedDB. Earlier verification history is in QA-v1.0-history.md.

## Browser gate remains open

The previous preview failed to mount proc and lacked its configured Chromium executable. On this update, the managed environment has no supported control-browser skill; current Sites guidance says to skip browser QA and prohibits launching a substitute server/browser. No browser checks are claimed.

The updated browser journey script includes definition-table edits, controller presets and a native handoff download. It is ready to run but was not executed here. Complete these checks before declaring stable1.3.0:

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

13. v1.1: edit/delete/add table rows, rename terminals without losing assignments, exercise invalid inputs without losing drafts, import nested transforms/curves and inspect fabrication scale; change tick legends and verify SVG/PDF/PNG results.
14. v1.2: load all presets, save a new family and successive revisions, compare/update an older instance and undo; export/import v2 libraries and reject revision conflicts without partial writes.
15. v1.3: open native handoffs in the companion browsers; edit/return wiring; reject mismatched provenance, changed controllers and unsupported topology. Import Copperbench mounting holes/slots/platform patterns alongside an existing panel, review counts, apply, save/reload and undo.
