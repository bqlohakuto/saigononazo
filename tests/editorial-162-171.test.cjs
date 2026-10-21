"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {test}=require("node:test");
const room3=fs.readFileSync(path.join(__dirname,"..","room3.js"),"utf8");
const room4=fs.readFileSync(path.join(__dirname,"..","room4.js"),"utf8");
const docs=[
 fs.readFileSync(path.join(__dirname,"..","scenario","03_room3.md"),"utf8"),
 fs.readFileSync(path.join(__dirname,"..","scenario","04_room4.md"),"utf8"),
 fs.readFileSync(path.join(__dirname,"..","scenario","FULL_SCENARIO.md"),"utf8")
];
function element(){
 const handlers={};
 return {
  value:"",textContent:"",innerHTML:"",hidden:false,
  classList:{add(){},toggle(){}},
  dataset:{},
  addEventListener(type,fn){handlers[type]=fn},
  click(){this.onclick?.();handlers.click?.()},
  key(key,extra={}){
   let prevented=false;
   handlers.keydown?.({key,repeat:false,isComposing:false,preventDefault(){prevented=true},...extra});
   return prevented;
  },
  type(value){this.value=value;handlers.input?.()},
  focus(){this.focused=true},setAttribute(){},append(){},appendChild(){}
 };
}

function room3Puzzle(){
 const nodes={};
 const overlay={querySelector(k){return nodes[k]??(nodes[k]=element())}};
 const state={doorInspected:true,chatRead:true,shelfInspected:true,morseSolved:false,unlocked:false,puzzleAttempts:0};
 let memoryCalls=0;
 const sandbox={
  room3State:state,
  game:{querySelector(){return null},appendChild(){}},
  document:{createElement(){return overlay}},
  activateDeviceModal(){return ()=>{}},
  saveGame(){},
  showRoomDialog(lines,done){memoryCalls++;done?.()},
  showRoomNotice(){throw Error("All puzzle gates have passed")}
 };
 vm.runInNewContext(room3+";this.__puzzle=showThirdRoomPuzzle;",sandbox);
 sandbox.__puzzle();
 return {state,nodes,getMemoryCalls(){return memoryCalls}};
}

function room4Puzzle(kind){
 const nodes={input:element(),".r4-answer":element(),".r4-feedback":element(),".device-close":element()};
 const overlay={
  querySelector(k){return nodes[k]??(nodes[k]=element())},
  innerHTML:"",className:""
 };
 const state={star:false,lightPuzzle:false};
 let opened=0,saved=0,closed=0,dialogues=0;
 let blocking=false;
 const sandbox={
  room4State:state,
  window:{addEventListener(){}},
  game:{
   querySelector(selector){return blocking?{}:null},
   appendChild(){opened++}
  },
  document:{createElement(){return overlay}},
  showRoomDialog(lines,done){dialogues++},
  showRoomNotice(){},
  saveGame(){saved++},
  activateDeviceModal(){return ()=>closed++}
 };
 vm.runInNewContext(room4+";this.__open=r4WordPuzzle;",sandbox);
 sandbox.__open(kind);
 return {
  state,nodes,
  metrics(){return {opened,saved,closed,dialogues}},
  block(value){blocking=value},
  open(){sandbox.__open(kind)}
 };
}

test("No.162: a mixed-kanji final answer is accepted without altering the puzzle",()=>{
 const h=room3Puzzle();
 h.nodes[".room3-answer-input"].value="ONAJIMOJINOAIDA";
 h.nodes[".room3-answer-submit"].click();
 assert.equal(h.state.morseSolved,true);
 h.nodes[".room3-final-input"].value="いつも隣に";
 h.nodes[".room3-final-submit"].click();
 assert.equal(h.state.unlocked,true);
 assert.equal(h.getMemoryCalls(),1);
});

test("No.163-164: chat and chart respect existing inspection overlays",()=>{
 for(const [functionName,inspected] of [
  ["showThirdRoomChat",{deskInspected:true}],
  ["showThirdRoomMorseChart",{shelfInspected:true}]
 ]){
  let overlays=0;
  const sandbox={
   room3State:inspected,
   game:{querySelector(selector){return selector.includes(".inspection-overlay")?{}:null},appendChild(){overlays++}},
   document:{createElement(){overlays++;return element()}},
   showRoomNotice(){throw Error("No notice should be displayed")}
  };
  vm.runInNewContext(room3+";this.__open="+functionName+";",sandbox);
  sandbox.__open();
  assert.equal(overlays,0);
 }
});

test("No.165: navigation from invalid restored view uses front as its fallback",()=>{
 const state={view:"INVALID"};
 let rendered=0,saved=0;
 const sandbox={
  room3State:state,currentScene:"room03",
  game:{querySelector(){return null}},
  renderThirdRoomView(){rendered++},
  saveGame(){saved++}
 };
 const body=room3.match(/function turnThirdRoom\(step\)\{[\s\S]*?\n\}/)?.[0];
 assert.ok(body);
 vm.runInNewContext('const ROOM3_VIEWS=["front","right","back","left"];'+body+";this.__turn=turnThirdRoom;",sandbox);
 sandbox.__turn(1);
 assert.equal(state.view,"right");
 assert.equal(rendered,1);
 assert.equal(saved,1);
});

test("No.166: inspecting a cleared door opens the choice directly",()=>{
 let choice=0,dialogue=0;
 const body=room3.match(/function inspectThirdRoomDoor\(\)\{[\s\S]*?\n\}/)?.[0];
 assert.ok(body);
 const state={unlocked:true,memorySeen:true};
 const sandbox={
  room3State:state,
  showThirdRoomExitChoice(){choice++},
  showRoomDialog(){dialogue++},
  playThirdRoomMemory(){throw Error("Memory already seen")}
 };
 vm.runInNewContext(body+";this.__inspect=inspectThirdRoomDoor;",sandbox);
 sandbox.__inspect();
 assert.equal(choice,1);
 assert.equal(dialogue,0);
});

test("No.167: blank answers in both room-four word puzzles do not change state",()=>{
 for(const kind of ["STAR","LIGHT"]){
  const h=room4Puzzle(kind);
  h.nodes[".r4-answer"].click();
  assert.equal(h.nodes[".r4-feedback"].textContent,"答えを入力してください。");
  assert.equal(h.metrics().saved,0);
  assert.equal(h.metrics().dialogues,0);
  assert.equal(h.state.star,false);
  assert.equal(h.state.lightPuzzle,false);
 }
});

test("No.168: both word puzzles accept full-width English answers",()=>{
 for(const [kind,value,stateName] of [
  ["STAR","ＳＴＡＲ","star"],
  ["LIGHT","ＬＩＧＨＴ","lightPuzzle"]
 ]){
  const h=room4Puzzle(kind);
  h.nodes.input.value=value;
  h.nodes[".r4-answer"].click();
  assert.equal(h.state[stateName],true);
  assert.equal(h.metrics().saved,1);
  assert.equal(h.metrics().dialogues,1);
  assert.equal(h.metrics().closed,1);
 }
});

test("No.169: typing clears the old word-puzzle feedback",()=>{
 const h=room4Puzzle("STAR");
 h.nodes.input.value="bad";
 h.nodes[".r4-answer"].click();
 assert.ok(h.nodes[".r4-feedback"].textContent);
 h.nodes.input.type("STAR");
 assert.equal(h.nodes[".r4-feedback"].textContent,"");
 assert.equal(h.metrics().saved,0);
});

test("No.170: Enter key confirms; IME composition and repeats do not",()=>{
 const h=room4Puzzle("LIGHT");
 h.nodes.input.value="LIGHT";
 assert.equal(h.nodes.input.key("Enter",{isComposing:true}),false);
 assert.equal(h.nodes.input.key("Enter",{repeat:true}),false);
 assert.equal(h.metrics().saved,0);
 assert.equal(h.nodes.input.key("Enter"),true);
 assert.equal(h.state.lightPuzzle,true);
 assert.equal(h.metrics().saved,1);
});

test("No.171: a second word puzzle cannot open over an existing overlay",()=>{
 const h=room4Puzzle("STAR");
 const before=h.metrics().opened;
 h.block(true);
 h.open();
 assert.equal(h.metrics().opened,before);
 assert.equal(h.metrics().saved,0);
});

test("No.162-171: manuscripts record the selected non-story changes",()=>{
 for(let no=162;no<=171;no++){
  const chapter=no<=166?docs[0]:docs[1];
  const marker=`【校閲No.${no}・推奨案 採用】`;
  assert.ok(chapter.includes(marker),`Chapter note ${no}`);
  assert.ok(docs[2].includes(marker),`Combined note ${no}`);
 }
});
