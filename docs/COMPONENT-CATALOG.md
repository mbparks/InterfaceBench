# Component catalog

INTERFACEBENCH 1.4.0-rc.1: **267 components in 14 categories**. Expanded from 12 to 267: 255 additional generic definitions.

265 generic planning templates and 2 manufacturer-sourced E-Switch definitions. Generic dimensions, terminal topology and panel limits are illustrative. They are not measured footprints or manufacturer ratings. Even sourced parts retain explicit clearance assumptions. Measure your selected hardware before fabrication.

## Find and reuse a part

Choose a category, search by name, terminal family, size or a tag (for example `USB type C`, `fader 100`, `MIDI`, or `M3 standoff 20`). Multiple search words must all match; words match from their start. Filter generic, sourced, custom or favorites. The first 24 matches appear; Show more adds 24. Search and filters survive placement and selection. Favorites are saved in workspace preferences when local storage is available.

Details shows front/rear/access sizes, every opening with its offset, thickness/depth allowances, terminals, provenance and rehearsal model before placement. Click a card to place immediately, or Place component in Details. Edit definition changes an embedded instance; Save to library creates a reusable revision. Category and comma-separated tags are editable.

## Interpretation

- Connector-family names (USB, IEC, D-sub, GX, etc.) identify planning use, not certified mating or mounting geometry. Rectangular apertures can approximate shaped or keyed cutouts; replace them with measured geometry before manufacturing.
- P1…Pn terminals are placeholders, not a verified pinout. Passive 0 V means unspecified; active 5 V terminals are example logic assumptions.
- Generic carriers do not claim compatibility with a particular board. Hole pitch must be measured or imported through COPPERBENCH.
- Buttons, toggles, pots, encoders and displays use existing interaction models. Complex sensors, connectors and modules provide geometry and wiring records only; no device protocol, circuit simulation or firmware driver is added.
- Physical component definitions embed in project JSON. Updating the catalog does not silently replace existing project geometry. Legacy schema 1–3 projects and library version 1–2 imports remain supported.

| Category | Components |
| --- | ---: |
| Pushbuttons | 23 |
| Switches & selectors | 23 |
| Knobs & rotary controls | 17 |
| Faders & joysticks | 12 |
| Indicators & sound | 18 |
| Displays & meters | 21 |
| Audio & coax connectors | 19 |
| Data & multipin connectors | 35 |
| Power & protection | 16 |
| Sensors & apertures | 14 |
| Cable entry & routing | 16 |
| Fasteners & mounting | 26 |
| Fans & ventilation | 15 |
| Board & module carriers | 12 |

## Pushbuttons

| Part | Source | Front mm | Cutouts mm | Terminals | ID |
| --- | --- | --- | --- | ---: | --- |
| Momentary button | Generic | Ø18 | Ø12 mm | 2 | `button` |
| Stop button | Generic | Ø24 | Ø16 mm | 2 | `stop` |
| E-Switch PV6F240SS-341 | Sourced | Ø18 | Ø16 mm | 4 | `eswitch-pv6f240ss-341` |
| E-Switch PV7F2Y0SS-335 | Sourced | Ø25 | Ø22 mm | 6 | `eswitch-pv7f2y0ss-335` |
| Momentary pushbutton · 6 mm | Generic | Ø9 | Ø6 mm | 2 | `gen-momentary-pushbutton-6-mm` |
| Momentary pushbutton · 8 mm | Generic | Ø11 | Ø8 mm | 2 | `gen-momentary-pushbutton-8-mm` |
| Momentary pushbutton · 10 mm | Generic | Ø14 | Ø10 mm | 2 | `gen-momentary-pushbutton-10-mm` |
| Momentary pushbutton · 12 mm | Generic | Ø16 | Ø12 mm | 2 | `gen-momentary-pushbutton-12-mm` |
| Momentary pushbutton · 16 mm | Generic | Ø20 | Ø16 mm | 2 | `gen-momentary-pushbutton-16-mm` |
| Momentary pushbutton · 19 mm | Generic | Ø23 | Ø19 mm | 2 | `gen-momentary-pushbutton-19-mm` |
| Momentary pushbutton · 22 mm | Generic | Ø29 | Ø22 mm | 2 | `gen-momentary-pushbutton-22-mm` |
| Momentary pushbutton · 30 mm | Generic | Ø38 | Ø30 mm | 2 | `gen-momentary-pushbutton-30-mm` |
| Illuminated pushbutton · 12 mm | Generic | Ø17 | Ø12 mm | 4 | `gen-illuminated-pushbutton-12-mm` |
| Illuminated pushbutton · 16 mm | Generic | Ø21 | Ø16 mm | 4 | `gen-illuminated-pushbutton-16-mm` |
| Illuminated pushbutton · 19 mm | Generic | Ø24 | Ø19 mm | 4 | `gen-illuminated-pushbutton-19-mm` |
| Illuminated pushbutton · 22 mm | Generic | Ø27 | Ø22 mm | 4 | `gen-illuminated-pushbutton-22-mm` |
| Latching pushbutton · 12 mm | Generic | Ø18 | Ø12 mm | 2 | `gen-latching-pushbutton-12-mm` |
| Latching pushbutton · 16 mm | Generic | Ø22 | Ø16 mm | 2 | `gen-latching-pushbutton-16-mm` |
| Latching pushbutton · 22 mm | Generic | Ø28 | Ø22 mm | 2 | `gen-latching-pushbutton-22-mm` |
| Mushroom pushbutton | Generic | Ø40 | Ø22 mm | 2 | `gen-mushroom-pushbutton` |
| Mushroom twist-release | Generic | Ø40 | Ø22 mm | 4 | `gen-mushroom-twist-release` |
| Guarded pushbutton | Generic | Ø32 | Ø16 mm | 2 | `gen-guarded-pushbutton` |
| Square pushbutton | Generic | 18 × 18 | Ø12 mm | 2 | `gen-square-pushbutton` |

## Switches & selectors

| Part | Source | Front mm | Cutouts mm | Terminals | ID |
| --- | --- | --- | --- | ---: | --- |
| Toggle switch | Generic | Ø13 | Ø6 mm | 2 | `toggle` |
| Mini toggle SPST | Generic | 12 × 18 | Ø6 mm | 2 | `gen-mini-toggle-spst` |
| Mini toggle SPDT | Generic | 12 × 18 | Ø6 mm | 3 | `gen-mini-toggle-spdt` |
| Mini toggle DPDT | Generic | 14 × 21 | Ø6 mm | 6 | `gen-mini-toggle-dpdt` |
| Heavy toggle SPST | Generic | 19 × 30 | Ø12 mm | 2 | `gen-heavy-toggle-spst` |
| Heavy toggle SPDT | Generic | 19 × 30 | Ø12 mm | 3 | `gen-heavy-toggle-spdt` |
| Heavy toggle DPDT | Generic | 21 × 32 | Ø12 mm | 6 | `gen-heavy-toggle-dpdt` |
| Toggle DPDT centre-off | Generic | 21 × 32 | Ø12 mm | 6 | `gen-toggle-dpdt-centre-off` |
| Guarded toggle switch | Generic | 27 × 40 | Ø12 mm | 3 | `gen-guarded-toggle-switch` |
| Mini rocker SPST | Generic | 15 × 21 R2 | 12 × 18 R1 mm | 2 | `gen-mini-rocker-spst` |
| Rocker SPDT | Generic | 17 × 24 R2 | 13 × 19 R1 mm | 3 | `gen-rocker-spdt` |
| Rocker DPST | Generic | 24 × 31 R2 | 19 × 27 R1 mm | 4 | `gen-rocker-dpst` |
| Illuminated rocker | Generic | 24 × 31 R2 | 19 × 27 R1 mm | 3 | `gen-illuminated-rocker` |
| Rocker centre-off DPDT | Generic | 24 × 31 R2 | 19 × 27 R1 mm | 6 | `gen-rocker-centre-off-dpdt` |
| Slide switch SPDT | Generic | 21 × 10 R2 | 12 × 4 R1 mm | 3 | `gen-slide-switch-spdt` |
| Slide switch DPDT | Generic | 27 × 13 R2 | 15 × 5 R1 mm | 6 | `gen-slide-switch-dpdt` |
| Key switch 2-position | Generic | Ø26 | Ø12 mm | 2 | `gen-key-switch-2-position` |
| Key switch 3-position | Generic | Ø33 | Ø19 mm | 3 | `gen-key-switch-3-position` |
| Selector 2-position | Generic | Ø36 | Ø22 mm | 3 | `gen-selector-2-position` |
| Selector 3-position | Generic | Ø36 | Ø22 mm | 4 | `gen-selector-3-position` |
| Rotary switch 1-pole 6-way | Generic | Ø24 | Ø10 mm | 7 | `gen-rotary-switch-1-pole-6-way` |
| Rotary switch 2-pole 6-way | Generic | Ø24 | Ø10 mm | 14 | `gen-rotary-switch-2-pole-6-way` |
| Rotary switch 1-pole 12-way | Generic | Ø24 | Ø10 mm | 13 | `gen-rotary-switch-1-pole-12-way` |

## Knobs & rotary controls

| Part | Source | Front mm | Cutouts mm | Terminals | ID |
| --- | --- | --- | --- | ---: | --- |
| Rotary encoder | Generic | Ø22 | Ø7 mm | 3 | `encoder` |
| Potentiometer | Generic | Ø27 | Ø7 mm | 3 | `pot` |
| Potentiometer knob · 12 mm | Generic | Ø12 | Ø7 mm | 3 | `gen-potentiometer-knob-12-mm` |
| Potentiometer knob · 16 mm | Generic | Ø16 | Ø7 mm | 3 | `gen-potentiometer-knob-16-mm` |
| Potentiometer knob · 20 mm | Generic | Ø20 | Ø7 mm | 3 | `gen-potentiometer-knob-20-mm` |
| Potentiometer knob · 25 mm | Generic | Ø25 | Ø7 mm | 3 | `gen-potentiometer-knob-25-mm` |
| Potentiometer knob · 30 mm | Generic | Ø30 | Ø7 mm | 3 | `gen-potentiometer-knob-30-mm` |
| Potentiometer knob · 40 mm | Generic | Ø40 | Ø7 mm | 3 | `gen-potentiometer-knob-40-mm` |
| Dual-gang potentiometer | Generic | Ø36 | Ø7 mm | 6 | `gen-dual-gang-potentiometer` |
| Potentiometer with switch | Generic | Ø36 | Ø7 mm | 5 | `gen-potentiometer-with-switch` |
| Multi-turn potentiometer | Generic | Ø36 | Ø10 mm | 3 | `gen-multi-turn-potentiometer` |
| Precision vernier dial | Generic | Ø36 | Ø10 mm | 3 | `gen-precision-vernier-dial` |
| Push rotary encoder · 15 mm | Generic | Ø15 | Ø7 mm | 4 | `gen-push-rotary-encoder-15-mm` |
| Push rotary encoder · 20 mm | Generic | Ø20 | Ø7 mm | 4 | `gen-push-rotary-encoder-20-mm` |
| Push rotary encoder · 30 mm | Generic | Ø30 | Ø7 mm | 4 | `gen-push-rotary-encoder-30-mm` |
| Push rotary encoder · 40 mm | Generic | Ø40 | Ø7 mm | 4 | `gen-push-rotary-encoder-40-mm` |
| Large handwheel encoder | Generic | Ø60 | Ø10 mm | 6 | `gen-large-handwheel-encoder` |

## Faders & joysticks

| Part | Source | Front mm | Cutouts mm | Terminals | ID |
| --- | --- | --- | --- | ---: | --- |
| Slide potentiometer · 20 mm travel | Generic | 18 × 40 | 1 × 3 × 24 R1.5 + 2 × Ø3.2 mm | 3 | `gen-slide-potentiometer-20-mm-travel` |
| Slide potentiometer · 30 mm travel | Generic | 18 × 50 | 1 × 3 × 34 R1.5 + 2 × Ø3.2 mm | 3 | `gen-slide-potentiometer-30-mm-travel` |
| Slide potentiometer · 45 mm travel | Generic | 18 × 65 | 1 × 3 × 49 R1.5 + 2 × Ø3.2 mm | 3 | `gen-slide-potentiometer-45-mm-travel` |
| Slide potentiometer · 60 mm travel | Generic | 18 × 80 | 1 × 3 × 64 R1.5 + 2 × Ø3.2 mm | 3 | `gen-slide-potentiometer-60-mm-travel` |
| Slide potentiometer · 100 mm travel | Generic | 18 × 120 | 1 × 3 × 104 R1.5 + 2 × Ø3.2 mm | 3 | `gen-slide-potentiometer-100-mm-travel` |
| Motorized fader · 60 mm travel | Generic | 20 × 90 | 1 × 4 × 64 R2 + 2 × Ø3.2 mm | 8 | `gen-motorized-fader-60-mm-travel` |
| Motorized fader · 100 mm travel | Generic | 20 × 130 | 1 × 4 × 104 R2 + 2 × Ø3.2 mm | 8 | `gen-motorized-fader-100-mm-travel` |
| Mini joystick | Generic | 28 × 28 R3 | 1 × Ø18 + 4 × Ø3.2 mm | 5 | `gen-mini-joystick` |
| Thumb joystick with push | Generic | 35 × 35 R3 | 1 × Ø22 + 4 × Ø3.2 mm | 7 | `gen-thumb-joystick-with-push` |
| Two-axis panel joystick | Generic | 50 × 50 R3 | 1 × Ø30 + 4 × Ø3.2 mm | 5 | `gen-two-axis-panel-joystick` |
| Arcade joystick | Generic | 65 × 65 R3 | 1 × Ø24 + 4 × Ø3.2 mm | 8 | `gen-arcade-joystick` |
| Navigation thumbwheel | Generic | 32 × 20 R3 | 1 × Ø12 + 4 × Ø3.2 mm | 3 | `gen-navigation-thumbwheel` |

## Indicators & sound

| Part | Source | Front mm | Cutouts mm | Terminals | ID |
| --- | --- | --- | --- | ---: | --- |
| Panel indicator | Generic | Ø9 | Ø8 mm | 2 | `led` |
| LED indicator · 3 mm | Generic | Ø6 | Ø3 mm | 2 | `gen-led-indicator-3-mm` |
| LED indicator · 5 mm | Generic | Ø8 | Ø5 mm | 2 | `gen-led-indicator-5-mm` |
| LED indicator · 6 mm | Generic | Ø9 | Ø6 mm | 2 | `gen-led-indicator-6-mm` |
| LED indicator · 8 mm | Generic | Ø11 | Ø8 mm | 2 | `gen-led-indicator-8-mm` |
| LED indicator · 10 mm | Generic | Ø13 | Ø10 mm | 2 | `gen-led-indicator-10-mm` |
| LED indicator · 12 mm | Generic | Ø15 | Ø12 mm | 2 | `gen-led-indicator-12-mm` |
| LED indicator · 16 mm | Generic | Ø19 | Ø16 mm | 2 | `gen-led-indicator-16-mm` |
| LED indicator · 22 mm | Generic | Ø25 | Ø22 mm | 2 | `gen-led-indicator-22-mm` |
| RGB indicator · 10 mm | Generic | Ø14 | Ø10 mm | 4 | `gen-rgb-indicator-10-mm` |
| Dual-color indicator · 8 mm | Generic | Ø11 | Ø8 mm | 3 | `gen-dual-color-indicator-8-mm` |
| Panel buzzer · 16 mm | Generic | Ø23 | Ø16 mm | 2 | `gen-panel-buzzer-16-mm` |
| Panel buzzer · 22 mm | Generic | Ø29 | Ø22 mm | 2 | `gen-panel-buzzer-22-mm` |
| Panel buzzer · 30 mm | Generic | Ø37 | Ø30 mm | 2 | `gen-panel-buzzer-30-mm` |
| Speaker grille · 28 mm | Generic | Ø38 | 1 × Ø28 + 4 × Ø3.2 mm | 2 | `gen-speaker-grille-28-mm` |
| Speaker grille · 40 mm | Generic | Ø50 | 1 × Ø40 + 4 × Ø3.2 mm | 2 | `gen-speaker-grille-40-mm` |
| Speaker grille · 57 mm | Generic | Ø67 | 1 × Ø57 + 4 × Ø3.2 mm | 2 | `gen-speaker-grille-57-mm` |
| Stack-light base · 22 mm | Generic | Ø40 | Ø22 mm | 5 | `gen-stack-light-base-22-mm` |

## Displays & meters

| Part | Source | Front mm | Cutouts mm | Terminals | ID |
| --- | --- | --- | --- | ---: | --- |
| I²C display | Generic | 51 × 24 R2 | 46 × 18 mm | 4 | `display` |
| Small OLED window | Generic | 32 × 20 R2 | 26 × 14 R1 mm | 4 | `gen-small-oled-window` |
| Wide OLED window | Generic | 44 × 23 R2 | 36 × 15 R1 mm | 4 | `gen-wide-oled-window` |
| OLED module bezel | Generic | 40 × 32 R2 | 30 × 22 R1 mm | 7 | `gen-oled-module-bezel` |
| LCD 8 × 2 bezel | Generic | 58 × 32 R2 | 40 × 16 R1 mm | 16 | `gen-lcd-8-2-bezel` |
| LCD 16 × 2 bezel | Generic | 85 × 40 R2 | 65 × 17 R1 mm | 16 | `gen-lcd-16-2-bezel` |
| LCD 20 × 4 bezel | Generic | 102 × 66 R2 | 78 × 28 R1 mm | 16 | `gen-lcd-20-4-bezel` |
| Graphic LCD 128 × 64 bezel | Generic | 98 × 70 R2 | 72 × 40 R1 mm | 20 | `gen-graphic-lcd-128-64-bezel` |
| TFT small portrait bezel | Generic | 40 × 52 R2 | 30 × 40 R1 mm | 10 | `gen-tft-small-portrait-bezel` |
| TFT square bezel | Generic | 48 × 48 R2 | 38 × 38 R1 mm | 10 | `gen-tft-square-bezel` |
| TFT medium portrait bezel | Generic | 58 × 78 R2 | 46 × 62 R1 mm | 14 | `gen-tft-medium-portrait-bezel` |
| TFT landscape bezel | Generic | 110 × 73 R2 | 98 × 58 R1 mm | 14 | `gen-tft-landscape-bezel` |
| Touchscreen wide bezel | Generic | 166 × 108 R2 | 154 × 86 R1 mm | 14 | `gen-touchscreen-wide-bezel` |
| Seven-segment single digit | Generic | 20 × 28 R2 | 14 × 20 R1 mm | 10 | `gen-seven-segment-single-digit` |
| Seven-segment four digits | Generic | 56 × 27 R2 | 48 × 19 R1 mm | 12 | `gen-seven-segment-four-digits` |
| LED bargraph window | Generic | 38 × 16 R2 | 28 × 8 R1 mm | 12 | `gen-led-bargraph-window` |
| Digital panel voltmeter | Generic | 48 × 29 R2 | 45 × 26 R1 mm | 3 | `gen-digital-panel-voltmeter` |
| Digital panel ammeter | Generic | 48 × 29 R2 | 45 × 26 R1 mm | 5 | `gen-digital-panel-ammeter` |
| Analog meter bezel | Generic | 65 × 56 R2 | 50 × 40 R1 mm | 2 | `gen-analog-meter-bezel` |
| Round display bezel · 40 mm | Generic | Ø48 | Ø40 mm | 8 | `gen-round-display-bezel-40-mm` |
| Round analog gauge · 52 mm | Generic | Ø60 | Ø52 mm | 2 | `gen-round-analog-gauge-52-mm` |

## Audio & coax connectors

| Part | Source | Front mm | Cutouts mm | Terminals | ID |
| --- | --- | --- | --- | ---: | --- |
| 3.5 mm TS audio jack | Generic | Ø10 | Ø6 mm | 2 | `gen-3-5-mm-ts-audio-jack` |
| 3.5 mm TRS audio jack | Generic | Ø10 | Ø6 mm | 3 | `gen-3-5-mm-trs-audio-jack` |
| 3.5 mm TRRS audio jack | Generic | Ø10 | Ø6 mm | 4 | `gen-3-5-mm-trrs-audio-jack` |
| 6.35 mm TS audio jack | Generic | Ø16 | Ø10 mm | 2 | `gen-6-35-mm-ts-audio-jack` |
| 6.35 mm TRS audio jack | Generic | Ø16 | Ø10 mm | 3 | `gen-6-35-mm-trs-audio-jack` |
| RCA phono socket | Generic | Ø12 | Ø8 mm | 2 | `gen-rca-phono-socket` |
| BNC bulkhead | Generic | Ø18 | Ø12 mm | 2 | `gen-bnc-bulkhead` |
| SMA bulkhead | Generic | Ø10 | Ø6.5 mm | 2 | `gen-sma-bulkhead` |
| TNC bulkhead | Generic | Ø20 | Ø14 mm | 2 | `gen-tnc-bulkhead` |
| F-type bulkhead | Generic | Ø14 | Ø9.5 mm | 2 | `gen-f-type-bulkhead` |
| Banana socket 4 mm | Generic | Ø12 | Ø8 mm | 1 | `gen-banana-socket-4-mm` |
| Banana socket 2 mm | Generic | Ø8 | Ø5 mm | 1 | `gen-banana-socket-2-mm` |
| Insulated binding post | Generic | Ø16 | Ø8 mm | 1 | `gen-insulated-binding-post` |
| DIN audio 5-pin | Generic | Ø20 | Ø16 mm | 5 | `gen-din-audio-5-pin` |
| Mini-DIN 6-pin | Generic | Ø14 | Ø10 mm | 6 | `gen-mini-din-6-pin` |
| XLR 3-pin flange | Generic | 31 × 36 R2 | 1 × Ø24 + 2 × Ø3.2 mm | 3 | `gen-xlr-3-pin-flange` |
| XLR 4-pin flange | Generic | 31 × 36 R2 | 1 × Ø24 + 2 × Ø3.2 mm | 4 | `gen-xlr-4-pin-flange` |
| XLR 5-pin flange | Generic | 31 × 36 R2 | 1 × Ø24 + 2 × Ø3.2 mm | 5 | `gen-xlr-5-pin-flange` |
| SpeakON-style flange | Generic | 31 × 36 R2 | 1 × Ø24 + 2 × Ø3.2 mm | 4 | `gen-speakon-style-flange` |

## Data & multipin connectors

| Part | Source | Front mm | Cutouts mm | Terminals | ID |
| --- | --- | --- | --- | ---: | --- |
| Panel connector | Generic | Ø20 | Ø16 mm | 3 | `connector` |
| Rectangular connector | Generic | 18 × 11 R2 | 13 × 7 R1 mm | 2 | `usb` |
| USB-A panel coupler | Generic | 35 × 16 R2 | 1 × 15 × 8 R1 + 2 × Ø3.2 mm | 4 | `gen-usb-a-panel-coupler` |
| USB-B panel coupler | Generic | 36 × 22 R2 | 1 × 13 × 13 R1 + 2 × Ø3.2 mm | 4 | `gen-usb-b-panel-coupler` |
| USB-C panel coupler | Generic | 30 × 16 R2 | 1 × 10 × 5 R1 + 2 × Ø3.2 mm | 24 | `gen-usb-c-panel-coupler` |
| Micro-USB panel coupler | Generic | 27 × 14 R2 | 1 × 8 × 4 R1 + 2 × Ø3.2 mm | 5 | `gen-micro-usb-panel-coupler` |
| RJ45 panel coupler | Generic | 40 × 25 R2 | 1 × 17 × 16 R1 + 2 × Ø3.2 mm | 8 | `gen-rj45-panel-coupler` |
| RJ11 panel coupler | Generic | 34 × 23 R2 | 1 × 13 × 14 R1 + 2 × Ø3.2 mm | 6 | `gen-rj11-panel-coupler` |
| HDMI panel coupler | Generic | 40 × 18 R2 | 1 × 16 × 7 R1 + 2 × Ø3.2 mm | 19 | `gen-hdmi-panel-coupler` |
| DisplayPort panel coupler | Generic | 42 × 19 R2 | 1 × 17 × 7 R1 + 2 × Ø3.2 mm | 20 | `gen-displayport-panel-coupler` |
| D-sub 9-pin flange | Generic | 34 × 18 R2 | 1 × 20 × 10 R1 + 2 × Ø3.2 mm | 9 | `gen-d-sub-9-pin-flange` |
| D-sub 15-pin flange | Generic | 42 × 18 R2 | 1 × 28 × 10 R1 + 2 × Ø3.2 mm | 15 | `gen-d-sub-15-pin-flange` |
| High-density D-sub 15-pin | Generic | 34 × 18 R2 | 1 × 20 × 10 R1 + 2 × Ø3.2 mm | 15 | `gen-high-density-d-sub-15-pin` |
| D-sub 25-pin flange | Generic | 59 × 18 R2 | 1 × 45 × 10 R1 + 2 × Ø3.2 mm | 25 | `gen-d-sub-25-pin-flange` |
| D-sub 37-pin flange | Generic | 76 × 18 R2 | 1 × 62 × 10 R1 + 2 × Ø3.2 mm | 37 | `gen-d-sub-37-pin-flange` |
| IDC ribbon bulkhead 10-pin | Generic | 34 × 16 R2 | 1 × 20 × 10 R1 + 2 × Ø3.2 mm | 10 | `gen-idc-ribbon-bulkhead-10-pin` |
| IDC ribbon bulkhead 20-pin | Generic | 47 × 16 R2 | 1 × 33 × 10 R1 + 2 × Ø3.2 mm | 20 | `gen-idc-ribbon-bulkhead-20-pin` |
| Circular multipin · 8 mm / 3 contacts | Generic | Ø14 | Ø8 mm | 3 | `gen-circular-multipin-8-mm-3-contacts` |
| Circular multipin · 8 mm / 4 contacts | Generic | Ø14 | Ø8 mm | 4 | `gen-circular-multipin-8-mm-4-contacts` |
| Circular multipin · 12 mm / 4 contacts | Generic | Ø18 | Ø12 mm | 4 | `gen-circular-multipin-12-mm-4-contacts` |
| Circular multipin · 12 mm / 5 contacts | Generic | Ø18 | Ø12 mm | 5 | `gen-circular-multipin-12-mm-5-contacts` |
| Circular multipin · 12 mm / 8 contacts | Generic | Ø18 | Ø12 mm | 8 | `gen-circular-multipin-12-mm-8-contacts` |
| Circular multipin · 16 mm / 2 contacts | Generic | Ø22 | Ø16 mm | 2 | `gen-circular-multipin-16-mm-2-contacts` |
| Circular multipin · 16 mm / 4 contacts | Generic | Ø22 | Ø16 mm | 4 | `gen-circular-multipin-16-mm-4-contacts` |
| Circular multipin · 16 mm / 6 contacts | Generic | Ø22 | Ø16 mm | 6 | `gen-circular-multipin-16-mm-6-contacts` |
| Circular multipin · 16 mm / 8 contacts | Generic | Ø22 | Ø16 mm | 8 | `gen-circular-multipin-16-mm-8-contacts` |
| Circular multipin · 20 mm / 4 contacts | Generic | Ø26 | Ø20 mm | 4 | `gen-circular-multipin-20-mm-4-contacts` |
| Circular multipin · 20 mm / 7 contacts | Generic | Ø26 | Ø20 mm | 7 | `gen-circular-multipin-20-mm-7-contacts` |
| Circular multipin · 20 mm / 12 contacts | Generic | Ø26 | Ø20 mm | 12 | `gen-circular-multipin-20-mm-12-contacts` |
| Pluggable terminal block · 2 ways | Generic | 18 × 16 R2 | 12 × 10 R1 mm | 2 | `gen-pluggable-terminal-block-2-ways` |
| Pluggable terminal block · 3 ways | Generic | 23 × 16 R2 | 17 × 10 R1 mm | 3 | `gen-pluggable-terminal-block-3-ways` |
| Pluggable terminal block · 4 ways | Generic | 28 × 16 R2 | 22 × 10 R1 mm | 4 | `gen-pluggable-terminal-block-4-ways` |
| Pluggable terminal block · 6 ways | Generic | 38 × 16 R2 | 32 × 10 R1 mm | 6 | `gen-pluggable-terminal-block-6-ways` |
| Pluggable terminal block · 8 ways | Generic | 48 × 16 R2 | 42 × 10 R1 mm | 8 | `gen-pluggable-terminal-block-8-ways` |
| Pluggable terminal block · 12 ways | Generic | 68 × 16 R2 | 62 × 10 R1 mm | 12 | `gen-pluggable-terminal-block-12-ways` |

## Power & protection

| Part | Source | Front mm | Cutouts mm | Terminals | ID |
| --- | --- | --- | --- | ---: | --- |
| DC barrel socket 2-terminal | Generic | Ø14 | Ø8 mm | 2 | `gen-dc-barrel-socket-2-terminal` |
| DC barrel socket switched | Generic | Ø14 | Ø8 mm | 3 | `gen-dc-barrel-socket-switched` |
| Panel fuse holder · 5 × 20 | Generic | Ø16 | Ø12 mm | 2 | `gen-panel-fuse-holder-5-20` |
| Panel fuse holder · 6 × 32 | Generic | Ø20 | Ø16 mm | 2 | `gen-panel-fuse-holder-6-32` |
| Reset circuit breaker · 10 mm | Generic | Ø16 | Ø10 mm | 2 | `gen-reset-circuit-breaker-10-mm` |
| Reset circuit breaker · 12 mm | Generic | Ø19 | Ø12 mm | 2 | `gen-reset-circuit-breaker-12-mm` |
| IEC C14-style inlet | Generic | 50 × 30 R2 | 28 × 20 R1 mm | 3 | `gen-iec-c14-style-inlet` |
| IEC C8-style inlet | Generic | 33 × 20 R2 | 22 × 12 R1 mm | 2 | `gen-iec-c8-style-inlet` |
| IEC C20-style inlet | Generic | 48 × 36 R2 | 34 × 27 R1 mm | 3 | `gen-iec-c20-style-inlet` |
| Fused inlet module | Generic | 54 × 58 R2 | 48 × 52 R1 mm | 5 | `gen-fused-inlet-module` |
| Switched inlet module | Generic | 58 × 50 R2 | 50 × 42 R1 mm | 5 | `gen-switched-inlet-module` |
| XT30-style panel connector | Generic | 25 × 16 R2 | 13 × 8 R1 mm | 2 | `gen-xt30-style-panel-connector` |
| XT60-style panel connector | Generic | 34 × 22 R2 | 18 × 11 R1 mm | 2 | `gen-xt60-style-panel-connector` |
| XT90-style panel connector | Generic | 42 × 27 R2 | 24 × 16 R1 mm | 2 | `gen-xt90-style-panel-connector` |
| Powerpole-style pair | Generic | 38 × 26 R2 | 30 × 18 R1 mm | 2 | `gen-powerpole-style-pair` |
| Two-pole power terminal | Generic | 28 × 22 R2 | 18 × 12 R1 mm | 2 | `gen-two-pole-power-terminal` |

## Sensors & apertures

| Part | Source | Front mm | Cutouts mm | Terminals | ID |
| --- | --- | --- | --- | ---: | --- |
| Capacitive touch electrode | Generic | Ø25 | Ø12 mm | 3 | `gen-capacitive-touch-electrode` |
| Piezo sensor disk mount | Generic | Ø35 | Ø27 mm | 2 | `gen-piezo-sensor-disk-mount` |
| Light sensor window | Generic | Ø16 | Ø10 mm | 3 | `gen-light-sensor-window` |
| Infrared receiver window | Generic | Ø16 | Ø8 mm | 3 | `gen-infrared-receiver-window` |
| PIR dome mount | Generic | Ø32 | Ø23 mm | 3 | `gen-pir-dome-mount` |
| Proximity sensor · 8 mm | Generic | Ø14 | Ø8 mm | 3 | `gen-proximity-sensor-8-mm` |
| Proximity sensor · 12 mm | Generic | Ø19 | Ø12 mm | 3 | `gen-proximity-sensor-12-mm` |
| Proximity sensor · 18 mm | Generic | Ø27 | Ø18 mm | 3 | `gen-proximity-sensor-18-mm` |
| Temperature probe gland | Generic | Ø16 | Ø10 mm | 2 | `gen-temperature-probe-gland` |
| Microphone capsule mount | Generic | Ø14 | Ø10 mm | 3 | `gen-microphone-capsule-mount` |
| Ultrasonic dual aperture | Generic | 48 × 26 | 2 × Ø16 + 4 × Ø2.2 mm | 4 | `gen-ultrasonic-dual-aperture` |
| Time-of-flight sensor window | Generic | 23 × 18 R2 | 12 × 6 R1 mm | 6 | `gen-time-of-flight-sensor-window` |
| Camera lens window | Generic | 32 × 32 R2 | 20 × 20 R1 mm | 8 | `gen-camera-lens-window` |
| Environmental sensor vent | Generic | 28 × 24 R2 | 18 × 12 R1 mm | 4 | `gen-environmental-sensor-vent` |

## Cable entry & routing

| Part | Source | Front mm | Cutouts mm | Terminals | ID |
| --- | --- | --- | --- | ---: | --- |
| Cable gland · 8 mm cutout | Generic | Ø18 | Ø8 mm | 0 | `gen-cable-gland-8-mm-cutout` |
| Cable gland · 12 mm cutout | Generic | Ø22 | Ø12 mm | 0 | `gen-cable-gland-12-mm-cutout` |
| Cable gland · 16 mm cutout | Generic | Ø26 | Ø16 mm | 0 | `gen-cable-gland-16-mm-cutout` |
| Cable gland · 20 mm cutout | Generic | Ø30 | Ø20 mm | 0 | `gen-cable-gland-20-mm-cutout` |
| Cable gland · 25 mm cutout | Generic | Ø35 | Ø25 mm | 0 | `gen-cable-gland-25-mm-cutout` |
| Cable gland · 32 mm cutout | Generic | Ø42 | Ø32 mm | 0 | `gen-cable-gland-32-mm-cutout` |
| Rubber grommet · 6 mm cutout | Generic | Ø12 | Ø6 mm | 0 | `gen-rubber-grommet-6-mm-cutout` |
| Rubber grommet · 8 mm cutout | Generic | Ø14 | Ø8 mm | 0 | `gen-rubber-grommet-8-mm-cutout` |
| Rubber grommet · 10 mm cutout | Generic | Ø16 | Ø10 mm | 0 | `gen-rubber-grommet-10-mm-cutout` |
| Rubber grommet · 12 mm cutout | Generic | Ø18 | Ø12 mm | 0 | `gen-rubber-grommet-12-mm-cutout` |
| Rubber grommet · 16 mm cutout | Generic | Ø22 | Ø16 mm | 0 | `gen-rubber-grommet-16-mm-cutout` |
| Rubber grommet · 20 mm cutout | Generic | Ø26 | Ø20 mm | 0 | `gen-rubber-grommet-20-mm-cutout` |
| Rubber grommet · 25 mm cutout | Generic | Ø31 | Ø25 mm | 0 | `gen-rubber-grommet-25-mm-cutout` |
| Rectangular cable pass-through | Generic | 40 × 20 R2 | 30 × 10 R1 mm | 0 | `gen-rectangular-cable-pass-through` |
| Brush cable entry | Generic | 80 × 28 R2 | 68 × 16 R1 mm | 0 | `gen-brush-cable-entry` |
| Cable tie saddle | Generic | 20 × 12 R2 | 4 × 3 R1 mm | 0 | `gen-cable-tie-saddle` |

## Fasteners & mounting

| Part | Source | Front mm | Cutouts mm | Terminals | ID |
| --- | --- | --- | --- | ---: | --- |
| Mounting hole | Generic | Ø7 | Ø3.2 mm | 0 | `mount` |
| M2 clearance hole | Generic | Ø7.2 | Ø2.2 mm | 0 | `gen-m2-clearance-hole` |
| M2.5 clearance hole | Generic | Ø7.7 | Ø2.7 mm | 0 | `gen-m2-5-clearance-hole` |
| M3 clearance hole | Generic | Ø8.2 | Ø3.2 mm | 0 | `gen-m3-clearance-hole` |
| M4 clearance hole | Generic | Ø9.3 | Ø4.3 mm | 0 | `gen-m4-clearance-hole` |
| M5 clearance hole | Generic | Ø10.3 | Ø5.3 mm | 0 | `gen-m5-clearance-hole` |
| M6 clearance hole | Generic | Ø11.4 | Ø6.4 mm | 0 | `gen-m6-clearance-hole` |
| M8 clearance hole | Generic | Ø13.4 | Ø8.4 mm | 0 | `gen-m8-clearance-hole` |
| M10 clearance hole | Generic | Ø15.5 | Ø10.5 mm | 0 | `gen-m10-clearance-hole` |
| #4 clearance hole | Generic | Ø8 | Ø3 mm | 0 | `gen-4-clearance-hole` |
| #6 clearance hole | Generic | Ø8.7 | Ø3.7 mm | 0 | `gen-6-clearance-hole` |
| #8 clearance hole | Generic | Ø9.4 | Ø4.4 mm | 0 | `gen-8-clearance-hole` |
| 1/4 inch clearance hole | Generic | Ø11.8 | Ø6.8 mm | 0 | `gen-1-4-inch-clearance-hole` |
| M3 standoff · 6 mm | Generic | Ø7 | Ø3.2 mm | 0 | `gen-m3-standoff-6-mm` |
| M3 standoff · 10 mm | Generic | Ø7 | Ø3.2 mm | 0 | `gen-m3-standoff-10-mm` |
| M3 standoff · 15 mm | Generic | Ø7 | Ø3.2 mm | 0 | `gen-m3-standoff-15-mm` |
| M3 standoff · 20 mm | Generic | Ø7 | Ø3.2 mm | 0 | `gen-m3-standoff-20-mm` |
| M3 standoff · 25 mm | Generic | Ø7 | Ø3.2 mm | 0 | `gen-m3-standoff-25-mm` |
| Two-hole bracket · 20 mm pitch | Generic | 30 × 12 | 2 × Ø3.2 mm | 0 | `gen-two-hole-bracket-20-mm-pitch` |
| Two-hole bracket · 40 mm pitch | Generic | 50 × 15 | 2 × Ø4.3 mm | 0 | `gen-two-hole-bracket-40-mm-pitch` |
| Handle · 80 mm pitch | Generic | 94 × 18 | 2 × Ø4.3 mm | 0 | `gen-handle-80-mm-pitch` |
| Handle · 120 mm pitch | Generic | 134 × 18 | 2 × Ø5.3 mm | 0 | `gen-handle-120-mm-pitch` |
| Adjustment slot · 10 × 3.2 mm | Generic | 16 × 9.2 | 10 × 3.2 R1.6 mm | 0 | `gen-adjustment-slot-10-3-2-mm` |
| Adjustment slot · 20 × 3.2 mm | Generic | 26 × 9.2 | 20 × 3.2 R1.6 mm | 0 | `gen-adjustment-slot-20-3-2-mm` |
| Adjustment slot · 15 × 4.3 mm | Generic | 21 × 10.3 | 15 × 4.3 R2.15 mm | 0 | `gen-adjustment-slot-15-4-3-mm` |
| Adjustment slot · 25 × 5.3 mm | Generic | 31 × 11.3 | 25 × 5.3 R2.65 mm | 0 | `gen-adjustment-slot-25-5-3-mm` |

## Fans & ventilation

| Part | Source | Front mm | Cutouts mm | Terminals | ID |
| --- | --- | --- | --- | ---: | --- |
| Fan opening · 25 mm | Generic | 25 × 25 | 1 × Ø20 + 4 × Ø3.5 mm | 2 | `gen-fan-opening-25-mm` |
| Fan opening · 30 mm | Generic | 30 × 30 | 1 × Ø25 + 4 × Ø3.5 mm | 2 | `gen-fan-opening-30-mm` |
| Fan opening · 40 mm | Generic | 40 × 40 | 1 × Ø34 + 4 × Ø3.5 mm | 2 | `gen-fan-opening-40-mm` |
| Fan opening · 50 mm | Generic | 50 × 50 | 1 × Ø43 + 4 × Ø3.5 mm | 2 | `gen-fan-opening-50-mm` |
| Fan opening · 60 mm | Generic | 60 × 60 | 1 × Ø52 + 4 × Ø3.5 mm | 2 | `gen-fan-opening-60-mm` |
| Fan opening · 80 mm | Generic | 80 × 80 | 1 × Ø70 + 4 × Ø3.5 mm | 2 | `gen-fan-opening-80-mm` |
| Fan opening · 92 mm | Generic | 92 × 92 | 1 × Ø82 + 4 × Ø3.5 mm | 2 | `gen-fan-opening-92-mm` |
| Fan opening · 120 mm | Generic | 120 × 120 | 1 × Ø108 + 4 × Ø3.5 mm | 2 | `gen-fan-opening-120-mm` |
| Slotted vent · 30 × 20 mm | Generic | 30 × 20 | 4 × 22 × 2 R1 mm | 0 | `gen-slotted-vent-30-20-mm` |
| Slotted vent · 50 × 30 mm | Generic | 50 × 30 | 6 × 42 × 2 R1 mm | 0 | `gen-slotted-vent-50-30-mm` |
| Slotted vent · 80 × 40 mm | Generic | 80 × 40 | 8 × 72 × 2 R1 mm | 0 | `gen-slotted-vent-80-40-mm` |
| Slotted vent · 100 × 50 mm | Generic | 100 × 50 | 10 × 92 × 2 R1 mm | 0 | `gen-slotted-vent-100-50-mm` |
| Perforated vent · 30 mm | Generic | 30 × 30 | 25 × Ø2.5 mm | 0 | `gen-perforated-vent-30-mm` |
| Perforated vent · 50 mm | Generic | 50 × 50 | 25 × Ø4.166666666666667 mm | 0 | `gen-perforated-vent-50-mm` |
| Perforated vent · 80 mm | Generic | 80 × 80 | 25 × Ø6.666666666666667 mm | 0 | `gen-perforated-vent-80-mm` |

## Board & module carriers

| Part | Source | Front mm | Cutouts mm | Terminals | ID |
| --- | --- | --- | --- | ---: | --- |
| Small square PCB carrier | Generic | 30 × 30 | 4 × Ø3.2 mm | 0 | `gen-small-square-pcb-carrier` |
| Medium square PCB carrier | Generic | 50 × 50 | 4 × Ø3.2 mm | 0 | `gen-medium-square-pcb-carrier` |
| Large square PCB carrier | Generic | 80 × 80 | 4 × Ø3.2 mm | 0 | `gen-large-square-pcb-carrier` |
| Narrow controller carrier | Generic | 55 × 25 | 4 × Ø3.2 mm | 0 | `gen-narrow-controller-carrier` |
| Medium controller carrier | Generic | 70 × 55 | 4 × Ø3.2 mm | 0 | `gen-medium-controller-carrier` |
| Large controller carrier | Generic | 100 × 70 | 4 × Ø3.2 mm | 0 | `gen-large-controller-carrier` |
| Relay module carrier | Generic | 50 × 30 | 4 × Ø3.2 mm | 0 | `gen-relay-module-carrier` |
| DC converter carrier | Generic | 48 × 28 | 4 × Ø3.2 mm | 0 | `gen-dc-converter-carrier` |
| Sensor breakout carrier | Generic | 25 × 20 | 4 × Ø3.2 mm | 0 | `gen-sensor-breakout-carrier` |
| Single-board computer carrier | Generic | 90 × 60 | 4 × Ø3.2 mm | 0 | `gen-single-board-computer-carrier` |
| Battery holder carrier | Generic | 65 × 40 | 4 × Ø3.2 mm | 0 | `gen-battery-holder-carrier` |
| DIN rail clip mount | Generic | 45 × 35 | 4 × Ø3.2 mm | 0 | `gen-din-rail-clip-mount` |
