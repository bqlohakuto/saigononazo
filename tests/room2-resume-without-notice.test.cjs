"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.resolve(__dirname,"..");
const source=fs.readFileSync(path.join(root,"room2.js"),"utf8");
const chapter=fs.readFileSync(path.join(root,"scenario","02_room2.md"),"utf8");
const full=fs.readFileSync(path.join(root,"scenario","FULL_SCENARIO.md"),"utf8");

function harness(){
 const elements=new Map(["r2Dresser","r2Door","r2Desk","r2Blocks","r2Hana"].map(id=>[id,{id,disabled:false,addEventListener(){}}]));
 const calls={notices:[],dialogues:[],transitions:0,saves:0,stops:0};
 const sandbox={
  document:{getElementById(id){return elements.get(id)||null}},
  Dialogue:{stop(){calls.stops++}},GameAudio:{syncSceneMusic(){}},GameLog:{list(){return []}},
  game:{innerHTML:"",querySelector(){return null}},
  window:{GameplayUI:null},
  showRoomNotice(text,id){calls.notices.push({text,id})},
  showRoomDialog(lines){calls.dialogues.push(Array.from(lines,line=>line.logId))},
  saveGame(){calls.saves++}
 };
 vm.runInNewContext(source+"\nthis.__show=showSecondRoom;",sandbox);
 sandbox.showThirdRoomBoundary=()=>{calls.transitions++};
 return {sandbox,calls,show:state=>sandbox.__show(state)};
}

test("No.123: resumed mid-puzzle save restores state with no resume notice or dialogue",()=>{
 const h=harness();
 const input={
  doorInspected:true,deskInspected:true,unlocked:false,attempts:4,run:5,
  answer:[{symbol:"〇",color:"赤"},{symbol:"△",color:"青"},{symbol:"□",color:"赤"},{symbol:"×",color:"青"},{symbol:"＋",color:"青"}],
  guess:[{symbol:"〇",color:"赤"}],
  history:[{hit:1,blow:2,guess:[{symbol:"〇",color:"赤"}]}],leftmostHintRevealed:true
 };
 h.show(input);
 assert.equal(h.calls.notices.length,0);
 assert.equal(h.calls.dialogues.length,0);
 assert.equal(h.calls.transitions,0);
 assert.equal(h.calls.saves,1);
 assert.equal(h.sandbox.room2State.doorInspected,true);
 assert.equal(h.sandbox.room2State.deskInspected,true);
 assert.equal(h.sandbox.room2State.attempts,4);
 assert.equal(h.sandbox.room2State.run,5);
 assert.equal(h.sandbox.room2State.guess.length,1);
 assert.equal(h.sandbox.room2State.history.length,1);
 assert.equal(h.sandbox.room2State.leftmostHintRevealed,true);
});

test("No.123: saved active bonus challenge resumes without a notice or loss of best",()=>{
 const h=harness();
 h.show({unlocked:true,deskInspected:true,challengeActive:true,attempts:3,challengeBest:2,
  guess:[{symbol:"＋",color:"青"}],history:[{hit:0,blow:4}],challengeCleared:true});
 assert.equal(h.calls.notices.length,0);
 assert.equal(h.calls.dialogues.length,0);
 assert.equal(h.sandbox.room2State.challengeActive,true);
 assert.equal(h.sandbox.room2State.challengeBest,2);
 assert.equal(h.sandbox.room2State.attempts,3);
 assert.match(h.sandbox.game.innerHTML,/id="r2Blocks"[^>]*><span>チャレンジ再開<\/span>/);
});

test("No.123: first entry retains all introduction lines",()=>{
 const h=harness();
 h.show(undefined);
 assert.equal(h.calls.notices.length,0);
 assert.equal(h.calls.dialogues.length,1);
 assert.deepEqual(h.calls.dialogues[0],["room2_intro_01","room2_intro_02","room2_intro_03","room2_intro_04"]);
 assert.equal(h.calls.transitions,0);
});

test("No.123: a saved next-room transition still proceeds as before",()=>{
 const h=harness();
 h.show({unlocked:true,deskInspected:true,nextRoomTransitionSeen:true});
 assert.equal(h.calls.notices.length,0);
 assert.equal(h.calls.dialogues.length,0);
 assert.equal(h.calls.transitions,1);
});

test("No.123: source and both manuscripts agree on omission of resume notification",()=>{
 assert.doesNotMatch(source,/room2_resumed/);
 assert.doesNotMatch(source,/続きから再開しました。/);
 assert.match(source,/if\(!savedState\)\{showRoomDialog\(room2IntroLines\)\} else if\(savedState\.nextRoomTransitionSeen\)\{showThirdRoomBoundary\(\)\}/);
 for(const text of [chapter,full]){
  assert.match(text,/【校閲No\.123・案1 採用】/);
  assert.match(text,/通知を表示せず、探索画面へそのまま戻る/);
  assert.match(text,/第3の部屋へ移動中の保存状態は既存の遷移処理を優先する/);
 }
});
