const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadSaveData() {
  const source = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
  const startMarker = "// SAVE_DATA_START";
  const endMarker = "// SAVE_DATA_END";
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert.notEqual(start, -1, "SAVE_DATA_START marker must exist");
  assert.notEqual(end, -1, "SAVE_DATA_END marker must exist");
  const block = source.slice(start + startMarker.length, end);
  return vm.runInNewContext(`${block}\nSaveData;`);
}

test("new room01 saves use v2 canonical fields while keeping temporary legacy aliases", () => {
  const SaveData = loadSaveData();
  const saved = SaveData.create({
    playerName: "白兎",
    currentScene: "room01",
    openingIndex: 12,
    rooms: { room01: { doorInspected: true, openedInbox: ["inbox-1"] } },
    logs: [{ id: "a", text: "A" }]
  });

  assert.equal(saved.saveVersion, 2);
  assert.equal(saved.currentScene, "room01");
  assert.equal(saved.opening.index, 12);
  assert.equal(saved.rooms.room01.doorInspected, true);
  assert.deepEqual(saved.rooms.room01.openedInbox, ["inbox-1"]);
  assert.equal(saved.scene, "firstRoom");
  assert.deepEqual(saved.state, saved.rooms.room01);
});

test("legacy firstRoom saves migrate into rooms.room01 without losing logs or state", () => {
  const SaveData = loadSaveData();
  const legacy = {
    playerName: "テスト",
    scene: "firstRoom",
    state: { viewedWall: "left", openedInbox: ["inbox-1"], doorUnlocked: true },
    logs: [{ id: "same" }, { id: "same" }]
  };
  const saved = SaveData.normalize(legacy);

  assert.equal(saved.saveVersion, 2);
  assert.equal(saved.currentScene, "room01");
  assert.equal(saved.rooms.room01.viewedWall, "left");
  assert.deepEqual(saved.rooms.room01.openedInbox, ["inbox-1"]);
  assert.equal(saved.rooms.room01.doorUnlocked, true);
  assert.equal(saved.logs.length, 2);
});

test("legacy opening saves migrate their opening index and keep an empty room map", () => {
  const SaveData = loadSaveData();
  const saved = SaveData.normalize({
    playerName: "テスト",
    scene: "opening",
    openingIndex: 9,
    logs: [{ id: "opening-1" }]
  });

  assert.equal(saved.currentScene, "opening");
  assert.equal(saved.opening.index, 9);
  assert.deepEqual(Object.keys(saved.rooms), []);
  assert.equal(saved.logs.length, 1);
});

test("v2 normalization preserves future room states even before their scene loader exists", () => {
  const SaveData = loadSaveData();
  const saved = SaveData.normalize({
    saveVersion: 2,
    playerName: "白兎",
    currentScene: "room02",
    opening: { index: 4 },
    rooms: {
      room01: { doorUnlocked: true },
      room02: { puzzleStep: 3 }
    },
    logs: []
  });

  assert.equal(saved.currentScene, "room02");
  assert.equal(saved.rooms.room01.doorUnlocked, true);
  assert.equal(saved.rooms.room02.puzzleStep, 3);

  const rewritten = SaveData.create(saved);
  assert.equal(rewritten.currentScene, "room02");
  assert.equal(rewritten.rooms.room02.puzzleStep, 3);
  assert.equal("scene" in rewritten, false);
  assert.equal("state" in rewritten, false);
});

test("malformed or unknown legacy saves are rejected safely", () => {
  const SaveData = loadSaveData();
  assert.equal(SaveData.normalize(null), null);
  assert.equal(SaveData.normalize([]), null);
  assert.equal(SaveData.normalize({ scene: "missing" }), null);
  assert.equal(SaveData.normalize({ saveVersion: 2, currentScene: "" }), null);
});
