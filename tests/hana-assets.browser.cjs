const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const base=process.env.PUBLIC_BASE_URL||'https://bqlohakuto.github.io/saigononazo/';
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../images/characters/hana-current/manifest.json')));
async function readyImages(page){await page.evaluate(async()=>{await Promise.all([...document.images].filter(i=>!i.hidden&&i.getAttribute('src')).map(i=>i.decode().catch(()=>{})))})}
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
  page.on('response',r=>{if(r.status()>=400&&/hana-(?:current|hires)/.test(r.url()))failed.push(r.url())});
  await page.goto(base+'?hana-review='+Date.now(),{waitUntil:'load'});
  await page.waitForSelector('#game.hana-v2-full-ready.hana-idle-ready');
  const pixelCheck=await page.evaluate(async()=>{
   const hashes=[],samples=[],dimensions=[];
   const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=2048;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});
   for(const frame of ['01','02','03','04']){
    const image=new Image();image.src='images/characters/hana-hires/idle/'+frame+'.webp';await image.decode();
    dimensions.push([image.naturalWidth,image.naturalHeight]);ctx.clearRect(0,0,1024,2048);ctx.drawImage(image,0,0);
    const pixels=ctx.getImageData(0,0,1024,2048).data;
    const digest=await crypto.subtle.digest('SHA-256',pixels.slice(400*1024*4));
    hashes.push([...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join(''));
    samples.push([[400,1300],[620,1300],[420,1550],[630,1550],[510,650]].map(([x,y])=>pixels[(y*1024+x)*4+3]));
   }
   return {hashes,samples,dimensions};
  });
  assert.equal(new Set(pixelCheck.hashes).size,1,'All body pixels are identical across the blink');
  for(const size of pixelCheck.dimensions)assert.deepEqual(size,[1024,2048]);
  for(const samples of pixelCheck.samples)assert.deepEqual(samples,[255,255,255,255,255],'Clothing remains opaque');
  await page.evaluate(async assets=>{for(const asset of assets){const image=new Image();image.src='images/characters/hana-current/'+asset.path;await image.decode();if(image.naturalWidth!==asset.width||image.naturalHeight!==asset.height)throw Error('Wrong dimensions '+asset.path)}},manifest.assets);
  const dir=path.join('artifacts/hana-assets',spec.name);fs.mkdirSync(dir,{recursive:true});
  await page.evaluate(()=>{settings.instantText=true;showOpening(expandScenario(openingScenario).findIndex(l=>/^opening_14(?:_|$)/.test(l.logId)))});
  await page.waitForSelector('#openingHanaSprite');
  assert.match(await page.locator('#openingHanaSprite').getAttribute('src'),/hana-hires\/idle\//);
  await readyImages(page);await page.screenshot({path:path.join(dir,'opening.png')});
  for(let room=1;room<=8;room++){
   const id='room0'+room;
   await page.evaluate(room=>{settings.instantText=true;[showFirstRoom,showSecondRoom,showThirdRoom,showFourthRoom,showFifthRoom,showSixthRoom,showSeventhRoom,showEighthRoom][room-1]({introSeen:true})},room);
   await page.waitForTimeout(150);await finish(page);
   await readyImages(page);await page.screenshot({path:path.join(dir,id+'.png')});
   await page.evaluate(()=>showRoomDialog([{logId:'hana-review-talk',speaker:'ハナ',text:'一緒に考えてみよう！'}]));
   await page.waitForSelector('.hana-portrait:not([hidden])');
   assert.equal(await page.locator('#game').evaluate(e=>e.classList.contains('has-world-expression')),false,'Dialogue never restores a retired full-body variant');
   assert.match(await page.locator('.hana-portrait').evaluate(e=>getComputedStyle(e).backgroundImage),/hana-current\/portraits\//);
   await readyImages(page);await page.screenshot({path:path.join(dir,id+'-dialogue.png')});await finish(page);
  }
  await page.evaluate(()=>showThirdRoom({view:'left',bedInspected:false}));await finish(page);
  assert(await page.locator('.room3-sleeping-hana').isVisible());
  assert.match(await page.locator('.room3-sleeping-hana').evaluate(e=>getComputedStyle(e).backgroundImage),/hana-current\/poses\/sleeping.webp/);
  await readyImages(page);await page.screenshot({path:path.join(dir,'room03-sleep.png')});
  await page.evaluate(()=>showFourthRoom({}));await finish(page);
  await page.evaluate(()=>r4SetHanaLookUp(true));
  // Detailed geometry is covered by room4-visual.browser.cjs. This pass
  // checks the dedicated asset and visibility without injecting layout probes.
  assert.match(await page.locator('.r4-hana-look-pose').evaluate(e=>getComputedStyle(e).backgroundImage),/hana-current\/world\/look-up\/04.webp/);
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('#r4Hana .r4-hana-look-pose')).opacity==='1');
  assert.equal(await page.locator('.r4-hana-look-pose').evaluate(e=>getComputedStyle(e).opacity),'1');
  await readyImages(page);await page.screenshot({path:path.join(dir,'room04-look-up.png')});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>{r4SetHanaLookUp(false);r4SetHanaLookUp(true)});await page.waitForTimeout(750);
  assert.match(await page.locator('.r4-hana-look-pose').evaluate(e=>getComputedStyle(e).backgroundImage),/look-up\/04.webp/);
  assert.deepEqual(legacy,[]);assert.deepEqual(failed,[]);assert.deepEqual(errors,[]);
  console.log('PASS',spec.name,'all 8 rooms, opening, portraits, sleep, gaze, no legacy requests');
 }finally{await browser.close()}
}})().catch(e=>{console.error(e);process.exitCode=1});
