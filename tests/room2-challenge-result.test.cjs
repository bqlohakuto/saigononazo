"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.resolve(__dirname,"..");
const code=fs.readFileSync(path.join(root,"room2.js"),"utf8");
const chapter=fs.readFileSync(path.join(root,"scenario","02_room2.md"),"utf8");
const all=fs.readFileSync(path.join(root,"scenario","FULL_SCENARIO.md"),"utf8");

function makeHarness(state){
 const calls={saved:0,puzzleClosed:0,resultClosed:0,logs:[],overlays:[],modalOpeners:[]};
 const buttons=new Map();
 function button(selector){
  if(!buttons.has(selector))buttons.set(selector,{handlers:{},addEventListener(name,fn){this.handlers[name]=fn}});
  return buttons.get(selector);
 }
 const sandbox={
  room2State:{unlocked:true,challengeActive:true,challengeCleared:false,challengeBest:null,attempts:8,run:3,...state},
  document:{createElement(kind){
   assert.equal(kind,"div");
   return {className:"",innerHTML:"",querySelector:button};
  }},
  game:{appendChild(overlay){calls.overlays.push(overlay)}},
  activateDeviceModal(_overlay,opener,focus){
   assert.equal(opener,"r2Blocks");
   assert.equal(focus,button(".room2-result-retry"));
   calls.modalOpeners.push(opener);
   return ()=>{calls.resultClosed++};
  },
  saveGame(){calls.saved++},
  recordLog(log){calls.logs.push(log)},
  showRoomDialog(){throw Error("No extra novel dialogue window should be opened")},
  showRoomChoices(){throw Error("No separate choices menu should be opened")}
 };
 vm.runInNewContext(code+"\nthis.__finish=finishRoom2Challenge;this.__info=room2ChallengeResultInfo;",sandbox);
 return {sandbox,calls,buttons,finish:(success)=>sandbox.__finish(()=>{calls.puzzleClosed++},success),info:sandbox.__info};
}

test("No.116: success, record, failure and old record all create the correct result content",()=>{
 const info=makeHarness({}).info;
 const cases=[
  [true,8,8,true,["チャレンジ達成！","8回で正解した。","自己ベスト更新！　8回！"]],
  [true,5,3,false,["チャレンジ達成！","5回で正解した。","自己ベスト：3回。"]],
  [false,8,null,false,["今回は達成できなかった","8回の挑戦が終わった。","自己ベスト：未達成"]],
  [false,8,4,false,["今回は達成できなかった","8回の挑戦が終わった。","自己ベスト：4回。"]]
 ];
 for(const [success,attempts,best,newRecord,strings] of cases){
  const result=info(success,attempts,best,newRecord);
  assert.deepEqual([result.title,result.detail,result.bestText],strings);
  assert.ok(result.logText.includes("\n"),"Result log preserves readable line breaks");
 }
});

test("No.116: successful challenge finishes with one immediately interactive result panel",()=>{
 const h=makeHarness({attempts:5,challengeBest:7});
 h.finish(true);
 assert.equal(h.sandbox.room2State.challengeActive,false);
 assert.equal(h.sandbox.room2State.challengeCleared,true);
 assert.equal(h.sandbox.room2State.challengeBest,5);
 assert.equal(h.calls.puzzleClosed,1);
 assert.equal(h.calls.overlays.length,1);
 const panel=h.calls.overlays[0];
 assert.equal(panel.className,"device-overlay room2-result-overlay");
 for(const text of ["チャレンジ達成！","5回で正解した。","自己ベスト更新！","もう一度挑戦する","部屋に戻る"]){
  assert.ok(panel.innerHTML.includes(text),text+" must be visible without text advancement");
 }
 assert.equal(h.calls.logs.length,1);
 assert.equal(h.calls.logs[0].logId,"room2_challenge_result_3");
 assert.ok(h.calls.logs[0].text.includes("自己ベスト更新！"));
 assert.equal(typeof h.buttons.get(".room2-result-retry").handlers.click,"function");
 assert.equal(typeof h.buttons.get(".room2-result-return").handlers.click,"function");
 h.buttons.get(".room2-result-return").handlers.click();
 assert.equal(h.calls.resultClosed,1,"Return button directly dismisses the result");
});

test("No.116: failure preserves unlocked story and earlier best while showing retry choices",()=>{
 const h=makeHarness({attempts:8,challengeBest:3,challengeCleared:true,flashbackSeen:true});
 h.finish(false);
 assert.equal(h.sandbox.room2State.challengeActive,false);
 assert.equal(h.sandbox.room2State.challengeCleared,true);
 assert.equal(h.sandbox.room2State.unlocked,true);
 assert.equal(h.sandbox.room2State.flashbackSeen,true);
 assert.equal(h.sandbox.room2State.challengeBest,3);
 const html=h.calls.overlays[0].innerHTML;
 for(const text of ["今回は達成できなかった","8回の挑戦が終わった。","自己ベスト：3回。","もう一度挑戦する","部屋に戻る"]){
  assert.ok(html.includes(text));
 }
 assert.equal(h.calls.logs.length,1);
 assert.ok(h.calls.logs[0].text.includes("今回は正解に届かなかった。"));
});

test("No.116: standalone and combined manuscripts agree on the single-panel result",()=>{
 for(const text of [chapter,all]){
  assert.match(text,/【校閲No\.116・案1 採用】/);
  assert.match(text,/結果パネルを一画面で表示/);
  assert.match(text,/文字送りや別の選択画面を挟まない/);
  assert.match(text,/結果はLOGにも記録する/);
 }
});
