/* INTERFACEBENCH 1.3.0-rc.1 — Kinetic-sculpture — revision A
 * Assignment scaffolding only. Rehearsal rules are not firmware.
 * Target: Arduino-UNO-R3. Requires Arduino core; no external libraries included.
 * 0 unresolved signal(s), 0 declared electrical conflict(s).
 * Check current limits, drivers, debounce and safety circuits before energizing hardware.
 */
#include <Arduino.h>

constexpr int PIN_DS1_SDA = A4;
// DS1_SDA: SDA bus signal. Add the appropriate device library and initialization.
constexpr int PIN_DS1_SCL = A5;
// DS1_SCL: SCL bus signal. Add the appropriate device library and initialization.
constexpr int PIN_SW1_SIG = 2;
constexpr int PIN_SW2_SIG = 3;
constexpr int PIN_RV1_WIPER = A0;
constexpr int PIN_SW3_SIG = 4;
constexpr int PIN_LED1_ANODE = 9;

void setup() {
  pinMode(PIN_SW1_SIG, INPUT_PULLUP);
  pinMode(PIN_SW2_SIG, INPUT_PULLUP);
  pinMode(PIN_RV1_WIPER, INPUT);
  pinMode(PIN_SW3_SIG, INPUT_PULLUP);
  pinMode(PIN_LED1_ANODE, OUTPUT);
  digitalWrite(PIN_LED1_ANODE, HIGH); // initial inactive level
}

void loop() {
  const int value_SW1_SIG = digitalRead(PIN_SW1_SIG); // active low
  const int value_SW2_SIG = digitalRead(PIN_SW2_SIG); // active low
  const int value_RV1_WIPER = analogRead(PIN_RV1_WIPER); // active low
  const int value_SW3_SIG = digitalRead(PIN_SW3_SIG); // active low
  // digitalWrite(PIN_LED1_ANODE, ...); // add application behavior
  delay(10);
}
