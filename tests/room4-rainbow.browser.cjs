"use strict";
const assert=require("node:assert/strict");
const {chromium}=require(process.env.PLAYWRIGHT_PATH||"playwright");
const fs=require("node:fs");
const path=require("node:path");
const base=process.env.BASE_URL||"http://127.0.0.1:8765";
const screenshots=process.env.ARTIFACT_DIR||"artifacts/rainbow-review";
fs.mkdirSync(screenshots,{recursive:true});

function tokens(values){
 return values.map(v=>v.slice(0,-1)+v.slice(-1));
}
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
 try{
  for(const viewport of [{width:1280,height:720},{width:852,height:393}]){
   const page=await browser.newPage({viewport,reducedMotion:"reduce"});
   const errors=[];page.on("pageerror",error=>errors.push(error.message));
   // The first-run guide is a separate modal; test the puzzle without covering it.
   await page.addInitScript(()=>localStorage.setItem("saigononazo-help-seen","1"));
   await page.goto(base,{waitUntil:"load"});
   // Regression: the very first entry must fill the same 16:9 stage as a reload.
   await page.evaluate(()=>{settings.instantText=true;showFourthRoom()});
   await page.waitForFunction(()=>{
    const el=document.getElementById('r4Hana'),stage=document.querySelector('.room4-stage');
    if(!el||!stage)return false;
    const width=stage.getBoundingClientRect().width;
    const idle=getComputedStyle(el,'::before'),gaze=getComputedStyle(el.querySelector('.r4-hana-look-pose'));
    return width>0&&['width','height','bottom'].every((name,i)=>{
     const expected=width*[.26,.405,-.050625][i];
     return Math.abs(parseFloat(idle[name])-expected)<1
      &&Math.abs(parseFloat(idle[name])-parseFloat(gaze[name]))<1;
    });
   },null,{timeout:3000});
   const entry=await page.evaluate(()=>{
    const canvas=document.querySelector('#game-container').getBoundingClientRect();
    const stage=document.querySelector('.room4-stage').getBoundingClientRect();
    const idle=getComputedStyle(document.getElementById('r4Hana'),'::before');
    const gaze=getComputedStyle(document.querySelector('#r4Hana .r4-hana-look-pose'));
    return {canvasWidth:canvas.width,stageWidth:stage.width,stageX:stage.x,canvasX:canvas.x,
      idleWidth:parseFloat(idle.width),idleHeight:parseFloat(idle.height),
      gazeWidth:parseFloat(gaze.width),gazeHeight:parseFloat(gaze.height)};
   });
   console.log('ROOM4_HANA_ENTRY '+viewport.width+' '+JSON.stringify(entry));
   assert(Math.abs(entry.stageWidth-entry.canvasWidth)<1,'Initial Room 4 stage must fill the game canvas');
   assert(Math.abs(entry.stageX-entry.canvasX)<1,'Initial Room 4 stage must not have side margins');
   assert(Math.abs(entry.idleWidth-entry.canvasWidth*.26)<1,'Initial Hana width must match stage depth');
   assert(Math.abs(entry.idleHeight-entry.canvasWidth*.405)<1,'Initial Hana height must match stage depth');
   assert(Math.abs(entry.gazeWidth-entry.idleWidth)<1&&Math.abs(entry.gazeHeight-entry.idleHeight)<1,'Initial gaze canvas must match idle');
   await page.evaluate(()=>{
    Dialogue.stop();
    showFourthRoom({view:"back",door:true,hanaSleepSeen:true});
    for(let i=0;i<20&&document.querySelector("#roomNextButton");i++)Dialogue.advance();
   });
   const gazeSizing=await page.locator('#r4Hana').evaluate(el=>{
    const rect=sel=>{const b=document.querySelector(sel)?.getBoundingClientRect();return b?{width:b.width,height:b.height,x:b.x,y:b.y}:null};
    const idle=getComputedStyle(el,'::before'),gaze=getComputedStyle(el.querySelector('.r4-hana-look-pose'));
    return {container:rect('#game-container'),game:rect('#game'),wrap:rect('.room-stage-wrap'),stage:rect('.room4-stage'),hana:rect('#r4Hana'),idle:{width:idle.width,height:idle.height,bottom:idle.bottom},gaze:{width:gaze.width,height:gaze.height,bottom:gaze.bottom},ready:document.querySelector('#game').className};
   });
   console.log('ROOM4_HANA_FAST_DIAGNOSTIC '+viewport.width+' '+JSON.stringify(gazeSizing));
   const roomWidth=gazeSizing.stage.width;
   for(const [key,scale] of [['width',.26],['height',.405],['bottom',-.050625]]){
    const actual=parseFloat(gazeSizing.idle[key]);
    assert(Math.abs(actual-roomWidth*scale)<1,'Room 4 Hana idle '+key+' must track visible room width ('+viewport.width+'): '+JSON.stringify(gazeSizing));
    assert(Math.abs(actual-parseFloat(gazeSizing.gaze[key]))<1,'Hana gaze must match idle '+key);
   }
   await page.locator('.room-stage-wrap').evaluate(el=>el.style.width='calc(100% - 48px)');
   await page.waitForFunction(()=>{
    const stage=document.querySelector('.room4-stage').getBoundingClientRect();
    const idle=getComputedStyle(document.getElementById('r4Hana'),'::before');
    return Math.abs(parseFloat(idle.height)-stage.width*.405)<1;
   },null,{timeout:4000});
   await page.locator('.room-stage-wrap').evaluate(el=>el.style.removeProperty('width'));
   await page.waitForFunction(()=>{
    const stage=document.querySelector('.room4-stage').getBoundingClientRect();
    const idle=getComputedStyle(document.getElementById('r4Hana'),'::before');
    return Math.abs(parseFloat(idle.height)-stage.width*.405)<1;
   },null,{timeout:4000});
   const opener=page.locator("#r4P3");
   await opener.click();
   const plates=page.locator(".r4-rainbow-plate");
   assert.equal(await plates.count(),7,"Exactly seven physical plates");
   assert.equal(await page.locator(".r4-rainbow button[data-d]").count(),0,"No old up/down button interface");
   const order=()=>plates.evaluateAll(nodes=>nodes.map(n=>n.dataset.plate));
   assert.equal(await page.locator(".r4-rainbow-color").count(),0,"Color is shown by the plate, not spelled out");
   assert((await plates.nth(0).evaluate(el=>parseFloat(getComputedStyle(el.querySelector(".r4-rainbow-letter")).fontWeight)))>=800,"Letters use heavy type");
   const initial=await order();
   assert.deepEqual(initial,["青O","赤M","紫S","黄T","藍R","橙E","緑E"]);
   const frame=await page.locator(".r4-plate-exhibit").boundingBox();
   const rectangles=await plates.evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.left,y:r.top,right:r.right,bottom:r.bottom}}));
   assert(frame.x>=-1&&frame.y>=-1&&frame.x+frame.width<=viewport.width+1&&frame.y+frame.height<=viewport.height+1,
     "Exhibit must fit viewport: "+JSON.stringify({viewport,frame}));
   for(const r of rectangles)assert(r.x>=frame.x&&r.y>=frame.y&&r.right<=frame.x+frame.width+1&&r.bottom<=frame.y+frame.height+1,
     "All colored plates must stay inside rail");
   await page.screenshot({path:path.join(screenshots,"rainbow-before-"+viewport.width+".png")});
   // Pointer interaction drags the first plate into the third slot.
   const source=await plates.nth(0).boundingBox(),destination=await plates.nth(2).boundingBox();
   const center=r=>({x:r.x+r.width/2,y:r.y+r.height/2});
   const a=center(source),b=center(destination);
   await page.mouse.move(a.x,a.y);
   await page.mouse.down();
   await page.mouse.move(b.x,b.y,{steps:12});
   await page.mouse.up();
   assert.deepEqual(await order(),["赤M","紫S","青O","黄T","藍R","橙E","緑E"],"Drag must move the physical plate, not just highlight it");
   assert.equal(await page.locator(".r4-rainbow-plate.is-selected").count(),0,"Pointer drag must not also select an item");
   // Tap/click to select one and place it in a new slot works on mobile and keyboard.
   const goal=["赤M","橙E","黄T","緑E","青O","藍R","紫S"];
   for(const [index,wanted] of goal.entries()){
    const values=await order(),from=values.indexOf(wanted);
    if(from===index)continue;
    await plates.nth(from).click();
    assert.equal(await plates.nth(from).getAttribute("aria-pressed"),"true","Selected plate reports its state");
    await plates.nth(index).click();
    if((await page.locator(".r4-plate-exhibit").count())===0)break;
   }
   assert.equal(await page.evaluate(()=>room4State.meteors),true,"Correct color order triggers original solution");
   assert.deepEqual(await page.evaluate(()=>room4State.rainbow),goal,"Saved order remains correct");
   assert.equal(await page.locator(".r4-rainbow-plate").count(),7,"Completed color arrangement remains visible after success");
   assert.equal(await page.locator(".r4-plate-overlay.is-solved").count(),1,"The solved exhibit stays open before the light-up effect");
   assert.equal(await page.locator(".room-dialog-overlay").count(),0,"Award dialogue must not replace the successful board immediately");
   await page.screenshot({path:path.join(screenshots,"rainbow-completed-"+viewport.width+".png")});
   const solvedAt=Date.now();
   await page.locator(".r4-plate-overlay.is-revealing").waitFor({timeout:2500});
   assert.equal(await page.locator(".r4-rainbow-plate").count(),7,"All seven cards remain visible through the victory glow");
   await page.locator(".r4-plate-overlay").waitFor({state:"detached",timeout:6000});
   assert(Date.now()-solvedAt>=2900,"Glowing rainbow must remain visible for several seconds after settling");
   await page.locator(".room-dialog-overlay").waitFor({timeout:2500});
   assert(await page.evaluate(()=>GameLog?.list?.().some(entry=>/METEORS/.test(entry.text||""))||!!document.querySelector(".room-dialog-overlay")),"Original completion dialogue starts after animation");
   await page.evaluate(()=>{for(let i=0;i<60&&document.querySelector("#roomNextButton");i++)Dialogue.advance()});
   const popup=page.locator('.design-overlay .design-panel[aria-label="入手"]');
   await popup.waitFor({timeout:2500});
   const glass=popup.locator('img.design-pickup-image');
   assert.equal(await glass.count(),1,"Acquisition shows a real glass pane image");
   assert.equal(await glass.getAttribute('src'),'images/exhibits/room04/virgo-panels/virgo-panel-03.svg',"Rainbow puzzle awards the correct glass pane");
   assert(await glass.evaluate(async img=>{await img.decode();return img.naturalWidth>0}),"Glass image must decode");
   assert.equal(await popup.getByText(/現在.*枚|[0-9]+\s*\/\s*5/).count(),0,"No acquisition tally in image popup");
   await page.screenshot({path:path.join(screenshots,'glass-awarded-'+viewport.width+'.png')});
   await popup.getByRole('button',{name:'閉じる',exact:true}).last().click();
   await page.locator('.design-overlay').waitFor({state:'detached'});
   const countLog=()=>page.evaluate(()=>GameLog.list().length);
   const rewardLogCount=await countLog();
   // Completed rainbow exhibit can be opened repeatedly, with no second reward.
   await page.locator('#r4P3').click();
   assert.equal(await page.locator('.r4-plate-overlay.is-inspection').count(),1,'Completed rainbow opens again as an inspection');
   assert.equal(await page.locator('.r4-rainbow-plate').count(),7);
   assert.deepEqual(await order(),goal,'Completed color arrangement is preserved on reinspection');
   assert.equal(await page.locator('.r4-rainbow-plate:disabled').count(),7,'Cleared plates cannot be moved a second time');
   assert.equal(await page.locator('.r4-plate-overlay.is-revealing').count(),0,'No repeat of the victory animation');
   await page.screenshot({path:path.join(screenshots,'rainbow-revisited-'+viewport.width+'.png')});
   await page.locator('.r4-plate-overlay .device-close').click();
   assert.equal(await page.locator('.design-overlay,.room-dialog-overlay').count(),0,'Reinspection closes without an award');
   assert.equal(await countLog(),rewardLogCount,'Reinspection must not create reward or conversation entries');
   assert.deepEqual(await page.evaluate(()=>room4State.rainbow),goal,'The saved arrangement must not be modified');
   // The word puzzles also reopen: original exhibit, solved answer, no entry controls.
   const reviewWord=async(id,kind,expectedGlass)=>{
    const beforeLog=await countLog();
    await page.locator(id).click();
    const review=page.locator('.r4-mini-inspected');
    assert.equal(await review.count(),1,kind+' should reopen in solved inspection mode');
    assert.equal(await review.locator('.r4-solved-answer span').textContent(),kind,'Previously submitted word remains visible');
    assert.equal(await review.locator('input,.r4-answer').count(),0,'No re-answer controls after solving');
    assert.equal(await review.locator(kind==='STAR'?'.r4-color-samples':'.r4-ratio-specimens').count(),1,'Accepted exhibit remains visible');
    if(kind==='LIGHT'){
     assert.equal(await review.locator('.r4-ratio-specimen').count(),5,'All five accepted ratio clues remain visible');
     assert((await review.locator('.r4-ratio-sample span').allTextContents()).includes('0.02%'),'The small emblem color keeps its numeric percentage');
    }
    await review.locator('.device-close').click();
    assert.equal(await page.locator('.room-dialog-overlay,.design-overlay').count(),0,'Solved word inspection gives no new dialog');
    assert.equal(await countLog(),beforeLog,'Solved word inspection gives no new award');
   };
   const solveWord=async(id,kind,expectedGlass)=>{
    await page.locator(id).click();
    if(kind==='STAR'){
     const exhibit=page.locator('.r4-color-exhibit');
     assert.equal(await exhibit.count(),1,'The first mini-puzzle uses its physical exhibition case');
     const plaques=exhibit.locator('.r4-color-plaque');
     assert.deepEqual(await plaques.locator('b').allTextContents(),['1','4','3','2'],'Original number sequence must remain unchanged');
     const palettes=await plaques.evaluateAll(items=>items.map(el=>getComputedStyle(el).backgroundImage));
     assert.equal(new Set(palettes).size,4,'Silver, white, black and green materials must have distinct finishes');
     assert.equal(await exhibit.locator('.r4-color-label').count(),0,'Color names are not given away as text');
     assert.equal(await exhibit.locator('.r4-color-samples').count(),1);
     const frame=await exhibit.boundingBox();
     const tileBoxes=await plaques.evaluateAll(items=>items.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom}}));
     for(const tile of tileBoxes)assert(tile.x>=frame.x&&tile.y>=frame.y&&tile.right<=frame.x+frame.width+1&&tile.bottom<=frame.y+frame.height+1,'Color plaque stays in exhibit');
     assert.equal(await exhibit.locator('input').evaluate(el=>el===document.activeElement),false,'Do not open mobile keyboard automatically');
     assert.equal(await exhibit.locator('.r4-answer').textContent(),'解錠');
     await page.screenshot({path:path.join(screenshots,'color-exhibit-'+viewport.width+'.png')});
    }
    await page.locator('.r4-mini input').fill(kind);
    await page.locator('.r4-answer').click();
    await page.locator('.room-dialog-overlay').waitFor({timeout:2500});
    await page.evaluate(()=>{for(let i=0;i<70&&document.querySelector('#roomNextButton');i++)Dialogue.advance()});
    const item=page.locator('.design-overlay .design-panel[aria-label="入手"]');
    await item.waitFor({timeout:2500});
    const img=item.locator('img.design-pickup-image');
    assert.equal(await img.getAttribute('src'),expectedGlass,'Correct image rewarded for '+kind);
    await item.getByRole('button',{name:'閉じる',exact:true}).last().click();
    await page.locator('.design-overlay').waitFor({state:'detached'});
    await reviewWord(id,kind,expectedGlass);
   };
   await solveWord('#r4P2','LIGHT','images/exhibits/room04/virgo-panels/virgo-panel-02.svg');
   await page.locator('#r4TurnLeft').click();
   await solveWord('#r4P1','STAR','images/exhibits/room04/virgo-panels/virgo-panel-01.svg');
   assert.deepEqual(errors,[],"Reinspections must not generate JavaScript errors");
   await page.close();
  }
  console.log("PASS: Room 04 physical rainbow, drag/tap, colors, solution and landscape layout");
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});

