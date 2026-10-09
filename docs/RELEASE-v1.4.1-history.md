# Release report — INTERFACEBENCH 1.4.1-rc.1

2026-10-09 · GPL-3.0-only · Static drop-in release · Project schema 3.

## Clean front, labeled rear

Panel-wide Front/Rear label switches live beside the view controls. Individual component switches live in the inspector. Both are saved with the design, undoable and included in artwork freshness and baseline comparisons. Existing projects default to both sides on.

Front fabrication SVG/PDF/PNG honor front labels. Rear assembly SVG/PDF outputs reflect geometry while keeping labels and references readable. Guides are available directly in Fabricate and as optional companions in the fabrication ZIP. They use nominal openings and rear-body envelopes, exclude independent front artwork and are clearly labeled as assembly references, not cutting templates. Front fabrication origin behavior remains unchanged.

The 267-part library remains included. Rear label contrast is improved and schematic contact markers for dense connectors remain within rear-body bounds.

## Verification

64 tests pass. All front/rear combinations, saved/imported settings, undo, per-component visibility, canonical cut geometry, mirrored geometry, readable glyphs, PDF and frozen ZIP output are covered. Actual canvas geometry and the rear PDF were rendered and visually reviewed. Browser acceptance is still pending: the Sites skill prohibits using a substitute browser when the supported browser-control skill is unavailable. No actual browser or hardware validation is claimed.

## Use

In Arrange, uncheck **Labels → Front** and keep **Rear** checked. Switch to Rear to see readable component references and labels. For one component, use its inspector switches. In Fabricate, download **Rear guide SVG / PDF**, or leave rear guides enabled in the ZIP options.

Upload all files from the server ZIP to the existing `/interfacebench/` folder, keeping index.html at the root. Back up project JSON before updating and use Save & reload when offered. Source/tests/docs and the identical distribution are in the repository ZIP. Use v1.4.1+ to honor saved side settings.
