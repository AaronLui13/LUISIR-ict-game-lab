import assert from "node:assert/strict";
import test from "node:test";
import {
  MISSIONS,
  advanceReadings,
  calculateEnergy,
  validateRules,
} from "../app/games/mars-iot-rescue/game-data.mjs";

const perfectRules = [
  { sensor: "oxygen", actuator: "oxygenator", threshold: 19 },
  { sensor: "temperature", actuator: "cooling", threshold: 24 },
  { sensor: "water", actuator: "pump", threshold: 45 },
];

test("accepts safe rules for the final mission", () => {
  const result = validateRules(MISSIONS[4], perfectRules);
  assert.equal(result.success, true);
  assert.deepEqual(result.issues, []);
});

test("explains an incorrect actuator and unsafe threshold", () => {
  const result = validateRules(MISSIONS[4], [
    { sensor: "oxygen", actuator: "pump", threshold: 19 },
    { sensor: "temperature", actuator: "cooling", threshold: 30 },
    { sensor: "water", actuator: "pump", threshold: 45 },
  ]);
  assert.equal(result.success, false);
  assert.equal(result.issues.length, 2);
  assert.match(result.issues[0], /錯誤的執行裝置/);
  assert.match(result.issues[1], /門檻值不安全/);
});

test("safe automation improves all endangered readings", () => {
  const start = MISSIONS[4].start;
  const next = advanceReadings(start, MISSIONS[4], perfectRules);
  assert.ok(next.oxygen > start.oxygen);
  assert.ok(next.temperature < start.temperature);
  assert.ok(next.water > start.water);
  assert.ok(calculateEnergy(MISSIONS[4], perfectRules) >= 70);
});

test("raises difficulty one system at a time across five missions", () => {
  assert.equal(MISSIONS.length, 5);
  assert.deepEqual(MISSIONS.map((mission) => mission.required.length), [1, 1, 1, 2, 3]);
  assert.deepEqual(MISSIONS[2].required, ["water"]);
  assert.deepEqual(MISSIONS[3].required, ["temperature", "water"]);
});
