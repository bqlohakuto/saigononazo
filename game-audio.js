(function (global) {
  "use strict";

  const sounds = {
    answerCorrect: { url: "audio/se/answer_correct.mp3", gain: 0.30 },
    answerIncorrect: { url: "audio/se/answer_incorrect.mp3", gain: 0.40 },
    leverPull: { url: "audio/se/lever_pull.mp3", gain: 0.35 },
    uiClick: { url: "audio/se/ui_click.mp3", gain: 0.22 },
    highSchool: { url: "audio/se/high_school.mp3", gain: 0.30, loop: true },
    naturePark: { url: "audio/se/nature_park.mp3", gain: 0.25, loop: true },
    cityRoad: { url: "audio/se/city_road.mp3", gain: 0.25, loop: true },
    intersection: { url: "audio/se/intersection.mp3", gain: 0.30, loop: true },
    titleMusic: { url: "audio/bgm/title.mp3", gain: 0.35, loop: true, category: "bgm" },
    explorationMusic: { url: "audio/bgm/exploration.mp3", gain: 0.35, loop: true, category: "bgm" },
    cherryWind: { url: "audio/se/cherry_wind.wav", gain: 0.25, loop: true },
    quietClassroom: { url: "audio/se/quiet_classroom.wav", gain: 0.30, loop: true },
    footsteps: { url: "audio/se/othello_footsteps_3.wav", gain: 0.65 },
    doorUnlock: { url: "audio/se/unlock.wav", gain: 0.65 },
    doorOpen: { url: "audio/se/door_open.wav", gain: 0.65 },
    fridgeOpen: { url: "audio/se/fridge_open.wav", gain: 0.65 },
    fridgeClose: { url: "audio/se/fridge_close.wav", gain: 0.65 },
    tinnitus: { url: "audio/se/tinnitus.mp3", gain: 0.5 },
    memoryMelody: { url: "audio/memory_melody_piano.wav", gain: 0.7 },
    memoryBand: { url: "audio/memory_band.mp3", gain: 0.65 }
  };
  const files = new Map();
  const buffers = new Map();
  const playing = new Map();
  let context, master;
  let volume = 1;
  let categoryVolumes={bgm:1,se:1};
  const category=id=>sounds[id]?.category||(id==="memoryBand"?"bgm":"se");
  let desiredMusic=null;
  let endingTrack=null;
  function syncEndingVolume(){
    if(endingTrack){
      endingTrack.volume=Math.min(1,Math.max(0,volume*categoryVolumes.bgm));
      endingTrack.muted=volume===0||categoryVolumes.bgm===0;
    }
  }
  function createEndingTrack(){
    if(endingTrack){endingTrack.pause();endingTrack.removeAttribute("src");endingTrack.load();}
    endingTrack=new global.Audio("audio/bgm/kotaeawase.mp3");
    endingTrack.preload="auto";
    endingTrack.loop=false;
    endingTrack.setAttribute("playsinline","");
    syncEndingVolume();
    return endingTrack;
  }
  function releaseEndingTrack(track){
    if(track!==endingTrack)return;
    track.pause();track.removeAttribute("src");track.load();endingTrack=null;
  }
  function fadeForEnding(durationMs=1600){
    desiredMusic=null;
    Array.from(playing.keys()).forEach(id=>fadeOut(id,durationMs));
  }

  function loadFile(id) {
    if (!files.has(id)) {
      const pending = Promise.resolve().then(() => global.fetch(sounds[id].url))
        .then(response => response.ok ? response.arrayBuffer() : null)
        .catch(() => null)
        .then(data => { if (!data) files.delete(id); return data; });
      files.set(id, pending);
    }
    return files.get(id);
  }

  function disconnect(entry) {
    if (entry.source) {
      entry.source.onended = null;
      try { entry.source.stop(); } catch (_) {}
      try { entry.source.disconnect(); } catch (_) {}
    }
    if (entry.gain) { try { entry.gain.disconnect(); } catch (_) {} }
  }

  function stop(id) {
    const entry = playing.get(id);
    playing.delete(id); // Also invalidates a play still waiting for decoding/resume.
    if (entry) disconnect(entry);
  }

  function stopPlaying(){Array.from(playing.keys()).forEach(stop);}
  function stopAll() {
    desiredMusic=null;
    if(endingTrack)releaseEndingTrack(endingTrack);
    stopPlaying();
  }

  function fadeOut(id, durationMs = 1000) {
    const entry = playing.get(id);
    if (!entry) return false;
    // A queued sound must be invalidated so it cannot begin after this cue.
    if (!entry.source || !entry.gain || !context) {
      stop(id);
      return false;
    }
    if (entry.fading) return true;
    const duration = Number(durationMs);
    if (!Number.isFinite(duration) || duration <= 0) {
      stop(id);
      return true;
    }
    try {
      const now = context.currentTime;
      const end = now + duration / 1000;
      const gain = entry.gain.gain;
      entry.fading = true;
      gain.cancelScheduledValues(now);
      gain.setValueAtTime(gain.value, now);
      gain.linearRampToValueAtTime(0, end);
      entry.source.stop(end);
      return true;
    } catch (_) {
      stop(id);
      return false;
    }
  }

  function unlock() {
    if (document.hidden) return Promise.resolve(false);
    try {
      if (!context) {
        const AudioContext = global.AudioContext || global.webkitAudioContext;
        if (!AudioContext) return Promise.resolve(false);
        try {
          if (global.navigator && global.navigator.audioSession) {
            global.navigator.audioSession.type = "ambient";
          }
        } catch (_) {}
        context = new AudioContext();
        master = context.createGain();
        master.gain.value = volume;
        master.connect(context.destination);
        context.addEventListener("statechange", () => {
          // An interrupted one-shot must not continue when the next gesture resumes audio.
          if (context.state !== "running") stopPlaying();
        });
      }
      if (context.state === "running") return Promise.resolve(true);
      // Call resume before any await so a user's gesture can unlock iPhone audio.
      return context.resume().then(() => context.state === "running").catch(() => false);
    } catch (_) {
      return Promise.resolve(false);
    }
  }

  function loadBuffer(id) {
    if (!buffers.has(id)) {
      buffers.set(id, loadFile(id)
        .then(data => data && context ? context.decodeAudioData(data.slice(0)) : null)
        .catch(() => null)
        .then(buffer => {
          if (!buffer) { buffers.delete(id); files.delete(id); }
          return buffer;
        }));
    }
    return buffers.get(id);
  }

  async function play(id) {
    if (!Object.prototype.hasOwnProperty.call(sounds, id)) return false;
    // Authored one-shot effects take priority over a click from the same gesture.
    if (id !== "uiClick" && !sounds[id].loop) stop("uiClick");
    if (id !== "uiClick" && !sounds[id].loop && !/^answer(?:Correct|Incorrect)$/.test(id)) {
      stop("answerCorrect");
      stop("answerIncorrect");
    }
    if (id === "answerCorrect" || id === "answerIncorrect") {
      stop(id === "answerCorrect" ? "answerIncorrect" : "answerCorrect");
    }
    // Judgement and story cues take over from the mechanical lever sound.
    if (id !== "uiClick" && id !== "leverPull" && !sounds[id].loop) stop("leverPull");
    stop(id);
    if (document.hidden) return false;
    const ready = unlock();
    if (!context || !master) return false;
    const entry = { requestedAt: Date.now() };
    playing.set(id, entry);
    try {
      const [running, buffer] = await Promise.all([ready, loadBuffer(id)]);
      if (playing.get(id) !== entry) return false;
      // Never deliver a stale UI response after a slow load or mobile resume.
      if (((id === "uiClick" || id === "leverPull") && Date.now() - entry.requestedAt > 200) ||
          (/^answer(?:Correct|Incorrect)$/.test(id) && Date.now() - entry.requestedAt > 500)) {
        stop(id);
        return false;
      }
      if (!running || !buffer || document.hidden || context.state !== "running") {
        stop(id);
        return false;
      }
      entry.source = context.createBufferSource();
      entry.gain = context.createGain();
      entry.source.buffer = buffer;
      entry.source.loop = !!sounds[id].loop;
      entry.gain.gain.value = sounds[id].gain*categoryVolumes[category(id)];
      if(sounds[id].loop){
        entry.gain.gain.setValueAtTime(0,context.currentTime);
        entry.gain.gain.linearRampToValueAtTime(sounds[id].gain*categoryVolumes[category(id)],context.currentTime+0.4);
      }
      entry.source.connect(entry.gain);
      entry.gain.connect(master);
      entry.source.onended = () => {
        if (playing.get(id) === entry) stop(id);
      };
      entry.source.start();
      if(typeof document.dispatchEvent==="function"&&typeof global.CustomEvent==="function")document.dispatchEvent(new global.CustomEvent("game:sound",{detail:{id}}));
      return true;
    } catch (_) {
      if (playing.get(id) === entry) stop(id);
      return false;
    }
  }

  // Short synthesized note preview, only while the player presses a piano key.
  async function playPianoNote(note) {
    const frequencies={ド:261.63,レ:293.66,ミ:329.63,ファ:349.23,ソ:392.00,ラ:440.00,シ:493.88};
    const frequency=frequencies[note];
    if(!frequency || document.hidden) return false;
    if(!await unlock() || !context || !master || context.state!=="running") return false;
    try {
      const oscillator=context.createOscillator();
      const envelope=context.createGain();
      const now=context.currentTime;
      const peak=Math.max(0.0001,0.18*categoryVolumes.se);
      oscillator.type="triangle";
      oscillator.frequency.setValueAtTime(frequency,now);
      envelope.gain.setValueAtTime(0.0001,now);
      envelope.gain.exponentialRampToValueAtTime(peak,now+0.018);
      envelope.gain.exponentialRampToValueAtTime(0.0001,now+0.45);
      oscillator.connect(envelope);
      envelope.connect(master);
      oscillator.onended=()=>{oscillator.disconnect();envelope.disconnect();};
      oscillator.start(now);
      oscillator.stop(now+0.46);
      return true;
    } catch (_) {return false;}
  }

  const musicIds=["titleMusic","explorationMusic"];
  function setMusic(id){
    desiredMusic=musicIds.includes(id)?id:null;
    musicIds.forEach(other=>{if(other!==desiredMusic)stop(other)});
    resumeMusic();
  }
  function resumeMusic(){if(desiredMusic&&!playing.has(desiredMusic))play(desiredMusic);}
  // Scene music selection lives here so title/room/load and source-line resume agree.
  function syncSceneMusic(scene,logId=""){
    if(scene==="title"){setMusic("titleMusic");return;}
    if(scene==="opening"){setMusic(null);return;}
    const memory=/^(?:room1_memory_|room1_piano_correct(?:_|$)|room2_memory_|room2_final_|room3_flashback_|r4f\d|r5m|r5_memory_|r6_memory_|r7_mem_)/.test(logId);
    if(memory){setMusic(null);return;}
    setMusic(/^room0[1-7]$/.test(scene)?"explorationMusic":null);
  }

  const memoryAmbienceIds=["cherryWind","quietClassroom","highSchool","naturePark","cityRoad","intersection"];
  function stopMemoryAmbience(){memoryAmbienceIds.forEach(stop);}
  function syncMemoryAmbience(logId){
    const room2=/^room2_memory_(\d{3})(?:_|$)/.exec(logId||"");
    const room3=/^room3_flashback_(\d{2})(?:_|$)/.exec(logId||"");
    const room6=/^r6_memory_full_(\d{3})(?:_|$)/.exec(logId||"");
    const room7=/^r7_mem_(\d{2})(?:_|$)/.exec(logId||"");
    const id=room2&&Number(room2[1])>=16&&Number(room2[1])<=53?"highSchool":
      (room2&&Number(room2[1])>=54&&Number(room2[1])<=95)||/^room2_final_hanamaru(?:_|$)/.test(logId||"")?"quietClassroom":
      room3&&Number(room3[1])>=34&&Number(room3[1])<=71?"cherryWind":
      (room6&&Number(room6[1])>=51&&Number(room6[1])<=85)||/^r6_memory_0[1-7](?:_|$)/.test(logId||"")||/^r6_final_signal(?:_|$)/.test(logId||"")?"naturePark":
      room7&&Number(room7[1])>=1&&Number(room7[1])<=25?"cityRoad":
      room7&&Number(room7[1])>=26&&Number(room7[1])<=34?"intersection":null;
    memoryAmbienceIds.forEach(other=>{if(other!==id)stop(other)});
    if(id&&!playing.has(id))play(id);
  }

  function setVolume(value) {
    if (!Number.isFinite(value)) return;
    volume = Math.min(1, Math.max(0, value));
    if (master) master.gain.value = volume;
    syncEndingVolume();
  }

  function setCategoryVolumes(bgm,se){
    categoryVolumes={bgm:Number.isFinite(bgm)?Math.min(1,Math.max(0,bgm)):1,se:Number.isFinite(se)?Math.min(1,Math.max(0,se)):1};
    syncEndingVolume();
    playing.forEach((entry,id)=>{if(entry.gain&&!entry.fading){if(sounds[id].loop)entry.gain.gain.cancelScheduledValues(context.currentTime);entry.gain.gain.value=sounds[id].gain*categoryVolumes[category(id)]}});
  }
  function pausePage() {
    stopPlaying();
    try { if (context && context.state !== "closed") context.suspend().catch(() => {}); } catch (_) {}
  }

  document.addEventListener("visibilitychange", () => { if (document.hidden) pausePage(); });
  global.addEventListener("pagehide", pausePage);
  if (typeof global.fetch === "function") Object.keys(sounds).forEach(loadFile);
  // One click event covers mouse, touch and native Enter/Space activation.
  // Capture before handlers replace/remove their buttons; never bind touch + click.
  document.addEventListener("click", event => {
    const button = event.target?.closest?.("button,[role='button']");
    if (!button || button.disabled || button.getAttribute("aria-disabled") === "true" ||
        button.closest("[inert],[hidden],[aria-hidden='true']")) return;
    // Preserve instruments, scene interactions, and the quiet rhythm of dialogue.
    // data-ui-sound lets future controls explicitly opt out of the common sound.
    if (button.matches(".room2-physical-lever,#r6White,#r6Black,.object,.item-object,.late-object,.r5-scene-target,.r7-target,.piano-note-key,[data-note],#playMelodyButton,.next-button,.skip-button,#r5FridgeUpper,#r5FridgeLower,[data-ui-sound='off']")) return;
    void play("uiClick");
  }, { capture: true });
  global.GameAudio = { createEndingTrack, releaseEndingTrack, fadeForEnding, unlock, play, playPianoNote, stop, stopAll, fadeOut, setVolume,setCategoryVolumes,syncMemoryAmbience,stopMemoryAmbience,setMusic,syncSceneMusic,resumeMusic };
})(window);
