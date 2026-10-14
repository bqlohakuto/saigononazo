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
    ['room02', 'room2_after_memory_001'], ['room04', 'r4a10'],
    ['room05', 'r5_after_05'], ['room07', 'r7_last_06'], ['room08', 'r8_003']
  ]) assert.equal(visuals.get(room, { logId }), null);
});

test('Text pagination preserves the source memory identifier', () => {
  assert.equal(visuals.get('room07', {
    logId: 'page', logSource: { logId: 'r7_mem_35' }
  }).reveal, 'expressive');
});
