// Take non-destructive screenshots of the published second room.
// This is a visual review only; the puzzle, save data, and scenario are never written to the public repo.
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const url=process.env.PUBLIC_BASE_URL||'https://bqlohakuto.github.io/saigononazo/';
const output=process.env.UI_SCREENSHOT_DIR||'artifacts/room02';
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 for(const view of [
  {name:'desktop',viewport:{width:1366,height:768},isMobile:false},
  {name:'landscape-mobile',viewport:{width:852,height:393},isMobile:true}
 ]){
  const context=await browser.newContext({viewport:view.viewport,isMobile:view.isMobile,hasTouch:view.isMobile,deviceScaleFactor:2,reducedMotion:'reduce'});
  await context.addInitScript(()=>localStorage.setItem('saigononazo-help-seen','1'));
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'load',timeout:60000});
  const dir=path.join(output,view.name);fs.mkdirSync(dir,{recursive:true});
  await page.evaluate(()=>{settings.instantText=true;showSecondRoom({doorInspected:true,deskInspected:true,sheetFound:true});});
  await page.waitForTimeout(500);
  await page.screenshot({path:path.join(dir,'01-room02.png')});
  const measurements=await page.evaluate(()=>{
   const q=s=>{const n=document.querySelector(s);if(!n)return null;const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,style:getComputedStyle(n).backgroundImage};};
   return {game:q('#game'),stage:q('.room2-stage'),door:q('.room2-door-art'),desk:q('.room2-desk-art'),window:q('.room2-window-light'),hana:q('#r2Hana'),blocks:q('#r2Blocks'),blockButtonDisabled:document.querySelector('#r2Blocks')?.disabled};
  });
  await page.evaluate(()=>showSecondRoomPuzzle());
  await page.waitForTimeout(400);
  await page.screenshot({path:path.join(dir,'02-room02-puzzle.png')});
  const puzzle=await page.locator('.room2-puzzle').boundingBox();
  console.log(JSON.stringify({name:view.name,measurements,puzzle,errors}));
  await context.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});