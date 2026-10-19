const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.resolve(__dirname, '../memory-visuals.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox);
const visuals = sandbox.window.MemoryVisuals;

test('Room 1-4 recollections conceal the face', () => {
  const examples = [
    ['room01', 'room1_memory_music_room_09'],
    ['room02', 'room2_memory_001'],
    ['room03', 'room3_flashback_34'],
    ['room04', 'r4f05']
  ];
  for (const [room, logId] of examples) {
    assert.equal(visuals.get(room, { logId }).reveal, 'concealed');
  }
});

test('Room 5 shows the full face, Room 6-7 emphasize expressions', () => {
  assert.equal(visuals.get('room05', { logId: 'r5_memory_fridge' }).reveal, 'revealed');
  assert.equal(visuals.get('room06', { logId: 'r6_memory_03' }).reveal, 'expressive');
  assert.equal(visuals.get('room07', { logId: 'r7_mem_27' }).reveal, 'expressive');
});

test('Current-time and after-memory lines are not recollection images', () => {
  for (const [room, logId] of [
    ['room01', 'room1_after_memory_01'], ['room01', 'room1_memory_03'],
    ['room01', 'room1_memory_03_01'],
    ['room02', 'room2_after_memory_001'], ['room04', 'r4a10'],
    ['room05', 'r5_after_05'], ['room07', 'r7_last_06'], ['room08', 'r8_003']
  ]) assert.equal(visuals.get(room, { logId }), null);
});

test('Text pagination preserves the source memory identifier', () => {
  assert.equal(visuals.get('room07', {
    logId: 'page', logSource: { logId: 'r7_mem_35' }
  }).reveal, 'expressive');
});

test('Room 1 changes background at the walk home and displays her only in their spoken conversation', () => {
  const data = {};
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../scenario.js'), 'utf8') + '\nthis.first = firstRoomScenario;', data);
  for (const line of data.first.memory) {
    const visual = visuals.get('room01', line);
    assert.ok(visual, line.logId);
    if (line.logType !== 'dialogue' || line.thought) assert.equal(visual.sprite, undefined, line.logId);
    if (visual.sprite) assert.ok(fs.existsSync(path.resolve(__dirname, '..', visual.sprite)));
    assert.ok(fs.existsSync(path.resolve(__dirname, '..', visual.background)));
  }
  for (const [id,location,visible] of [
    ['room1_memory_music_room_10','music-room',false],
    ['room1_memory_music_room_16','music-room',true],
    ['room1_memory_music_room_17','music-room',true],
    ['room1_memory_bus_01','walk-home',false],
    ['room1_memory_bus_02','walk-home',true],
    ['room1_memory_bus_24','walk-home',true],
    ['room1_memory_bus_26','walk-home',false]
  ]) {
    const visual = visuals.get('room01', data.first.memory.find(l=>l.logId===id));
    assert.equal(visual.location,location,id);
    assert.equal(!!visual.sprite,visible,id);
  }
  for (const line of data.first.afterMemory) assert.equal(visuals.get('room01', line), null, line.logId);
});

test('Paginated Room 1 dialogue retains its location and hides the sprite on thoughts', () => {
  const original = { logId: 'room1_memory_bus_02_01', logType: 'dialogue', speaker: '先輩' };
  assert.equal(visuals.get('room01', { ...original, logId: 'page', logSource: original }).location, 'walk-home');
  assert.ok(visuals.get('room01', original).sprite);
  assert.equal(visuals.get('room01', { ...original, speaker: '主人公', thought: true }).sprite, undefined);
});

test('Every Room 2 recollection line has its school-specific music room, with the blazer only during their dialogue', () => {
  const data = {};
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../room2-flashback.js'), 'utf8') + '\nthis.lines = room2FlashbackContent;', data);
  for (const source of data.lines) {
    const line = { ...source, logType: source.thought || source.speaker === 'ト書き' ? 'narration' : 'dialogue' };
    const visual = visuals.get('room02', line);
    assert.ok(visual, source.logId);
    const highSchool = source.logId === 'room2_final_hanamaru' || Number(source.logId.match(/memory_(\d+)/)?.[1]) >= 15;
    assert.equal(visual.background, highSchool ? 'images/background/memories/room02/high-school-music-room.png' : 'images/background/memories/room01/music-room.png', source.logId);
    assert.ok(fs.existsSync(path.resolve(__dirname, '..', visual.background))); 
    const talking = !source.thought && ['先輩', '主人公'].includes(source.speaker);
    assert.equal(!!visual.sprite, talking, source.logId);
    if (talking) {
      assert.equal(visual.sprite, 'images/characters/memories/room02/girl-blazer.png');
      assert.ok(fs.existsSync(path.resolve(__dirname, '..', visual.sprite)));
    }
  }
  const flower = data.lines.find(l => l.logId === 'room2_final_hanamaru');
  assert.ok(flower);
  assert.equal(visuals.get('room02', { ...flower, logId: 'page', logSource: flower }).location, 'high-school-music-room');
  assert.equal(visuals.get('room02', { ...flower, logId: flower.logId + '_01' }).sprite, undefined);
});
