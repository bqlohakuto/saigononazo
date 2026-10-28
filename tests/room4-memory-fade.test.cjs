"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"..","room4.js"),"utf8");
const css=fs.readFileSync(path.join(__dirname,"..","design-ui.css"),"utf8");

function fixture(){
 const queued=new Map(),shown=[];
 let seq=0,veil=null,completed=0,saved=0;
 const room4State={memorySeen:false};
 const game={
  querySelector:selector=>selector===".r4-memory-bridge"?veil:null,
  appendChild:element=>{veil=element;element.isConnected=true;}
 };
 const document={
  createElement:tag=>{
   assert.equal(tag,"div");
   return {
    className:"",isConnected:false,
    setAttribute(name,value){this[name]=value},
    classList:{
     replace(from,to){
      assert(veil.className.includes(from),"Transition must replace an existing phase");
      veil.className=veil.className.replace(from,to);
     }
    },
    remove(){this.isConnected=false;if(veil===this)veil=null}
   };
  }
 };
 const ctx={
  document,game,window:{addEventListener(){}},room4State,currentScene:"room04",
  setTimeout(fn,ms){const id=++seq;queued.set(id,{fn,ms});return id},
  clearTimeout(id){queued.delete(id)},
  showRoomDialog(lines,done){shown.push({lines,done});return true},
  saveGame(){saved++}
 };
 vm.createContext(ctx);vm.runInContext(source,ctx);
 ctx.room4FlashbackLines=[{logId:"r4f01",text:"暗闇の中、静かなアナウンスが流れている。"}];
 ctx.room4AfterMemoryLines=[];
 ctx.r4Exit=()=>{completed++};
 return {
  ctx,room4State,queued,shown,
  get veil(){return veil},get completed(){return completed},get saved(){return saved},
  next(){
   assert.equal(queued.size,1,"Exactly one bridge timer must be pending");
   const [id,timer]=[...queued.entries()][0];
   queued.delete(id);timer.fn();return timer.ms;
  }
 };
}

test("D06: white for 600ms, dark for 700ms, then first recollection with 380ms reveal",()=>{
 const f=fixture();
 f.ctx.r4Memory();
 assert.match(f.veil.className,/is-white/);
 assert.equal(f.shown.length,0,"No memory dialogue appears before the white flash");
 assert.equal(f.next(),600);
 assert.match(f.veil.className,/is-dark/);
 assert.equal(f.shown.length,0,"No memory dialogue appears before the dark fade");
 assert.equal(f.next(),700);
 assert.equal(f.shown.length,1);
 assert.equal(f.shown[0].lines[0].logId,"r4f01","Existing planetarium opening is preserved");
 assert.match(f.veil.className,/is-revealing/);
 assert.equal(f.next(),380);
 assert.equal(f.veil,null,"Veil is removed and no longer covers memory controls");
 assert.equal(f.room4State.memorySeen,false,"Memory stays unfinished until dialogue completion");
 f.shown[0].done();
 assert.equal(f.room4State.memorySeen,true);
 assert.equal(f.saved,1);
 assert.equal(f.completed,1);
});

test("D06: bridge cannot double-start and reentry cancels pending phase",()=>{
 const f=fixture();
 f.ctx.r4Memory();f.ctx.r4Memory();
 assert.equal(f.queued.size,1,"Duplicate memory calls don't create two fade sequences");
 f.ctx.r4CancelMemoryBridge();
 assert.equal(f.queued.size,0);
 assert.equal(f.veil,null);
 assert.equal(f.shown.length,0);
 f.ctx.r4Memory();
 assert.equal(f.queued.size,1,"A cancelled fade can start once again on restored entry");
 f.ctx.r4CancelMemoryBridge();
 f.room4State.memorySeen=true;
 f.ctx.r4Memory();
 assert.equal(f.queued.size,0,"Viewed memory does not replay the bridge");
});

test("D06: CSS contains phase durations and opaque nightfall",()=>{
 assert.match(css,/\.r4-memory-bridge\.is-white\s*\{\s*animation:r4MemoryBloom 600ms/);
 assert.match(css,/\.r4-memory-bridge\.is-dark\s*\{\s*animation:r4MemoryNightfall 700ms/);
 assert.match(css,/\.r4-memory-bridge\.is-revealing\s*\{[\s\S]*?animation:r4MemoryReveal 380ms/);
 assert.match(css,/@keyframes r4MemoryNightfall\s*\{[\s\S]*?to\{background:#0a0a10;opacity:1\}/);
 assert.match(source,/function showFourthRoom\(savedState\)\{\s*r4CancelMemoryBridge\(\)/);
});
