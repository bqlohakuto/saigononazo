"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.resolve(__dirname,"..");
const script=fs.readFileSync(path.join(root,"room2.js"),"utf8");
const modal=fs.readFileSync(path.join(root,"script.js"),"utf8");
const css=fs.readFileSync(path.join(root,"style.css"),"utf8");
const chapter=fs.readFileSync(path.join(root,"scenario","02_room2.md"),"utf8");
const all=fs.readFileSync(path.join(root,"scenario","FULL_SCENARIO.md"),"utf8");

function createHarness(){
 const state={
  unlocked:true,flashbackSeen:true,challengeActive:true,challengeBest:3,challengeCleared:true,
  guess:[{symbol:"〇",color:"赤"}],history:[{guess:[],hit:0,blow:2}],attempts:4,run:7,leftmostHintRevealed:true
 };
 const calls={saved:0,logs:[],puzzleClosed:0,cleared:0,focus:0,escapeListener:null};
 const originalFocus={isConnected:true,closest(){return null},focus(){calls.focus++}};
 const boardChildren=Array.from({length:4},()=>({
  inert:false,attrs:new Map(),
  getAttribute(k){return this.attrs.get(k)??null},
  setAttribute(k,v){this.attrs.set(k,v)},
  removeAttribute(k){this.attrs.delete(k)}
 }));
 const buttons={};
 function button(name){
  if(!buttons[name])buttons[name]={
   listener:null,addEventListener(event,cb){assert.equal(event,"click");this.listener=cb},
   click(){assert.ok(this.listener);this.listener()},
   focus(){calls.focus++}
  };
  return buttons[name];
 }
 const puzzle={
  children:[...boardChildren],
  appendChild(el){this.children.push(el)},
  querySelector(sel){
   assert.equal(sel,".room2-abandon-confirm");
   return this.children.find(node=>node.className==="room2-abandon-confirm")||null;
  }
 };
 const overlay={querySelector(sel){assert.equal(sel,".room2-puzzle");return puzzle}};
 const sandbox={
  room2State:state,
  document:{
   activeElement:originalFocus,
   createElement(type){
    assert.equal(type,"div");
    const attrs=new Map();
    const el={
     className:"",innerHTML:"",
     setAttribute(k,v){attrs.set(k,v)},
     getAttribute(k){return attrs.get(k)},
     querySelector:button,
     remove(){const i=puzzle.children.indexOf(this);assert.ok(i>=0);puzzle.children.splice(i,1)}
    };
    return el;
   }
  },
  window:{
   addEventListener(event,fn,capture){assert.equal(event,"keydown");assert.equal(capture,true);calls.escapeListener=fn},
   removeEventListener(event,fn,capture){assert.equal(event,"keydown");assert.equal(capture,true);assert.equal(calls.escapeListener,fn);calls.escapeListener=null}
  },
  saveGame(){calls.saved++},
  recordLog(line){calls.logs.push(line)}
 };
 vm.runInNewContext(script+"\nthis.__confirm=showRoom2AbandonConfirm;",sandbox);
 const closePuzzle=()=>{calls.puzzleClosed++};
 const clearReactionTimer=()=>{calls.cleared++};
 return {state,calls,puzzle,buttons,boardChildren,open:()=>sandbox.__confirm(overlay,closePuzzle,clearReactionTimer)};
}

test("No.118: opening confirmation keeps puzzle and progress, blocks background controls",()=>{
 const h=createHarness(),guess=h.state.guess,history=h.state.history;
 h.open();
 assert.equal(h.puzzle.querySelector(".room2-abandon-confirm")?.className,"room2-abandon-confirm");
 assert.equal(h.puzzle.querySelector(".room2-abandon-confirm").getAttribute("role"),"alertdialog");
 assert.ok(h.puzzle.querySelector(".room2-abandon-confirm").innerHTML.includes("回答と判定履歴はリセットされます"));
 assert.ok(h.puzzle.querySelector(".room2-abandon-confirm").innerHTML.includes("自己ベストは残ります"));
 assert.ok(h.boardChildren.every(node=>node.inert===true));
 assert.equal(h.state.guess,guess);
 assert.equal(h.state.history,history);
 assert.equal(h.state.attempts,4);
 assert.equal(h.calls.puzzleClosed,0);
 assert.equal(h.calls.saved,0);
 h.open();
 assert.equal(h.puzzle.children.length,5,"Reopening does not duplicate confirmation");
});

test("No.118: continue cancels inline confirmation without changing any saved progress",()=>{
 const h=createHarness(),guess=h.state.guess,history=h.state.history;
 h.open();
 h.buttons[".room2-abandon-continue"].click();
 assert.equal(h.puzzle.querySelector(".room2-abandon-confirm"),null);
 assert.ok(h.boardChildren.every(node=>node.inert===false));
 assert.equal(h.state.challengeActive,true);
 assert.equal(h.state.guess,guess);
 assert.equal(h.state.history,history);
 assert.equal(h.state.attempts,4);
 assert.equal(h.state.challengeBest,3);
 assert.equal(h.calls.puzzleClosed,0);
 assert.equal(h.calls.saved,0);
 assert.equal(h.calls.escapeListener,null);
});

test("No.118: Escape cancels rather than closing the puzzle",()=>{
 const h=createHarness();h.open();
 let prevented=0,stopped=0;
 h.calls.escapeListener({key:"Escape",preventDefault(){prevented++},stopImmediatePropagation(){stopped++}});
 assert.equal(prevented,1);
 assert.equal(stopped,1);
 assert.equal(h.puzzle.querySelector(".room2-abandon-confirm"),null);
 assert.equal(h.calls.puzzleClosed,0);
 assert.equal(h.state.challengeActive,true);
});

test("No.118: confirming exit clears only challenge progress and logs abandonment",()=>{
 const h=createHarness();h.open();
 h.buttons[".room2-abandon-accept"].click();
 assert.equal(h.puzzle.querySelector(".room2-abandon-confirm"),null);
 assert.equal(h.state.challengeActive,false);
 assert.equal(h.state.guess.length,0);
 assert.equal(h.state.history.length,0);
 assert.equal(h.state.attempts,0);
 assert.equal(h.state.leftmostHintRevealed,false);
 assert.equal(h.state.challengeBest,3);
 assert.equal(h.state.challengeCleared,true);
 assert.equal(h.state.flashbackSeen,true);
 assert.equal(h.state.unlocked,true);
 assert.equal(h.calls.saved,1);
 assert.equal(h.calls.puzzleClosed,1);
 assert.equal(h.calls.logs.length,1);
 assert.equal(h.calls.logs[0].logId,"room2_challenge_abandoned_7");
 assert.equal(h.calls.cleared,1);
});

test("No.118: source, focus handling and manuscripts agree on non-novel inline confirmation",()=>{
 assert.match(script,/showRoom2AbandonConfirm\(overlay,close,clearReactionTimer\)/);
 assert.match(script,/className="room2-abandon-confirm"/);
 assert.match(script,/room2-abandon-accept/);
 assert.match(script,/room2-abandon-continue/);
 assert.doesNotMatch(script,/room2_challenge_quit_confirm_/);
 assert.match(modal,/!el\.closest\("\[hidden\], \[inert\]"\)/);
 assert.match(css,/\.room2-puzzle \.room2-abandon-confirm/);
 for(const text of [chapter,all]){
  assert.match(text,/【校閲No\.118・案1 採用】/);
  assert.match(text,/盤面の上に小さな終了確認パネルを重ねる/);
  assert.match(text,/自己ベストと本編クリア状態は保持/);
 }
});
