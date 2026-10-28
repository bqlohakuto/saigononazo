'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require(process.env.JSDOM_PATH||'jsdom');
const root=path.resolve(__dirname,'..');
test('E14: rabbit panel introduces memory in approved sensory order without changing story state prematurely',async()=>{
 const dom=new JSDOM('<div id="game-container"><div id="game"></div></div>',{url:'https://game.test/?preview=1',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,ctx=dom.getInternalVMContext();
 w.HTMLCanvasElement.prototype.getContext=()=>null;
 w.matchMedia=()=>({matches:true,addEventListener(){}});
 w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};
 try{
  for(const [,file] of fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^?]+)\?/g))
   vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
  vm.runInContext('settings.instantText=true',ctx);
  w.showFifthRoom({introSeen:true,boardClueSeen:true,boardIntroSeen:true,codeRevealed:true,doorUnlocked:true,memorySeen:false,completed:false});
  const q=s=>w.document.querySelector(s);
  const click=s=>{const element=q(s);assert(element,'expected clickable '+s);element.click()};
  assert(q('#r5Rabbit'),'rabbit clue can be investigated after the door opens');
  click('#r5Rabbit');
  // The authored scene is split into variable-length pages by expandScenario.
  // Inspect the log IDs/text directly, rather than assuming one click = one log line.
  const source=fs.readFileSync(path.join(root,'late-game.js'),'utf8');
  const start=source.indexOf('function r5RabbitMemoryStart()');
  const end=source.indexOf('const R5_MEMORY_LINES=',start);
  assert(start>=0&&end>start);
  const scene=source.slice(start,end);
  const expected=[
   ['r5_rabbit_01','……まだ、気になる。'],
   ['r5_rabbit_02','開いた扉へ向かいかけ、壁のパネルを振り返る。'],
   ['r5_rabbit_03','この絵……どこかで見たような気がします。'],
   ['r5_rabbit_04','思い出そうとしても、何も浮かんでこない。'],
   ['r5_memory_paper','触れた瞬間、指先に紙のざらついた感触が伝わった。'],
   ['r5_memory_fridge','遠くで冷蔵庫の低い音。'],
   ['r5_memory_dishes','食器の触れ合う小さな音。'],
   ['r5_final_humming','そして、聞き覚えのある女性の鼻歌。'],
   ['r5_memory_light','視界がゆっくりと明るくなっていく。']
  ];
  let last=-1;
  for(const [id,part] of expected){
   const at=scene.indexOf('line("'+id+'"',last+1);
   assert(at>last,'approved E14 log ID '+id+' follows previous line');
   assert(scene.slice(at,at+500).includes(part),'E14 text '+id+' is retained');
   last=at;
  }
  assert.match(scene,/\],r5Memory\);/,'the completed lead-in calls the existing recollection');
  assert(source.includes('line("r5m001","ト書き","気がつくと、僕はダイニングテーブルの前に座っていた。'),
   'the original recollection still begins after the lead-in');
  assert(q('#roomMessage .message')?.textContent.includes(expected[0][1]),'the new dialogue is visible after interacting with the rabbit');
  const saved=JSON.parse(w.localStorage.getItem('saigononazo-save-v1')).rooms.room05;
  assert.equal(saved.codeRevealed,true,'solved puzzle remains solved');
  assert.equal(saved.doorUnlocked,true,'door remains unlocked');
  assert.equal(saved.memorySeen,false,'memory is not complete before dialogue finishes');
 }finally{
  vm.runInContext('Dialogue.stop()',ctx);
  await new Promise(resolve=>setTimeout(resolve,100));
  dom.window.close();
 }
});
