"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.resolve(__dirname,"..");
const source=fs.readFileSync(path.join(root,"room2.js"),"utf8");
const chapter=fs.readFileSync(path.join(root,"scenario","02_room2.md"),"utf8");
const all=fs.readFileSync(path.join(root,"scenario","FULL_SCENARIO.md"),"utf8");

function inspectTopics(state,chosen="rules"){
 const buttons=[],dialogs=[];
 const list={appendChild(button){buttons.push(button)},querySelector(){return buttons[0]},querySelectorAll(){return buttons}};
 const overlay={innerHTML:"",querySelector(sel){if(sel===".hana-choice-list")return list;throw Error(sel)}};
 const sandbox={
  room2State:{doorInspected:false,deskInspected:false,unlocked:false,attempts:0,hanaHints:0,...state},
  document:{createElement(kind){if(kind==="div")return overlay;if(kind==="button")return {dataset:{},addEventListener(name,callback){this[name]=callback}};throw Error(kind)}},
  game:{querySelector(){return null},appendChild(){}},
  window:{HanaChoiceUI:{ensureStyle(){}}},
  activateDeviceModal(){return ()=>{}},
  showRoomDialog(lines,done){dialogs.push(Array.from(lines,line=>[line.speaker,line.text]));done?.()},
  saveGame(){}
 };
 vm.runInNewContext(source+"\nthis.__showSecondRoomHana=showSecondRoomHana;",sandbox);
 sandbox.__showSecondRoomHana();
 const target=buttons.find(button=>button.dataset.topic===chosen);
 if(target)target.click();
 return {names:buttons.map(button=>button.dataset.topic),labels:buttons.map(button=>button.textContent),dialogs,state:sandbox.room2State};
}

test("No.112: HIT/BLOW question is hidden until desk inspected regardless of door status",()=>{
 for(const doorInspected of [false,true]){
  const before=inspectTopics({doorInspected,deskInspected:false});
  assert.equal(before.names.includes("rules"),false);
  assert.equal(before.names.includes("room"),true);
  assert.equal(before.dialogs.length,0);
  const after=inspectTopics({doorInspected,deskInspected:true});
  assert.equal(after.names.includes("rules"),true);
  assert.equal(after.labels.includes("HITとBLOWについて"),true);
  assert.deepEqual(after.dialogs[0],[
   ["ハナ","HITは記号・色・位置が全部合っているもの。BLOWは記号と色が合っていて、位置だけ違うものだよ"],
   ["主人公","判定を比べながら、合っている組み合わせを絞っていくんですね"]
  ]);
 }
});

test("No.112: optional rules remain accessible after a clear without forcing the door visit",()=>{
 const afterClear=inspectTopics({deskInspected:true,doorInspected:false,unlocked:true});
 assert.equal(afterClear.names.includes("rules"),true);
 assert.equal(afterClear.names.includes("room"),true);
 assert.equal(afterClear.state.doorInspected,false);
});

test("No.112: manuscript and combined manuscript state the new discovery rule",()=>{
 for(const text of [chapter,all]){
  assert.match(text,/【校閲No\.112・案1 採用】/);
  assert.match(text,/机を調べるまではこの質問を表示しない/);
  assert.match(text,/「HITとBLOWについて」/);
 }
});
