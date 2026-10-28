'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.JSDOM_PATH||'jsdom');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const all=['mirror','fish','butterfly','flower','squid','chair','cannon'];
const clue=[
 'パネルには、短い文章が書かれている。',
 '描かれたものを正しく数え、あるべき場所へ導け。',
 '数えて、あるべき場所へ……？',
 'この丸い枠に、何かをはめるのかな',
 '部屋にも、手がかりがあるかもしれませんね。'
];
function start(saved={}){
 const dom=new JSDOM('<div id="game-container"><div id="game"></div></div>',{url:'https://game.test/?preview=1',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,ctx=dom.getInternalVMContext();
 w.HTMLCanvasElement.prototype.getContext=()=>null;
 w.matchMedia=()=>({matches:false,addEventListener(){}});w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};
 for(const [,file] of fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^?]+)\?/g))vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
 vm.runInContext('settings.instantText=true',ctx);
 let config;const install=w.GameplayUI.installRoom;
 w.GameplayUI.installRoom=function(c){if(c.sceneId==='room05')config=c;return install(c)};
 w.showFifthRoom({introSeen:true,...saved});
 const q=s=>w.document.querySelector(s);
 const click=s=>{const el=q(s);assert(el,'control exists: '+s);el.click()};
 const save=()=>JSON.parse(w.localStorage.getItem('saigononazo-save-v1')).rooms.room05;
 const finish=()=>{
  const pages=[];
  for(let n=0;n<200&&q('#roomNextButton');n++){
   pages.push(q('#roomMessage .message')?.textContent||'');click('#roomNextButton');
  }
  assert.equal(q('#roomNextButton'),null,'Dialogue completes');return pages;
 };
 return {dom,w,q,click,save,finish,objective:()=>config.objective()};
}
async function dispose(h){
 h.q('.device-overlay .device-close')?.click();
 vm.runInContext('Dialogue.stop()',h.dom.getInternalVMContext());
 await new Promise(resolve=>setTimeout(resolve,100));
 h.dom.window.close();
}

test('first board inspection shows the approved clue, opens the board and persists',async()=>{
 const h=start();try{
  assert.equal(h.objective(),'部屋を調べる');
  assert.equal(h.q('#gameplayObjectiveText'),null,'Current HUD has no visible objective');
  h.click('#r5Board');assert(h.q('.room-dialog-overlay'));assert.equal(h.q('.r5-board-panel'),null);
  assert.deepEqual(h.finish(),clue);
  assert(h.q('.r5-board-panel'));assert.equal(h.q('.r5-problem').textContent,clue[1]);
  assert.equal(h.save().boardClueSeen,true);assert.equal(h.objective(),'部屋を調べる');
  h.click('.r5-board-panel .device-close');h.click('#r5Board');
  assert.equal(h.q('.room-dialog-overlay'),null,'A repeat opens the board directly');
  assert(h.q('.r5-board-panel'));
  const saved=h.save();h.w.showFifthRoom(saved);h.click('#r5Board');
  assert.equal(h.q('.room-dialog-overlay'),null,'The first-inspection flag survives a reload');
  assert(h.q('.r5-board-panel'));
 }finally{await dispose(h)}
});

test('finding a panel before the board does not reveal the seven-panel objective',async()=>{
 const h=start({collected:['mirror']});try{
  assert.equal(h.objective(),'手に入れたパネルや部屋を調べる');
  h.click('#r5Board');assert.deepEqual(h.finish(),clue);
  assert.equal(h.objective(),'部屋からパネルを探す');
  assert.deepEqual(h.save().collected,['mirror']);
  assert(h.q('[data-tile="mirror"]'));
 }finally{await dispose(h)}
});

test('an interrupted first inspection is offered again after resuming',async()=>{
 const h=start();try{
  h.click('#r5Board');assert.equal(h.save().boardClueSeen,false);
  const saved=h.save();h.w.showFifthRoom(saved);h.click('#r5Board');
  assert(h.q('.room-dialog-overlay'));
  assert.deepEqual(h.finish(),clue);assert.equal(h.save().boardClueSeen,true);
 }finally{await dispose(h)}
});

test('collecting all seven first still shows the clue before the existing conversation',async()=>{
 const h=start({collected:all});try{
  assert.equal(h.objective(),'手に入れたパネルや部屋を調べる');
  h.click('#r5Board');const pages=h.finish();
  assert.deepEqual(pages.slice(0,clue.length),clue);
  assert(pages.includes('これで、全部集まりましたね。'),'The existing seven-panel dialogue follows');
  assert.equal(h.save().boardClueSeen,true);assert.equal(h.save().boardIntroSeen,true);
  assert.equal(h.objective(),'7枚のパネルを正しい数え方へ配置する');
  assert.equal(h.q('.r5-board-panel .r5-inventory').querySelectorAll('[data-tile]').length,7);
 }finally{await dispose(h)}
});

test('older saves that have already used the board do not replay the first inspection',async()=>{
 for(const saved of [
  {boardIntroSeen:true,collected:all},
  {collected:['mirror'],placed:{mirror:'面'}},
  {codeRevealed:true},
  {doorUnlocked:true}
 ]){
  const h=start(saved);try{
   assert.equal(h.save().boardClueSeen,true);
   h.click('#r5Board');assert.equal(h.q('.room-dialog-overlay'),null);
   assert(h.q('.r5-board-panel'));
  }finally{await dispose(h)}
 }
});

test('unknown placed-item data does not imply the board was already inspected',async()=>{
 const h=start({placed:{unknown:'面'}});try{
  assert.equal(h.save().boardClueSeen,false);
  h.click('#r5Board');assert.deepEqual(h.finish(),clue);
 }finally{await dispose(h)}
});

test('both scenario manuscripts contain the approved first-inspection dialogue',()=>{
 for(const file of ['scenario/05_room5.md','scenario/FULL_SCENARIO.md']){
  const text=fs.readFileSync(path.join(root,file),'utf8');
  for(const line of clue)assert(text.includes(line),file+' contains '+line);
 }
});
