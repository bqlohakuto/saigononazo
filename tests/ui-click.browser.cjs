const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.mp3':'audio/mpeg','.wav':'audio/wav','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname==='/'?'/index.html':new URL(req.url,'http://localhost').pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(data);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const mobile of [false,true]){
   const context=await browser.newContext({viewport:mobile?{width:852,height:393}:{width:1366,height:768},isMobile:mobile,hasTouch:mobile});
   const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/?preview=1');
   await page.evaluate(()=>{window.clickSounds=[];document.addEventListener('game:sound',e=>{if(e.detail.id==='uiClick')clickSounds.push(e.detail.id)});});
   const activate=async selector=>{if(mobile)await page.locator(selector).tap();else await page.locator(selector).click();await page.waitForTimeout(450);};
   await activate('#settingsButton');
   // The first gesture unlocks the real AudioContext and decodes the MP3.
   await page.evaluate(async()=>{await GameAudio.play('uiClick');clickSounds.length=0;});
   await activate('.design-panel header button');assert.equal(await page.evaluate(()=>clickSounds.length),1,'one sound per activation');
   await page.evaluate(()=>clickSounds.length=0);
   await page.locator('#settingsButton').focus();await page.keyboard.press('Enter');await page.waitForTimeout(450);
   assert.equal(await page.evaluate(()=>clickSounds.length),1,'native keyboard activation plays once');
   await activate('.design-panel header button');
   await page.evaluate(()=>{const box=document.createElement('div');box.id='audio-probes';box.style='position:fixed;top:0;left:0;z-index:999999';box.innerHTML='<button id="probe-off" data-ui-sound="off">off</button><button id="probe-note" data-note="ド">note</button><button id="probe-next" class="next-button">next</button>';document.body.append(box);clickSounds.length=0;});
   for(const id of ['probe-off','probe-note','probe-next'])await activate('#'+id);
   assert.equal(await page.evaluate(()=>clickSounds.length),0,'protected controls stay silent');
   await page.evaluate(()=>{GameAudio.setCategoryVolumes(1,0);clickSounds.length=0;});
   await activate('#settingsButton');
   assert.equal(errors.length,0,errors.join('\n'));
   console.log((mobile?'Mobile touch emulation':'Desktop Edge')+': MP3 decode, settings, Enter, one sound per gesture, protected controls and muted SE passed');
   await context.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());

