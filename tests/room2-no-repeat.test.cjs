"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "room2.js"), "utf8");
const sandbox = {};
vm.runInNewContext(`${source}\nthis.__room2HasSubmittedGuess=room2HasSubmittedGuess;`, sandbox);
const submitted = sandbox.__room2HasSubmittedGuess;

const a = [
  {symbol:"〇",color:"赤"},
  {symbol:"△",color:"青"},
  {symbol:"□",color:"赤"},
  {symbol:"×",color:"青"},
  {symbol:"＋",color:"赤"}
];
const b = [
  {symbol:"△",color:"青"},
  {symbol:"〇",color:"赤"},
  {symbol:"□",color:"赤"},
  {symbol:"×",color:"青"},
  {symbol:"＋",color:"赤"}
];
const snapshot = guess => ({guess:guess.map(piece=>({...piece})),hit:0,blow:0});

test("duplicate detection compares the full ordered symbol/color placement", () => {
  assert.equal(submitted(a, [snapshot(a)]), true, "same arrangement is a repeat");
  assert.equal(submitted(b, [snapshot(a)]), false, "swapping block locations is a new guess");
  assert.equal(submitted([{...a[0],color:"青"},...a.slice(1)], [snapshot(a)]), false, "changing a color is a new guess");
  assert.equal(submitted(a, []), false, "first guess is always available");
});

test("a repeat of an older history entry is also detected", () => {
  assert.equal(submitted(a,[snapshot(a),snapshot(b)]),true);
  assert.equal(submitted(b,[snapshot(a),snapshot(b)]),true);
  assert.equal(submitted(a,null),false);
  assert.equal(submitted(a,[{guess:null}]),false);
});

test("the judge checks repeats before attempts and retains the submitted pieces", () => {
  const start=source.indexOf('overlay.querySelector(".room2-submit").addEventListener("click",()=>{');
  const end=source.indexOf("\nfunction room2HasSubmittedGuess(",start);
  assert.ok(start>=0&&end>start);
  const handler=source.slice(start,end);
  const guard=handler.indexOf("if(room2HasSubmittedGuess(room2State.guess,room2State.history))");
  const count=handler.indexOf("room2State.attempts++");
  assert.ok(guard>=0 && count>guard, "repeat guard runs before counting");
  assert.ok(!handler.includes("room2State.guess=[]"), "the board is not emptied on submit");
  assert.match(handler,/room2State\.history\.push\(\{guess:room2State\.guess\.map/,"history stores its own snapshot");
});
