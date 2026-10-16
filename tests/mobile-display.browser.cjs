// Real fullscreen entry/exit, mobile sizing, image panning, and unsupported-browser guidance.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=process.env.UI_SCREENSHOT_DIR;
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
 try{
  const context=await browser.newContext({viewport:{width:852,height:393},isMobile:true,hasTouch:true});
  const errors=[],missing=[];
  await context.addInitScript(()=>{localStorage.setItem('saigononazo-help-seen','1');localStorage.setItem('saigononazo-settings-v1',JSON.stringify({instantText:true}))});
  await context.route('https://display.local/**',async route=>{
   const rel=decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\//,'')||'index.html',file=path.resolve(root,rel);
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){missing.push(rel);await route.fulfill({status:404,body:''});return}
   await route.fulfill({path:file});
  });
  const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
  const shot=async name=>{if(out){fs.mkdirSync(out,{recursive:true});await p.screenshot({path:path.join(out,name+'.png')})}};
  const finish=async()=>{for(let i=0;i<500&&await p.locator('#roomNextButton').count();i++)await p.locator('#roomNextButton').click()};
  const fit=async()=>{const b=await p.locator('#game-container').boundingBox(),v=p.viewportSize();assert(b.x>=-.5&&b.y>=-.5&&b.x+b.width<=v.width+.5&&b.y+b.height<=v.height+.5);assert(Math.abs(b.width/b.height-16/9)<.01);return b};
  await p.goto('https://display.local/');await p.locator('.design-title-fullscreen').click();
  await p.waitForFunction(()=>document.fullscreenElement===document.documentElement);await fit();
  await p.locator('.design-title-fullscreen').click();await p.waitForFunction(()=>!document.fullscreenElement);
  await p.locator('#testRoomButton').click();await p.locator('[data-room="room07"]').click();
  for(let i=0;i<500&&await p.locator('#roomNextButton').count();i++)await p.locator('#roomNextButton').click();
  const small=await p.locator('.r7-scene').boundingBox();await fit();
  await p.setViewportSize({width:852,height:430});await p.waitForTimeout(100);
  const expanded=await p.locator('.r7-scene').boundingBox();assert(expanded.height>small.height,'reclaimed browser-bar height enlarges artwork');
  await p.setViewportSize({width:852,height:393});await p.waitForTimeout(100);
  await p.getByRole('button',{name:'設定',exact:true}).click();await p.locator('#roomImageSize').selectOption('large');await p.getByRole('button',{name:'閉じる',exact:true}).click();
  const large=await p.locator('.r7-scene').boundingBox();assert(Math.abs(large.width/small.width-1.2)<.01);assert(Math.abs(large.width/large.height-1.5)<.01);
  const before=await p.locator('.r7-room-wrap').evaluate(e=>e.scrollTop);assert(before>0,'zoom starts centered');const navBefore=await p.locator('#r7TurnLeft').boundingBox();
  // Native touch panning must work on the artwork, with no accidental investigation.
  const cdp=await context.newCDPSession(p),frame=await p.locator('#game').boundingBox(),x=frame.x+frame.width*.78,y=frame.y+frame.height*.65;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*10}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(250);
  assert((await p.locator('.r7-room-wrap').evaluate(e=>e.scrollTop))>before,'swipe pans enlarged room');assert.equal(await p.locator('.r7-overlay').count(),0);
  assert.equal((await p.locator('#r7TurnLeft').boundingBox()).y,navBefore.y,'navigation stays fixed while room pans');
  await shot('mobile-room-enlarged');
  // Every part of the original image remains reachable, including the upper dial.
  await p.locator('.r7-room-wrap').evaluate(e=>e.scrollTop=0);await p.locator('#r7Dial').click();await finish();assert.equal(await p.locator('.r7-overlay .r7-dial-wheel text').count(),12);await p.locator('#r7DialDone').click();
  for(const targets of [['#r7Cabinet'],['#r7Box','#r7Stack'],['#r7Shelf'],['#r7Drawer','#r7Curtain','#r7Diary']]){
   for(const selector of targets){await p.locator(selector).click();await finish();await p.locator('.r7-overlay .device-close').click()}
   await p.locator('#r7TurnRight').click();
  }
  await p.getByRole('button',{name:'全画面',exact:true}).click();await p.waitForFunction(()=>!!document.fullscreenElement);await fit();await shot('mobile-fullscreen');
  await p.getByRole('button',{name:'全画面を終了',exact:true}).click();await p.waitForFunction(()=>!document.fullscreenElement);
  await p.reload();await p.locator('#testRoomButton').click();await p.locator('[data-room="room07"]').click();
  for(let i=0;i<500&&await p.locator('#roomNextButton').count();i++)await p.locator('#roomNextButton').click();
  await p.getByRole('button',{name:'設定',exact:true}).click();assert.equal(await p.locator('#roomImageSize').inputValue(),'large');await p.locator('#roomImageSize').selectOption('fit');await p.getByRole('button',{name:'閉じる',exact:true}).click();
  assert(Math.abs((await p.locator('.r7-scene').boundingBox()).height-small.height)<1);
  // Unsupported and rejected requests explain the recovery path instead of silently failing.
  await p.evaluate(()=>{document.documentElement.requestFullscreen=undefined;document.documentElement.webkitRequestFullscreen=undefined});
  await p.getByRole('button',{name:'全画面',exact:true}).click();assert((await p.locator('.design-content').textContent()).includes('ホーム画面に追加'));await p.getByRole('button',{name:'閉じる',exact:true}).click();
  await p.evaluate(()=>{document.documentElement.requestFullscreen=()=>Promise.reject(new Error('Unavailable'))});
  await p.getByRole('button',{name:'全画面',exact:true}).click();await p.getByText('このブラウザでは全画面への切り替えができませんでした。',{exact:false}).waitFor();await p.getByRole('button',{name:'閉じる',exact:true}).click();
  await p.evaluate(()=>Object.defineProperty(navigator,'standalone',{value:true,configurable:true}));
  await p.getByRole('button',{name:'全画面',exact:true}).click();await p.getByText('ホーム画面から起動した表示でプレイ中です。',{exact:false}).waitFor();await p.getByRole('button',{name:'閉じる',exact:true}).click();
  await p.setViewportSize({width:393,height:852});await p.locator('.design-orientation').waitFor({state:'visible'});await p.setViewportSize({width:667,height:375});await fit();await shot('small-landscape-display');
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');
  console.log('PASS display: real fullscreen entry/exit, dynamic height, 120% image with native swipe, persistence, fallback/standalone guidance and portrait rotation');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
