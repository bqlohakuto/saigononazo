"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.resolve(__dirname,"..");
const roomCode=fs.readFileSync(path.join(root,"room2.js"),"utf8");
const sharedCode=fs.readFileSync(path.join(root,"script.js"),"utf8");
const chapter=fs.readFileSync(path.join(root,"scenario","02_room2.md"),"utf8");
const complete=fs.readFileSync(path.join(root,"scenario","FULL_SCENARIO.md"),"utf8");

function harness(){
 const calls={selected:[],closed:0,focus:[],observe:0,disconnect:0};
 const listeners=new Map();
 const on=(map,type,fn)=>{const arr=map.get(type)||[];arr.push(fn);map.set(type,arr)};
 const off=(map,type,fn)=>map.set(type,(map.get(type)||[]).filter(f=>f!==fn));
 const doc={activeElement:null,documentElement:{},getElementById(id){assert.equal(id,"r2Door");return door},
  addEventListener(type,fn){on(listeners,type,fn)},
  removeEventListener(type,fn){off(listeners,type,fn)},
  createElement(type){assert.equal(type,"div");return overlay}
 };
 function control(name){
  const handlers=new Map();
  return {name,dataset:{},disabled:false,isConnected:true,
   addEventListener(type,fn){on(handlers,type,fn)},
   removeEventListener(type,fn){off(handlers,type,fn)},
   click(){for(const fn of handlers.get("click")||[])fn({stopPropagation(){}})},
   focus(){doc.activeElement=this;calls.focus.push(name)},
   matches(){return false},closest(){return null}
  };
 }
 const door=control("door");door.id="r2Door";
 const close=control("close");
 const first=control("next");first.dataset.choice="0";
 const second=control("stay");second.dataset.choice="1";
 const controls=[close,first,second];
 const panel={
  attrs:{},
  setAttribute(key,value){this.attrs[key]=value},
  querySelectorAll(selector){assert.equal(selector,"button:not(:disabled),input:not(:disabled)");return controls},
  contains(el){return controls.includes(el)}
 };
 const overlay={
  className:"",innerHTML:"",isConnected:false,
  querySelector(sel){
   if(sel==="section")return panel;
   if(sel===".device-close")return close;
   if(sel==="[data-choice]")return first;
   throw Error("Unexpected overlay selector "+sel);
  },
  querySelectorAll(selector){assert.equal(selector,"[data-choice]");return [first,second]},
  remove(){calls.closed++;this.isConnected=false}
 };
 const room={inert:false};
 const game={
  querySelector(sel){if(sel===".room")return room;if(sel===".design-overlay,.save-slot-overlay")return null;throw Error(sel)},
  appendChild(el){assert.equal(el,overlay);overlay.isConnected=true}
 };
 class Observer{
  observe(){calls.observe++}
  disconnect(){calls.disconnect++}
 }
 const sandbox={document:doc,game,MutationObserver:Observer};
 const start=sharedCode.indexOf("function activateDeviceModal(");
 const stop=sharedCode.indexOf("function showPhoneScreen()",start);
 const choiceStart=roomCode.indexOf("function showRoomChoices(choices){");
 const choiceStop=roomCode.indexOf("const room2IntroLines=",choiceStart);
 assert.ok(start>=0&&stop>start&&choiceStart>=0&&choiceStop>choiceStart);
 vm.runInNewContext(sharedCode.slice(start,stop)+"\n"+
  roomCode.slice(choiceStart,choiceStop)+"\nthis.__show=showRoomChoices;",sandbox);
 function dispatch(key,shiftKey=false){
  let prevented=0,stopped=0;
  const event={key,shiftKey,preventDefault(){prevented++},stopImmediatePropagation(){stopped++}};
  for(const fn of [...(listeners.get("keydown")||[])])fn(event);
  return {prevented,stopped};
 }
 function open(){
  sandbox.__show([
   {label:"次の部屋へ向かう",onSelect(){calls.selected.push("next")}},
   {label:"もう少し部屋をしらべてみる",onSelect(){calls.selected.push("stay")}}
  ]);
 }
 return {calls,doc,room,door,close,first,second,overlay,open,dispatch,listeners};
}

test("No.128: initial focus, Tab and Shift+Tab stay in the opened choice modal",()=>{
 const h=harness();
 h.open();
 assert.equal(h.doc.activeElement,h.first);
 assert.equal(h.room.inert,true);
 assert.deepEqual(h.dispatch("Tab"),{prevented:1,stopped:1});
 assert.equal(h.doc.activeElement,h.second);
 h.dispatch("Tab");
 assert.equal(h.doc.activeElement,h.close,"Tab wraps to close");
 h.dispatch("Tab");
 assert.equal(h.doc.activeElement,h.first,"Tab wraps from close to first choice");
 h.dispatch("Tab",true);
 assert.equal(h.doc.activeElement,h.close,"Shift+Tab wraps backward");
 h.dispatch("Tab",true);
 assert.equal(h.doc.activeElement,h.second,"Shift+Tab visits the last choice");
 assert.equal(h.calls.selected.length,0);
});

test("No.128: Escape closes without selecting and focuses the original door",()=>{
 const h=harness();h.open();
 assert.deepEqual(h.dispatch("Escape"),{prevented:1,stopped:1});
 assert.equal(h.calls.closed,1);
 assert.equal(h.room.inert,false);
 assert.equal(h.doc.activeElement,h.door);
 assert.deepEqual(h.calls.selected,[]);
 assert.equal((h.listeners.get("keydown")||[]).length,0,"No stale keyboard listeners survive close");
 assert.equal(h.calls.disconnect,1);
});

test("No.128: close button also restores door focus; choices still execute exactly once",()=>{
 for(const which of ["close","first","second"]){
  const h=harness();h.open();h[which].click();
  assert.equal(h.calls.closed,1);
  assert.equal(h.doc.activeElement,h.door);
  assert.equal(h.room.inert,false);
  assert.deepEqual(h.calls.selected,which==="close"?[]:[which==="first"?"next":"stay"]);
  assert.equal((h.listeners.get("keydown")||[]).length,0);
 }
});

test("No.128: shared modal and both scenario documents match the adoption",()=>{
 assert.match(roomCode,/activateDeviceModal\(overlay,"r2Door",overlay\.querySelector\("\[data-choice\]"\)\)/);
 assert.match(sharedCode,/event\.key==="Escape"/);
 assert.match(sharedCode,/event\.key==="Tab"/);
 for(const text of [chapter,complete]){
  assert.match(text,/【校閲No\.128・案1 採用】/);
  assert.match(text,/Tab／Shift\+Tabキー/);
  assert.match(text,/元の扉へフォーカスを復帰させる/);
 }
});
