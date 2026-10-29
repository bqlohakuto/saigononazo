"use strict";
// Issue #25 H03: world props and hotspots must agree with collected inventory.
const {test}=require("node:test");
const assert=require("node:assert/strict");
const {JSDOM}=require(process.env.JSDOM_PATH||"jsdom");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");

function app(){
 const dom=new JSDOM('<div id="game-container"><div id="game"></div></div>',{
  url:"https://game.test/",runScripts:"outside-only",pretendToBeVisual:true
 });
 const w=dom.window,ctx=dom.getInternalVMContext();
 w.HTMLCanvasElement.prototype.getContext=()=>null;
 w.matchMedia=()=>({matches:false,addEventListener(){}});
 w.scrollTo=()=>{};
 w.HTMLElement.prototype.scrollIntoView=function(){};
 for(const [,filename] of fs.readFileSync(path.join(root,"index.html"),"utf8").matchAll(/<script src="([^?]+)\?/g)){
  vm.runInContext(fs.readFileSync(path.join(root,filename),"utf8"),ctx,{filename});
 }
 vm.runInContext("settings.instantText=true",ctx);
 const q=selector=>w.document.querySelector(selector);
 return {dom,w,q};
}

test("H03 Room 5: collecting one chair removes only that chair, not the other chair or table",()=>{
 const h=app();try{
  h.w.showFifthRoom({introSeen:true,view:"left"});
  assert(!h.q(".r5-chair-left").classList.contains("is-gone"));
  assert(!h.q(".r5-chair-right").classList.contains("is-gone"));
  assert(!h.q(".r5-dining-table").classList.contains("is-gone"));
  assert.equal(h.q('[data-item="chair"]').disabled,false);

  h.w.showFifthRoom({introSeen:true,view:"left",collected:["chair"]});
  assert(h.q(".r5-chair-left").classList.contains("is-gone"),"Only acquired chair disappears");
  assert(!h.q(".r5-chair-right").classList.contains("is-gone"),"Second chair remains");
  assert(!h.q(".r5-dining-table").classList.contains("is-gone"),"Table remains");
  const chair=h.q('[data-item="chair"]');
  assert(chair.disabled);
  assert(chair.classList.contains("is-gone"));
  assert.equal(h.q('[data-item="flower"]').disabled,false,"Neighboring collectible remains available");
  assert.equal(h.q('[data-item="butterfly"]').disabled,false);
  const css=fs.readFileSync(path.join(root,"room5.css"),"utf8");
  assert.match(css,/\.r5-furniture\.is-gone\{display:none\}/);
 }finally{h.dom.window.close()}
});

test("H03 Room 5: all collectible hotspots and scenery follow the corresponding saved item",()=>{
 const h=app();try{
  const items=[
   ["mirror",".r5-decor-mirror","front"],
   ["fish",".r5-decor-fish","right"],
   ["squid",".r5-decor-squid","right"],
   ["cannon",".r5-decor-cannon","back"]
  ];
  for(const [item,selector,view] of items){
   h.w.showFifthRoom({introSeen:true,view,fridgeUpperOpen:true,fridgeLowerOpen:true});
   assert(!h.q(selector).classList.contains("is-gone"),item+" initially visible");
   assert.equal(h.q('[data-item="'+item+'"]').disabled,false);
   h.w.showFifthRoom({introSeen:true,view,fridgeUpperOpen:true,fridgeLowerOpen:true,collected:[item]});
   assert(h.q(selector).classList.contains("is-gone"),item+" scenic prop removed");
   assert(h.q('[data-item="'+item+'"]').classList.contains("is-gone"),item+" hotspot removed");
   assert(h.q('[data-item="'+item+'"]').disabled,item+" cannot be collected twice");
  }
 }finally{h.dom.window.close()}
});

test("H03 Room 5: flower and butterfly can disappear independently, preserving the planter",()=>{
 const h=app();try{
  const cases=[
   [[], ""],
   [["flower"],"is-flower-gone"],
   [["butterfly"],"is-butterfly-gone"],
   [["flower","butterfly"],"is-empty"]
  ];
  for(const [collected,expected] of cases){
   h.w.showFifthRoom({introSeen:true,view:"left",collected});
   const planter=h.q(".r5-decor-planter");
   assert(planter,"Keep the planter in all combinations");
   assert.equal(planter.classList.contains("is-empty"),expected==="is-empty");
   assert.equal(planter.classList.contains("is-flower-gone"),expected==="is-flower-gone");
   assert.equal(planter.classList.contains("is-butterfly-gone"),expected==="is-butterfly-gone");
   for(const id of ["flower","butterfly"]){
    const button=h.q('[data-item="'+id+'"]');
    assert.equal(button.disabled,collected.includes(id));
    assert.equal(button.classList.contains("is-gone"),collected.includes(id));
   }
  }
  const css=fs.readFileSync(path.join(root,"room5.css"),"utf8");
  for(const cls of [".r5-decor-planter.is-empty",".r5-decor-planter.is-flower-gone",".r5-decor-planter.is-butterfly-gone"]){
   assert(css.includes(cls),cls+" has an authored artwork state");
  }
 }finally{h.dom.window.close()}
});

test("H03 Room 4: a collected wall panel is no longer an interactive object, even after revisiting",()=>{
 const h=app();try{
  h.w.showFourthRoom({introSeen:true,view:"front"});
  assert.equal(h.q("#r4Wall").hidden,false);
  assert.equal(h.q("#r4Wall").disabled,false);
  assert.equal(h.q("#r4Box").hidden,false,"Question box remains");
  h.w.showFourthRoom({introSeen:true,view:"front",wall:true});
  assert.equal(h.q("#r4Wall").hidden,true);
  assert.equal(h.q("#r4Wall").disabled,true);
  assert.equal(h.q("#r4Box").hidden,false,"Question box itself is still there");
  h.w.showFourthRoom({introSeen:true,view:"right",wall:true,box:true});
  h.w.showFourthRoom({introSeen:true,view:"front",wall:true,box:true});
  assert.equal(h.q("#r4Wall").hidden,true);
  assert.equal(h.q("#r4Box").hidden,false,"Used question box is still inspectable");
 }finally{h.dom.window.close()}
});
