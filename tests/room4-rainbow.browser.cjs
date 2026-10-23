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
   // The first-run guide is a separate modal; test the puzzle without covering it.
   await page.addInitScript(()=>localStorage.setItem("saigononazo-help-seen","1"));
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
   const order=()=>plates.evaluateAll(nodes=>nodes.map(n=>n.dataset.plate));
   assert.equal(await page.locator(".r4-rainbow-color").count(),0,"Color is shown by the plate, not spelled out");
   assert((await plates.nth(0).evaluate(el=>parseFloat(getComputedStyle(el.querySelector(".r4-rainbow-letter")).fontWeight)))>=800,"Letters use heavy type");
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
   assert.equal(await page.locator(".r4-rainbow-plate").count(),7,"Completed color arrangement remains visible after success");
   assert.equal(await page.locator(".r4-plate-overlay.is-solved").count(),1,"The solved exhibit stays open before the light-up effect");
   assert.equal(await page.locator(".room-dialog-overlay").count(),0,"Award dialogue must not replace the successful board immediately");
   await page.screenshot({path:path.join(screenshots,"rainbow-completed-"+viewport.width+".png")});
   const solvedAt=Date.now();
   await page.locator(".r4-plate-overlay.is-revealing").waitFor({timeout:2500});
   assert.equal(await page.locator(".r4-rainbow-plate").count(),7,"All seven cards remain visible through the victory glow");
   await page.locator(".r4-plate-overlay").waitFor({state:"detached",timeout:6000});
   assert(Date.now()-solvedAt>=2900,"Glowing rainbow must remain visible for several seconds after settling");
   await page.locator(".room-dialog-overlay").waitFor({timeout:2500});
   assert(await page.evaluate(()=>GameLog?.list?.().some(entry=>/METEORS/.test(entry.text||""))||!!document.querySelector(".room-dialog-overlay")),"Original completion dialogue starts after animation");
   await page.evaluate(()=>{for(let i=0;i<60&&document.querySelector("#roomNextButton");i++)Dialogue.advance()});
   const popup=page.locator('.design-overlay .design-panel[aria-label="入手"]');
   await popup.waitFor({timeout:2500});
   const glass=popup.locator('img.design-pickup-image');
   assert.equal(await glass.count(),1,"Acquisition shows a real glass pane image");
   assert.equal(await glass.getAttribute('src'),'images/exhibits/room04/virgo-panels/virgo-panel-03.svg',"Rainbow puzzle awards the correct glass pane");
   assert(await glass.evaluate(async img=>{await img.decode();return img.naturalWidth>0}),"Glass image must decode");
   assert.equal(await popup.getByText(/現在.*枚|[0-9]+\s*\/\s*5/).count(),0,"No acquisition tally in image popup");
   await page.screenshot({path:path.join(screenshots,'glass-awarded-'+viewport.width+'.png')});
   await popup.getByRole('button',{name:'受け取る'}).click();
   assert.deepEqual(errors,[],"Rainbow UI should not generate JavaScript errors");
   await page.close();
  }
  console.log("PASS: Room 04 physical rainbow, drag/tap, colors, solution and landscape layout");
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
