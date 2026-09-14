const test = require("node:test");
const assert = require("node:assert/strict");
const Logic = require("../prototype/mastermind/logic.js");

function code(entries) {
  const symbols = ["circle", "triangle", "square", "diamond", "plus"];
  return entries.map((color, index) => ({ symbol: symbols[index], color }));
}

test("mastermind generates all 3,840 valid codes", () => {
  const codes = Logic.generateAllCodes();
  assert.equal(codes.length, 3840);
  assert.equal(new Set(codes.map(item => item.map(Logic.tokenKey).join("|"))).size, 3840);
  assert.ok(codes.every(Logic.isValidCode));
});

test("mastermind scores exact positions", () => {
  const secret = code(["red", "blue", "red", "blue", "red"]);
  assert.deepEqual(Logic.score(secret, secret), { exact: 5, misplaced: 0 });
});

test("mastermind scores correct pieces in wrong positions", () => {
  const secret = code(["red", "blue", "red", "blue", "red"]);
  const guess = [secret[1], secret[0], secret[2], secret[4], secret[3]];
  assert.deepEqual(Logic.score(secret, guess), { exact: 1, misplaced: 4 });
});

test("a symbol with the wrong color is not the same piece", () => {
  const secret = code(["red", "red", "red", "red", "red"]);
  const guess = code(["blue", "blue", "blue", "blue", "blue"]);
  assert.deepEqual(Logic.score(secret, guess), { exact: 0, misplaced: 0 });
});

test("random code uses every symbol exactly once", () => {
  const generated = Logic.randomCode(() => 0.25);
  assert.equal(Logic.isValidCode(generated), true);
  assert.deepEqual(new Set(generated.map(token => token.symbol)).size, 5);
});

test("clear statistics keep the latest result and best attempt count", () => {
  const first = Logic.updateStats({ clearCount: 0, bestAttempts: null }, 6, 8);
  assert.deepEqual(first, { clearCount: 1, bestAttempts: 6, latestAttempts: 6, latestRemaining: 2 });
  const second = Logic.updateStats(first, 4, 8);
  assert.deepEqual(second, { clearCount: 2, bestAttempts: 4, latestAttempts: 4, latestRemaining: 4 });
  const third = Logic.updateStats(second, 7, 8);
  assert.equal(third.bestAttempts, 4);
});

test("share text promotes the main game and includes both result values", () => {
  const text = Logic.shareText(5, 8);
  assert.match(text, /5回でクリア/);
  assert.match(text, /残り3手/);
  assert.match(text, /最後の謎が解けるまで/);
  assert.match(text, /#いろしるパズル/);
});
