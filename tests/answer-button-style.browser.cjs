"use strict";
const {chromium,webkit}=require("playwright");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const base=process.env.PUBLIC_BASE_URL||"https://bqlohakuto.github.io/saigononazo/";
const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
const revision=html.match(/design-ui[.]css[?]v=([^"']+)/)?.[1];
if(!revision)throw Error("No design CSS cache revision in index.html");
const cases=[
 {name:"desktop-chrome",browser:chromium,mobile:false,viewport:{width:1366,height:768}},
 {name:"iphone-landscape-webkit",browser:webkit,mobile:true,viewport:{width:852,height:393}}
];
(async()=>{
 for(const spec of cases){
  const browser=await spec.browser.launch({headless:true,...(spec.mobile?{}:{channel:"chrome"})});
  try{
   const context=await browser.newContext({viewport:spec.viewport,hasTouch:spec.mobile,isMobile:spec.mobile,deviceScaleFactor:spec.mobile?2:1,reducedMotion:"reduce"});
   const page=await context.newPage();
   page.setDefaultTimeout(12000);
   for(let i=0;i<20;i++){
    const response=await page.goto(base+"?answer_review="+Date.now(),{waitUntil:"load",timeout:60000});
    const published=await page.locator('link[href*="design-ui.css"]').getAttribute("href");
    if(response?.ok()&&published?.includes(revision))break;
    if(i===19)throw Error("Not published yet: "+revision);
    await page.waitForTimeout(7000);
   }
   const styles=await page.evaluate(()=>{
    const game=document.querySelector("#game");
    const stage=document.createElement("div");
    stage.style.cssText="position:absolute;inset:10px;z-index:200;display:flex;align-items:center;justify-content:space-around;flex-wrap:wrap;gap:12px;padding:14px;background:#f8f1e2";
    stage.innerHTML=`
      <section class="room1-piano-panel"><button type="button" id="playMelodyButton">演奏する</button></section>
      <section class="r4-mini"><button type="button" class="r4-answer">解答</button></section>
      <section class="r4-mini r4-color-exhibit"><button type="button" class="r4-answer">解答</button></section>
      <section class="r8-puzzle"><button type="button" id="r8Submit">答える</button></section>
      <section class="r5-keypad-panel"><div class="r5-keypad-grid"><button type="button" data-key="enter">決定</button></div></section>
      <section><button type="button" class="design-submit">解答</button></section>
      <section><button type="button" class="room3-answer-submit">解答</button></section>
      <section><button type="button" class="late-sub-action" data-ordinary>その他</button></section>
      <section class="room2-puzzle room2-immersive-board"><div class="room2-wood-workbench"><button type="button" class="room2-submit room2-physical-lever">レバー</button></div></section>`;
    game.appendChild(stage);
    const values=[...stage.querySelectorAll("button")].map(button=>{
      const c=getComputedStyle(button);
      return {name:button.id||button.className||button.dataset.key||"enter",color:c.color,border:c.borderTopColor,background:c.backgroundImage,opacity:c.opacity};
    });
    return values;
   });
   const expected=["playMelodyButton","r4-answer","r4-answer","r8Submit","","design-submit","room3-answer-submit"];
   assert.equal(styles.length,9,JSON.stringify(styles));
   for(let i=0;i<7;i++){
    const item=styles[i];
    assert.equal(item.color,"rgb(49, 35, 20)",spec.name+" "+expected[i]+" readable text");
    assert.equal(item.border,"rgb(136, 96, 45)",spec.name+" "+expected[i]+" visible border");
    assert.match(item.background,/linear-gradient/,spec.name+" "+expected[i]+" highlighted fill");
    assert.match(item.background,/255, 228, 172/,spec.name+" "+expected[i]+" brighter gold face");
   }
   assert.doesNotMatch(styles[7].background,/255, 228, 172/,"Ordinary action has not become an answer button");
   assert.equal(styles[8].color,"rgba(0, 0, 0, 0)","Room 2 physical lever keeps its unique appearance");
   const output=process.env.UI_SCREENSHOT_DIR||"artifacts/answer-buttons";
   fs.mkdirSync(output,{recursive:true});
   await page.screenshot({path:path.join(output,spec.name+".png")});
   console.log("PASS "+spec.name+": answer buttons share gold fill; ordinary and physical lever unchanged");
   await context.close();
  }finally{await browser.close()}
 }
})().catch(error=>{console.error(error);process.exitCode=1});
