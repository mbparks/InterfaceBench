# Companion handoffs — v1.3

Open **Connect → App handoffs** or **Fabricate → App handoffs**. Review the conversion summary, then download or apply. Imports are undoable, autosaved through the normal project transaction, and never overwrite a source file.

| Companion | Tested release / schema | Supported direction | What crosses |
|---|---|---|---|
| PINNOTE | 2.0.0 / native schema 1 | Export + returned assignments | Component terminals, controller pins, assigned wires, signal names, notes and stable return bindings |
| REFLEX | 1.1.0-rc.1 / native schema 5 | Export + returned assignments | Input/output inventory and eligible UNO R3 pin assignments |
| COPPERBENCH | 1.7.1 / native schema 5 | Import | Board dimensions/outline, standalone and embedded non-plated mounting holes, reference body rectangles |

These adapters target the inspected releases, not every present or future version. Unknown schemas are rejected. Companion browser interaction was not tested here; their actual parsers were executed independently. `qa/companion-parsers.json` records source hashes and results.

## Export packages

Each handoff ZIP contains:

- `pinnote-project.json` or `reflex-project.json`: native file to open in that application.
- `conversion-report.json`: mapped counts and limitations.
- `interfacebench-source.json`: complete, editable original design backup.
- `README.txt`: opening and return instructions.

Native companion data carries an `interfacebench` provenance map. The full source backup is separate; geometry and rehearsal are not silently embedded as companion behavior. Preserve the original INTERFACEBENCH project for returned assignments. Importing its backup creates a separate project identity, as usual.

## PINNOTE contract

Every component with terminals becomes a documented connector; the controller becomes one connector. Each assigned component terminal becomes one two-ended physical wire record. Terminal identifiers are pin labels; display names and roles are recorded as functions. Internal native IDs are independent and mapped explicitly back to source IDs. Shared controller pins remain explicit shared endpoints. Signal names never create extra connections.

Wire length, gauge, termination methods, physical pin layout and viewing direction remain unspecified. Review actual splices and harness construction in PINNOTE. Unknown source pins are reported and omitted. Geometry, artwork, simulation and physical dimensions remain in the source backup.

Return import accepts only wires between a mapped terminal and mapped controller pin. Reversed from/to endpoints work. Signal/notes/pin changes return; source bus, driver, pull-up and active-low fields are retained. Deleted wires or intentionally open ends remove their mapped assignment, with the removal count shown before applying. Multiple wires on one component terminal or non-controller topology reject the import atomically: retain those richer harness structures in PINNOTE.

## REFLEX contract

Buttons/toggles become digital inputs; analog terminals become analog inputs; supported indicator terminals become LED outputs. Encoder A/B terminals become separate digital inputs, not decoded encoders. Unsupported component types and terminal roles are reported. Maximum inventory: 16 inputs and 16 outputs.

No event-driven INTERFACEBENCH rehearsal rule is translated into a continuous mapping, pose or motion sequence. Configure behavior in REFLEX. Active-low semantics require review. Power, ground, connectors and displays remain in the backup.

The inspected REFLEX supports UNO R3 and Mega 2560. This adapter creates an UNO R3 template: eligible existing UNO R3 assignments are retained up to its six-input/six-output runtime capacity. Its timer reservations exclude LED PWM D9/D10. Other source boards yield an explicitly unassigned template. Review the board before hardware use.

Returned assignments require the original UNO R3 declarations and channel types. Existing behavior, geometry and artwork remain unchanged. Removed assignments are shown in the review. New channels without a return binding reject the import when assigned.

## COPPERBENCH contract

Use **Save JSON / native backup**, not a CaseBench export or Gerber ZIP. Coordinates use the source native top view: X right, Y down, millimetres. Exporters inside COPPERBENCH may use other manufacturing origins; this adapter reads native geometry only.

A new panel is added as a mounting template. Duplicate references are reassigned without changing existing objects. Slot overall length equals the source centre travel (`slot`) plus drill diameter. Embedded platform mounting holes follow the source side reflection and rotation. Body rectangles and their reference labels go on the non-exported reference layer.

PCB nets, copper, pad drills, vias, board cutouts, artwork and simulation are not imported. Body envelopes are reference approximations. Material, thickness and rear clearance remain editable panel defaults; the source PCB thickness is recorded separately. Confirm enclosure mounting dimensions and hardware before fabrication.

## Reproducing native parser checks

The companion source files are not redistributed in this repository. Obtain the exact user-owned distributions and extract the inline modules as described by the filenames/hashes in `qa/companion-parsers.json`, then run:

```sh
node scripts/check-companion-formats.mjs /absolute/path/to/interop-sources
```

Expected inputs: `pinnote/src/core.js`, `reflex-0.js` through `reflex-3.js` (motion, stage, boards, core), and `copperbench-2.js` (canonical model). These checks verify file contracts, not browser UI or hardware.
