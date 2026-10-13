const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const url=process.env.PUBLIC_BASE_URL||'https://bqlohakuto.github.io/saigononazo/';
const version=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8').match(/room4.js\?v=([^"']+)/)[1];
async function finish(page){
 for(let i=0;i<240&&await page.locator('.room-dialog-overlay').count();i++){
  await page.locator('#roomNextButton').click({force:true});await page.waitForTimeout(15);
 }
 assert.equal(await page.locator('.room-dialog-overlay').count(),0,'Dialogue finishes');
 // The room deliberately opens a separate "入手" modal after collecting each panel.
 // Complete that interaction before trying another exploration target.
 const pickup=page.locator('.design-overlay .design-panel[aria-label="入手"]');
 if(await pickup.count()){
  assert(await pickup.getByText('ガラスパネル',{exact:true}).count(),'Received item should be the glass panel');
  await pickup.getByRole('button',{name:'受け取る'}).click();
  await page.locator('.design-overlay').waitFor({state:'detached'});
 }
}
(async()=>{for(const spec of [{name:'desktop',engine:chromium,viewport:{width:1366,height:768},channel:'chrome'},{name:'landscape-webkit',engine:webkit,viewport:{width:852,height:393}}]){
 const browser=await spec.engine.launch({headless:true,...(spec.channel?{channel:spec.channel}:{})});
 try{
 const ctx=await browser.newContext({viewport:spec.viewport,isMobile:!spec.channel,hasTouch:!spec.channel,reducedMotion:'reduce'});
 await ctx.addInitScript(()=>localStorage.setItem('saigononazo-help-seen','1'));
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 let deployed=false;for(let i=0;i<24;i++){await page.goto(url+'?room4_review='+Date.now());if((await page.locator('script[src*="room4.js"]').getAttribute('src')).includes(version)){deployed=true;break}await page.waitForTimeout(8000)}assert(deployed,'Expected deployed version');
 const dir=path.join('artifacts/room04',spec.name);fs.mkdirSync(dir,{recursive:true});
 // The original introduction must trigger the ceiling-gaze pose on its confirmed narration.
 await page.evaluate(()=>{settings.instantText=true;showFourthRoom()});
 const hanaScale=await page.locator('#r4Hana').evaluate(el=>{
  const sprite=getComputedStyle(el,'::before'),head=getComputedStyle(el.querySelector('.r4-hana-look-pose'));
  return {width:parseFloat(sprite.width),height:parseFloat(sprite.height),headHeight:parseFloat(head.height),visible:!el.hidden};
 });
 const canvasWidth=await page.locator('#game-container').evaluate(el=>el.getBoundingClientRect().width);
 assert(hanaScale.visible,'Hana must be visible in the fourth room front view');
 assert(Math.abs(hanaScale.height/canvasWidth-.31)<.01,'Room 4 Hana uses reduced 31cqw sprite height');
 assert(Math.abs(hanaScale.width/canvasWidth-.199)<.01,'Room 4 Hana uses reduced 19.9cqw sprite width');
 await page.evaluate(()=>{
  for(let i=0;i<70&&!/^r4i06(?:_\d+)?$/.test(GameLog.list().at(-1)?.id||'');i++)Dialogue.advance();
 });
 assert.match(await page.evaluate(()=>GameLog.list().at(-1)?.id||''),/^r4i06(?:_\d+)?$/,'Ceiling-gaze narration reached using expanded ID');
 assert(await page.locator('#r4Hana').evaluate(el=>el.classList.contains('is-looking-up')),'Hana looks up during narration');
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('#r4Hana .r4-hana-look-pose')).opacity==='1');
 assert.equal(await page.locator('#r4Hana .r4-hana-look-pose').evaluate(el=>getComputedStyle(el).opacity),'1','Dedicated full-body gaze is visible');
 assert.deepEqual(await page.evaluate(async()=>{const img=new Image();img.src='images/characters/hana-v8/looking-up.png';await img.decode();return [img.naturalWidth,img.naturalHeight]}),[1024,1536]);
 const pose=await page.locator('#r4Hana .r4-hana-look-pose').evaluate(el=>({
   transform:getComputedStyle(el).transform,
   animationName:getComputedStyle(el).animationName,
   clipPath:getComputedStyle(el).clipPath
 }));
 assert.notEqual(pose.transform,'none','Dedicated gaze artwork is positioned for reduced-motion users');
 assert.equal(pose.clipPath,'none','The gaze uses a complete dedicated sprite');
 assert.match(await page.locator('#r4Hana .r4-hana-look-pose').evaluate(el=>getComputedStyle(el).backgroundImage),/looking-up\.png/);
 assert.equal(await page.locator('#r4Hana').evaluate(el=>getComputedStyle(el,'::before').opacity),'0','Idle sprite is hidden during gaze');
 const activeScale=await page.locator('#r4Hana').evaluate(el=>({idle:parseFloat(getComputedStyle(el,'::before').height),gaze:parseFloat(getComputedStyle(el.querySelector('.r4-hana-look-pose')).height)}));
 assert(Math.abs(activeScale.idle-activeScale.gaze)<1,'Displayed gaze matches the settled idle dimensions');
 await page.screenshot({path:path.join(dir,'front-hana-looking-up.png')});
 await page.evaluate(()=>{
  for(let i=0;i<30&&!/^r4i10(?:_\d+)?$/.test(GameLog.list().at(-1)?.id||'');i++)Dialogue.advance();
 });
 assert.match(await page.evaluate(()=>GameLog.list().at(-1)?.id||''),/^r4i10(?:_\d+)?$/,'Narration after star-gazing reached using expanded ID');
 assert(!(await page.locator('#r4Hana').evaluate(el=>el.classList.contains('is-looking-up'))),'Hana returns to idle stance after gazing');
 await finish(page);
 assert(!(await page.locator('#r4Hana').evaluate(el=>el.classList.contains('is-looking-up'))),'No stale look-up state after dialogue');
 assert.equal(await page.locator('#exploreStatus').count(),0,'Room 4 creates no exploration guidance element');
 assert.equal(await page.locator('#r4Count').count(),0,'Room 4 creates no collection counter element');
 const expected={front:['r4Door','r4Wall','r4Box','r4Hana'],right:['r4Const','r4Flowers','r4P1'],back:['r4Meteor','r4Moon','r4P2','r4P3'],left:['r4Light','r4Stand']};
 for(const view of ['front','right','back','left']){
 assert.equal(await page.locator('.room4-stage').getAttribute('data-view'),view);
 assert.deepEqual((await page.locator('.r4obj:not([hidden])').evaluateAll(bs=>bs.map(b=>b.id))).sort(),expected[view].sort());
 assert.deepEqual(await page.locator('#r4Background').evaluate(async img=>{await img.decode();return [img.naturalWidth,img.naturalHeight]}),[1672,941]);
 const stage=await page.locator('.room4-stage').boundingBox();for(const b of await page.locator('.r4obj:not([hidden])').all()){const r=await b.boundingBox();assert(r.x>=stage.x-1&&r.y>=stage.y-1&&r.x+r.width<=stage.x+stage.width+1&&r.y+r.height<=stage.y+stage.height+1,'Target within stage')}
 assert.equal(await page.locator('#r4LightOverlay').isVisible(),false,'Light starts off');
 await page.screenshot({path:path.join(dir,view+'.png')});await page.locator('#r4TurnRight').click();
 }
 await page.locator('#r4Wall').click();await finish(page);assert(await page.evaluate(()=>room4State.wall));
 await page.locator('#r4Box').click();await finish(page);assert(await page.evaluate(()=>room4State.box));
 await page.locator('#r4Door').click();await finish(page);
 await page.locator('#r4TurnRight').click();await page.locator('#r4Const').click();await finish(page);
 const exhibit=page.locator('.r4-zodiac-exhibit');assert(await exhibit.isVisible(),'Constellation inspection opens the exhibit');
 assert.equal(await page.locator('.r4-zodiac-card').count(),12,'Exactly twelve zodiac exhibits');
 const names=await page.locator('.r4-zodiac-card strong').allTextContents();assert.equal(new Set(names).size,12);assert(!names.some(n=>n.includes('白鳥')));
 assert(await page.locator('.room-four').evaluate(el=>el.inert),'Exhibit traps input outside the room');
 const cards=await page.locator('.r4-zodiac-card').all();
 const view=await page.locator('#game-container').boundingBox();
 for(const card of cards){const r=await card.boundingBox();assert(r.width>0&&r.height>=35&&r.x>=view.x&&r.y>=view.y&&r.x+r.width<=view.x+view.width+1&&r.y+r.height<=view.y+view.height+1,'All twelve cards fit the game viewport')}
 await page.screenshot({path:path.join(dir,'zodiac-overview.png')});
 for(const [i,name] of names.entries()){
  await page.locator('.r4-zodiac-card').nth(i).click();assert.equal(await page.locator('.r4-zodiac-copy h3').textContent(),name);
  assert((await page.locator('.r4-zodiac-description').textContent()).length>20,'Every constellation has an explanation');
  assert((await page.locator('.r4-zodiac-large circle').count())>=3,'A real star chart is present');
  const back=await page.locator('.r4-zodiac-back').boundingBox();assert(back.x>=view.x&&back.y>=view.y&&back.x+back.width<=view.x+view.width+1&&back.y+back.height<=view.y+view.height+1,'Return control remains accessible');
  if(i===5)await page.screenshot({path:path.join(dir,'zodiac-detail.png')});
  await page.locator('.r4-zodiac-back').click();assert(await page.locator('.r4-zodiac-card').nth(i).evaluate(el=>el===document.activeElement),'Back restores focus to the selected card');
 }
 await page.keyboard.press('Escape');assert.equal(await page.locator('.r4-zodiac-overlay').count(),0);assert(!(await page.locator('.room-four').evaluate(el=>el.inert)));assert.equal(await page.evaluate(()=>document.activeElement.id),'r4Const');
 await page.locator('#r4Flowers').click();await finish(page);
 assert(await page.locator('.r4-flower-exhibit').isVisible());
 assert.equal(await page.locator('[data-flower]').count(),12);
 assert.deepEqual(await page.locator('.r4-flower-card small').allTextContents(),['ハニーサックル','ポピー','ラベンダー','白いバラ','ヒマワリ','キク','バラ','ゼラニウム','カーネーション','パンジー','ラン','スイレン']);
 assert.deepEqual(await page.evaluate(async()=>{const i=new Image();i.src='images/exhibits/room04/zodiac-flowers-atlas-coarse.png';await i.decode();return [i.naturalWidth,i.naturalHeight]}),[1448,1086]);
 const flowerCards=await page.locator('[data-flower]').all();
 for(const card of flowerCards){const r=await card.boundingBox();assert(r.width>0&&r.height>=35&&r.x>=view.x&&r.y>=view.y&&r.x+r.width<=view.x+view.width+1&&r.y+r.height<=view.y+view.height+1,'Twelve flower cards fit the game viewport')}
 await page.screenshot({path:path.join(dir,'flowers-overview.png')});
 for(let i=0;i<12;i++){
  await page.locator('[data-flower]').nth(i).click();assert((await page.locator('.r4-flower-overlay .r4-zodiac-description').textContent()).length>20);
  const art=await page.locator('.r4-flower-large .r4-flower-sprite').boundingBox();assert(art.width>40&&art.height>40,'Flower illustration fills a readable area');
  const back=await page.locator('.r4-flower-overlay .r4-zodiac-back').boundingBox();assert(back.x>=view.x&&back.y>=view.y&&back.x+back.width<=view.x+view.width+1&&back.y+back.height<=view.y+view.height+1,'Flower return control is within the screen');
  if(i===5){assert.equal(await page.locator('.r4-flower-overlay h3').textContent(),'キク');await page.screenshot({path:path.join(dir,'flowers-detail.png')})}
  await page.locator('.r4-flower-overlay .r4-zodiac-back').click();assert(await page.locator('[data-flower]').nth(i).evaluate(el=>el===document.activeElement));
 }
 await page.locator('.r4-flower-exhibit summary').click();assert((await page.locator('.r4-flower-exhibit details').textContent()).includes('公的な統一規格ではありません'));
 await page.screenshot({path:path.join(dir,'flowers-source.png')});
 await page.keyboard.press('Escape');assert.equal(await page.locator('.r4-flower-overlay').count(),0);assert.equal(await page.evaluate(()=>document.activeElement.id),'r4Flowers');
 assert(!(await page.locator('.room-four').evaluate(el=>el.inert)));
 await page.screenshot({path:path.join(dir,'right-flower-board.png')});
 await page.locator('#r4P1').click();await page.locator('.r4-mini input').fill('STAR');await page.locator('.r4-answer').click();await finish(page);assert(await page.evaluate(()=>room4State.star));
 await page.locator('#r4TurnRight').click();await page.locator('#r4Meteor').click();await finish(page);await page.locator('#r4Moon').click();await finish(page);
 await page.locator('#r4P2').click();await page.locator('.r4-mini input').fill('LIGHT');await page.locator('.r4-answer').click();await finish(page);assert(await page.evaluate(()=>room4State.lightPuzzle));
 await page.locator('#r4P3').click();
 for(const [i,value] of ['赤M','橙E','黄T','緑E','青O','藍R','紫S'].entries()){
  let values=await page.locator('.r4-rainbow b').allTextContents(),j=values.indexOf(value);
  while(j>i){await page.locator(`.r4-rainbow button[data-i="${j}"][data-d="-1"]`).click();j--;if(!(await page.locator('.r4-mini-overlay').count()))break}
 }
 await finish(page);assert(await page.evaluate(()=>room4State.meteors));assert.equal(await page.evaluate(()=>r4Count()),5,'Five panels remain in game state');assert.equal(await page.locator('#r4Count').count(),0,'Collecting panels does not recreate a counter');
 await page.locator('#r4TurnRight').click();await page.locator('#r4Light').click();await finish(page);
 assert(await page.locator('#r4LightOverlay').isVisible());assert.deepEqual(await page.locator('#r4LightOverlay').evaluate(async img=>{await img.decode();return [img.naturalWidth,img.naturalHeight]}),[1672,941]);
 await page.screenshot({path:path.join(dir,'left-light-on.png')});
 await page.evaluate(()=>{const saved=JSON.parse(JSON.stringify(room4State));showFourthRoom(saved)});await finish(page);assert.equal(await page.locator('.room4-stage').getAttribute('data-view'),'left');assert(await page.locator('#r4LightOverlay').isVisible());
 await page.locator('#r4TurnRight').click();assert.equal(await page.locator('#r4LightOverlay').isVisible(),false,'Light only appears in projection view');
 await page.locator('#r4TurnLeft').click();await page.locator('#r4Stand').click();assert(await page.locator('.room-four').evaluate(el=>el.inert));
 if(spec.name==='landscape-webkit'){
  const bounds=await page.locator('.r4-panel-ui').evaluate(panel=>{
   const rect=el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right}};
   return {panel:rect(panel),buttons:[...panel.querySelectorAll('.r4-panels button,.r4-shine')].map(rect)};
  });
  assert(bounds.panel.top>=0&&bounds.panel.bottom<=spec.viewport.height+1&&bounds.panel.left>=0&&bounds.panel.right<=spec.viewport.width+1,'Panel dialog fits short landscape viewport in both axes');
  assert.equal(bounds.buttons.length,6,'Five rotations and light action are present');
  for(const button of bounds.buttons)assert(button.top>=bounds.panel.top-1&&button.bottom<=bounds.panel.bottom+1&&button.left>=bounds.panel.left-1&&button.right<=bounds.panel.right+1,'All puzzle controls visible without scroll or clipping');
 }
 for(const [i,n] of [1,3,2,0,1].entries())for(let j=0;j<n;j++)await page.locator(`.r4-panels button[data-i="${i}"]`).click();
 await page.screenshot({path:path.join(dir,'panels.png')});await page.locator('.r4-shine').click();assert(await page.evaluate(()=>room4State.completed));await finish(page);assert(await page.evaluate(()=>room4State.memorySeen));
 assert.deepEqual(errors,[]);console.log(spec.name+' room 4 PASS');
 }finally{await browser.close()}
}})().catch(e=>{console.error(e);process.exit(1)});
