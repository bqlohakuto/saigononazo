// Exercise authored dialogue through the real renderer, including narration, LOG and hide/restore.
const {chromium,webkit}=require('playwright');
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=process.env.UI_SCREENSHOT_DIR||path.join(root,'artifacts/memory-all');
const authored=new Map();
function collect(file,name){
 const source=fs.readFileSync(path.join(root,file),'utf8');
 const start=source.indexOf('const '+name+'=');
 const literal=source.slice(start).match(/=([\s\S]*?);(?:\n|$)/)[1];
 for(const line of vm.runInNewContext(literal))authored.set(line.logId,line);
}
collect('room2-flashback.js','room2FlashbackContent');
collect('room3.js','room3FlashbackLines');
collect('room4-scenario.js','room4FlashbackLines');
const late=fs.readFileSync(path.join(root,'late-game.js'),'utf8');
for(const m of late.matchAll(/line\(("(?:\\.|[^"\\])*"),("(?:\\.|[^"\\])*"),("(?:\\.|[^"\\])*")/g)){
 const [logId,speaker,text]=m.slice(1).map(s=>JSON.parse(s));authored.set(logId,{logId,speaker,text,logType:speaker==='ト書き'?'narration':'dialogue'});
}
const scenes=JSON.parse(fs.readFileSync(path.join(root,'docs/MEMORY_SCENES_IMPLEMENTATION.json')));
const samples=['room2_memory_070','room3_flashback_05','room3_flashback_39','room3_flashback_71','r4f05','r4f10','r4f51','r5m014','r5m038','r5m103','r5m121','r5m156','r5m197','r5m225','r5m248','r6_memory_full_007','r6_memory_full_030','r6_memory_full_058','r6_memory_06','r7_mem_14','r7_mem_26','r7_mem_34','r7_mem_35'];
const engine=process.env.MEMORY_MOBILE_ENGINE==='chromium'?chromium:webkit;
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 for(const spec of [{name:'desktop',engine:chromium,width:1366,height:768},{name:'phone',engine,width:852,height:393,touch:true}]){
  const browser=await spec.engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:spec.width,height:spec.height},isMobile:!!spec.touch,hasTouch:!!spec.touch});
   await context.addInitScript(()=>{localStorage.setItem('saigononazo-help-seen','1');localStorage.setItem('saigononazo-settings-v1',JSON.stringify({instantText:true,volume:0}))});
   const p=await context.newPage(),errors=[],missing=[];
   p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)missing.push(r.url())});
   const base=process.env.PUBLIC_BASE_URL||'https://memory.local/';
   if(!process.env.PUBLIC_BASE_URL)await p.route('https://memory.local/**',route=>{
    const f=path.resolve(root,decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\//,'')||'index.html');
    return route.fulfill(f.startsWith(root+path.sep)&&fs.existsSync(f)?{path:f}:{status:404,body:''});
   });
   await p.goto(base,{waitUntil:'load'});
   for(const id of samples){
    const scene=scenes.find(s=>s.ids.includes(id)),line=authored.get(id);assert.ok(line,id);
    await p.evaluate(({room,line})=>{Dialogue.stop();game.innerHTML='';currentScene=room;showRoomDialog([line])},{room:scene.room,line:{...line,logType:line.speaker==='ト書き'?'narration':line.logType||'dialogue'}});
    await p.locator('.memory-background').evaluate(im=>im.decode());
    const expected=await p.evaluate(line=>MemoryVisuals.get(currentScene,line),line);
    if(expected.sprite)await p.locator('.memory-girl').evaluate(im=>im.decode());
    assert.equal(await p.locator('.memory-girl:visible').count(),expected.sprite?1:0,id);
    assert.equal(await p.locator('.memory-background').getAttribute('src'),expected.background,id);
    assert.equal(await p.locator('.memory-scene').getAttribute('data-effect'),expected.effect||'',id);
    // A06: both recollection styles share the same dialogue geometry, but the
    // heroine appears either in the full scene or in the text window, never twice.
    const presentation=expected.presentation||'scene';
    assert.equal(await p.locator('.room-dialog-overlay').getAttribute('data-memory-presentation'),presentation,id);
    assert.equal(await p.locator('.memory-scene').getAttribute('data-presentation'),presentation,id);
    const layout=await p.evaluate(()=>{
      const g=game.getBoundingClientRect(),d=document.querySelector('.room-dialog').getBoundingClientRect();
      const portrait=document.querySelector('.memory-window-portrait');
      const text=document.querySelector('.dialog-message-area');
      return {
        left:(d.left-g.left)/g.width, bottom:(g.bottom-d.bottom)/g.height,
        height:d.height/g.height,
        portraitVisible:!!portrait&&getComputedStyle(portrait).display!=='none'&&!portrait.hidden,
        margin:getComputedStyle(text).marginLeft
      };
    });
    assert(Math.abs(layout.left-.022)<.02&&Math.abs(layout.bottom-.025)<.02,id+' consistent dialogue position');
    assert(Math.abs(layout.height-.25)<.04,id+' consistent dialogue height');
    assert.equal(layout.portraitVisible,presentation==='dialogue'&&!!expected.sprite,id+' correct window sprite');

    // The complete UI, image layer and control hitboxes must stay inside the playfield.
    const outside=await p.evaluate(()=>{
     const r=game.getBoundingClientRect();return [...document.querySelectorAll('.room-dialog button')].filter(e=>{
      const b=e.getBoundingClientRect();return b.width&&b.height&&(b.left<r.left-1||b.right>r.right+1||b.top<r.top-1||b.bottom>r.bottom+1);
     }).map(e=>e.textContent);
    });assert.deepEqual(outside,[],id);
    if(['room2_memory_070','room3_flashback_71','r4f10','r5m014','r5m103','r5m121','r6_memory_full_030','r7_mem_34'].includes(id))await p.screenshot({path:path.join(out,spec.name+'-'+id+'.png')});
    if(id==='r5m014'){
     await p.getByRole('button',{name:'非表示',exact:true}).click();
     assert.equal(await p.locator('.memory-girl:visible').count(),1);
     await p.locator('.dialogue-restore').click({position:{x:100,y:100}});
     assert.equal(await p.locator('.memory-girl:visible').count(),1);
    }
   }
   // A spoken line followed by narration retains the same image during actual advance.
   const pair=[authored.get('r6_memory_05'),authored.get('r6_memory_06'),authored.get('r6_memory_07'),{logId:'r6_after_001',speaker:'ト書き',text:'さっきまで何もなかった壁に、扉が現れていた。',logType:'narration'}];
   await p.evaluate(lines=>{Dialogue.stop();game.innerHTML='';currentScene='room06';showRoomDialog(lines)},pair);
   await p.locator('.memory-girl').evaluate(im=>im.decode());
   await p.evaluate(()=>{for(let i=0;i<3&&!GameLog.list().at(-1)?.id.startsWith('r6_memory_06');i++)Dialogue.advance()});
   assert.ok((await p.evaluate(()=>GameLog.list().at(-1)?.id)).startsWith('r6_memory_06'));
   assert.equal(await p.locator('.memory-girl:visible').count(),1);
   await p.evaluate(()=>{for(let i=0;i<20&&!GameLog.list().at(-1)?.id.startsWith('r6_after_001');i++)Dialogue.advance()});
   assert.equal(await p.locator('.memory-scene').count(),0);
   // A06: while recollecting, the old investigation HUD cannot cover the
   // detailed memory background or dialogue. The dialogue controls stay usable.
   await p.evaluate(()=>{
     Dialogue.stop();game.innerHTML='';currentScene='room05';
     showFifthRoom({introSeen:true,boardIntroSeen:true});
     showRoomDialog([{logId:'r5m014',speaker:'ト書き',logType:'narration',text:'部屋にいた。'}]);
   });
   assert.equal(await p.locator('.gameplay-hud').count(),1);
   assert.equal(await p.locator('.gameplay-bottom-bar').count(),1);
   assert.equal(await p.locator('.gameplay-hud').evaluate(el=>getComputedStyle(el).visibility),'hidden');
   assert.equal(await p.locator('.gameplay-bottom-bar').evaluate(el=>getComputedStyle(el).visibility),'hidden');
   assert.equal(await p.locator('.room-dialog-overlay').getAttribute('data-memory-presentation'),'dialogue');
   assert.equal(await p.locator('.memory-window-portrait:visible').count(),1);
   assert.equal(await p.locator('.room-dialog .design-controls button:visible').count()>0,true,'Dialogue remains operable');
   await p.evaluate(()=>MemoryVisuals.sync(null));
   assert.equal(await p.locator('.gameplay-hud').evaluate(el=>getComputedStyle(el).visibility),'visible','HUD returns after memory');
   await p.evaluate(()=>{Dialogue.stop();game.innerHTML='';});
   assert.deepEqual(errors,[],spec.name+' runtime errors');assert.deepEqual(missing,[],spec.name+' missing assets');
   console.log('PASS '+spec.name+': all 6 recollections, narration persistence, CG, furniture, hide/restore and return');
  }finally{await browser.close()}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
