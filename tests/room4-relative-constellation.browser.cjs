"use strict";
const assert=require("node:assert/strict");
const {chromium}=require(process.env.PLAYWRIGHT_PATH||"playwright");
const fs=require("node:fs"),path=require("node:path");
const base=process.env.BASE_URL||"http://127.0.0.1:8765";
const screenshots=process.env.ARTIFACT_DIR||"artifacts/rainbow-review";
fs.mkdirSync(screenshots,{recursive:true});
const source=JSON.parse(fs.readFileSync(path.join(__dirname,"../images/exhibits/room04/virgo-panels/virgo-five-panels.json"),"utf8"));
const expectedHips=source.panels.map(p=>p.stars.map(s=>s.hip));
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
 try{
  for(const viewport of [{width:1280,height:720},{width:852,height:393}]){
   const page=await browser.newPage({viewport,reducedMotion:"reduce"});
   const errors=[];page.on("pageerror",err=>errors.push(err.message));
   await page.addInitScript(()=>localStorage.setItem("saigononazo-help-seen","1"));
   await page.goto(base,{waitUntil:"load"});
   await page.evaluate(()=>{
    settings.instantText=true;
    showFourthRoom({view:"left",door:true,wall:true,box:true,star:true,lightPuzzle:true,meteors:true,hanaSleepSeen:true,angles:[2,1,0,3,2]});
    for(let i=0;i<50&&document.querySelector("#roomNextButton");i++)Dialogue.advance();
   });
   assert.deepEqual(await page.evaluate(()=>R4_VIRGO_PANEL_HIPS),expectedHips,"Panel HIP allocation must exactly match the approved SVG generation data");
   assert.equal(await page.evaluate(()=>R4_ZODIAC.find(e=>e.id==="Vir").edges.length),12,"Use all 12 original zodiac lines");
   await page.locator("#r4Stand").click();
   const modal=page.locator(".r4-linked-puzzle"),line=page.locator(".r4-constellation-edge.is-visible"),pane=page.locator(".r4-rotate-plate");
   assert.equal(await modal.count(),1);
   assert.equal(await pane.count(),5,"Five physical glass panes, no separate rotate buttons");
   assert.equal(await page.locator(".r4-panels button").count(),5);
   assert.equal(await page.locator(".r4-panel-stack img").count(),5,"Original art is still layered in center");
   assert.deepEqual(await pane.locator("img").evaluateAll(imgs=>imgs.map(img=>new URL(img.src).pathname.split("/").at(-1))),[
    "virgo-panel-01.svg","virgo-panel-02.svg","virgo-panel-03.svg","virgo-panel-04.svg","virgo-panel-05.svg"
   ]);
   assert.deepEqual(await line.evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.edge)).sort((a,b)=>a-b)),[4,9],"The accepted initial state should already show two cross-pane lines");
   assert(await page.locator(".r4-panel-stack").isDisabled(),"Whole-star turning only unlocks once all lines connect");
   const outer=await modal.boundingBox(),stack=await page.locator(".r4-panel-stack").boundingBox();
   const tiles=await pane.evaluateAll(items=>items.map(el=>{const a=el.getBoundingClientRect();return{x:a.x,y:a.y,right:a.right,bottom:a.bottom}}));
   assert(outer.x>=-1&&outer.y>=-1&&outer.x+outer.width<=viewport.width+1&&outer.y+outer.height<=viewport.height+1,"Modal must fit viewport");
   assert(stack.x>=outer.x&&stack.y>=outer.y&&stack.x+stack.width<=outer.x+outer.width+1&&stack.y+stack.height<=outer.y+outer.height+1,"Central star view must fit");
   assert(tiles.every(b=>b.x>=outer.x&&b.y>=outer.y&&b.right<=outer.x+outer.width+1&&b.bottom<=outer.y+outer.height+1),"Five touch panels must fit landscape");
   await page.screenshot({path:path.join(screenshots,"constellation-initial-"+viewport.width+".png")});
   async function setAngles(goal){
    for(let i=0;i<5;i++){
     const current=await page.evaluate(()=>room4State.angles);
     const turns=(goal[i]-current[i]+4)%4;
     for(let t=0;t<turns;t++)await pane.nth(i).click();
    }
    assert.deepEqual(await page.evaluate(()=>room4State.angles),goal,"Physical taps must update saved angles");
   }
   // Both 90 degrees off the absolute solution but the connection is correct.
   await setAngles([1,1,0,3,2]);
   assert.equal(await page.locator('.r4-constellation-edge[data-edge="0"].is-visible').count(),1,"Relative 1/2 pair should light up despite absolute 90-degree shift");
   // Changing only one pane destroys their connection.
   await setAngles([1,0,0,3,2]);
   await page.locator('.r4-constellation-edge[data-edge="0"]').waitFor({state:"detached",timeout:2000});
   assert.equal(await page.locator('.r4-constellation-edge[data-edge="0"].is-visible').count(),0,"Mismatched relative rotation must break the line");
   await setAngles([1,1,1,1,1]);
   assert.equal(await line.count(),12,"All 12 approved connections must show for any common rotation");
   assert(await page.locator(".r4-panel-stack").isEnabled(),"Matching all five panes activates whole-star rotation");
   assert.equal(await page.locator(".r4-shine").count(),1,"Original light-based final check remains");
   await page.screenshot({path:path.join(screenshots,"constellation-linked-"+viewport.width+".png")});
   await page.locator(".r4-shine").click();
   assert.equal(await page.evaluate(()=>room4State.completed),false,"All lines connected at 90 degrees must not count as a win");
   assert.match(await page.locator(".r4-feedback").textContent(),/向きが違う/);
   await page.locator(".r4-panel-stack").click();
   assert.deepEqual(await page.evaluate(()=>room4State.angles),[2,2,2,2,2],"Center rotates all five by one quarter-turn");
   assert.equal(await line.count(),12,"Connections stay intact when the whole pattern rotates");
   await page.locator(".r4-panel-ui .device-close").click();
   assert.deepEqual(await page.evaluate(()=>room4State.angles),[2,2,2,2,2],"Rotation persists after closing");
   await page.locator("#r4Stand").click();
   assert.equal(await line.count(),12,"Linked orientation persists on reinspection");
   await page.locator(".r4-panel-stack").click();
   await page.locator(".r4-panel-stack").click();
   assert.deepEqual(await page.evaluate(()=>room4State.angles),[0,0,0,0,0]);
   assert.equal(await line.count(),12);
   await page.locator(".r4-shine").click();
   assert.equal(await page.evaluate(()=>room4State.completed),true,"Only the accepted zero-angle orientation completes Virgo");
   assert.equal(await page.locator(".r4-panel-overlay").count(),0,"Completion returns to the existing star story");
   assert.equal(await page.locator(".room-dialog-overlay").count(),1,"The original Spica/flashback dialogue starts");
   assert.deepEqual(errors,[],"No game script errors");
   await page.close();
  }
  console.log("PASS: Virgo direct-tap, exact 12 edges, relative rotation hints, persisted state and final win");
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
