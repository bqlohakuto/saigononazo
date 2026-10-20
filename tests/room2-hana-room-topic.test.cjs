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
const beforeClear=[
  ["ハナ","この部屋、何か仕掛けがありそうだね"],
  ["主人公","気になるところから調べてみます"]
];
const afterClear=[
  ["ハナ","この部屋の仕掛け、解けたね！"],
  ["主人公","はい。次へ進めそうです"]
];

function runRoomTopic(state){
 const buttons=[],dialogs=[],saved=[];
 const list={
  appendChild(button){buttons.push(button);},
  querySelector(){return buttons[0]},
  querySelectorAll(){return buttons}
 };
 const overlay={innerHTML:"",querySelector(selector){
  if(selector===".hana-choice-list")return list;
  throw new Error("Unexpected overlay selector: "+selector);
 }};
 const document={createElement(type){
  if(type==="div")return overlay;
  if(type==="button")return {dataset:{},handlers:{},addEventListener(event,handler){this.handlers[event]=handler;}};
  throw new Error("Unexpected element "+type);
 }};
 const sandbox={
  room2State:{doorInspected:false,deskInspected:false,unlocked:false,attempts:0,hanaHints:0,...state},
  document,
  game:{querySelector(){return null},appendChild(){}},
  window:{HanaChoiceUI:{ensureStyle(){}}},
  activateDeviceModal(){return ()=>{}},
  showRoomDialog(lines,onDone){dialogs.push(Array.from(lines,line=>[line.speaker,line.text]));onDone?.()},
  saveGame(){saved.push("saved")}
 };
 vm.runInNewContext(source+"\nthis.__showSecondRoomHana=showSecondRoomHana;",sandbox);
 sandbox.__showSecondRoomHana();
 const topic=buttons.find(button=>button.dataset.topic==="room");
 assert.ok(topic,"The room topic remains available");
 topic.handlers.click();
 return {dialog:dialogs[0],state:sandbox.room2State,saved:saved.length,labels:buttons.map(b=>b.textContent)};
}

test("No.111 and 114: room topic remains available and changes after unlocking",()=>{
 for(const state of [
  {doorInspected:false,deskInspected:false},
  {doorInspected:true,deskInspected:false},
  {doorInspected:false,deskInspected:true},
  {doorInspected:true,deskInspected:true},
  {doorInspected:true,deskInspected:true,unlocked:true},
  {doorInspected:false,deskInspected:true,unlocked:true},
  {doorInspected:false,deskInspected:false,unlocked:true}
 ]){
  const actual=runRoomTopic(state);
  assert.deepEqual(actual.dialog,state.unlocked?afterClear:beforeClear);
  assert.equal(actual.state.doorInspected,state.doorInspected);
  assert.equal(actual.state.deskInspected,state.deskInspected);
  assert.equal(actual.saved,1);
 }
});

test("No.111 and 114: manuscript and runtime agree on both dialogues",()=>{
 for(const text of [chapter,full]){
  assert.match(text,/【校閲No\.111・案1 採用】/);
  assert.match(text,/【校閲No\.114・案1 採用】/);
  for(const [,line] of [...beforeClear,...afterClear]){
   assert.ok(text.includes("「"+line+"」"),"Dialogue is in the manuscript");
  }
 }
 assert.ok(!source.includes("机のブロックを使って、扉の鍵を開けるみたいだね"));
 assert.ok(!source.includes("扉の言葉と机の記録を見て、順番を考えればよさそうですね"));
});
