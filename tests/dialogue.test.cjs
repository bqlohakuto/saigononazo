const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// A deterministic, dependency-free DOM/timer harness for dialogue.js.
class FakeElement {
  constructor() {
    this.children = [];
    this.attributes = new Map();
    this.listeners = new Map();
    this.className = "";
    this.textContent = "";
    this.disabled = false;
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name); }
  appendChild(child) { this.children.push(child); return child; }
  replaceChildren(...children) { this.children = children; }
  addEventListener(type, callback) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(callback);
  }
  removeEventListener(type, callback) { this.listeners.get(type)?.delete(callback); }
  dispatch(type) {
    for (const callback of [...(this.listeners.get(type) || [])]) callback();
  }
  click() { if (!this.disabled) this.dispatch("click"); }
  focus() { this.focused = true; }
}

function fakeClock() {
  let now = 0;
  let nextId = 0;
  const tasks = new Map();
  const add = (callback, delay, interval) => {
    const id = ++nextId;
    tasks.set(id, { callback, at: now + delay, interval });
    return id;
  };
  return {
    setTimeout: (callback, delay) => add(callback, delay, 0),
    setInterval: (callback, delay) => add(callback, delay, delay),
    clearTimeout: id => tasks.delete(id),
    clearInterval: id => tasks.delete(id),
    get pending() { return tasks.size; },
    tick(milliseconds) {
      const target = now + milliseconds;
      let iterations = 0;
      while (true) {
        const due = [...tasks.entries()]
          .filter(([, task]) => task.at <= target)
          .sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
        if (!due) break;
        if (++iterations > 100000) throw new Error("Timer loop did not settle");
        const [id, task] = due;
        now = task.at;
        if (task.interval) task.at += task.interval;
        else tasks.delete(id);
        task.callback();
      }
      now = target;
    }
  };
}

function harness() {
  const clock = fakeClock();
  const document = new FakeElement();
  document.hidden = false;
  document.createElement = () => new FakeElement();
  const source = fs.readFileSync(path.join(__dirname, "..", "dialogue.js"), "utf8");
  const Dialogue = vm.runInNewContext(`${source}\nDialogue;`, {
    document,
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
    setInterval: clock.setInterval,
    clearInterval: clock.clearInterval
  });
  return {
    clock,
    document,
    Dialogue,
    start(lines, textSpeed = 20) {
      const messageArea = new FakeElement();
      const nextButton = new FakeElement();
      const autoButton = new FakeElement();
      let completions = 0;
      const controller = Dialogue.start({
        lines, messageArea, nextButton, autoButton,
        getTextSpeed: () => textSpeed,
        onComplete: () => { completions++; }
      });
      return {
        messageArea, nextButton, autoButton, controller,
        get text() { return messageArea.children[0]?.children[0]?.textContent ?? ""; },
        get row() { return messageArea.children[0]; },
        get completions() { return completions; }
      };
    },
    setHidden(hidden) {
      document.hidden = hidden;
      document.dispatch("visibilitychange");
    }
  };
}

const player = text => ({ speaker: "主人公", text });
const heroine = text => ({ speaker: "ハナ", text });

test("typing reveals complete Unicode characters; manual input finishes then advances", () => {
  const h = harness();
  const d = h.start([player("あ😀。"), heroine("次。")], 50);
  assert.equal(d.text, "");
  h.clock.tick(49);
  assert.equal(d.text, "");
  h.clock.tick(1);
  assert.equal(d.text, "あ");
  h.clock.tick(50);
  assert.equal(d.text, "あ😀");
  d.nextButton.click();
  assert.equal(d.text, "あ😀。");
  h.clock.tick(5000);
  assert.equal(d.text, "あ😀。");
  d.nextButton.click();
  assert.equal(d.text, "");
  assert.equal(d.row.className, "message-row heroine");
  h.clock.tick(50);
  assert.equal(d.text, "次");
});

test("AUTO waits exactly 2000 ms after typing finishes", () => {
  const h = harness();
  const d = h.start([player("一文。"), heroine("次")]);
  d.autoButton.click();
  assert.equal(d.autoButton.textContent, "AUTO ON");
  assert.equal(d.autoButton.getAttribute("aria-pressed"), "true");
  h.clock.tick(59);
  assert.equal(d.text, "一文");
  h.clock.tick(1);
  assert.equal(d.text, "一文。");
  h.clock.tick(1999);
  assert.equal(d.text, "一文。");
  h.clock.tick(1);
  assert.equal(d.text, "");
  assert.equal(d.row.className, "message-row heroine");
  h.clock.tick(20);
  assert.equal(d.text, "次");
});

test("AUTO OFF cancels its pending advance; enabling starts a fresh wait", () => {
  const h = harness();
  const d = h.start([player("前"), heroine("後")]);
  d.autoButton.click();
  h.clock.tick(1020);
  d.autoButton.click();
  assert.equal(d.autoButton.textContent, "AUTO OFF");
  assert.equal(d.autoButton.getAttribute("aria-pressed"), "false");
  h.clock.tick(10000);
  assert.equal(d.text, "前");
  assert.equal(d.completions, 0);
  d.autoButton.click();
  h.clock.tick(1999);
  assert.equal(d.text, "前");
  h.clock.tick(1);
  assert.equal(d.row.className, "message-row heroine");
});

test("toggling AUTO while typing neither skips text nor leaves a stale advance", () => {
  const h = harness();
  const d = h.start([player("長い文です"), heroine("次")], 100);
  h.clock.tick(50);
  d.autoButton.click();
  h.clock.tick(150);
  assert.equal(d.text, "長い");
  d.autoButton.click();
  h.clock.tick(10000);
  assert.equal(d.text, "長い文です");
  assert.equal(d.completions, 0);
  d.autoButton.click();
  h.clock.tick(2000);
  assert.equal(d.row.className, "message-row heroine");
});

test("manual advance cancels the previous AUTO timer without double advancement", () => {
  const h = harness();
  const d = h.start([player("前"), heroine("中"), player("後")]);
  d.autoButton.click();
  h.clock.tick(1920);
  d.nextButton.click();
  h.clock.tick(20);
  assert.equal(d.text, "中");
  h.clock.tick(80); // The first sentence's now-cancelled deadline.
  assert.equal(d.text, "中");
  h.clock.tick(1919);
  assert.equal(d.text, "中");
  h.clock.tick(1);
  assert.equal(d.row.className, "message-row player");
  assert.equal(d.text, "");
  h.clock.tick(20);
  assert.equal(d.text, "後");
  assert.equal(d.completions, 0);
});

test("system instructions remain manual even with AUTO ON", () => {
  const h = harness();
  const d = h.start([{ speaker: "システム", text: "案内" }, heroine("次")]);
  d.autoButton.click();
  h.clock.tick(10000);
  assert.equal(d.text, "案内");
  assert.equal(d.autoButton.getAttribute("aria-pressed"), "true");
  assert.match(d.autoButton.title, /手動/);
  assert.equal(d.completions, 0);
  d.nextButton.click();
  h.clock.tick(20);
  assert.equal(d.text, "次");
  h.clock.tick(2000);
  assert.equal(d.completions, 1);
});

test("speaker and inner-thought classification exposes matching visual and accessible labels", () => {
  const h = harness();
  const entries = [
    [player("声"), "player", "主人公のセリフ"],
    [heroine("声"), "heroine", "ハナのセリフ"],
    [{ speaker: "ト書き", text: "文" }, "narration", "地の文"],
    [{ speaker: "システム", text: "文" }, "system", "システム"],
    [{ speaker: "主人公", thought: true, text: "心" }, "player", "主人公の心の声"],
    [{ speaker: "ト書き", thought: true, text: "心" }, "player", "主人公の心の声"]
  ];
  const d = h.start(entries.map(([line]) => line));
  for (const [, kind, label] of entries) {
    assert.equal(d.row.className, `message-row ${kind}`);
    assert.equal(d.row.children[0].className, `message ${kind}`);
    assert.equal(d.row.getAttribute("aria-label"), label);
    d.nextButton.click(); // Reveal the current line.
    d.nextButton.click(); // Advance to the next line.
  }
  assert.equal(d.completions, 1);
});

test("completion runs exactly once and disables controls even after further calls", () => {
  const h = harness();
  const d = h.start([player("終")]);
  d.autoButton.click();
  h.clock.tick(2020);
  assert.equal(d.completions, 1);
  assert.equal(d.nextButton.disabled, true);
  assert.equal(d.autoButton.disabled, true);
  d.nextButton.click();
  d.autoButton.click();
  d.controller.advance();
  d.controller.dispose();
  h.Dialogue.stop();
  h.clock.tick(10000);
  assert.equal(d.completions, 1);
  assert.equal(h.clock.pending, 0);
});

test("starting another dialogue removes old typing, AUTO timers, and event handlers", () => {
  const h = harness();
  const old = h.start([player("旧")]);
  old.autoButton.click();
  h.clock.tick(20);
  const fresh = h.start([heroine("新しい文")]);
  old.nextButton.click();
  old.autoButton.click();
  h.clock.tick(2020);
  assert.equal(old.text, "旧");
  assert.equal(old.completions, 0);
  assert.equal(fresh.text, "新しい文");
  assert.equal(fresh.completions, 0);
  h.clock.tick(60);
  assert.equal(fresh.completions, 1);

  const typing = h.start([player("まだ入力中")]);
  h.clock.tick(20);
  assert.equal(typing.text, "ま");
  const replacement = h.start([player("替")]);
  h.clock.tick(20);
  assert.equal(typing.text, "ま");
  assert.equal(replacement.text, "替");
  h.Dialogue.stop();
  h.clock.tick(5000);
  assert.equal(typing.completions, 0);
  assert.equal(replacement.completions, 0);
  assert.equal(h.clock.pending, 0);
});

test("hidden documents do not AUTO-advance; becoming visible starts a new 2-second wait", () => {
  const h = harness();
  const d = h.start([player("前"), heroine("後")]);
  d.autoButton.click();
  h.clock.tick(1020);
  h.setHidden(true);
  h.clock.tick(10000);
  assert.equal(d.text, "前");
  assert.equal(d.completions, 0);
  h.setHidden(false);
  h.clock.tick(1999);
  assert.equal(d.text, "前");
  h.clock.tick(1);
  assert.equal(d.row.className, "message-row heroine");
  h.setHidden(true); // Also cover typing that finishes while hidden.
  h.clock.tick(5000);
  assert.equal(d.text, "後");
  assert.equal(d.completions, 0);
  h.setHidden(false);
  h.clock.tick(1999);
  assert.equal(d.completions, 0);
  h.clock.tick(1);
  assert.equal(d.completions, 1);
});
