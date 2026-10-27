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
 const controls=[],spoken=[],hintCalls=[];
 const list={appendChild(button){controls.push(button)},querySelector(){return controls[0]},querySelectorAll(){return controls}};
 const overlay={innerHTML:"",querySelector(selector){if(selector===".hana-choice-list")return list;throw Error(selector)}};
 const context={
  room2State:{doorInspected:false,deskInspected:false,attempts:0,hanaHints:0,unlocked:false,history:[],...state},
  document:{createElement(name){if(name==="div")return overlay;if(name==="button")return {dataset:{},addEventListener(type,cb){this[type]=cb}};throw Error(name)}},
  game:{querySelector(){return null},appendChild(){}},
  window:{HanaChoiceUI:{ensureStyle(){}}},PuzzleHints:{show(...args){hintCalls.push(args)}},
  activateDeviceModal(){return ()=>{}},
  showRoomDialog(lines,done){spoken.push(Array.from(lines,line=>[line.speaker,line.text]));done?.()},
  saveGame(){}
 };
 vm.runInNewContext(gameSource+"\nthis.__showSecondRoomHana=showSecondRoomHana;",context);
 context.__showSecondRoomHana();
 const hint=controls.find(button=>button.dataset.topic==="hint");
 if(hint)hint.click();
 return {ids:controls.map(button=>button.dataset.topic),spoken,hintCalls,state:context.room2State};
}

const wrong={guess:[{symbol:"〇",color:"青"}],hit:0,blow:1};
const correct={guess:[{symbol:"〇",color:"青"}],hit:5,blow:0};

test("Room 2: optional strategy help follows desk inspection without automatic novel dialogue",()=>{
 for(const state of [{},{doorInspected:true},{deskInspected:true},{doorInspected:true,deskInspected:true},{deskInspected:true,attempts:1,history:[]},{deskInspected:true,attempts:1,history:[correct]}]){
  const result=topicsAt(state),available=!!state.deskInspected;
  assert.equal(result.ids.includes("hint"),available);
  assert.equal(result.hintCalls.length,available?1:0);
  assert.equal(result.spoken.length,0,"The help overlay must not silently advance the story");
  if(available){
   assert.equal(result.hintCalls[0][0],"r2_strategy");
   assert.equal(result.hintCalls[0][2].length,3);
  }
  assert.ok(result.ids.includes("room"));
 }
});
test("Room 2: the same three-stage hint remains available after wrong answers",()=>{
 for(const doorInspected of [false,true])for(const count of [1,6]){
  const result=topicsAt({doorInspected,deskInspected:true,attempts:count,history:[wrong]});
  assert.ok(result.ids.includes("hint"));
  assert.equal(result.hintCalls.length,1);
  assert.match(result.hintCalls[0][2][0],/一度に全部変えず/);
  assert.equal(result.spoken.length,0);
 }
});
test("Room 2: cleared story and challenge do not offer strategy help",()=>{
 for(const state of [{unlocked:true,history:[wrong],attempts:1},{unlocked:true,challengeActive:true,history:[wrong],attempts:1}]){
  const result=topicsAt(state);
  assert.ok(!result.ids.includes("hint"));
  assert.equal(result.hintCalls.length,0);
 }
});

test("No.113: manuscripts agree on the discovery trigger",()=>{
 for(const text of [chapter,complete]){
  assert.match(text,/【校閲No\.113・案1 採用】/);
  assert.match(text,/初回の不正解判定が履歴に記録された後/);
  assert.match(text,/前の判定と比べてみよう/);
 }
});
