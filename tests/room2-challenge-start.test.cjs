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

function harness(overrides={}){
 const buttons=new Map(),calls={dialogs:0,choices:0,saves:0,logs:[],overlays:[],closes:0,started:0};
 function btn(selector){
  if(!buttons.has(selector))buttons.set(selector,{handlers:{},addEventListener(event,cb){this.handlers[event]=cb}});
  return buttons.get(selector);
 }
 const state={unlocked:true,challengeActive:false,challengeBest:null,challengeCleared:false,
  attempts:4,guess:[{symbol:"〇",color:"赤"}],history:[{guess:[],hit:1,blow:0}],run:1,...overrides};
 const context={
  room2State:state,
  document:{createElement(name){assert.equal(name,"div");return {className:"",innerHTML:"",querySelector:btn}}},
  game:{appendChild(overlay){calls.overlays.push(overlay)}},
  activateDeviceModal(_node,id,focus){
   assert.equal(id,"r2Blocks");
   assert.equal(focus,btn(".room2-start-confirm"));
   return ()=>{calls.closes++};
  },
  showRoomDialog(){calls.dialogs++;throw Error("Start panel must not open novel dialogue")},
  showRoomChoices(){calls.choices++;throw Error("Start panel must not open separate choices")},
  recordLog(item){calls.logs.push(item)},
  saveGame(){calls.saves++}
 };
 vm.runInNewContext(source+"\nthis.__open=showRoom2ChallengeMenu;this.showSecondRoomPuzzle=()=>{};",context);
 context.showSecondRoomPuzzle=()=>{calls.started++};
 return {context,buttons,calls,open:()=>context.__open(),press:(selector)=>btn(selector).handlers.click()};
}

test("No.117: an unlocked desk opens one panel with rules, best, and two choices",()=>{
 for(const best of [null,3]){
  const h=harness({challengeBest:best});
  const previous=h.context.room2State.history;
  h.open();
  assert.equal(h.calls.dialogs,0);
  assert.equal(h.calls.choices,0);
  assert.equal(h.calls.overlays.length,1);
  const panel=h.calls.overlays[0];
  assert.equal(panel.className,"device-overlay room2-start-overlay");
  for(const phrase of ["8回チャレンジ","8回以内に正しい組み合わせを導こう。","何度でも挑戦できる。","挑戦する","部屋に戻る"]){
   assert.ok(panel.innerHTML.includes(phrase),phrase+" is missing");
  }
  assert.ok(panel.innerHTML.includes(best===null?"自己ベスト：未達成":"自己ベスト：3回。"));
  assert.equal(h.calls.logs.length,1,"The start explanation remains in LOG");
  assert.equal(h.context.room2State.challengeActive,false,"Showing the menu must not start a challenge");
  assert.equal(h.context.room2State.attempts,4,"Attempts remain unchanged until confirmation");
  assert.equal(h.context.room2State.history,previous,"History remains unchanged until confirmation");
  assert.equal(h.calls.saves,0);
  h.press(".room2-start-return");
  assert.equal(h.calls.closes,1);
  assert.equal(h.calls.started,0);
  assert.equal(h.context.room2State.challengeBest,best);
 }
});

test("No.117: confirming the start immediately resets attempts but preserves best and clear state",()=>{
 const h=harness({challengeBest:3,challengeCleared:true,flashbackSeen:true});
 h.open();
 h.press(".room2-start-confirm");
 assert.equal(h.calls.closes,1,"The welcome panel closes before the challenge board");
 assert.equal(h.context.room2State.challengeActive,true);
 assert.equal(h.context.room2State.attempts,0);
 assert.equal(h.context.room2State.guess.length,0);
 assert.equal(h.context.room2State.history.length,0);
 assert.equal(h.context.room2State.run,2);
 assert.equal(h.context.room2State.challengeBest,3);
 assert.equal(h.context.room2State.challengeCleared,true);
 assert.equal(h.context.room2State.flashbackSeen,true);
 assert.equal(h.calls.started,1);
 assert.equal(h.calls.saves,1);
});

test("No.117: challenge menu cannot appear before story clear or during another challenge",()=>{
 for(const state of [{unlocked:false},{challengeActive:true}]){
  const h=harness(state);
  h.open();
  assert.equal(h.calls.overlays.length,0);
  assert.equal(h.calls.logs.length,0);
 }
});

test("No.117: source and both manuscripts define a shared-layout start panel with no separate menu",()=>{
 assert.match(source,/class="room2-result-panel room2-start-panel"/);
 assert.match(source,/room2-start-confirm/);
 assert.match(source,/room2-start-return/);
 assert.match(source,/recordLog\(\{logId:"room2_challenge_offer"/);
 assert.doesNotMatch(source,/showRoomDialog\(\[\{logId:"room2_challenge_offer"/);
 assert.match(css,/\.room2-start-panel \.room2-start-confirm/);
 assert.match(css,/\.room2-start-overlay/);
 for(const text of [chapter,full]){
  assert.match(text,/【校閲No\.117・案1 採用】/);
  assert.match(text,/ノベルウィンドウと別の選択画面を経由しない/);
  assert.match(text,/「挑戦する」「部屋に戻る」/);
 }
});
