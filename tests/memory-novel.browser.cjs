// Real piano -> first memory -> return, with desktop Chromium and landscape WebKit.
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=process.env.UI_SCREENSHOT_DIR||path.join(root,'artifacts/memory-novel');
const mobileEngine=process.env.MEMORY_MOBILE_ENGINE==='chromium'?chromium:webkit;
const specs=[
 {name:'desktop',engine:chromium,width:1366,height:768},
 {name:'phone',engine:mobileEngine,width:852,height:393,touch:true},
 {name:'small-phone',engine:mobileEngine,width:667,height:375,touch:true}
];
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 for(const spec of specs){
  const browser=await spec.engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:spec.width,height:spec.height},isMobile:!!spec.touch,hasTouch:!!spec.touch});
   await context.addInitScript(()=>{
    localStorage.setItem('saigononazo-help-seen','1');
     localStorage.setItem('saigononazo-first-visit-notice-v1', 'accepted');
    localStorage.setItem('saigononazo-settings-v1',JSON.stringify({instantText:true,volume:0}));
   });
   const p=await context.newPage(),errors=[],missing=[];
   p.on('pageerror',e=>errors.push(e.message));
   p.setDefaultTimeout(15000);
   const base=process.env.PUBLIC_BASE_URL||'https://memory.local/';
   if(!process.env.PUBLIC_BASE_URL)await p.route('https://memory.local/**',async route=>{
    const file=path.resolve(root,decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\//,'')||'index.html');
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){missing.push(file);await route.fulfill({status:404,body:''});return}
    await route.fulfill({path:file});
   });
   const previewUrl=new URL(base);previewUrl.searchParams.set('preview','1');
   await p.goto(previewUrl.href,{waitUntil:'load'});
   await p.locator('#testRoomButton').click();await p.locator('[data-room="room01"]').click();
   // Seed only the completed exploration prerequisites. Enter the answer through the actual piano UI.
   await p.evaluate(()=>showFirstRoom({hanaIntroduced:true,questionSeen:true,doorInspected:true,
    pianoIntroductionSeen:true,viewedWall:'left',
    openedInbox:firstRoomScenario.phoneMail.inbox.map(m=>m.id),
    openedSent:firstRoomScenario.phoneMail.sent.map(m=>m.id)}));
   const normalPaper=await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--paper').trim());
   await p.locator('#pianoButton').click();await p.locator('.inspection-art-button').click();
   await p.locator('#melodyInput').fill('ソラファミドレドシ');await p.locator('#playMelodyButton').click();
   await p.locator('#roomNextButton').waitFor();
   assert.equal(await p.evaluate(()=>firstRoomState.doorUnlocked),false);
   async function advanceTo(id){
    const result=await p.evaluate(id=>{
     const matches=()=>{const last=GameLog.list().at(-1)?.id;return last===id||last?.startsWith(id+'_')};
     for(let i=0;i<400&&!matches()&&document.querySelector('#roomNextButton');i++)Dialogue.advance();
     return {matches:matches(),last:GameLog.list().at(-1)?.id};
    },id);
    assert.ok(result.matches,JSON.stringify(result));
   }
   const shot=async name=>{
    if(await p.locator('.memory-background').count())await p.locator('.memory-background').evaluate(im=>im.decode());
    await p.screenshot({path:path.join(out,spec.name+'-'+name+'.png')});
   };
   async function hasGirl(expected){
    if(expected)await p.locator('.memory-girl').evaluate(im=>im.decode());
    assert.equal(await p.locator('.memory-girl:visible').count(),expected?1:0,JSON.stringify(await p.locator('.memory-girl').evaluate(im=>({hidden:im.hidden,src:im.getAttribute('src'),width:im.naturalWidth,display:getComputedStyle(im).display}))));
   }
   async function fit(){
    const bad=await p.evaluate(()=>{
     const gameRect=document.getElementById('game').getBoundingClientRect();
     return [...document.querySelectorAll('.room-dialog .design-controls button,.room-dialog .next-button,.room-dialog .message-speaker')].filter(e=>{
      const r=e.getBoundingClientRect();return r.width&&r.height&&(r.left<gameRect.left-1||r.right>gameRect.right+1||r.top<gameRect.top-1||r.bottom>gameRect.bottom+1);
     }).map(e=>e.className||e.textContent);
    });
    assert.deepEqual(bad,[],spec.name+' dialogue fits the game');
   }
   await advanceTo('room1_memory_music_room_01');await hasGirl(false);await shot('music-background');
   assert.equal(await p.locator('.memory-scene').getAttribute('data-location'),'music-room');
   assert.notEqual(await p.locator('.room-dialog-overlay').evaluate(el=>getComputedStyle(el).getPropertyValue('--paper').trim()),normalPaper);
   await advanceTo('room1_memory_music_room_10');await hasGirl(false);
   await advanceTo('room1_memory_music_room_16');await hasGirl(true);
   await p.locator('.memory-girl').evaluate(im=>im.decode());await fit();await shot('music-dialogue');
   assert.equal(await p.locator('.hana-portrait:visible').count(),0);
   assert.equal(await p.locator('#hanaButton').evaluate(el=>getComputedStyle(el).visibility),'hidden');
   await p.locator('[data-design-log]').click();await p.waitForTimeout(100);
   assert.equal(await p.locator('.room-dialog.is-log-open').count(),1);await hasGirl(true);
   await p.locator('[data-design-log]').click();
   await p.getByRole('button',{name:'非表示',exact:true}).click();
   assert.equal(await p.locator('.room-dialog.dialog-hidden').count(),1);await hasGirl(true);
   await p.locator('.dialogue-restore').click({position:{x:100,y:100}});
   assert.equal(await p.locator('.room-dialog.dialog-hidden').count(),0);
   await advanceTo('room1_memory_music_room_17');await hasGirl(true);
   await advanceTo('room1_memory_bus_01');await hasGirl(false);await shot('walk-background');
   assert.equal(await p.locator('.memory-scene').getAttribute('data-location'),'walk-home');
   await advanceTo('room1_memory_bus_02');await hasGirl(true);await fit();await shot('walk-dialogue');
   // AUTO must advance several consecutive character/player lines in the integrated presentation.
   if(spec.name==='desktop'){
    await p.locator('[data-design-auto]').click();
    await p.waitForFunction(()=>GameLog.list().some(e=>e.id.startsWith('room1_memory_bus_04_')),{},{timeout:20000});
    await p.locator('[data-design-auto]').click();
   }
   await advanceTo('room1_memory_bus_08');await hasGirl(true);
   await advanceTo('room1_memory_bus_09');await hasGirl(true);
   await advanceTo('room1_memory_bus_16');await hasGirl(true);
   await advanceTo('room1_memory_bus_19');await hasGirl(true);
   await advanceTo('room1_memory_bus_21');await hasGirl(true);
   await advanceTo('room1_memory_bus_23');await hasGirl(true);
   await advanceTo('room1_memory_bus_25');await hasGirl(false);
   await advanceTo('room1_memory_bus_26');await hasGirl(false);
   await advanceTo('room1_after_memory_01');
   assert.equal(await p.locator('.memory-scene').count(),0);
   assert.equal(await p.locator('#game').getAttribute('data-memory-stage'),null);
   await advanceTo('room1_memory_03');
   assert.equal(await p.locator('.room-dialog-overlay').getAttribute('data-memory-stage'),null);
   await advanceTo('room1_after_memory_06');
   assert.equal(await p.locator('.hana-portrait:visible').count(),1);await shot('returned');
   await p.evaluate(()=>{for(let i=0;i<300&&document.querySelector('#roomNextButton');i++)Dialogue.advance()});
   assert.equal(await p.evaluate(()=>firstRoomState.doorUnlocked),true);
   assert.equal(await p.locator('.memory-scene').count(),0);
   assert.equal(await p.locator('#game').getAttribute('data-memory-stage'),null);
   assert.notEqual(await p.locator('#hanaButton').evaluate(el=>getComputedStyle(el).visibility),'hidden');
   await p.reload({waitUntil:'load'});await p.locator('#continueButton').click();
   await p.locator('.save-slot-action:not([disabled])').last().click();await p.locator('.save-slot-action.is-confirm').click();
   assert.equal(await p.evaluate(()=>firstRoomState.doorUnlocked),true);
   assert.equal(await p.locator('.memory-scene').count(),0);
   // Abandoning a recollection through a scene change must also release its layers.
   await p.evaluate(()=>showRoomDialog(firstRoomScenario.memory));await p.locator('.memory-scene').waitFor();
   await p.evaluate(()=>showSecondRoom({}));
   await p.waitForFunction(()=>!document.querySelector('.memory-scene')&&!document.getElementById('game').hasAttribute('data-memory-stage'));
   assert.deepEqual(errors,[],spec.name+' no runtime errors');assert.deepEqual(missing,[],spec.name+' no missing assets');
   console.log('PASS '+spec.name+': piano, backgrounds, persistent sprite, thoughts, LOG/hide, return, save reload, scene cleanup');
  }finally{await browser.close()}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
