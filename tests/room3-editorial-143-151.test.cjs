"use strict";

const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {test}=require("node:test");
const source=fs.readFileSync(path.join(__dirname,"..","room3.js"),"utf8");
const chapter=fs.readFileSync(path.join(__dirname,"..","scenario","03_room3.md"),"utf8");
const combined=fs.readFileSync(path.join(__dirname,"..","scenario","FULL_SCENARIO.md"),"utf8");

function element(){
 const handlers={};
 return {
  value:"",textContent:"",innerHTML:"",hidden:false,disabled:false,dataset:{},
  classList:{toggle(){},add(){}},
  addEventListener(name,fn){handlers[name]=fn},
  click(){handlers.click?.()},
  key(key,overrides={}){let prevented=false;handlers.keydown?.({key,isComposing:false,repeat:false,preventDefault(){prevented=true},...overrides});return prevented},
  append(){},appendChild(){},setAttribute(){},focus(){this.focused=true}
 };
}
function puzzle(){
 const selectors=[
  ".room3-answer-input",".room3-answer-submit",".room3-final-input",".room3-final-submit",
  ".room3-puzzle-panel",".room3-puzzle-instruction",".room3-morse-entry",
  ".room3-letterboard",".room3-final-entry",".room3-puzzle-feedback",".device-close"
 ];
 const nodes=Object.fromEntries(selectors.map(selector=>[selector,element()]));
 const overlay={className:"",innerHTML:"",querySelector(selector){return nodes[selector]}};
 const state={
  doorInspected:true,chatRead:true,shelfInspected:true,
  morseSolved:false,unlocked:false,puzzleAttempts:0
 };
 const room=element();const status=element();
 let saved=0,closed=0,memories=0;
 room.querySelector=()=>status;
 const sandbox={
  room3State:state,
  game:{
   appendChild(){},
   querySelector(selector){return selector===".room-three"?room:null}
  },
  document:{createElement(){return overlay}},
  activateDeviceModal(){return ()=>closed++},
  saveGame(){saved++},
  showRoomDialog(lines,done){memories++;done?.()},
  showRoomNotice(){throw new Error("Puzzle should not gate with complete prerequisites")}
 };
 vm.runInNewContext(source+";this.__puzzle=showThirdRoomPuzzle;",sandbox);
 sandbox.__puzzle();
 return {nodes,state,metrics:()=>({saved,closed,memories})};
}

test("No.143-145: empty answers do not count; wrong answers are saved in both stages",()=>{
 const {nodes,state,metrics}=puzzle(),text=()=>nodes[".room3-puzzle-feedback"].textContent;
 nodes[".room3-answer-submit"].click();
 assert.equal(text(),"答えを入力してください。");
 assert.equal(state.puzzleAttempts,0);
 assert.equal(metrics().saved,0);
 nodes[".room3-answer-input"].value="wrong";
 nodes[".room3-answer-submit"].click();
 assert.equal(state.puzzleAttempts,1);
 assert.equal(metrics().saved,1);
 assert.equal(text(),"顔文字とモールス対応表を、もう一度見比べてみよう。");
 nodes[".room3-answer-input"].value="ONAJIMOJINOAIDA";
 nodes[".room3-answer-submit"].click();
 assert.equal(state.morseSolved,true);
 assert.equal(state.puzzleAttempts,2);
 assert.equal(metrics().saved,2);
 nodes[".room3-final-submit"].click();
 assert.equal(text(),"言葉を入力してください。");
 assert.equal(state.puzzleAttempts,2);
 nodes[".room3-final-input"].value="wrong";
 nodes[".room3-final-submit"].click();
 assert.equal(state.puzzleAttempts,3);
 assert.equal(metrics().saved,3);
 assert.equal(text(),"文字盤から読み取った言葉を入力しよう。");
});

test("No.146-148: Enter submits unless composing/repeated; focus advances after first solution",()=>{
 const {nodes,state}=puzzle();
 const first=nodes[".room3-answer-input"],final=nodes[".room3-final-input"];
 first.value="ONAJIMOJINOAIDA";
 assert.equal(first.key("Enter",{isComposing:true}),false);
 assert.equal(first.key("Enter",{repeat:true}),false);
 assert.equal(state.puzzleAttempts,0);
 assert.equal(first.key("Enter"),true);
 assert.equal(state.puzzleAttempts,1);
 assert.equal(state.morseSolved,true);
 assert.equal(final.focused,true);
 final.value="イツモトナリニ";
 assert.equal(final.key("Enter",{isComposing:true}),false);
 assert.equal(final.key("Enter"),true);
 assert.equal(state.unlocked,true);
});

test("No.149: chart close notification fires once across multiple opens",()=>{
 const state={shelfInspected:true,morseChartNoticeSeen:false};
 let noticeCount=0,saved=0,closeHook=null;
 const sandbox={
  room3State:state,game:{appendChild(){},querySelector(){return null}},
  document:{createElement(){return element()}},
  recordLog(){},
  saveGame(){saved++},
  showRoomNotice(){noticeCount++},
  activateDeviceModal(overlay,opener,initial,onClose){closeHook=onClose}
 };
 vm.runInNewContext(source+";this.__chart=showThirdRoomMorseChart;",sandbox);
 // Use synthetic chart with modal selectors; the code renders the full 26-letter key.
 const originalCreate=sandbox.document.createElement;
 sandbox.document.createElement=tag=>{
  const e=originalCreate(tag);
  if(tag==="div")e.querySelector=selector=>element();
  return e;
 };
 sandbox.__chart();closeHook();
 sandbox.__chart();closeHook();
 assert.equal(noticeCount,1);
 assert.equal(saved,1);
 assert.equal(state.morseChartNoticeSeen,true);
});

test("No.150-151: repeat desk/door inspection is concise and does not save again",()=>{
 const state={unlocked:false,doorInspected:true,deskInspected:true};
 const notices=[];let saves=0;
 const sandbox={
  room3State:state,
  showRoomNotice(...args){notices.push(args)},
  saveGame(){saves++},
  showRoomDialog(){throw new Error("Repeat inspections must not replay the initial dialogue")}
 };
 vm.runInNewContext(source+";this.__desk=inspectThirdRoomDesk;this.__door=inspectThirdRoomDoor;",sandbox);
 sandbox.__desk();sandbox.__door();
 assert.equal(notices.length,2);
 assert.equal(notices[0][0],"黒い天板の机だ。スマートフォンと文字盤がある。");
 assert.equal(notices[1][0],"『顔に隠された合図を読み、隠された想いを言葉にせよ』");
 assert.equal(saves,0);
});

test("No.143-151: chapter and combined scripts record all adopted edits",()=>{
 for(let number=143;number<=151;number++){
  for(const text of [chapter,combined])
   assert.ok(text.includes(`【校閲No.${number}・推奨案 採用】`),`No.${number} missing`);
 }
});
