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
 await page.evaluate(()=>{settings.instantText=true;showThirdRoom();});
 assert.equal(await page.locator('.room3-stage').getAttribute('data-view'),'front','C01: entry starts facing the doorway');
 const firstNarration=await page.locator('.room-dialog .message').textContent();
 assert.equal(firstNarration,'視界が開ける。','C01: opening sentence appears first');
 await page.locator('#roomNextButton').click({force:true});
 const doorwayNarration=await page.locator('.room-dialog .message').textContent();
 assert.match(doorwayNarration,/正面には、これまでと同じ扉がある。/,'C01: next page describes the current doorway');
 assert.doesNotMatch(firstNarration+doorwayNarration,/ベッド|机|棚|トランペット/,'C01: first view does not mention off-screen props');
 await page.screenshot({path:path.join(dir,'entry-dialogue.png')});
 await page.evaluate(()=>showThirdRoom({}));
 for(const view of ['front','right','back','left']){
 assert.equal(await page.locator('.room3-stage').getAttribute('data-view'),view);
 const image=await page.locator('#r3Background').evaluate(async img=>{await img.decode();return [img.naturalWidth,img.naturalHeight]});assert.deepEqual(image,[1672,941]);
 const bounds=await page.locator('.room3-stage').boundingBox();
 for(const b of await page.locator('.room3-object:not([hidden])').all()){
 const r=await b.boundingBox();assert(r.x>=bounds.x-1&&r.y>=bounds.y-1&&r.x+r.width<=bounds.x+bounds.width+1&&r.y+r.height<=bounds.y+bounds.height+1,'Hit targets fit stage');
 }
 if(view==='right'){
  // C02: the optional notebook is a visible prop in the desk, not a
  // floating laptop-shaped button or an invisible click region.
  const note=page.locator('#explore-room03-lecture-note');
  assert.equal(await note.count(),1,'C02: lecture notebook appears by the desk');
  const noteArt=note.locator('.ambient-prop-image');
  const noteDimensions=await noteArt.evaluate(async img=>{
    await img.decode();
    return {width:img.naturalWidth,height:img.naturalHeight,complete:img.complete};
  });
  assert.equal(noteDimensions.complete,true,'C02: notebook SVG decodes');
  assert(noteDimensions.width>=90&&noteDimensions.height>=45,'C02: notebook has usable rasterized dimensions');
  assert(Math.abs(noteDimensions.width/noteDimensions.height-168/96)<.03,
    'C02: SVG keeps its authored notebook aspect ratio on mobile WebKit');
  const [desk,noteBounds]=await Promise.all([page.locator('#r3Desk').boundingBox(),note.boundingBox()]);
  assert(noteBounds.x>=desk.x-2&&noteBounds.y>=desk.y-2,'C02: notebook begins on the tabletop');
  assert(noteBounds.x+noteBounds.width<=desk.x+desk.width+2&&noteBounds.y+noteBounds.height<=desk.y+desk.height+2,'C02: notebook remains on the tabletop');
  await page.screenshot({path:path.join(dir,'lecture-notebook-on-desk.png')});
  await note.click();
  assert.equal(await page.locator('.inspection-title').textContent(),'講義ノート','C02: investigating the notebook opens its own art');
  assert.match(await page.locator('.inspection-image').getAttribute('src'),/optional-room03-lecture-notebook\.svg\?v=20261028-c02$/);
  await page.locator('.inspection-image').evaluate(async img=>{await img.decode()});
  await page.screenshot({path:path.join(dir,'lecture-notebook-closeup.png')});
  await page.locator('.inspection-close').click();
  assert.equal(await page.locator('.inspection-overlay').count(),0,'C02: closing returns to exploration');
 }
 if(view==='left'){
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.locator('.room3-sleeping-hana').waitFor({state:'visible'});
 const motion=()=>page.locator('.room3-sleeping-hana').evaluate(el=>({name:getComputedStyle(el).animationName,transform:getComputedStyle(el).transform}));
 const sleepAsset=await page.locator('.room3-sleeping-hana').evaluate(async el=>{
  const url=getComputedStyle(el).backgroundImage.match(/url\(["']?(.*?)["']?\)/)[1];
  const image=new Image();image.src=url;await image.decode();
  return {url,width:image.naturalWidth,height:image.naturalHeight,rendering:getComputedStyle(el).imageRendering};
 });
 assert.match(sleepAsset.url,/hana-hires\/poses\/sleeping.webp/);
 assert.deepEqual([sleepAsset.width,sleepAsset.height],[1883,528]);
 assert.equal(sleepAsset.rendering,'auto');
 const before=await motion();await page.waitForTimeout(1100);const after=await motion();
 for(const snapshot of [before,after]){
  const values=snapshot.transform.match(/matrix\(([^)]+)\)/)[1].split(',').map(Number);
  assert(Math.abs(Math.hypot(values[0],values[1])-1)<0.00001,'Sleep motion never scales width');
  assert(Math.abs(Math.hypot(values[2],values[3])-1)<0.00001,'Sleep motion never scales height');
 }
 assert.equal(before.name,'hanaSleepBreath');assert.notEqual(before.transform,after.transform,'Breathing changes the approved sleep pose transform');
 assert.equal(await page.locator('.room3-sleep-shoes').evaluate(el=>getComputedStyle(el).animationName),'none','Shoes remain still');
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
 assert.equal(await page.locator('.r3-companion-sheet').isVisible(),false,'The phone opens alone before the Morse chart is discovered');
 assert.equal(await page.locator('.r3-chat-workspace').evaluate(el=>el.classList.contains('has-reference')),false,'A missing reference must not reserve a column');
 assert.equal(await page.locator('.r3-show-morse,.r3-show-letterboard').count(),2,'Reference controls can be unlocked later without reopening');
 assert.equal(await page.locator('.r3-show-morse').isVisible(),false,'The unknown Morse sheet is not advertised');
 assert.equal(await page.locator('.r3-show-letterboard').isVisible(),false,'Unreceived image tab is not visible');
 assert.equal(await page.locator('.r3-no-attachment').count(),0,'There is no empty clue display frame');
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
 const chart=page.locator('.r3-morse-chart');assert.equal(await page.locator('.r3-morse-cell').count(),26,'All A–Z included');
 assert.deepEqual(await page.locator('.r3-morse-cell').evaluateAll(cells=>cells.map(c=>c.dataset.letter)),Array.from({length:26},(_,i)=>String.fromCharCode(65+i)));
 assert.deepEqual(await page.locator('.r3-morse-code').evaluateAll(cells=>cells.map(c=>c.dataset.code)),await page.evaluate(()=>Object.values(ROOM3_MORSE)));
 const paper=await chart.boundingBox();assert(paper.x>=0&&paper.y>=0&&paper.x+paper.width<=spec.viewport.width&&paper.y+paper.height<=spec.viewport.height,'Reference sheet fits viewport');
 for(const cell of await page.locator('.r3-morse-cell').all()){
 const r=await cell.boundingBox();assert(r.y>=paper.y&&r.y+r.height<=paper.y+paper.height,'Every letter visible on sheet');
 assert(await cell.evaluate(el=>el.scrollWidth<=el.clientWidth),'Symbols fit row without horizontal overflow');
 }
 await page.screenshot({path:path.join(dir,'morse-az.png')});await page.locator('.r3-morse-chart .device-close').click();
 assert.equal(await page.evaluate(()=>document.activeElement.id),'r3Shelf');
 await page.locator('#r3Shelf').click();assert.equal(await page.locator('.room-dialog-overlay').count(),0,'Reinspection opens chart directly');
 await page.keyboard.press('Escape');assert.equal(await chart.count(),0);
 await page.locator('#r3Trumpet').click();await finishDialogue(page);
 await page.evaluate(()=>showThirdRoom({...room3State}));assert.equal(await page.locator('.room3-stage').getAttribute('data-view'),'back','Saved view restored');
 await page.locator('#r3TurnLeft').click();assert.equal(await page.locator('#r3Board').count(),0,'The letterboard is not on the desk before it arrives by chat');await page.locator('#r3Phone').click();
 const reply=page.locator('.r3-reply-input'),send=page.locator('.r3-reply-send');
 assert.equal(await page.locator('.room3-answer-input,.room3-final-input').count(),0,'The old standalone puzzle entry no longer exists');
 assert.equal(await reply.count(),1,'The smartphone conversation ends with one reply field');
 assert.equal(await reply.evaluate(el=>el===document.activeElement),false,'No unwanted mobile keyboard when chat opens');
 assert.equal(await page.locator('.r3-inline-morse').isVisible(),true,'The collected A-Z Morse chart stays beside the phone');
 assert.equal(await page.locator('.r3-companion-sheet').isVisible(),true,'Discovered Morse reference creates the companion display');
 assert.equal(await page.locator('.r3-chat-workspace').evaluate(el=>el.classList.contains('has-reference')),true);
 assert.equal(await page.locator('.r3-companion-tabs').isVisible(),false,'A single discovered item requires no empty image tab');
 assert.equal(await page.locator('.r3-inline-morse .r3-morse-cell').count(),26);
 assert.equal(await page.locator('.r3-board-preview').count(),0,'The letterboard is not received before the first correct reply');
 await page.screenshot({path:path.join(dir,'chat-with-morse-chart.png')});
 await reply.fill('オナジモジノアイダ');await send.click();
 assert.equal(await page.evaluate(()=>room3State.morseSolved),true,'First correct reply decodes the message');
 assert.equal(await page.locator('.r3-board-preview').count(),1,'Senpai sends the 10x10 image as a chat attachment');
 assert.equal(await page.locator('.r3-companion-tabs').isVisible(),true,'Only after receipt do both reference tabs appear');
 assert.equal(await page.locator('.r3-show-letterboard').isVisible(),true);
 assert(await page.locator('.r3-large-letterboard img').evaluate(async img=>{await img.decode();return img.complete&&img.naturalWidth>0&&img.naturalHeight>0}),'The received SVG image loads and decodes; exact 10x10 contents are checked in the asset unit test');
 assert.equal(await page.locator('.r3-large-letterboard').isVisible(),true,'Received board is enlarged in the companion pane');
 assert.equal(await reply.evaluate(el=>el===document.activeElement),false,'No mobile keyboard appears when the image arrives');
 await page.locator('.r3-show-morse').click();
 assert.equal(await page.locator('.r3-inline-morse').isVisible(),true,'Morse reference can be reopened while the chat stays open');
 await page.locator('.r3-board-preview').click();
 assert.equal(await page.locator('.r3-large-letterboard').isVisible(),true,'Tapping the received image enlarges it beside the phone');
 await page.screenshot({path:path.join(dir,'received-letterboard.png')});
 await reply.fill('いつもとなりに');await send.click();
 await page.locator('.room-dialog-overlay').waitFor();
 await finishDialogue(page);
 assert(await page.evaluate(()=>room3State.unlocked&&room3State.memorySeen),'Second correct reply opens the existing memory flow');
 assert.deepEqual(errors,[]);console.log(spec.name+': all four views, investigation, save and puzzle passed');
 }finally{await browser.close()}
 }
})().catch(e=>{console.error(e);process.exit(1)});
