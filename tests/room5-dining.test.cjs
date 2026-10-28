"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const {JSDOM}=require(process.env.JSDOM_PATH||"jsdom");
const root=path.resolve(__dirname,"..");

test("Room 5 chair collection preserves the table and other chair after saving",async()=>{
 const dom=new JSDOM('<div id="game-container"><div id="game"></div></div>',{url:'https://game.test/?preview=1',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,ctx=dom.getInternalVMContext();
 w.HTMLCanvasElement.prototype.getContext=()=>null;
 w.matchMedia=()=>({matches:false,addEventListener(){}});w.scrollTo=()=>{};
 w.HTMLElement.prototype.scrollIntoView=function(){};
 const style=w.document.createElement('style');style.textContent=fs.readFileSync(path.join(root,'room5.css'),'utf8');w.document.head.append(style);
 for(const [,file] of fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^?]+)\?/g))vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
 vm.runInContext('settings.instantText=true',ctx);
 const q=s=>w.document.querySelector(s);
 const saved=()=>JSON.parse(w.localStorage.getItem('saigononazo-save-v1')).rooms.room05;
 function check(collected){
  const table=q('.r5-dining-table'),left=q('.r5-chair-left'),right=q('.r5-chair-right'),target=q('.r5-target-chair');
  assert(table&&left&&right&&target,'the table, both chairs and chair target exist');
  assert.match(w.getComputedStyle(table).backgroundImage,/dining-table-v2\.png/);
  assert.match(w.getComputedStyle(left).backgroundImage,/dining-chair-v2\.png/);
  assert.match(w.getComputedStyle(right).backgroundImage,/dining-chair-v2\.png/);
  assert.notEqual(w.getComputedStyle(table).display,'none','the table remains visible');
  assert.notEqual(w.getComputedStyle(right).display,'none','the other chair remains visible');
  assert.equal(w.getComputedStyle(left).display==='none',collected,'only the collectible chair disappears');
  assert.equal(target.disabled,collected,'the target follows the saved chair state');
  assert.equal(target.classList.contains('is-gone'),collected);
  assert.equal(saved().collected.includes('chair'),collected);
 }
 try{
  for(const filename of ['dining-table-v2.png','dining-chair-v2.png'])assert(fs.statSync(path.join(root,'images/background/room05/overlays',filename)).size>0,'furniture artwork exists');
  w.showFifthRoom({introSeen:true,view:'left'});check(false);
  q('.r5-target-chair').click();
  for(let n=0;n<1000&&q('#roomNextButton');n++)q('#roomNextButton').click();
  assert.equal(q('.room-dialog-overlay'),null,'the chair collection dialogue finishes');
  const reveal=q('.design-pickup-panel');assert(reveal,'the chair panel reveal opens');
  assert.match(reveal.querySelector('.design-pickup-image').getAttribute('src'),/\/chair\.webp$/);
  const close=[...reveal.querySelectorAll('button')].find(b=>b.textContent.trim()==='閉じる');assert(close);close.click();
  check(true);assert.equal(saved().collected.length,1,'collection adds only one existing puzzle item');
  w.showFifthRoom(saved());check(true);
  q('#r5TurnRight').click();q('#r5TurnLeft').click();check(true);
 }finally{await new Promise(resolve=>setTimeout(resolve,100));dom.window.close()}
});
