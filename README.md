# Lui Sir’s ICT Game Lab

Short, interactive ICT simulations designed for classroom demonstration and independent replay. The games require no account and collect no student data.

## Play

**Website:** <https://aaronlui13.github.io/LUISIR-ict-game-lab/>

### Mission 01 — Mars IoT Rescue

Students repair a Mars base by connecting sensors to suitable actuators and setting safe automation thresholds. Three escalating missions make this data flow visible:

`Sensor → Network → Processing → Actuator`

- Traditional Chinese interface with English ICT vocabulary
- 6–8 minute session
- Guided first mission followed by independent challenges
- Local score, three-star rating, sound controls and instant retry
- Projector, tablet and phone layouts

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
