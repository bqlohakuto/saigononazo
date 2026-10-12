const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function harness() {
  const opening = { style: {} };
  const stopped = [];
  const context = vm.createContext({
    document: {
      querySelector(selector) {
        return selector === ".opening" ? opening : null;
      }
    },
    GameAudio: {
      stop(id) { stopped.push(id); },
      stopAll() {},
      play() {}
    },
    FADE_TIME: 3000
  });

  const source = fs.readFileSync(path.join(__dirname, "..", "opening-sequence.js"), "utf8");
  vm.runInContext(source, context, { filename: "opening-sequence.js" });

  return {
    opening,
    stopped,
    run(expression) { return vm.runInContext(expression, context); }
  };
}

test("opening stays black through the heavy-eyelid line", () => {
  const h = harness();
  assert.equal(h.run("openingBackgroundForIndex(0)"), "#f00");
  assert.equal(h.run("openingBackgroundForIndex(1)"), "#000");
  assert.equal(h.run("openingBackgroundForIndex(2)"), "#000");
  assert.equal(h.run("openingBackgroundForIndex(3)"), "#000");
  assert.equal(h.run("openingBackgroundForIndex(4)"), "#fff");
  assert.equal(h.run("openingBackgroundForIndex(20)"), "#fff");
});

test("fresh opening switches to white only after the heavy-eyelid line", () => {
  const h = harness();
  h.run("openingFreshRun=true; openingWhiteFadeStarted=false; updateOpeningVisual(0)");
  assert.equal(h.opening.style.backgroundColor, "#f00");
  assert.equal(h.opening.style.transition, "none");

  h.run("updateOpeningVisual(1)");
  assert.equal(h.opening.style.backgroundColor, "#000");
  assert.equal(h.opening.style.transition, "none");

  h.run("updateOpeningVisual(2)");
  assert.equal(h.opening.style.backgroundColor, "#000");
  h.run("updateOpeningVisual(3)");
  assert.equal(h.opening.style.backgroundColor, "#000");
  h.run("updateOpeningVisual(4)");
  assert.equal(h.opening.style.backgroundColor, "#fff");
  assert.equal(h.opening.style.transition, "none");
  assert.equal(h.run("openingWhiteFadeStarted"), true);
  assert.deepEqual(h.stopped, ["tinnitus"]);
});

test("resume opens directly at the saved visual state without replaying the fade", () => {
  const h = harness();
  h.run("openingFreshRun=false; openingWhiteFadeStarted=false; updateOpeningVisual(12)");

  assert.equal(h.opening.style.backgroundColor, "#fff");
  assert.equal(h.opening.style.transition, "none");
  assert.deepEqual(h.stopped, ["tinnitus"]);
});
