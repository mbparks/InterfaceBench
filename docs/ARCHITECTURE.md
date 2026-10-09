# Architecture and extension points

There is no build-time or server-time application runtime. `src/` contains ES modules and authored static assets; `dist/` contains their copied deployment form plus the bundled dependencies and font. `scripts/sync-dist.py` copies source without compilation. Tests import the deployed modules so the tested source is the delivered source.

| Module | Responsibility |
|---|---|
| model.js | schema constants, default parts, sample projects, units, stable identities, baselines and output fingerprints |
| geometry.js | shape primitives, physical transforms, text paths, canonical fabrication scene, curve sampling and bounds |
| validation.js | non-destructive project/definition validation and restrictive SVG normalization |
| storage.js | IndexedDB transactions, save generations, recovery snapshots and cross-tab notices |
| checks.js | conservative geometric and declared-electrical findings, with confidence and explicit unknowns |
| rehearsal.js | isolated deterministic event-driven simulation state |
| exports.js | SVG/PDF/PNG/CSV/HTML/Arduino/JSON/ZIP, frozen snapshots, manifest and download handling |
| canvas.js | front/rear presentation and selection/measurement overlays derived from canonical geometry |
| app.js | editor state, views, dialogs, commands, input handling, project mutations and undo/redo |
| sw.js | directory-scoped, versioned offline resource cache and explicit update activation |

Design state is distinct from transient editor state, simulation and derived checks. A mutation validates a cloned next state before acceptance, adds one undo entry and schedules a save. Gestures make temporary updates; completing a drag commits one undo entry. Escape restores its pre-drag state. Layer visibility is persisted but does not control export inclusion. Geometry and artwork export data are generated from the model, never from canvas pixels.

Storage transactions retain the previous successful project and the new project together. Compare-and-save generations prevent a stale tab from overwriting newer work. Local save records, recovery records, preferences, reusable library parts and export history use separate stores. Unsaved changes trigger a browser unload warning. Save failures remain visible and portable backup remains available.

Default app resources are all local. Imported SVG is parsed, rejected when outside the supported subset, and converted to a normalized representation. Raw markup never reaches the working DOM. UI text is escaped. Raster imports are decoded and re-encoded. Content Security Policy blocks inline/external scripts and remote resources.

To add a new component: extend the definition schema only when needed, add a starter definition, verify dimensional sources, implement its front appearance and rehearsal behavior, then add a dimensional fixture. Never key connections by an editable reference label.

To add an export: accept a frozen project snapshot, consume canonical scene geometry, record options and orientation, and add independent dimensions/round-trip fixtures. To add a controller: use physical pin identities, source capability/voltage declarations, and test shared and exclusive assignments. New schema fields need an explicit migration and non-destructive failure tests.

Current implementation boundaries: envelopes are circles/rectangles; no 3D B-rep/solid model; SVG import is deliberately restricted; the rule engine is not a firmware compiler. Browser acceptance, responsive visual review, and long-running asset/quota behavior are the next release gates.

## v1.3 extension modules

- `svg-import.js`: safe XML-to-normalized-geometry boundary, affine matrices and SVG path normalization.
- `definition-editor.js`: accessible opening/terminal table markup; draft edits do not mutate the project before submit.
- `catalog.js`: sourced declarations, immutable part revisions, comparison and assignment compatibility.
- `interchange.js`: version-bounded native adapters and explicit conversion reports, without networking.

Each module is included in the scoped service-worker cache. All new imports use the existing validated, undoable mutation boundary. Companion import review checks that the source project did not change while the dialog was open.

- `component-library.js`: 267 built-in parts, category/source resolution, dimension summaries and word-based search. Generic factories declare illustrative geometry and placeholder terminals. App catalog state is separate from project history; favorites live in workspace preferences.
- `scripts/catalog-docs.mjs`: generates the exact inventory, standalone offline catalog and release/catalog report from source definitions. Run before `scripts/sync-dist.py`.
