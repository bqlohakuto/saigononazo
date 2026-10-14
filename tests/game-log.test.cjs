const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadGameLog() {
  const source = fs.readFileSync(path.join(__dirname, "..", "game-log.js"), "utf8");
  return vm.runInNewContext(`${source}\nGameLog;`);
}

test("repeated displays with the same logId are all preserved in order", () => {
  const GameLog = loadGameLog();
  const line = {
    logId: "room1_hana_after_question_01_01",
    logType: "dialogue",
    speaker: "ハナ",
    text: "同じ会話"
  };

  assert.equal(GameLog.record(line), true);
  assert.equal(GameLog.record(line), true);
  assert.equal(GameLog.record(line), true);

  assert.deepEqual(
    JSON.parse(JSON.stringify(GameLog.list())).map(entry => ({ id: entry.id, text: entry.text, order: entry.order })),
    [
      { id: line.logId, text: "同じ会話", order: 0 },
      { id: line.logId, text: "同じ会話", order: 1 },
      { id: line.logId, text: "同じ会話", order: 2 }
    ]
  );
});

test("restore keeps repeated IDs from saved history instead of deduplicating them", () => {
  const GameLog = loadGameLog();
  GameLog.restore([
    { id: "same", order: 7, text: "一回目", type: "investigation", speaker: "主人公", kind: "player" },
    { id: "same", order: 8, text: "二回目", type: "investigation", speaker: "主人公", kind: "player" },
    { id: "same", order: 9, text: "三回目", type: "investigation", speaker: "主人公", kind: "player" }
  ]);

  const restored = JSON.parse(JSON.stringify(GameLog.list()));
  assert.deepEqual(restored.map(entry => entry.id), ["same", "same", "same"]);
  assert.deepEqual(restored.map(entry => entry.text), ["一回目", "二回目", "三回目"]);
  assert.deepEqual(restored.map(entry => entry.order), [0, 1, 2]);
});

test("has reports whether a stable line ID has ever been displayed, including restored history", () => {
  const GameLog = loadGameLog();
  assert.equal(GameLog.has("room1_hana_room_01"), false);
  GameLog.record({ logId: "room1_hana_room_01", text: "一度表示した文" });
  assert.equal(GameLog.has("room1_hana_room_01"), true);
  assert.equal(GameLog.has("another-line"), false);

  GameLog.restore([{ id: "restored-line", text: "再開前に表示した文" }]);
  assert.equal(GameLog.has("room1_hana_room_01"), false);
  assert.equal(GameLog.has("restored-line"), true);
});

test("invalid log entries are still ignored", () => {
  const GameLog = loadGameLog();
  assert.equal(GameLog.record({ logId: "", text: "本文" }), false);
  assert.equal(GameLog.record({ logId: "valid", text: "" }), false);
  assert.equal(GameLog.record({ text: "本文" }), false);
  assert.deepEqual(JSON.parse(JSON.stringify(GameLog.list())), []);
});

test("memory characters retain their speaker and character kind through saved history", () => {
  const GameLog = loadGameLog();
  for (const speaker of ["顧問", "部長", "部員全員", "先輩"]) {
    assert.equal(GameLog.record({ logId: speaker, logType: "dialogue", speaker, text: "声" }), true);
  }
  const before = JSON.parse(JSON.stringify(GameLog.list()));
  assert.ok(before.every(entry => entry.kind === "character"));
  GameLog.restore(before);
  assert.deepEqual(JSON.parse(JSON.stringify(GameLog.list())), before);
});
