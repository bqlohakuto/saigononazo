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
    emit(name, event) { listeners.get(name)?.(event); }
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
      this.currentTime = 12;
      this.sources = [];
      this.gains = [];
      this.resumes = 0;
      this.suspends = 0;
      contexts.push(this);
    }
    resume() { this.resumes++; this.state = "running"; return Promise.resolve(); }
    suspend() { this.suspends++; this.state = "suspended"; this.emit("statechange"); return Promise.resolve(); }
    createGain() {
      const gain = {
        value: 1, events: [],
        cancelScheduledValues(time) { this.events.push(["cancel", time]); },
        setValueAtTime(value, time) { this.events.push(["set", value, time]); this.value = value; },
        linearRampToValueAtTime(value, time) { this.events.push(["ramp", value, time]); }
      };
      const node = { gain, connect() {}, disconnect() { this.disconnected = true; } };
      this.gains.push(node);
      return node;
    }
    createBufferSource() {
      const node = {
        loop: true, starts: 0, stops: 0,
        connect() {}, start() { this.starts++; }, stop(time) { this.stops++; this.stopAt = time; },
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
  await audio.play("memoryMelody");
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
    if (action === "hidden") assert.equal(await audio.play("memoryMelody"), false);
    document.hidden = false;
    await audio.unlock();
    assert.equal(contexts[0].sources.length, 0, action);
  }
});

test("fade cue cancels a memory band that is still loading", async () => {
  const file = deferred();
  const { audio, contexts } = harness({
    fetch: url => url.includes("memory_band") ? file.promise : Promise.resolve(response())
  });
  const pending = audio.play("memoryBand");
  assert.equal(audio.fadeOut("memoryBand", 2000), false);
  file.resolve(response());
  assert.equal(await pending, false);
  assert.equal(contexts[0].sources.length, 0);
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

test("memory band fades to silence and stops at the requested time only while active", async () => {
  const { audio, contexts } = harness();
  assert.equal(audio.fadeOut("memoryBand", 1500), false);
  assert.equal(await audio.play("memoryBand"), true);
  const context = contexts[0], source = context.sources[0], gain = context.gains[1].gain;
  assert.equal(audio.fadeOut("memoryBand", 1500), true);
  assert.deepEqual(gain.events, [
    ["cancel", 12],
    ["set", 0.65, 12],
    ["ramp", 0, 13.5]
  ]);
  assert.equal(source.stopAt, 13.5);
  assert.equal(audio.fadeOut("memoryBand", 1500), true);
  assert.equal(source.stops, 1);
  source.onended();
  assert.equal(source.disconnected, true);
  assert.equal(audio.fadeOut("memoryBand", 1500), false);
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
  assert.equal(audio.fadeOut("tinnitus", 1500), false);
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


test("new effects decode, play once, and follow the SE category volume", async () => {
  const { audio, contexts } = harness();
  audio.setCategoryVolumes(1, 0.25);
  for (const id of ["footsteps", "doorUnlock", "doorOpen", "fridgeOpen", "fridgeClose"]) {
    assert.equal(await audio.play(id), true, id);
    const ctx = contexts[0], node = ctx.sources.at(-1);
    assert.equal(node.loop, false);
    assert.equal(node.starts, 1);
    assert.equal(ctx.gains.at(-1).gain.value, 0.65 * 0.25);
    audio.stopAll();
    assert.equal(node.disconnected, true);
  }
});
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('memory ambience loops without restarting on pages and follows scene boundaries', async()=>{
 const {audio,contexts}=harness();
 audio.syncMemoryAmbience('room2_memory_015');await tick();assert.equal(contexts.length,0);
 audio.syncMemoryAmbience('room2_memory_054');await tick();const c=contexts[0],first=c.sources[0];
 assert.equal(first.loop,true);assert.equal(first.starts,1);
 assert.deepEqual(c.gains.at(-1).gain.events,[['set',0,12],['ramp',0.30,12.4]]);
 audio.syncMemoryAmbience('room2_memory_054_02');audio.syncMemoryAmbience('room2_final_hanamaru_01');await tick();assert.equal(c.sources.length,1);
 audio.syncMemoryAmbience('room2_memory_096');assert.equal(first.disconnected,true);
 audio.syncMemoryAmbience('room3_flashback_34_02');await tick();assert.equal(c.sources.length,2);assert.equal(c.sources[1].loop,true);
 audio.syncMemoryAmbience('room3_flashback_71');await tick();assert.equal(c.sources.length,2);
 audio.syncMemoryAmbience('room3_flashback_72');assert.equal(c.sources[1].disconnected,true);
});
test('stopping or leaving during ambience decoding cancels playback and permits later resume',async()=>{
 const load=deferred();const {audio,contexts}=harness({fetch:()=>load.promise});
 audio.syncMemoryAmbience('room3_flashback_50');audio.stopMemoryAmbience();load.resolve(response());await tick();assert.equal(contexts[0].sources.length,0);
 audio.syncMemoryAmbience('room3_flashback_50');await tick();assert.equal(contexts[0].sources.length,1);
 audio.stopAll();audio.syncMemoryAmbience('room3_flashback_51');await tick();assert.equal(contexts[0].sources.length,2);
});

test('title and exploration music switch once, stay continuous across rooms, and stop in memories',async()=>{
 const {audio,contexts}=harness();
 audio.syncSceneMusic('title');await tick();const c=contexts[0];assert.equal(c.sources[0].loop,true);
 audio.syncSceneMusic('title');await tick();assert.equal(c.sources.length,1);
 audio.syncSceneMusic('opening');assert.equal(c.sources[0].disconnected,true);
 audio.syncSceneMusic('room01');await tick();assert.equal(c.sources.length,2);
 audio.syncSceneMusic('room07','r7_book_01');await tick();assert.equal(c.sources.length,2);
 audio.syncSceneMusic('room01','room1_piano_correct_04');assert.equal(c.sources[1].disconnected,true);
 audio.syncSceneMusic('room03','room3_flashback_34');await tick();assert.equal(c.sources.length,2);
 audio.syncSceneMusic('room03','room3_after_01');await tick();assert.equal(c.sources.length,3);
 audio.syncSceneMusic('room08');assert.equal(c.sources[2].disconnected,true);
});
test('BGM and ambience obey separate categories, including mute during fade-in',async()=>{
 const {audio,contexts}=harness();audio.setCategoryVolumes(0.2,0.4);
 audio.syncSceneMusic('title');await tick();const c=contexts[0],music=c.gains.at(-1);
 assert.deepEqual(music.gain.events.at(-1),['ramp',0.35*0.2,12.4]);
 audio.syncMemoryAmbience('room3_flashback_34');await tick();const ambient=c.gains.at(-1);
 assert.deepEqual(ambient.gain.events.at(-1),['ramp',0.25*0.4,12.4]);
 audio.setCategoryVolumes(0,0.5);assert.equal(music.gain.value,0);assert.equal(ambient.gain.value,0.125);
 assert.deepEqual(music.gain.events.at(-1),['cancel',12]);
});
test('music retry after interruption respects the desired scene and stopAll clears it',async()=>{
 const {audio,contexts}=harness();audio.syncSceneMusic('title');await tick();const c=contexts[0];
 c.state='interrupted';c.emit('statechange');assert.equal(c.sources[0].disconnected,true);
 audio.resumeMusic();await tick();assert.equal(c.sources.length,2);
 audio.stopAll();audio.resumeMusic();await tick();assert.equal(c.sources.length,2);
});
test('switching scenes while music is loading prevents a stale title from starting',async()=>{
 const file=deferred();const {audio,contexts}=harness({fetch:()=>file.promise});
 audio.syncSceneMusic('title');audio.syncSceneMusic('opening');file.resolve(response());await tick();assert.equal(contexts[0].sources.length,0);
 audio.resumeMusic();await tick();assert.equal(contexts[0].sources.length,0);
});

test('after-school ambience switches to the quiet classroom when helping the senior',async()=>{
 const {audio,contexts}=harness();
 audio.syncMemoryAmbience('room2_memory_016_01');await tick();const c=contexts[0],busy=c.sources[0];assert.equal(busy.loop,true);
 audio.syncMemoryAmbience('room2_memory_053_flower_02_01');await tick();assert.equal(c.sources.length,1);
 audio.syncMemoryAmbience('room2_memory_054_01');await tick();assert.equal(busy.disconnected,true);assert.equal(c.sources.length,2);
 audio.syncMemoryAmbience('room2_memory_096');assert.equal(c.sources[1].disconnected,true);
});
test('nature ambience continues across all walk source IDs and stops on whiteout',async()=>{
 const {audio,contexts}=harness();audio.syncMemoryAmbience('r6_memory_full_050');await tick();assert.equal(contexts.length,0);
 for(const id of ['r6_memory_full_051_01','r6_final_signal_01','r6_memory_full_064','r6_memory_01','r6_memory_07_01','r6_memory_full_072','r6_memory_full_085'])audio.syncMemoryAmbience(id);
 await tick();const c=contexts[0];assert.equal(c.sources.length,1);assert.equal(c.sources[0].loop,true);
 audio.syncMemoryAmbience('r6_memory_full_086_01');assert.equal(c.sources[0].disconnected,true);
});
test('room seven changes from city road to intersection before impact, then goes silent',async()=>{
 const {audio,contexts}=harness();audio.syncMemoryAmbience('r7_mem_01');await tick();const c=contexts[0],street=c.sources[0];
 audio.syncMemoryAmbience('r7_mem_25_01');await tick();assert.equal(c.sources.length,1);
 audio.syncMemoryAmbience('r7_mem_26_01');await tick();assert.equal(street.disconnected,true);assert.equal(c.sources.length,2);
 audio.syncMemoryAmbience('r7_mem_34');await tick();assert.equal(c.sources.length,2);
 audio.syncMemoryAmbience('r7_mem_35_01');assert.equal(c.sources[1].disconnected,true);
 audio.syncMemoryAmbience('r7_mem_37');await tick();assert.equal(c.sources.length,2);
});


test('UI clicks replace each other, follow SE volume and never interrupt music', async () => {
  const {audio, contexts}=harness();
  audio.setCategoryVolumes(0.5,0.4);
  await audio.play('titleMusic');
  const c=contexts[0], music=c.sources[0];
  await audio.play('uiClick'); const first=c.sources[1];
  assert.equal(c.gains.at(-1).gain.value,0.22*0.4);
  await audio.play('uiClick'); assert.equal(first.disconnected,true);
  assert.equal(music.disconnected,undefined);
  audio.setCategoryVolumes(0.5,0); assert.equal(c.gains.at(-1).gain.value,0);
  c.emit('statechange');
  c.state='interrupted';c.emit('statechange');
  assert.equal(c.sources.at(-1).disconnected,true);
});

test('a pending click is cancelled by an authored sound or by leaving the page',async()=>{
  for(const action of ['effect','hide']) {
    const file=deferred();const {audio,contexts,window}=harness({fetch:()=>file.promise});
    const click=audio.play('uiClick');
    const effect=action==='effect'?audio.play('doorOpen'):null;
    if(action==='hide')window.emit('pagehide');
    file.resolve(response());assert.equal(await click,false);
    if(effect)assert.equal(await effect,true);
    assert.equal(contexts[0].sources.length,action==='effect'?1:0);
  }
});

test('one delegated click handles nested targets and ignores disabled or protected controls',async()=>{
  const {document,contexts}=harness();
  const button={disabled:false,getAttribute:()=>null,closest:()=>null,matches:()=>false};
  const click=()=>document.emit('click',{target:{closest:()=>button}});
  click();await tick();assert.equal(contexts[0].sources.length,1);
  button.disabled=true;click();await tick();assert.equal(contexts[0].sources.length,1);
  button.disabled=false;button.matches=()=>true;click();await tick();assert.equal(contexts[0].sources.length,1);
  button.matches=()=>false;button.closest=()=>({});click();await tick();assert.equal(contexts[0].sources.length,1);
});

test('slow-loading UI clicks expire instead of sounding during a later scene',async()=>{
  const file=deferred();const {audio,contexts}=harness({fetch:()=>file.promise});
  const pending=audio.play('uiClick');
  await new Promise(resolve=>setTimeout(resolve,220));file.resolve(response());
  assert.equal(await pending,false);assert.equal(contexts[0].sources.length,0);
});


test('answer feedback replaces opposite feedback and click while keeping BGM playing',async()=>{
 const {audio,contexts}=harness();audio.setCategoryVolumes(0.5,0.6);
 await audio.play('explorationMusic');const c=contexts[0],music=c.sources[0];
 await audio.play('uiClick');const click=c.sources.at(-1);
 await audio.play('answerIncorrect');const incorrect=c.sources.at(-1);
 assert.equal(click.disconnected,true);assert.equal(c.gains.at(-1).gain.value,0.40*0.6);
 await audio.play('answerCorrect');assert.equal(incorrect.disconnected,true);
 assert.equal(c.gains.at(-1).gain.value,0.30*0.6);assert.equal(music.disconnected,undefined);
 const correct=c.sources.at(-1);await audio.play('answerCorrect');assert.equal(correct.disconnected,true);
 audio.setCategoryVolumes(0.5,0);assert.equal(c.gains.at(-1).gain.value,0);
 c.sources.at(-1).onended();assert.equal(c.sources.at(-1).disconnected,true);
});

test('pending result feedback is cancelled on hide and expires after a slow load',async()=>{
 for(const hide of [true,false]){
  const file=deferred();const {audio,contexts,window}=harness({fetch:()=>file.promise});
  const pending=audio.play('answerCorrect');
  if(hide)window.emit('pagehide');else await new Promise(resolve=>setTimeout(resolve,520));
  file.resolve(response());assert.equal(await pending,false);assert.equal(contexts[0].sources.length,0);
 }
});


test('authored melody cancels result feedback, including while the result is still loading',async()=>{
 const file=deferred();const {audio,contexts}=harness({fetch:()=>file.promise});
 const result=audio.play('answerCorrect');const melody=audio.play('memoryMelody');
 file.resolve(response());assert.equal(await result,false);assert.equal(await melody,true);
 assert.equal(contexts[0].sources.length,1);
});
