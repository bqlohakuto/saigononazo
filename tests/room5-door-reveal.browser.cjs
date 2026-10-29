'use strict';
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const base=process.env.PUBLIC_BASE_URL||'https://bqlohakuto.github.io/saigononazo/';
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const revision=html.match(/late-game[.]js[?]v=([^"']+)/)?.[1];
const specs=[
 {name:'pc-chromium',engine:chromium,viewport:{width:1366,height:768},mobile:false,motion:'no-preference'},
 {name:'phone-landscape-webkit',engine:webkit,viewport:{width:852,height:393},mobile:true,motion:'reduce'}
];
const partial={introSeen:true,boardIntroSeen:true,view:'front',
 collected:['mirror','fish','butterfly','flower','squid','chair','cannon'],
 placed:{mirror:'面',fish:'尾',butterfly:'頭',flower:'輪',squid:'杯',chair:'脚'}};
const within=(a,b)=>a.x>=b.x-1&&a.y>=b.y-1&&a.x+a.width<=b.x+b.width+1&&a.y+a.height<=b.y+b.height+1;
async function loadLatest(page){
 for(let n=0;n<24;n++){
  const response=await page.goto(base+'?room5_door_e09='+Date.now(),{waitUntil:'load',timeout:60000});
  const script=await page.locator('script[src*="late-game.js"]').getAttribute('src');
  if(response?.ok()&&script?.includes(revision))return;
  await page.waitForTimeout(6000);
 }
 throw Error('Published release is not yet '+revision);
}
async function startPartial(page){
 await page.evaluate(state=>{settings.instantText=true;showFifthRoom(state);},partial);
 await page.waitForFunction(()=>document.querySelector('#r5Scene')?.classList.contains('has-r5-background'));
}
async function finishBoard(page){
 await page.locator('#r5Board').click();
 await page.locator('[data-tile="cannon"]').click();
 await page.locator('[data-counter="門"]').click();
 assert.equal(await page.evaluate(()=>room5State.codeRevealed),true);
}
(async()=>{
 assert(revision,'Cache revision is present');
 for(const spec of specs){
  const browser=await spec.engine.launch({headless:true,...(spec.mobile?{}:{channel:'chrome'})});
  try{
   const context=await browser.newContext({viewport:spec.viewport,isMobile:spec.mobile,hasTouch:spec.mobile,deviceScaleFactor:spec.mobile?2:1,reducedMotion:spec.motion});
   await context.addInitScript(()=>localStorage.setItem('saigononazo-help-seen','1'));
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await loadLatest(page);await startPartial(page);
   const scene=page.locator('#r5Scene'),cover=page.locator('.r5-wall-keypad-cover');
   const sceneBox=await scene.boundingBox(),coverBox=await cover.boundingBox();
   assert.equal(await cover.isVisible(),true,'The keypad baked into the wall image is covered');
   assert(within({x:sceneBox.x+sceneBox.width*.617,y:sceneBox.y+sceneBox.height*.337,width:sceneBox.width*.029,height:sceneBox.height*.087},coverBox),'The wall cover fully includes the original keypad and its shadow');
   assert.equal(await page.locator('#r5Keypad,.r5-door-keypad-art').count(),0,'No keypad appears or can be used before completion');
   const out=path.join('artifacts','room05-door',spec.name);fs.mkdirSync(out,{recursive:true});
   await page.screenshot({path:path.join(out,'01-before.png')});

   await finishBoard(page);
   await page.locator('#roomNextButton').waitFor();
   assert.equal(await page.locator('.r5-board-overlay').count(),0,'Success uses the ordinary conversation window');
   for(let i=0;i<30&&(await page.locator('#roomMessage').textContent())!=='8194';i++)await page.locator('#roomNextButton').click();
   assert.equal(await page.locator('#roomMessage').textContent(),'8194');
   await page.screenshot({path:path.join(out,'02-code.png')});
   for(let i=0;i<20&&await page.locator('.r5-door-reveal').count()===0;i++)await page.locator('#roomNextButton').click();
   const effect=page.locator('.r5-door-reveal');await effect.waitFor();
   assert.match(await page.locator('#roomMessage').textContent(),/正面の扉へ細い光/);
   assert.equal(await page.locator('.r5-door-reveal-light path').count(),1);
   await page.screenshot({path:path.join(out,'03-door-reveal.png')});
   for(let i=0;i<30&&await page.locator('#roomNextButton').count();i++)await page.locator('#roomNextButton').click();
   await effect.waitFor({state:'detached'});
   const art=page.locator('.r5-door-keypad-art'),target=page.locator('#r5Keypad'),door=page.locator('#r5Door');
   assert.equal(await art.isVisible(),true);
   assert.equal(await target.isEnabled(),true);
   assert(within(await art.boundingBox(),await door.boundingBox()),'The approved keypad artwork is on the door');
   assert(within(await art.boundingBox(),await target.boundingBox()),'The tap target covers the keypad artwork');
   assert.match(await art.evaluate(el=>getComputedStyle(el).backgroundImage),/front[.]webp/,'The existing keypad artwork is reused');
   await page.screenshot({path:path.join(out,'04-after.png')});

   // A save made after completion restores the code and the door keypad.
   const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('saigononazo-save-v1')).rooms.room05);
   await page.reload({waitUntil:'load'});await page.evaluate(s=>showFifthRoom(s),saved);
   await page.waitForFunction(()=>document.querySelector('#r5Scene')?.classList.contains('has-r5-background'));
   assert.equal(await page.locator('.r5-door-keypad-art').isVisible(),true);
   await page.locator('#r5Keypad').click();
   for(const digit of ['8','1','9','4'])await page.locator('[data-digit="'+digit+'"]').click();
   await page.locator('[data-key="enter"]').click();
   assert.equal(await page.evaluate(()=>room5State.doorUnlocked),true,'8194 still unlocks the door');

   assert.deepEqual(errors,[]);
   await context.close();console.log('PASS '+spec.name+': hidden keypad, 8194, visible door reveal, early close and save/load');
  }finally{await browser.close();}
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
