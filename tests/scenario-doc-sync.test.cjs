const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const scenarioSource = fs.readFileSync(path.join(__dirname, "..", "scenario.js"), "utf8");
const manuscript = fs.readFileSync(path.join(__dirname, "..", "SCENARIO.md"), "utf8");

function scenarioTexts(source) {
  const texts = [];
  for (const match of source.matchAll(/\btext:\s*("(?:\\.|[^"\\])*")/g)) {
    texts.push(JSON.parse(match[1]));
  }
  return [...new Set(texts)];
}

test("SCENARIO.md mirrors every authored text stored in scenario.js", () => {
  const texts = scenarioTexts(scenarioSource);
  assert.ok(texts.length > 40, "scenario.js should expose the current authored scenario text");
  for (const text of texts) {
    assert.ok(manuscript.includes(text), `SCENARIO.md is missing: ${JSON.stringify(text)}`);
  }
});

test("scenario.js is explicitly documented as the implementation source of truth", () => {
  assert.match(scenarioSource, /実装上の正本はこのファイル/);
  assert.match(manuscript, /`scenario\.js` に実装されているシナリオ本文/);
});

test("retired draft-only wording is no longer presented as current manuscript", () => {
  const retired = [
    "頭の中に鳴り響く。",
    "次第に、目の前が暗闇に包まれていく。",
    "まばゆい光で目を覚ました。",
    "視界が開けると、先ほどとは違う部屋にいた。",
    "どういうことだろう"
  ];
  for (const text of retired) assert.equal(manuscript.includes(text), false, `retired draft remains: ${text}`);
});
