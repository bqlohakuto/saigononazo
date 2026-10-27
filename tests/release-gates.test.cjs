const test=require('node:test'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');
async function boot(preview=false){
 const dom=new JSDOM('<div id="game-container"><div id="game"></div></div>',{url:'https://game.test/'+(preview?'?preview=1':''),runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,ctx=dom.getInternalVMContext();
 w.matchMedia=()=>({matches:true,addEventListener(){}});
 w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};
 w.HTMLCanvasElement.prototype.getContext=()=>null;
 for(const [,src]of fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^?]+)\?/g)){
  vm.runInContext(fs.readFileSync(path.join(root,src),'utf8'),ctx,{filename:src});
 }
 await new Promise(resolve=>setTimeout(resolve,0));
 return {dom,w,run:s=>vm.runInContext(s,ctx),q:s=>w.document.querySelector(s)};
}
test('public visitors cannot jump rooms or read solutions before completing the story',async()=>{
 const {dom,w,run,q}=await boot(false);
 try{
  assert.equal(w.GameBuild.preview,false);
  assert.equal(q('#testRoomButton'),null);
  assert.equal(q('#puzzleGuideButton'),null);
  assert.equal(w.PuzzleGuide.isUnlocked(),false);
  assert.equal(w.PuzzleGuide.markCleared(),false);
  run('showTestRoomPicker()');
  assert.equal(q('.test-room-overlay'),null);
  const title=q('.title-home');
  run('startRoomTest("room08")');
  assert.equal(q('.title-home'),title,'author shortcut cannot bypass public gate');
  w.PuzzleGuide.open(0);
  assert.equal(q('.pguide'),null,'direct guide call does not bypass clear gate');
  const save=(ended,epilogueSeen)=>JSON.stringify({saveVersion:2,playerName:"白兎",currentScene:"room08",opening:{index:0},rooms:{room08:{ended,epilogueSeen}},logs:[]});
  w.localStorage.setItem('saigononazo-save-v1',save(true,false));
  assert.equal(w.PuzzleGuide.markCleared(),false,'farewell alone does not unlock');
  w.localStorage.setItem('saigononazo-save-v1',save(false,true));
  assert.equal(w.PuzzleGuide.markCleared(),false,'partial ending cannot unlock');
  w.localStorage.setItem('saigononazo-save-v1',save(true,true));
  assert.equal(w.PuzzleGuide.markCleared(),true);
  run('showTitle()');await new Promise(resolve=>setTimeout(resolve,0));
  assert.ok(q('#puzzleGuideButton'),'finished epilogue reveals all explanations');
  q('#puzzleGuideButton').click();assert.ok(q('.pguide'));
  run('clearSave();showTitle()');await new Promise(resolve=>setTimeout(resolve,0));
  assert.ok(q('#puzzleGuideButton'),'earned guide remains unlocked on a new run');
 }finally{ /* Keep DOM intact while queued image promises and title observers settle. */ }
});
test('author preview preserves eight-room picker and full guide for QA',async()=>{
 const {dom,w,q}=await boot(true);
 try{
  assert.equal(w.GameBuild.preview,true);
  assert.ok(q('#testRoomButton'));
  assert.ok(q('#puzzleGuideButton'));
  assert.equal(w.PuzzleGuide.isTestMode(),true);
  q('#testRoomButton').click();
  assert.equal(q('.test-room-options').querySelectorAll('[data-room]').length,8);
 }finally{ /* Keep DOM intact while queued image promises and title observers settle. */ }
});
