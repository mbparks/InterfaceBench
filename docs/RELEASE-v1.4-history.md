# Release report — INTERFACEBENCH 1.4.0-rc.1

2026-10-09 · GPL-3.0-only · Project schema 3 (imports 1–3) · Library version 2 (imports 1–2).

## Component expansion

**267 built-in parts in 14 categories, up from 12.** The 255 additions cover controls, indicators, readouts, audio/data connectors, power/protection, sensing apertures, cable management, fasteners, fans/vents and module carriers. All additions are explicitly generic planning templates. The catalog has 265 generic entries and the original 2 manufacturer-sourced E-Switch entries.

Browse by category, source or favorites; search names, tags and sizes; load matches 24 at a time; inspect all dimensions and opening offsets before placement. Search survives placement. Favorites persist in workspace preferences. Custom definitions have editable category/tags. Existing embedded project dimensions remain intact.

The static catalog in `CATALOG.html` and complete `docs/COMPONENT-CATALOG.md` inventory are generated from the shipped definitions. No network or new runtime dependency was added.

## Verification and limits

**57 automated tests pass.** All definitions validate, place, round-trip and export their cutouts. New generic patterns are checked for internal overlap and containment; complex patterns also pass PDF and ZIP generation. UI contracts cover filtering, favorites, details, placement, undo and pagination. See `docs/QA.md` and `qa/v14-test-results.txt`.

This is still a release candidate. The Sites skill requires skipping browser QA when supported browser control is unavailable and disallows a substitute browser path. Real-browser UI, storage and offline/update acceptance remain unverified. No host deployment, physical measurement or hardware validation is claimed.

Connector-family names identify intended planning use, not certified mounting/mating geometry. P-number terminals are placeholders and passive 0 V means unspecified. Generic carriers do not claim compatibility with named boards. Complex sensors/modules do not gain circuit simulation or drivers. Verify purchased hardware and replace approximated dimensions/cutouts before fabrication.

Earlier v1.1–v1.3 authoring, reusable revisions and companion handoffs remain included. Historical evidence is in `RELEASE-v1.3-history.md`.

## Install

Extract the complete server ZIP into the existing `/interfacebench/` route with `index.html` at its root. Upload every file and directory together. Make a project JSON backup before updating; use Save & reload when the app offers the new cache. The repository ZIP contains the identical distribution, source, tests and documentation.
