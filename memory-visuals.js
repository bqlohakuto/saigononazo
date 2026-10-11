// Recollection visibility rules. Artwork must be approved before it is displayed.
// The module only determines disclosure stage; it does not alter the story or puzzles.
(() => {
  const revealByRoom = Object.freeze({
    room01: 'concealed', room02: 'concealed', room03: 'concealed', room04: 'concealed',
    room05: 'revealed', room06: 'expressive', room07: 'expressive'
  });
  const memoryIdByRoom = Object.freeze({
    room01: /^room0?1_memory_/,
    room02: /^room0?2_memory_/,
    room03: /^room0?3_flashback_/,
    room04: /^r4f\d+$/,
    room05: /^r5_memory_/,
    room06: /^r6_memory_/,
    room07: /^r7_mem_/
  });
  function get(sceneId, line) {
    const id = String(line?.logSource?.logId || line?.logId || '');
    const pattern = memoryIdByRoom[sceneId];
    if (!pattern?.test(id)) return null;
    return { sceneId, reveal: revealByRoom[sceneId], logId: id };
  }
  window.MemoryVisuals = Object.freeze({ get, revealByRoom });
})();