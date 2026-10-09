# Release report — INTERFACEBENCH 1.3.0-rc.1

Development date: 2026-10-09. License: GPL-3.0-only. Project schema3 (imports schemas1–3); reusable library version2 (imports1–2). This is a static, no-compile release candidate. Nothing was deployed to a public host.

## Delivered batches

- **v1.1 authoring:** direct opening and terminal tables, stable terminal identity, sanitized SVG Bézier/arc/affine import, and numeric/custom rotary/linear scale legends with outlined exports.
- **v1.2 reuse:** two manufacturer-sourced E-Switch definitions with explicit assumed clearances; UNO R4 Minima/Nano Every capability presets; immutable library revisions, comparisons, conflict rejection, explicit instance updates and compatible wiring retention.
- **v1.3 handoffs:** native PINNOTE wiring export/return, REFLEX inventory export/return and COPPERBENCH board mounting-template import. Review screens identify counts, losses and limits. Export ZIPs retain the full INTERFACEBENCH source backup.
- Existing panel design, wiring, rehearsal, local saving/recovery, baselines, physical exports and static deployment continue to be supported.

## Verification

**50 automated checks pass**: model/export17, UI contract10, storage contract4, authoring4, catalog6, interchange6, XML-tree integration3. Actual companion code independently accepts the generated native files; PINNOTE assignments round-trip exactly. Source hashes are recorded in `qa/companion-parsers.json`.

Updated fabrication PDF was rendered with Poppler and visually inspected, including scale legends. PyMuPDF independently verified a10 mm opening at the expected physical position and a20 mm calibration square; maximum numeric bounding error was about0.0000025 mm. This is file geometry verification, not printer certification.

The100-component/200-artwork Node benchmark was rerun; results are in `qa/performance.json`. Static module/cache completeness and ZIP member hashes were checked. DOM-contract, XML-tree and fake-IndexedDB checks do not establish actual browser behavior.

## Open release gate

**Real-browser acceptance remains unverified.** The original candidate's managed preview failed; this session has no supported browser-control skill and the Sites workflow forbids a substitute preview/browser path. No preview, browser installation or public deployment was attempted for this update. Therefore the result is **1.3.0-rc.1**, not a claimed stable1.3.0.

Run `tests/browser-journeys.mjs` in a supported local environment, review the screenshots, and complete `docs/QA.md` before stable release. Key gaps are pointer/keyboard/mobile behavior, actual IndexedDB failures and cross-tab preservation, native import/downloads, offline reload/update, PNG rendering and browser performance.

## Boundaries

- Sourced part dimensions are not physical measurements. Clearances/depths include labeled planning assumptions; generic parts remain unverified.
- SVG normalizes geometry into monochrome paths. CSS, text, clipping, masks, references and external resources reject. Arc conversion and panel-outline/spatial sampling are approximate.
- REFLEX handoffs are device inventory and pin assignments, not a rehearsal-to-firmware compiler. PINNOTE supports the explicitly mapped controller-star wiring subset. COPPERBENCH import is a mounting template, not copper/PCB routing import. See `INTERCHANGE.md` for exact versions and mappings.
- No target-core firmware compile, hardware test or physical fabrication is claimed. No DXF/STL, solid CAD or machine CAM is included.

## Delivery

Extract the complete server ZIP into the directory served at `https://mbparks.com/interfacebench/` and open that address. Keep `index.html`, `js`, `vendor`, `fonts`, styles and service worker together. The repository ZIP includes the identical `dist/`, source, tests, examples and documentation. Take a JSON backup before replacing an existing installation; use the app's explicit Save & reload update action.
