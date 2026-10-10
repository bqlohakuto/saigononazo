const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const expectedAssets = [
  "style.css",
  "design-ui.css",
  "room5.css",
  "late-game.css",
  "scenario.js",
  "game-audio.js",
  "game-log.js",
  "dialogue.js",
  "inspection.js",
  "script.js",
  "hana-choice.js",
  "opening-sequence.js",
  "room2-flashback.js",
  "room2-after-flashback.js",
  "room2.js",
  "room3.js",
  "room4-scenario.js",
  "room4.js",
  "room5.js",
  "late-game.js",
  "manual-save.js",
  "gameplay-ui.js",
  "hana-identity-ui.js",
  "design-ui.js"
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
    "scenario.js",
    "game-audio.js",
    "game-log.js",
    "dialogue.js",
    "inspection.js",
    "script.js",
    "hana-choice.js",
    "opening-sequence.js",
    "room2-flashback.js",
    "room2-after-flashback.js",
    "room2.js",
    "room3.js",
    "room4-scenario.js",
    "room4.js",
    "room5.js",
    "late-game.js",
    "manual-save.js",
    "gameplay-ui.js",
    "hana-identity-ui.js",
  "design-ui.js"
  ]);
});
