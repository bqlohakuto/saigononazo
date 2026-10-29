// Exercise the authored final scene on PC and a narrow landscape touch viewport.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),out=process.env.UI_SCREENSHOT_DIR||path.join(root,'artifacts/room07');
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 for(const spec of [{name:'desktop',width:1366,height:768},{name:'phone',width:667,height:375,touch:true}]){
  const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
  try{
   const context=await browser.newContext({viewport:{width:spec.width,height:spec.height},isMobile:!!spec.touch,hasTouch:!!spec.touch});
   await context.addInitScript(()=>{localStorage.setItem('saigononazo-help-seen','1');localStorage.setItem('saigononazo-settings-v1',JSON.stringify({instantText:true}))});
   const p=await context.newPage(),errors=[],missing=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(10000);
   const base=process.env.PUBLIC_BASE_URL||'https://room8.local/';
   if(!process.env.PUBLIC_BASE_URL)await p.route('https://room8.local/**',async route=>{
    const file=path.resolve(root,decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\//,'')||'index.html');
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){if(file.includes('/room08/dialogue/'))missing.push(file);await route.fulfill({status:404,body:''});return}
    await route.fulfill({path:file});
   });
   await p.goto(new URL("?preview=1",base).toString(),{waitUntil:'load'});await p.locator('#testRoomButton').click();await p.locator('[data-room="room08"]').click();
   const saved=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('saigononazo-save-v1')).rooms.room08);
   const click=s=>p.locator(s).click();
   const finish=async()=>{for(let i=0;i<1000&&await p.locator('#roomNextButton').count();i++)await click('#roomNextButton');assert.equal(await p.locator('#roomNextButton').count(),0)};
   const advanceTo=async id=>{for(let i=0;i<1000&&(await saved()).introLogId!==id;i++)await click('#roomNextButton');assert.equal((await saved()).introLogId,id)};
   const advanceFinal=async id=>{for(let i=0;i<1000&&(await saved()).finalTalkLogId!==id;i++)await click('#roomNextButton');assert.equal((await saved()).finalTalkLogId,id)};
   const frame=async(key,file)=>{const selector='[data-r8-visual="'+key+'"] .r8-story-frame.is-visible[src$="'+file+'"]';const image=p.locator(selector);await image.waitFor();assert.ok(await image.evaluate(el=>el.naturalWidth>0),'image decoded');await p.waitForFunction(sel=>{const el=document.querySelector(sel);return !!el&&Number(getComputedStyle(el).opacity)>.99},selector)};
   await advanceTo('r8_reunion_13');
   assert.equal(await p.locator('.r8-living').getAttribute('data-hana-pose'),'seated');
   assert.equal(await p.locator('.r8-living > .hana-v2-world:visible').count(),0,'standing sprite does not contradict seated dialogue');
   assert.match(await p.locator('#roomMessage').textContent(),/わたしのことも/);
   await frame('overview','overview-white.webp');
   await p.screenshot({path:path.join(out,'room08-'+spec.name+'-reunion.png')});
   // Reload through the player's Continue/load UI rather than calling the renderer.
   await p.reload({waitUntil:'load'});await click('#continueButton');await p.locator('.save-slot-action:not([disabled])').last().click();await click('.save-slot-action.is-confirm');
   assert.equal((await saved()).introLogId,'r8_reunion_13');assert.match(await p.locator('#roomMessage').textContent(),/わたしのことも/);
   await advanceTo('r8_reunion_19');await frame('white','pov-white.webp');
   assert.equal(await p.locator('.room-dialog-overlay[data-r8-pov] .hana-portrait:visible').count(),0,'full scene does not duplicate the old portrait');
   await p.screenshot({path:path.join(out,'room08-'+spec.name+'-pov-white.png')});
   await p.getByRole('button',{name:'非表示',exact:true}).click();
   assert.equal(await p.locator('.r8-story-frame.is-visible').count()>0,true,'art remains visible with the dialogue hidden');
   await p.locator('.dialogue-restore').click();
   await advanceTo('r8_reunion_21');await frame('brown','pov-brown.webp');
   await p.screenshot({path:path.join(out,'room08-'+spec.name+'-pov-brown.png')});
   await advanceTo('r8_memories_04');await frame('pout','pov-pout.webp');
   await advanceTo('r8_041');await frame('fading','pov-fading.webp');
   await p.screenshot({path:path.join(out,'room08-'+spec.name+'-dissolve.png')});
   await finish();assert.equal((await saved()).puzzleReady,true);
   await p.locator('.r8-final-stage.has-r8-final-image #r8PaperImage').waitFor();
   await click('#r8PaperImage');await click('#r8Back');
   assert.match(await p.locator('#r8BackText').textContent(),/最初の部屋/);
   assert.doesNotMatch(await p.locator('#r8BackText').textContent(),/未確定|花音/);
   await p.screenshot({path:path.join(out,'room08-'+spec.name+'-paper.png')});
   // G02/G03/G04: real-browser record list navigation, including the narrow touch viewport.
   await p.locator('.device-overlay .device-close').click();
   await p.evaluate(()=>{
    for(let i=0;i<21;i++)GameLog.record({
      logId:'visual_log_'+i,logRoom:'room08',logType:'investigation',
      speaker:'ト書き',text:'調査記録 '+String(i).padStart(2,'0')+'。'.repeat(55)
    });
   });
   await p.locator('.gameplay-hud-actions button').filter({hasText:'記録'}).click();
   const recordPanel=p.locator('.design-panel[aria-label="記録"]');
   await recordPanel.waitFor();
   const roomJump=recordPanel.locator('select[aria-label="記録の部屋へジャンプ"]');
   assert.equal(await roomJump.inputValue(),'room08','the viewed room remains selected');
   await recordPanel.locator('.design-record-categories [data-category="investigation"]').click();
   const pagePicker=recordPanel.locator('select[aria-label="記録のページを選択"]');
   assert.ok(await pagePicker.locator('option').count()>=3,'record pages are directly selectable');
   const recordList=recordPanel.locator('.design-content');
   const scrolling=await recordList.evaluate(el=>{
    const initial={height:el.style.height,maxHeight:el.style.maxHeight,minHeight:el.style.minHeight};
    el.style.height='56px';el.style.maxHeight='56px';el.style.minHeight='0px';
    const style=getComputedStyle(el);
    const info={overflow:style.overflowY,touch:style.touchAction,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight};
    el.scrollTop=100;
    info.scrollTop=el.scrollTop;
    Object.assign(el.style,initial);
    return info;
   });
   assert.equal(scrolling.overflow,'auto','record list keeps vertical scrolling in '+spec.name);
   assert.ok(scrolling.touch.includes('pan-y'),'touch gestures can scroll records');
   assert.ok(scrolling.scrollHeight>scrolling.clientHeight&&scrolling.scrollTop>0,
     'the browser can scroll the record list when the viewport is short');
   const lastPage=(await pagePicker.locator('option').count())-1;
   await pagePicker.selectOption(String(lastPage));
   assert.equal(await pagePicker.inputValue(),String(lastPage),'last record page can be selected');
   await recordPanel.locator('.design-record').last().click();
   await recordPanel.locator('.design-page').waitFor();
   assert.ok(await recordPanel.locator('.design-record-pager').isHidden(),'detail hides list pager');
   await recordPanel.locator('.design-actions button').filter({hasText:'一覧に戻る'}).click();
   assert.ok(await recordPanel.locator('.design-record').count()>0,'returning restores the list');
   await p.screenshot({path:path.join(out,'room08-'+spec.name+'-record-navigation.png')});
   await recordPanel.locator('header button').click();
   await click('#r8PaperImage');
   await p.locator('#r8Answer').fill('ハナ');await click('#r8Submit');assert.match(await p.locator('#r8Feedback').textContent(),/この名前じゃない/);
   await p.locator('#r8Answer').fill('花音');await click('#r8Submit');
   await advanceFinal('r8_return_02');await frame('reunion','pov-reunion.webp');
   await advanceFinal('r8_solve_31');await frame('holding','hold-warm.webp');
   await advanceFinal('r8_solve_37');await frame('tears','hold-tears.webp');
   await p.screenshot({path:path.join(out,'room08-'+spec.name+'-farewell-tears.png')});
   await p.reload({waitUntil:'load'});await click('#continueButton');await p.locator('.save-slot-action:not([disabled])').last().click();await click('.save-slot-action.is-confirm');
   assert.equal((await saved()).finalTalkLogId,'r8_solve_37');await frame('tears','hold-tears.webp');
   await finish();
   await click('#r8FinalDoor');
   for(let i=0;i<100&&(await saved()).finalEndLogId!=='r8_end_02_light';i++)await click('#roomNextButton');
   assert.equal((await saved()).finalEndLogId,'r8_end_02_light');await frame('farewell','farewell.webp');
   assert.equal(await p.locator('.r8-story-art').getAttribute('data-glow'),'soft');
   await p.screenshot({path:path.join(out,'room08-'+spec.name+'-last-goodbye.png')});
   await p.reload({waitUntil:'load'});await click('#continueButton');await p.locator('.save-slot-action:not([disabled])').last().click();await click('.save-slot-action.is-confirm');
   assert.equal((await saved()).finalEndLogId,'r8_end_02_light');await frame('farewell','farewell.webp');
   await finish();
   assert.equal((await saved()).ended,true);
   await p.locator('#roomNextButton').waitFor({state:'visible'});
   await finish();
   assert.equal((await saved()).epilogueSeen,true);
   assert.equal(await p.locator('.ending-pc-transition').count(),1);
   assert.deepEqual(errors,[],spec.name+' has no runtime errors');assert.deepEqual(missing,[],spec.name+' has no missing dialogue art');
   console.log('PASS room8 '+spec.name+': seated dialogue, reload, paper scrolling, wrong/right answer and END');
  }finally{await browser.close()}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
