// Run with BASE_URL for local or published Pages verification; no sped-up playback.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const options={headless:true};
 if(process.env.CHROMIUM_PATH){options.executablePath=process.env.CHROMIUM_PATH;options.args=['--no-sandbox','--disable-dev-shm-usage'];}
 const browser=await chromium.launch(options),page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:8765/');
 await page.evaluate(()=>{settings.instantText=true;showEighthRoom({ended:true,epilogueSeen:false,epilogueLogId:'r8_epilogue_09'});});
 await page.locator('#roomNextButton').click();
 await page.waitForFunction(()=>{const a=document.querySelector('.ending-credits audio');return a&&!a.paused&&a.currentTime>0;},null,{timeout:20000});
 assert.equal(await page.locator('.ending-credits audio').evaluate(a=>a.loop),false);
 await page.evaluate(()=>GameAudio.setCategoryVolumes(0,1));
 assert.equal(await page.locator('audio').evaluate(a=>a.volume),0);
 await page.evaluate(()=>GameAudio.setCategoryVolumes(.7,.7));
 await page.locator('.ending-name').filter({hasText:'八上白兎'}).waitFor({timeout:10000});
 await page.screenshot({path:'/tmp/ending-credit.png'});
 console.log('Playing all 166.24 seconds at normal speed…');
 await page.waitForFunction(()=>document.querySelector('.ending-name')?.textContent==='最後の謎が解けても',null,{timeout:170000});
 await page.screenshot({path:'/tmp/ending-title.png'});
 await page.locator('.ending-name').filter({hasText:'THANKS FOR PLAYING.'}).waitFor({timeout:20000});
 await page.waitForSelector('.title-screen',{timeout:20000});
 assert.equal(await page.locator('.ending-credits').count(),0);assert.deepEqual(errors,[]);
 await page.setViewportSize({width:852,height:393});
 await page.evaluate(()=>showEighthRoom({ended:true,epilogueSeen:true}));
 const box=await page.locator('.ending-credits').boundingBox();assert(Math.abs(box.width/box.height-16/9)<.01);
 await page.screenshot({path:'/tmp/ending-landscape.png'});
 // Missing-file recovery must offer an explicit silent continuation.
 await page.route('**/audio/bgm/kotaeawase.mp3',r=>r.abort());
 await page.evaluate(()=>showEighthRoom({ended:true,epilogueSeen:true}));
 await page.locator('[data-silent]').waitFor({timeout:20000});await page.locator('[data-silent]').click();
 await page.waitForFunction(()=>document.querySelector('.ending-name')?.textContent.length>0,null,{timeout:10000});
 assert.deepEqual(errors,[]);console.log('PASS full playback, exact final title, thanks, title return, mute, landscape, saved ending and audio failure');
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
