const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const url=process.env.PUBLIC_BASE_URL||'https://bqlohakuto.github.io/saigononazo/';
const version=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8').match(/room3.js\?v=([^"']+)/)[1];
async function finishDialogue(page){
 for(let i=0;i<240&&await page.locator('.room-dialog-overlay').count();i++){
  await page.locator('#roomNextButton').click({force:true});await page.waitForTimeout(15);
 }
 assert.equal(await page.locator('.room-dialog-overlay').count(),0,'Dialogue finishes');
}
(async()=>{
 for(const spec of [{name:'desktop',engine:chromium,viewport:{width:1366,height:768},channel:'chrome'},{name:'landscape-webkit',engine:webkit,viewport:{width:852,height:393}}]){
 const browser=await spec.engine.launch({headless:true,...(spec.channel?{channel:spec.channel}:{})});
 try{
 const context=await browser.newContext({viewport:spec.viewport,isMobile:!spec.channel,hasTouch:!spec.channel,reducedMotion:'reduce'});
 await context.addInitScript(()=>localStorage.setItem('saigononazo-help-seen','1'));
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 let deployed=false;
 for(let retry=0;retry<24;retry++){
 await page.goto(url+'?room3_review='+Date.now());
 if((await page.locator('script[src*="room3.js"]').getAttribute('src')).includes(version)){deployed=true;break}
 await page.waitForTimeout(8000);
 }
 assert(deployed,'Expected deployed revision');
 const dir=path.join('artifacts/room03',spec.name);fs.mkdirSync(dir,{recursive:true});
 await page.evaluate(()=>{settings.instantText=true;showThirdRoom({});});
 for(const view of ['front','right','back','left']){
 assert.equal(await page.locator('.room3-stage').getAttribute('data-view'),view);
 const image=await page.locator('#r3Background').evaluate(async img=>{await img.decode();return [img.naturalWidth,img.naturalHeight]});assert.deepEqual(image,[1672,941]);
 const bounds=await page.locator('.room3-stage').boundingBox();
 for(const b of await page.locator('.room3-object:not([hidden])').all()){
 const r=await b.boundingBox();assert(r.x>=bounds.x-1&&r.y>=bounds.y-1&&r.x+r.width<=bounds.x+bounds.width+1&&r.y+r.height<=bounds.y+bounds.height+1,'Hit targets fit stage');
 }
 if(view==='left'){
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.locator('.room3-sleeping-hana').waitFor({state:'visible'});
 const motion=()=>page.locator('.sleep-body').evaluate(el=>({name:getComputedStyle(el).animationName,transform:getComputedStyle(el).transform}));
 const before=await motion();await page.waitForTimeout(1100);const after=await motion();
 assert.equal(before.name,'hanaSleepBreath');assert.notEqual(before.transform,after.transform,'Breathing changes upper-body transform');
 assert.equal(await page.locator('.room3-sleep-shoes').evaluate(el=>getComputedStyle(el).animationName),'none','Shoes remain still');
 assert.equal(await page.locator('.sleep-head').evaluate(el=>getComputedStyle(el).transform),'none','Head remains on pillow');
 await page.screenshot({path:path.join(dir,'sleeping.png')});
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal((await motion()).name,'none','Reduced motion respected');
 }
 await page.screenshot({path:path.join(dir,view+'.png')});await page.locator('#r3TurnRight').click();
 }
 await page.locator('#r3TurnLeft').click();assert.equal(await page.locator('.room3-stage').getAttribute('data-view'),'left');
 await page.locator('#r3SleepingHana').click();await finishDialogue(page);assert(await page.evaluate(()=>room3State.bedInspected));assert.equal(await page.locator('.room3-sleeping-hana').isVisible(),false,'Hana gets out of bed after existing conversation');
 await page.locator('#r3TurnRight').click();await page.locator('#r3Door').click();await finishDialogue(page);
 await page.locator('#r3TurnRight').click();await page.locator('#r3Desk').click();await finishDialogue(page);
 await page.locator('#r3Phone').click();assert.equal(await page.locator('.room3-chat-message').count(),15);
 const shell=page.locator('.r3-handset'),stream=page.locator('.r3-chat-scroll');
 const phoneBounds=await shell.boundingBox();assert(phoneBounds.height<=spec.viewport.height&&phoneBounds.width<=spec.viewport.width,'Phone fits viewport');
 assert.deepEqual(await page.locator('.room3-chat-message p').allTextContents(),await page.evaluate(()=>ROOM3_CHAT_MESSAGES.map(item=>item.face)),'All original face glyphs remain exact and ordered');
 assert.equal(await page.locator('.r3-text-message').count(),7,'Original opening and ending chat lines remain');
 assert(await page.locator('.room-three').evaluate(el=>el.inert),'Exploration blocked while reading phone');
 await page.screenshot({path:path.join(dir,'smartphone-top.png')});
 await stream.press('End');await page.waitForTimeout(300);
 const scroll=await stream.evaluate(el=>({top:el.scrollTop,height:el.clientHeight,total:el.scrollHeight}));assert(scroll.top>0&&scroll.total>scroll.height,'Conversation scrolls inside LCD');
 assert.deepEqual(await shell.boundingBox(),phoneBounds,'Phone body stays fixed while scrolling');
 await page.screenshot({path:path.join(dir,'smartphone-bottom.png')});
 await page.keyboard.press('Escape');assert.equal(await shell.count(),0,'Escape closes phone');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'r3Phone','Keyboard focus returns to phone');
 assert(await page.evaluate(()=>room3State.chatRead&&room3State.phoneInspected),'Existing investigation state retained');
 await page.locator('#r3Phone').click();await page.locator('.room3-chat-panel .device-close').click();
 await page.locator('#r3TurnRight').click();await page.locator('#r3Shelf').click();await finishDialogue(page);
 await page.locator('#r3Trumpet').click();await finishDialogue(page);
 await page.evaluate(()=>showThirdRoom({...room3State}));assert.equal(await page.locator('.room3-stage').getAttribute('data-view'),'back','Saved view restored');
 await page.locator('#r3TurnLeft').click();await page.locator('#r3Board').click();
 await page.locator('.room3-answer-input').fill('ONAJIMOJINOAIDA');await page.locator('.room3-answer-submit').click();
 assert.equal(await page.locator('.room3-letterboard [role=gridcell]').count(),100);await page.screenshot({path:path.join(dir,'puzzle.png')});
 await page.locator('.room3-final-input').fill('いつもとなりに');await page.locator('.room3-final-submit').click();await finishDialogue(page);
 assert(await page.evaluate(()=>room3State.unlocked&&room3State.memorySeen),'Existing puzzle and memory flow succeeds');
 assert.deepEqual(errors,[]);console.log(spec.name+': all four views, investigation, save and puzzle passed');
 }finally{await browser.close()}
 }
})().catch(e=>{console.error(e);process.exit(1)});
