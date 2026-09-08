import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("exports the game hub and Mars mission as static pages", async () => {
  const [home, game] = await Promise.all([
    readFile(new URL("../dist/client/index.html", import.meta.url), "utf8"),
    readFile(new URL("../dist/client/games/mars-iot-rescue.html", import.meta.url), "utf8"),
  ]);
  assert.match(home, /Lui Sir’s ICT Game Lab/);
  assert.match(home, /Mars IoT Rescue/);
  assert.match(game, /MARS/);
  assert.match(game, /IoT/);
  assert.match(game, /START MISSION/);
  assert.doesNotMatch(home, /codex-preview|SkeletonPreview|Starter Project/);
  assert.doesNotMatch(game, /codex-preview|SkeletonPreview|Starter Project/);
  if (process.env.GITHUB_ACTIONS === "true") {
    assert.match(home, /\/LUISIR-ict-game-lab\/_next\/static/);
    assert.match(home, /\/LUISIR-ict-game-lab\/games\/mars-iot-rescue/);
    assert.match(game, /\/LUISIR-ict-game-lab\/og\.png/);
    await access(new URL("../dist/client/_next/", import.meta.url));
    await assert.rejects(access(new URL("../dist/client/LUISIR-ict-game-lab/_next/", import.meta.url)));
  }
});

 test("exports the Uno wiring game and hub entry", async () => {
 const home = await readFile(new URL("../dist/client/index.html", import.meta.url), "utf8");
 const game = await readFile(new URL("../dist/client/games/uno-wiring.html", import.meta.url), "utf8");
 assert.match(home, /games\/uno-wiring/);
 assert.match(game, /Arduino Uno/);
 assert.match(game, /先接 LED 長腳/);
 assert.match(game, /給我線索/);
 if (process.env.GITHUB_ACTIONS === "true") assert.match(home, /\/LUISIR-ict-game-lab\/games\/uno-wiring/);
});
