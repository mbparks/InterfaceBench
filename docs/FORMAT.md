# Interchange formats

## Project JSON schema 3

Root: `app: "INTERFACEBENCH"`, `schema: 3`, stable `id`, `name`, `revision`, `modified`, `panels[]`, `controller`, `connections[]`, `variables`, `rules[]`, `assumptions[]`, `evidence[]`, `acknowledgments`, `assets` and `baselines[]`.

Panel: stable `id`, `name`, dimensions `w/h/thickness` in mm, `shape` (`rect/rounded/circle/imported`), `radius`, optional polygon `outline`, material/process/color, available `depth`, minimum `edge`, origin (`top-left/center/bottom-left`), `components[]`, `artwork[]` and per-layer `visible/locked/export` booleans.

Component: stable `id`, editable unique `ref`, `x/y/rotation` (mm/mm/degrees), embedded `definition`, label/text-size/offset/layer, color, lock/group, initial value and display text.

Definition: ID/name/prefix, behavior kind, `front/rear/access` shape, `openings[]`, depth/bend/mounting-thickness limits, terminals `{id,name,role,voltage,required}`, verification source/date/status, notes and optional photo asset key. Shapes use mm. Circle: `{type:"circle", x, y, d}`. Rectangle/slot: `{type:"rect", x, y, w, h, r}` with centre-based x/y. Polygon: `{type:"polygon", points:[{x,y},...]}`. Supported normalized paths contain M/L/Q/C/Z commands; raw SVG paths are sanitized and normalized from M/L/H/V/C/S/Q/T/A/Z plus affine transforms. A component's `(x,y)` is the origin for all relative geometry. Do not infer a physical mounting datum from a part's visual bounding box.

Connection: ID, `component` ID, `terminal` ID, controller `pin` ID, signal, bus identifier, pullup, activeLow, driver/interface note and notes. One record per component terminal. Intentional shared buses must use matching role and nonempty bus ID. Power and ground may share without a bus ID. Unknown pin/capability/voltage relationships produce findings.

Controller: name/source/date and pins `{id,code,voltage,caps[]}`. `id` is a physical resource identity; aliases should use the same ID to preserve conflict detection. `code` is the Arduino identifier or integer token, not arbitrary source code. Capabilities: digitalIn, digitalOut, analogIn, pwm, SDA, SCL, MOSI, MISO, SCK, CS, TX, RX, power, ground, passive.

Rule: ID, source component ID, event (`press/release/change`), operation (`set/toggle/increment/map/clamp/show/enable/indicator`), variable name, numeric value/min/max, optional target component ID. Rules execute in array order once per explicit event, without recursive propagation. Runtime variables, trace and simulated values are not stored back into design state.

Artwork: stable ID, type, position, rotation, layer, color and type-specific dimensions/text. Imported vectors refer to an embedded normalized asset; raster artwork references a re-encoded PNG asset. Project assets deduplicate identical representations by content identity with a collision check. All required assets travel in JSON.

Baseline: ID, name, date and a full project `snapshot` whose baseline list is empty. Nested baselines are rejected. Export history is in a separate IndexedDB store and never participates in design fingerprints.

Schema 1 migration supplies assets, acknowledgments, panel origin and definition cable bend defaults, then validates as schema 3. Future schemas are rejected. Schema 1 is an internal foundation-era format, not a compatibility claim with another app.

## Legacy component library v1

`{format:"interfacebench-library", version:1, parts:[definition,...]}`. Imports create new local identities and never modify project-embedded definitions. Version1 imports receive new family identities. Current saves and exports use version2 below.

## Wiring CSV v1

The first line identifies the format: `# INTERFACEBENCH wiring CSV v1`. Skip this line when using a generic CSV reader. Columns: panel, reference, terminal, role, voltage, signal, pin, bus, pullup, active, driver, notes, revision. Values are quoted and quotes doubled. Spreadsheet formula prefixes are escaped with an apostrophe. The HTML pin map is a readable printable derivative.

## Fabrication manifest v1

`format:"interfacebench-fabrication"`, version, appVersion, project schema, project/revision, creation time, explicit front orientation, output options, panels and files. Each file record contains a name, byte count and SHA-256 when Web Crypto is available. The manifest does not hash itself. Project JSON and all derivatives are made from one cloned snapshot. The camera, selection, theme and export-history records are excluded from design provenance.

This is a documented INTERFACEBENCH format. External-app interchange adapters require separate schema inspection and round-trip tests.

## v1.3 additions

Project schema3 upgrades schema2 without discarding its fields; schema1 first migrates to2. Old schema2 readers reject3 instead of silently ignoring new legend behavior. Optional rotary/linear fields: `labelMode`, `labelMin/Max`, `labelDecimals`, `labelEvery`, `majorEvery`, `legendSize/Gap`, `majorLength/minorLength`, `labelPrefix/Suffix`, and `customLabels[]` (one entry per tick).

Library version2 uses `{format:"interfacebench-library",version:2,parts:[...]}`. Definitions carry `libraryId`, integer `libraryRevision`, `revisionDate`, `revisionNote`; `(libraryId,libraryRevision)` pairs are immutable. Imports deduplicate identical revisions and atomically reject conflicting ones. Legacy version1 imports receive independent new family IDs. Placed instances never update silently. Terminal roles and voltages must match before assignments survive a replacement.

`manufacturer`, `partNumber`, `sourceChecked` and `provenance` distinguish transcribed facts from planning assumptions. `verified` remains a separate physical-verification declaration. Companion JSON contracts and return metadata are documented in INTERCHANGE.md.

Version2 library definitions may include `photoAsset` (embedded PNG/JPEG). Placement copies it into the new project asset map. Legacy saved library entries gain family/revision defaults at export.

## Optional v1.4 definition metadata (schema remains 3)

`category` is a string up to 100 characters; known built-in categories drive browsing, and older/unknown categories fall back by behavior kind. `tags` is an array of up to 40 strings, each up to 100 characters. `visual` is `standard` or `outline`, used only for presentation. Existing behavior kinds are unchanged. These fields travel in embedded project definitions and reusable library revisions. Missing metadata remains valid. `favoriteParts` is a list of catalog IDs in workspace preferences, not part of project design or wiring fingerprints.

## Component label sides (v1.4.2; schema remains 3)

A component instance may contain `labelSides: {front: boolean, rear: boolean}`. Missing flags default to front true and rear false. Exactly these two flags control which face receives that component's label. They participate in artwork fingerprints and baseline comparisons, but not cut-geometry or wiring fingerprints. They survive duplication, undo, JSON and frozen ZIP operations.

v1.4.1 panel masters are migrated once: AND each master with the corresponding component flag using the old missing=true semantics, then remove the panel `labelSides` object. This preserves effective user choices without leaving a hidden master switch. Malformed values reject before migration. Files predating side flags keep front labels only.

`scene`, `svgExport`, `pdfExport` and `pngExport` take `side: 'front' | 'rear'`. Front exports retain existing cut geometry/artwork. Rear exports contain only enabled component label paths on their declared fabrication layer. Layer inclusion still applies. Physical label anchors are reflected about the panel's vertical centreline, glyphs remain readable, and label rotation is negated. The selected panel origin is retained in SVG. Rear output assumes the rear face is up; it does not add component bodies, holes, reference numbers or front artwork. PDF adds its usual header/calibration outside the panel area and suppresses internal crosshairs for rear output.

The fabrication ZIP always generates front output and generates rear-label output when at least one included rear label exists. Format selections apply to both faces. Filenames identify `-front`, `-front-artwork` or `-rear-labels`. Manifest file records have an optional `side` field, and panel records retain each component reference and its label sides. Front/rear files share one immutable project snapshot. Use v1.4.2+ to honor this fabrication behavior.
