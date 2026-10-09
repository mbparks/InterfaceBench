# INTERFACEBENCH 1.4.2-rc.1 — label fabrication correction

2026-10-09 · GPL-3.0-only · Static drop-in package.

Select a component and use exactly two checkboxes: **Label on Front** and **Label on Rear**. These choose which surface receives the fabricated label. Both, either or neither may be selected; settings save and undo with the design. New components default to front only.

Panel master switches and the assembly-guide mode are removed. Effective v1.4.1 choices migrate into the two component flags, then the obsolete master settings are removed. Existing projects without side flags keep front labels only.

Fabrication ZIPs automatically contain separate front and rear-label files in enabled SVG/PDF/PNG formats. Rear artwork uses mirrored physical positions and readable outlined text, with the rear face up. It contains selected labels rather than rear bodies/cutouts or automatically generated reference numbers. Independent front artwork remains on the front. Individual exports use the Front/Rear face selected above the canvas in Fabricate.

64 tests pass, including all four checkbox combinations, one-time migration, persistence/undo, separate immutable manufacturing files, rear path isolation, rotation/origin handling and layer inclusion. Rear SVG/PDF output was rendered and reviewed. Browser QA remains pending because the Sites skill prohibits an unsupported browser fallback in this environment. No live-browser or physical machining verification is claimed.

Upload all files from the server ZIP to the existing /interfacebench/ directory. Make a JSON backup before updating and use Save & reload when offered. The repository ZIP includes the same distribution, source, tests and documentation.
