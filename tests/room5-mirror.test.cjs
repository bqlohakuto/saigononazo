// npm install jsdom; node tests/room5-mirror.test.cjs
// Historical filename retained; this tests the confirmed full Room 5 flow.
const {JSDOM}=require(process.env.JSDOM_PATH||'jsdom');
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
const root=path.join(__dirname,'..');
const dom=new JSDOM('<div id="game-container"><div id="game"></div></div>',{url:'https://game.test/',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,ctx=dom.getInternalVMContext();
w.matchMedia=()=>({matches:false,addEventListener(){}});w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};
for(const [,file] of fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^?]+)\?/g))vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const q=s=>w.document.querySelector(s),qa=s=>[...w.document.querySelectorAll(s)],click=s=>{assert.ok(q(s),'control exists: '+s);q(s).click();};
const save=()=>JSON.parse(w.localStorage.getItem('saigononazo-save-v1'));
function finish(){for(let n=0;n<1000&&q('#roomNextButton');n++)click('#roomNextButton');assert.equal(q('#roomNextButton'),null);}
click('#testRoomButton');click('[data-room="room05"]');finish();
assert.equal(save().currentScene,'room05');
assert.equal(qa('[data-item]').length,7);
assert.ok(q('#gameplayHud'));assert.ok(q('#gameplayBottomBar'));

for(const id of ['mirror','fish','butterfly','flower','squid','chair','cannon']){
  click('[data-item="'+id+'"]');finish();
}
assert.equal(save().rooms.room05.collected.length,7);

// First board open shows the confirmed rule-discovery dialogue, then reopens the board.
click('#r5Board');finish();
assert.ok(q('.r5-board-panel'));
assert.match(q('.r5-problem').textContent,/描かれたものを正しく数え/);

const placements=[
 ['mirror','面'],['fish','尾'],['flower','輪'],['squid','杯'],['chair','脚'],['cannon','門'],['butterfly','頭']
];
for(let i=0;i<placements.length;i++){
  if(!q('.r5-board-panel'))click('#r5Board');
  const [id,counter]=placements[i];
  click('[data-tile="'+id+'"]');
  click('[data-counter="'+counter+'"]');
  finish();
}
assert.equal(save().rooms.room05.codeRevealed,true);
assert.equal(Object.keys(save().rooms.room05.placed).length,7);
assert.ok(q('#r5Keypad'));

click('#r5Keypad');
for(const d of ['8','1','9','4'])click('[data-digit="'+d+'"]');
click('[data-key="enter"]');finish();
assert.equal(save().rooms.room05.doorUnlocked,true);
assert.ok(q('#r5Rabbit'));

click('#r5Rabbit');finish();
assert.equal(save().rooms.room05.completed,true);
assert.equal(save().rooms.room05.memorySeen,true);
assert.ok(q('#r5Next'));

click('[data-gameplay="save"]');assert.ok(q('#saveSlotOverlay'));click('.save-slot-action');
assert.equal(JSON.parse(w.localStorage.getItem('saigononazo-save-v1-slot-1')).rooms.room05.completed,true);
q('#saveSlotOverlay').remove();

click('#r5Next');await new Promise(r=>setTimeout(r,720));
assert.equal(save().currentScene,'room06');
assert.ok(q('.r6-map'));assert.ok(q('#gameplayHud'));
console.log('PASS: Room 5 exploration -> counters -> 8194 keypad -> flashback -> Room 6.');
dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1});
