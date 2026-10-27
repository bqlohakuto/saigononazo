const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const expectedAssets = [
  "ending-credits.css",
  "browser-navigation.css",
  "style.css",
  "viewport-scaler.js",
  "design-ui.css",
  "room2-immersive.css",
  "puzzle-explanations.css",
  "room5.css",
  "room6.css",
  "late-game.css",
  "room-exploration.css",
  "scenario.js",
  "game-audio.js",
  "game-log.js",
  "dialogue.js",
  "inspection.js",
  "exploration-scenario.js",
  "room-exploration.js",
  "script.js",
  "hana-choice.js",
  "opening-sequence.js",
  "room2-flashback.js",
  "room2-after-flashback.js",
  "room2.js",
  "room3.js",
  "room4-scenario.js",
  "room4-zodiac.js",
  "room4-flowers.js",
  "room4.js",
  "room5.js",
  "ending-credits.js",
  "room8-visuals.js",
  "late-game.js",
  "manual-save.js",
  "gameplay-ui.js",
  "hana-identity-ui.js",
  "memory-visuals.js",
  "design-ui.js",
  "puzzle-explanations.js",
  "browser-navigation.js"
];

function localAssetReferences() {
  return [...html.matchAll(/(?:href|src)="([^"]+\.(?:css|js)(?:\?[^\"]*)?)"/g)].map(match => match[1]);
}

test("all local CSS and JS references share one cache version", () => {
  const references = localAssetReferences();
  assert.equal(references.length, expectedAssets.length);
  const expectedVersion = new URLSearchParams(references[0].split("?")[1]).get("v");
  assert.match(expectedVersion || "", /^\d{8}-[a-z0-9-]+$/, "cache version must be dated and nonempty");

  for (const asset of expectedAssets) {
    const reference = references.find(value => value.startsWith(`${asset}?`));
    assert.ok(reference, `${asset} must have a cache-busting query string`);
    const params = new URLSearchParams(reference.split("?")[1]);
    assert.equal(params.get("v"), expectedVersion, `${asset} must use the shared cache version`);
  }
});

test("script load order remains intentional", () => {
  const scripts = [...html.matchAll(/<script src="([^"?]+)(?:\?[^\"]*)?"><\/script>/g)].map(match => match[1]);
  assert.deepEqual(scripts, [
    "viewport-scaler.js",
    "scenario.js",
    "game-audio.js",
    "game-log.js",
    "dialogue.js",
    "inspection.js",
    "exploration-scenario.js",
    "room-exploration.js",
    "script.js",
    "hana-choice.js",
    "opening-sequence.js",
    "room2-flashback.js",
    "room2-after-flashback.js",
    "room2.js",
    "room3.js",
    "room4-scenario.js",
  "room4-zodiac.js",
  "room4-flowers.js",
    "room4.js",
    "room5.js",
    "ending-credits.js",
    "room8-visuals.js",
  "late-game.js",
    "manual-save.js",
    "gameplay-ui.js",
    "hana-identity-ui.js",
  "memory-visuals.js",
  "design-ui.js",
  "puzzle-explanations.js",
  "browser-navigation.js"
  ]);
});


