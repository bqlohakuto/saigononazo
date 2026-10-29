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
 audio.syncMemoryAmbience('room3_flashback_34');await tick();const c=contexts[0],first=c.sources[0];
 assert.equal(first.loop,true);assert.equal(first.starts,1);
 audio.syncMemoryAmbience('room3_flashback_34_02');await tick();assert.equal(c.sources.length,1);
 audio.syncMemoryAmbience('room3_flashback_71');assert.equal(c.sources.length,1);
 audio.syncMemoryAmbience('room3_flashback_72');assert.equal(first.disconnected,true);
});

test('stopping or leaving during ambience decoding cancels playback and permits later resume',async()=>{
 const load=deferred();const {audio,contexts}=harness({fetch:()=>load.promise});
 audio.syncMemoryAmbience('room3_flashback_50');audio.stopMemoryAmbience();load.resolve(response());await tick();assert.equal(contexts[0].sources.length,0);
 audio.syncMemoryAmbience('room3_flashback_50');await tick();assert.equal(contexts[0].sources.length,1);
 audio.stopAll();audio.syncMemoryAmbience('room3_flashback_51');await tick();assert.equal(contexts[0].sources.length,2);
});

test('title, exploration and memory music follow scene boundaries without restarting within a phase',async()=>{
 const {audio,contexts}=harness();audio.syncSceneMusic('title');await tick();const c=contexts[0];
 audio.syncSceneMusic('title');await tick();assert.equal(c.sources.length,1);
 audio.syncSceneMusic('opening');assert.equal(c.sources[0].stopAt,12.65);
 audio.syncSceneMusic('room01');await tick();const exploration=c.sources.at(-1);
 audio.syncSceneMusic('room07','r7_book_01');await tick();assert.equal(c.sources.length,2);
 audio.syncSceneMusic('room01','room1_piano_correct_04');assert.equal(exploration.stopAt,12.65);
 audio.syncSceneMusic('room03','room3_flashback_34');await tick();const memory=c.sources.at(-1);
 assert.equal(memory.loop,true);assert.deepEqual(c.gains.at(-1).gain.events.at(-1),['ramp',0.22,12.4]);
 audio.syncSceneMusic('room03','room3_flashback_35');await tick();assert.equal(c.sources.length,3);
 audio.syncSceneMusic('room03','room3_after_01');await tick();assert.equal(memory.stopAt,12.65);assert.equal(c.sources.length,4);
 audio.syncSceneMusic('room08');assert.equal(c.sources.at(-1).stopAt,12.65);
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

test('helping the senior stops school ambience and adds no classroom loop',async()=>{
 const {audio,contexts}=harness();
 audio.syncMemoryAmbience('room2_memory_016_01');await tick();const c=contexts[0],busy=c.sources[0];
 audio.syncMemoryAmbience('room2_memory_053_flower_02_01');await tick();assert.equal(c.sources.length,1);
 audio.syncMemoryAmbience('room2_memory_054_01');await tick();assert.equal(busy.disconnected,true);assert.equal(c.sources.length,1);
 audio.syncMemoryAmbience('room2_final_hanamaru');await tick();assert.equal(c.sources.length,1);
});

test('nature ambience continues across all walk source IDs and stops on whiteout',async()=>{
 const {audio,contexts}=harness();audio.syncMemoryAmbience('r6_memory_full_050');await tick();assert.equal(contexts.length,0);
 for(const id of ['r6_memory_full_051_01','r6_final_signal_01','r6_memory_full_064','r6_memory_01','r6_memory_07_01','r6_memory_full_072','r6_memory_full_085'])audio.syncMemoryAmbience(id);
 await tick();const c=contexts[0];assert.equal(c.sources.length,1);assert.equal(c.sources[0].loop,true);
 audio.syncMemoryAmbience('r6_memory_full_086_01');assert.equal(c.sources[0].disconnected,true);
});
test('room seven moves through street, intersection, braking, impact and silence',async()=>{
 const {audio,contexts}=harness();audio.syncMemoryAmbience('r7_mem_01');await tick();const c=contexts[0],street=c.sources[0];
 audio.syncMemoryAmbience('r7_mem_25_01');await tick();assert.equal(c.sources.length,1);
 audio.syncMemoryAmbience('r7_mem_26_01');await tick();assert.equal(street.disconnected,true);assert.equal(c.sources.length,2);
 const crossing=c.sources[1];audio.syncMemoryAmbience('r7_mem_32');await tick();const brake=c.sources[2];
 assert.equal(brake.loop,false);assert.equal(c.gains.at(-1).gain.value,0.50);
 for(const id of ['r7_mem_32_01','r7_mem_33','r7_mem_34'])audio.syncMemoryAmbience(id);
 await tick();assert.equal(c.sources.length,3);assert.equal(crossing.disconnected,undefined);
 audio.syncMemoryAmbience('r7_mem_35_01');await tick();assert.equal(crossing.disconnected,true);assert.equal(brake.disconnected,true);
 const impact=c.sources[3];assert.equal(impact.loop,false);assert.equal(c.gains.at(-1).gain.value,0.55);
 audio.syncMemoryAmbience('r7_mem_35_02');await tick();assert.equal(c.sources.length,4);
 audio.syncMemoryAmbience('r7_mem_36');assert.equal(impact.disconnected,true);
 audio.syncMemoryAmbience('r7_mem_37');await tick();assert.equal(c.sources.length,4);
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


test('lever replaces UI click, follows SE volume and yields to result without stopping BGM',async()=>{
 const {audio,contexts}=harness();audio.setCategoryVolumes(0.5,0.4);
 await audio.play('titleMusic');const c=contexts[0],music=c.sources[0];
 await audio.play('uiClick');const click=c.sources.at(-1);
 await audio.play('leverPull');const lever=c.sources.at(-1);
 assert.equal(click.disconnected,true);assert.equal(c.gains.at(-1).gain.value,0.35*0.4);
 await audio.play('answerIncorrect');assert.equal(lever.disconnected,true);assert.equal(music.disconnected,undefined);
 audio.setCategoryVolumes(0.5,0);await audio.play('leverPull');assert.equal(c.gains.at(-1).gain.value,0);
});

test('lever waiting for decoding is cancelled by result or page hide, and expires after 200ms',async()=>{
 for(const action of ['result','hide','slow']){
  const file=deferred();const {audio,contexts,window}=harness({fetch:()=>file.promise});
  const lever=audio.play('leverPull');let result;
  if(action==='result')result=audio.play('answerCorrect');
  if(action==='hide')window.emit('pagehide');
  if(action==='slow')await new Promise(resolve=>setTimeout(resolve,220));
  file.resolve(response());assert.equal(await lever,false);
  if(result)assert.equal(await result,true);
  assert.equal(contexts[0].sources.length,action==='result'?1:0);
 }
});


test('fast accident advance cancels brake and impact still waiting for decoding',async()=>{
 const file=deferred();const {audio,contexts}=harness({fetch:()=>file.promise});
 audio.syncMemoryAmbience('r7_mem_32');audio.syncMemoryAmbience('r7_mem_35');audio.syncMemoryAmbience('r7_mem_36');
 file.resolve(response());await tick();assert.equal(contexts[0].sources.length,0);
});

test('accident sources do not replay on pagination, after ending, or after page hide',async()=>{
 for(const beat of [32,35]){
  const {audio,contexts,window}=harness();audio.syncMemoryAmbience('r7_mem_'+beat);await tick();
  const c=contexts[0],source=c.sources.find(s=>!s.loop),count=c.sources.length;
  source.onended();audio.syncMemoryAmbience('r7_mem_'+beat+'_01');await tick();assert.equal(c.sources.length,count);
  window.emit('pagehide');await audio.unlock();audio.syncMemoryAmbience('r7_mem_'+beat+'_02');await tick();
  // Intersection ambience may resume; the one-shot must not.
  assert.equal(c.sources.filter(s=>!s.loop).length,1);
  audio.stopMemoryAmbience();audio.syncMemoryAmbience('r7_mem_'+beat);await tick();assert.equal(c.sources.filter(s=>!s.loop).length,2);
 }
});

test('leaving accident memory cancels pending sound and crash follows SE mute',async()=>{
 const file=deferred();const h=harness({fetch:()=>file.promise});h.audio.syncMemoryAmbience('r7_mem_35');h.audio.stopMemoryAmbience();
 file.resolve(response());await tick();assert.equal(h.contexts[0].sources.length,0);
 const {audio,contexts}=harness();audio.setCategoryVolumes(1,0);audio.syncMemoryAmbience('r7_mem_35');await tick();
 assert.equal(contexts[0].gains.at(-1).gain.value,0);audio.setCategoryVolumes(1,0.4);assert.equal(contexts[0].gains.at(-1).gain.value,0.55*0.4);
 audio.syncMemoryAmbience('r8_entry_01');assert.equal(contexts[0].sources[0].disconnected,true);
});


test('map writing follows its source line once, stops at completion, and obeys SE volume',async()=>{
 const {audio,contexts}=harness();audio.setCategoryVolumes(1,0.4);
 audio.syncMemoryAmbience('r6_fullmap_03');await tick();assert.equal(contexts.length,0);
 audio.syncMemoryAmbience('r6_fullmap_draw');await tick();const c=contexts[0],write=c.sources[0];
 assert.equal(write.loop,false);assert.equal(c.gains.at(-1).gain.value,0.45*0.4);
 audio.syncMemoryAmbience('r6_fullmap_draw_01');await tick();assert.equal(c.sources.length,1);
 audio.syncMemoryAmbience('r6_fullmap_done');assert.equal(write.disconnected,true);
 audio.syncMemoryAmbience('r6_fullmap_04');await tick();assert.equal(c.sources.length,1);
});

test('map handover unfolds once and completed writing never restarts on pagination or app resume',async()=>{
 const {audio,contexts,window}=harness();
 audio.syncMemoryAmbience('r6_map_03');await tick();const c=contexts[0];assert.equal(c.gains.at(-1).gain.value,0.30);
 audio.syncMemoryAmbience('r6_map_03_01');await tick();assert.equal(c.sources.length,1);
 audio.syncMemoryAmbience('r6_map_04');assert.equal(c.sources[0].disconnected,true);
 audio.syncMemoryAmbience('r6_fullmap_draw');await tick();c.sources.at(-1).onended();
 audio.syncMemoryAmbience('r6_fullmap_draw_01');await tick();assert.equal(c.sources.length,2);
 window.emit('pagehide');await audio.unlock();audio.syncMemoryAmbience('r6_fullmap_draw_02');await tick();assert.equal(c.sources.length,2);
});

test('skipping or leaving map drawing cancels pending decoding, and unfold respects mute',async()=>{
 for(const leave of [false,true]){
  const file=deferred();const {audio,contexts}=harness({fetch:()=>file.promise});
  audio.syncMemoryAmbience('r6_fullmap_draw');if(leave)audio.stopMemoryAmbience();else audio.syncMemoryAmbience('r6_fullmap_done');
  file.resolve(response());await tick();assert.equal(contexts[0].sources.length,0);
 }
 const {audio,contexts}=harness();audio.setCategoryVolumes(1,0);await audio.play('mapUnfold');assert.equal(contexts[0].gains.at(-1).gain.value,0);
});


test('phone rings only at the source ringtone cue and stops when the call is answered',async()=>{
 const {audio,contexts}=harness();
 audio.syncMemoryAmbience('room3_flashback_04');await tick();assert.equal(contexts.length,0);
 audio.syncMemoryAmbience('room3_final_ringtone');await tick();const c=contexts[0],ring=c.sources[0];
 assert.equal(ring.loop,false);assert.equal(c.gains.at(-1).gain.value,0.35);
 audio.syncMemoryAmbience('room3_final_ringtone_01');await tick();assert.equal(c.sources.length,1);
 audio.syncMemoryAmbience('room3_flashback_04_call');assert.equal(ring.disconnected,true);
 audio.syncMemoryAmbience('room3_flashback_05');await tick();assert.equal(c.sources.length,1);
});

test('ringtone never restarts after ending or app interruption; fresh memory entry can play once',async()=>{
 const {audio,contexts,window}=harness();audio.syncMemoryAmbience('room3_final_ringtone');await tick();const c=contexts[0];
 c.sources[0].onended();audio.syncMemoryAmbience('room3_final_ringtone_01');await tick();assert.equal(c.sources.length,1);
 window.emit('pagehide');await audio.unlock();audio.syncMemoryAmbience('room3_final_ringtone_02');await tick();assert.equal(c.sources.length,1);
 audio.stopMemoryAmbience();audio.syncMemoryAmbience('room3_final_ringtone');await tick();assert.equal(c.sources.length,2);
});

test('answering or leaving while ringtone decodes cancels it; ringtone follows SE mute',async()=>{
 for(const leave of [false,true]){
  const file=deferred();const {audio,contexts}=harness({fetch:()=>file.promise});
  audio.syncMemoryAmbience('room3_final_ringtone');if(leave)audio.stopMemoryAmbience();else audio.syncMemoryAmbience('room3_flashback_04_call');
  file.resolve(response());await tick();assert.equal(contexts[0].sources.length,0);
 }
 const {audio,contexts}=harness();audio.setCategoryVolumes(1,0);audio.syncMemoryAmbience('room3_final_ringtone');await tick();
 assert.equal(contexts[0].gains.at(-1).gain.value,0);audio.setCategoryVolumes(1,0.4);assert.equal(contexts[0].gains.at(-1).gain.value,0.35*0.4);
});


test('ringtone source keeps the same memory music instead of restarting exploration BGM',async()=>{
 const {audio,contexts}=harness();
 for(const id of ['room3_flashback_04','room3_final_ringtone','room3_final_ringtone_01','room3_flashback_04_call'])audio.syncSceneMusic('room03',id);
 await tick();assert.equal(contexts[0].sources.length,1);assert.deepEqual(contexts[0].gains.at(-1).gain.events.at(-1),['ramp',0.22,12.4]);
});


test('book page sound replaces click and previous turn, follows SE gain, and yields to story effects',async()=>{
 const {audio,contexts}=harness();audio.setCategoryVolumes(1,0.4);await audio.play('titleMusic');const c=contexts[0],music=c.sources[0];
 await audio.play('uiClick');const click=c.sources.at(-1);await audio.play('bookPageTurn');const first=c.sources.at(-1);
 assert.equal(click.disconnected,true);assert.equal(first.loop,false);assert.equal(c.gains.at(-1).gain.value,0.30*0.4);
 await audio.play('bookPageTurn');assert.equal(first.disconnected,true);const second=c.sources.at(-1);
 await audio.play('doorOpen');assert.equal(second.disconnected,true);assert.equal(music.disconnected,undefined);
});

test('pending page sound is cancelled on leaving and does not arrive after a slow decode',async()=>{
 for(const leave of [true,false]){
  const file=deferred();const {audio,contexts}=harness({fetch:()=>file.promise});const pending=audio.play('bookPageTurn');
  if(leave)audio.stopAll();else await new Promise(resolve=>setTimeout(resolve,220));
  file.resolve(response());assert.equal(await pending,false);assert.equal(contexts[0].sources.length,0);
 }
});


test('hospital monitor loops continuously only in the epilogue hospital source lines',async()=>{
 const {audio,contexts}=harness();audio.syncMemoryAmbience('r8_end_05');await tick();assert.equal(contexts.length,0);
 audio.syncMemoryAmbience('r8_epilogue_01');await tick();const c=contexts[0],monitor=c.sources[0];
 assert.equal(monitor.loop,true);assert.deepEqual(c.gains.at(-1).gain.events.at(-1),['ramp',0.25,12.4]);
 for(const id of ['r8_epilogue_01_01','r8_epilogue_02','r8_epilogue_02_ceiling','r8_epilogue_03','r8_epilogue_04_02'])audio.syncMemoryAmbience(id);
 await tick();assert.equal(c.sources.length,1);
 audio.syncMemoryAmbience('r8_epilogue_05');assert.equal(monitor.disconnected,true);
 for(const id of ['r8_epilogue_06','r8_epilogue_home_notebook','r8_epilogue_07','r8_epilogue_08'])audio.syncMemoryAmbience(id);
 await tick();assert.equal(c.sources.length,1);
});

test('hospital resume starts the monitor but resuming at home stays silent; SE mute is respected',async()=>{
 const {audio,contexts}=harness();audio.setCategoryVolumes(1,0);audio.syncMemoryAmbience('r8_epilogue_02_ceiling');await tick();
 const c=contexts[0];assert.deepEqual(c.gains.at(-1).gain.events.at(-1),['ramp',0,12.4]);
 audio.setCategoryVolumes(1,0.4);assert.equal(c.gains.at(-1).gain.value,0.25*0.4);
 audio.stopAll();audio.syncMemoryAmbience('r8_epilogue_04');await tick();assert.equal(c.sources.length,2);
 audio.stopAll();audio.syncMemoryAmbience('r8_epilogue_06');await tick();assert.equal(c.sources.length,2);
});

test('fast epilogue advance or leaving cancels hospital audio while decoding; page hide stops its loop',async()=>{
 for(const leave of [false,true]){
  const file=deferred();const {audio,contexts}=harness({fetch:()=>file.promise});
  audio.syncMemoryAmbience('r8_epilogue_01');if(leave)audio.stopMemoryAmbience();else audio.syncMemoryAmbience('r8_epilogue_05');
  file.resolve(response());await tick();assert.equal(contexts[0].sources.length,0);
 }
 const {audio,contexts,window}=harness();audio.syncMemoryAmbience('r8_epilogue_03');await tick();window.emit('pagehide');assert.equal(contexts[0].sources[0].disconnected,true);
});


test('constellation completion glows once across source pages, then stops before memory',async()=>{
 const {audio,contexts}=harness();audio.syncMemoryAmbience('r4partial');await tick();assert.equal(contexts.length,0);
 audio.syncMemoryAmbience('r4ok1');await tick();const c=contexts[0],glow=c.sources[0];assert.equal(glow.loop,false);assert.equal(c.gains.at(-1).gain.value,0.40);
 for(const id of ['r4ok1_01','r4ok2','r4ok5','r4ok8'])audio.syncMemoryAmbience(id);
 await tick();assert.equal(c.sources.length,1);audio.stopMemoryAmbience();assert.equal(glow.disconnected,true);
 audio.syncMemoryAmbience('r4f1');await tick();assert.equal(c.sources.length,1);
});

test('completed glow never restarts on later lines and fast completion cancels queued decoding',async()=>{
 const {audio,contexts}=harness();audio.syncMemoryAmbience('r4ok1');await tick();contexts[0].sources[0].onended();
 audio.syncMemoryAmbience('r4ok8');await tick();assert.equal(contexts[0].sources.length,1);
 const file=deferred(),h=harness({fetch:()=>file.promise});h.audio.syncMemoryAmbience('r4ok1');h.audio.stopMemoryAmbience();file.resolve(response());await tick();assert.equal(h.contexts[0].sources.length,0);
});

test('room sparkle preserves door and BGM, follows SE volume, and can fade at arrival',async()=>{
 const {audio,contexts}=harness();audio.setCategoryVolumes(1,0.5);await audio.play('explorationMusic');const c=contexts[0],music=c.sources[0];
 const door=audio.play('doorOpen'),sparkle=audio.play('roomSparkle');assert.equal(await door,true);assert.equal(await sparkle,true);
 assert.equal(c.sources.length,3);assert.equal(music.disconnected,undefined);assert.equal(c.sources[1].disconnected,undefined);
 assert.equal(c.gains.at(-1).gain.value,0.12*0.5);assert.equal(audio.fadeOut('roomSparkle',180),true);assert.equal(c.sources.at(-1).stopAt,12.18);
});


test('item placement replaces click and previous placement while preserving BGM and yielding to judgement',async()=>{
 const {audio,contexts}=harness();audio.setCategoryVolumes(1,0.4);await audio.play('explorationMusic');const c=contexts[0],music=c.sources[0];
 await audio.play('uiClick');const click=c.sources.at(-1);await audio.play('itemPlace');const first=c.sources.at(-1);
 assert.equal(click.disconnected,true);assert.equal(c.gains.at(-1).gain.value,0.30*0.4);
 await audio.play('itemPlace');assert.equal(first.disconnected,true);const second=c.sources.at(-1);
 await audio.play('answerCorrect');assert.equal(second.disconnected,true);assert.equal(music.disconnected,undefined);
});


test('shared memories include short recollections but preserve room-one performance, accident, hospital and ending',async()=>{
 const {audio,contexts}=harness();
 for(const id of ['room1_memory_01','room1_piano_correct_04'])audio.syncSceneMusic('room01',id);
 await tick();assert.equal(contexts.length,0);
 for(const id of ['room2_memory_016','room2_final_hanamaru','room3_flashback_04','r4f1','r5m001','r5_memory_01','r6_memory_full_051','r6_final_signal','r7_mem_rabbit_01','r7_mem_25'])audio.syncSceneMusic('room07',id);
 await tick();const c=contexts[0],memory=c.sources[0];assert.equal(c.sources.length,1);
 audio.syncSceneMusic('room07','r7_mem_26');assert.equal(memory.stopAt,12.65);
 for(const id of ['r7_mem_32','r7_mem_35','r7_mem_37','r8_epilogue_01','r8_memory_truth_03'])audio.syncSceneMusic('room08',id);
 await tick();assert.equal(c.sources.length,1);
});

test('memory music follows BGM mute, resumes after interruption, and can re-enter during its fade',async()=>{
 const {audio,contexts}=harness();audio.setCategoryVolumes(0,1);audio.syncSceneMusic('room03','room3_flashback_01');await tick();const c=contexts[0];
 assert.deepEqual(c.gains.at(-1).gain.events.at(-1),['ramp',0,12.4]);audio.setCategoryVolumes(0.5,1);assert.equal(c.gains.at(-1).gain.value,0.11);
 c.state='interrupted';c.emit('statechange');audio.resumeMusic();await tick();assert.equal(c.sources.length,2);
 audio.syncSceneMusic('room08');audio.syncSceneMusic('room03','room3_flashback_02');await tick();assert.equal(c.sources.length,3);
});

test('leaving a memory before its music finishes loading prevents a stale loop',async()=>{
 const file=deferred();const {audio,contexts}=harness({fetch:()=>file.promise});
 audio.syncSceneMusic('room03','room3_flashback_01');audio.syncSceneMusic('room08');file.resolve(response());await tick();assert.equal(contexts[0].sources.length,0);
});
