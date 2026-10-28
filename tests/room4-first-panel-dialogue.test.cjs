"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const script=fs.readFileSync(path.join(root,"room4.js"),"utf8");
const extract=(begin,end)=>{
 const first=script.indexOf(begin),last=script.indexOf(end,first+begin.length);
 assert(first>=0&&last>first,"The current Room 4 helper exists: "+begin);
 return script.slice(first,last);
};
const implementation=extract("function r4Count(){","function r4All(){")+"\n"+extract("function r4Wall(){","function r4Box(){");

function runWall(initial={}){
 const room4State={wall:false,box:false,star:false,lightPuzzle:false,meteors:false,...initial};
 const dialogues=[],notices=[],rewards=[];
 let saves=0;
 const ctx={
  room4State,
  showRoomDialog(lines,onComplete){dialogues.push({lines,onComplete})},
  showRoomNotice(text,logId,kind){notices.push({text,logId,kind})},
  saveGame(){saves++},
  r4Refresh(key){rewards.push(key)}
 };
 const actions=vm.runInNewContext(implementation+";({r4Wall})",ctx);
 actions.r4Wall();
 return {room4State,dialogues,notices,rewards,saves:()=>saves,actions};
}
test("D03: discovering the wall glass first describes what can be seen, not another panel",()=>{
 const out=runWall();
 assert.equal(out.dialogues.length,1);
 const [first,second]=out.dialogues[0].lines;
 assert.equal(first.logId,"r4w1");
 assert.equal(first.speaker,"主人公");
 assert.equal(first.text,"……あれ？　壁に透明な板みたいなものが貼ってある……？");
 assert.doesNotMatch(first.text,/これも|パネル/);
 assert.equal(second.logId,"r4w2");
 assert.equal(second.text,"壁に貼られている透明な板の端に指をかけると、外れた。");
 assert.equal(out.room4State.wall,false,"Don't grant a panel until the short discovery dialogue is complete");
 out.dialogues[0].onComplete();
 assert.equal(out.room4State.wall,true);
 assert.equal(out.saves(),1);
 assert.deepEqual(out.rewards,["wall"]);
 out.actions.r4Wall();
 assert.equal(out.dialogues.length,1,"An already collected wall cannot replay discovery");
 assert.equal(out.notices[0].logId,"r4wall_done");
});

test("D03: after collecting another pane, the protagonist may recognize a similar panel",()=>{
 for(const owned of ["star","lightPuzzle","meteors","box"]){
  const out=runWall({[owned]:true});
  assert.equal(out.dialogues.length,1,owned);
  assert.equal(out.dialogues[0].lines[0].text,"あれ……これもパネルなんじゃ……？",owned);
  assert.equal(out.room4State[owned],true,"Previous panel remains acquired: "+owned);
  assert.equal(out.room4State.wall,false);
  out.dialogues[0].onComplete();
  assert.equal(out.room4State.wall,true);
  assert.deepEqual(out.rewards,["wall"]);
 }
});

test("D03: source manuscript and full scenario match the first and subsequent observations",()=>{
 for(const file of ["scenario/04_room4.md","scenario/FULL_SCENARIO.md"]){
  const text=fs.readFileSync(path.join(root,file),"utf8");
  assert.match(text,/（まだガラスパネルを1枚も見つけていない場合）/);
  assert.match(text,/……あれ？　壁に透明な板みたいなものが貼ってある……？/);
  assert.match(text,/（すでに別のガラスパネルを見つけている場合）/);
  assert.match(text,/あれ……これもパネルなんじゃ……？/);
 }
});
