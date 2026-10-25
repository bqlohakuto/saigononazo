// Keep the current character visible while network loading and image decoding
// finish independently. Local routes make the race deterministic and offline.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
async function localPage(browser,viewport,failFrame=false){
 const ctx=await browser.newContext({viewport,hasTouch:viewport.width<1000,isMobile:viewport.width<1000});
 await ctx.addInitScript(({failFrame})=>{
  localStorage.setItem('saigononazo-help-seen','1');
  window.hanaDecodeWaits={};
  const decode=HTMLImageElement.prototype.decode;
  HTMLImageElement.prototype.decode=function(){
   if(failFrame&&this.src.includes('/idle/04.webp'))return Promise.reject(new Error('Test decode failure'));
   const key=this.src.includes('/idle/03.webp')?'blink':this.src.includes('/portraits/thinking.webp')?'thought':null;
   return decode.call(this).then(()=>key?new Promise(resolve=>{(window.hanaDecodeWaits[key]||=[]).push(resolve)}):undefined);
  };
 },{failFrame});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 let releaseBody;const bodyGate=new Promise(r=>{releaseBody=r;});
 await page.route('https://hana.local/**',async route=>{
  const filename=decodeURIComponent(new URL(route.request().url()).pathname);
  if(filename.endsWith('/idle/01.webp'))await bodyGate;
  const file=path.resolve(root,'.'+filename);
  return route.fulfill(file.startsWith(root+path.sep)||file===root?fs.existsSync(file)?{path:fs.statSync(file).isDirectory()?path.join(file,'index.html'):file}:{status:404,body:''}:{status:403,body:''});
 });
 await page.goto('https://hana.local/',{waitUntil:'domcontentloaded'});
 return {ctx,page,errors,releaseBody};
}
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 try{
  for(const viewport of [{width:1366,height:768},{width:852,height:393}]){
   const h=await localPage(browser,viewport),{page}=h;
   await page.evaluate(()=>{
    settings.instantText=true;showFifthRoom({introSeen:true});window.originalHana=document.querySelector('#r5Hana');
    // An unrelated DOM update used to make syncHud remove this authored button.
    game.append(document.createElement('i'));
   });
   await page.waitForTimeout(100);
   assert.equal(await page.evaluate(()=>document.querySelector('#r5Hana')===window.originalHana),true,'loading must retain authored Hana');
   assert.equal(await page.locator('#r5Hana').evaluate(el=>el.tagName),'BUTTON');
   h.releaseBody();await page.waitForSelector('#game.hana-v2-full-ready');
   assert.equal(await page.evaluate(()=>document.querySelector('#r5Hana')===window.originalHana),true,'load completion keeps identity and click handler');
   await page.waitForFunction(()=>window.hanaDecodeWaits.blink?.length>0);
   assert.equal(await page.locator('#game').evaluate(el=>el.classList.contains('hana-idle-ready')),false,'onload is insufficient: blink decoding still pending');
   assert.match(await page.locator('#r5Hana').evaluate(el=>getComputedStyle(el).backgroundImage),/idle\/01\.webp/);
   await page.evaluate(()=>window.hanaDecodeWaits.blink.splice(0).forEach(resolve=>resolve()));
   await page.waitForSelector('#game.hana-idle-ready');
   await page.evaluate(()=>showRoomDialog([{logId:'stable-happy',speaker:'ハナ',expression:'happy',text:'表示の切り替えを確認します。'}]));
   await page.waitForFunction(()=>document.querySelector('.hana-portrait')?.dataset.displayedExpression==='happy');
   const happy=await page.locator('.hana-portrait').evaluate(el=>el.style.backgroundImage);
   await page.waitForFunction(()=>window.hanaDecodeWaits.thought?.length>0);
   await page.evaluate(()=>DesignUI.displayLine({speaker:'ハナ',expression:'thought',text:'……？'},'heroine'));
   assert.equal(await page.locator('.hana-portrait').evaluate(el=>el.style.backgroundImage),happy,'keep happy while the next expression is undecoded');
   assert.equal(await page.locator('.hana-portrait').getAttribute('data-expression'),'thought');
   await page.evaluate(()=>DesignUI.displayLine({speaker:'ハナ',expression:'concern',text:'大丈夫？'},'heroine'));
   await page.waitForFunction(()=>document.querySelector('.hana-portrait')?.dataset.displayedExpression==='concern');
   await page.evaluate(()=>window.hanaDecodeWaits.thought.splice(0).forEach(resolve=>resolve()));
   await page.waitForTimeout(50);
   assert.equal(await page.locator('.hana-portrait').getAttribute('data-displayed-expression'),'concern','late load must not restore an outdated expression');
   await page.evaluate(()=>DesignUI.displayLine({speaker:'ハナ',expression:'thought',text:'考えてみよう。'},'heroine'));
   await page.waitForFunction(()=>document.querySelector('.hana-portrait')?.dataset.displayedExpression==='thought');
   await page.evaluate(()=>{for(let i=0;i<100&&document.querySelector('#roomNextButton');i++)document.querySelector('#roomNextButton').click();});
   await page.locator('#r5Hana').click();await page.locator('.hana-choice-menu').waitFor();
   assert.deepEqual(h.errors,[]);await h.ctx.close();
   console.log(`PASS ${viewport.width}x${viewport.height}: delayed body, delayed decode, retained portrait and live Hana button`);
  }
  const h=await localPage(browser,{width:1366,height:768},true);h.releaseBody();
  await h.page.evaluate(()=>showFifthRoom({introSeen:true}));
  await h.page.waitForSelector('#game.hana-v2-full-ready');
  await h.page.waitForFunction(()=>window.hanaDecodeWaits.blink?.length>0);
  await h.page.evaluate(()=>window.hanaDecodeWaits.blink.splice(0).forEach(resolve=>resolve()));
  await h.page.waitForTimeout(100);
  assert.equal(await h.page.locator('#game').evaluate(el=>el.classList.contains('hana-idle-ready')),false,'decode failure keeps a static body');
  assert.equal(await h.page.locator('#r5Hana').count(),1);assert.deepEqual(h.errors,[]);await h.ctx.close();
  console.log('PASS failed blink decode: static fallback and no unhandled error');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
