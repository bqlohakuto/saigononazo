"use strict";
// A04: verify the actual public keypad on desktop and iPhone landscape.
const {chromium,webkit}=require("playwright");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const base=process.env.PUBLIC_BASE_URL||"https://bqlohakuto.github.io/saigononazo/";
const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
const revision=html.match(/design-ui[.]css[?]v=([^"']+)/)?.[1];
const revisions=[revision,html.match(/late-game[.]js[?]v=([^"']+)/)?.[1]];
if(!revisions[0]||revisions[0]!==revisions[1])throw Error("Keypad CSS/JS revisions disagree");
const specs=[
 {name:"desktop-chromium",browser:chromium,viewport:{width:1366,height:768},mobile:false},
 {name:"iphone-landscape-webkit",browser:webkit,viewport:{width:852,height:393},mobile:true}
];
async function loadLatest(page){
 for(let retry=0;retry<22;retry++){
  const response=await page.goto(base+"?keypad_a04="+Date.now(),{waitUntil:"load",timeout:60000});
  const css=await page.locator('link[href*="design-ui.css"]').getAttribute("href");
  const script=await page.locator('script[src*="late-game.js"]').getAttribute("src");
  if(response?.ok()&&css?.includes(revision)&&script?.includes(revision))return;
  await page.waitForTimeout(7000);
 }
 throw Error("Keypad release "+revision+" is not yet live");
}
const rect=box=>box&&({left:box.x,right:box.x+box.width,top:box.y,bottom:box.y+box.height});
function inside(a,b,tolerance=2){return a.left>=b.left-tolerance&&a.right<=b.right+tolerance&&a.top>=b.top-tolerance&&a.bottom<=b.bottom+tolerance;}
(async()=>{
 for(const spec of specs){
  const browser=await spec.browser.launch({headless:true,...(spec.mobile?{}:{channel:"chrome"})});
  try{
   const context=await browser.newContext({
    viewport:spec.viewport,isMobile:spec.mobile,hasTouch:spec.mobile,deviceScaleFactor:spec.mobile?2:1,reducedMotion:"reduce"
   });
   await context.addInitScript(()=>localStorage.setItem('saigononazo-help-seen','1'));
   const page=await context.newPage();
   page.setDefaultTimeout(12000);
   const errors=[];
   page.on("pageerror",err=>errors.push(err.message));
   await loadLatest(page);
   await page.evaluate(()=>{
    settings.instantText=true;
    showFifthRoom({introSeen:true,boardIntroSeen:true,codeRevealed:true,doorUnlocked:false});
   });
   await page.locator("#r5Keypad").click();
   const panel=page.locator(".r5-keypad-panel"),keys=panel.locator(".r5-keypad-grid button");
   assert.equal(await panel.count(),1,"The keypad modal opens");
   assert.equal(await keys.count(),12,"All ten digits and two actions render");
   const root=rect(await panel.boundingBox()),overlay=rect(await page.locator(".device-overlay.late-overlay").boundingBox());
   assert(root&&overlay&&inside(root,overlay),"The entire keypad is within the game overlay");
   const ids=['.device-close','h2','.r5-keypad-display','.r5-keypad-grid','#r5KeypadFeedback'];
   for(const selector of ids){
    const r=rect(await panel.locator(selector).boundingBox());
    assert(r&&inside(r,root),selector+" must be visible inside the panel");
   }
   const boxes=[];
   for(let i=0;i<12;i++){
    const r=rect(await keys.nth(i).boundingBox());
    assert(r&&inside(r,root),"Key "+i+" visible within the panel");
    for(const existing of boxes){
     const overlaps=r.left<existing.right-1&&r.right>existing.left+1&&r.top<existing.bottom-1&&r.bottom>existing.top+1;
     assert(!overlaps,"Key "+i+" does not overlap another key");
    }
    boxes.push(r);
   }
   const scrolled=await panel.evaluate(el=>({top:el.scrollTop,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight}));
   assert.equal(scrolled.top,0,"Keypad opens without scrolling");
   assert(scrolled.scrollHeight<=scrolled.clientHeight+2,"No content is hidden behind keypad scrolling");
   const dir=path.join(process.env.UI_SCREENSHOT_DIR||"artifacts/room05-keypad",spec.name);
   fs.mkdirSync(dir,{recursive:true});
   await page.screenshot({path:path.join(dir,"keypad-open.png")});
   for(const digit of ["1","2","3","4"])await keys.locator('[data-digit="'+digit+'"]').count(); // check subsequent input by real taps
   for(const digit of ["1","2","3","4"])await panel.locator('[data-digit="'+digit+'"]').click();
   assert.equal(await page.locator("#r5KeypadDisplay").textContent(),"1234");
   await panel.locator('[data-key="enter"]').click();
   assert.match(await panel.locator("#r5KeypadFeedback").textContent(),/違う/);
   assert.equal(await page.locator("#r5KeypadDisplay").textContent(),"----");
   await page.screenshot({path:path.join(dir,"keypad-invalid.png")});
   const after=rect(await panel.locator('[data-key="enter"]').boundingBox());
   assert(inside(after,root),"Submit remains fully visible after wrong answer");
   for(const digit of ["8","1","9","4"])await panel.locator('[data-digit="'+digit+'"]').click();
   await panel.locator('[data-key="enter"]').click();
   assert.equal(await panel.count(),0,"Correct answer dismisses keypad");
   assert.equal(await page.evaluate(()=>room5State.doorUnlocked),true,"Correct answer unlocks the door");
   assert.deepEqual(errors,[],"No browser JS errors");
   await context.close();
  }finally{await browser.close()}
 }
 console.log("PASS: Room 5 keypad layout and input on desktop and mobile landscape");
})().catch(err=>{console.error(err);process.exitCode=1});
