const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const expectedVersion = "20260913-stable08";
const expectedAssets = [
  "style.css",
  "scenario.js",
  "game-audio.js",
  "game-log.js",
  "dialogue.js",
  "inspection.js",
  "script.js",
  "opening-sequence.js"
];

function localAssetReferences() {
  return [...html.matchAll(/(?:href|src)="([^"]+\.(?:css|js)(?:\?[^\"]*)?)"/g)].map(match => match[1]);
}

test("all local CSS and JS references share one cache version", () => {
  const references = localAssetReferences();
  assert.equal(references.length, expectedAssets.length);

  for (const asset of expectedAssets) {
    const reference = references.find(value => value.startsWith(`${asset}?`));
    assert.ok(reference, `${asset} must have a cache-busting query string`);
    const params = new URLSearchParams(reference.split("?")[1]);
    assert.equal(params.get("v"), expectedVersion, `${asset} must use the shared cache version`);
  }
});

test("script load order remains unchanged", () => {
  const scripts = [...html.matchAll(/<script src="([^"?]+)(?:\?[^\"]*)?"><\/script>/g)].map(match => match[1]);
  assert.deepEqual(scripts, [
    "scenario.js",
    "game-audio.js",
    "game-log.js",
    "dialogue.js",
    "inspection.js",
    "script.js",
    "opening-sequence.js"
  ]);
});
