"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const {JSDOM}=require(process.env.JSDOM_PATH||"jsdom");
const root=path.resolve(__dirname,"..");

function fixture(){
 const dom=new JSDOM('<div id="game-container"><div id="game"></div></div>',{url:'https://game.test/?preview=1',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,ctx=dom.getInternalVMContext();
 w.HTMLCanvasElement.prototype.getContext=()=>null;
 w.matchMedia=()=>({matches:false,addEventListener(){}});w.scrollTo=()=>{};
 w.HTMLElement.prototype.scrollIntoView=function(){};
 const style=w.document.createElement('style');style.textContent=fs.readFileSync(path.join(root,'room5.css'),'utf8');w.document.head.append(style);
 for(const [,file] of fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^?]+)\?/g))vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
 vm.runInContext('settings.instantText=true',ctx);
 w.showFifthRoom({introSeen:true,view:'left'});
 const q=s=>w.document.querySelector(s);
 const save=()=>JSON.parse(w.localStorage.getItem('saigononazo-save-v1'));
 function collect(id){
  const target=q('.r5-target-'+id);assert(target&&!target.disabled,'available '+id+' can be inspected');
  target.click();
  for(let n=0;n<1000&&q('#roomNextButton');n++)q('#roomNextButton').click();
  assert.equal(q('.room-dialog-overlay'),null,'the collection dialogue completes');
  const reveal=q('.design-pickup-panel');assert(reveal,'the existing acquisition reveal opens');
  const close=[...reveal.querySelectorAll('button')].find(b=>b.textContent.trim()==='閉じる');assert(close);close.click();
 }
 function check(collected,art){
  const planter=q('.r5-decor-planter');assert(planter,'planter remains in the room');
  assert.match(w.getComputedStyle(planter).backgroundImage,new RegExp('/'+art.replace(/\./g,'\\.')+'["\\)]'));
  for(const id of ['butterfly','flower']){
   const target=q('.r5-target-'+id),owned=collected.includes(id);
   assert.equal(target.disabled,owned,id+' availability matches the save');
   assert.equal(target.classList.contains('is-gone'),owned,id+' target visibility matches the save');
  }
  assert.deepEqual([...save().rooms.room05.collected].sort(),[...collected].sort());
 }
 function reload(){const saved=save().rooms.room05;w.showFifthRoom(saved);}
 return {dom,collect,check,reload};
}

for(const [first,second,art] of [
 ['butterfly','flower','planter-flowers-only.webp'],
 ['flower','butterfly','planter-butterfly-only.webp']
]){
 test('E04: '+first+' then '+second+' keeps the correct art and save state',async()=>{
  const f=fixture();try{
   f.check([],'planter-flowers-blue-butterfly.webp');
   f.collect(first);f.check([first],art);
   f.reload();f.check([first],art);
   f.collect(second);f.check([first,second],'planter-empty.webp');
   f.reload();f.check([first,second],'planter-empty.webp');
  }finally{await new Promise(resolve=>setTimeout(resolve,100));f.dom.window.close()}
 });
}
