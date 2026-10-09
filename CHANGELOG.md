# Changelog

## 1.4.0-rc.1 — 2026-10-09

- Expanded built-in library from 12 to 267 parts in 14 categories: 255 additional generic planning definitions with openings, rear/access envelopes and terminals where relevant.
- Added category/source/favorites filters, word-based multi-term search, 24-item incremental browsing, preserved search on placement and saved favorites.
- Added dimension/offset/provenance details before placement; custom part categories and search tags; scalable geometry thumbnails and physical-outline visuals.
- Bundled an offline catalog reference and generated exact inventory documentation. Existing definitions remain embedded and legacy imports remain supported.
- 57 automated tests pass, including all-definition placement, JSON/exports, internal cut-pattern geometry, complex PDF/ZIP output and library browsing contracts.
- Still a release candidate: supported real-browser QA remains unavailable. No deployment or hardware validation claimed.

## 1.3.0-rc.1 — 2026-10-09

Development continued in v1.1, v1.2 and v1.3 implementation batches. Browser release acceptance remains open.

### v1.1 — authoring
- Direct opening and terminal tables; editing terminal names preserves wiring identities.
- Safe SVG M/L/H/V/C/S/Q/T/A/Z paths, ellipses and nested affine transforms. Raw XML and remote content never enter the editor DOM.
- Rotary/linear scale legends with numeric range, custom labels, prefix/suffix, tick spacing/lengths and outlined export text.
- Fixed numeric edits ignoring layer locks; reject unclosed contours in compound component openings.

### v1.2 — parts and controllers
- Manufacturer-sourced E-Switch PV6F240SS-341 and PV7F2Y0SS-335; physical verification and assumed clearances remain explicit.
- UNO R4 Minima and Nano Every declared-capability profiles.
- Versioned reusable part families, revision notes, comparison, explicit update and compatible assignment retention.
- Atomic library imports reject conflicting immutable revisions. Project schema3 migrates schemas1/2; libraries read v1/v2.

### v1.3 — companion handoffs
- PINNOTE 2.0.0 native schema1 exports with precise terminal/controller bindings; returned assignments update wiring after review.
- REFLEX 1.1.0-rc.1 native schema5 device inventory and eligible UNO assignments; behavior is explicitly omitted and retained in the source backup.
- COPPERBENCH 1.7.1 schema5 mounting-template import, including embedded mounting holes, slots and side/rotation transforms.
- Conversion reports and source JSON in every handoff ZIP; imports are undoable and preserve existing projects.
- Fixed imported mounting-hole reference collisions with existing panels.

## 1.0.0-rc.1 — 2026-10-08

Initial complete Define → Arrange → Connect → Rehearse → Fabricate implementation; 28 automated checks, independent SVG/PDF geometry verification, static server/repository ZIPs. Browser preview infrastructure blocked acceptance.
