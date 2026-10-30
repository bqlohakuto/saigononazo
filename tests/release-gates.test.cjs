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
  assert.equal(q('#puzzleGuideButton'),null,'guide is nested inside the afterword');
  assert.equal(q('#commentButton').disabled,false);
  assert.equal(q('#commentButton').getAttribute('aria-label'),'あとがき');
  q('#commentButton').click();assert.ok(q('.afterword'));
  q('#puzzleGuideButton').click();assert.ok(q('.pguide:not(.afterword)'));
  q('#pguideBack').click();assert.ok(q('.afterword'));
  q('#afterwordBack').click();assert.ok(q('.title-home'));
  run('clearSave();showTitle()');await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(q('#commentButton').disabled,false,'earned afterword remains unlocked on a new run');
 }finally{ /* Keep DOM intact while queued image promises and title observers settle. */ }
});
test('author preview preserves eight-room picker and full guide for QA',async()=>{
 const {dom,w,q}=await boot(true);
 try{
  assert.equal(w.GameBuild.preview,true);
  assert.ok(q('#testRoomButton'));
  assert.equal(q('#commentButton').disabled,false);
  assert.equal(w.PuzzleGuide.isTestMode(),true);
  q('#testRoomButton').click();
  assert.equal(q('.test-room-options').querySelectorAll('[data-room]').length,8);
 }finally{ /* Keep DOM intact while queued image promises and title observers settle. */ }
});

test('first-visit notice has no story spoilers and releases its keyboard trap on scene replacement',async()=>{
 const {w,run,q}=await boot(false);
 const notice=q('#firstVisitNotice');
 assert.ok(notice,'new visitors see the initial instructions');
 assert.equal(q('.title-home').inert,true,'the title controls are blocked until acceptance');
 assert.match(notice.textContent,/ホーム画面に追加/);
 assert.match(notice.textContent,/横画面でのみ/);
 assert.match(notice.textContent,/謎が難しいと思ったら、ヒントを見てください/);
 assert.match(notice.textContent,/ヒントは段階的に表示され/);
 assert.match(notice.textContent,/ほぼ答えまで/);
 const trigger=q('#titleCommunityButton'),overlay=q('#titleCommunityOverlay');
 assert.ok(trigger&&overlay,'author contact control is present on title');
 assert.equal(trigger.textContent,'作者・お問い合わせ');
 assert.equal(overlay.hidden,true,'contact details do not clutter the title');
 assert.equal(trigger.getAttribute('aria-expanded'),'false');
 trigger.click();
 assert.equal(overlay.hidden,false,'contact dialog opens on request');
 assert.equal(trigger.getAttribute('aria-expanded'),'true');
 const profile=q('.title-community-account');
 assert.ok(profile);
 assert.equal(profile.getAttribute('href'),'https://x.com/arissa_juno');
 assert.equal(profile.getAttribute('target'),'_blank');
 assert.match(profile.getAttribute('rel'),/noopener/);
 assert.match(overlay.textContent,/XのDMまで/);
 assert.match(overlay.textContent,/#最後の謎が解けるまで/);
 q('.title-community-close').click();
 assert.equal(overlay.hidden,true,'contact dialog closes');
 assert.equal(trigger.getAttribute('aria-expanded'),'false');
 assert.doesNotMatch(notice.textContent,/事故|死亡|花音|最終謎/,'the notice must not reveal the story');
 run('showNameInput()');
 await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(q('#firstVisitNotice'),null,'scene replacement removes the old notice');
 const key=new w.KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true});
 w.document.dispatchEvent(key);
 assert.equal(key.defaultPrevented,false,'a detached first-visit notice never captures keyboard controls');
});
test('accepting the first-visit notice persists independently from save progress',async()=>{
 const {w,run,q}=await boot(false);
 const accept=q('#firstVisitAccept');
 assert.ok(accept);
 accept.click();
 assert.equal(q('#firstVisitNotice'),null);
 assert.notEqual(q('.title-home').inert,true,'the title controls are enabled after accepting the notice');
 assert.equal(w.localStorage.getItem('saigononazo-first-visit-notice-v1'),'accepted');
 run('clearSave();showTitle()');
 assert.equal(w.localStorage.getItem('saigononazo-first-visit-notice-v1'),'accepted');
});
