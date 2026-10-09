# Sourced declarations — checked 2026-10-09

Source URLs are documentation references, not runtime dependencies. The application does not fetch them automatically.

| Item | Primary source | Transcribed facts / limits |
|---|---|---|
| Arduino UNO R3 | https://docs.arduino.cc/resources/datasheets/A000066-datasheet.pdf | Existing primary header capability model; 5 V logic |
| Arduino UNO R4 Minima | https://docs.arduino.cc/resources/pinouts/ABX00080-full-pinout.pdf | Primary digital/analog/PWM/UART/SPI/I²C header identities; A4/A5 aliases share identity; 5 V. DAC/CAN/OPAMP omitted. R4 current limits differ from R3. |
| Arduino Nano Every | https://docs.arduino.cc/resources/pinouts/ABX00028-full-pinout.pdf | PWM D3/5/6/9/10, no PWM D11; A6/A7 also digital; 5 V |
| E-Switch PV6F240SS-341 | https://configured-product-images.s3.amazonaws.com/2D/specs/PV6F240SS-341.pdf | Drawing D (2025-04-08): 18 mm bezel, 16 +0.2/−0 mm cutout, panel 1–10 mm; blue LED 2.8 V / 20 mA |
| E-Switch PV7F2Y0SS-335 | https://configured-product-images.s3.amazonaws.com/2D/specs/PV7F2Y0SS-335.pdf | Drawing B (2026-01-08): 25 mm bezel, 22 +0.2/−0 mm cutout, max panel8 mm; contacts1–2 normally closed /3–4 normally open; 24 V green illumination |

Only the listed manufacturer facts are transcribed. Rear/access envelopes, cable allowance and conservative depths are separately labeled planning assumptions. The PV7 minimum panel thickness is also an assumption. Parts stay **unverified** until the user records physical verification. Contact terminals begin passive; assign their actual circuit roles explicitly. Illumination ratings are not direct GPIO drive instructions.

SVG affine semantics: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/transform . Arc conversion follows SVG endpoint-to-centre geometry and uses cubic segments of at most22.5°. Artwork is normalized to monochrome shapes; source CSS/paint effects are not reproduced.

Companion formats were inspected from PINNOTE-v2.0.0-github.zip, COPPERBENCH-v1.7.1.html and REFLEX-v1.1.0-rc.1.html supplied through the user's saved project artifacts. See INTERCHANGE.md and the recorded module hashes.

## v1.4 generic catalog expansion

The 255 additional definitions in `component-library.js` are authored illustrative planning geometry, not new sourced manufacturer footprints. They assert no measured dimensions, connector pinout, rating, board compatibility or protocol implementation. Family names and search tags aid discovery; inspect or measure the chosen hardware and replace approximated geometry before manufacturing. The existing two E-Switch drawing references above remain the only manufacturer-sourced component definitions.
