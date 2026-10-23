/* Run against a local static server: BASE_URL=http://127.0.0.1:8765 node tests/exploration.browser.cjs */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8765';
const output=process.env.ARTIFACT_DIR||'/tmp/saigononazo-exploration';
fs.mkdirSync(output,{recursive:true});

(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
 const errors=[],missing=new Set(),summary=[];
 try{
  for(const viewport of [{width:1280,height:720},{width:852,height:393}]){
   const context=await browser.newContext({viewport,reducedMotion:'reduce'});
   await context.addInitScript(()=>localStorage.setItem('saigononazo-help-seen','1'));
   const page=await context.newPage();
   page.on('pageerror',error=>errors.push(error.message));
   page.on('response',response=>{if(response.status()===404)missing.add(new URL(response.url()).pathname.slice(1))});
   await page.goto(base,{waitUntil:'load'});
   await page.evaluate(()=>{settings.instantText=true;settings.textSpeed=0;});
   const finish=()=>page.evaluate(()=>{
    for(let n=0;n<250&&document.querySelector('#roomNextButton');n++)Dialogue.advance();
    if(document.querySelector('#roomNextButton'))throw new Error('Dialogue did not close');
   });
   const open=async(scene,view='front',awake=true)=>{
    await page.evaluate(({scene,view,awake})=>{
     clearSave();
     const options={view,introSeen:true};
     const loaders={room01:()=>showFirstRoom({...options,viewedWall:view,questionSeen:true,hanaIntroduced:true}),room02:()=>showSecondRoom(options),room03:()=>showThirdRoom({...options,bedInspected:awake,doorInspected:true}),room04:()=>showFourthRoom(options),room05:()=>showFifthRoom(options),room06:()=>showSixthRoom(options),room07:()=>showSeventhRoom(options)};
     loaders[scene]();
    },{scene,view,awake});
    await finish();
    await page.waitForFunction(()=>[...document.images].every(image=>image.complete));
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   };
   const progress=()=>page.evaluate(()=>{saveGame();return JSON.parse(localStorage.getItem(SAVE_KEY)).rooms[currentScene]});
   const specs=await page.evaluate(()=>Object.entries(RoomExplorationScenes).flatMap(([scene,entries])=>entries.filter(e=>!e.existing).map(e=>({scene,id:e.id,view:e.view||'front'}))));
   assert.equal(specs.length,17,'Keep 17 concrete optional hotspots; no number-filling');
   assert.equal(specs.some(s=>s.scene==='room03'&&s.id==='floor'),false,'Do not investigate a generic wooden floor');
   assert.equal(specs.some(s=>s.scene==='room06'&&['wall','floor'].includes(s.id)),false,'No generic wall or feet inspection in the Othello room');
   assert.equal(specs.some(s=>s.scene==='room02'&&s.id==='frame'),true,'A wall-mounted framed item remains inspectable');
   assert.equal(specs.some(s=>s.scene==='room07'&&s.id==='wall-lamp'),true,'A tangible wall lamp remains inspectable');
   assert.equal(specs.some(s=>s.scene==='room07'&&s.id==='wall-shelf'),true,'A tangible wall shelf remains inspectable');
   for(const spec of specs){
    await open(spec.scene,spec.view);
    const before=await progress();
    const target=page.locator(`#explore-${spec.scene}-${spec.id}`);
    assert.equal(await target.count(),1);
    const clear=await target.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))});
    assert.ok(clear,`${viewport.width}: ${spec.scene}/${spec.id} center must be clickable`);
    await target.click();
    assert.equal(await page.locator('.inspection-overlay').count(),1);
    await page.keyboard.press('Escape');
    assert.equal(await target.evaluate(el=>el===document.activeElement),true,'Escape restores focus');
    assert.deepEqual(await progress(),before,'closing an inspection cannot change puzzle progress');
    await target.click();
    await page.locator('.inspection-art-button').click();
    assert.equal(await page.locator('.room-dialog-overlay').count(),1);
    if(viewport.width===1280&&['chair','sofa','stool'].includes(spec.id))await page.screenshot({path:path.join(output,`${spec.scene}-${spec.id}-dialogue.png`)});
    await finish();
    assert.equal(await page.locator('.inspection-focus-background').count(),0,'zoom cleans up after dialogue');
    assert.equal(await page.locator('.room').evaluate(el=>el.inert),false);
    assert.deepEqual(await progress(),before,'optional dialogue cannot change puzzle progress');
    await target.click();await page.locator('.inspection-art-button').click();await finish();
    const repeat=await page.evaluate(prefix=>GameLog.list().filter(line=>line.id.startsWith(prefix)),`explore_${spec.scene}_${spec.id}_repeat`);
    assert.ok(repeat.length>0,'second inspection uses its short reaction');
    await page.screenshot({path:path.join(output,`${viewport.width}-${spec.scene}-${spec.id}.png`)});
    summary.push(`${viewport.width}: ${spec.scene}/${spec.id}`);
   }
   // Sleep/wake content and optional logs survive ordinary saved-game loading.
   await open('room03','right',false);
   await page.locator('#explore-room03-chair').click();await page.locator('.inspection-art-button').click();await finish();
   const quiet=await page.evaluate(()=>GameLog.list().filter(l=>l.id.startsWith('explore_room03_chair_quiet')));
   assert.ok(quiet.length>0);assert.ok(quiet.every(l=>l.speaker!=='ハナ'));
   await page.evaluate(()=>{room3State.bedInspected=true;renderThirdRoomView();saveGame()});
   await page.locator('#explore-room03-chair').click();await page.locator('.inspection-art-button').click();await finish();
   assert.ok(await page.evaluate(()=>GameLog.list().some(l=>l.id.startsWith('explore_room03_chair_first')&&l.speaker==='ハナ')));
   await page.reload({waitUntil:'load'});await page.evaluate(()=>{settings.instantText=true;resumeGame()});
   const autosave=page.locator('.save-slot-card').filter({hasText:'AUTO'}).locator('button');
   await autosave.click();
   if(await page.locator('.save-slot-action.is-confirm').count())await page.locator('.save-slot-action.is-confirm').click();
   await finish();
   await page.locator('#explore-room03-chair').click();await page.locator('.inspection-art-button').click();await finish();
   assert.ok(await page.evaluate(()=>GameLog.list().some(l=>l.id.startsWith('explore_room03_chair_repeat'))));
   await open('room03','left',false);
   assert.equal(await page.locator('#explore-room03-pillow').count(),0,'sleeping Hana is not covered by a pillow hotspot');
   // Puzzle targets remain exposed even when the new targets share their furniture.
   for(const [scene,view,ids] of [['room01','back',['deskButton','phoneButton']],['room01','left',['pianoButton']],['room03','right',['r3Desk']],['room05','back',[]],['room07','back',['r7Shelf']]]){
    await open(scene,view);
    for(const id of ids){
     const exposed=await page.locator('#'+id).evaluate(el=>{const r=el.getBoundingClientRect(),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return el.contains(top)});
     assert.ok(exposed,`required ${id} remains clickable`);
    }
   }
   await open('room01','right');
   await page.locator('#shelfButton').click();await page.locator('.inspection-art-button').click();await finish();
   assert.ok(await page.evaluate(()=>GameLog.list().some(l=>l.id.startsWith('explore_room01_shelf'))));
   await context.close();
  }
  assert.deepEqual(errors,[]);
  console.log(`PASS: ${summary.length} desktop/mobile optional targets; focus, progress, repeat, sleeping Hana and save/load.`);
 }finally{
  fs.writeFileSync(path.join(output,'missing-assets.json'),JSON.stringify([...missing],null,2));
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({summary,errors},null,2));
  await browser.close();
 }
})().catch(error=>{console.error(error);process.exitCode=1});
