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
  const expected=[
   '……まだ、気になる。',
   '開いた扉へ向かいかけ、壁のパネルを振り返る。',
   'この絵……どこかで見たような気がします。',
   '思い出そうとしても、何も浮かんでこない。',
   '触れた瞬間、指先に紙のざらついた感触が伝わった。',
   '遠くで冷蔵庫の低い音。',
   '食器の触れ合う小さな音。',
   'そして、聞き覚えのある女性の鼻歌。',
   '視界がゆっくりと明るくなっていく。'
  ];
  // One authored line may occupy multiple display pages in the novel UI.
  // Accumulate pages until the first existing recollection line begins.
  const pages=[];
  let enteredMemory=false;
  for(let n=0;n<100&&q('#roomNextButton');n++){
   const page=q('#roomMessage .message')?.textContent||'';
   pages.push(page);
   if(pages.join('').includes('気がつくと、僕はダイニングテーブルの前に座っていた。')){
    enteredMemory=true;break;
   }
   click('#roomNextButton');
  }
  assert(enteredMemory,'existing Room 5 recollection starts after the transition');
  const transcript=pages.join('').replace(/\\s+/g,'');
  let position=0;
  for(const [index,part] of expected.entries()){
   const needle=part.replace(/\\s+/g,'');
   const at=transcript.indexOf(needle,position);
   assert(at>=position,'approved E14 line '+index+' appears in order, even across dialogue pages');
   position=at+needle.length;
  }
  assert(transcript.indexOf('気がつくと、僕はダイニングテーブルの前に座っていた。',position)>=position,
   'existing recollection starts after the approved sensory sequence');
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
