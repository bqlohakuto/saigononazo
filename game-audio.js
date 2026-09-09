(function (global) {
  "use strict";

  const sounds = {
    tinnitus: { url: "audio/se/tinnitus.mp3", gain: 0.5 },
    doorOpen: { url: "audio/se/door_open.wav", gain: 0.65 },
    memoryMelody: { url: "audio/memory_melody_piano.wav", gain: 0.7 }
  };
  const files = new Map();
  const buffers = new Map();
  const playing = new Map();
  let context, master;
  let volume = 1;

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

  function stopAll() {
    Array.from(playing.keys()).forEach(stop);
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
          if (context.state !== "running") stopAll();
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
    stop(id);
    if (document.hidden) return false;
    const ready = unlock();
    if (!context || !master) return false;
    const entry = {};
    playing.set(id, entry);
    try {
      const [running, buffer] = await Promise.all([ready, loadBuffer(id)]);
      if (playing.get(id) !== entry) return false;
      if (!running || !buffer || document.hidden || context.state !== "running") {
        stop(id);
        return false;
      }
      entry.source = context.createBufferSource();
      entry.gain = context.createGain();
      entry.source.buffer = buffer;
      entry.source.loop = false;
      entry.gain.gain.value = sounds[id].gain;
      entry.source.connect(entry.gain);
      entry.gain.connect(master);
      entry.source.onended = () => {
        if (playing.get(id) === entry) stop(id);
      };
      entry.source.start();
      return true;
    } catch (_) {
      if (playing.get(id) === entry) stop(id);
      return false;
    }
  }

  function setVolume(value) {
    if (!Number.isFinite(value)) return;
    volume = Math.min(1, Math.max(0, value));
    if (master) master.gain.value = volume;
  }

  function pausePage() {
    stopAll();
    try { if (context && context.state !== "closed") context.suspend().catch(() => {}); } catch (_) {}
  }

  document.addEventListener("visibilitychange", () => { if (document.hidden) pausePage(); });
  global.addEventListener("pagehide", pausePage);
  if (typeof global.fetch === "function") Object.keys(sounds).forEach(loadFile);
  global.GameAudio = { unlock, play, stop, stopAll, setVolume };
})(window);
