const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const base=process.env.BASE_URL||'https://bqlohakuto.github.io/saigononazo/';
const shots=process.env.ARTIFACT_DIR||'artifacts/room04/projection';
fs.mkdirSync(shots,{recursive:true});
async function finish(page){
 for(let i=0;i<80&&await page.locator('#roomNextButton').count();i++)await page.locator('#roomNextButton').click({force:true});
 assert.equal(await page.locator('.room-dialog-overlay').count(),0);
}
async function enter(page,state){
 await page.evaluate(state=>{showFourthRoom({view:'left',door:true,hanaSleepSeen:true,panelRotationVersion:1,...state});},state);
 await finish(page);
 await page.locator('#r4Background').evaluate(img=>img.decode());
 await page.locator('#r4LightOverlay').evaluate(img=>img.decode());
}
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{channel:'chrome'})});
 try{
  for(const viewport of [{width:1280,height:720},{width:852,height:393}]){
   const page=await browser.newPage({viewport,reducedMotion:'reduce'}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>localStorage.setItem('saigononazo-help-seen','1'));
   await page.goto(base,{waitUntil:'load',timeout:90000});
   await page.evaluate(()=>settings.instantText=true);
   await enter(page,{});
   await page.locator('#r4Stand').click();
   assert.equal(await page.locator('.r4-panel-overlay').count(),1,'Empty apparatus opens before any panes are found');
   assert.equal(await page.locator('.r4-rotate-plate:disabled').count(),5);
   assert.equal(await page.locator('.r4-panel-stack img:not([hidden])').count(),0);
   await page.locator('.r4-shine').click();
   assert.equal(await page.locator('.r4-projected-star').count(),0,'Empty light has no ghost stars');
   await page.screenshot({path:path.join(shots,'empty-apparatus-'+viewport.width+'.png')});
   await page.locator('.r4-panel-ui .device-close').click();
   assert(await page.locator('#r4LightOverlay').isVisible());
   await page.screenshot({path:path.join(shots,'empty-wall-'+viewport.width+'.png')});
   await enter(page,{star:true,lightOn:true});
   assert.equal(await page.locator('.r4-projected-star').count(),0,'Ownership alone does not project');
   await page.locator('#r4Stand').click();
   assert.equal(await page.locator('.r4-rotate-plate:enabled').count(),1);
   await page.locator('.r4-rotate-plate img').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));
   await page.locator('.r4-rotate-plate').nth(0).click();
   assert.equal(await page.locator('.r4-panel-stack img:not([hidden])').count(),1);
   assert.equal(await page.locator('.r4-projected-star').count(),3,'One mounted pane projects its three real stars');
   const before=await page.locator('.r4-projected-star').evaluateAll(stars=>stars.map(s=>[s.getAttribute('cx'),s.getAttribute('cy')]));
   await page.locator('.r4-rotate-plate').nth(0).click();
   const after=await page.locator('.r4-projected-star').evaluateAll(stars=>stars.map(s=>[s.getAttribute('cx'),s.getAttribute('cy')]));
   assert.notDeepEqual(after,before,'Rotation updates the lit wall immediately');
   await page.locator('.r4-shine').click();
   assert.equal(await page.evaluate(()=>room4State.completed),false);
   await page.screenshot({path:path.join(shots,'partial-apparatus-'+viewport.width+'.png')});
   await page.locator('.r4-panel-ui .device-close').click();
   await page.screenshot({path:path.join(shots,'partial-wall-'+viewport.width+'.png')});
   const saved=await page.evaluate(()=>JSON.parse(JSON.stringify(room4State)));
   await enter(page,saved);
   assert.equal(await page.locator('.r4-projected-star').count(),3,'Mounted state survives re-entry');
   assert.equal(await page.evaluate(()=>room4State.angles[0]),3,'Rotation survives re-entry');
   await enter(page,{star:true,lightPuzzle:true,meteors:true,wall:true,box:true,lightOn:true,angles:[1,1,1,1,1]});
   assert.equal(await page.locator('.r4-projected-star').count(),0,'Five collected panes still need insertion');
   await page.locator('#r4Stand').click();
   for(let i=0;i<5;i++)await page.locator('.r4-rotate-plate').nth(i).click();
   await page.locator('.r4-panels img').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));
   assert.equal(await page.locator('.r4-projected-star').count(),12);
   assert.equal(await page.locator('.r4-projected-lines line').count(),12);
   await page.waitForFunction(()=>document.querySelectorAll('.r4-constellation-edge.is-visible').length===12);
   assert(await page.locator('.r4-panel-stack').isEnabled());
   const modal=await page.locator('.r4-panel-ui').boundingBox();
   assert(modal.x>=-1&&modal.y>=-1&&modal.x+modal.width<=viewport.width+1&&modal.y+modal.height<=viewport.height+1,'Apparatus fits landscape');
   for(const button of await page.locator('.r4-rotate-plate,.r4-shine').all()){
    const box=await button.boundingBox();assert(box.y>=modal.y&&box.y+box.height<=modal.y+modal.height+1,'All controls remain visible');
   }
   await page.locator('.r4-shine').click();assert.equal(await page.evaluate(()=>room4State.completed),false,'Common 90-degree rotation is not the final solution');
   assert.match(await page.locator('.r4-feedback').textContent(),/向きが違う/);
   for(let i=0;i<3;i++)await page.locator('.r4-panel-stack').click();
   assert.deepEqual(await page.evaluate(()=>room4State.angles),[0,0,0,0,0]);
   await page.screenshot({path:path.join(shots,'aligned-apparatus-'+viewport.width+'.png')});
   await page.locator('.r4-panel-ui .device-close').click();
   await page.screenshot({path:path.join(shots,'aligned-wall-'+viewport.width+'.png')});
   await page.locator('#r4Light').click();
   assert.equal(await page.evaluate(()=>room4State.completed),true);
   assert.equal(await page.locator('.r4-projected-star[data-hip="65474"]').getAttribute('r'),'7');
   assert.equal(await page.locator('.room-dialog-overlay').count(),1,'Original Spica scene still follows completion');
   await enter(page,{star:true,lightPuzzle:true,meteors:true,wall:true,box:true,completed:true,memorySeen:true,lightOn:true,angles:[0,0,0,0,0]});
   assert.deepEqual(await page.evaluate(()=>room4State.mountedPanels),[true,true,true,true,true],'Finished legacy saves retain their constellation');
   assert.equal(await page.locator('.r4-projected-star').count(),12);
   assert.deepEqual(errors,[]);
   await page.close();
  }
  console.log('PASS: empty/partial apparatus, explicit mounting, live real-star projection, saved state, final Virgo and desktop/mobile fit');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
