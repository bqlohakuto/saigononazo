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
 await page.locator('#r3TurnLeft').click();await page.locator('#r3Board').click();
 assert.equal(await page.locator('.room3-answer-input').evaluate(el=>el===document.activeElement),false,'Room 3 input waits for selection');await page.locator('.room3-answer-input').click();assert(await page.locator('.room3-answer-input').evaluate(el=>el===document.activeElement));
 await page.locator('.room3-answer-input').fill('オナジモジノアイダ');await page.locator('.room3-answer-submit').click();
 assert.equal(await page.locator('.room3-letterboard [role=gridcell]').count(),100);
 assert.deepEqual(await page.locator('.room3-board-row').evaluateAll(rows=>rows.map(r=>r.textContent)),['ラヘヨソヒロコモノチ','チイヘニロサケラミフ','ナロラキルヤツトイメ','ラソソモソアケワイネ','テヘフナイニワモトク','ルミナユキスシネレホ','ウハフワミマテアルハ','フヘモアトオリフニヨ','ヌヘヨニヨヒムマトレ','ツチヒワフエクノヨヒ']);
 // Finish layout/font updates, then measure the board and all cells in one frame.
 await page.screenshot({path:path.join(dir,'puzzle-layout.png')});
 const snapshot=await page.locator('.room3-letterboard').evaluate(board=>{
  const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};
  return {board:rect(board),cells:[...board.querySelectorAll('[role=gridcell]')].map(rect)};
 });
 const board=snapshot.board;
 assert(board.x>=0&&board.y>=0&&board.x+board.width<=spec.viewport.width&&board.y+board.height<=spec.viewport.height,'Entire adopted board fits viewport');
 const outside=snapshot.cells.filter(r=>!(r.x>=board.x&&r.y>=board.y&&r.x+r.width<=board.x+board.width+1&&r.y+r.height<=board.y+board.height+1));
 assert.deepEqual(outside,[],'Every letter fits board: '+JSON.stringify({board,outside}));
 assert.equal(await page.locator('.room3-puzzle-note').count(),0,'No obsolete prototype label');
 await page.screenshot({path:path.join(dir,'puzzle.png')});
 assert.equal(await page.locator('.room3-final-input').evaluate(el=>el===document.activeElement),false,'Second answer field is not focused automatically');await page.locator('.room3-final-input').click();
 await page.locator('.room3-final-input').fill('いつもとなりに');await page.locator('.room3-final-submit').click();await finishDialogue(page);
 assert(await page.evaluate(()=>room3State.unlocked&&room3State.memorySeen),'Existing puzzle and memory flow succeeds');
 assert.deepEqual(errors,[]);console.log(spec.name+': all four views, investigation, save and puzzle passed');
 }finally{await browser.close()}
 }
})().catch(e=>{console.error(e);process.exit(1)});
