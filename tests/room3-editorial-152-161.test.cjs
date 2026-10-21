"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {test}=require("node:test");

const source=fs.readFileSync(path.join(__dirname,"..","room3.js"),"utf8");
const chapter=fs.readFileSync(path.join(__dirname,"..","scenario","03_room3.md"),"utf8");
const combined=fs.readFileSync(path.join(__dirname,"..","scenario","FULL_SCENARIO.md"),"utf8");

function node(){
 const handlers={};
 return {
  value:"",textContent:"",innerHTML:"",hidden:false,disabled:false,dataset:{},
  classList:{toggle(){},add(){}},
  addEventListener(type,fn){handlers[type]=fn},
  click(){handlers.click?.()},
  change(value){this.value=value;handlers.input?.()},
  append(){},appendChild(){},setAttribute(){},
  focus(){this.focused=true}
 };
}

function puzzle(saved={}){
 const names=[
  ".room3-answer-input",".room3-answer-submit",".room3-final-input",
  ".room3-final-submit",".room3-puzzle-panel",".room3-puzzle-instruction",
  ".room3-morse-entry",".room3-letterboard",".room3-final-entry",
  ".room3-puzzle-feedback",".device-close"
 ];
 const nodes=Object.fromEntries(names.map(k=>[k,node()]));
 const overlay={className:"",querySelector(selector){return nodes[selector]}};
 const state=Object.assign({
  doorInspected:true,chatRead:true,shelfInspected:true,morseSolved:false,
  unlocked:false,puzzleAttempts:0
 },saved);
 const room=node(),status=node();
 room.querySelector=()=>status;
 let savedCount=0,opened=0,closed=0,dialogues=0,initialFocus=null;
 const sandbox={
  room3State:state,
  game:{
   appendChild(){opened++},
   querySelector(selector){return selector===".room-three"?room:null}
  },
  document:{createElement(){return overlay}},
  activateDeviceModal(o,opener,initial){initialFocus=initial;return ()=>closed++},
  saveGame(){savedCount++},
  showRoomDialog(lines,done){dialogues++;done?.()},
  showRoomNotice(){throw Error("No puzzle gate was expected")}
 };
 vm.runInNewContext(source+";this.__puzzle=showThirdRoomPuzzle;",sandbox);
 sandbox.__puzzle();
 return {nodes,state,initialFocus,metrics:()=>({savedCount,opened,closed,dialogues})};
}

test("No.152: restored progress focuses only a visible interactive control",()=>{
 for(const [state,selector] of [
  [{morseSolved:false,unlocked:false},".room3-answer-input"],
  [{morseSolved:true,unlocked:false},".room3-final-input"],
  [{morseSolved:true,unlocked:true},".device-close"]
 ]){
  const h=puzzle(state);
  assert.equal(h.initialFocus,h.nodes[selector]);
 }
});

test("No.153: existing overlays and dialogue prevent duplicate puzzle opening",()=>{
 for(const blockedSelector of [
  ".device-overlay,.room-dialog-overlay,.design-overlay,.inspection-overlay"
 ]){
  let newElements=0,notices=0;
  const sandbox={
   room3State:{doorInspected:false,chatRead:false,shelfInspected:false},
   game:{querySelector(selector){return selector===blockedSelector?{}:null},appendChild(){}},
   document:{createElement(){newElements++;return node()}},
   showRoomNotice(){notices++}
  };
  vm.runInNewContext(source+";this.__puzzle=showThirdRoomPuzzle;",sandbox);
  sandbox.__puzzle();
  assert.equal(newElements,0);
  assert.equal(notices,0);
 }
});

test("No.154-155: editing either field removes only the previous feedback",()=>{
 const h=puzzle(),feedback=h.nodes[".room3-puzzle-feedback"];
 h.nodes[".room3-answer-input"].value="bad";
 h.nodes[".room3-answer-submit"].click();
 assert.equal(h.state.puzzleAttempts,1);
 assert.ok(feedback.textContent);
 h.nodes[".room3-answer-input"].change("ONAJIMOJINOAIDA");
 assert.equal(feedback.textContent,"");
 assert.equal(h.state.puzzleAttempts,1);
 h.nodes[".room3-answer-submit"].click();
 h.nodes[".room3-final-input"].value="bad";
 h.nodes[".room3-final-submit"].click();
 assert.ok(feedback.textContent);
 const attempts=h.state.puzzleAttempts;
 h.nodes[".room3-final-input"].change("ｲﾂﾓﾄﾅﾘﾆ");
 assert.equal(feedback.textContent,"");
 assert.equal(h.state.puzzleAttempts,attempts);
});

test("No.156-157: Unicode-normalized equivalent answers remain accepted",()=>{
 const h=puzzle();
 h.nodes[".room3-answer-input"].value="ＯＮＡＪＩＭＯＪＩＮＯＡＩＤＡ";
 h.nodes[".room3-answer-submit"].click();
 assert.equal(h.state.morseSolved,true);
 assert.equal(h.state.puzzleAttempts,1);
 h.nodes[".room3-final-input"].value="ｲﾂﾓﾄﾅﾘﾆ";
 h.nodes[".room3-final-submit"].click();
 assert.equal(h.state.unlocked,true);
 assert.equal(h.state.puzzleAttempts,2);
 assert.equal(h.metrics().dialogues,1);
});

test("No.158-159: revisiting bed and trumpet shows concise notices without saving",()=>{
 const state={bedInspected:true,trumpetInspected:true};
 const notices=[];let saves=0;
 const sandbox={
  room3State:state,
  showRoomNotice(text,id){notices.push({text,id})},
  showRoomDialog(){throw Error("No replay of the initial cutscene")},
  saveGame(){saves++},
  renderThirdRoomView(){throw Error("No re-render necessary")}
 };
 vm.runInNewContext(source+";this.__bed=inspectThirdRoomBed;this.__trumpet=inspectThirdRoomTrumpet;",sandbox);
 sandbox.__bed();sandbox.__trumpet();
 assert.equal(saves,0);
 assert.equal(notices.length,2);
 assert.equal(notices[0].text,"ベッドには、特に変わったところはない。");
 assert.equal(notices[1].text,"記憶の中で使っていたものと同じトランペットだ。");
 assert.equal(state.bedInspected,true);
 assert.equal(state.trumpetInspected,true);
});

test("No.160: opening a previously logged Morse chart never repeats its LOG entry",()=>{
 let logs=0,saves=0,notices=0,onClose=null;
 const state={shelfInspected:true,morseChartNoticeSeen:true,morseChartLogged:true};
 const sandbox={
  room3State:state,
  game:{appendChild(){},querySelector(){return null}},
  document:{createElement(){const n=node();n.querySelector=()=>node();return n}},
  recordLog(){logs++},saveGame(){saves++},showRoomNotice(){notices++},
  activateDeviceModal(overlay,opener,initial,close){onClose=close}
 };
 vm.runInNewContext(source+";this.__chart=showThirdRoomMorseChart;",sandbox);
 sandbox.__chart();onClose();
 sandbox.__chart();onClose();
 assert.equal(logs,0);
 assert.equal(saves,0);
 assert.equal(notices,0);
});

test("No.161: an unlocked old save restores the completed Morse stage",()=>{
 const nodes={};
 const stage=node();
 stage.querySelectorAll=()=>[];
 const game={
  innerHTML:"",
  querySelector(selector){return selector===".room3-stage"?stage:null}
 };
 let saved=0;
 const sandbox={
  game,
  document:{getElementById(id){return nodes[id]??(nodes[id]=node())}},
  Dialogue:{stop(){}},
  window:{},
  saveGame(){saved++},
  showRoomNotice(){},
  setTimeout(){throw Error("Already-seen memory must not replay")},
  showRoomDialog(){throw Error("Resume does not rerun intro")}
 };
 vm.runInNewContext(source+";this.__show=showThirdRoom;this.__state=()=>room3State;",sandbox);
 sandbox.__show({unlocked:true,morseSolved:false,memorySeen:true,view:"front"});
 const restored=sandbox.__state();
 assert.equal(restored.unlocked,true);
 assert.equal(restored.morseSolved,true);
 assert.equal(saved,1);
});

test("No.152-161: both manuscripts document the ten adopted fixes",()=>{
 for(let n=152;n<=161;n++){
  for(const manuscript of [chapter,combined]){
   assert.ok(manuscript.includes(`【校閲No.${n}・推奨案 採用】`),`No.${n} missing`);
  }
 }
});
