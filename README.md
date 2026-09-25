# Lui Sir’s ICT Game Lab

Short, interactive ICT simulations designed for classroom demonstration and independent replay. The games require no account and collect no student data.

## Play

**Website:** <https://aaronlui13.github.io/LUISIR-ict-game-lab/>

### Mission 01 — Mars IoT Rescue

Students repair a Mars base by connecting sensors to suitable actuators and setting safe automation thresholds. Five progressively harder missions make this data flow visible:

`Sensor → Network → Processing → Actuator`

- Traditional Chinese interface with English ICT vocabulary
- 8–10 minute session
- Guided first mission followed by independent challenges
- Local score, three-star rating, sound controls and instant retry
- Projector, tablet and phone layouts

### Mission 02 — 點亮第一顆 LED

A two-round Arduino Uno wiring simulation for Unit 01. Students connect an LED circuit, select the board and Windows COM port in an Arduino IDE 1.8.18 teaching interface, and upload HIGH then LOW. The second round accepts independently chosen breadboard holes and awards independent completion when no hints are used.

See [the wiring game design record](docs/UNO_WIRING.md) for implemented behaviour and simulation limits.

### Mission 03 — 三色燈實驗室

Unit 02 starts with skippable common-ground and single-LED lessons before practice/challenge selection. Students wire and test three LEDs, predict a new program, adjust timings, and repair a missing LOW instruction. Hints switch challenge runs to practice without losing progress.

See [the three-light design record](docs/THREE_LIGHT_LAB.md) for the workflow and simulation limits.

### Mission 04 — 讓電腦看見光

Unit 03 follows the LDR worksheet: build a voltage divider, set up Serial Monitor, collect three readings under each light condition, explain the evidence, and reconnect A0 independently. Uses illustrative raw ADC readings, with no hardware connection or student-data collection.

See [the sensor lab design record](docs/SENSOR_READINGS.md) for implemented behaviour and simulation limits.

## Development

Requires Node.js 22 or later.

```bash
npm install
npm run dev
npm test
```

The production build is a fully static site in `dist/client`. Every push to `main` runs the checks and publishes that folder through GitHub Pages.

See [Adding the next ICT game](docs/ADDING_A_GAME.md) for the reusable design and publishing workflow.

## Licence

[MIT](LICENSE) © 2026 Aaron Lui
