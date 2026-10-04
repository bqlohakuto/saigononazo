// npm install jsdom; node tests/room5-mirror.test.cjs
const {JSDOM}=require(process.env.JSDOM_PATH||'jsdom');
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
const root=path.join(__dirname,'..');
const dom=new JSDOM('<div id="game-container"><div id="game"></div></div>',{url:'https://game.test/',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,ctx=dom.getInternalVMContext();w.matchMedia=()=>({matches:false,addEventListener(){}});w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};
for(const [,file] of fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^?]+)\?/g))vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const run=code=>vm.runInContext(code,ctx),q=s=>w.document.querySelector(s),click=s=>{assert.ok(q(s),'control exists: '+s);q(s).click();};
const save=()=>JSON.parse(w.localStorage.getItem('saigononazo-save-v1'));
function finish(){for(let n=0;n<40&&q('#roomNextButton');n++)click('#roomNextButton');assert.equal(q('#roomNextButton'),null);}
click('#testRoomButton');click('[data-room="room05"]');
assert.equal(save().currentScene,'room05');click('#r5Table');
assert.equal(w.document.querySelectorAll('.r5-frame').length,8);assert.equal(w.document.querySelectorAll('.r5-frame.is-filled').length,1);assert.equal(q('.r5-tile'),null);
click('.device-close');click('#r5Mirror');finish();click('.r5-touch');
// Acquired state is committed before animation, so interruption cannot lose the tile.
assert.equal(save().rooms.room05.mirrorCollected,true);assert.equal(save().rooms.room05.mirrorPlaced,false);
await new Promise(r=>setTimeout(r,700));finish();
run('showTitle();');click('#continueButton');click('.save-slot-card:last-of-type .save-slot-action');
click('#r5Table');assert.ok(q('.r5-tile'));click('.r5-tile');click('[data-frame="head"]');
assert.equal(save().rooms.room05.mirrorPlaced,false);assert.ok(q('.r5-tile'));
click('.r5-tile');click('[data-frame="face"]');assert.equal(save().rooms.room05.mirrorPlaced,true);assert.equal(q('.r5-tile'),null);assert.equal(w.document.querySelectorAll('.r5-frame.is-filled').length,2);
click('.device-close');click('[data-action="save"]');click('.save-slot-action');
assert.equal(JSON.parse(w.localStorage.getItem('saigononazo-save-v1-slot-1')).rooms.room05.mirrorPlaced,true);
run('document.getElementById("saveSlotOverlay").remove();showTitle();');click('#continueButton');click('.save-slot-action');click('#r5Table');assert.equal(w.document.querySelectorAll('.r5-frame.is-filled').length,2);
click('.device-close');click('#r5Mirror');finish();assert.equal(save().rooms.room05.mirrorPlaced,true);
run('clearSave();roomStates.room04={completed:true,memorySeen:true,nextRoomTransitionSeen:true};r4NextPlaceholder();');assert.equal(save().currentScene,'room05');assert.equal(save().rooms.room04.completed,true);assert.equal(save().rooms.room05.mirrorCollected,false);
assert.equal(run('r5PlaceMirror("face")'),false);assert.equal(run('r5NormalizeState({mirrorPlaced:true}).mirrorCollected'),true);
console.log('PASS: room5 initial board, acquisition, wrong/correct manual placement, autosave/manual load, repeat inspection, room4 transition, normalization.');dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1});
