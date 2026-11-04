"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {JSDOM}=require(process.env.JSDOM_PATH||"jsdom");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("index.html");
const source=read("late-game.js");

test("Room 6: Hana's optional question is unlocked by the map, not by puzzle hints",()=>{
 const dom=new JSDOM('<div id="game-container"><div id="game"></div></div>',{url:"https://game.test/?preview=1",runScripts:"outside-only",pretendToBeVisual:true});
 const w=dom.window,ctx=dom.getInternalVMContext();
 w.matchMedia=query=>({matches:query.includes("prefers-reduced-motion"),addEventListener(){}});
 w.scrollTo=()=>{};
 w.HTMLCanvasElement.prototype.getContext=()=>null;
 w.HTMLElement.prototype.scrollIntoView=function(){};
 for(const [,file]of html.matchAll(/<script src="([^?]+)\?/g)){
  vm.runInContext(read(file),ctx,{filename:file});
 }
 const run=code=>vm.runInContext(code,ctx);
 const q=x=>w.document.querySelector(x);
 const click=x=>{assert.ok(q(x),"control exists: "+x);q(x).click()};
 const finish=()=>{
  let pages=[];
  for(let i=0;i<250&&q("#roomNextButton");i++){
   pages.push(q("#roomMessage .message")?.textContent||"");
   click("#roomNextButton");
  }
  assert.equal(q("#roomNextButton"),null,"dialogue should close");
  return pages;
 };
 try{
  click("#testRoomButton");click('[data-room="room06"]');finish();
  click("#gameplayHanaButton");
  assert.equal(q('[data-r6-hint="why-help"]'),null,"question stays hidden before Hana gives the map");
  assert.ok(q('[data-r6-hint="exploration"]'),"original exploration hint remains");
  click('[data-r6-hint="cancel"]');
  const visited=["A8","A7","B8","C8","A1","H1"];
  run("showSixthRoom("+JSON.stringify({introSeen:true,visited,current:"C8",interview4:true,mapEvent:true,othelloKnown:false,mapComplete:false})+")");
  click("#gameplayHanaButton");
  assert.ok(q('[data-r6-hint="why-help"]'),"question appears after map is received");
  assert.ok(q('[data-r6-hint="exploration"]'),"early discovery hint is still selectable");
  click('[data-r6-hint="why-help"]');
  const dialogue=finish().join("");
  const beats=["……ハナさん","なに？","どうして、僕をここまで手伝ってくれるんですか","……君に、ちゃんと思い出してほしいから","……そうですか","うん。だから、もう少し一緒に探そう","……はい"];
  let previous=-1;
  for(const beat of beats){const index=dialogue.indexOf(beat,previous+1);assert.ok(index>previous,"new dialogue is in order: "+beat);previous=index;}
  assert.ok(!dialogue.includes("花音"),"Hana's identity is not disclosed");
  const current=run("room6State");
  assert.equal(current.mapEvent,true);
  assert.equal(current.othelloKnown,false);
  assert.equal(current.moves.length,0,"story question never changes Othello moves");
  assert.equal(current.hintLevel,0,"story question never consumes hint progress");
  click("#gameplayHanaButton");
  assert.ok(q('[data-r6-hint="why-help"]'),"the optional topic can be revisited");
  click('[data-r6-hint="cancel"]');
  const saved=JSON.parse(w.localStorage.getItem("saigononazo-save-v1")).rooms.room06;
  run("showSixthRoom("+JSON.stringify(saved)+")");
  click("#gameplayHanaButton");
  assert.ok(q('[data-r6-hint="why-help"]'),"available after a saved-room reload");
  click('[data-r6-hint="cancel"]');
 }finally{ /* Let pending artwork and audio asset checks finish before process exit. */ }
});

test("Room 6: source text, canonical manuscripts and shared asset cache remain synchronized",()=>{
 const all=["scenario/06_room6.md","SCENARIO.md","scenario/FULL_SCENARIO.md"];
 for(const name of all){
  const doc=read(name);
  for(const phrase of ["手伝ってくれる理由","どうして、僕をここまで手伝ってくれるんですか","……君に、ちゃんと思い出してほしいから"]){
   assert.ok(doc.includes(phrase),name+" missing "+phrase);
  }
 }
 for(let i=1;i<=7;i++){
  assert.ok(source.includes("r6_hana_why_"+String(i).padStart(2,"0")),"unique logged conversation ID");
 }
 assert.ok(source.includes("if(room6State.mapEvent)choices.push({id:'why-help'"));
 assert.ok(source.includes("if(choice.id==='why-help')"));
 assert.ok(source.includes("if(choice.level){room6State.hintLevel"));
 for(const phrase of ["r6_food_04","r6_map_14","r6_memory_full_085","r6_final_lavender"])assert.ok(source.includes(phrase));
 const assetVersion=(html.match(/href="style\.css\?v=(\d{8}-[a-z0-9-]+)"/)||[])[1];
 assert.ok(assetVersion);
 assert.ok(html.includes("late-game.js?v="+assetVersion));
});
