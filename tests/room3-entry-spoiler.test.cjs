"use strict";
// Issue #25 H02: an unrecognized room must not be identified by the HUD.
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {JSDOM}=require(process.env.JSDOM_PATH||"jsdom");

function start(savedState){
 const root=path.join(__dirname,"..");
 const dom=new JSDOM('<div id="game-container"><div id="game"></div></div>',{
  url:"https://game.test/",runScripts:"outside-only",pretendToBeVisual:true
 });
 const w=dom.window,ctx=dom.getInternalVMContext();
 w.matchMedia=()=>({matches:true,addEventListener(){}});
 w.scrollTo=()=>{};
 w.HTMLCanvasElement.prototype.getContext=()=>null;
 w.HTMLElement.prototype.scrollIntoView=function(){};
 for(const [,filename]of fs.readFileSync(path.join(root,"index.html"),"utf8").matchAll(/<script src="([^?]+)\?/g)){
  vm.runInContext(fs.readFileSync(path.join(root,filename),"utf8"),ctx,{filename});
 }
 w.showThirdRoom(savedState);
 const q=selector=>w.document.querySelector(selector);
 return {dom,q,w,ctx};
}
test("H02 Room 3: entering an unknown room does not reveal that it is the protagonist's old home",()=>{
 const h=start({introSeen:true});try{
  assert.equal(h.q(".room-color-status").textContent,"静かな部屋");
  assert.equal(h.q(".room3-stage").getAttribute("aria-label"),"部屋の中");
  assert.doesNotMatch(h.q(".room-header").textContent,/大学時代の自室|僕の部屋/);
  assert.equal(h.q("#r3Desk").disabled,true,"The desk stays locked until the player investigates the door");
 }finally{h.dom.window.close()}
});
test("H02 Room 3: the post-clear room label still states the memory was recovered",()=>{
 const h=start({introSeen:true,unlocked:true,memorySeen:true});try{
  assert.equal(h.q(".room-color-status").textContent,"記憶を取り戻した部屋");
  assert.equal(h.q(".room3-stage").getAttribute("aria-label"),"部屋の中");
 }finally{h.dom.window.close()}
});
test("H02 Room 3: initial narration remains a guess, not confirmed identity",()=>{
 const source=fs.readFileSync(path.join(__dirname,"..","room3.js"),"utf8");
 const first=vm.runInNewContext(source+";room3IntroLines;");
 const remembered=first.find(line=>line.logId==="room3_intro_05");
 assert.match(remembered.text,/似てるような/);
 assert.equal(first.find(line=>line.logId==="room3_intro_04").speaker,"主人公");
});
