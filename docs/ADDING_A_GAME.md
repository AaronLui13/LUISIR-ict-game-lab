# Adding the next ICT game

This repository is designed as a growing collection rather than a one-off game.

## Repeatable workflow

1. **Choose one learning outcome.** Keep a game focused enough to explain in one sentence.
2. **Define the classroom moment.** Decide whether the teacher demonstrates it, students play in pairs, or both.
3. **Design one core loop.** Turn the ICT concept into a decision with visible consequences—not a disguised multiple-choice quiz.
4. **Create the route.** Add a folder at `app/games/<game-slug>/` with its page, interactive component, styles and pure game logic.
5. **Register the game.** Add one record to `app/game-catalog.ts`; the hub will list it automatically.
6. **Add checks.** Test success, failure and edge cases in `tests/`, then run `npm test`.
7. **Publish.** Push to `main`; the GitHub Pages workflow tests and deploys the whole lab automatically.

## Design checklist

- Works on a classroom projector first, then tablet and phone.
- Uses Traditional Chinese with important ICT terms in English.
- Starts without an account and stores only optional preferences or best scores on the device.
- Offers meaningful feedback after failure and an immediate retry.
- Supports keyboard focus, touch targets and reduced-motion preferences.
- Keeps each play session under ten minutes unless the lesson specifically needs longer.

## Suggested folder shape

```text
app/games/example-game/
├── page.tsx          # Route and page metadata
├── ExampleGame.tsx   # Interactive experience
├── game-data.mjs     # Rules that can be tested without the browser
└── game.css          # Route-specific presentation
```
