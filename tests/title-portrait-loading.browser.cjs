const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
// WebKit waits for document load before font readiness; the delayed-image case deliberately blocks load.
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const base=process.env.PUBLIC_BASE_URL||'https://bqlohakuto.github.io/saigononazo/';
(async()=>{for(const spec of [{name:'pc',engine:chromium,viewport:{width:1366,height:768}},{name:'landscape',engine:webkit,viewport:{width:852,height:393},mobile:true}]){
 const browser=await spec.engine.launch({headless:true});
 try{
  const options={viewport:spec.viewport,isMobile:!!spec.mobile,hasTouch:!!spec.mobile,reducedMotion:'reduce'};
  const ctx=await browser.newContext(options),page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  let releaseTitle;const titleGate=new Promise(resolve=>{releaseTitle=resolve});
  await page.route(/title-background-pixel\.png/,async route=>{await titleGate;await route.continue()});
  await page.goto(base+'?title-loading='+Date.now(),{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.title-art-loading');
  assert.equal(await page.locator('.title-text-fallback').isVisible(),true,'readable title while loading');
  assert.equal(await page.locator('#startButton').evaluate(el=>getComputedStyle(el,'::after').content),'"はじめる"');
  const dir=path.join('artifacts','title-portrait',spec.name);fs.mkdirSync(dir,{recursive:true});
  await page.screenshot({path:path.join(dir,'title-loading.png')});
  releaseTitle();await page.waitForSelector('.title-home:not(.title-art-loading)');
  assert.equal(await page.locator('.title-text-fallback').isVisible(),false);
  assert(await page.locator('.title-home').evaluate(el=>getComputedStyle(el).backgroundImage.includes('title-background-pixel.png')));
  assert(await page.locator('.title-logo img').evaluate(el=>el.complete&&el.naturalWidth>100));
  await page.screenshot({path:path.join(dir,'title-ready.png')});
  await ctx.close();
  const cold=await browser.newContext(options),talk=await cold.newPage();talk.on('pageerror',e=>errors.push(e.message));
  let releasePortraits;const portraitGate=new Promise(resolve=>{releasePortraits=resolve});
  await talk.route(/\/hana-v5\/portraits\//,async route=>{await portraitGate;await route.continue()});
  await talk.goto(base+'?portrait-loading='+Date.now(),{waitUntil:'domcontentloaded'});
  await talk.evaluate(()=>{settings.instantText=true;showSixthRoom({introSeen:true});showRoomDialog([{logId:'portrait-cold',speaker:'ハナ',text:'読み込み中の表情を確認します。'}])});
  await talk.waitForSelector('.hana-portrait:not([hidden])');
  const before=await talk.locator('.hana-portrait').evaluate(el=>({url:getComputedStyle(el).backgroundImage,size:getComputedStyle(el).backgroundSize,cls:el.className}));
  assert(before.url.includes('/hana-v5/portraits/neutral.png'),'single pixel portrait fallback before load');
  assert(!before.url.includes('hana-expressions.png'),'never shows old six-face sheet');
  assert(before.cls.includes('hana-v2-portrait'));assert.equal(before.size,'contain');
  releasePortraits();
  await talk.waitForFunction(()=>document.querySelector('.hana-portrait')?.classList.contains('hana-v2-portrait'));
  await talk.evaluate(async()=>{const image=new Image();image.src='images/pixel-ui/hana-v5/portraits/neutral.png?v=20261012-pixel-ui-02';await image.decode()});
  await talk.screenshot({path:path.join(dir,'portrait-ready.png')});
  for(const name of ['neutral','joy','thinking','surprise','sadness','sleepy','laughter']){
   const ok=await talk.evaluate(async name=>{const image=new Image();image.src='images/pixel-ui/hana-v5/portraits/'+name+'.png?v=20261012-pixel-ui-02';await image.decode();return image.naturalWidth>100},name);assert(ok);
  }
  assert.deepEqual(errors,[]);await cold.close();console.log('PASS',spec.name,'cold title and delayed portrait loading');
 }finally{await browser.close()}
}})().catch(e=>{console.error(e);process.exitCode=1});
