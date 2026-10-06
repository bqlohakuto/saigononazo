const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url=process.env.GAME_TEST_URL||'http://127.0.0.1:8765';
 const save=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('saigononazo-save-v1')));
 async function finish(){for(let i=0;i<240&&await page.locator('#roomNextButton').count();i++){await page.locator('#roomNextButton').click();await page.waitForTimeout(8);}}
 await page.goto(url);
 await page.locator('#testRoomButton').click();
 await page.locator('[data-room="room05"]').click();
 assert.equal((await save()).currentScene,'room05');
 assert.equal(await page.locator('[data-item]').count(),7);
 for(const id of ['mirror','fish','butterfly','flower','squid','chair','cannon']){
   await page.locator('[data-item="'+id+'"]').click();await finish();
 }
 assert.equal((await save()).rooms.room05.collected.length,7);
 await page.locator('#r5Board').click();
 await page.locator('#r5TestComplete').click();await finish();
 assert.equal((await save()).rooms.room05.completed,true);
 await page.locator('[data-gameplay="save"]').click();
 await page.locator('.save-slot-action').first().click();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('saigononazo-save-v1-slot-1'))?.rooms.room05.completed),true);
 await page.locator('#saveSlotOverlay').evaluate(el=>el.remove());
 await page.locator('#r5Next').click();await page.waitForTimeout(720);
 assert.equal((await save()).currentScene,'room06');
 assert.equal(await page.locator('.r6-cell').count(),64);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:'/tmp/room5-lategame-mobile.png'});
 assert.deepEqual(errors,[]);
 await browser.close();
 console.log('PASS: Room 5 current playtest flow, save, responsive layout, Room 6 transition.');
})().catch(e=>{console.error(e);process.exit(1)});
