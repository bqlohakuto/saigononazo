"use strict";

const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.resolve(__dirname,"..");
const gameSource=fs.readFileSync(path.join(root,"room2.js"),"utf8");
const chapter=fs.readFileSync(path.join(root,"scenario","02_room2.md"),"utf8");
const complete=fs.readFileSync(path.join(root,"scenario","FULL_SCENARIO.md"),"utf8");

function topicsAt(state){
 const controls=[],spoken=[];
 const list={appendChild(button){controls.push(button)},querySelector(){return controls[0]},querySelectorAll(){return controls}};
 const overlay={innerHTML:"",querySelector(selector){if(selector===".hana-choice-list")return list;throw Error(selector)}};
 const context={
  room2State:{doorInspected:false,deskInspected:false,attempts:0,hanaHints:0,unlocked:false,history:[],...state},
  document:{createElement(name){if(name==="div")return overlay;if(name==="button")return {dataset:{},addEventListener(type,cb){this[type]=cb}};throw Error(name)}},
  game:{querySelector(){return null},appendChild(){}},
  window:{HanaChoiceUI:{ensureStyle(){}}},
  activateDeviceModal(){return ()=>{}},
  showRoomDialog(lines,done){spoken.push(Array.from(lines,line=>[line.speaker,line.text]));done?.()},
  saveGame(){}
 };
 vm.runInNewContext(gameSource+"\nthis.__showSecondRoomHana=showSecondRoomHana;",context);
 context.__showSecondRoomHana();
 const hint=controls.find(button=>button.dataset.topic==="hint");
 if(hint)hint.click();
 return {ids:controls.map(button=>button.dataset.topic),spoken,state:context.room2State};
}

const wrong={guess:[{symbol:"〇",color:"青"}],hit:0,blow:1};
const correct={guess:[{symbol:"〇",color:"青"}],hit:5,blow:0};

test("No.113: no strategy hint before any incorrect judgement",()=>{
 for(const state of [
  {},
  {deskInspected:true},
  {doorInspected:true,deskInspected:true},
  {doorInspected:true,deskInspected:true,guess:[{symbol:"〇",color:"赤"}]},
  {deskInspected:true,attempts:1,history:[]},
  {deskInspected:true,attempts:1,history:[correct]}
 ]){
  const result=topicsAt(state);
  assert.ok(!result.ids.includes("hint"),"No prior incorrect result: "+JSON.stringify(state));
  assert.equal(result.spoken.length,0);
  assert.ok(result.ids.includes("room"),"General conversation remains available");
 }
});

test("No.113: first wrong judgement unlocks the exact existing advice with any door state",()=>{
 for(const doorInspected of [false,true]){
  for(const count of [1,6]){
   const result=topicsAt({doorInspected,deskInspected:true,attempts:count,history:[wrong]});
   assert.ok(result.ids.includes("hint"),"Hint unlocked by wrong judgement");
   assert.deepEqual(result.spoken[0],[
    ["ハナ","一度にたくさん変えると、どれが合っていたかわからなくなっちゃうよ。まずは一つずつ変えて、前の判定と比べてみよう"]
   ]);
  }
 }
});

test("No.113: solved story and challenge never show a strategy hint",()=>{
 for(const state of [{unlocked:true,history:[wrong],attempts:1},{unlocked:true,challengeActive:true,history:[wrong],attempts:1}]){
  const result=topicsAt(state);
  assert.ok(!result.ids.includes("hint"));
 }
});

test("No.113: manuscripts agree on the discovery trigger",()=>{
 for(const text of [chapter,complete]){
  assert.match(text,/【校閲No\.113・案1 採用】/);
  assert.match(text,/初回の不正解判定が履歴に記録された後/);
  assert.match(text,/前の判定と比べてみよう/);
 }
});
