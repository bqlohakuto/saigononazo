const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const errors=[];
 try{
  for(const viewport of [{width:1280,height:720},{width:852,height:393}]){
   const page=await browser.newPage({viewport,reducedMotion:'reduce'});
   page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>localStorage.setItem('saigononazo-help-seen','1'));
   await page.goto(process.env.BASE_URL||'http://127.0.0.1:8765');
   const finish=()=>page.evaluate(()=>{for(let i=0;i<300&&document.querySelector('#roomNextButton');i++)Dialogue.advance()});
   const setup=async(code)=>{await page.evaluate(code=>{clearSave();settings.instantText=true;settings.textSpeed=0;(0,eval)(code)},code);await finish()};
   const click=async(text)=>{await page.waitForTimeout(300);await page.getByRole('button',{name:text,exact:true}).click()};
   const close=()=>page.keyboard.press('Escape');
   const steps=async(id,open,count)=>{
    const before=await page.evaluate(()=>{saveGame();return JSON.parse(localStorage.getItem(SAVE_KEY)).rooms[currentScene]});
    await page.evaluate(open);
    assert.equal(await page.locator('.hana-choice-button').count(),2);
    await close();
    assert.equal(await page.evaluate(id=>roomStates.puzzleHints?.[id]||0,id),0);
    for(let i=0;i<count;i++){
     await page.evaluate(open);
     assert.equal(await page.locator('.hana-choice-button').count(),Math.min(count,i+1)+1);
     await click('ヒント'+(i+1));await finish();
     assert.equal(await page.evaluate(id=>roomStates.puzzleHints[id],id),i+1);
    }
    assert.deepEqual(await page.evaluate(()=>{saveGame();return JSON.parse(localStorage.getItem(SAVE_KEY)).rooms[currentScene]}),before,'hints cannot solve or modify puzzle state');
    assert.equal(await page.evaluate(id=>JSON.parse(localStorage.getItem(SAVE_KEY)).rooms.puzzleHints[id],id),count);
    await page.evaluate(open);await click('ヒント1（もう一度）');await finish();
   };
   await setup("showSecondRoom({introSeen:true,deskInspected:true})");
   await page.evaluate(()=>showSecondRoomHana());await click('考え方のヒント');await close();
   await steps('r2_strategy',()=>{showSecondRoomHana();document.querySelector('[data-topic="hint"]').click()},3);
   await setup("showThirdRoom({introSeen:true,bedInspected:true,chatRead:true,shelfInspected:true})");
   await steps('r3_faces',()=>showThirdRoomHana(),3);
   await page.evaluate(()=>{room3State.morseSolved=true});
   await steps('r3_board',()=>showThirdRoomHana(),3);
   await setup("showFourthRoom({introSeen:true,hanaSleepSeen:true})");
   await page.evaluate(()=>r4Hana());
   for(const label of ['謎1：色と数字','謎2：国旗と数字','謎3：七つの色'])assert.equal(await page.getByRole('button',{name:label,exact:true}).count(),1);
   await page.screenshot({path:'/tmp/hints-'+viewport.width+'.png'});
   await click('謎1：色と数字');await click('ヒント1');await finish();
   assert.equal(await page.evaluate(()=>roomStates.puzzleHints.r4_star),1);
   await setup("showFifthRoom({introSeen:true,boardIntroSeen:true})");
   await steps('r5_counters',()=>document.getElementById('r5Hana').click(),3);
   await setup("showSixthRoom({introSeen:true})");
   await page.evaluate(()=>document.getElementById('r6Hana').click());
   assert.equal(await page.getByRole('button',{name:'仕組みのヒント',exact:true}).count(),0);
   await click('探索について');
   assert.ok(!(await page.locator('.room-dialog-overlay').innerText()).includes('挟'));
   await finish();
   await setup("showSeventhRoom({introSeen:true})");
   await page.evaluate(()=>document.getElementById('r7Hana').click());await finish();
   await steps('r7_books',()=>document.getElementById('r7Hana').click(),3);
   // Load the real auto-save slot to verify independent hint progress persists.
   await page.reload();await page.evaluate(()=>{settings.instantText=true;resumeGame()});
   await page.locator('.save-slot-card').filter({hasText:'AUTO'}).locator('button').click();
   if(await page.locator('.save-slot-action.is-confirm').count())await page.locator('.save-slot-action.is-confirm').click();
   await finish();
   assert.equal(await page.evaluate(()=>roomStates.puzzleHints.r7_books),3);
   await page.evaluate(()=>document.getElementById('r7Hana').click());
   assert.equal(await page.getByRole('button',{name:'ヒント3（もう一度）',exact:true}).count(),1);
   await page.close();
   console.log('PASS hints, cancel, replay, state isolation and save/load: '+viewport.width);
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
