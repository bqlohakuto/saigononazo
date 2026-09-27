"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const room2Source = fs.readFileSync(path.join(__dirname, "..", "room2.js"), "utf8");
const sandbox = {};
vm.runInNewContext(
  `${room2Source}\nthis.__room2ShouldRevealLeftmostHint = room2ShouldRevealLeftmostHint;`,
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
