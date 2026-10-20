"use strict";

const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.resolve(__dirname,"..");
const source=fs.readFileSync(path.join(root,"room2.js"),"utf8");
const css=fs.readFileSync(path.join(root,"style.css"),"utf8");
const chapter=fs.readFileSync(path.join(root,"scenario","02_room2.md"),"utf8");
const full=fs.readFileSync(path.join(root,"scenario","FULL_SCENARIO.md"),"utf8");

function makeHarness(challengeActive){
 const snapshots=[];
 const nodes=new Map();
 const element=(name)=>{
  if(!nodes.has(name))nodes.set(name,{name,innerHTML:"",textContent:"",hidden:false,disabled:false,style:{},
   listeners:{},classList:{toggle(){}},focus(){},addEventListener(type,fn){this.listeners[type]=fn},
   querySelector(sel){return element(sel)},querySelectorAll(){return []},replaceChildren(){},get scrollTop(){return 0},set scrollTop(value){},get scrollHeight(){return 0}
  });
  return nodes.get(name);
 };
 const overlay={
  className:"",innerHTML:"",isConnected:true,
  querySelector:element,
  querySelectorAll(sel){return sel===".room2-attempt-step"?Array.from({length:8},()=>({classList:{toggle(){}}})):[]}
 };
 const game={appendChild(){snapshots.push(overlay)}};
 let closeHandler=null,closed=0,saves=0;
 const state={challengeActive,unlocked:challengeActive,attempts:2,challengeBest:3,guess:[{symbol:"〇",color:"赤"}],
  answer:[{symbol:"〇",color:"青"},{symbol:"△",color:"青"},{symbol:"□",color:"青"},{symbol:"×",color:"青"},{symbol:"＋",color:"青"}],
  history:[{guess:[{symbol:"〇",color:"赤"}],hit:0,blow:0}],leftmostHintRevealed:false};
 const context={
  room2State:state,game,document:{createElement(type){assert.equal(type,"div");return overlay}},
  activateDeviceModal(_overlay,opener,control,onClose){
   assert.equal(opener,"r2Blocks");
   assert.equal(control,element(".device-close"));
   closeHandler=()=>{closed++;onClose?.()};
   return closeHandler;
  },
  saveGame(){saves++},recordLog(){},
  window:{setTimeout(){return 100},clearTimeout(){}}
 };
 vm.runInNewContext(source+"\nthis.__showPuzzle=showSecondRoomPuzzle;",context);
 return {state,context,overlay,element,open:()=>context.__showPuzzle(),close:()=>closeHandler(),get closed(){return closed},get saved(){return saves}};
}

test("No.119: challenge close label names pausing explicitly; story mode keeps close",()=>{
 for(const active of [true,false]){
  const h=makeHarness(active);
  h.open();
  const markup=h.overlay.innerHTML;
  if(active){
   assert.match(markup,/class="device-close room2-pause" aria-label="一時中断"/);
   assert.match(markup,/title="回答と判定履歴を保持して部屋に戻る"/);
   assert.match(markup,/>一時中断<\/button>/);
   assert.match(markup,/class="room2-abandon"/);
   assert.match(markup,/残り回数/);
  }else{
   assert.match(markup,/class="device-close" aria-label="閉じる">×<\/button>/);
   assert.doesNotMatch(markup,/class="device-close room2-pause"/);
  }
 }
});

test("No.119: pause and reopen preserve the identical active challenge state",()=>{
 const h=makeHarness(true);
 const answer=h.state.answer,guess=h.state.guess,history=h.state.history,best=h.state.challengeBest;
 h.open();
 assert.equal(h.state.challengeActive,true);
 h.close();
 assert.equal(h.closed,1);
 assert.equal(h.saved,0,"Closing does not write a reset or alter saved challenge state");
 assert.equal(h.state.challengeActive,true);
 assert.equal(h.state.answer,answer);
 assert.equal(h.state.guess,guess);
 assert.equal(h.state.history,history);
 assert.equal(h.state.attempts,2);
 assert.equal(h.state.challengeBest,best);
 h.open();
 assert.equal(h.state.challengeActive,true);
 assert.equal(h.state.guess,guess);
 assert.equal(h.state.history,history);
 assert.match(h.overlay.innerHTML,/一時中断/);
 assert.equal(h.element(".room2-attempt-left").textContent,"残り6回");
});

test("No.119: CSS and both manuscripts distinguish a pause from quit",()=>{
 assert.match(css,/\.room2-puzzle \.room2-pause/);
 assert.match(css,/\.room2-puzzle \.room2-pause\+h2/);
 for(const text of [chapter,full]){
  assert.match(text,/【校閲No\.119・案1 採用】/);
  assert.match(text,/回答ブロックの配置、HIT・BLOWの判定履歴、解答回数・残り回数/);
  assert.match(text,/「挑戦をやめる」はNo\.118の確認パネル/);
 }
});
