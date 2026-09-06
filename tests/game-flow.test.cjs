const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// Runs the real game modules against a small DOM model. This checks state,
// event ownership and focus routing, not browser layout or native inert behavior.
function harness(saved) {
  const observers = new Set();
  const timers = new Map();
  let timerId = 0, now = 0;
  const storage = new Map();
  const writes = [];
  if (saved) storage.set("saigononazo-save-v1", JSON.stringify(saved));
  let document;

  class Element {
    constructor(tag = "div") {
      this.tagName = tag.toUpperCase();
      this.children = [];
      this.parentElement = null;
      this.attributes = new Map();
      this.listeners = new Map();
      this.style = {};
      this.dataset = {};
      this.disabled = false;
      this.hidden = false;
      this.inert = false;
      this.value = "";
      this._text = "";
      this.classList = {
        contains: name => this.className.split(/\s+/).includes(name),
        add: (...names) => { this.className = [...new Set([...this.className.split(/\s+/).filter(Boolean), ...names])].join(" "); },
        remove: (...names) => { this.className = this.className.split(/\s+/).filter(name => !names.includes(name)).join(" "); },
        toggle: (name, force) => {
          const add = force ?? !this.classList.contains(name);
          this.classList[add ? "add" : "remove"](name);
          return add;
        }
      };
    }
    get id() { return this.attributes.get("id") || ""; }
    set id(value) { this.attributes.set("id", value); }
    get className() { return this.attributes.get("class") || ""; }
    set className(value) { this.attributes.set("class", value); }
    get isConnected() { return this === document.documentElement || !!this.parentElement?.isConnected; }
    setAttribute(name, value) {
      this.attributes.set(name, String(value));
      if (name.startsWith("data-")) this.dataset[name.slice(5)] = String(value);
      if (["hidden", "disabled", "inert"].includes(name)) this[name] = true;
      if (name === "value") this.value = String(value);
    }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    append(...children) { children.forEach(child => this.appendChild(child)); }
    appendChild(child) { child.remove(); this.children.push(child); child.parentElement = this; return child; }
    remove() {
      if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(child => child !== this);
      this.parentElement = null;
    }
    replaceChildren(...children) {
      this.children.forEach(child => { child.parentElement = null; });
      this.children = []; this._text = ""; this.append(...children);
    }
    set textContent(value) { this.replaceChildren(); this._text = String(value); }
    get textContent() { return this._text + this.children.map(child => child.textContent).join(""); }
    set innerHTML(html) {
      this.replaceChildren();
      const stack = [this];
      const voidTags = new Set(["IMG", "INPUT", "BR", "HR", "META", "LINK"]);
      for (const token of html.match(/<[^>]*>|[^<]+/g) || []) {
        if (token.startsWith("</")) { if (stack.length > 1) stack.pop(); }
        else if (token.startsWith("<")) {
          const tag = token.match(/^<([\w-]+)/)?.[1];
          if (!tag) continue;
          const child = new Element(tag);
          const attributes = token.slice(tag.length + 1, token.endsWith("/>") ? -2 : -1);
          const regex = /([\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
          for (const match of attributes.matchAll(regex)) child.setAttribute(match[1], match[2] ?? match[3] ?? match[4] ?? "");
          stack.at(-1).append(child);
          if (!voidTags.has(child.tagName) && !token.endsWith("/>")) stack.push(child);
        } else stack.at(-1)._text += token;
      }
    }
    matches(selector) {
      return selector.split(",").some(part => {
        part = part.trim();
        if (part.includes(":not(:disabled)")) {
          if (this.disabled) return false;
          part = part.replace(":not(:disabled)", "");
        }
        if (part === ":disabled") return this.disabled;
        const tag = part.match(/^[\w-]+/)?.[0];
        if (tag && tag.toUpperCase() !== this.tagName) return false;
        const id = part.match(/#([\w-]+)/)?.[1];
        if (id && id !== this.id) return false;
        if ([...part.matchAll(/\.([\w-]+)/g)].some(match => !this.classList.contains(match[1]))) return false;
        for (const [, name, quote, value] of part.matchAll(/\[([\w-]+)(?:=(["']?)([^\]"']+)\2)?\]/g)) {
          if (["hidden", "disabled", "inert"].includes(name)) { if (!this[name]) return false; }
          else if (!this.attributes.has(name)) return false;
          if (value !== undefined && this.getAttribute(name) !== value) return false;
        }
        return true;
      });
    }
    closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) || null; }
    contains(child) { return child === this || this.children.some(element => element.contains(child)); }
    querySelectorAll(selector) {
      return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]);
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    addEventListener(type, callback, options) {
      if (!this.listeners.has(type)) this.listeners.set(type, []);
      this.listeners.get(type).push({ callback, capture: options === true || !!options?.capture });
    }
    removeEventListener(type, callback) {
      this.listeners.set(type, (this.listeners.get(type) || []).filter(listener => listener.callback !== callback));
    }
    emit(type, properties = {}) {
      const event = {
        type, target: this, defaultPrevented: false, stopped: false, immediate: false,
        preventDefault() { this.defaultPrevented = true; },
        stopPropagation() { this.stopped = true; },
        stopImmediatePropagation() { this.stopped = true; this.immediate = true; },
        ...properties
      };
      const route = []; for (let node = this; node; node = node.parentElement) route.push(node);
      if (!route.includes(document)) route.push(document);
      const deliver = (node, capture) => {
        for (const listener of [...(node.listeners.get(type) || [])]) {
          if (listener.capture === capture) listener.callback(event);
          if (event.immediate) break;
        }
      };
      for (const node of [...route].reverse()) { deliver(node, true); if (event.stopped) return event; }
      for (const node of route) { deliver(node, false); if (event.stopped) return event; }
      return event;
    }
    click() { if (!this.disabled && !this.closest("[inert]")) return this.emit("click"); }
    focus() { document.activeElement = this; this.emit("focusin"); }
  }
  document = new Element("document");
  document.documentElement = new Element("html");
  document.append(document.documentElement);
  document.body = new Element("body"); document.documentElement.append(document.body);
  document.activeElement = document.body;
  document.hidden = false;
  document.createElement = tag => new Element(tag);
  document.getElementById = id => document.querySelector(`#${id}`);
  const game = new Element("div"); game.id = "game"; document.body.append(game);
  class MutationObserver {
    constructor(callback) { this.callback = callback; }
    observe() { observers.add(this); }
    disconnect() { observers.delete(this); }
  }
  const audio = [];
  class Audio {
    constructor(source) { this.source = source; this.playCount = 0; audio.push(this); }
    play() { this.playCount++; return Promise.resolve(); }
  }
  const setTimer = (callback, delay, interval) => {
    const id = ++timerId; timers.set(id, { callback, at: now + delay, interval }); return id;
  };
  const context = vm.createContext({
    document, HTMLElement: Element, MutationObserver, Audio, Image: class {},
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => { writes.push({ key, value }); storage.set(key, value); },
      removeItem: key => storage.delete(key)
    },
    setTimeout: (callback, delay) => setTimer(callback, delay, 0),
    setInterval: (callback, delay) => setTimer(callback, delay, delay),
    clearTimeout: id => timers.delete(id), clearInterval: id => timers.delete(id)
  });
  context.window = context;
  for (const file of ["scenario.js", "dialogue.js", "inspection.js", "script.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), context, { filename: file });
  }
  const run = expression => vm.runInContext(expression, context);
  const query = selector => { const element = game.querySelector(selector); assert.ok(element, `Missing ${selector}`); return element; };
  const flushObservers = () => [...observers].forEach(observer => observer.callback());
  return {
    document, game, run, query, audio, writes, timers, observers,
    get state() { return JSON.parse(run("JSON.stringify({...firstRoomState,openedInbox:[...firstRoomState.openedInbox],openedSent:[...firstRoomState.openedSent]})")); },
    get saved() { return JSON.parse(storage.get("saigononazo-save-v1")); },
    get saveCount() { return writes.filter(write => write.key === "saigononazo-save-v1").length; },
    room(state = {}) { run(`showFirstRoom(${JSON.stringify(state)})`); },
    click(selector) { query(selector).click(); flushObservers(); },
    key(key, shiftKey = false) { const result = document.activeElement.emit("keydown", { key, shiftKey }); flushObservers(); return result; },
    flushObservers,
    tick(duration) {
      const target = now + duration;
      let count = 0;
      while (true) {
        const due = [...timers.entries()].filter(([, timer]) => timer.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        assert.ok(++count < 100000, "Timers must settle");
        const [id, timer] = due; now = timer.at;
        if (timer.interval) timer.at += timer.interval; else timers.delete(id);
        timer.callback();
      }
      now = target; flushObservers();
    },
    finishDialogue() {
      let count = 0;
      while (game.querySelector(".room-dialog-overlay")) {
        assert.ok(++count < 100, "Dialogue must finish");
        query("#roomNextButton").click();
      }
      flushObservers();
    }
  };
}

const unlockedItems = { questionSeen: true, doorInspected: true, viewedWall: "back" };
const allMail = {
  openedInbox: ["inbox-1", "inbox-2", "inbox-3", "inbox-4"],
  openedSent: ["sent-1", "sent-2", "sent-3", "sent-4"]
};

test("old saves restore mail, wall and unlocked state with a safe phone-introduction default", () => {
  const h = harness({ playerName: "テスト", scene: "firstRoom", state: {
    ...unlockedItems, ...allMail, doorUnlocked: true, melodySolved: true, viewedWall: "left"
  } });
  h.click("#continueButton");
  assert.equal(h.state.phoneIntroductionSeen, false);
  assert.equal(h.saved.state.phoneIntroductionSeen, false);
  assert.equal(h.state.viewedWall, "left");
  assert.deepEqual(h.state.openedInbox, allMail.openedInbox);
  assert.deepEqual(h.state.openedSent, allMail.openedSent);
  assert.equal(h.query(".room").classList.contains("is-restored"), true);
  assert.equal(h.query("#doorButton").classList.contains("is-unlocked"), true);
  assert.equal(h.query("#roomBackground").getAttribute("src"), "images/background/room1-left.png");
  assert.equal(h.query('[data-wall="left"]').hidden, false);
  assert.equal(h.query('[data-wall="front"]').hidden, true);
  assert.equal(h.query("#phoneButton").disabled, false);
  assert.equal(h.run('hasCheckedAllMail("inbox") && hasCheckedAllMail("sent")'), true);
  assert.equal(h.game.querySelector(".room-dialog-overlay"), null);
});

test("invalid saved direction falls back to front; direction changes remain saved", () => {
  const h = harness(); h.room({ viewedWall: "missing" });
  assert.equal(h.state.viewedWall, "front");
  h.click("#turnLeftButton");
  assert.equal(h.state.viewedWall, "left");
  assert.equal(h.saved.state.viewedWall, "left");
  h.click("#turnRightButton");
  assert.equal(h.state.viewedWall, "front");
});

test("phone enlargement is manual; closing never consumes or saves the first introduction", () => {
  const h = harness(); h.room(unlockedItems);
  h.query("#phoneButton").focus();
  const saves = h.saveCount;
  h.click("#phoneButton");
  assert.equal(h.query(".inspection-image").src, "images/items/phone-closed.png");
  assert.equal(h.document.activeElement, h.query(".inspection-art-button"));
  h.tick(20000);
  assert.equal(h.game.querySelector(".device-overlay"), null);
  assert.equal(h.game.querySelector(".room-dialog-overlay"), null);
  assert.equal(h.saveCount, saves);
  h.key("Escape");
  assert.equal(h.game.querySelector(".inspection-overlay"), null);
  assert.equal(h.state.phoneIntroductionSeen, false);
  assert.equal(h.saveCount, saves);
  assert.equal(h.document.activeElement, h.query("#phoneButton"));
  assert.equal(h.observers.size, 0);
  h.click("#phoneButton"); h.click(".inspection-close");
  assert.equal(h.state.phoneIntroductionSeen, false);
});

test("first phone use shows exactly two protagonist lines, saves only after completion, then opens inbox", () => {
  const h = harness(); h.room(unlockedItems);
  const saves = h.saveCount;
  h.click("#phoneButton"); h.click(".inspection-art-button");
  assert.equal(h.game.querySelector(".inspection-overlay"), null);
  assert.equal(h.query(".room").inert, true);
  assert.equal(h.state.phoneIntroductionSeen, false);
  h.click("#roomNextButton");
  assert.equal(h.query(".message").textContent, "携帯電話だ。");
  assert.equal(h.query(".message").classList.contains("player"), true);
  assert.equal(h.saveCount, saves);
  h.click("#roomNextButton"); h.click("#roomNextButton");
  assert.equal(h.query(".message").textContent, "中をしらべてみよう。");
  assert.equal(h.saveCount, saves);
  assert.equal(h.state.phoneIntroductionSeen, false);
  h.click("#roomNextButton");
  assert.equal(h.state.phoneIntroductionSeen, true);
  assert.equal(h.saved.state.phoneIntroductionSeen, true);
  assert.equal(h.saveCount, saves + 1);
  assert.equal(h.game.querySelector(".room-dialog-overlay"), null);
  assert.equal(h.query('[data-folder="inbox"]').classList.contains("is-active"), true);
  assert.equal(h.document.activeElement, h.query('[data-folder="inbox"]'));
  h.tick(20000);
  assert.ok(h.query(".phone-screen"));
  h.click(".device-close");
  assert.equal(h.document.activeElement, h.query("#phoneButton"));
  h.click("#phoneButton"); h.click(".inspection-art-button");
  assert.equal(h.game.querySelector(".room-dialog-overlay"), null);
  assert.ok(h.query(".phone-screen"));
  assert.equal(h.saveCount, saves + 1);
  const resumed = harness(h.saved); resumed.click("#continueButton");
  resumed.click("#phoneButton"); resumed.click(".inspection-art-button");
  assert.equal(resumed.game.querySelector(".room-dialog-overlay"), null);
  assert.ok(resumed.query(".phone-screen"));
});

test("all and only the original eight mails remain, including the lemon-doughnut clue", () => {
  const h = harness();
  const mail = JSON.parse(h.run("JSON.stringify(firstRoomScenario.phoneMail)"));
  assert.equal(mail.inbox.length, 4); assert.equal(mail.sent.length, 4);
  assert.deepEqual(mail.inbox.map(item => item.id), allMail.openedInbox);
  assert.deepEqual(mail.sent.map(item => item.id), allMail.openedSent);
  assert.ok(mail.inbox.every(item => item.from === "先輩"));
  assert.ok(mail.sent.every(item => item.to === "先輩"));
  assert.deepEqual(mail.inbox.map(item => item.text), [
    "帰り道の空、夕焼けがきれいだったね。\nお疲れさま！\nトランペット、すごく良くなってたよ。",
    "この調子なら本番も大丈夫！\nファイト！",
    "今度、みんなでドーナツ食べに行こうよ。",
    "いいね！ じゃあ今度探してみよう！\n他にもいろんなお店あるし。"
  ]);
  assert.deepEqual(mail.sent.map(item => item.text), [
    "えっ、そうですか！？\nありがとうございます！\nもっと上手くなれるように頑張ります！",
    "はい！ 頑張ります！",
    "行きたいです！ 楽しみです。\nこの前レモンのドーナツを食べたんですけど、すごくおいしかったので、また食べたいです。",
    "ありがとうございます！\n練習もみんなで頑張れるし、そんな時間があるなんて幸せです。"
  ]);
});

test("AUTO completes phone introduction but never advances enlargement, mail, or piano observation", () => {
  const h = harness(); h.room(unlockedItems);
  h.click("#phoneButton"); h.click(".inspection-art-button"); h.click("#roomAutoButton");
  h.tick(20000);
  assert.equal(h.state.phoneIntroductionSeen, true);
  assert.ok(h.query(".phone-screen"));
  assert.equal(h.timers.size, 0);
  h.tick(20000);
  assert.ok(h.query(".phone-screen"));
  assert.deepEqual(h.state.openedInbox, []);
  h.click(".device-close"); h.click("#phoneButton");
  h.tick(20000);
  assert.ok(h.query(".inspection-overlay"));
  assert.equal(h.game.querySelector(".device-overlay"), null);
  h.click(".inspection-close"); h.click("#turnRightButton");
  h.click("#pianoButton"); h.click(".inspection-art-button");
  h.query("#melodyInput").value = "ソラファミドレドミシ";
  h.tick(20000);
  assert.ok(h.query(".piano-screen"));
  assert.equal(h.state.pianoAttempted, false);
  assert.equal(h.state.melodySolved, false);
  assert.equal(h.timers.size, 0);
});

test("phone modal traps focus and Tab in both directions, saves each read and restores focus on Escape", () => {
  const h = harness(); h.room({ ...unlockedItems, phoneIntroductionSeen: true });
  h.click("#phoneButton"); h.click(".inspection-art-button");
  assert.equal(h.query(".room").inert, true);
  assert.equal(h.query(".phone-screen").getAttribute("role"), "dialog");
  assert.equal(h.query(".phone-screen").getAttribute("aria-modal"), "true");
  h.query("#phoneButton").focus();
  assert.equal(h.document.activeElement, h.query(".device-close"));
  h.key("Tab", true);
  assert.equal(h.document.activeElement, h.query('[data-index="3"]'));
  h.key("Tab");
  assert.equal(h.document.activeElement, h.query(".device-close"));
  for (const folder of ["inbox", "sent"]) {
    h.click(`[data-folder="${folder}"]`);
    for (let index = 0; index < 4; index++) h.click(`[data-index="${index}"]`);
  }
  assert.deepEqual(h.state.openedInbox, allMail.openedInbox);
  assert.deepEqual(h.state.openedSent, allMail.openedSent);
  assert.deepEqual(h.saved.state.openedSent, allMail.openedSent);
  h.key("Escape");
  assert.equal(h.query(".room").inert, false);
  assert.equal(h.document.activeElement, h.query("#phoneButton"));
  assert.equal(h.document.listeners.get("keydown").length, 0);
  assert.equal(h.document.listeners.get("focusin").length, 0);
  assert.equal(h.observers.size, 0);
});

test("correct melody still requires all incoming and outgoing mail, and the missing ド stays incorrect", () => {
  for (const state of [{}, { openedInbox: allMail.openedInbox }, { ...allMail, openedSent: allMail.openedSent.slice(0, 3) }]) {
    const h = harness(); h.room({ ...unlockedItems, ...state, viewedWall: "left" });
    h.click("#pianoButton"); h.click(".inspection-art-button");
    h.query("#melodyInput").value = "ソラファミドレドミシ"; h.click("#playMelodyButton");
    assert.equal(h.query(".piano-result").textContent, "違うようだ。");
    assert.equal(h.state.melodySolved, false);
    assert.equal(h.saved.state.pianoAttempted, true);
  }
  const h = harness(); h.room({ ...unlockedItems, ...allMail, viewedWall: "left" });
  h.click("#pianoButton"); h.click(".inspection-art-button");
  h.query("#melodyInput").value = "ソラファミドレミシ"; h.click("#playMelodyButton");
  assert.equal(h.state.melodySolved, false);
  assert.equal(h.query(".piano-result").textContent, "違うようだ。");
});

test("piano closes accessibly; correct play cleans up its modal before memory and unlocks only afterward", () => {
  const h = harness(); h.room({ ...unlockedItems, ...allMail, viewedWall: "left" });
  h.click("#pianoButton"); h.click(".inspection-art-button");
  assert.equal(h.document.activeElement, h.query("#melodyInput"));
  assert.equal(h.query(".room").inert, true);
  h.key("Tab"); assert.equal(h.document.activeElement, h.query("#playMelodyButton"));
  h.key("Tab"); assert.equal(h.document.activeElement, h.query(".device-close"));
  h.key("Tab", true); assert.equal(h.document.activeElement, h.query("#playMelodyButton"));
  h.key("Escape");
  assert.equal(h.query(".room").inert, false);
  assert.equal(h.document.activeElement, h.query("#pianoButton"));
  h.click("#pianoButton"); h.click(".inspection-art-button"); h.click(".device-close");
  assert.equal(h.document.activeElement, h.query("#pianoButton"));
  h.click("#pianoButton"); h.click(".inspection-art-button");
  h.query("#melodyInput").value = "ソ ラ、ファ・ミ,ド。レドミシ";
  h.click("#playMelodyButton");
  assert.equal(h.state.melodySolved, true);
  assert.equal(h.saved.state.melodySolved, true);
  assert.equal(h.state.doorUnlocked, false);
  assert.equal(h.query("#melodyInput").disabled, true);
  assert.equal(h.query("#playMelodyButton").textContent, "続ける");
  assert.equal(h.audio.find(item => item.source === "audio/memory_melody_piano.wav").playCount, 1);
  h.query(".device-close").focus(); h.key("Tab");
  assert.equal(h.document.activeElement, h.query("#playMelodyButton"));
  h.click("#playMelodyButton");
  assert.equal(h.game.querySelector(".device-overlay"), null);
  assert.equal(h.document.listeners.get("keydown").length, 0);
  assert.equal(h.document.listeners.get("focusin").length, 0);
  assert.equal(h.observers.size, 0);
  assert.equal(h.query(".room").inert, true); // Now owned by memory dialogue.
  assert.equal(h.document.activeElement, h.query("#roomNextButton"));
  h.finishDialogue();
  assert.equal(h.state.doorUnlocked, true);
  assert.equal(h.saved.state.doorUnlocked, true);
  assert.equal(h.query(".room").classList.contains("is-restored"), true);
  assert.equal(h.query(".room").inert, false);
  assert.equal(h.timers.size, 0);
});

test("partially solved old saves resume memory and unlock after dialogue without replaying piano", () => {
  const h = harness(); h.room({ ...unlockedItems, ...allMail, melodySolved: true, doorUnlocked: false });
  assert.ok(h.query(".room-dialog-overlay"));
  assert.equal(h.state.phoneIntroductionSeen, false);
  assert.equal(h.state.doorUnlocked, false);
  h.finishDialogue();
  assert.equal(h.state.doorUnlocked, true);
  assert.equal(h.audio.find(item => item.source === "audio/memory_melody_piano.wav").playCount, 0);
});

test("externally removed inspection and device overlays release their event ownership", () => {
  const h = harness(); h.room({ ...unlockedItems, phoneIntroductionSeen: true });
  h.click("#phoneButton"); h.query(".inspection-overlay").remove(); h.flushObservers();
  assert.equal(h.observers.size, 0);
  assert.equal(h.document.listeners.get("keydown").length, 0);
  h.click("#phoneButton"); h.click(".inspection-art-button");
  h.query(".device-overlay").remove(); h.flushObservers();
  assert.equal(h.query(".room").inert, false);
  assert.equal(h.observers.size, 0);
  assert.equal(h.document.listeners.get("keydown").length, 0);
  assert.equal(h.document.listeners.get("focusin").length, 0);
});
