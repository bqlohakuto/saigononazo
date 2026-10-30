// Pointer-driven PC/mobile landscape review, including persistence and final transition.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),out=process.env.UI_SCREENSHOT_DIR||path.join(root,'artifacts/room07');
const specs=[{name:'desktop',width:1366,height:768},{name:'phone-landscape',width:852,height:393,touch:true},{name:'small-landscape',width:667,height:375,touch:true}];
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 for(const spec of specs){
  const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
  try{
   const context=await browser.newContext({viewport:{width:spec.width,height:spec.height},isMobile:!!spec.touch,hasTouch:!!spec.touch});
   await context.addInitScript(()=>{localStorage.setItem('saigononazo-help-seen','1');localStorage.setItem('saigononazo-first-visit-notice-v1', 'accepted');localStorage.setItem('saigononazo-settings-v1',JSON.stringify({instantText:true}))});
   const p=await context.newPage(),errors=[],missing=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(10000);
   const base=process.env.PUBLIC_BASE_URL||'https://room7.local/';
   if(!process.env.PUBLIC_BASE_URL)await p.route('https://room7.local/**',async route=>{const rel=decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\//,'')||'index.html',file=path.resolve(root,rel);if(!file.startsWith(root+path.sep)){await route.fulfill({status:403,body:''});return}if(!fs.existsSync(file)){missing.push(rel);await route.fulfill({status:404,body:''});return}await route.fulfill({path:file})});
   await p.goto(new URL("?preview=1",base).toString(),{waitUntil:'load'});await p.locator('#testRoomButton').click();await p.locator('[data-room="room07"]').click();
   async function finish(){for(let i=0;i<500&&await p.locator('#roomNextButton').count();i++)await p.locator('#roomNextButton').click()}
   const state=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('saigononazo-save-v1')).rooms.room07);
   const click=s=>p.locator(s).click();
   const shot=async name=>{await p.waitForTimeout(120);await p.screenshot({path:path.join(out,spec.name+'-'+name+'.png')})};
   const fit=async()=>{const bad=await p.evaluate(()=>{const panel=document.querySelector('.r7-panel'),rect=document.querySelector('#game').getBoundingClientRect();if(!panel)return[];return[...panel.querySelectorAll('.device-close,#r7UseBook,#r7Take,#r7SearchAction,#r7Zoom,#r7BackShelf,#r7RotateLeft,#r7RotateRight,#r7DialDone,.r7-slot')].filter(e=>{const r=e.getBoundingClientRect();const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return r.width>0&&(r.left<rect.left-2||r.right>rect.right+2||r.top<rect.top-2||r.bottom>rect.bottom+2||!e.contains(hit))}).map(e=>e.id||e.className)});assert.deepEqual(bad,[],spec.name+' controls fit')};
   async function shelfFits(){
    const bounds=await p.evaluate(()=>{const row=document.querySelector('.r7-shelf-row').getBoundingClientRect();return [...document.querySelectorAll('.r7-spine-slot img')].map(im=>{const r=im.getBoundingClientRect();return {top:r.top-row.top,bottom:r.bottom-row.bottom,height:r.height,rowHeight:row.height}})});
    assert.ok(bounds.length>=4,spec.name+' fixed spines visible');
    for(const r of bounds){assert.ok(r.top>=-1&&r.bottom<=1,spec.name+' spine stays above shelf board');assert.ok(Math.abs(r.height-r.rowHeight)<1,spec.name+' grid row respects shelf height')}
   }
   async function turn(view){for(let i=0;i<4&&(await state()).view!==view;i++)await click('#r7TurnRight');assert.equal((await state()).view,view)}
   await finish();assert.equal(await p.getByText('散らばった記憶を辿り、忘れてはならないものを見つけ出せ',{exact:true}).count(),0,'entry does not reveal puzzle');await click('#r7Door');await finish();await p.evaluate(()=>document.fonts.ready);await shot('front');
   await click('#r7Dial');await fit();assert.equal(await p.locator('.r7-overlay .r7-dial-wheel text').count(),12);await click('#r7RotateLeft');assert.equal((await state()).selectedZodiac,'丑');await shot('dial');await click('#r7DialDone');
   for(const [view,target]of [['left','r7Drawer'],['left','r7Curtain'],['left','r7Diary'],['right','r7Stack'],['right','r7Box'],['front','r7Cabinet']]){
    await turn(view);await click('#'+target);await fit();if(await p.locator('#r7SearchAction').count())await click('#r7SearchAction');await p.locator('.r7-search .r7-cover').waitFor();await fit();await click('#r7Take');await p.locator('#roomNextButton').waitFor();assert.equal(await p.locator('#r7UseBook').count(),0,'no shelf shortcut on pickup');assert.equal(await p.locator('.r7-cover-view').count(),0,'no cover panel on pickup');await finish();assert.equal(await p.locator('.r7-open-book').count(),0);
   }
   assert.equal((await state()).collected.length,6);await turn('left');await shot('left');await turn('right');await shot('right');
   // Exercise the common inventory and its room-specific use path.
   await p.getByRole('button',{name:'持ち物',exact:true}).click();await p.getByRole('button',{name:'一休さん',exact:true}).click();await p.getByRole('button',{name:'使う',exact:true}).click();await p.locator('#r7UseBook').waitFor();await click('#r7UseBook');assert.equal((await state()).view,'back');
   await fit();await shot('shelf-before');await click('[data-held="bremen"]');await click('[data-slot="1"]');assert.equal((await state()).slots[1],'bremen');assert.equal((await state()).booksSolved,false);await click('[data-slot="1"]');assert.equal((await state()).placed.length,0);
   for(const [id,slot]of [['bremen',8],['mitten',7],['monkey',5],['wolf',3],['rabbit',2],['ikkyu',1]]){await click('[data-held="'+id+'"]');await click('[data-slot="'+slot+'"]')}
   assert.equal(await p.locator('.r7-books-glow').count(),1,'correct arrangement starts the glow');assert.equal(await p.locator('.r7-books-glow img').first().evaluate(e=>getComputedStyle(e).animationName),'r7-books-glow');await shot('books-glow');
   await finish();assert.equal((await state()).booksSolved,true);await click('#r7Shelf');await fit();await shot('shelf-complete');
   await click('[data-slot="7"]');await finish();await p.locator('.r7-open-book').evaluate(im=>im.decode());await fit();await shot('open-book');await click('#r7Zoom');assert.ok(await p.locator('.r7-reader-panel.is-zoomed').count());await click('#r7Zoom');await click('#r7BackShelf');await click('.r7-overlay .device-close');await shelfFits();await shot('shelf-world-complete');
   const saved=await state();await p.reload({waitUntil:'load'});await p.locator('#continueButton').click();await p.locator('.save-slot-action:not([disabled])').last().click();await p.locator('.save-slot-action.is-confirm').click();await p.locator('.r7-scene').waitFor();assert.deepEqual(await state(),saved,spec.name+' actual saved-game resume');
   await turn('front');
   for(const target of ['寅','卯','未','申','亥','酉']){
    await click('#r7Dial');for(let i=0;i<12&&(await state()).selectedZodiac!==target;i++)await click('#r7RotateLeft');await click('#r7DialDone');await click('#r7Door');
    if(target!=='酉'){await p.locator('.r7-scene.is-door-opening').waitFor();await p.locator('.r7-scene.is-door-opening').waitFor({state:'hidden'})}
    if(target==='寅'){
     await p.locator('.memory-scene[data-location="r7tiger"]').waitFor();
     await p.locator('.memory-background').evaluate(im=>im.decode());await p.locator('.memory-girl').evaluate(im=>im.decode());
     await p.waitForTimeout(700);await shot('tiger-memory');
     for(let n=0;n<30&&!(await state()).shortMemory.progress?.logId.startsWith('r7_mem_tiger_05');n++)await click('#roomNextButton');
     const duringMemory=await state();assert.match(await p.locator('#roomMessage').textContent(),/いえ、別に/);
     await p.reload({waitUntil:'load'});await p.locator('#continueButton').click();await p.locator('.save-slot-action:not([disabled])').last().click();await p.locator('.save-slot-action.is-confirm').click();
     await p.locator('.memory-scene[data-location="r7tiger"]').waitFor();
     assert.equal((await state()).shortMemory.progress.logId,duringMemory.shortMemory.progress.logId,spec.name+' memory line resumes');
     assert.match(await p.locator('#roomMessage').textContent(),/いえ、別に/);
    }
    if(target==='卯'){
     await p.locator('.memory-scene[data-location="r7rabbit"]').waitFor();
     await p.locator('.memory-background').evaluate(im=>im.decode());
     assert.equal(await p.locator('.memory-girl').isHidden(),true,spec.name+' senior is on the phone');
     await p.waitForTimeout(700);await shot('rabbit-memory');
     for(let n=0;n<50&&!(await state()).shortMemory.progress?.logId.startsWith('r7_mem_rabbit_09');n++)await click('#roomNextButton');
     const duringMemory=await state();assert.match(await p.locator('#roomMessage').textContent(),/それが、まだ悩んでいて/);
     await shot('rabbit-dialogue');
     await p.reload({waitUntil:'load'});await p.locator('#continueButton').click();await p.locator('.save-slot-action:not([disabled])').last().click();await p.locator('.save-slot-action.is-confirm').click();
     await p.locator('.memory-scene[data-location="r7rabbit"]').waitFor();
     assert.equal((await state()).shortMemory.progress.logId,duringMemory.shortMemory.progress.logId,spec.name+' phone conversation resumes');
     assert.equal(await p.locator('.memory-girl').isHidden(),true);
     assert.match(await p.locator('#roomMessage').textContent(),/それが、まだ悩んでいて/);
    }
    if(target==='未'){
     await p.locator('.memory-scene[data-location="r7sheep"]').waitFor();
     await p.locator('.memory-background').evaluate(im=>im.decode());
     await p.locator('.memory-window-portrait .memory-girl').evaluate(im=>im.decode());
     assert.equal(await p.locator('#game').getAttribute('data-memory-stage'),'revealed');
     assert.equal(await p.locator('.memory-scene').getAttribute('data-presentation'),'dialogue');
     await p.waitForTimeout(700);await shot('sheep-memory');
     for(let n=0;n<80&&!(await state()).shortMemory.progress?.logId.startsWith('r7_mem_sheep_16');n++)await click('#roomNextButton');
     const duringMemory=await state();assert.match(await p.locator('#roomMessage').textContent(),/今まで別々の部屋/);
     await shot('sheep-dialogue');
     await p.reload({waitUntil:'load'});await p.locator('#continueButton').click();await p.locator('.save-slot-action:not([disabled])').last().click();await p.locator('.save-slot-action.is-confirm').click();
     await p.locator('.memory-scene[data-location="r7sheep"]').waitFor();
     assert.equal((await state()).shortMemory.progress.logId,duringMemory.shortMemory.progress.logId,spec.name+' 2015 memory resumes');
     assert.equal(await p.locator('.memory-window-portrait .memory-girl').isVisible(),true);
     assert.match(await p.locator('#roomMessage').textContent(),/今まで別々の部屋/);
    }
    if(target==='申'){
     await p.locator('.memory-scene[data-location="r7monkey"]').waitFor();
     await p.locator('.memory-background').evaluate(im=>im.decode());
     await p.locator('.memory-window-portrait .memory-girl').evaluate(im=>im.decode());
     assert.equal(await p.locator('#game').getAttribute('data-memory-stage'),'expressive');
     assert.equal(await p.locator('.memory-scene').getAttribute('data-presentation'),'dialogue');
     assert.equal(await p.locator('.memory-prop').isHidden(),true,'Room 7 uses the adopted dining background without a separate placeholder notebook');
     await p.waitForTimeout(700);await shot('monkey-memory');
     for(let n=0;n<80&&!(await state()).shortMemory.progress?.logId.startsWith('r7_mem_monkey_16');n++)await click('#roomNextButton');
     const duringMemory=await state();assert.match(await p.locator('#roomMessage').textContent(),/うん/);
     await shot('monkey-dialogue');
     await p.reload({waitUntil:'load'});await p.locator('#continueButton').click();await p.locator('.save-slot-action:not([disabled])').last().click();await p.locator('.save-slot-action.is-confirm').click();
     await p.locator('.memory-scene[data-location="r7monkey"]').waitFor();
     assert.equal((await state()).shortMemory.progress.logId,duringMemory.shortMemory.progress.logId,spec.name+' 2016 memory resumes');
     assert.equal(await p.locator('.memory-prop').isHidden(),true,'Room 7 uses the adopted dining background without a separate placeholder notebook');
     for(let n=0;n<60&&!(await state()).shortMemory.progress?.logId.startsWith('r7_mem_monkey_22_02');n++)await click('#roomNextButton');
     assert.match(await p.locator('#roomMessage').textContent(),/彼女はノートを閉じ/);
     assert.equal(await p.locator('.memory-prop').isHidden(),true);
     await shot('monkey-notebook-closed');
    }
    await finish();
    if(['寅','卯','未','申'].includes(target)){assert.equal((await state()).shortMemory,null);assert.equal(await p.locator('.memory-scene').count(),0);assert.equal(await p.locator('.memory-window-portrait').count(),0)}
   }
   assert.equal((await state()).completed,true);assert.equal(await p.locator('#r7Next').count(),0,'accident returns directly to room8');await p.locator('.r8-paper-hit:visible,#r8Paper:visible,#roomNextButton:visible').first().waitFor();assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('saigononazo-save-v1')).currentScene),'room08');
   assert.deepEqual(errors,[],spec.name+' no runtime errors');assert.deepEqual(missing,[],spec.name+' no missing assets');
   console.log('PASS '+spec.name+': pointer/touch-sized controls, all searches, inventory, shelf, reader, dial, reload and room8');
  }finally{await browser.close()}
 }
})().catch(e=>{console.error(e);process.exitCode=1});

