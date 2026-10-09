# Development roadmap — 1.3.0-rc.1

## Implemented batches

| Batch | Delivered capability |
|---|---|
| v1.0 foundation | Panel editor, components, fabrication geometry, wiring, rehearsal, durable local projects, reports, examples and static packages. |
| v1.1 authoring | Opening and terminal tables, stable terminal identity, SVG Bézier/arc/affine normalization, editable scale ticks and numeric/custom legends. |
| v1.2 reusable parts | Two manufacturer-sourced switch definitions with explicit assumptions; UNO R4 Minima/Nano Every profiles; immutable library revisions, comparison, explicit instance updates and guarded imports. |
| v1.3 handoffs | PINNOTE native export/returned wiring, REFLEX inventory export/returned pins, COPPERBENCH board mounting-template import, conversion reports and source backups. |

## Required before a stable v1.3.0

Real-browser acceptance remains open, carried forward from v1.0. The current managed environment has no supported browser-control skill; the Sites workflow forbids substituting an unmanaged preview/browser. Do not promote by changing the version string alone.

Run the browser journey script and manual checklist in docs/QA.md. Verify desktop/mobile layout, keyboard/focus, pointer editing, native files/downloads, real IndexedDB, quota/cross-tab behavior, offline reload, explicit update preservation and browser performance. Correct any release blockers.

## After acceptance

Use fabrication feedback to prioritize additional measured component families and requested controller boards. Extend adapters only against inspected, versioned companion formats. Full solid CAD, PCB routing, circuit simulation, unrestricted firmware, machine CAM, DXF and STL remain outside this release.
