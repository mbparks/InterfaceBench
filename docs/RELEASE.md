# INTERFACEBENCH 1.4.3-rc.1 — matching label appearance

Removed the pale fill and dark outline previously applied only to rear canvas labels. Front and rear labels now use identical plain text styling, including color and size. The two per-component fabrication checkboxes, saved data, mirrored physical placement and actual per-face fabrication outputs remain as in v1.4.2.

The actual renderer's front/rear label style attributes were compared, excluding position/rotation, and match exactly. All 64 existing automated tests pass. Browser interaction QA remains pending under the documented Sites workflow restriction.

Upload all files from the server ZIP and use Save & reload for the updated offline cache. Back up your project JSON before updating. No schema or project-data change is required.
