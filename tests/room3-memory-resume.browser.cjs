// Save a displayed sentence/page through the real slot UI, reload, and finish the room.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const viewport of [{width:1366,height:768},{width:852,height:393}]){
   const context=await browser.newContext({viewport});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.route('https://resume.local/**',route=>{
    const file=path.resolve(root,decodeURIComponent(new URL(route.request().url()).pathname).slice(1)||'index.html');
    return route.fulfill(file.startsWith(root+path.sep)&&fs.existsSync(file)?{path:file}:{status:404,body:''});
   });
   await page.goto('https://resume.local/');
   await page.evaluate(()=>{settings.instantText=true;settings.volume=0;saveSettings()});
   const start=async()=>{
    await page.evaluate(()=>{Dialogue.stop();game.innerHTML='';clearSave();showThirdRoom({unlocked:true,bedInspected:true})});
    await page.waitForFunction(()=>!!room3State.memoryProgress);
   };
   const reach=async(id,uiPage=0)=>{
    for(let count=0;count<400;count++){
     const pos=await page.evaluate(()=>room3State.memoryProgress);
     if(pos?.logId===id&&pos.uiPage===uiPage)return;
     await page.evaluate(()=>Dialogue.advance());
    }
    throw Error('Did not reach '+id+':'+uiPage);
   };
   const appearance=()=>page.evaluate(()=>({text:document.querySelector('#roomMessage').textContent,background:document.querySelector('.memory-background')?.getAttribute('src')||null,sprite:document.querySelector('.memory-girl')?.getAttribute('src')||null,position:room3State.memoryProgress}));
   await start();
   // Apartment phone call, riverside sprite, confession, and present-day aftermath.
   for(const [id,uiPage] of [['room3_flashback_05_01',0],['room3_flashback_36_01',0],['room3_flashback_61_03',0],['room3_after_05_01',0]]){
    await reach(id,uiPage);
    const before=await appearance();
    await page.evaluate(()=>ManualSaveUI.open('save'));
    const card=page.locator('.save-slot-card').nth(2),action=card.locator('.save-slot-action');
    await action.click();
    if(await page.locator('#saveSlotOverlay').count()&&await action.count()&&await action.textContent()==='もう一度押す')await action.click();
    await page.locator('.save-slot-close').click();
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem(SAVE_KEY+'-slot-3')));
    assert.deepEqual(saved.rooms.room03.memoryProgress,before.position);
    await page.reload();
    await page.evaluate(()=>ManualSaveUI.open('load'));
    await page.locator('.save-slot-card').nth(2).locator('.save-slot-action').click();
    await page.locator('.save-slot-card').nth(2).locator('.save-slot-action').click();
    await page.waitForFunction(pos=>room3State.memoryProgress?.logId===pos.logId&&room3State.memoryProgress.uiPage===pos.uiPage,before.position);
    await page.locator('#roomMessage').waitFor();
    assert.deepEqual(await appearance(),before,'Sentence, page, background and sprite restored');
    if(id.includes('_36_')){
     assert.ok(before.background?.includes('cherry-riverside'));
     assert.ok(before.sprite?.includes('girl-spring'));
    }
   }
   // Finishing clears the cursor and the ordinary exit still reaches Room 4.
   for(let i=0;i<100&&!await page.evaluate(()=>room3State.memorySeen);i++)await page.evaluate(()=>Dialogue.advance());
   assert.equal(await page.evaluate(()=>room3State.memorySeen),true);
   assert.equal(await page.evaluate(()=>room3State.memoryProgress),undefined);
   await page.evaluate(()=>inspectThirdRoomDoor());
   await page.locator('#room3NextButton').click();
   for(let i=0;i<20&&await page.locator('.room-dialog-overlay').count();i++)await page.evaluate(()=>Dialogue.advance());
   await page.waitForFunction(()=>currentScene==='room04');
   // Legacy cursor-less saves recover from the last sentence, despite a resume notice.
   await start();await reach('room3_flashback_36_01');
   await page.evaluate(()=>{delete room3State.memoryProgress;saveGame();Dialogue.stop();game.innerHTML='';showThirdRoom(JSON.parse(localStorage.getItem(SAVE_KEY)).rooms.room03)});
   await page.waitForFunction(()=>room3State.memoryProgress?.logId==='room3_flashback_36_01');
   await page.locator('#roomMessage').waitFor();
   assert.ok((await appearance()).sprite?.includes('girl-spring'));
   assert.deepEqual(errors,[]);
   console.log(`PASS ${viewport.width}x${viewport.height}: manual save/reload, sentence resume, visuals, legacy recovery, Room 4 exit`);
   await context.close();
  }
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
