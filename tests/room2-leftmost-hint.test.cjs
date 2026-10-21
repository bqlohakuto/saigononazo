"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const room2Source = fs.readFileSync(path.join(__dirname, "..", "room2.js"), "utf8");
const sandbox = {};
vm.runInNewContext(
  `${room2Source}\nthis.__room2ShouldRevealLeftmostHint = room2ShouldRevealLeftmostHint; this.__room2LeftmostHintLines = room2LeftmostHintLines;`,
  sandbox
);
const shouldReveal = sandbox.__room2ShouldRevealLeftmostHint;

const history = results => results.map(([hit, blow]) => ({ hit, blow }));

test("leftmost clue waits until the fifth result, even if colors matched earlier", () => {
  assert.equal(shouldReveal(history([[0, 1], [1, 4], [0, 2], [2, 1]]), 4), false);
  assert.equal(shouldReveal(history([[0, 1], [1, 4], [0, 2], [2, 1], [2, 1]]), 5), true);
});

test("leftmost clue is not revealed when all colors match only after try five", () => {
  assert.equal(shouldReveal(history([[0, 1], [1, 1], [2, 1], [0, 2], [2, 1], [0, 5]]), 6), false);
});

test("a correct answer does not also trigger the leftmost clue", () => {
  assert.equal(shouldReveal(history([[1, 4], [0, 2], [2, 1], [3, 1], [5, 0]]), 5), false);
});

test("invalid or incomplete history cannot trigger the clue", () => {
  assert.equal(shouldReveal(null, 5), false);
  assert.equal(shouldReveal(history([[1, 4], [0, 2], [2, 1], [3, 1]]), 5), false);
  assert.equal(shouldReveal(history([[1, 4], [0, 2], [2, 1], [3, 1], [2, 1]]), 4), false);
});

test("a fifth-turn 0H5B qualifies, but five turns alone never do", () => {
  assert.equal(shouldReveal(history([[0, 0], [0, 1], [1, 0], [0, 2], [0, 5]]), 5), true);
  assert.equal(shouldReveal(history([[1, 0], [0, 1], [1, 1], [2, 0], [0, 2]]), 5), false);
});

test("a solved result in the first five takes precedence over offering a clue", () => {
  assert.equal(shouldReveal(history([[0, 5], [1, 0], [2, 1], [0, 1], [5, 0]]), 5), false);
});

test("malformed results cannot qualify the clue", () => {
  assert.equal(shouldReveal(history([[1, 1], [2, 2], [2, 1], [0, 0], ["2", 3]]), 5), false);
  assert.equal(shouldReveal(history([[0, 0], [0, 0], [0, 0], [0, 0], [4, 2]]), 5), false);
});

test("No.137: the leftmost clue is exactly one natural Hana line", () => {
  const lines = Array.from(sandbox.__room2LeftmostHintLines(3, "〇"), line => ({
    logId: line.logId, logType: line.logType, speaker: line.speaker, text: line.text
  }));
  assert.deepEqual(lines, [{
    logId: "room2_leftmost_hint_3_01",
    logType: "dialogue",
    speaker: "ハナ",
    text: "左端は「〇」だよ。色と残りは、君が考えてみてね"
  }]);
  for(const symbol of ["△","□","×","＋"]){
    const result = sandbox.__room2LeftmostHintLines(1,symbol);
    assert.equal(result.length,1);
    assert.equal(result[0].text,`左端は「${symbol}」だよ。色と残りは、君が考えてみてね`);
  }
});

test("No.137: revealed symbol stays visible and the one-time conditions are preserved", () => {
  assert.match(room2Source,/hint\.hidden=!room2State\.leftmostHintRevealed/);
  assert.ok(room2Source.includes('左端の記号：${room2State.answer[0].symbol}'));
  assert.match(room2Source,/if\(isChallenge\|\|!room2ShouldRevealLeftmostHint/);
  assert.match(room2Source,/room2State\.leftmostHintRevealed=true/);
  assert.doesNotMatch(room2Source,/room2_leftmost_hint_\$\{run\}_02/);
  for(const chapter of ["02_room2.md","FULL_SCENARIO.md"]){
    const manuscript=fs.readFileSync(path.join(__dirname,"..","scenario",chapter),"utf8");
    assert.ok(manuscript.includes("【校閲No.137・案2 採用】"));
    assert.ok(manuscript.includes("左端は「〇」だよ。色と残りは、君が考えてみてね"));
  }
});

test("No.138: persistent leftmost hint is concise for all symbols, including after save restoration", () => {
  const displaySource=room2Source.match(/hint\\.textContent=room2State\\.leftmostHintRevealed\\?(`[^`]+`):"";/);
  assert.ok(displaySource, "Hint text rendering expression is retained");
  for(const symbol of ["〇","△","□","×","＋"]){
    const state={leftmostHintRevealed:true,answer:[{symbol}]};
    const hint=vm.runInNewContext(displaySource[1],{room2State:state});
    assert.equal(hint,`左端の記号：${symbol}`);
  }
  assert.match(room2Source,/hint\\.hidden=!room2State\\.leftmostHintRevealed/);
  assert.ok(room2Source.includes("leftmostHintRevealed: false") || room2Source.includes("leftmostHintRevealed:false"));
  for(const file of ["02_room2.md","FULL_SCENARIO.md"]){
    const scenario=fs.readFileSync(path.join(__dirname,"..","scenario",file),"utf8");
    assert.ok(scenario.includes("【校閲No.138・案2 採用】"));
    assert.ok(scenario.includes("「左端の記号：〇」"));
  }
});
