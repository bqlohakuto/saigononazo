const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const base=process.env.LOCAL_REVIEW==='1'?'https://inlay.local/':(process.env.PUBLIC_BASE_URL||'https://bqlohakuto.github.io/saigononazo/');
const pairs=[['mirror','面','mask'],['fish','尾','tail'],['butterfly','頭','head'],['flower','輪','wheel'],['squid','杯','cup'],['chair','脚','legs'],['cannon','門','gate']];
const output=process.env.UI_SCREENSHOT_DIR||path.join(root,'artifacts/room05-inlay');
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('saigononazo-save-v1')).rooms.room05);
const finish=page=>page.evaluate(()=>{for(let n=0;n<1000&&document.querySelector('#roomNextButton');n++)document.querySelector('#roomNextButton').click();});
async function choose(page,id){const b=page.locator('[data-tile="'+id+'"]');if(await b.getAttribute('aria-pressed')!=='true')await b.click();}
async function assertFits(page){
 const game=await page.locator('#game').boundingBox();
 for(const selector of ['.r5-board-panel','.r5-counter-grid','.r5-inventory','#r5BoardFeedback','.r5-board-panel .device-close']){
  const b=await page.locator(selector).boundingBox();assert(b&&b.width>0&&b.height>0,selector);
  assert(b.x>=game.x-1&&b.y>=game.y-1&&b.x+b.width<=game.x+game.width+1&&b.y+b.height<=game.y+game.height+1,selector+' stays in game');
 }
 assert.equal(await page.locator('.r5-board-panel').evaluate(el=>el.scrollHeight>el.clientHeight),false,'no scrolling hides the tray');
}
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 fs.mkdirSync(output,{recursive:true});
 try{
  for(const spec of [{name:'pc',viewport:{width:1366,height:768},mobile:false},{name:'phone-landscape',viewport:{width:852,height:393},mobile:true}]){
   const ctx=await browser.newContext({viewport:spec.viewport,isMobile:spec.mobile,hasTouch:spec.mobile,reducedMotion:spec.mobile?'reduce':'no-preference'});
   await ctx.addInitScript(()=>localStorage.setItem('saigononazo-help-seen','1'));
   const page=await ctx.newPage(),errors=[],missing=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.url().includes('/combinations/')&&!r.ok())missing.push(r.url());});
   if(process.env.LOCAL_REVIEW==='1')await page.route(base+'**',route=>{
    const file=path.resolve(root,'.'+decodeURIComponent(new URL(route.request().url()).pathname));
    return route.fulfill(file.startsWith(root+path.sep)||file===root?fs.existsSync(file)?{path:fs.statSync(file).isDirectory()?path.join(file,'index.html'):file}:{status:404,body:''}:{status:403,body:''});
   });
   await page.goto(base,{waitUntil:'load'});
   await page.evaluate(()=>{settings.instantText=true;showFifthRoom({introSeen:true,boardIntroSeen:true,collected:['mirror','fish','butterfly','flower','squid','chair','cannon']});});
   // Hidden miniature board children must not intercept other directions.
   await page.locator('#r5TurnRight').click();
   await page.locator('#r5FridgeUpper').click();
   assert.equal((await saved(page)).fridgeUpperOpen,true);
   await page.locator('#r5FridgeUpper').click();
   for(let i=0;i<3;i++)await page.locator('#r5TurnRight').click();
   await page.locator('#r5Board').click();
   await page.waitForTimeout(250);await assertFits(page);
   assert.equal(await page.locator('.r5-counter-slot').count(),8);
   assert.match(await page.locator('.r5-counter-slot').first().locator('img').getAttribute('src'),/rabbit-feather\.png$/);
   await page.screenshot({path:path.join(output,spec.name+'-empty.png')});
   await page.locator('.r5-board-help').click();assert.equal(await page.locator('.r5-help-note').isVisible(),true);await page.locator('.r5-board-help').click();
   // Every wrong pairing has its own handdrawn picture and never consumes a tile.
   for(const [id,right] of pairs){
    await choose(page,id);
    for(const [,counter,key] of pairs){
     if(counter===right)continue;
     await page.locator('[data-counter="'+counter+'"]').click();
     const img=page.locator('[data-counter="'+counter+'"] img');
     assert.match(await img.getAttribute('src'),new RegExp(id+'-'+key+'\\.png$'));
     await img.evaluate(image=>image.decode());
     assert.equal(await page.locator('.room-dialog-overlay').count(),0);
     assert.equal(Object.keys((await saved(page)).placed).length,0);
    }
   }
   // A visible rejected combination returns to the engraved socket.
   await choose(page,'mirror');await page.locator('[data-counter="尾"]').click();
   await page.screenshot({path:path.join(output,spec.name+'-wrong.png')});
   await page.waitForTimeout(1900);assert.equal(await page.locator('.is-preview').count(),0);
   assert.equal(await page.locator('[data-tile="mirror"]').getAttribute('aria-pressed'),'true');
   // Closing during the rejection timer must not mutate a later room/overlay.
   await page.locator('[data-counter="尾"]').click();await page.keyboard.press('Escape');
   await page.locator('#r5Board').click();assert.equal(await page.locator('.is-preview').count(),0);
   if(!spec.mobile){
    // Real captured pointer drag on a scaled canvas, including an outside release.
    let tile=await page.locator('[data-tile="mirror"]').boundingBox();
    await page.mouse.move(tile.x+tile.width/2,tile.y+tile.height/2);await page.mouse.down();await page.mouse.move(18,18,{steps:8});await page.mouse.up();
    assert.equal(Object.keys((await saved(page)).placed).length,0);
    assert.equal(await page.locator('.r5-drag-ghost').count(),0);
    tile=await page.locator('[data-tile="mirror"]').boundingBox();const slot=await page.locator('[data-counter="面"]').boundingBox();
    await page.mouse.move(tile.x+tile.width/2,tile.y+tile.height/2);await page.mouse.down();await page.mouse.move(slot.x+slot.width/2,slot.y+slot.height/2,{steps:12});await page.mouse.up();
   }else{
    const tile=await page.locator('[data-tile="mirror"]').boundingBox(),slot=await page.locator('[data-counter="面"]').boundingBox();
    await page.touchscreen.tap(tile.x+tile.width/2,tile.y+tile.height/2);
    assert.equal(await page.locator('[data-tile="mirror"]').getAttribute('aria-pressed'),'true','touch selects mirror');
    await page.touchscreen.tap(slot.x+slot.width/2,slot.y+slot.height/2);
   }
   assert.equal((await saved(page)).placed.mirror,'面');
   assert.equal(await page.locator('.r5-board-feedback p').count(),2,'two reaction lines shown together');
   assert.equal(await page.locator('.r5-board-overlay').count(),1);
   if(spec.mobile){
    const client=await ctx.newCDPSession(page);
    const tile=await page.locator('[data-tile="fish"]').boundingBox(),slot=await page.locator('[data-counter="頭"]').boundingBox();
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:tile.x+tile.width/2,y:tile.y+tile.height/2}]});
    await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:slot.x+slot.width/2,y:slot.y+slot.height/2}]});
    await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert.match(await page.locator('[data-counter="頭"] img').getAttribute('src'),/fish-head\.png$/,'real touch drag shows wrong combination');
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:tile.x+tile.width/2,y:tile.y+tile.height/2}]});
    await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:slot.x+slot.width/2,y:slot.y+slot.height/2}]});
    await client.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
    assert.equal(await page.locator('.r5-drag-ghost').count(),0,'cancel clears drag ghost');
    assert.equal((await saved(page)).placed.fish,undefined);await client.detach();
   }
   await page.screenshot({path:path.join(output,spec.name+'-first-fit.png')});
   // Close/reload the saved partial puzzle, then use keyboard for the next fit.
   await page.keyboard.press('Escape');await page.reload({waitUntil:'load'});
   const partial=await saved(page);await page.evaluate(s=>showFifthRoom(s),partial);await page.locator('#r5Board').click();
   assert.match(await page.locator('[data-counter="面"] img').getAttribute('src'),/mirror-mask\.png$/);
   assert.equal(await page.locator('[data-tile="mirror"]').count(),0);
   await page.locator('[data-tile="fish"]').focus();await page.keyboard.press('Enter');await page.locator('[data-counter="尾"]').focus();await page.keyboard.press('Space');
   assert.equal((await saved(page)).placed.fish,'尾');
   for(const [id,counter] of pairs.slice(2)){
    await choose(page,id);await page.locator('[data-counter="'+counter+'"]').click();
    assert.equal((await saved(page)).placed[id],counter);
   }
   assert.equal((await saved(page)).codeRevealed,true);
   // The code appears during the authored completion animation, not immediately upon the last fit.
   await page.locator('.r5-inlay-code').waitFor({state:'visible',timeout:12000});
   assert.equal(await page.locator('.r5-inlay-code').isVisible(),true);
   assert.equal(await page.locator('.room-dialog-overlay').count(),0);
   await assertFits(page);await page.waitForTimeout(400);await page.screenshot({path:path.join(output,spec.name+'-complete.png')});
   assert.equal(await page.locator('.r5-tile-rest.is-used').count(),7);
   await page.keyboard.press('Escape');assert.equal(await page.locator('#r5Keypad').count(),1);
   await page.locator('.r5-door-reveal').waitFor({state:'detached',timeout:10000});
   assert.equal(await page.locator('#r5Scene .r5-wall-tile.is-placed img').count(),7);
   await page.locator('#r5Keypad').click();for(const digit of ['8','1','9','4'])await page.locator('[data-digit="'+digit+'"]').click();
   await page.locator('[data-key="enter"]').click();await finish(page);assert.equal((await saved(page)).doorUnlocked,true);
   assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
   await ctx.close();console.log('PASS '+spec.name+': 42 wrong combinations, drag/tap, keyboard, save/load, seven fits and keypad');
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
