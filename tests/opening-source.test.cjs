const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("opening sequence has a single implementation owner", () => {
  const script = read("script.js");
  const opening = read("opening-sequence.js");

  assert.doesNotMatch(script, /function\s+flashRed\s*\(/);
  assert.doesNotMatch(script, /function\s+showOpening\s*\(/);
  assert.doesNotMatch(script, /function\s+showBlack\s*\(/);
  assert.doesNotMatch(script, /function\s+showFade\s*\(/);
  assert.doesNotMatch(script, /function\s+startScenario\s*\(/);

  assert.match(opening, /function\s+flashRed\s*\(/);
  assert.match(opening, /function\s+showOpening\s*\(/);
  assert.match(opening, /function\s+updateOpeningVisual\s*\(/);
});

test("browser loads the canonical opening sequence after shared game code", () => {
  const index = read("index.html");
  const scriptPosition = index.indexOf("script.js");
  const openingPosition = index.indexOf("opening-sequence.js");

  assert.notEqual(scriptPosition, -1);
  assert.notEqual(openingPosition, -1);
  assert.ok(scriptPosition < openingPosition, "opening-sequence.js must load after script.js dependencies");
});

test("shared game code delegates new-game and resume flow to the canonical opening", () => {
  const script = read("script.js");

  assert.match(script, /clearSave\(\);flashRed\(\)/);
  assert.match(script, /showOpening\(saved\.opening\.index\)/);
  assert.match(script, /function\s+endOpening\s*\(/);
});
