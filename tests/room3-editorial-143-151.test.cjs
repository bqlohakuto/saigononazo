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
const replyCorrect=vm.runInNewContext(source+";room3ReplyIsCorrect",{});

test("No.143-145: text replies validate both stages without spoiling the answer",()=>{
 for(const answer of ["ONAJIMOJINOAIDA","ＯＮＡＪＩＭＯＪＩＮＯＡＩＤＡ","オナジモジノアイダ","同じ文字の間","同じ文字のあいだ"]){
  assert.equal(replyCorrect(answer,"morse"),true,answer);
 }
 for(const answer of ["イツモトナリニ","いつもとなりに","ｲﾂﾓﾄﾅﾘﾆ"]){
  assert.equal(replyCorrect(answer,"final"),true,answer);
 }
 for(const answer of ["", "NOT THE ANSWER","おなじもじのあいだ"]){
  if(answer)assert.equal(replyCorrect(answer,"final"),false,answer);
 }
 assert.equal(replyCorrect("ONAJIMOJINOAIDA","final"),false);
 assert.equal(replyCorrect("イツモトナリニ","morse"),false);
});

test("No.146-148: third-room replies replace the old standalone input",()=>{
 const chat=source.slice(source.indexOf("function showThirdRoomChat(){"),source.indexOf("function inspectThirdRoomBed(){"));
 const puzzle=source.slice(source.indexOf("function showThirdRoomPuzzle(){"),source.indexOf("function playThirdRoomMemory(){"));
 assert.ok(chat.includes('r3-reply-input'));
 assert.ok(chat.includes('r3-reply-form'));
 assert.ok(chat.includes('r3-board-preview'));
 assert.ok(chat.includes('r3-large-letterboard'));
 assert.ok(chat.includes('r3-inline-morse'));
 assert.ok(chat.includes('input.value.trim()'));
 assert.ok(!chat.includes('input.focus()'),"Keyboard remains closed until player selects the reply field");
 assert.match(puzzle,/showThirdRoomChat\(\)/,"Desk object enters the phone, not another answer modal");
 assert.doesNotMatch(source,/room3-answer-input|room3-final-input/);
});

test("Room 3 saves replies, receives the approved board and transitions only after final reply",()=>{
 const chat=source.slice(source.indexOf("function showThirdRoomChat(){"),source.indexOf("function inspectThirdRoomBed(){"));
 assert.match(chat,/room3State\.phoneReplies\.push/);
 assert.match(chat,/room3State\.morseSolved=true;receiveBoard\(\)/);
 assert.match(chat,/room3State\.unlocked=true/);
 assert.match(chat,/setTimeout\(\(\)=>\{if\(overlay\.isConnected\)close\(\)\},650\)/);
 assert.match(chat,/playThirdRoomMemory\(\)/);
 assert.ok(chat.includes("images/items/room03-chat-letterboard.svg"));
});

test("No.149: chart close notification fires once across multiple opens",()=>{
 const state={shelfInspected:true,morseChartNoticeSeen:false};
 let noticeCount=0,saved=0,closeHook=null,logged=0;
 const sandbox={
  room3State:state,game:{appendChild(){},querySelector(){return null}},
  document:{createElement(){return element()}},
  recordLog(){logged++},
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
 assert.equal(saved,2);
 assert.equal(logged,1);
 assert.equal(state.morseChartNoticeSeen,true);
 assert.equal(state.morseChartLogged,true);
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
 assert.equal(notices[0][0],"黒い天板の机だ。スマートフォンがある。");
 assert.equal(notices[1][0],"『顔に隠された合図を読み、隠された想いを言葉にせよ』");
 assert.equal(saves,0);
});

test("No.143-151: chapter and combined scripts record all adopted edits",()=>{
 for(let number=143;number<=151;number++){
  for(const text of [chapter,combined])
   assert.ok(text.includes(`【校閲No.${number}・推奨案 採用】`),`No.${number} missing`);
 }
});
