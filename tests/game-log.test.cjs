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

test("restoring old Room 7 narration uses first person while preserving unrelated saved history", () => {
  const GameLog = loadGameLog();
  const saved = [
    {id:"r7_mem_tiger_17_02",text:"主人公は、隣を歩く先輩を見た。",type:"narration",speaker:"ト書き"},
    {id:"r7_mem_tiger_20_01",text:"その約束が嬉しくて、主人公は分かれ道までの時間を、いつもより長く感じていた。",type:"narration",speaker:"ト書き"},
    {id:"r7_mem_rabbit_01_02",text:"主人公は机の上に進路希望の紙を広げたまま、先輩と電話をしていた。",type:"narration",speaker:"ト書き"},
    {id:"r7_mem_rabbit_07_01",text:"電話越しの声に、主人公は少しだけ笑った。",type:"narration",speaker:"ト書き"},
    {id:"r7_mem_rabbit_13_01",text:"主人公は、進路希望の紙に目を落とす。",type:"narration",speaker:"ト書き"},
    {id:"r7_mem_rabbit_18_01",text:"主人公はペンを持ち直し、情報系の学部を進路希望の欄に書き込んだ。",type:"narration",speaker:"ト書き"},
    {id:"unrelated",text:"主人公という言葉",type:"narration",speaker:"ト書き"}
  ];
  GameLog.restore([...saved,saved[0]]);
  const restored=JSON.parse(JSON.stringify(GameLog.list()));
  assert.deepEqual(restored.map(entry=>entry.id),[...saved.map(entry=>entry.id),saved[0].id]);
  for(const entry of [...restored.slice(0,6),restored[7]])assert.ok(!entry.text.includes("主人公"));
  assert.equal(restored[6].text,saved[6].text);
  assert.equal(restored[7].text,"僕は、隣を歩く先輩を見た。");
  assert.ok(restored.every((entry,index)=>entry.order===index));
});
