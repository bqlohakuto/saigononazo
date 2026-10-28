"use strict";
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const base=process.env.PUBLIC_BASE_URL||'https://bqlohakuto.github.io/saigononazo/';
const localChrome=process.env.E04_CHROMIUM_EXECUTABLE;
const cases=[
 {name:'pc-chromium',engine:chromium,viewport:{width:1366,height:768},mobile:false},
 {name:'phone-landscape',engine:localChrome?chromium:webkit,viewport:{width:852,height:393},mobile:true}
];
const art={
 both:'planter-flowers-blue-butterfly.webp',
 flowers:'planter-flowers-only.webp',
 butterfly:'planter-butterfly-only.webp',
 empty:'planter-empty.webp'
};

(async()=>{
 for(const spec of cases){
  const launch=localChrome?{executablePath:localChrome,args:['--no-sandbox']}:spec.mobile?{}:{channel:'chrome'};
  const browser=await spec.engine.launch({headless:true,...launch});
  try{
   const context=await browser.newContext({viewport:spec.viewport,deviceScaleFactor:spec.mobile?2:1,isMobile:spec.mobile,hasTouch:spec.mobile,reducedMotion:'reduce'});
   await context.addInitScript(()=>localStorage.setItem('saigononazo-help-seen','1'));
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   const version=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8').match(/room5\.css\?v=([^"']+)/)?.[1];assert(version);
   for(let retry=0;retry<24;retry++){
    const response=await page.goto(base+'?room05_planter_review='+Date.now(),{waitUntil:'load',timeout:60000});
    if(response?.status()===200&&(await page.locator('link[href*="room5.css"]').first().getAttribute('href'))?.includes(version))break;
    assert(retry<23,'The requested game version has not been deployed');await page.waitForTimeout(6000);
   }
   await page.evaluate(async files=>{
    for(const file of files){const image=new Image();image.src='images/background/room05/overlays/'+file;await image.decode();if(!image.naturalWidth)throw Error('Missing planter artwork: '+file)}
   },Object.values(art));
   const dir=path.join('artifacts','room05','e04',spec.name);fs.mkdirSync(dir,{recursive:true});
   async function start(){
    await page.evaluate(()=>{settings.instantText=true;showFifthRoom({introSeen:true,view:'left'})});
    await page.waitForFunction(()=>document.querySelector('#r5Scene')?.classList.contains('has-r5-background'));
   }
   async function state(owned,expected){
    const planter=page.locator('.r5-decor-planter');await planter.waitFor({state:'visible'});
    assert((await planter.evaluate(el=>getComputedStyle(el).backgroundImage)).includes(expected),'Expected visible planter asset: '+expected);
    for(const id of ['flower','butterfly']){
     const target=page.locator('.r5-target-'+id),collected=owned.includes(id);
     assert.equal(await target.isVisible(),!collected,id+' visibility');
     assert.equal(await target.isEnabled(),!collected,id+' availability');
    }
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('saigononazo-save-v1')).rooms.room05.collected);
    assert.deepEqual([...saved].sort(),[...owned].sort());
   }
   async function collect(id){
    // The existing hitboxes overlap; click the visible subject instead of the
    // shared boundary between their geometric centres.
    const target=page.locator('.r5-target-'+id),box=await target.boundingBox();assert(box);
    await target.click({position:{x:box.width*.55,y:box.height*(id==='butterfly'?.4:.7)}});
    await page.waitForSelector('.room-dialog-overlay');
    await page.evaluate(()=>{for(let i=0;i<100&&document.querySelector('#roomNextButton');i++)document.querySelector('#roomNextButton').click()});
    const reveal=page.locator('.design-pickup-panel');await reveal.waitFor();
    assert((await reveal.locator('.design-pickup-image').getAttribute('src')).endsWith('/'+id+'.webp'));
    await reveal.locator('button').filter({hasText:'閉じる'}).first().click();
   }
   async function reloadSaved(){
    await page.evaluate(()=>showFifthRoom(JSON.parse(localStorage.getItem('saigononazo-save-v1')).rooms.room05));
    await page.waitForFunction(()=>document.querySelector('#r5Scene')?.classList.contains('has-r5-background'));
   }
   for(const [first,second,singleArt,label] of [['butterfly','flower',art.flowers,'flowers-only'],['flower','butterfly',art.butterfly,'butterfly-only']]){
    await start();await state([],art.both);
    if(first==='butterfly')await page.screenshot({path:path.join(dir,'before.png')});
    await collect(first);await state([first],singleArt);
    await reloadSaved();await state([first],singleArt);await page.screenshot({path:path.join(dir,label+'.png')});
    await collect(second);await state([first,second],art.empty);
    await reloadSaved();await state([first,second],art.empty);
    if(first==='butterfly')await page.screenshot({path:path.join(dir,'both-collected.png')});
   }
   assert.deepEqual(errors,[],'No page JavaScript errors');
   await context.close();console.log(spec.name+' E04 acquisition orders, reload and art verified');
  }finally{await browser.close()}
 }
})().catch(error=>{console.error(error);process.exitCode=1});
