const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = name => fs.readFileSync(path.join(root, name), "utf8");
const present = name => fs.existsSync(path.join(root, name));

test("all rooms have authored entry narration, with no work-in-progress note visible", () => {
  const sections = [
    ["scenario.js", /opening_07/, /speaker:\s*"ト書き"/],
    ["room2.js", /room2_intro_01/, /speaker:"ト書き"/],
    ["room3.js", /room3_intro_01/, /speaker:"ト書き"/],
    ["room4-scenario.js", /r4i01/, /speaker:"ト書き"/],
    ["late-game.js", /r5_intro_01/, /r6_intro_entry_01/],
    ["late-game.js", /r7_intro_01|r7Lines\('intro'\)/, /r8_entry_02/]
  ];
  for (const [filename, ...checks] of sections) {
    const source = read(filename);
    for (const pattern of checks) assert.match(source, pattern, filename + ": missing entry narration " + pattern);
  }
  for (const filename of ["script.js", "room2.js", "room3.js", "room4.js", "late-game.js"]) {
    assert.doesNotMatch(read(filename), /【未確定】|pending\s*\(/, filename + ": production note leaked into gameplay");
  }
});

test("approved puzzle and scene artwork is present before player reaches it", () => {
  const assets = [
    ...["mirror", "fish", "butterfly", "flower", "squid", "chair", "cannon"].map(x => "images/background/room05/panels/" + x + ".webp"),
    ...[1,2,3,4,5].map(n => "images/exhibits/room04/virgo-panels/virgo-panel-" + String(n).padStart(2,"0") + ".svg"),
    ...["front", "right", "back", "left"].map(x => "images/background/room04/room04_" + x + ".webp"),
    ...["front", "right", "back", "left"].map(x => "images/background/room07/" + x + ".webp"),
    ...[1,2,3,4].map((n,i) => "images/background/room08/room08_dissolve_0" + n + "_" + ["full","start","mid","final"][i] + ".png"),
    "images/background/room01/pixel/room01_door_halfopen.png"
  ];
  for (const asset of assets) assert.ok(present(asset), "Missing playable artwork: " + asset);
});

test("all eight room implementations and final ending are present", () => {
  const src = ["script.js", "room2.js", "room3.js", "room4.js", "late-game.js"].map(read).join("\n");
  const entries = ["showFirstRoom", "showSecondRoom", "showThirdRoom", "showFourthRoom", "showFifthRoom", "showSixthRoom", "showSeventhRoom", "showEighthRoom"];
  for(const entry of entries) assert.match(src, new RegExp("\\b" + entry + "\\b"), "Missing chapter entry: " + entry);
  assert.match(read("late-game.js"), /r8EndScreen\(/);
  assert.match(read("late-game.js"), /r8Epilogue\(/);
});
