"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const source = fs.readFileSync(path.join(__dirname, "..", "room2.js"), "utf8");
const manuscript = fs.readFileSync(path.join(__dirname, "..", "scenario", "02_room2_hit_blow.md"), "utf8");
const combined = fs.readFileSync(path.join(__dirname, "..", "scenario", "FULL_SCENARIO.md"), "utf8");
const expected = [
  ["主人公", "……解けた"],
  ["ハナ", "やった！　正解だね！"],
  ["主人公", "はい。なんとかたどり着けました"]
];

test("main-story success always displays the three adopted lines", () => {
  const result = [];
  const sandbox = { showRoomDialog(lines, after) { result.push({ lines, after }); } };
  vm.runInNewContext(`${source}\nthis.__handleRoom2Correct=handleRoom2Correct;`, sandbox);
  for (const attempt of [1, 5, 8, 12]) {
    let closed = 0;
    sandbox.room2State = { attempts: attempt };
    sandbox.__handleRoom2Correct(() => { closed++; });
    const dialog = result.at(-1);
    const normalized = Array.from(dialog.lines, line => [line.speaker, line.text]);
    assert.deepEqual(normalized, expected, "story text never branches by answer count");
    assert.equal(closed, 1);
    assert.equal(typeof dialog.after, "function", "flashback transition remains intact");
  }
});

test("adopted manuscript has one 5 HIT row and no old count-based variants", () => {
  const fiveHit = manuscript.split("## 5 HIT｜本編正解時（校閲No.106・案1）")[1];
  assert.ok(fiveHit);
  assert.equal([...fiveHit.matchAll(/\| 5H0B/g)].length, 1);
  for (const [, text] of expected) {
    assert.ok(manuscript.includes(text), `accepted line missing from manuscript: ${text}`);
    assert.ok(combined.includes(text), `accepted line missing from combined manuscript: ${text}`);
  }
  assert.doesNotMatch(fiveHit, /残り回数[0-9]|はやい！|余裕あったね！|難しかったね！/);
});
