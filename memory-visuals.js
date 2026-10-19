// Recollection presentation only. Story, LOG identifiers and puzzle state stay in the room modules.
(() => {
  const revealByRoom = Object.freeze({
    room01: 'concealed', room02: 'concealed', room03: 'concealed', room04: 'concealed',
    room05: 'revealed', room06: 'expressive', room07: 'expressive'
  });
  const memoryIdByRoom = Object.freeze({
    // room1_memory_03 is an existing AFTER-memory line: 「今のは……僕の記憶？」.
    room01: /^room0?1_memory_(?:music_room|bus)_/,
    // The flower-mark recollection keeps its editorial LOG ID.
    room02: /^room0?2_(?:memory_|final_hanamaru(?:_|$))/,
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
    const visual = { sceneId, reveal: revealByRoom[sceneId], logId: id };
    if (sceneId === 'room01') {
      const beat = id.match(/^room0?1_memory_(music_room|bus)_(\d{2})(?:_\d+)*$/);
      if (!beat) return null;
      const outdoors = beat[1] === 'bus';
      visual.location = outdoors ? 'walk-home' : 'music-room';
      visual.background = 'images/background/memories/room01/' + visual.location + '.png';
      // Only her conversation with the protagonist gets a sprite. Narration,
      // thoughts, the teacher/club, and lines after she boards the bus do not.
      const present = outdoors ? Number(beat[2]) >= 2 && Number(beat[2]) <= 24 : Number(beat[2]) >= 16;
      if (present && line.logType === 'dialogue' && !line.thought && ['先輩', '主人公'].includes(line.speaker)) {
        visual.sprite = 'images/characters/memories/room01/girl-approved.png';
      }
    }
    if (sceneId === 'room02') {
      // The opening visit is at middle school; line 015 begins high school.
      const beat = id.match(/^room0?2_memory_(\d+)/);
      const highSchool = /final_hanamaru/.test(id) || Number(beat?.[1]) >= 15;
      visual.location = highSchool ? 'high-school-music-room' : 'music-room';
      visual.background = highSchool
        ? 'images/background/memories/room02/high-school-music-room.png'
        : 'images/background/memories/room01/music-room.png';
      if (line.logType === 'dialogue' && !line.thought && ['先輩', '主人公'].includes(line.speaker)) {
        visual.sprite = 'images/characters/memories/room02/girl-blazer.png';
      }
    }
    return visual;
  }
  const prepared = new Set();
  function prepare(sceneId, lines) {
    for (const line of lines) {
      const visual = get(sceneId, line);
      for (const path of [visual?.background, visual?.sprite]) {
        if (!path || prepared.has(path)) continue;
        prepared.add(path);
        const image = new Image();
        image.src = path;
      }
    }
  }
  function sync(visual) {
    const root = document.getElementById('game');
    if (!root) return;
    let stage = root.querySelector('.memory-scene');
    if (!visual) {
      delete root.dataset.memoryStage;
      stage?.remove();
      return;
    }
    root.dataset.memoryStage = visual.reveal;
    if (!visual.background) { stage?.remove(); return; }
    if (!stage) {
      stage = document.createElement('div');
      stage.className = 'memory-scene';
      stage.setAttribute('aria-hidden', 'true');
      const background = document.createElement('img');
      background.className = 'memory-background';
      background.alt = '';
      background.draggable = false;
      const sprite = document.createElement('img');
      sprite.className = 'memory-girl';
      sprite.alt = '';
      sprite.draggable = false;
      sprite.hidden = true;
      stage.append(background, sprite);
      root.append(stage);
    }
    stage.dataset.location = visual.location;
    const background = stage.querySelector('.memory-background');
    if (background.getAttribute('src') !== visual.background) background.src = visual.background;
    const sprite = stage.querySelector('.memory-girl');
    if (visual.sprite && sprite.getAttribute('src') !== visual.sprite) sprite.src = visual.sprite;
    sprite.hidden = !visual.sprite;
  }
  window.MemoryVisuals = Object.freeze({ get, prepare, sync, revealByRoom });
})();
