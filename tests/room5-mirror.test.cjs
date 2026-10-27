// npm install jsdom; node tests/room5-mirror.test.cjs
// Historical filename retained; this tests the confirmed full Room 5 flow.
const {JSDOM}=require(process.env.JSDOM_PATH||'jsdom');
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
const root=path.join(__dirname,'..');
const dom=new JSDOM('<div id="game-container"><div id="game"></div></div>',{url:'https://game.test/',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,ctx=dom.getInternalVMContext();
w.HTMLCanvasElement.prototype.getContext=()=>null;
w.matchMedia=()=>({matches:false,addEventListener(){}});w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};
for(const [,file] of fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^?]+)\?/g))vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const q=s=>w.document.querySelector(s),qa=s=>[...w.document.querySelectorAll(s)],click=s=>{assert.ok(q(s),'control exists: '+s);q(s).click();};
const save=()=>JSON.parse(w.localStorage.getItem('saigononazo-save-v1'));
function finish(){for(let n=0;n<1000&&q('#roomNextButton');n++)click('#roomNextButton');assert.equal(q('#roomNextButton'),null);}
click('#testRoomButton');click('[data-room="room05"]');finish();
assert.equal(save().currentScene,'room05');
assert.equal(qa('[data-item]').length,7);
assert.ok(q('#gameplayHud'));assert.ok(q('#gameplayBottomBar'));

assert.equal(q('#r5Scene').dataset.view,'front');
click('[data-item="mirror"]');finish();
click('#r5TurnLeft'); // front -> left: dining and planter
assert.equal(q('#r5Scene').dataset.view,'left');
for(const id of ['flower','butterfly','chair']){click('[data-item="'+id+'"]');finish();}
click('#r5TurnLeft'); // left -> back: television stand
assert.equal(q('#r5Scene').dataset.view,'back');
click('[data-item="cannon"]');finish();
click('#r5TurnLeft'); // back -> right: two separate refrigerator compartments
assert.equal(q('#r5Scene').dataset.view,'right');
click('[data-item="fish"]');finish(); // still closed; do not collect
assert.equal(save().rooms.room05.collected.includes('fish'),false);
click('#r5FridgeUpper');
assert.equal(save().rooms.room05.fridgeUpperOpen,true);
assert.equal(save().rooms.room05.fridgeLowerOpen,false);
click('[data-item="fish"]');finish();
click('#r5FridgeLower');
assert.equal(q('#r5Scene').dataset.fridge,'both-open');
click('[data-item="squid"]');finish();
assert.equal(save().rooms.room05.collected.length,7);
click('#r5TurnLeft'); // right -> front: puzzle and keypad
assert.equal(q('#r5Scene').dataset.view,'front');

// First board open shows the confirmed rule-discovery dialogue, then reopens the board.
click('#r5Board');finish();
assert.ok(q('.r5-board-panel'));
assert.match(q('.r5-problem').textContent,/描かれたものを正しく数え/);

// A wrong attempt shows its own combination and never locks or closes the board.
const board=q('.r5-board-panel');
click('[data-tile="mirror"]');click('[data-counter="尾"]');
assert.match(q('[data-counter="尾"] img').src,/mirror-tail\.png$/);
assert.equal(Object.keys(save().rooms.room05.placed).length,0);
assert.equal(q('.room-dialog-overlay'),null);
assert.equal(q('[data-tile="mirror"]').getAttribute('aria-pressed'),'true');

const placements=[
 ['mirror','面'],['fish','尾'],['flower','輪'],['squid','杯'],['chair','脚'],['cannon','門'],['butterfly','頭']
];
for(let i=0;i<placements.length;i++){
  if(!q('.r5-board-panel'))click('#r5Board');
  const [id,counter]=placements[i];
  if(q('[data-tile="'+id+'"]').getAttribute('aria-pressed')!=='true')click('[data-tile="'+id+'"]');
  click('[data-counter="'+counter+'"]');
  finish();
  assert.equal(q('.r5-board-panel'),board,'judgement must leave the same board open');
  assert.equal(qa('#r5Scene .r5-board-wall-grid .r5-wall-tile.is-placed img').length,i+1,'fitted artwork also appears on the wall');
}
assert.equal(save().rooms.room05.codeRevealed,true);
assert.equal(Object.keys(save().rooms.room05.placed).length,7);
// The adopted reveal is deliberately delayed until the fourth narration beat.
assert.equal(q('.r5-inlay-code').hidden,true);
for(let n=0;n<240&&q('.r5-inlay-code').hidden;n++)await new Promise(resolve=>setTimeout(resolve,50));
assert.equal(q('.r5-inlay-code').hidden,false,'8194 appears during the approved completion sequence');
assert.equal(q('.r5-inlay-code').textContent,'8194');
click('.r5-board-panel .device-close');
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
assert.ok(q('.r6-scene'));assert.equal(q('.r6-map'),null,'map is obtained during room 6 exploration');assert.ok(q('#gameplayHud'));
console.log('PASS: Room 5 exploration -> counters -> 8194 keypad -> flashback -> Room 6.');
dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1});
