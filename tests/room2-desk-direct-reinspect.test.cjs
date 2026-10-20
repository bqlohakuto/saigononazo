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

function harness(initial={}){
 const blocks={disabled:!initial.deskInspected};
 const calls={dialogs:[],saves:0,puzzles:0,startPanels:0};
 const sandbox={
  room2State:{doorInspected:false,deskInspected:false,unlocked:false,challengeActive:false,...initial},
  document:{getElementById(id){assert.equal(id,"r2Blocks");return blocks}},
  saveGame(){calls.saves++},
  showRoomDialog(lines){calls.dialogs.push(Array.from(lines,x=>x.logId))},
  showSecondRoomPuzzle(){calls.puzzles++},
  showRoom2ChallengeMenu(){calls.startPanels++}
 };
 vm.runInNewContext(source+"\nthis.__inspect=inspectSecondRoomDesk;",sandbox);
 return {state:sandbox.room2State,blocks,calls,inspect:()=>sandbox.__inspect()};
}

test("No.121: first desk inspection retains its exact three discovery messages",()=>{
 const h=harness();
 h.inspect();
 assert.equal(h.state.deskInspected,true);
 assert.equal(h.blocks.disabled,false);
 assert.equal(h.calls.saves,1);
 assert.deepEqual(h.calls.dialogs[0],["room2_desk_01","room2_desk_02","room2_desk_03"]);
 assert.equal(h.calls.puzzles,0);
 assert.equal(h.calls.startPanels,0);
});

test("No.121: subsequent desk inspection launches the story puzzle with no more narration",()=>{
 const h=harness();
 h.inspect();
 h.inspect();
 h.inspect();
 assert.equal(h.calls.dialogs.length,1,"Discovery narration is not repeated");
 assert.equal(h.calls.puzzles,2,"Every later inspection opens the actual puzzle");
 assert.equal(h.calls.startPanels,0);
 assert.equal(h.calls.saves,1,"Reinspection doesn't modify saved progress");
 assert.equal(h.state.doorInspected,false,"Door is still optional");
});

test("No.121: cleared story desk directly opens bonus start panel",()=>{
 const h=harness({deskInspected:true,unlocked:true,challengeActive:false,challengeBest:3});
 h.inspect();
 assert.equal(h.calls.puzzles,0);
 assert.equal(h.calls.startPanels,1);
 assert.equal(h.calls.dialogs.length,0);
 assert.equal(h.state.challengeBest,3);
 assert.equal(h.calls.saves,0);
});

test("No.121: desk resumes an active eight-turn challenge without resetting its progress",()=>{
 const saved={deskInspected:true,unlocked:true,challengeActive:true,attempts:4,
  guess:[{symbol:"〇",color:"赤"}],history:[{hit:0,blow:1}],challengeBest:2};
 const h=harness(saved);
 h.inspect();
 assert.equal(h.calls.puzzles,1);
 assert.equal(h.calls.startPanels,0);
 assert.equal(h.calls.dialogs.length,0);
 assert.equal(h.state.guess,saved.guess);
 assert.equal(h.state.history,saved.history);
 assert.equal(h.state.attempts,4);
 assert.equal(h.state.challengeBest,2);
 assert.equal(h.calls.saves,0);
});

test("No.121: manuscripts preserve first-time discovery and direct return routing",()=>{
 for(const document of [chapter,full]){
  assert.match(document,/【校閲No\.121・案1 採用】/);
  assert.match(document,/初回調査のときだけ/);
  assert.match(document,/文章や別の選択画面を挟まず/);
  assert.match(document,/一時中断中なら保存されたチャレンジの同じ盤面/);
 }
});
