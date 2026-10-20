"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.resolve(__dirname,"..");
const source=fs.readFileSync(path.join(root,"room2.js"),"utf8");
const chapter=fs.readFileSync(path.join(root,"scenario","02_room2.md"),"utf8");
const whole=fs.readFileSync(path.join(root,"scenario","FULL_SCENARIO.md"),"utf8");

function harness(){
 const span={textContent:""};
 const nodes=new Map(["r2Door","r2Desk","r2Blocks","r2Hana"].map(id=>[id,{
  id,disabled:false,addEventListener(){},querySelector(selector){return selector==="span"?span:null}
 }]));
 const room={innerHTML:""};
 const state={};
 const counters={saves:0,notices:0,dialogs:0,puzzleOpened:0,results:0,logs:0};
 const sandbox={
  document:{getElementById(id){return nodes.get(id)||null}},
  Dialogue:{stop(){}},game:room,window:{GameplayUI:null},
  showRoomNotice(){counters.notices++},saveGame(){counters.saves++},
  recordLog(){counters.logs++},showRoomDialog(){counters.dialogs++}
 };
 vm.runInNewContext(source+"\nthis.__show=showSecondRoom;this.__sync=syncRoom2BlocksLabel;this.__begin=beginRoom2Challenge;this.__finish=finishRoom2Challenge;",sandbox);
 sandbox.showSecondRoomPuzzle=()=>{counters.puzzleOpened++};
 sandbox.showRoom2ChallengeResult=()=>{counters.results++};
 return {sandbox,room,span,nodes,counters};
}

test("No.120: resumed save displays 'チャレンジ再開' before opening puzzle",()=>{
 const {sandbox,room,counters}=harness();
 sandbox.__show({unlocked:true,deskInspected:true,challengeActive:true,attempts:2,
  history:[{guess:[],hit:0,blow:1}],guess:[{symbol:"〇",color:"赤"}]});
 assert.match(room.innerHTML,/id="r2Blocks"[^>]*><span>チャレンジ再開<\/span>/);
 assert.equal(sandbox.room2State.challengeActive,true);
 assert.equal(sandbox.room2State.attempts,2);
 assert.equal(sandbox.room2State.history.length,1);
 assert.equal(sandbox.room2State.guess.length,1);
 assert.equal(counters.puzzleOpened,0,"Saving and entering the room must not automatically open a puzzle");
});

test("No.120: normal puzzle and cleared non-active challenge retain original desk label",()=>{
 for(const state of [
  {unlocked:false,challengeActive:false,deskInspected:true},
  {unlocked:true,challengeActive:false,deskInspected:true},
  {unlocked:false,challengeActive:true,deskInspected:true}
 ]){
  const {sandbox,room}=harness();
  sandbox.__show(state);
  assert.match(room.innerHTML,/id="r2Blocks"[^>]*><span>ブロックと記録枠<\/span>/);
  if(!state.unlocked)assert.equal(sandbox.room2State.challengeActive,false,"Invalid challenge state is normalized");
 }
});

test("No.120: beginning, finishing and restarting challenge update the existing desk target",()=>{
 const {sandbox,span,counters}=harness();
 sandbox.__show({unlocked:true,challengeActive:false,deskInspected:true,challengeBest:3});
 sandbox.__begin();
 assert.equal(span.textContent,"チャレンジ再開");
 assert.equal(sandbox.room2State.challengeActive,true);
 assert.equal(counters.puzzleOpened,1);
 sandbox.room2State.attempts=5;
 sandbox.__finish(()=>{},true);
 assert.equal(span.textContent,"ブロックと記録枠");
 assert.equal(sandbox.room2State.challengeActive,false);
 assert.equal(sandbox.room2State.challengeBest,3);
 assert.equal(counters.results,1);
 sandbox.__begin();
 assert.equal(span.textContent,"チャレンジ再開");
 assert.equal(sandbox.room2State.attempts,0);
 assert.equal(sandbox.room2State.challengeBest,3);
});

test("No.120: approved copy agrees across standalone and compiled manuscript",()=>{
 for(const text of [chapter,whole]){
  assert.match(text,/【校閲No\.120・案1 採用】/);
  assert.match(text,/「チャレンジ再開」に切り替わる/);
  assert.match(text,/画面内に新しい誘導文や状態バッジは追加しない/);
 }
 assert.match(source,/if\(label\)label\.textContent=room2State\.challengeActive\?"チャレンジ再開":"ブロックと記録枠"/);
});
