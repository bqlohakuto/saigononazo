const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../game-audio.js"), "utf8");

function events() {
  const listeners = new Map();
  return {
    addEventListener(name, fn) { listeners.set(name, fn); },
    emit(name) { listeners.get(name)?.(); }
  };
}
function response() {
  return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
}
function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}
function harness(options = {}) {
  const contexts = [];
  class AudioContext {
    constructor() {
      Object.assign(this, events());
      this.state = "suspended";
      this.destination = {};
      this.sources = [];
      this.gains = [];
      this.resumes = 0;
      this.suspends = 0;
      contexts.push(this);
    }
    resume() { this.resumes++; this.state = "running"; return Promise.resolve(); }
    suspend() { this.suspends++; this.state = "suspended"; this.emit("statechange"); return Promise.resolve(); }
    createGain() {
      const node = { gain: { value: 1 }, connect() {}, disconnect() { this.disconnected = true; } };
      this.gains.push(node);
      return node;
    }
    createBufferSource() {
      const node = {
        loop: true, starts: 0, stops: 0,
        connect() {}, start() { this.starts++; }, stop() { this.stops++; },
        disconnect() { this.disconnected = true; }
      };
      this.sources.push(node);
      return node;
    }
    decodeAudioData(data) { return Promise.resolve(options.decode ? options.decode(data) : { decoded: true }); }
  }
  const document = { hidden: false, ...events() };
  const window = {
    ...events(), navigator: { audioSession: {} },
    fetch: options.fetch || (async () => response())
  };
  if (!options.unsupported) window.AudioContext = AudioContext;
  vm.runInNewContext(source, { window, document });
  return { audio: window.GameAudio, contexts, document, window };
}

test("unlock resumes synchronously; ended and interrupted one-shots never replay on unlock", async () => {
  const { audio, contexts, window } = harness();
  assert.equal(contexts.length, 0);
  const unlocked = audio.unlock();
  assert.equal(contexts.length, 1);
  const context = contexts[0];
  assert.equal(context.resumes, 1);
  assert.equal(window.navigator.audioSession.type, "ambient");
  assert.equal(await unlocked, true);
  assert.equal(await audio.play("tinnitus"), true);
  const first = context.sources[0];
  assert.equal(first.loop, false);
  assert.equal(first.starts, 1);
  first.onended();
  assert.equal(first.disconnected, true);
  assert.equal(context.gains[1].disconnected, true);
  await audio.unlock();
  assert.equal(context.sources.length, 1);
  await audio.play("doorOpen");
  const second = context.sources[1];
  context.state = "interrupted";
  context.emit("statechange");
  assert.equal(second.disconnected, true);
  await audio.unlock();
  assert.equal(second.starts, 1);
  assert.equal(context.sources.length, 2);
});

test("stop, hidden, and pagehide cancel a sound waiting for its file", async () => {
  for (const action of ["stop", "hidden", "pagehide"]) {
    const file = deferred();
    const { audio, contexts, document, window } = harness({
      fetch: url => url.includes("tinnitus") ? file.promise : Promise.resolve(response())
    });
    const pending = audio.play("tinnitus");
    if (action === "stop") audio.stop("tinnitus");
    if (action === "hidden") { document.hidden = true; document.emit("visibilitychange"); }
    if (action === "pagehide") window.emit("pagehide");
    file.resolve(response());
    assert.equal(await pending, false, action);
    assert.equal(contexts[0].sources.length, 0, action);
    if (action !== "stop") assert.equal(contexts[0].suspends, 1, action);
    if (action === "hidden") assert.equal(await audio.play("doorOpen"), false);
    document.hidden = false;
    await audio.unlock();
    assert.equal(contexts[0].sources.length, 0, action);
  }
});

test("a repeated sound id replaces its source and stopAll disconnects it", async () => {
  const { audio, contexts } = harness();
  await audio.play("memoryMelody");
  await audio.play("memoryMelody");
  const [first, second] = contexts[0].sources;
  assert.equal(first.stops, 1);
  assert.equal(first.disconnected, true);
  assert.notEqual(first, second);
  assert.equal(second.starts, 1);
  audio.stopAll();
  assert.equal(second.disconnected, true);
});

test("master volume supports zero before and during playback and clamps its range", async () => {
  const { audio, contexts } = harness();
  audio.setVolume(0);
  await audio.play("tinnitus");
  const [master, sound] = contexts[0].gains;
  assert.equal(master.gain.value, 0);
  assert.equal(sound.gain.value, 0.5);
  audio.setVolume(0.25);
  assert.equal(master.gain.value, 0.25);
  audio.setVolume(0);
  assert.equal(master.gain.value, 0);
  audio.setVolume(2);
  assert.equal(master.gain.value, 1);
  audio.setVolume(-1);
  assert.equal(master.gain.value, 0);
});

test("missing Web Audio stays silent and every public operation remains safe", async () => {
  const { audio, contexts, window } = harness({ unsupported: true });
  assert.equal(await audio.unlock(), false);
  assert.equal(await audio.play("tinnitus"), false);
  assert.equal(await audio.play("unknown"), false);
  audio.setVolume(0);
  audio.stop("tinnitus");
  audio.stopAll();
  window.emit("pagehide");
  assert.equal(contexts.length, 0);
});

test("a failed fetch or decode is retried on the next play", async () => {
  for (const failure of ["fetch", "decode"]) {
    let fetches = 0, decodes = 0;
    const { audio } = harness({
      fetch: async url => {
        if (url.includes("tinnitus") && ++fetches === 1 && failure === "fetch") throw new Error("offline");
        return response();
      },
      decode: () => {
        if (++decodes === 1 && failure === "decode") throw new Error("invalid audio");
        return { decoded: true };
      }
    });
    assert.equal(await audio.play("tinnitus"), false, failure);
    assert.equal(await audio.play("tinnitus"), true, failure);
    assert.equal(fetches, 2, failure);
  }
});
