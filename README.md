# INTERFACEBENCH

**Give your contraption a face.** A self-hosted, local-first Field Instrument for physical interface design.

Version **1.4.3-rc.1** · Project schema **3** · GNU GPL v3 only.

This is a functional release candidate, not the final verified v1.4. The model, interface logic and export pipeline pass 64 automated checks. The original browser preview was blocked; this environment currently has no supported browser-control workflow. Real browser interaction, responsive screenshots, IndexedDB persistence and offline reload remain release gates. See `docs/QA.md` for precisely what was and was not tested.

## Launch on your server

1. Extract **INTERFACEBENCH-v1.4.3-rc.1-server.zip**.
2. Copy **all extracted files and folders** to the server directory for `https://mbparks.com/interfacebench/`.
3. Open that URL with the trailing slash. Choose **New panel**, **Explore an example**, or **Open project**.

`index.html` must be directly inside the route directory. Also upload `style.css`, `icon.svg`, `sw.js`, `js/`, `vendor/`, `fonts/`, `licenses/`, `README.html`, and `LICENSE`. It is not a single-file application. No compile step, Docker, account, API key, backend or database service is required.

Use standard MIME types for `.js`, `.css`, `.svg`, `.ttf`. ES modules require JavaScript files to be served with a JavaScript MIME type. HTTPS is required for the service worker, except on localhost. Do not use an SPA rewrite that returns `index.html` for missing JavaScript files.

This delivery was **not deployed** to mbparks.com or another host.

## Run locally on macOS, Windows or Linux

With Python 3 installed, open a terminal inside the extracted **server** folder:

```sh
python3 -m http.server 8000
```

On Windows, `py -m http.server 8000` may be the available command. Open `http://localhost:8000/`. From this repository, run `python3 -m http.server 8000 --directory dist` instead. Double-clicking `index.html` under `file://` is not supported because modules and the bundled font need an HTTP origin.

## Workflow

**DEFINE → ARRANGE → CONNECT → REHEARSE → FABRICATE**

- **Define:** multiple rectangular, rounded rectangular, circular or supported SVG polygon panels; dimensions, material, thickness, process, origin, available rear depth and edge spacing.
- **Arrange:** embedded component definitions, direct dragging, exact coordinates, explicit unit suffixes, front/rear view, pointer zoom/pan, grid/snap/guides, multi-selection/marquee, locking, undo/redo, group/ungroup, alignment, distribution and row/column/circular repeats. Two selected origins show a centre-to-centre dimension; the measure tool measures two points.
- **Artwork:** labels, text, lines, symbols, borders, plates, rotary/linear tick scales, sanitized SVG curve/transform geometry and embedded PNG/JPEG images. Separate outline, cut, engraving, UV, overlay, registration and reference layers.
- **Connect:** source-documented UNO R3, UNO R4 Minima and Nano Every capability presets or manual controller definitions; searchable/sortable wiring table; pin/terminal/signal assignments, shared buses, pull-ups, active-low intent, voltage domains, external interface notes and conflict findings.
- **Rehearse:** momentary buttons, switches, encoders and pots; state variables, ordered non-recursive rules, simulated indicators/displays, reset and event trace. Geometry is protected in rehearsal.
- **Fabricate:** layered SVG, actual-size/tiled PDF, transparent PNG, wiring CSV, printable HTML pin map, Arduino assignment scaffolding, editable JSON, build sheet and a frozen-snapshot ZIP with a hash manifest.

The panel design and fabrication workflow does not depend on completing electronics or rehearsal.

Front and rear labels use the same plain text appearance.

## Fabricate labels on either side

Select a component. Under its Label field, use exactly two checkboxes: **Label on Front** and **Label on Rear**. Choose front, rear, both, or neither. The choices save with the project and support undo. New components default to front only.

These control actual fabrication artwork. The fabrication ZIP automatically includes front files plus `-rear-labels.svg`, `-rear-labels.pdf` and `-rear-labels.png` for enabled formats when there are rear labels to produce. Rear SVG/PNG artwork contains the selected label paths only. Rear positions are reflected for working with the rear face up; glyphs remain readable. Turn the panel left-to-right about its vertical centreline. PDF adds its normal print header/calibration outside the panel area, with no internal crosshairs on rear output.

For an individual SVG/PDF/PNG, choose Front or Rear above the canvas in Fabricate, then export. The ZIP always evaluates both faces. Independent artwork remains front artwork; the existing layer export controls still apply. Panel master switches and assembly-guide modes have been removed. Files from v1.4.1 have their effective master settings folded into the component checkboxes on import. Older files without label-side choices keep front fabrication labels and do not gain rear markings automatically.

Open `examples/clean-front-labeled-rear.json` to try rear-only label fabrication.

## Components

**267 components across 14 categories**, including 255 additions in v1.4: pushbuttons, selectors, rotary controls, faders/joysticks, indicators, displays, audio/data connectors, power/protection, sensors, cable entries, fasteners, ventilation and module carriers. 265 generic planning templates and 2 manufacturer-sourced parts. See `docs/COMPONENT-CATALOG.md` or open `CATALOG.html` in the server package.

Use category/source filters, multi-word search, favorites, and Details before placement. Examples: `USB type C`, `fader 100`, `MIDI`, `M3 standoff 20`. Show more expands 24 matches at a time. Filters survive placement; favorites are saved with workspace preferences. Custom part category and tags are editable.

Starter parts are **illustrative and dimensionally unverified**. Measure the actual hardware before fabrication. A component owns its front face, openings, rear body, access envelope, mounting limits, depth, cable allowance, label, terminals and behavior type. Projects embed their definitions. Saving/importing a library never silently updates placed components.

Select a part and choose **Edit definition**. Front/rear/access envelopes are circles or rectangles. Openings can combine circles, rectangles/rounded slots and supported closed paths. Opening and terminal tables support direct entry; terminal names are separate from stable IDs. Save an edited definition as a new family or an immutable revision. Use **Check revisions** to compare and explicitly update selected instances. **Replace part** previews removed incompatible assignments before applying a new definition.

Part evidence can include a local embedded photo, measurement notes, a source reference and verification date. Marking dimensions verified is the user's declaration, not a manufacturer certification.

## Units, orientation and geometric limits

- All model dimensions are stored in **millimetres**, using JavaScript double precision. Unit switches change presentation only. Fields accept `12.7 mm`, `1 cm`, `0.5 in` and `0.5"`.
- X and Y editing always uses front-reference coordinates. Rear presentation applies `(x,y) → (panelWidth-x,y)` without modifying the model. Annotation anchors follow that transformation while labels remain readable.
- Fabrication exports always use the **front orientation**, +X right and +Y down. SVG viewBox and a translation express the selected top-left, centre or bottom-left origin.
- SVG circles and rounded rectangles use native primitives. PDF uses 16 cubic segments per circle; maximum radial approximation error is below 0.0002 mm over the supported circle diameter range. Rendering, checking and exporting share the same geometric definitions.
- PDF templates contain registration crosses and a 20 × 20 mm calibration square. A4 templates use 10 mm overlap. **Print at 100% / Actual size**, disable fit-to-page and measure the square. File dimensional verification does not certify a physical printer.
- Optional fit allowance expands supported circle/rectangle openings per side. It is explicit, reversible and recorded. It is not automatic machine kerf compensation. Unsupported compensated geometry stops export.
- Layer visibility is for the canvas; export inclusion is the independent rightmost layer checkbox. PNG uses selected engraving/UV/overlay/registration artwork, on transparency. It is RGB without ICC/printer color management. Maximum raster output is 24 megapixels and 16,000 pixels per side.

## Import boundaries and security

Project JSON is validated before replacing the current project. Unsupported schemas, duplicate identities, invalid values, unsafe object keys and missing assets are rejected. Imports become separate project copies, preserving baselines and embedded assets.

SVG import supports circles, ellipses, rectangles, lines, polygons/polylines, **M/L/H/V/C/S/Q/T/A/Z** paths and nested affine transforms, with a physical size and uniformly scaled viewBox. Bézier curves are retained; arcs use cubic approximation. A panel outline requires one closed contour and is sampled into a polygon. Outline text in the source editor. Geometry is imported as monochrome paths; CSS and visual effects are unsupported. Scripts, event handlers, CSS, references, external images, filters, clipping and unsupported elements are rejected, not silently approximated. Imported SVG source is never inserted into the DOM. Raster imports are decoded and re-encoded locally. Arbitrary executable expressions are not supported in rules or files.

## Persistence, privacy and recovery

No telemetry, account, tracking, advertising or external runtime requests. Application resources are bundled locally. Sources and datasheet references are records, not automatically fetched.

Projects and embedded assets are autosaved to IndexedDB under the current site origin. A successful transaction stores the new state and the prior successful state atomically. Up to ten prior saves are retained per project. Save status distinguishes unsaved, saving, saved and failure. A generation check rejects a stale writer from another tab; BroadcastChannel provides an early notice. Recovery opens old saves as copies. **New panel** creates a blank project and keeps previous local projects.

**Local autosave is not a portable backup.** Use **Backup** to download project JSON. Browser data clearing, private mode, quota restrictions or a different origin may remove or isolate local storage. If a save fails before switching projects, the app downloads the unsaved project before proceeding. Storage failures never display a successful save message.

Preferences include units, theme, Easy/Advanced detail level, grid/nudge steps and side-panel widths. Light, dark and high-contrast themes are implemented. Numeric/list controls offer alternatives to canvas gestures. Keyboard and screen-reader behavior still require the browser release gate.

## Offline and updates

On HTTPS/localhost, the service worker caches the application and bundled dependencies after first load. It is scoped to the installation directory. Previously opened local projects should remain usable offline after installation. **This browser behavior is implemented but was not verified in this environment.**

New application versions wait for an explicit **Save & reload** action. Cache cleanup is restricted to this route's cache keys. Updates do not clear IndexedDB. Keep a JSON backup before replacing server files. Upload the whole matching distribution, and serve `sw.js` with revalidation rather than an immutable cache header.

## Findings and trust boundary

Findings carry severity, confidence, explanation, affected objects and a next action. Acknowledgment records a reason and never turns a warning into a pass. Checks cover openings beyond boundaries, edge spacing, overlapping/duplicate openings, conservative rear/access interference, mounting thickness/depth, possible artwork interference, invalid export text and declared wiring issues.

Rear/access checks use conservative rotated bounding boxes and common depth intervals, not full solid geometry. Curved boundaries are sampled for spatial checks. Unknown terminal compatibility is labeled unknown. Shared power/ground and consistently declared I²C/SPI bus signals are supported. Device addresses, bus loading, currents, EMI, structural strength and circuit behavior are not validated.

The generated Arduino sketch is **input/output assignment scaffolding**. It does not implement the rehearsal program. Add debounce, drivers, device libraries and application logic. Version-bounded PINNOTE/REFLEX/COPPERBENCH handoffs are available under **App handoffs**; see [mapping and limitations](docs/INTERCHANGE.md). No DXF, STL, CAD solid modeling or CAM/toolpath generation is claimed.

## Repository and development

- `src/`: authored application source, organized into domain modules.
- `dist/`: exact no-build server distribution, with local dependencies and font.
- `examples/`: clean example, diagnostic variant and 100-component/200-artwork benchmark.
- `tests/`: model/export tests, DOM-contract interface tests, storage fault-injection tests, real-browser journeys and output fixture generators.
- `docs/`: schema, architecture, release report and verification details.
- `licenses/`: third-party license texts. `LICENSE`: project GPL v3 text.
- `scripts/sync-dist.py`: copy authored source into the deployable distribution, without transpiling or minifying.
- `scripts/package.py`: ZIP packaging and file hashes.
- `qa/`: representative generated output and independent measurement records, not claims of browser screenshots.

Run automated checks with Node.js 22 or newer:

```sh
node --test tests/*.test.mjs
```

Run `npm install` first to install the dev-only XML parser. Runtime app dependencies are already bundled. To run the unexecuted browser suite locally:

```sh
npm install --no-save playwright
npx playwright install chromium
node tests/browser-journeys.mjs
```

The browser suite starts a localhost static server scoped under `/interfacebench/`, exercises key journeys and writes screenshots to `qa/browser/`. Inspect those screenshots and complete the manual gates in `docs/QA.md` before promoting this candidate to v1.3.0.

See `ROADMAP.md`, `CHANGELOG.md`, `THIRD-PARTY-NOTICES.md` and `docs/RELEASE.md`.

## New in the v1.1–v1.3 batches

- **Part definition:** edit openings and terminal names/roles in tables. Source dimensions stay embedded in each placed instance.
- **Scale legends:** select a rotary/linear scale and choose **Ticks & legends**. Numeric or custom labels are exported as outlined vectors.
- **Reusable revisions:** save a revision, select an older instance, choose **Check revisions**, inspect changes and apply explicitly. Undo restores the previous definition and assignments.
- **Sourced parts:** search E-Switch in the library. Manufacturer dimensions and assumed envelopes are distinguished; these are not physically measured parts.
- **Controller presets:** Connect → Controller & pins → select a preset → Load preset → Save. Custom declarations remain editable.
- **App handoffs:** review native companion exports or import a Copperbench mounting template / returned wiring. Every export includes a conversion report and full source backup.

See [SOURCES](docs/SOURCES.md), [INTERCHANGE](docs/INTERCHANGE.md), [release report](docs/RELEASE.md) and [QA](docs/QA.md).

For developer tests, run `npm install` once for the dev-only XML parser, then `npm test`. The server distribution requires no installation or compilation. A release candidate remains appropriate until actual browser acceptance is completed.
