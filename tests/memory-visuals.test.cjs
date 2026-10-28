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

test('Room 1 changes background at the walk home and keeps her present through narration and thoughts', () => {
  const data = {};
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../scenario.js'), 'utf8') + '\nthis.first = firstRoomScenario;', data);
  for (const line of data.first.memory) {
    const visual = visuals.get('room01', line);
    assert.ok(visual, line.logId);
    const b=line.logId.match(/_(music_room|bus)_(\d+)/);
    const present=b[1]==='bus'?Number(b[2])>=2&&Number(b[2])<=24:Number(b[2])>=16;
    assert.equal(!!visual.sprite,present,line.logId);
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

test('Paginated Room 1 dialogue retains its location and keeps the sprite on thoughts', () => {
  const original = { logId: 'room1_memory_bus_02_01', logType: 'dialogue', speaker: '先輩' };
  assert.equal(visuals.get('room01', { ...original, logId: 'page', logSource: original }).location, 'walk-home');
  assert.ok(visuals.get('room01', original).sprite);
  assert.equal(visuals.get('room01', { ...original, speaker: '主人公', thought: true }).sprite,visuals.get('room01',original).sprite);
});

test('Room 2 retains the heroine through thoughts, and sits her at the paperwork desk', () => {
  const expected=[['room2_memory_001',false,'music-room'],['room2_memory_004',true,'music-room'],['room2_memory_012',true,'music-room'],['room2_memory_014',false,'music-room'],['room2_memory_015',false,'high-school-music-room'],['room2_memory_018',false,'high-school-music-room'],['room2_memory_021',true,'high-school-music-room'],['room2_memory_053_flower_01',true,'high-school-music-room'],['room2_memory_070',true,'music-room-paperwork'],['room2_final_hanamaru',true,'music-room-paperwork']];
  for(const [logId,present,bg] of expected){
    const v=visuals.get('room02',{logId,logType:'narration',thought:true});
    assert.equal(!!v.sprite,present,logId);
    assert.ok(v.background.endsWith(bg+'.png'),logId);
  }
});

test('Every authored Room 2-7 recollection ID and its paginated continuation resolves to existing assets',()=>{
  const scenes=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../docs/MEMORY_SCENES_IMPLEMENTATION.json')));
  const ids=new Set();
  for(const scene of scenes)for(const logId of scene.ids){
    assert.ok(!ids.has(logId),logId);ids.add(logId);
    const v=visuals.get(scene.room,{logId});
    assert.ok(v,logId);
    for(const file of [v.background,v.sprite].filter(Boolean))assert.ok(fs.existsSync(path.resolve(__dirname,'..',file)),file);
    assert.equal(visuals.get(scene.room,{logId:logId+'_01_02'}).background,v.background,logId);
    assert.equal(visuals.get(scene.room,{logId:'page',logSource:{logId}}).sprite,v.sprite,logId);
  }
  assert.equal(ids.size,716);
});

test('Tiger-door recollection keeps the earlier concealed-face presentation',()=>{
  for(let i=1;i<=20;i++){
    const v=visuals.get('room07',{logId:'r7_mem_tiger_'+String(i).padStart(2,'0')+'_01'});
    assert.equal(v.location,'r7tiger');assert.equal(v.reveal,'concealed');
    assert.equal(v.background,'images/background/memories/room01/walk-home.png');
    assert.ok(fs.existsSync(path.resolve(__dirname,'..',v.sprite)));
  }
});

test('Rabbit-door phone conversation uses the school desk without the senior in person',()=>{
  for(let i=1;i<=18;i++){
    const v=visuals.get('room07',{logId:'r7_mem_rabbit_'+String(i).padStart(2,'0')+'_01'});
    assert.equal(v.location,'r7rabbit');assert.equal(v.reveal,'concealed');
    assert.equal(v.background,'images/background/memories/room02/music-room-paperwork.png');
    assert.equal(v.sprite,undefined);
  }
});

test('Sheep-door recollection returns to the Room 5 home and dialogue portrait',()=>{
  for(let i=1;i<=26;i++){
    const v=visuals.get('room07',{logId:'r7_mem_sheep_'+String(i).padStart(2,'0')+'_01'});
    assert.equal(v.location,'r7sheep');assert.equal(v.reveal,'revealed');
    assert.equal(v.presentation,'dialogue');
    assert.equal(v.background,'images/background/memories/room05/kitchen-evening.png');
    assert.equal(v.sprite,'images/characters/memories/room05/girl-home.png');
  }
});

test('Monkey-door recollection closes the notebook at the authored moment',()=>{
  for(let i=1;i<=25;i++){
    const v=visuals.get('room07',{logId:'r7_mem_monkey_'+String(i).padStart(2,'0')+'_01'});
    assert.equal(v.location,'r7monkey');assert.equal(v.reveal,'expressive');
    assert.equal(v.presentation,'dialogue');
    assert.equal(v.background,'images/background/memories/room05/dining-night.png');
    assert.equal(v.prop,i<=22?'notebook':null);
  }
  assert.equal(visuals.get('room07',{logId:'r7_mem_monkey_22_02'}).prop,null);
  assert.equal(visuals.get('room07',{logId:'page',logSource:{logId:'r7_mem_monkey_22_02'}}).prop,null);
});

test('Presence follows actual scene boundaries rather than narration or speaker classification',()=>{
  const cases=[['room03','room3_flashback_05',false],['room03','room3_flashback_35',false],['room03','room3_flashback_39',true],['room04','r4f49',true],['room04','r4f51',true],['room05','r5m001',false],['room05','r5m004',true],['room05','r5m014',true],['room05','r5m092',true],['room05','r5m225',true],['room06','r6_memory_full_003',false],['room06','r6_memory_full_007',true],['room06','r6_memory_full_030',true],['room06','r6_memory_full_058',true],['room06','r6_memory_06',true],['room07','r7_mem_01',false],['room07','r7_mem_14',true]];
  for(const [room,logId,present] of cases){
    const narration=visuals.get(room,{logId,logType:'narration',thought:true});
    const dialogue=visuals.get(room,{logId,logType:'dialogue',speaker:'主人公'});
    assert.equal(!!narration.sprite,present,logId);
    assert.equal(narration.sprite,dialogue.sprite,logId);
  }
  assert.ok(visuals.get('room03',{logId:'room3_final_ringtone'}));
  assert.ok(visuals.get('room05',{logId:'r5_final_humming'}));
  assert.ok(visuals.get('room06',{logId:'r6_final_signal'}));
  assert.equal(visuals.get('room07',{logId:'r7_mem_35'}).effect,'red');
  assert.equal(visuals.get('room07',{logId:'r7_mem_37_01'}).effect,'red');
  assert.equal(visuals.get('room06',{logId:'r6_after_001'}),null);
});



test('A08: every Room 7 zodiac-door recollection has a relevant, authored scene',()=>{
 const script=fs.readFileSync(path.resolve(__dirname,'../late-game.js'),'utf8');
 const ids=[...new Set([...script.matchAll(/line\('(r7_mem_(?:tiger|rabbit|sheep|monkey|boar|rooster)_[0-9]{2})'/g)].map(m=>m[1]))];
 assert.equal(ids.length,139,'Cover all six door memories, including 28 boar beats');
 for(const id of ids){
   const image=visuals.get('room07',{logId:id});
   assert.ok(image?.background,id+' must not leave the Room 7 bookshelf scene behind');
   assert.ok(image.background.startsWith('images/background/memories/')||image.background.startsWith('images/cg/memories/'),id);
 }
 for(let i=1;i<=28;i++){
   const id='r7_mem_boar_'+String(i).padStart(2,'0');
   const image=visuals.get('room07',{logId:id});
   assert.equal(image.background,'images/background/memories/room01/walk-home.png',id);
   assert.equal(image.sprite,(i===1||i===28)?undefined:'images/characters/memories/room01/girl-approved.png',id);
   assert.equal(image.reveal,'concealed',id);
 }
 const tiger=visuals.get('room07',{logId:'r7_mem_tiger_08'});
 assert.equal(tiger.sprite,'images/characters/memories/room03/girl-spring.png','Keep the later school-era memory intact');
});
