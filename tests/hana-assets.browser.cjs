const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const base=process.env.PUBLIC_BASE_URL||'https://bqlohakuto.github.io/saigononazo/';
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../images/characters/hana-current/manifest.json')));
async function finish(page){
 for(let i=0;i<500&&await page.locator('#roomNextButton').count();i++)await page.locator('#roomNextButton').click({force:true});
}
(async()=>{for(const spec of [{name:'pc',engine:chromium,viewport:{width:1366,height:768}},{name:'landscape',engine:webkit,viewport:{width:852,height:393},mobile:true}]){
 const browser=await spec.engine.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:spec.viewport,isMobile:!!spec.mobile,hasTouch:!!spec.mobile,reducedMotion:'reduce'});
  await context.addInitScript(()=>localStorage.setItem('saigononazo-help-seen','1'));
  const page=await context.newPage(),errors=[],legacy=[],failed=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(/hana-v[258]\/|hana-expressions|archive\/characters/.test(r.url()))legacy.push(r.url())});
  page.on('response',r=>{if(r.status()>=400&&r.url().includes('hana-current'))failed.push(r.url())});
  await page.goto(base+'?hana-review='+Date.now(),{waitUntil:'load'});
  await page.waitForSelector('#game.hana-v2-full-ready.hana-idle-ready');
  await page.evaluate(async assets=>{for(const asset of assets){const image=new Image();image.src='images/characters/hana-current/'+asset.path;await image.decode();if(image.naturalWidth!==asset.width||image.naturalHeight!==asset.height)throw Error('Wrong dimensions '+asset.path)}},manifest.assets);
  const dir=path.join('artifacts/hana-assets',spec.name);fs.mkdirSync(dir,{recursive:true});
  await page.evaluate(()=>{settings.instantText=true;showOpening(expandScenario(openingScenario).findIndex(l=>/^opening_14(?:_|$)/.test(l.logId)))});
  await page.waitForSelector('#openingHanaSprite');
  assert.match(await page.locator('#openingHanaSprite').getAttribute('src'),/hana-current\/world\//);
  await page.screenshot({path:path.join(dir,'opening.png')});
  for(let room=1;room<=8;room++){
   const id='room0'+room;
   await page.evaluate(room=>{settings.instantText=true;[showFirstRoom,showSecondRoom,showThirdRoom,showFourthRoom,showFifthRoom,showSixthRoom,showSeventhRoom,showEighthRoom][room-1]({introSeen:true})},room);
   await page.waitForTimeout(150);await finish(page);
   await page.screenshot({path:path.join(dir,id+'.png')});
   await page.evaluate(()=>showRoomDialog([{logId:'hana-review-talk',speaker:'ハナ',text:'一緒に考えてみよう！'}]));
   await page.waitForSelector('.hana-portrait:not([hidden])');
   assert.match(await page.locator('.hana-portrait').evaluate(e=>getComputedStyle(e).backgroundImage),/hana-current\/portraits\//);
   await page.screenshot({path:path.join(dir,id+'-dialogue.png')});await finish(page);
  }
  await page.evaluate(()=>showThirdRoom({view:'left',bedInspected:false}));await finish(page);
  assert(await page.locator('.room3-sleeping-hana').isVisible());
  assert.match(await page.locator('.room3-sleeping-hana').evaluate(e=>getComputedStyle(e).backgroundImage),/hana-current\/poses\/sleeping.webp/);
  await page.screenshot({path:path.join(dir,'room03-sleep.png')});
  await page.evaluate(()=>showFourthRoom({}));await finish(page);
  await page.evaluate(()=>r4SetHanaLookUp(true));
  const anchors=await page.locator('#r4Hana').evaluate(el=>{const a=getComputedStyle(el,'::before'),b=getComputedStyle(el.querySelector('.r4-hana-look-pose'));return [parseFloat(a.bottom),parseFloat(b.bottom),parseFloat(a.height),parseFloat(b.height),b.backgroundImage]});
  assert(Math.abs(anchors[0]-anchors[1])<1);assert(Math.abs(anchors[2]-anchors[3])<1);assert.match(anchors[4],/hana-current\/world\/look-up\/04.webp/);
  await page.screenshot({path:path.join(dir,'room04-look-up.png')});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>{r4SetHanaLookUp(false);r4SetHanaLookUp(true)});await page.waitForTimeout(750);
  assert.match(await page.locator('.r4-hana-look-pose').evaluate(e=>getComputedStyle(e).backgroundImage),/look-up\/04.webp/);
  assert.deepEqual(legacy,[]);assert.deepEqual(failed,[]);assert.deepEqual(errors,[]);
  console.log('PASS',spec.name,'all 8 rooms, opening, portraits, sleep, gaze, no legacy requests');
 }finally{await browser.close()}
}})().catch(e=>{console.error(e);process.exitCode=1});
