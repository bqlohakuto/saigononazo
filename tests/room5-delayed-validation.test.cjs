'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.JSDOM_PATH||'jsdom');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const items=['mirror','fish','butterfly','flower','squid','chair','cannon'];
const correct={mirror:'面',fish:'尾',butterfly:'頭',flower:'輪',squid:'杯',chair:'脚',cannon:'門'};
function start(saved={}){
 const dom=new JSDOM('<div id="game-container"><div id="game"></div></div>',{url:'https://game.test/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,ctx=dom.getInternalVMContext();
 w.HTMLCanvasElement.prototype.getContext=()=>null;
 w.matchMedia=query=>({matches:query.includes('prefers-reduced-motion'),addEventListener(){}});
 w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};
 for(const [,file] of fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^?]+)\?/g))vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
 vm.runInContext('settings.instantText=true',ctx);
 w.GameAudio.correctFeedbackRemaining=()=>0;
 w.showFifthRoom({introSeen:true,boardClueSeen:true,boardIntroSeen:true,collected:items,...saved});
 const q=s=>w.document.querySelector(s);
 const click=s=>{const el=q(s);assert(el,'control exists: '+s);el.click()};
 const save=()=>JSON.parse(w.localStorage.getItem('saigononazo-save-v1')).rooms.room05;
 click('#r5Board');
 return {dom,w,q,click,save};
}
async function close(h){
 h.q('.device-close')?.click();
 h.w.document.querySelector('#game').replaceChildren();
 vm.runInContext('Dialogue.stop()',h.dom.getInternalVMContext());
 await new Promise(r=>setTimeout(r,25));
 h.dom.window.close();
}
function put(h,id,counter){
 h.click('[data-tile="'+id+'"]');
 h.click('[data-counter="'+counter+'"]');
}
test('no individual panel is judged before all seven are installed',async()=>{
 const h=start();try{
  const order=[...h.w.document.querySelectorAll('.r5-counter-slot')].map(el=>el.getAttribute('aria-label'));
  assert.equal(order.length,8);assert(order[0].includes('ウサギ'));
  for(const [i,id] of items.slice(0,6).entries()){
   const counter=i===0?'尾':i===1?'面':correct[id];
   put(h,id,counter);
   assert.equal(h.save().placed[id],counter);
   assert.equal(h.save().codeRevealed,false);
   assert.equal(h.q('.r5-inlay-code').hidden,true);
   assert(!h.q('#r5BoardFeedback').textContent.includes('違いますね'));
  }
  assert.equal(Object.keys(h.save().placed).length,6);
  assert(h.q('.r5-counter-slot.filled:not([disabled])'),'wrong fittings remain removable');
 }finally{await close(h)}
});
test('a wrong seventh placement returns every panel, then a correct arrangement opens ordinary dialogue',async()=>{
 const h=start();try{
  const first={mirror:'尾',fish:'面',butterfly:'頭',flower:'輪',squid:'杯',chair:'脚',cannon:'門'};
  for(const id of items)put(h,id,first[id]);
  assert.equal(Object.keys(h.save().placed).length,0);
  assert.equal(h.save().codeRevealed,false);
  assert.match(h.q('#r5BoardFeedback').textContent,/手元に戻る/);
  assert.equal(h.w.document.querySelectorAll('.r5-counter-slot.filled').length,1);
  assert.equal(h.w.document.querySelectorAll('[data-tile]').length,7);
  for(const id of items)put(h,id,correct[id]);
  assert.equal(h.save().codeRevealed,true);
  assert.deepEqual(JSON.parse(JSON.stringify(h.save().placed)),correct);
  assert(h.q('.room-dialog-overlay'));
 }finally{await close(h)}
});

test('arbitrary partial placements survive save/load, while old correct placements remain compatible',async()=>{
 const h=start();try{
  put(h,'mirror','尾');
  const saved=h.save();assert.equal(saved.placed.mirror,'尾');
  h.w.showFifthRoom(saved);h.click('#r5Board');
  assert.equal(h.save().placed.mirror,'尾');
  assert.match(h.q('[data-counter="尾"] img').getAttribute('src'),/mirror-tail\.png$/);
  h.click('[data-counter="尾"]');assert.equal(h.save().placed.mirror,undefined);
  h.w.showFifthRoom({introSeen:true,boardClueSeen:true,boardIntroSeen:true,collected:items,placed:{mirror:'面',fish:'尾'}});
  h.click('#r5Board');
  assert.match(h.q('[data-counter="面"] img').getAttribute('src'),/mirror-mask\.png$/);
  assert.match(h.q('[data-counter="尾"] img').getAttribute('src'),/fish-tail\.png$/);
  assert.equal(h.save().codeRevealed,false);
 }finally{await close(h)}
});


test('H02: ordinary completion dialogue does not log the digits before they are displayed',async()=>{
 const h=start();try{
  for(const id of items)put(h,id,correct[id]);
  assert.equal(h.save().codeRevealed,true);
  assert(h.q('.room-dialog-overlay'));
  const logs=()=>JSON.parse(h.w.localStorage.getItem('saigononazo-save-v1')).logs;
  assert(!logs().some(entry=>entry.text==='8194'));
  for(let i=0;i<30&&!logs().some(entry=>entry.text==='8194');i++)h.click('#roomNextButton');
  assert(logs().some(entry=>entry.text==='8194'),JSON.stringify(logs().slice(-10)));
  assert(!logs().some(entry=>entry.id.startsWith('r5_board_complete_07')));
 }finally{await close(h)}
});
