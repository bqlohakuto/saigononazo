// Issue #25: piano confirmation must stay visible while the keys and input are used.
// Checks the published layout in desktop Chromium and iPhone landscape WebKit.
"use strict";
const assert=require("node:assert/strict");
const {chromium,webkit}=require("playwright");
const fs=require("node:fs");
const path=require("node:path");
const base=process.env.PUBLIC_BASE_URL||"https://bqlohakuto.github.io/saigononazo/";
const output=process.env.UI_SCREENSHOT_DIR||"artifacts/room01-piano";
const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
const revision=html.match(/design-ui[.]css[?]v=([^"']+)/)?.[1];
if(!revision)throw Error("Cannot find the piano CSS cache revision");

const configs=[
  {name:"desktop-chromium",engine:chromium,viewport:{width:1366,height:768},mobile:false},
  {name:"iphone-landscape-webkit",engine:webkit,viewport:{width:852,height:393},mobile:true}
];
async function openLatest(page){
  for(let attempt=0;attempt<20;attempt++){
    const response=await page.goto(base+"?piano_review="+Date.now(),{waitUntil:"load",timeout:60000});
    const href=await page.locator('link[href*="design-ui.css"]').getAttribute("href");
    if(response?.status()===200&&href?.includes(revision))return;
    await page.waitForTimeout(7500);
  }
  throw Error("Published piano stylesheet "+revision+" was not found");
}
function inside(inner,outer){
  return inner&&outer&&inner.left>=outer.left-2&&inner.right<=outer.right+2&&inner.top>=outer.top-2&&inner.bottom<=outer.bottom+2;
}
(async()=>{
 for(const spec of configs){
  const browser=await spec.engine.launch({headless:true,...(!spec.mobile?{channel:"chrome"}:{})});
  try{
   const context=await browser.newContext({
     viewport:spec.viewport,isMobile:spec.mobile,hasTouch:spec.mobile,deviceScaleFactor:spec.mobile?2:1,reducedMotion:"reduce"
   });
   const page=await context.newPage();
   page.setDefaultTimeout(20000);
   const errors=[];page.on("pageerror",e=>errors.push(e.message));
   await openLatest(page);
   await page.evaluate(()=>{
     settings.instantText=true;
     showFirstRoom({introductionSeen:true,hanaIntroduced:true,questionSeen:true,viewedWall:"left"});
     showPianoScreen();
   });
   const dir=path.join(output,spec.name);
   fs.mkdirSync(dir,{recursive:true});
   assert.equal(await page.locator(".room1-piano-panel").count(),1);
   assert.equal(await page.locator(".piano-note-key").count(),7);
   assert.equal(await page.locator("#playMelodyButton").count(),1);
   const bounds=await page.evaluate(()=>{
     const box=sel=>{
       const el=document.querySelector(sel),r=el.getBoundingClientRect();
       return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,height:r.height};
     };
     const panel=document.querySelector(".room1-piano-panel");
     return {
       panel:box(".room1-piano-panel"),
       button:box("#playMelodyButton"),
       footer:box(".piano-submit-bar"),
       keyboard:box(".piano-keyboard"),
       input:box("#melodyInput"),
       panelScroll:panel.scrollTop,
       pinned:getComputedStyle(panel).overflowY==="hidden"
     };
   });
   assert(bounds.pinned,"The outer piano panel does not scroll");
   assert(inside(bounds.button,bounds.panel),"The action is wholly visible inside the piano panel");
   assert(inside(bounds.footer,bounds.panel),"The button footer stays within the piano");
   assert(inside(bounds.keyboard,bounds.panel),"The keyboard stays in the visible piano");
   assert(inside(bounds.input,bounds.panel),"The melody input is visible without scrolling");
   assert.equal(bounds.panelScroll,0,"The player does not have to scroll initially");
   await page.screenshot({path:path.join(dir,"01-piano-before-notes.png")});
   for(const note of ["ド","ド","ド","ド","ド","ド","ド","ド"]){
      await page.locator('.piano-note-key[data-note="'+note+'"]').click();
   }
   assert.equal(await page.locator("#melodyInput").inputValue(),"ド".repeat(8));
   const first=await page.locator("#playMelodyButton").boundingBox();
   // The game uses a 960x540 logical canvas scaled on mobile devices.
   const canvasScale=await page.locator("#game").evaluate(el=>el.getBoundingClientRect().width/el.offsetWidth);
   assert(first&&first.width>50*canvasScale&&first.height>=40*canvasScale-2,
     "The answer button remains visible after eight notes at the device scale");
   // Mouse/touch by absolute coordinates, not locator.click() which can auto-scroll.
   if(spec.mobile) await page.touchscreen.tap(first.x+first.width/2,first.y+first.height/2);
   else await page.mouse.click(first.x+first.width/2,first.y+first.height/2);
   await page.locator(".piano-result").waitFor({state:"visible"});
   assert((await page.locator(".piano-result").textContent()).trim().length>0,"Wrong answer shows feedback");
   assert.equal(await page.locator("#melodyInput").inputValue(),"ド".repeat(8),"Wrong answer preserves entered notes");
   const after=await page.evaluate(()=>{
     const parent=document.querySelector(".room1-piano-panel");
     const x=document.querySelector("#playMelodyButton").getBoundingClientRect(),p=parent.getBoundingClientRect();
     return {button:{left:x.left,right:x.right,top:x.top,bottom:x.bottom},panel:{left:p.left,right:p.right,top:p.top,bottom:p.bottom},scroll:parent.scrollTop};
   });
   assert(inside(after.button,after.panel),"The answer button remains visible after feedback");
   assert.equal(after.scroll,0,"Submitting requires no panel scrolling");
   await page.screenshot({path:path.join(dir,"02-piano-after-answer.png")});
   assert.deepEqual(errors,[],"No uncaught browser errors");
   await context.close();
  }finally{await browser.close();}
 }
 console.log("Room 1 piano answer button visible on desktop and mobile landscape.");
})().catch(e=>{console.error(e);process.exitCode=1;});
