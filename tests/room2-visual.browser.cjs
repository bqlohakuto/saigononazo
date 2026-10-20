// Verify the adopted Room 2 background on the deployed website, without changing progress data.
// Run with Playwright Chromium and WebKit installed.
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const url=process.env.PUBLIC_BASE_URL||'https://bqlohakuto.github.io/saigononazo/';
const output=process.env.UI_SCREENSHOT_DIR||'artifacts/room02';
const expectedVersion=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8').match(/room2[.]js[?]v=([^"']+)/)?.[1];
if(!expectedVersion)throw new Error('Cannot find Room 2 JS cache revision');

const views=[
 {name:'desktop-chromium',engine:chromium,viewport:{width:1366,height:768},isMobile:false},
 {name:'landscape-webkit',engine:webkit,viewport:{width:852,height:393},isMobile:true}
];

async function readyPage(page){
 for(let retry=0;retry<24;retry++){
  const response=await page.goto(url+'?room02_review='+Date.now(),{waitUntil:'load',timeout:60000});
  if(response.status()===200){
   const src=await page.locator('script[src*="room2.js"]').getAttribute('src');
   if(src?.includes(expectedVersion))return;
  }
  await page.waitForTimeout(8000);
 }
 throw new Error('GitHub Pages has not deployed Room 2 revision '+expectedVersion);
}

function within(inner,outer,tolerance=3){
 return inner&&outer&&inner.x>=outer.x-tolerance&&inner.y>=outer.y-tolerance&&
  inner.x+inner.width<=outer.x+outer.width+tolerance&&
  inner.y+inner.height<=outer.y+outer.height+tolerance;
}
(async()=>{
 for(const spec of views){
  const browser=await spec.engine.launch({headless:true,...(spec.name==='desktop-chromium'?{channel:'chrome'}:{})});
  try{
   const context=await browser.newContext({viewport:spec.viewport,isMobile:spec.isMobile,hasTouch:spec.isMobile,deviceScaleFactor:spec.isMobile?2:1,reducedMotion:'reduce'});
   await context.addInitScript(()=>localStorage.setItem('saigononazo-help-seen','1'));
   const page=await context.newPage();page.setDefaultTimeout(12000);
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await readyPage(page);
   const dir=path.join(output,spec.name);fs.mkdirSync(dir,{recursive:true});
   await page.evaluate(()=>{settings.instantText=true;showSecondRoom({doorInspected:true,deskInspected:true});});
   const image=await page.locator('.room2-background-art').evaluate(async img=>{
    await img.decode();
    return {url:img.currentSrc,width:img.naturalWidth,height:img.naturalHeight,complete:img.complete};
   });
   const layering=await page.evaluate(async()=>{
     const bg=document.querySelector('.room2-background-art');
     const fg=document.querySelector('.room2-desk-foreground-art');
     await Promise.all([bg.decode(),fg.decode()]);
     const alpha=(img,x,y)=>{
       const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
       const context=canvas.getContext('2d',{willReadFrequently:true});
       context.drawImage(img,0,0);
       return context.getImageData(x,y,1,1).data[3];
     };
     return {
       bg:{url:bg.currentSrc,width:bg.naturalWidth,height:bg.naturalHeight,deskAlpha:alpha(bg,830,750),wallAlpha:alpha(bg,830,420)},
       fg:{url:fg.currentSrc,width:fg.naturalWidth,height:fg.naturalHeight,deskAlpha:alpha(fg,830,750),wallAlpha:alpha(fg,830,420)},
       z:{bg:+getComputedStyle(bg).zIndex,hana:+getComputedStyle(document.querySelector('#r2Hana')).zIndex,fg:+getComputedStyle(fg).zIndex,blocks:+getComputedStyle(document.querySelector('#r2Blocks')).zIndex,desk:+getComputedStyle(document.querySelector('#r2Desk')).zIndex},
       pointerEvents:getComputedStyle(fg).pointerEvents,
       marginAlpha:[[426,595],[500,600],[700,607],[950,607],[1250,640],[1400,750],[1600,650]].map(([x,y])=>alpha(fg,x,y))
     };
   });
   assert.deepEqual([layering.bg.width,layering.bg.height,layering.fg.width,layering.fg.height],[1672,941,1672,941],'Lossless layers have original dimensions');
   assert.deepEqual([layering.bg.deskAlpha,layering.fg.deskAlpha,layering.bg.wallAlpha,layering.fg.wallAlpha],[0,255,255,0],'Desk image has independent transparent alpha mask');
   assert(layering.z.bg<layering.z.hana&&layering.z.hana<layering.z.fg,'Hana visually behind the tabletop');
   assert(layering.z.fg<layering.z.blocks&&layering.z.fg<layering.z.desk,'Interactive desk and puzzle remain above artwork');
   assert.equal(layering.pointerEvents,'none','Foreground never intercepts taps');
   assert.deepEqual(layering.marginAlpha,[0,0,0,0,0,0,0],'No wall or gray strips in foreground around trays and desk');
   for(const layer of [layering.bg,layering.fg]){
     const response=await page.request.get(layer.url,{timeout:20000});
     assert.equal(response.status(),200,'Art layer should be publicly accessible');
   }
   assert.equal(image.width,1672,'Approved image width');
   assert.equal(image.height,941,'Approved image height');
   assert(image.complete);
   const backgroundRequest=await page.request.get(image.url,{timeout:20000});
   assert.equal(backgroundRequest.status(),200,'Adopted image HTTP 200');
   assert.equal(await page.locator('.room2-window-light,.room2-door-art,.room2-desk-art').count(),0,'No old drawn assets over the accepted image');
   const bounds=await page.evaluate(()=>{
    const rect=selector=>{const e=document.querySelector(selector);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
    return {stage:rect('.room2-stage'),image:rect('.room2-background-art'),door:rect('#r2Door'),desk:rect('#r2Desk'),blocks:rect('#r2Blocks'),hana:rect('#r2Hana'),blocksDisabled:document.getElementById('r2Blocks')?.disabled};
   });
   assert(within(bounds.image,bounds.stage),'Background image fits in stage');
   for(const label of ['door','desk','blocks','hana'])assert(within(bounds[label],bounds.stage),label+' hit target must fit stage');
   assert.equal(bounds.blocksDisabled,false,'Puzzle accessible after desk inspection');
   // The approved reference positions Hana left of the door, just behind the red tiles.
   // Use normalized stage geometry so the same artwork works on PC and landscape phones.
   const hanaPlacement=await page.evaluate(()=>{
     const stage=document.querySelector('.room2-stage').getBoundingClientRect();
     const actor=document.querySelector('#r2Hana');
     const rect=actor.getBoundingClientRect();
     const sprite=getComputedStyle(actor,'::before');
     return {
       centerX:(rect.x+rect.width/2-stage.x)/stage.width,
       top:(rect.y-stage.y)/stage.height,
       spriteWidth:parseFloat(sprite.width)/stage.width,
       spriteHeight:parseFloat(sprite.height)/stage.width
     };
   });
   assert(Math.abs(hanaPlacement.centerX-.285)<.015,'Hana should stand left of the door in the reference position');
   assert(Math.abs(hanaPlacement.top-.35)<.015,'Hana should be at the reference height behind the red tray');
   assert(Math.abs(hanaPlacement.spriteWidth-.215)<.025,'Hana should have the approved world sprite size');
   assert(Math.abs(hanaPlacement.spriteHeight-.336)<.03,'Hana should preserve the reference body proportions');

   await page.screenshot({path:path.join(dir,'01-room02-approved.png')});
   await page.locator('#r2Blocks').click({timeout:8000});
   await page.locator('.room2-puzzle').waitFor();
   assert.equal(await page.locator('.room2-answer-slot').count(),5,'Exactly five answer slots');
   assert.equal(await page.locator('.room2-palette-token').count(),10,'Five red and five blue symbols');
   for(const color of ['赤','青'])assert.equal(await page.locator('.room2-palette-token[data-color="'+color+'"]').count(),5);
   for(const color of ['赤','青'])assert.deepEqual(await page.locator('.room2-palette-token[data-color="'+color+'"] i').allTextContents(),['〇','△','□','×','＋'],'Palette matches the adopted desk artwork from left to right');
   await page.screenshot({path:path.join(dir,'02-room02-puzzle.png')});
   const boardVisual=await page.locator('.room2-puzzle').evaluate(panel=>{
    const tile=panel.querySelector('.room2-palette-token i');
    return {boardBackground:getComputedStyle(panel).backgroundImage,tileShadow:getComputedStyle(tile).boxShadow};
   });
   assert(boardVisual.boardBackground.includes('gradient'),'Puzzle has physical wooden board styling');
   assert.notEqual(boardVisual.tileShadow,'none','Blocks have raised tactile shadow');
   assert.equal(await page.locator('.room2-board-help summary').count(),1,'Rules are available without covering the board');
   assert.equal(await page.locator('.room2-hint-paper').count(),0,'Duplicated rules button is removed');
   assert.equal(await page.locator('.room2-board-help summary').textContent(),'？','Inline instructions are reduced to a help icon');
   assert.equal(await page.locator('.room2-wells-label,.room2-tray-label').count(),0,'No explanatory labels over the slots or tray');
   assert.equal(await page.locator('.room2-palette-token small').count(),0,'Colors are conveyed by blocks rather than repeated labels');
   assert.equal(await page.locator('.room2-answer-slot span').count(),0,'Empty slots look like physical wells');
   assert.equal(await page.locator('.room2-feedback').evaluate(node=>getComputedStyle(node).display),'none','Blank notification panel must be hidden');
   assert.equal(await page.locator('.room2-board-help').evaluate(node=>node.open),false,'Help starts closed');
   await page.locator('.room2-board-help summary').click();
   assert.equal(await page.locator('.room2-board-help').evaluate(node=>node.open),true,'Instructions can be revealed if requested');
   const initialHelp=await page.locator('.room2-board-help .room2-rule').textContent();
   assert(initialHelp.includes('【駒の操作】')&&initialHelp.includes('【判定】'),'Help has operation and HIT/BLOW explanation');
   assert(initialHelp.includes('回数制限はない。'),'First play stays unlimited');
   assert(initialHelp.includes('記号と色が一致し、位置だけが異なるとBLOW'),'BLOW rule is stated');
   assert.equal(await page.locator('.room2-puzzle').count(),1,'Opening help does not leave puzzle');
   await page.locator('.room2-board-help summary').click();
   assert.equal(await page.locator('.room2-board-help').evaluate(node=>node.open),false,'Help can be tucked away again');
   await page.locator('.room2-palette-token').first().click();
   assert.equal(await page.locator('.room2-answer-slot i').count(),1,'Selecting token fills a single answer slot');
   assert.equal(await page.locator('.room2-answer-slot.is-filled').count(),1,'Selected block is inserted into a slot');
   await page.screenshot({path:path.join(dir,'03-room02-block-fitted.png')});

   // Make the first guess certainly wrong to observe automatic judge dialogue.
   await page.evaluate(()=>{room2State.answer=ROOM2_SYMBOLS.map(symbol=>({symbol,color:'青'}));});
   for(let i=1;i<5;i++)await page.locator('.room2-palette-token[data-color="赤"]').nth(i).click();
   assert.equal(await page.locator('.room2-answer-slot.is-filled').count(),5);
   await page.locator('.room2-submit').click();
   await page.locator('.room2-reaction:not([hidden])').waitFor({state:'visible'});
   assert.equal(await page.locator('.room2-answer-slot.is-filled').count(),5,'All five fitted blocks stay after submission');
   await page.locator('.room2-submit').click();
   assert.equal(await page.locator('.room2-history-row').count(),1,'Identical answer does not add a history entry');
   assert.equal(await page.evaluate(()=>room2State.attempts),1,'Identical answer does not consume an attempt');
   assert.match(await page.locator('.room2-feedback').textContent(),/この配置は判定済みです/,'A short duplicate notice is shown');
   assert.equal(await page.locator('.room2-reaction-next').count(),0,'No manual next button');
   assert.equal(await page.locator('.room2-reaction-skip').count(),1,'Optional dismiss remains available');
   assert.equal(await page.locator('.room2-reaction-line').count(),2,'Both judgement lines appear simultaneously');
   assert.deepEqual(await page.locator('.room2-reaction-name').allTextContents(),['ハナ','主人公'],'Hana and protagonist share the same dialogue window');
   const paneBounds=await page.evaluate(()=>{
    const rect=s=>document.querySelector(s).getBoundingClientRect();
    const tray=rect('.room2-palette'),dialog=rect('.room2-reaction');
    return {trayRight:tray.right,dialogLeft:dialog.left};
   });
   assert(paneBounds.dialogLeft>=paneBounds.trayRight-3,'Dialogue pane must not overlap the block tray');
   assert.equal(await page.locator('.room2-palette-token').first().isDisabled(),false,'Board remains operable during dialogue');
   await page.locator('.room2-palette-token').first().click();
   assert.equal(await page.locator('.room2-answer-slot.is-filled').count(),4,'Board lets the player remove a fitted block during dialogue');
   assert.equal(await page.locator('.room2-reaction-line').count(),2,'Dialogue does not advance when player moves a block');
   await page.locator('.room2-palette-token').first().click();
   assert.equal(await page.locator('.room2-answer-slot.is-filled').count(),5,'Removed block can be reinserted without rebuilding the board');
   assert.equal(await page.locator('.room2-feedback').evaluate(node=>getComputedStyle(node).display),'none','Judgement is shown in history, not duplicate feedback');
   assert.match(await page.locator('.room2-history-row.is-latest').textContent(),/0H\s*0B/,'HIT/BLOW remain recorded in the latest history row');
   await page.screenshot({path:path.join(dir,'04-room02-auto-dialogue.png')});
   await page.locator('.room2-reaction').waitFor({state:'hidden',timeout:18000});
   assert.equal(await page.locator('.room2-answer-slot i').count(),5,'Autoplay ending does not remove submitted blocks');
   assert.equal(await page.locator('.room2-history-row').count(),1,'The result remains in the ledger');
   assert.equal(await page.locator('.room2-submit').isDisabled(),false,'Changed full placement can be submitted immediately');
   const previousPlacement=await page.evaluate(()=>JSON.stringify(room2State.guess));
   await page.locator('.room2-puzzle .device-close').click();
   await page.locator('#r2Blocks').click();
   assert.equal(await page.locator('.room2-answer-slot.is-filled').count(),5,'Closing and reopening retains the board');
   assert.equal(await page.evaluate(()=>JSON.stringify(room2State.guess)),previousPlacement,'Exact position and color are saved');
   await page.locator('.room2-submit').click();
   assert.equal(await page.locator('.room2-history-row').count(),2,'Changed placement receives a new result');
   assert.equal(await page.evaluate(()=>room2State.attempts),2,'Changed placement consumes exactly one attempt');
   await page.locator('.room2-submit').click();
   assert.equal(await page.evaluate(()=>room2State.attempts),2,'A repeat of any submitted configuration is free');
   await page.locator('.room2-puzzle .device-close').click();

   // No.104: five answers alone do not grant the leftmost clue.
   await page.evaluate(()=>{
    const base=room2State.history[0];
    room2State.attempts=5;
    room2State.history=Array.from({length:5},()=>({...base,hit:0,blow:1}));
    room2State.leftmostHintRevealed=false;
    saveGame();
   });
   await page.locator('#r2Blocks').click();
   assert.equal(await page.locator('.room2-leftmost-request').isVisible(),false,'Five results without a complete color match do not unlock the clue');
   await page.locator('.room2-puzzle .device-close').click();

   // A single HIT+BLOW=5 within the first five unlocks the optional clue.
   await page.evaluate(()=>{
    room2State.history[1]={...room2State.history[1],hit:1,blow:4};
    saveGame();
   });
   await page.locator('#r2Blocks').click();
   assert.equal(await page.locator('.room2-leftmost-request').isVisible(),true,'Any color-complete result within first five enables the clue');
   await page.locator('.room2-leftmost-request').click();
   assert.equal(await page.evaluate(()=>room2State.leftmostHintRevealed),true,'A requested clue is recorded in save state');
   assert.match(await page.locator('.room2-leftmost-hint').textContent(),/開示された左端の記号/);
   await page.locator('.room2-puzzle .device-close').click();
   await page.locator('#r2Blocks').click();
   assert.equal(await page.locator('.room2-leftmost-hint').isVisible(),true,'Reopening restores the revealed clue');
   assert.equal(await page.locator('.room2-leftmost-request').isVisible(),false,'The revealed clue cannot be requested twice');
   await page.locator('.room2-puzzle .device-close').click();
   await page.evaluate(()=>{room2State.unlocked=true;beginRoom2Challenge()});
   await page.locator('.room2-puzzle').waitFor();
   assert.equal(await page.locator('.room2-hint-paper').count(),0,'Challenge also has no duplicate rules button');
   await page.locator('.room2-board-help summary').click();
   const challengeHelp=await page.locator('.room2-board-help .room2-rule').textContent();
   assert(challengeHelp.includes('8回以内に5枠すべてを一致させれば達成'),'Challenge condition is retained');
   assert(challengeHelp.includes('何度でも再挑戦できる'),'Retry rule is retained');
   assert.equal(await page.locator('.room2-answer-slot').count(),5,'Help keeps the challenge board accessible');
   await page.locator('.room2-board-help summary').click();
   await page.evaluate(()=>{room2State.answer=ROOM2_SYMBOLS.map(symbol=>({symbol,color:'青'}));});
   for(let i=0;i<5;i++)await page.locator('.room2-palette-token[data-color="赤"]').nth(i).click();
   await page.locator('.room2-submit').click();
   assert.equal(await page.locator('.room2-answer-slot.is-filled').count(),5,'Challenge also retains placement');
   assert.equal(await page.evaluate(()=>room2State.attempts),1,'First challenge attempt is counted');
   await page.locator('.room2-submit').click();
   assert.equal(await page.evaluate(()=>room2State.attempts),1,'Duplicate cannot consume an 8-attempt challenge turn');
   assert.equal(await page.locator('.room2-attempt-left').textContent(),'残り7回');
   assert.equal(await page.locator('.room2-history-row').count(),1,'Duplicate cannot grow challenge history');
   await page.screenshot({path:path.join(dir,'05-room02-help-challenge.png')});

   // No.105: unlimited first play must accept a wrong tenth attempt and a subsequent correct answer.
   await page.evaluate(()=>showSecondRoom({
    doorInspected:true,deskInspected:true,
    answer:ROOM2_SYMBOLS.map(symbol=>({symbol,color:'青'})),
    attempts:9,history:[],guess:[],unlocked:false,challengeActive:false
   }));
   await page.locator('#r2Blocks').click();
   assert.equal(await page.locator('.room2-attempt-counter').count(),0,'Main story has no eight-turn counter');
   assert.equal(await page.locator('.room2-abandon').count(),0,'Main story never displays optional-challenge controls');
   const unlimitedHelp=await page.locator('.room2-board-help .room2-rule').textContent();
   assert(unlimitedHelp.includes('回数制限はない。'),'Main story rules are explicitly unlimited');
   for(let i=0;i<5;i++)await page.locator('.room2-palette-token[data-color="赤"]').nth(i).click();
   await page.locator('.room2-submit').click();
   assert.equal(await page.evaluate(()=>room2State.attempts),10,'A tenth incorrect main-story attempt is permitted');
   assert.equal(await page.locator('.room2-puzzle').count(),1,'A tenth failure never blocks the story puzzle');
   for(let i=0;i<5;i++)await page.locator('.room2-palette-token[data-color="青"]').nth(i).click();
   await page.locator('.room2-submit').click();
   assert.equal(await page.evaluate(()=>room2State.attempts),11,'A correct eleventh attempt is accepted');
   assert.equal(await page.locator('.room2-puzzle').count(),0,'Correct main-story answer starts the flashback dialogue flow');
   assert.equal(await page.locator('.room-dialog-overlay').count(),1,'Success proceeds to in-story conversation');

   // No.117: returning and starting from the room use the same compact panel as the result.
   await page.evaluate(()=>showSecondRoom({
    doorInspected:true,deskInspected:true,unlocked:true,flashbackSeen:true,
    challengeActive:false,challengeBest:3,challengeCleared:true,attempts:4,
    history:[{guess:ROOM2_SYMBOLS.map(symbol=>({symbol,color:'赤'})),hit:0,blow:0}]
   }));
   await page.locator('#r2Blocks').click();
   assert.equal(await page.locator('.room2-start-panel').count(),1,'Unlocked blocks open the new start panel');
   assert.equal(await page.locator('.room-dialog-overlay').count(),0,'Start does not open novel dialogue');
   assert.equal(await page.locator('.room2-choice-overlay').count(),0,'Start does not open a second choices panel');
   assert.match(await page.locator('.room2-start-panel .room2-result-attempts').textContent(),/8回以内に正しい組み合わせを導こう/);
   assert.match(await page.locator('.room2-start-panel .room2-result-best').textContent(),/自己ベスト：3回/);
   assert.match(await page.locator('.room2-start-panel .room2-result-note').textContent(),/何度でも挑戦できる/);
   assert.equal(await page.locator('.room2-start-panel .room2-result-actions button').count(),2,'Start and back appear together');
   const startBounds=await page.locator('.room2-start-panel').boundingBox();
   assert(startBounds&&startBounds.y>=0&&startBounds.y+startBounds.height<=spec.viewport.height+3,'Start panel fits the screen');
   await page.screenshot({path:path.join(dir,'09-room02-challenge-start.png')});
   assert.deepEqual(await page.evaluate(()=>({
    active:room2State.challengeActive,attempts:room2State.attempts,
    history:room2State.history.length,best:room2State.challengeBest
   })),{active:false,attempts:4,history:1,best:3},'The prompt does not reset progress by itself');
   await page.locator('.room2-start-return').click();
   assert.equal(await page.locator('.room2-start-panel').count(),0,'Return leaves without a second action');
   assert.deepEqual(await page.evaluate(()=>({
    active:room2State.challengeActive,attempts:room2State.attempts,
    history:room2State.history.length,best:room2State.challengeBest
   })),{active:false,attempts:4,history:1,best:3},'Cancelling keeps previous progress and best');

   await page.locator('#r2Blocks').click();
   await page.locator('.room2-start-confirm').click();
   assert.equal(await page.locator('.room2-start-panel').count(),0,'Start panel closes after confirmation');
   assert.equal(await page.locator('.room2-puzzle').count(),1,'Confirmation opens the challenge board immediately');
   assert.equal(await page.locator('.room-dialog-overlay').count(),0,'No novel text advance is required');
   assert.deepEqual(await page.evaluate(()=>({
    active:room2State.challengeActive,attempts:room2State.attempts,
    history:room2State.history.length,best:room2State.challengeBest
   })),{active:true,attempts:0,history:0,best:3},'Only confirmed start resets attempts and retains personal best');
   await page.locator('.room2-puzzle .device-close').click();

   // No.118: challenge abandonment asks in place, never destroys the board until confirmed.
   await page.evaluate(()=>showSecondRoom({
    doorInspected:true,deskInspected:true,unlocked:true,flashbackSeen:true,
    challengeActive:true,challengeBest:3,challengeCleared:true,attempts:4,
    history:[{guess:ROOM2_SYMBOLS.map(symbol=>({symbol,color:'赤'})),hit:0,blow:0}],
    guess:[{symbol:'〇',color:'赤'}],answer:ROOM2_SYMBOLS.map(symbol=>({symbol,color:'青'}))
   }));
   await page.locator('#r2Blocks').click();
   assert.equal(await page.locator('.room2-answer-slot.is-filled').count(),1,'Challenge progress is visible before quit confirmation');
   assert.equal(await page.locator('.room2-history-row').count(),1,'Earlier judge history is retained');
   await page.locator('.room2-abandon').click();
   assert.equal(await page.locator('.room2-abandon-confirm').count(),1,'Confirmation stays inside the puzzle');
   assert.equal(await page.locator('.room2-puzzle').count(),1,'The puzzle remains on screen');
   assert.equal(await page.locator('.room-dialog-overlay').count(),0,'No extra novel dialog is opened');
   assert.equal(await page.locator('.room2-choice-overlay').count(),0,'No second choice menu is opened');
   assert.match(await page.locator('.room2-abandon-panel').textContent(),/自己ベストは残ります/);
   assert.equal(await page.locator('.room2-abandon-panel button').count(),2,'Both choices are on one confirmation panel');
   const quitBounds=await page.locator('.room2-abandon-panel').boundingBox();
   assert(quitBounds&&quitBounds.y>=0&&quitBounds.y+quitBounds.height<=spec.viewport.height+3,'Quit confirmation is fully on screen');
   await page.screenshot({path:path.join(dir,'10-room02-challenge-abandon-confirm.png')});
   await page.keyboard.press('Tab');
   assert.equal(await page.evaluate(()=>Boolean(document.activeElement.closest('.room2-abandon-confirm'))),true,'Keyboard focus stays inside the confirmation');
   await page.locator('.room2-abandon-continue').click();
   assert.equal(await page.locator('.room2-abandon-confirm').count(),0,'Continue removes only the confirmation');
   assert.equal(await page.locator('.room2-puzzle').count(),1,'Same puzzle remains available');
   assert.equal(await page.locator('.room2-answer-slot.is-filled').count(),1,'Placement survives the cancellation');
   assert.equal(await page.locator('.room2-history-row').count(),1,'Judgement history survives the cancellation');
   assert.deepEqual(await page.evaluate(()=>({
    active:room2State.challengeActive,attempts:room2State.attempts,history:room2State.history.length,
    guess:room2State.guess.length,best:room2State.challengeBest
   })),{active:true,attempts:4,history:1,guess:1,best:3},'Cancelling the exit never alters progress or record');
   await page.locator('.room2-abandon').click();
   await page.keyboard.press('Escape');
   assert.equal(await page.locator('.room2-abandon-confirm').count(),0,'Esc cancels only the quit prompt');
   assert.equal(await page.locator('.room2-puzzle').count(),1,'Esc keeps the puzzle on screen');
   await page.locator('.room2-abandon').click();
   await page.locator('.room2-abandon-accept').click();
   assert.equal(await page.locator('.room2-puzzle').count(),0,'Only confirmed quit closes the puzzle');
   assert.equal(await page.locator('.room2-choice-overlay').count(),0);
   assert.equal(await page.locator('.room-dialog-overlay').count(),0);
   assert.deepEqual(await page.evaluate(()=>({
    active:room2State.challengeActive,attempts:room2State.attempts,history:room2State.history.length,
    guess:room2State.guess.length,best:room2State.challengeBest,storyClear:room2State.unlocked
   })),{active:false,attempts:0,history:0,guess:0,best:3,storyClear:true},'Confirmed quit clears challenge only, preserving story and best');

   // No.119: "一時中断" closes the puzzle only; the next desk visit resumes the same run.
   await page.evaluate(()=>showSecondRoom({
    doorInspected:true,deskInspected:true,unlocked:true,flashbackSeen:true,
    challengeActive:true,challengeBest:3,challengeCleared:true,attempts:2,
    history:[{guess:ROOM2_SYMBOLS.map(symbol=>({symbol,color:'赤'})),hit:0,blow:0}],
    guess:[{symbol:'〇',color:'赤'},{symbol:'△',color:'青'}],
    answer:ROOM2_SYMBOLS.map(symbol=>({symbol,color:'青'}))
   }));
   await page.locator('#r2Blocks').click();
   assert.equal(await page.locator('.room2-pause').count(),1,'The pause control is shown in active challenge');
   assert.equal(await page.locator('.room2-pause').textContent(),'一時中断','Pause is visible, not only a tooltip');
   assert.equal(await page.locator('.room2-pause').getAttribute('aria-label'),'一時中断');
   assert.equal(await page.locator('.room2-answer-slot.is-filled').count(),2);
   assert.equal(await page.locator('.room2-history-row').count(),1);
   assert.equal(await page.locator('.room2-attempt-left').textContent(),'残り6回');
   const pauseBounds=await page.locator('.room2-pause').boundingBox();
   const puzzleBounds=await page.locator('.room2-puzzle').boundingBox();
   await page.screenshot({path:path.join(dir,'11-room02-challenge-pausing.png')});
   assert(pauseBounds&&puzzleBounds&&pauseBounds.x>=puzzleBounds.x&&pauseBounds.x+pauseBounds.width<=puzzleBounds.x+puzzleBounds.width+3,'Pause control stays inside puzzle right edge: '+JSON.stringify({pauseBounds,puzzleBounds}));
   assert(pauseBounds.y>=puzzleBounds.y&&pauseBounds.y+pauseBounds.height<=puzzleBounds.y+puzzleBounds.height+3,'Pause control stays inside puzzle top edge: '+JSON.stringify({pauseBounds,puzzleBounds,scrollTop:await page.locator('.room2-puzzle').evaluate(el=>el.scrollTop)}));
   await page.locator('.room2-pause').click();
   assert.equal(await page.locator('.room2-puzzle').count(),0,'Pause returns to room without abandonment confirmation');
   assert.equal(await page.locator('.room2-abandon-confirm').count(),0);
   assert.equal(await page.locator('.room-dialog-overlay').count(),0);
   assert.deepEqual(await page.evaluate(()=>({
    active:room2State.challengeActive,attempts:room2State.attempts,
    best:room2State.challengeBest,history:room2State.history.length,guess:room2State.guess.length
   })),{active:true,attempts:2,best:3,history:1,guess:2},'Pause retains progress and personal best');
   await page.locator('#r2Blocks').click();
   assert.equal(await page.locator('.room2-puzzle').count(),1,'Clicking the desk blocks resumes instead of offering a new challenge');
   assert.equal(await page.locator('.room2-pause').count(),1);
   assert.equal(await page.locator('.room2-answer-slot.is-filled').count(),2,'Resumed puzzle restores selected blocks');
   assert.equal(await page.locator('.room2-history-row').count(),1,'Resumed puzzle restores history');
   assert.equal(await page.locator('.room2-attempt-left').textContent(),'残り6回','Resumed puzzle restores remaining attempts');
   await page.locator('.room2-pause').click();

   await page.evaluate(()=>showSecondRoom({doorInspected:true,deskInspected:true,unlocked:false,challengeActive:false}));
   await page.locator('#r2Blocks').click();
   assert.equal(await page.locator('.room2-pause').count(),0,'Story mode still has its ordinary close button');
   assert.equal(await page.locator('.room2-puzzle .device-close').getAttribute('aria-label'),'閉じる');
   await page.locator('.room2-puzzle .device-close').click();

   // No.105: the optional challenge starts only after unlock and accepts a correct eighth answer.
   await page.evaluate(()=>showSecondRoom({doorInspected:true,deskInspected:true,unlocked:true,flashbackSeen:true}));
   await page.evaluate(()=>{
    beginRoom2Challenge();
    room2State.answer=ROOM2_SYMBOLS.map(symbol=>({symbol,color:'青'}));
    room2State.attempts=7;
   });
   await page.locator('.room2-puzzle').waitFor();
   for(let i=0;i<5;i++)await page.locator('.room2-palette-token[data-color="青"]').nth(i).click();
   await page.locator('.room2-submit').click();
   const challengeResult=await page.evaluate(()=>({
    attempts:room2State.attempts,active:room2State.challengeActive,
    cleared:room2State.challengeCleared,best:room2State.challengeBest,
    unlocked:room2State.unlocked,flashbackSeen:room2State.flashbackSeen
   }));
   assert.deepEqual(challengeResult,{attempts:8,active:false,cleared:true,best:8,unlocked:true,flashbackSeen:true},'An eighth-turn challenge success records a best without affecting story progress');

   // No.116: result, best and actions share a screen without text advance.
   await page.locator('.room2-result-panel').waitFor();
   assert.equal(await page.locator('.room-dialog-overlay').count(),0,'Challenge result skips novel dialogue');
   assert.equal(await page.locator('.room2-choice-overlay').count(),0,'Challenge result skips separate choice menu');
   assert.match(await page.locator('.room2-result-title').textContent(),/チャレンジ達成！/);
   assert.match(await page.locator('.room2-result-attempts').textContent(),/8回で正解した/);
   assert.match(await page.locator('.room2-result-best').textContent(),/自己ベスト更新！.*8回/);
   assert.equal(await page.locator('.room2-result-actions button').count(),2,'Retry and return appear together');
   const resultBounds=await page.locator('.room2-result-panel').boundingBox();
   assert(resultBounds&&resultBounds.y>=0&&resultBounds.y+resultBounds.height<=spec.viewport.height+3,'Result panel fits screen');
   await page.screenshot({path:path.join(dir,'07-room02-challenge-success-result.png')});

   await page.locator('.room2-result-retry').click();
   assert.equal(await page.locator('.room2-result-panel').count(),0,'Retry dismisses result directly');
   assert.equal(await page.locator('.room2-puzzle').count(),1,'Retry immediately begins a fresh challenge');
   assert.deepEqual(await page.evaluate(()=>({
    active:room2State.challengeActive,attempts:room2State.attempts,best:room2State.challengeBest,history:room2State.history.length
   })),{active:true,attempts:0,best:8,history:0},'Retry keeps the record and resets answer history');
   await page.locator('.room2-puzzle .device-close').click();

   // A final failed answer still displays its two-line reaction before showing the one-panel result.
   await page.evaluate(()=>showSecondRoom({
    doorInspected:true,deskInspected:true,unlocked:true,flashbackSeen:true,
    challengeActive:true,challengeBest:8,challengeCleared:true,attempts:7,history:[],guess:[],
    answer:ROOM2_SYMBOLS.map(symbol=>({symbol,color:'青'}))
   }));
   await page.locator('#r2Blocks').click();
   for(let i=0;i<5;i++)await page.locator('.room2-palette-token[data-color="赤"]').nth(i).click();
   await page.locator('.room2-submit').click();
   assert.equal(await page.evaluate(()=>room2State.attempts),8);
   assert.equal(await page.locator('.room2-reaction-line').count(),2,'Last incorrect judgement remains two lines');
   await page.locator('.room2-reaction-skip').click();
   await page.locator('.room2-result-panel').waitFor();
   assert.equal(await page.locator('.room-dialog-overlay').count(),0,'Failure result needs no novel window');
   assert.match(await page.locator('.room2-result-title').textContent(),/今回は達成できなかった/);
   assert.match(await page.locator('.room2-result-attempts').textContent(),/8回の挑戦が終わった/);
   assert.match(await page.locator('.room2-result-best').textContent(),/自己ベスト：8回/);
   assert.equal(await page.locator('.room2-result-actions button').count(),2);
   await page.screenshot({path:path.join(dir,'08-room02-challenge-failure-result.png')});
   await page.locator('.room2-result-return').click();
   assert.equal(await page.locator('.room2-result-panel').count(),0,'Return closes the result without extra narration');
   assert.equal(await page.locator('.room2-choice-overlay').count(),0,'Return needs no extra selection');
   assert.equal(await page.locator('#r2Blocks').count(),1,'The solved room is available again');

   // No.110: a player may inspect the desk before the front door.
   await page.evaluate(()=>showSecondRoom({doorInspected:false,deskInspected:false}));
   assert.equal(await page.evaluate(()=>room2State.doorInspected),false,'Door starts unexplored');
   assert.equal(await page.locator('#r2Blocks').isDisabled(),true,'Puzzle is initially gated by desk inspection only');
   await page.locator('#r2Desk').click();
   assert.deepEqual(await page.evaluate(()=>({
    door:room2State.doorInspected,desk:room2State.deskInspected,
    puzzleEnabled:!document.getElementById('r2Blocks').disabled
   })),{door:false,desk:true,puzzleEnabled:true},'Desk-first inspection unlocks the physical puzzle without touching the door');
   for(let i=0;i<20&&await page.locator('.room-dialog-overlay').count();i++){
    await page.locator('#roomNextButton').click();
   }
   assert.equal(await page.locator('.room-dialog-overlay').count(),0,'Desk description can finish without a door prerequisite');
   await page.locator('#r2Blocks').click();
   assert.equal(await page.locator('.room2-puzzle').count(),1,'Puzzle opens while door remains uninspected');
   assert.equal(await page.evaluate(()=>room2State.doorInspected),false,'Opening the puzzle never secretly inspects the door');
   await page.locator('.room2-puzzle .device-close').click();
   await page.locator('#r2Door').click();
   assert.equal(await page.evaluate(()=>room2State.doorInspected),true,'Front door can still be inspected after the desk');

   await page.evaluate(()=>showSecondRoom({doorInspected:false,deskInspected:false}));
   await page.locator('#r2Door').click();
   assert.deepEqual(await page.evaluate(()=>({
    door:room2State.doorInspected,desk:room2State.deskInspected
   })),{door:true,desk:false},'The original door-first route also remains available');
   // No.111: the room conversation does not presuppose inspecting either object.
   for(const explored of [false,true]){
    await page.evaluate(flag=>showSecondRoom({doorInspected:flag,deskInspected:flag}),explored);
    await page.locator('#r2Hana').click();
    assert.equal(await page.locator('.hana-choice-button[data-topic="room"]').count(),1,'Room topic is always available');
    // The in-game design layer deliberately rejects clicks during the first 250 ms after a choice appears.
    await page.waitForTimeout(360);
    await page.locator('.hana-choice-button[data-topic="room"]').click();
    assert.equal(await page.locator('.room-dialog-overlay').count(),1,'Room topic launches a conversation');
    assert.equal(await page.locator('.room-dialog-overlay .message').textContent(),'この部屋、何か仕掛けがありそうだね','Hana does not reveal uninspected clues');
    await page.locator('#roomNextButton').click();
    assert.equal(await page.locator('.room-dialog-overlay .message').textContent(),'気になるところから調べてみます','Protagonist chooses what to inspect');
    await page.locator('#roomNextButton').click();
    assert.equal(await page.locator('.room-dialog-overlay').count(),0,'Room topic ends normally');
   }
   // No.112: do not offer an unknown judgement term before the desk is inspected.
   await page.evaluate(()=>showSecondRoom({doorInspected:true,deskInspected:false}));
   await page.locator('#r2Hana').click();
   assert.equal(await page.locator('.hana-choice-button[data-topic="rules"]').count(),0,'Rules question hidden before desk inspection, even after visiting the door');
   assert.equal(await page.locator('.hana-choice-button[data-topic="room"]').count(),1,'General room conversation is still available');
   await page.locator('.hana-choice-overlay .device-close').click();
   await page.evaluate(()=>showSecondRoom({doorInspected:false,deskInspected:true}));
   await page.locator('#r2Hana').click();
   assert.equal(await page.locator('.hana-choice-button[data-topic="rules"]').count(),1,'Desk inspection alone reveals the HIT/BLOW question');
   await page.waitForTimeout(360);
   await page.locator('.hana-choice-button[data-topic="rules"]').click();
   // Dialogue is paginated at sentence boundaries; collect each page rather than assuming one line fits.
   const rulesPages=[];
   for(let n=0;n<12&&await page.locator('.room-dialog-overlay').count();n++){
    rulesPages.push(await page.locator('.room-dialog-overlay .message').textContent());
    await page.locator('#roomNextButton').click();
   }
   assert.equal(await page.locator('.room-dialog-overlay').count(),0,'Rules exchange completes without a door visit');
   const combinedRules=rulesPages.join('');
   assert(combinedRules.includes('HITは記号・色・位置が全部合っているもの。'),'HIT rule is preserved in the paginated dialogue');
   assert(combinedRules.includes('BLOWは記号と色が合っていて、位置だけ違うものだよ'),'BLOW rule is preserved in the paginated dialogue');
   assert(combinedRules.includes('判定を比べながら、合っている組み合わせを絞っていくんですね'),'Protagonist response still follows the rules');

   // No.113: only an unsuccessful judgement makes strategy advice meaningful.
   await page.evaluate(()=>showSecondRoom({doorInspected:false,deskInspected:true,unlocked:false,attempts:0,history:[]}));
   await page.locator('#r2Hana').click();
   assert.equal(await page.locator('.hana-choice-button[data-topic="hint"]').count(),0,'Strategy hint is hidden before the first answer');
   assert.equal(await page.locator('.hana-choice-button[data-topic="rules"]').count(),1,'Rules remain available after desk inspection');
   await page.locator('.hana-choice-overlay .device-close').click();

   await page.evaluate(()=>showSecondRoom({
    doorInspected:false,deskInspected:true,unlocked:false,attempts:1,
    history:[{guess:ROOM2_SYMBOLS.map(symbol=>({symbol,color:'青'})),hit:0,blow:1}]
   }));
   await page.locator('#r2Hana').click();
   assert.equal(await page.locator('.hana-choice-button[data-topic="hint"]').count(),1,'First incorrect judgement enables strategy advice');
   await page.waitForTimeout(360);
   await page.locator('.hana-choice-button[data-topic="hint"]').click();
   const advicePages=[];
   for(let n=0;n<12&&await page.locator('.room-dialog-overlay').count();n++){
    advicePages.push(await page.locator('.room-dialog-overlay .message').textContent());
    await page.locator('#roomNextButton').click();
   }
   assert.equal(await page.locator('.room-dialog-overlay').count(),0,'Advice can be read and dismissed');
   assert(advicePages.join('').includes('まずは一つずつ変えて、前の判定と比べてみよう'),'Existing Hana advice is unchanged');

   await page.evaluate(()=>showSecondRoom({doorInspected:false,deskInspected:true,unlocked:true,history:[{guess:ROOM2_SYMBOLS.map(symbol=>({symbol,color:'青'})),hit:0,blow:1}]}));
   await page.locator('#r2Hana').click();
   assert.equal(await page.locator('.hana-choice-button[data-topic="hint"]').count(),0,'The story-cleared state cannot offer the old hint');
   await page.locator('.hana-choice-overlay .device-close').click();

   // No.114: Hana recalls clearing the room after the door is unlocked.
   await page.evaluate(()=>showSecondRoom({doorInspected:true,deskInspected:true,unlocked:true,flashbackSeen:true}));
   await page.locator('#r2Hana').click();
   assert.equal(await page.locator('.hana-choice-button[data-topic="room"]').count(),1,'The room topic remains available after the clear');
   await page.waitForTimeout(360); // Avoid the design layer's deliberate accidental-tap guard.
   await page.locator('.hana-choice-button[data-topic="room"]').click();
   assert.equal(await page.locator('.room-dialog-overlay').count(),1,'Room-clear conversation opens normally');
   assert.equal(await page.locator('.room-dialog-overlay .message').textContent(),'この部屋の仕掛け、解けたね！','Hana acknowledges that the room was solved');
   const clearedRoomPages=[];
   for(let n=0;n<8&&await page.locator('.room-dialog-overlay').count();n++){
    clearedRoomPages.push(await page.locator('.room-dialog-overlay .message').textContent());
    await page.locator('#roomNextButton').click();
   }
   assert.equal(await page.locator('.room-dialog-overlay').count(),0,'Clear conversation closes normally');
   const clearText=clearedRoomPages.join('');
   assert(clearText.includes('この部屋の仕掛け、解けたね！'),'Clear conversation retains Hana confirmation');
   assert(clearText.includes('はい。次へ進めそうです'),'The protagonist acknowledges the unlocked door across dialogue pages');

   // No.115: challenge milestone reactions replace, never append to, normal HIT/BLOW dialogue.
   const milestoneText=new Map([
    [4,['あと4回だね。焦らずいこう！','はい。今までの判定を整理してみます']],
    [6,['あと2回……！　結果を見直してみよう','……そうですね。慎重に考えます']],
    [7,['あと1回……！　落ち着いていこう','はい。今までの結果を見直します']]
   ]);
   for(const [turn,dialogue] of milestoneText){
    await page.evaluate(attempt=>showSecondRoom({
     doorInspected:true,deskInspected:true,unlocked:true,flashbackSeen:true,
     challengeActive:true,attempts:attempt-1,history:[],guess:[],
     answer:ROOM2_SYMBOLS.map(symbol=>({symbol,color:'青'}))
    }),turn);
    await page.locator('#r2Blocks').click();
    assert.equal(await page.locator('.room2-attempt-counter').count(),1,'Challenge counter appears');
    for(let i=0;i<5;i++)await page.locator('.room2-palette-token[data-color="赤"]').nth(i).click();
    await page.locator('.room2-submit').click();
    assert.equal(await page.evaluate(()=>room2State.attempts),turn,'Challenge increment is recorded');
    assert.equal(await page.locator('.room2-history-row').count(),1,'HIT/BLOW history still records the result');
    assert.match(await page.locator('.room2-history-row').textContent(),/0H\s*0B/);
    assert.equal(await page.locator('.room2-reaction-line').count(),2,'Only the milestone pair is shown');
    assert.deepEqual(await page.locator('.room2-reaction-name').allTextContents(),['ハナ','主人公']);
    assert.deepEqual(await page.locator('.room2-reaction-speech').allTextContents(),dialogue,'Milestone text replaces the standard judge lines');
    assert.equal(await page.locator('.room2-answer-slot.is-filled').count(),5,'All fitted tokens remain available');
    assert.equal(await page.locator('.room2-palette-token').first().isDisabled(),false,'The player can still manipulate blocks');
    if(turn===7)await page.screenshot({path:path.join(dir,'06-room02-challenge-milestone.png')});
    await page.locator('.room2-puzzle .device-close').click();
   }

   assert.deepEqual(errors,[],'No JavaScript runtime errors');
   console.log(JSON.stringify({case:spec.name,status:'PASS',image,layering,stage:bounds.stage,hotspots:{door:bounds.door,desk:bounds.desk,blocks:bounds.blocks,hana:bounds.hana},hanaPlacement,palette:10,slots:5,errors}));
   await context.close();
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});