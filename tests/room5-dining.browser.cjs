"use strict";
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const base=process.env.PUBLIC_BASE_URL||'https://bqlohakuto.github.io/saigononazo/';
const cases=[
 {name:'pc-chromium',engine:chromium,viewport:{width:1366,height:768},mobile:false},
 {name:'phone-landscape-webkit',engine:webkit,viewport:{width:852,height:393},mobile:true}
];

(async()=>{
 for(const spec of cases){
  const browser=await spec.engine.launch({headless:true,...(spec.mobile?{}:{channel:'chrome'})});
  try{
   const context=await browser.newContext({viewport:spec.viewport,deviceScaleFactor:spec.mobile?2:1,isMobile:spec.mobile,hasTouch:spec.mobile,reducedMotion:'reduce'});
   await context.addInitScript(()=>localStorage.setItem('saigononazo-help-seen','1'));
   const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
   const version=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8').match(/room5\.css\?v=([^"']+)/)?.[1];assert(version);
   for(let retry=0;retry<24;retry++){
    const response=await page.goto(base+'?room05_dining_review='+Date.now(),{waitUntil:'load',timeout:60000});
    if(response?.status()===200&&(await page.locator('link[href*="room5.css"]').first().getAttribute('href'))?.includes(version))break;
    assert(retry<23,'The requested game version has not been deployed');await page.waitForTimeout(6000);
   }
   await page.evaluate(async()=>{
    for(const name of ['dining-table-v2.png','dining-chair-v2.png']){
     const image=new Image();image.src='images/background/room05/overlays/'+name;
     await image.decode();if(!image.naturalWidth||!image.naturalHeight)throw Error('Missing furniture artwork: '+name);
    }
    settings.instantText=true;showFifthRoom({introSeen:true,view:'left'});
   });
   await page.waitForFunction(()=>document.querySelector('#r5Scene')?.classList.contains('has-r5-background'));
   const table=page.locator('.r5-dining-table'),left=page.locator('.r5-chair-left'),right=page.locator('.r5-chair-right'),target=page.locator('.r5-target-chair');
   const dir=path.join('artifacts','room05','e05-e07',spec.name);fs.mkdirSync(dir,{recursive:true});
   async function check(collected){
    assert(await table.isVisible(),'the table remains visible');
    assert(await right.isVisible(),'the other chair remains visible');
    assert.equal(await left.isVisible(),!collected,'only the collectible chair disappears');
    assert.equal(await target.isVisible(),!collected,'chair target follows collection state');
    assert.equal(await target.isEnabled(),!collected,'chair target is disabled after collection');
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('saigononazo-save-v1')).rooms.room05.collected.includes('chair')),collected);
   }
   await check(false);
   assert((await table.evaluate(el=>getComputedStyle(el).backgroundImage)).includes('dining-table-v2.png'));
   assert((await right.evaluate(el=>getComputedStyle(el).backgroundImage)).includes('dining-chair-v2.png'));
   await page.screenshot({path:path.join(dir,'before.png')});
   await target.click();await page.waitForSelector('.room-dialog-overlay');
   await page.evaluate(()=>{for(let i=0;i<100&&document.querySelector('#roomNextButton');i++)document.querySelector('#roomNextButton').click()});
   const reveal=page.locator('.design-pickup-panel');await reveal.waitFor();
   assert((await reveal.locator('.design-pickup-image').getAttribute('src')).endsWith('/chair.webp'));
   await reveal.locator('button').filter({hasText:'閉じる'}).first().click();
   await check(true);await page.screenshot({path:path.join(dir,'after.png')});
   await page.evaluate(()=>showFifthRoom(JSON.parse(localStorage.getItem('saigononazo-save-v1')).rooms.room05));
   await page.waitForFunction(()=>document.querySelector('#r5Scene')?.classList.contains('has-r5-background'));
   await check(true);assert.deepEqual(errors,[],'No page JavaScript errors');
   await context.close();console.log(spec.name+' dining furniture collection and save validated');
  }finally{await browser.close()}
 }
})().catch(error=>{console.error(error);process.exitCode=1});
