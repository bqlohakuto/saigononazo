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

test("No.152: chat opens without focusing a text field",()=>{
 const segment=source.slice(source.indexOf("function showThirdRoomChat(){"),source.indexOf("function inspectThirdRoomBed(){"));
 assert.match(segment,/activateDeviceModal\(overlay,"r3Phone",overlay\.querySelector\("\.device-close"\)/);
 assert.doesNotMatch(segment,/\.focus\(\)/);
 assert.ok(segment.includes('enterkeyhint="send"'));
});
test("C04: phone opening starts at the first chat message while a sent reply follows the tail",()=>{
 const chat=source.slice(source.indexOf("function showThirdRoomChat(){"),source.indexOf("function inspectThirdRoomBed(){"));
 const open=chat.slice(0,chat.indexOf('const close=activateDeviceModal('));
 assert.match(open,/showReference\(referenceMode\);\s*\/\/ C04:[^\n]*\n[^\n]*\n\s*stream\.scrollTop=0;/);
 assert.equal((open.match(/scrollToBottom\(\)/g)||[]).length,0,"Opening does not jump to the latest message");
 assert.match(chat,/saveGame\(\);scrollToBottom\(\)/,"A new reply still scrolls to the most recent message");
 assert.match(chat,/if\(room3State\.morseSolved\)receiveBoard\(\)/,"Existing saved replies still reconstruct the image");
});

test("No.153: duplicate device overlays prevent extra chats",()=>{
 const segment=source.slice(source.indexOf("function showThirdRoomChat(){"),source.indexOf("function inspectThirdRoomBed(){"));
 assert.ok(segment.includes('game.querySelector(".device-overlay,.room-dialog-overlay,.design-overlay,.inspection-overlay")'));
});
test("No.154-157: first reply earns a board; a second completes the memory puzzle",()=>{
 const correct=vm.runInNewContext(source+";room3ReplyIsCorrect",{});
 assert.equal(correct("ＯＮＡＪＩＭＯＪＩＮＯＡＩＤＡ","morse"),true);
 assert.equal(correct("ｲﾂﾓﾄﾅﾘﾆ","final"),true);
 const chat=source.slice(source.indexOf("function showThirdRoomChat(){"),source.indexOf("function inspectThirdRoomBed(){"));
 assert.ok(chat.includes("if(room3State.unlocked)return;"));
 assert.ok(chat.includes('if(correct&&stage==="morse")'));
 assert.ok(chat.includes('if(correct&&stage==="final")'));
 assert.ok(chat.includes("room3State.phoneReplies.push"));
 assert.ok(chat.includes("saveGame();scrollToBottom()"));
});
test("No.158-159 + C03: waking Hana enables visible repeat bed dialogue without saving",()=>{
 const state={bedInspected:true,trumpetInspected:true,trumpetAwakeTalkSeen:true};
 const notices=[],dialogs=[];let saves=0;
 const sandbox={
  room3State:state,
  showRoomNotice(text,id){notices.push({text,id})},
  showRoomDialog(lines){
   dialogs.push(Array.from(lines,line=>({logId:line.logId,logType:line.logType,speaker:line.speaker,text:line.text})));
  },
  saveGame(){saves++},
  renderThirdRoomView(){throw Error("No re-render necessary")}
 };
 vm.runInNewContext(source+";this.__bed=inspectThirdRoomBed;this.__trumpet=inspectThirdRoomTrumpet;",sandbox);
 sandbox.__bed();sandbox.__trumpet();
 assert.equal(saves,0,"Reinspection must not change saved progress");
 assert.equal(dialogs.length,1,"C03: bed uses a visible dialogue instead of hidden exploreStatus");
 assert.deepEqual(dialogs[0],[{
  logId:"room3_bed_repeat",logType:"investigation",speaker:"ト書き",
  text:"ベッドには、特に変わったところはない。"
 }]);
 assert.equal(notices.length,1,"Trumpet repeat remains the prior concise notice");
 assert.equal(notices[0].text,"記憶の中で使っていたものと同じトランペットだ。");
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
  GameAudio:{syncSceneMusic(){}},
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
