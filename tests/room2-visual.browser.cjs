// Verify the adopted Room 2 background on the deployed website, without changing progress data.
// Run with Playwright Chromium and WebKit installed.
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const url=process.env.PUBLIC_BASE_URL||'https://bqlohakuto.github.io/saigononazo/';
const output=process.env.UI_SCREENSHOT_DIR||'artifacts/room02';
const expectedVersion=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8').match(/room2[.]js[?]v=([^"']+)/)?.[1];
if(!expectedVersion)throw new Error('Cannot find Room 2 JS cache revision');

const views=[
 {name:'desktop-chromium',engine:chromium,viewport:{width:1366,height:768},isMobile:false},
 {name:'landscape-webkit',engine:webkit,viewport:{width:852,height:393},isMobile:true}
];

async function readyPage(page){
 for(let retry=0;retry<24;retry++){
  const response=await page.goto(url+'?room02_review='+Date.now(),{waitUntil:'load',timeout:60000});
  if(response.status()===200){
   const src=await page.locator('script[src*="room2.js"]').getAttribute('src');
   if(src?.includes(expectedVersion))return;
  }
  await page.waitForTimeout(8000);
 }
 throw new Error('GitHub Pages has not deployed Room 2 revision '+expectedVersion);
}

function within(inner,outer,tolerance=3){
 return inner&&outer&&inner.x>=outer.x-tolerance&&inner.y>=outer.y-tolerance&&
  inner.x+inner.width<=outer.x+outer.width+tolerance&&
  inner.y+inner.height<=outer.y+outer.height+tolerance;
}
(async()=>{
 for(const spec of views){
  const browser=await spec.engine.launch({headless:true,...(spec.name==='desktop-chromium'?{channel:'chrome'}:{})});
  try{
   const context=await browser.newContext({viewport:spec.viewport,isMobile:spec.isMobile,hasTouch:spec.isMobile,deviceScaleFactor:spec.isMobile?2:1,reducedMotion:'reduce'});
   await context.addInitScript(()=>localStorage.setItem('saigononazo-help-seen','1'));
   const page=await context.newPage();page.setDefaultTimeout(12000);
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await readyPage(page);
   const dir=path.join(output,spec.name);fs.mkdirSync(dir,{recursive:true});
   await page.evaluate(()=>{settings.instantText=true;showSecondRoom({doorInspected:true,deskInspected:true,sheetFound:true});});
   const image=await page.locator('.room2-background-art').evaluate(async img=>{
    await img.decode();
    return {url:img.currentSrc,width:img.naturalWidth,height:img.naturalHeight,complete:img.complete};
   });
   const layering=await page.evaluate(async()=>{
     const bg=document.querySelector('.room2-background-art');
     const fg=document.querySelector('.room2-desk-foreground-art');
     await Promise.all([bg.decode(),fg.decode()]);
     const alpha=(img,x,y)=>{
       const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
       const context=canvas.getContext('2d',{willReadFrequently:true});
       context.drawImage(img,0,0);
       return context.getImageData(x,y,1,1).data[3];
     };
     return {
       bg:{url:bg.currentSrc,width:bg.naturalWidth,height:bg.naturalHeight,deskAlpha:alpha(bg,830,750),wallAlpha:alpha(bg,830,420)},
       fg:{url:fg.currentSrc,width:fg.naturalWidth,height:fg.naturalHeight,deskAlpha:alpha(fg,830,750),wallAlpha:alpha(fg,830,420)},
       z:{bg:+getComputedStyle(bg).zIndex,hana:+getComputedStyle(document.querySelector('#r2Hana')).zIndex,fg:+getComputedStyle(fg).zIndex,blocks:+getComputedStyle(document.querySelector('#r2Blocks')).zIndex,desk:+getComputedStyle(document.querySelector('#r2Desk')).zIndex},
       pointerEvents:getComputedStyle(fg).pointerEvents,
       marginAlpha:[[426,595],[500,600],[700,607],[950,607],[1250,640],[1400,750],[1600,650]].map(([x,y])=>alpha(fg,x,y))
     };
   });
   assert.deepEqual([layering.bg.width,layering.bg.height,layering.fg.width,layering.fg.height],[1672,941,1672,941],'Lossless layers have original dimensions');
   assert.deepEqual([layering.bg.deskAlpha,layering.fg.deskAlpha,layering.bg.wallAlpha,layering.fg.wallAlpha],[0,255,255,0],'Desk image has independent transparent alpha mask');
   assert(layering.z.bg<layering.z.hana&&layering.z.hana<layering.z.fg,'Hana visually behind the tabletop');
   assert(layering.z.fg<layering.z.blocks&&layering.z.fg<layering.z.desk,'Interactive desk and puzzle remain above artwork');
   assert.equal(layering.pointerEvents,'none','Foreground never intercepts taps');
   assert.deepEqual(layering.marginAlpha,[0,0,0,0,0,0,0],'No wall or gray strips in foreground around trays and desk');
   for(const layer of [layering.bg,layering.fg]){
     const response=await page.request.get(layer.url,{timeout:20000});
     assert.equal(response.status(),200,'Art layer should be publicly accessible');
   }
   assert.equal(image.width,1672,'Approved image width');
   assert.equal(image.height,941,'Approved image height');
   assert(image.complete);
   const backgroundRequest=await page.request.get(image.url,{timeout:20000});
   assert.equal(backgroundRequest.status(),200,'Adopted image HTTP 200');
   assert.equal(await page.locator('.room2-window-light,.room2-door-art,.room2-desk-art').count(),0,'No old drawn assets over the accepted image');
   const bounds=await page.evaluate(()=>{
    const rect=selector=>{const e=document.querySelector(selector);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
    return {stage:rect('.room2-stage'),image:rect('.room2-background-art'),door:rect('#r2Door'),desk:rect('#r2Desk'),blocks:rect('#r2Blocks'),hana:rect('#r2Hana'),blocksDisabled:document.getElementById('r2Blocks')?.disabled};
   });
   assert(within(bounds.image,bounds.stage),'Background image fits in stage');
   for(const label of ['door','desk','blocks','hana'])assert(within(bounds[label],bounds.stage),label+' hit target must fit stage');
   assert.equal(bounds.blocksDisabled,false,'Puzzle accessible after desk inspection');
   // The approved reference positions Hana left of the door, just behind the red tiles.
   // Use normalized stage geometry so the same artwork works on PC and landscape phones.
   const hanaPlacement=await page.evaluate(()=>{
     const stage=document.querySelector('.room2-stage').getBoundingClientRect();
     const actor=document.querySelector('#r2Hana');
     const rect=actor.getBoundingClientRect();
     const sprite=getComputedStyle(actor,'::before');
     return {
       centerX:(rect.x+rect.width/2-stage.x)/stage.width,
       top:(rect.y-stage.y)/stage.height,
       spriteWidth:parseFloat(sprite.width)/stage.width,
       spriteHeight:parseFloat(sprite.height)/stage.width
     };
   });
   assert(Math.abs(hanaPlacement.centerX-.285)<.015,'Hana should stand left of the door in the reference position');
   assert(Math.abs(hanaPlacement.top-.35)<.015,'Hana should be at the reference height behind the red tray');
   assert(Math.abs(hanaPlacement.spriteWidth-.215)<.025,'Hana should have the approved world sprite size');
   assert(Math.abs(hanaPlacement.spriteHeight-.336)<.03,'Hana should preserve the reference body proportions');

   await page.screenshot({path:path.join(dir,'01-room02-approved.png')});
   await page.locator('#r2Blocks').click({timeout:8000});
   await page.locator('.room2-puzzle').waitFor();
   assert.equal(await page.locator('.room2-answer-slot').count(),5,'Exactly five answer slots');
   assert.equal(await page.locator('.room2-palette-token').count(),10,'Five red and five blue symbols');
   for(const color of ['赤','青'])assert.equal(await page.locator('.room2-palette-token[data-color="'+color+'"]').count(),5);
   for(const color of ['赤','青'])assert.deepEqual(await page.locator('.room2-palette-token[data-color="'+color+'"] i').allTextContents(),['〇','△','□','×','＋'],'Palette matches the adopted desk artwork from left to right');
   await page.screenshot({path:path.join(dir,'02-room02-puzzle.png')});
   const boardVisual=await page.locator('.room2-puzzle').evaluate(panel=>{
    const tile=panel.querySelector('.room2-palette-token i');
    return {boardBackground:getComputedStyle(panel).backgroundImage,tileShadow:getComputedStyle(tile).boxShadow};
   });
   assert(boardVisual.boardBackground.includes('gradient'),'Puzzle has physical wooden board styling');
   assert.notEqual(boardVisual.tileShadow,'none','Blocks have raised tactile shadow');
   assert.equal(await page.locator('.room2-board-help summary').count(),1,'Rules are available without covering the board');
   assert.equal(await page.locator('.room2-board-help summary').textContent(),'？','Inline instructions are reduced to a help icon');
   assert.equal(await page.locator('.room2-wells-label,.room2-tray-label').count(),0,'No explanatory labels over the slots or tray');
   assert.equal(await page.locator('.room2-palette-token small').count(),0,'Colors are conveyed by blocks rather than repeated labels');
   assert.equal(await page.locator('.room2-answer-slot span').count(),0,'Empty slots look like physical wells');
   assert.equal(await page.locator('.room2-feedback').evaluate(node=>getComputedStyle(node).display),'none','Blank notification panel must be hidden');
   assert.equal(await page.locator('.room2-board-help').evaluate(node=>node.open),false,'Help starts closed');
   await page.locator('.room2-board-help summary').click();
   assert.equal(await page.locator('.room2-board-help').evaluate(node=>node.open),true,'Instructions can be revealed if requested');
   await page.locator('.room2-board-help summary').click();
   assert.equal(await page.locator('.room2-board-help').evaluate(node=>node.open),false,'Help can be tucked away again');
   await page.locator('.room2-palette-token').first().click();
   assert.equal(await page.locator('.room2-answer-slot i').count(),1,'Selecting token fills a single answer slot');
   assert.equal(await page.locator('.room2-answer-slot.is-filled').count(),1,'Selected block is inserted into a slot');
   await page.screenshot({path:path.join(dir,'03-room02-block-fitted.png')});

   // Make the first guess certainly wrong to observe automatic judge dialogue.
   await page.evaluate(()=>{room2State.answer=ROOM2_SYMBOLS.map(symbol=>({symbol,color:'青'}));});
   for(let i=1;i<5;i++)await page.locator('.room2-palette-token[data-color="赤"]').nth(i).click();
   assert.equal(await page.locator('.room2-answer-slot.is-filled').count(),5);
   await page.locator('.room2-submit').click();
   await page.locator('.room2-reaction:not([hidden])').waitFor({state:'visible'});
   assert.equal(await page.locator('.room2-reaction-next').count(),0,'No manual next button');
   assert.equal(await page.locator('.room2-reaction-skip').count(),1,'Optional skip remains available');
   await page.screenshot({path:path.join(dir,'04-room02-auto-dialogue.png')});
   await page.locator('.room2-reaction').waitFor({state:'hidden',timeout:10000});
   assert.equal(await page.locator('.room2-answer-slot i').count(),0,'Next attempt is ready after autoplay');
   assert.equal(await page.locator('.room2-history-row').count(),1,'The result remains in the ledger');
   assert.equal(await page.locator('.room2-submit').isDisabled(),true,'Submit awaits all five blocks');
   assert.deepEqual(errors,[],'No JavaScript runtime errors');
   console.log(JSON.stringify({case:spec.name,status:'PASS',image,layering,stage:bounds.stage,hotspots:{door:bounds.door,desk:bounds.desk,blocks:bounds.blocks,hana:bounds.hana},hanaPlacement,palette:10,slots:5,errors}));
   await context.close();
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});