"use strict";
const assert=require("node:assert/strict");
const {chromium}=require(process.env.PLAYWRIGHT_PATH||"playwright");
const fs=require("node:fs");
const path=require("node:path");
const base=process.env.BASE_URL||"http://127.0.0.1:8765";
const screenshots=process.env.ARTIFACT_DIR||"artifacts/rainbow-review";
fs.mkdirSync(screenshots,{recursive:true});

function tokens(values){
 return values.map(v=>v.slice(0,-1)+v.slice(-1));
}
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
 try{
  for(const viewport of [{width:1280,height:720},{width:852,height:393}]){
   const page=await browser.newPage({viewport,reducedMotion:"reduce"});
   const errors=[];page.on("pageerror",error=>errors.push(error.message));
   await page.goto(base,{waitUntil:"load"});
   await page.evaluate(()=>{
    settings.instantText=true;
    showFourthRoom({view:"back",door:true,hanaSleepSeen:true});
    for(let i=0;i<20&&document.querySelector("#roomNextButton");i++)Dialogue.advance();
   });
   const opener=page.locator("#r4P3");
   await opener.click();
   const plates=page.locator(".r4-rainbow-plate");
   assert.equal(await plates.count(),7,"Exactly seven physical plates");
   assert.equal(await page.locator(".r4-rainbow button[data-d]").count(),0,"No old up/down button interface");
   const order=()=>plates.evaluateAll(nodes=>nodes.map(n=>n.querySelector(".r4-rainbow-color").textContent+n.querySelector(".r4-rainbow-letter").textContent));
   const initial=await order();
   assert.deepEqual(initial,["青O","赤M","紫S","黄T","藍R","橙E","緑E"]);
   const frame=await page.locator(".r4-plate-exhibit").boundingBox();
   const rectangles=await plates.evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.left,y:r.top,right:r.right,bottom:r.bottom}}));
   assert(frame.x>=-1&&frame.y>=-1&&frame.x+frame.width<=viewport.width+1&&frame.y+frame.height<=viewport.height+1,
     "Exhibit must fit viewport: "+JSON.stringify({viewport,frame}));
   for(const r of rectangles)assert(r.x>=frame.x&&r.y>=frame.y&&r.right<=frame.x+frame.width+1&&r.bottom<=frame.y+frame.height+1,
     "All colored plates must stay inside rail");
   await page.screenshot({path:path.join(screenshots,"rainbow-before-"+viewport.width+".png")});
   // Pointer interaction drags the first plate into the third slot.
   const source=await plates.nth(0).boundingBox(),destination=await plates.nth(2).boundingBox();
   const center=r=>({x:r.x+r.width/2,y:r.y+r.height/2});
   const a=center(source),b=center(destination);
   await page.mouse.move(a.x,a.y);
   await page.mouse.down();
   await page.mouse.move(b.x,b.y,{steps:12});
   await page.mouse.up();
   assert.deepEqual(await order(),["赤M","紫S","青O","黄T","藍R","橙E","緑E"],"Drag must move the physical plate, not just highlight it");
   assert.equal(await page.locator(".r4-rainbow-plate.is-selected").count(),0,"Pointer drag must not also select an item");
   // Tap/click to select one and place it in a new slot works on mobile and keyboard.
   const goal=["赤M","橙E","黄T","緑E","青O","藍R","紫S"];
   for(const [index,wanted] of goal.entries()){
    const values=await order(),from=values.indexOf(wanted);
    if(from===index)continue;
    await plates.nth(from).click();
    assert.equal(await plates.nth(from).getAttribute("aria-pressed"),"true","Selected plate reports its state");
    await plates.nth(index).click();
    if((await page.locator(".r4-plate-exhibit").count())===0)break;
   }
   assert.equal(await page.evaluate(()=>room4State.meteors),true,"Correct color order triggers original solution");
   assert.deepEqual(await page.evaluate(()=>room4State.rainbow),goal,"Saved order remains correct");
   await page.evaluate(()=>{for(let i=0;i<60&&document.querySelector("#roomNextButton");i++)Dialogue.advance()});
   assert.deepEqual(errors,[],"Rainbow UI should not generate JavaScript errors");
   await page.close();
  }
  console.log("PASS: Room 04 physical rainbow, drag/tap, colors, solution and landscape layout");
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
