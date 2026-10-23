const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),local=process.env.ROOM4_REVIEW_LOCAL==='1';
const url=process.env.PUBLIC_BASE_URL||(local?'https://room4.local/':'https://bqlohakuto.github.io/saigononazo/');
const version=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8').match(/room4.js\?v=([^"']+)/)[1];
const cssVersion=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8').match(/design-ui.css\?v=([^"']+)/)[1];
async function gazeDimensions(page){
 return page.locator('#r4Hana').evaluate(async el=>{
  // Include container layout and ResizeObserver delivery, not an arbitrary delay.
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  const idle=getComputedStyle(el,'::before'),gaze=getComputedStyle(el.querySelector('.r4-hana-look-pose'));
  const dimensions=style=>Object.fromEntries(['width','height','bottom'].map(key=>[key,parseFloat(style[key])]));
  return {idle:dimensions(idle),gaze:dimensions(gaze)};
 });
}
async function assertGazeAligned(page,dir,label){
 const matches=scale=>['width','height','bottom'].every(key=>Number.isFinite(scale.idle[key])&&Number.isFinite(scale.gaze[key])&&Math.abs(scale.idle[key]-scale.gaze[key])<1);
 let scale=await gazeDimensions(page);
 if(!matches(scale)){
  await page.waitForFunction(()=>{
   const el=document.getElementById('r4Hana'),idle=getComputedStyle(el,'::before'),gaze=getComputedStyle(el.querySelector('.r4-hana-look-pose'));
   return ['width','height','bottom'].every(key=>Math.abs(parseFloat(idle[key])-parseFloat(gaze[key]))<1);
  },null,{timeout:2000}).catch(()=>{});
  scale=await gazeDimensions(page);
 }
 if(!matches(scale))await page.screenshot({path:path.join(dir,'gaze-size-failure-'+label+'.png')});
 assert(matches(scale),'Gaze canvas and foot anchor match idle after '+label+': '+JSON.stringify(scale));
 console.log('GAZE '+label+' '+JSON.stringify(scale));
 return scale;
}
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
const mobileEngine=process.env.ROOM4_MOBILE_ENGINE==='chromium'?chromium:webkit;
(async()=>{for(const spec of [{name:'desktop',engine:chromium,viewport:{width:1366,height:768},channel:local?undefined:'chrome',mobile:false},{name:mobileEngine===webkit?'landscape-webkit':'landscape-chromium',engine:mobileEngine,viewport:{width:852,height:393},mobile:true}]){
 const browser=await spec.engine.launch({headless:true,...(spec.channel?{channel:spec.channel}:{})});
 try{
 const ctx=await browser.newContext({viewport:spec.viewport,isMobile:spec.mobile,hasTouch:spec.mobile,reducedMotion:'reduce'});
 await ctx.addInitScript(()=>localStorage.setItem('saigononazo-help-seen','1'));
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(local)await page.route('https://room4.local/**',async route=>{
  const file=path.resolve(root,decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\//,'')||'index.html');
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});
  await route.fulfill({path:file});
 });
 let deployed=false;for(let i=0;i<24;i++){await page.goto(url+'?room4_review='+Date.now());if((await page.locator('script[src*="room4.js"]').getAttribute('src')).includes(version)
  &&(await page.locator('link[href*="design-ui.css"]').getAttribute('href')).includes(cssVersion)){deployed=true;break}await page.waitForTimeout(8000)}assert(deployed,'Expected deployed version');
 const dir=path.join(process.env.UI_SCREENSHOT_DIR||'artifacts/room04',spec.name);fs.mkdirSync(dir,{recursive:true});
 await page.waitForSelector('#game.hana-v2-full-ready');
 // The original introduction must trigger the ceiling-gaze pose on its confirmed narration.
 await page.evaluate(()=>{settings.instantText=true;showFourthRoom()});
 // Validate a settled, *rendered* first frame rather than a pre-layout style value.
 await page.waitForFunction(()=>{
  const stage=document.querySelector('.room4-stage'),hana=document.getElementById('r4Hana');
  const container=document.getElementById('game-container');
  if(!stage||!hana||!container)return false;
  const width=stage.getBoundingClientRect().width,canvas=container.getBoundingClientRect().width;
  const idle=getComputedStyle(hana,'::before'),gaze=getComputedStyle(hana.querySelector('.r4-hana-look-pose'));
  return Math.abs(width-canvas)<1
   &&Math.abs(parseFloat(idle.height)-width*.405)<1
   &&Math.abs(parseFloat(idle.width)-width*.26)<1
   &&['height','width','bottom'].every(key=>Math.abs(parseFloat(idle[key])-parseFloat(gaze[key]))<1);
 },null,{timeout:4000});
 const hanaScale=await page.locator('#r4Hana').evaluate(el=>{
  const sprite=getComputedStyle(el,'::before'),head=getComputedStyle(el.querySelector('.r4-hana-look-pose'));
  return {width:parseFloat(sprite.width),height:parseFloat(sprite.height),headHeight:parseFloat(head.height),visible:!el.hidden};
 });
 const canvasWidth=await page.locator('#game-container').evaluate(el=>el.getBoundingClientRect().width);
 const sizing=await page.locator('#r4Hana').evaluate(el=>{
  const bounds=sel=>{const t=document.querySelector(sel)?.getBoundingClientRect();return t?{width:t.width,height:t.height,x:t.x,y:t.y}:null};
  const st=getComputedStyle(el,'::before'),face=getComputedStyle(el.querySelector('.r4-hana-look-pose'));
  return {gameContainer:bounds('#game-container'),game:bounds('#game'),stageWrap:bounds('.room-stage-wrap'),stage:bounds('.room4-stage'),hana:bounds('#r4Hana'),idle:{width:st.width,height:st.height,bottom:st.bottom,background:st.backgroundImage},gaze:{width:face.width,height:face.height,bottom:face.bottom},ready:document.querySelector('#game').className};
 });
 console.log('ROOM4_HANA_DIAGNOSTIC '+spec.name+' '+JSON.stringify({sizing,hanaScale,canvasWidth}));
 assert(hanaScale.visible,'Hana must be visible in the fourth room front view');
 assert(Math.abs(hanaScale.height/canvasWidth-.405)<.01,'Room 4 Hana uses restored 40.5cqw sprite height');
 assert(Math.abs(hanaScale.width/canvasWidth-.26)<.01,'Room 4 Hana uses restored 26cqw sprite width');
 await page.evaluate(()=>{
  for(let i=0;i<70&&!/^r4i06(?:_\d+)?$/.test(GameLog.list().at(-1)?.id||'');i++)Dialogue.advance();
 });
 assert.match(await page.evaluate(()=>GameLog.list().at(-1)?.id||''),/^r4i06(?:_\d+)?$/,'Ceiling-gaze narration reached using expanded ID');
 assert(await page.locator('#r4Hana').evaluate(el=>el.classList.contains('is-looking-up')),'Hana looks up during narration');
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('#r4Hana .r4-hana-look-pose')).opacity==='1');
 assert.equal(await page.locator('#r4Hana .r4-hana-look-pose').evaluate(el=>getComputedStyle(el).opacity),'1','Dedicated full-body gaze is visible');
 assert.deepEqual(await page.evaluate(async()=>{const img=new Image();img.src='images/characters/hana-hires/poses/look-up-left.webp';await img.decode();return [img.naturalWidth,img.naturalHeight]}),[1024,2048]);
 const pose=await page.locator('#r4Hana .r4-hana-look-pose').evaluate(el=>({
   transform:getComputedStyle(el).transform,
   animationName:getComputedStyle(el).animationName,
   clipPath:getComputedStyle(el).clipPath
 }));
 assert.notEqual(pose.transform,'none','Dedicated gaze artwork is positioned for reduced-motion users');
 assert.equal(pose.clipPath,'none','The gaze uses a complete dedicated sprite');
 assert.match(await page.locator('#r4Hana .r4-hana-look-pose').evaluate(el=>getComputedStyle(el).backgroundImage),/poses\/look-up-left\.webp/);
 assert.equal(await page.locator('#r4Hana').evaluate(el=>getComputedStyle(el,'::before').opacity),'0','Idle sprite is hidden during gaze');
 const initialScale=await assertGazeAligned(page,dir,'entry');
 assert(Math.abs(initialScale.idle.height-canvasWidth*.405)<1,'Entry layout has settled at the intended companion scale');
 // Reproduce the room layout settling without a window resize or another line.
 await page.locator('.room-stage-wrap').evaluate(el=>{el.style.width='calc(100% - 48px)'});
 await page.waitForFunction(height=>parseFloat(getComputedStyle(document.getElementById('r4Hana'),'::before').height)<height-1,initialScale.idle.height);
 const resizedScale=await assertGazeAligned(page,dir,'container-resize');
 assert(resizedScale.idle.height<initialScale.idle.height-1,'The room container actually changed size');
 await page.locator('.room-stage-wrap').evaluate(el=>el.style.removeProperty('width'));
 await page.waitForFunction(height=>Math.abs(parseFloat(getComputedStyle(document.getElementById('r4Hana'),'::before').height)-height)<1,initialScale.idle.height);
 await assertGazeAligned(page,dir,'container-restored');
 // The normal motion setting must retain the same sizing and use the final pose.
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.waitForTimeout(750);
 await assertGazeAligned(page,dir,'motion');
 assert.match(await page.locator('#r4Hana .r4-hana-look-pose').evaluate(el=>getComputedStyle(el).backgroundImage),/poses\/look-up-left\.webp/);
 await page.emulateMedia({reducedMotion:'reduce'});
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
 const board=await page.locator('.r4-flower-board').boundingBox(),roomStage=await page.locator('.room4-stage').boundingBox();assert(board.x>=roomStage.x+roomStage.width*.571&&board.x+board.width<=roomStage.x+roomStage.width*.831,'Flower board stays inside the wooden frame');
 await page.screenshot({path:path.join(dir,'right-flower-board.png')});
 await page.locator('#r4P1').click();assert.equal(await page.locator('.r4-mini input').evaluate(el=>el===document.activeElement),false,'STAR puzzle does not activate input on opening');await page.locator('.r4-mini input').click();assert(await page.locator('.r4-mini input').evaluate(el=>el===document.activeElement),'Selected answer field is focused');await page.locator('.r4-mini input').fill('STAR');await page.locator('.r4-answer').click();await finish(page);assert(await page.evaluate(()=>room4State.star));
 await page.locator('#r4TurnRight').click();await page.locator('#r4Meteor').click();await finish(page);await page.locator('#r4Moon').click();
 assert(await page.locator('.r4-world-exhibit').isVisible(),'Country reference opens as an exhibit, independently of dialogue');
 assert.equal(await page.locator('.r4-reference-flag').count(),7,'Reference includes the five target countries and two other countries');
 assert.notDeepEqual((await page.locator('.r4-world-country strong').allTextContents()).slice(0,5),['POLAND','SPAIN','BELGIUM','THAILAND','ITALY'],'Reference does not disclose the answer order');
 await page.screenshot({path:path.join(dir,'country-reference.png')});
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('.r4-world-overlay').count(),0,'Reference can be closed before opening puzzle 2');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'r4Moon','Reference returns focus to its exploration target');
 await page.locator('#r4P2').click();
 assert.equal(await page.locator('.r4-ratio-specimen').count(),5,'All five color-area clues are visible');
 assert.deepEqual(await page.locator('.r4-ratio-digit').allTextContents(),['3','4','4','2','2'],'Approved letter extraction positions are preserved');
 assert.equal(await page.locator('.r4-ratio-exhibit svg').count(),0,'Puzzle does not disclose flag silhouettes');
 assert(!/POLAND|SPAIN|BELGIUM|THAILAND|ITALY/.test(await page.locator('.r4-ratio-exhibit').innerText()),'Country names are found in the separate reference');
 const ratioBounds=await page.locator('.r4-ratio-exhibit').boundingBox();
 assert(ratioBounds.x>=view.x-1&&ratioBounds.y>=view.y-1&&ratioBounds.x+ratioBounds.width<=view.x+view.width+1&&ratioBounds.y+ratioBounds.height<=view.y+view.height+1,'Color-area puzzle fits the game viewport');
 await page.screenshot({path:path.join(dir,'color-area-puzzle.png')});
 await page.keyboard.press('Escape');
 await page.locator('#r4P2').click();assert.equal(await page.locator('.r4-mini input').evaluate(el=>el===document.activeElement),false,'LIGHT puzzle does not activate input on opening');await page.locator('.r4-mini input').click();assert(await page.locator('.r4-mini input').evaluate(el=>el===document.activeElement),'Selected answer field is focused');await page.locator('.r4-mini input').fill('LIGHT');await page.locator('.r4-answer').click();await finish(page);assert(await page.evaluate(()=>room4State.lightPuzzle));
 await page.locator('#r4P3').click();
 const plateButtons=page.locator('.r4-rainbow-plate');
 assert.equal(await plateButtons.count(),7,'Exactly seven tactile rainbow plates');
 assert.equal(await page.locator('.r4-rainbow button[data-d]').count(),0,'No up/down control clutter remains');
 assert.equal(await page.locator('.r4-plate-exhibit').count(),1,'Puzzle sits inside its own exhibition case');
 assert.equal(await plateButtons.locator('.r4-rainbow-color').count(),0,'Physical plate color has no redundant written label');
 assert.deepEqual(await plateButtons.evaluateAll(nodes=>nodes.map(el=>el.dataset.plate)),['青O','赤M','紫S','黄T','藍R','橙E','緑E']);
 const plateBounds=await page.locator('.r4-plate-exhibit').boundingBox();
 const buttonBounds=await plateButtons.evaluateAll(buttons=>buttons.map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}}));
 assert(plateBounds.x>=-1&&plateBounds.y>=-1&&plateBounds.x+plateBounds.width<=spec.viewport.width+1&&plateBounds.y+plateBounds.height<=spec.viewport.height+1,'Rainbow exhibit must fit the landscape viewport');
 assert(buttonBounds.every(rect=>rect.left>=plateBounds.x&&rect.right<=plateBounds.x+plateBounds.width+1&&rect.top>=plateBounds.y&&rect.bottom<=plateBounds.y+plateBounds.height+1),'All seven plates stay inside the exhibition display');
 await page.screenshot({path:path.join(dir,'rainbow-plates-initial.png')});
 // Move a plate by choosing it, then choosing the destination slot.
 for(const [i,value] of ['赤M','橙E','黄T','緑E','青O','藍R','紫S'].entries()){
  const values=await page.locator('.r4-rainbow-plate').evaluateAll(buttons=>buttons.map(el=>el.dataset.plate));
  const from=values.indexOf(value);
  assert(from>=i,'Expected plate remains available to position: '+value);
  if(from>i){
   await page.locator('.r4-rainbow-plate[data-index="'+from+'"]').click();
   assert.equal(await page.locator('.r4-rainbow-plate[data-index="'+from+'"]').getAttribute('aria-pressed'),'true','Tapped plate becomes visibly selected');
   await page.locator('.r4-rainbow-plate[data-index="'+i+'"]').click();
  }
  if(!(await page.locator('.r4-mini-overlay').count()))break;
 }
 assert(await page.evaluate(()=>room4State.meteors),'Physical rainbow should be solved');
 assert.equal(await page.locator('.r4-plate-overlay.is-solved').count(),1,'The finished rainbow pauses for the player to see it');
 await page.locator('.r4-plate-overlay.is-revealing').waitFor({timeout:2500});
 await page.locator('.r4-plate-overlay').waitFor({state:'detached',timeout:6500});
 await page.locator('.room-dialog-overlay').waitFor({timeout:2500});
 await finish(page);assert.equal(await page.evaluate(()=>r4Count()),5,'Five panels remain in game state');assert.equal(await page.locator('#r4Count').count(),0,'Collecting panels does not recreate a counter');
 await page.locator('#r4TurnRight').click();await page.locator('#r4Light').click();await finish(page);
 assert(await page.locator('#r4LightOverlay').isVisible());assert.deepEqual(await page.locator('#r4LightOverlay').evaluate(async img=>{await img.decode();return [img.naturalWidth,img.naturalHeight]}),[1672,941]);
 await page.screenshot({path:path.join(dir,'left-light-on.png')});
 await page.evaluate(()=>{const saved=JSON.parse(JSON.stringify(room4State));showFourthRoom(saved)});await finish(page);assert.equal(await page.locator('.room4-stage').getAttribute('data-view'),'left');assert(await page.locator('#r4LightOverlay').isVisible());
 await page.locator('#r4TurnRight').click();assert.equal(await page.locator('#r4LightOverlay').isVisible(),false,'Light only appears in projection view');
 await page.locator('#r4TurnLeft').click();await page.locator('#r4Stand').click();assert(await page.locator('.room-four').evaluate(el=>el.inert));
 if(spec.mobile){
  const bounds=await page.locator('.r4-panel-ui').evaluate(panel=>{
   const rect=el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right}};
   return {panel:rect(panel),buttons:[...panel.querySelectorAll('.r4-panels button,.r4-shine')].map(rect)};
  });
  assert(bounds.panel.top>=0&&bounds.panel.bottom<=spec.viewport.height+1&&bounds.panel.left>=0&&bounds.panel.right<=spec.viewport.width+1,`Panel dialog fits short landscape viewport in both axes: ${JSON.stringify(bounds)}`);
  assert.equal(bounds.buttons.length,6,'Five rotations and light action are present');
  for(const button of bounds.buttons)assert(button.top>=bounds.panel.top-1&&button.bottom<=bounds.panel.bottom+1&&button.left>=bounds.panel.left-1&&button.right<=bounds.panel.right+1,'All puzzle controls visible without scroll or clipping');
 }
 assert.deepEqual(await page.evaluate(()=>room4State.angles),[2,1,0,3,2],'Acquired panels use confirmed initial rotations');
 assert.equal(await page.locator('.r4-panels img').count(),5);
 assert.equal(await page.locator('.r4-panel-stack img').count(),5,'Central composite contains all five layers');
 const stackBounds=await page.locator('.r4-panel-stack').boundingBox();
 assert(stackBounds.width>0&&stackBounds.y>=0&&stackBounds.y+stackBounds.height<=spec.viewport.height,'Central composite remains visible');
 const assertStack=async()=>assert.deepEqual(await page.locator('.r4-panel-stack img').evaluateAll(els=>els.map(el=>el.style.transform)),await page.locator('.r4-panels img').evaluateAll(els=>els.map(el=>el.style.transform)),'Composite stays synchronized with every panel');
 await assertStack();
 for(const img of await page.locator('.r4-panels img').all())assert(await img.evaluate(async el=>{await el.decode();return el.naturalWidth>0}),'Real panel artwork is decoded');
 await page.locator('.r4-shine').click();assert.equal(await page.evaluate(()=>room4State.completed),false,'Initial arrangement does not solve puzzle');
 await page.screenshot({path:path.join(dir,'panels-initial.png')});
 for(let n=0;n<4;n++)await page.locator('.r4-panels button[data-i="0"]').click();
 await assertStack();
 assert.equal(await page.evaluate(()=>room4State.angles[0]),2,'Four clockwise turns return to the initial orientation');
 for(const [i,n] of [2,3,0,1,2].entries())for(let j=0;j<n;j++)await page.locator(`.r4-panels button[data-i="${i}"]`).click();
 await assertStack();await page.screenshot({path:path.join(dir,'panels.png')});await page.locator('.r4-shine').click();assert(await page.evaluate(()=>room4State.completed));await finish(page);assert(await page.evaluate(()=>room4State.memorySeen));
 // Close the fourth-room exit choice before testing a separate device modal.
 await page.locator('.room-exit-menu .device-close').click();
 // Text entry starts only after selecting the answer field.
 await page.evaluate(()=>{firstRoomState={melodySolved:false};showPianoScreen()});
 assert.equal(await page.locator('#melodyInput').evaluate(el=>el===document.activeElement),false,'Piano does not activate text entry on opening');
 await page.locator('#melodyInput').click();
 assert(await page.locator('#melodyInput').evaluate(el=>el===document.activeElement),'Piano input activates when selected');
 await page.keyboard.type('ドレミ');assert.equal(await page.locator('#melodyInput').inputValue(),'ドレミ');
 await page.keyboard.press('Escape');assert.equal(await page.locator('#melodyInput').count(),0,'Modal Escape still closes puzzle');

 assert.deepEqual(errors,[]);console.log(spec.name+' room 4 PASS');
 }finally{await browser.close()}
}})().catch(e=>{console.error(e);process.exit(1)});


