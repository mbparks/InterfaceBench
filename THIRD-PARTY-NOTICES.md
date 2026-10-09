# Third-party notices

Runtime dependencies are bundled locally; no CDN is used.

| Dependency | Version | License | Purpose |
|---|---:|---|---|
| pdf-lib | 1.17.1 | MIT | Vector PDF generation |
| JSZip | 3.10.1 | MIT (chosen from dual license) | Fabrication ZIP generation |
| opentype.js | 1.3.4 | MIT | Bundled font parsing and outlined vector text |
| DejaVu Sans | system-packaged DejaVu font | Bitstream Vera / DejaVu font license | Consistent interface and fabrication typography |

Full license texts are in licenses/. Distribution preserves the notices bundled by these dependencies. Their copyright remains with their respective authors. The application's authored code is GNU GPL v3 only; see LICENSE.

UNO R3 capability metadata source: https://docs.arduino.cc/resources/datasheets/A000066-datasheet.pdf and https://docs.arduino.cc/hardware/uno-rev3/ . Checked 2026-10-08. This is not an Arduino-endorsed product. No manufacturer physical component dimensions are supplied as verified data in the starter library.

Test-only tools used in the execution environment: Node.js, Poppler, PyMuPDF, Sharp/librsvg and g++. Playwright journeys are supplied but were not executed. None is required to serve or use the distributed app.
