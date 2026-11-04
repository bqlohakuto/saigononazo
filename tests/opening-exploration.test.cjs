const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const scenario = vm.runInNewContext(read('scenario.js') +
  '\n({openingScenario,openingTopics,openingDoorFirst,openingExitScenario,openingIntroEndId,openingExitStartId})');

test('prologue pauses after the door appears, before approaching it', () => {
  const ids = scenario.openingScenario.map(line => line.logId);
  assert(ids.indexOf('opening_31') < ids.indexOf(scenario.openingIntroEndId));
  assert(ids.indexOf(scenario.openingIntroEndId) < ids.indexOf(scenario.openingExitStartId));
  assert.equal(scenario.openingExitScenario[0].logId, scenario.openingExitStartId);
  assert.equal(scenario.openingExitScenario.at(-1).logId, 'opening_43');
  assert(scenario.openingExitScenario.some(line => line.logId === 'opening_39'), 'the existing door opening cue is kept');
});

test('only four optional topics, without revealing the woman name in on-screen dialogue', () => {
  assert.deepEqual(Array.from(scenario.openingTopics, item=>item.id), ['about','place','memory','door']);
  assert(scenario.openingTopics.every(item => item.label && item.lines.length > 0));
  const text = scenario.openingTopics.flatMap(item => item.lines.map(line => line.text)).join('\n');
  assert.doesNotMatch(text, /ハナと呼んで|花音|彼女は死んだ/u);
  const ids = [...scenario.openingScenario, ...scenario.openingDoorFirst, ...scenario.openingTopics.flatMap(x=>x.lines)].map(x=>x.logId);
  assert.equal(ids.length, new Set(ids).size, 'no duplicated log IDs');
});

test('opening exploration does not require optional topics to progress', () => {
  const js = read('opening-sequence.js');
  assert.match(js, /className = "opening-targets"/);
  assert.match(js, /id="openingHanaTarget"/);
  assert.match(js, /id="openingDoorTarget"/);
  assert.match(js, /openingExplorationState\.doorSeen/);
  assert.match(js, /openingProceed/);
  assert.match(js, /openingStay/);
  assert.match(js, /showRoomDialog\(openingExitScenario/);
  assert.doesNotMatch(js.slice(js.indexOf('function startOpeningExit()'),js.indexOf('// Port of the approved prototype')), /readTopics\.length/);
});

test('opening phase, door-inspected flag and read topics persist in v2 room state', () => {
  const shared = read('script.js');
  const opening = read('opening-sequence.js');
  assert.match(shared, /roomStates\.opening=openingState/);
  assert.match(shared, /showOpening\(saved\.opening\.index,saved\.rooms\.opening\)/);
  assert.match(opening, /readTopics: Array\.isArray\(savedState\?\.readTopics\)/);
  assert.match(opening, /exitLogId: savedState\?\.exitLogId/);
  assert.match(opening, /legacyTail/);
});
