// npm install jsdom; node tests/room5-mirror.test.cjs
// Historical filename retained; this now tests the current Room 5 playtest flow.
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
function finish(){for(let n=0;n<240&&q('#roomNextButton');n++)click('#roomNextButton');assert.equal(q('#roomNextButton'),null);}
click('#testRoomButton');click('[data-room="room05"]');
assert.equal(save().currentScene,'room05');
assert.equal(qa('[data-item]').length,7);
assert.ok(q('#gameplayHud'));assert.ok(q('#gameplayBottomBar'));
for(const id of ['mirror','fish','butterfly','flower','squid','chair','cannon']){
  click('[data-item="'+id+'"]');finish();
}
assert.deepEqual(save().rooms.room05.collected.sort(),['butterfly','cannon','chair','fish','flower','mirror','squid'].sort());
click('#r5Board');
assert.match(q('.late-pending').textContent,/未確定/);
click('#r5TestComplete');finish();
assert.equal(save().rooms.room05.completed,true);
assert.ok(q('#r5Next'));
click('[data-gameplay="save"]');
assert.ok(q('#saveSlotOverlay'));
click('.save-slot-action');
assert.equal(JSON.parse(w.localStorage.getItem('saigononazo-save-v1-slot-1')).rooms.room05.completed,true);
q('#saveSlotOverlay').remove();
click('#r5Next');await new Promise(r=>setTimeout(r,720));
assert.equal(save().currentScene,'room06');
assert.ok(q('.r6-map'));
assert.ok(q('#gameplayHud'));
console.log('PASS: Room 5 full exploration, explicit unresolved puzzle bridge, save, and Room 6 transition.');
dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1});
