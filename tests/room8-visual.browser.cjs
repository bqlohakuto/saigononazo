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
   const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(10000);
   const base=process.env.PUBLIC_BASE_URL||'https://room8.local/';
   if(!process.env.PUBLIC_BASE_URL)await p.route('https://room8.local/**',async route=>{
    const file=path.resolve(root,decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\//,'')||'index.html');
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){await route.fulfill({status:404,body:''});return}
    await route.fulfill({path:file});
   });
   await p.goto(base,{waitUntil:'load'});await p.locator('#testRoomButton').click();await p.locator('[data-room="room08"]').click();
   const saved=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('saigononazo-save-v1')).rooms.room08);
   const click=s=>p.locator(s).click();
   const finish=async()=>{for(let i=0;i<1000&&await p.locator('#roomNextButton').count();i++)await click('#roomNextButton');assert.equal(await p.locator('#roomNextButton').count(),0)};
   const advanceTo=async id=>{for(let i=0;i<1000&&(await saved()).introLogId!==id;i++)await click('#roomNextButton');assert.equal((await saved()).introLogId,id)};
   await advanceTo('r8_reunion_13');
   assert.equal(await p.locator('.r8-living').getAttribute('data-hana-pose'),'seated');
   assert.equal(await p.locator('.r8-living > .hana-v2-world:visible').count(),0,'standing sprite does not contradict seated dialogue');
   assert.match(await p.locator('#roomMessage').textContent(),/わたしのことも/);
   await p.screenshot({path:path.join(out,'room08-'+spec.name+'-reunion.png')});
   // Reload through the player's Continue/load UI rather than calling the renderer.
   await p.reload({waitUntil:'load'});await click('#continueButton');await p.locator('.save-slot-action:not([disabled])').last().click();await click('.save-slot-action.is-confirm');
   assert.equal((await saved()).introLogId,'r8_reunion_13');assert.match(await p.locator('#roomMessage').textContent(),/わたしのことも/);
   await finish();assert.equal((await saved()).puzzleReady,true);
   await p.locator('#r8PaperImage:visible,#r8Paper:visible').first().click();await click('#r8Back');
   assert.match(await p.locator('#r8BackText').textContent(),/最初の部屋/);
   assert.doesNotMatch(await p.locator('#r8BackText').textContent(),/未確定|花音/);
   await p.screenshot({path:path.join(out,'room08-'+spec.name+'-paper.png')});
   await p.locator('#r8Answer').fill('ハナ');await click('#r8Submit');assert.match(await p.locator('#r8Feedback').textContent(),/この名前じゃない/);
   await p.locator('#r8Answer').fill('花音');await click('#r8Submit');await finish();
   await click('#r8FinalDoor');await finish();
   assert.equal((await saved()).ended,true);
   await p.locator('#roomNextButton').waitFor({state:'visible'});
   await finish();
   assert.equal((await saved()).epilogueSeen,true);
   assert.equal(await p.locator('.ending-credits').count(),1);
   assert.deepEqual(errors,[],spec.name+' has no runtime errors');
   console.log('PASS room8 '+spec.name+': seated dialogue, reload, paper scrolling, wrong/right answer and END');
  }finally{await browser.close()}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
