const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const base=process.env.PUBLIC_BASE_URL||'https://bqlohakuto.github.io/saigononazo/';
const cases=[
  {name:'pc-chromium',engine:chromium,viewport:{width:1366,height:768},mobile:false},
  {name:'phone-landscape-webkit',engine:webkit,viewport:{width:852,height:393},mobile:true}
];
const expected=[
  'front.webp','left-window.webp','right-kitchen-closed.webp',
  'right-kitchen-upper-open.webp','right-kitchen-lower-open.webp',
  'right-kitchen-both-open.webp','back.webp',
  ...['mirror','dining-set','planter-flowers-blue-butterfly','planter-empty','fish','frozen-squid','cannon'].map(f=>'overlays/'+f+'.webp'),
  ...['mirror','fish','squid','butterfly','flower','chair','cannon'].map(f=>'panels/'+f+'.webp')
];
(async()=>{
 for(const spec of cases){
  const browser=await spec.engine.launch({headless:true});
  try{
    const ctx=await browser.newContext({
      viewport:spec.viewport,deviceScaleFactor:spec.mobile?2:1,
      isMobile:spec.mobile,hasTouch:spec.mobile,reducedMotion:'reduce'
    });
    await ctx.addInitScript(()=>localStorage.setItem('saigononazo-help-seen','1'));
    const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    const response=await page.goto(base+'?room05_art_review='+Date.now(),{waitUntil:'load',timeout:60000});
    assert.equal(response.status(),200);
    const missing=await page.evaluate(async files=>{
      const missing=[];
      for(const name of files){
        const url='images/background/room05/'+name;
        try{
          const r=await fetch(url,{cache:'no-store'});
          if(!r.ok||r.headers.get('content-type')?.includes('text/html'))missing.push(url+':'+r.status);
          else {const image=new Image();image.src=url;await image.decode();if(image.naturalWidth<16||image.naturalHeight<16)missing.push(url+':invalid-size')}
        }catch(e){missing.push(url+':'+e.message)}
      }
      return missing;
    },expected);
    assert.deepEqual(missing,[],'Expected all 21 approved images to be published');
    await page.evaluate(()=>{settings.instantText=true;showFifthRoom({introSeen:true})});
    await page.waitForFunction(()=>document.querySelector('#r5Scene')?.classList.contains('has-r5-background'));
    const dir=path.join('artifacts','room05',spec.name);fs.mkdirSync(dir,{recursive:true});
    for(const view of ['front','right','back','left']){
      await page.waitForFunction(()=>document.querySelector('#r5Scene')?.classList.contains('has-r5-background'));
      assert.equal(await page.locator('#r5Scene').getAttribute('data-view'),view);
      const scene=page.locator('#r5Scene');
      const bounds=await scene.boundingBox();
      assert(bounds.width>200&&bounds.height>90,'Scene is visible');
      assert(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=spec.viewport.width+1&&bounds.y+bounds.height<=spec.viewport.height+1,'Scene must fit in viewport');
      if(view==='front'){
        const wallBoard=await page.locator('#r5Board').boundingBox();
        assert(wallBoard.y+wallBoard.height<bounds.y+bounds.height*.5,'Puzzle is mounted on the wall above the shelf');
        const mirror=page.locator('.r5-decor-mirror');
        const mirrorBox=await mirror.boundingBox();
        const mirrorTarget=await page.locator('.r5-target-mirror').boundingBox();
        assert(mirrorTarget.x<=mirrorBox.x && mirrorTarget.y<=mirrorBox.y &&
          mirrorTarget.x+mirrorTarget.width>=mirrorBox.x+mirrorBox.width &&
          mirrorTarget.y+mirrorTarget.height>=mirrorBox.y+mirrorBox.height,
          'Mirror tap target covers the entire decorative image');
        // The transparent padding in mirror.webp means the element's bounding
        // box is not the visible base. Measure its opaque pixels, then compare
        // the base against the shelf surface in the approved 1672x941 artwork.
        const visibleBase=await mirror.evaluate(async el=>{
          const image=new Image();
          image.src='images/background/room05/overlays/mirror.webp';
          await image.decode();
          const canvas=document.createElement('canvas');
          canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
          const context=canvas.getContext('2d');
          context.drawImage(image,0,0);
          const pixels=context.getImageData(0,0,canvas.width,canvas.height).data;
          let lastRow=-1;
          for(let y=canvas.height-1;y>=0&&lastRow<0;y--){
            let opaque=0;
            for(let x=0;x<canvas.width;x++)if(pixels[(y*canvas.width+x)*4+3]>=128)opaque++;
            if(opaque>=10)lastRow=y;
          }
          if(lastRow<0)throw new Error('Mirror asset has no visible base');
          const rect=el.getBoundingClientRect();
          const scale=Math.min(rect.width/canvas.width,rect.height/canvas.height);
          const top=rect.y+(rect.height-canvas.height*scale)/2;
          return top+(lastRow+1)*scale;
        });
        const shelfSurface=bounds.y+bounds.height*(560/941);
        assert(Math.abs(visibleBase-shelfSurface)<bounds.height*.008,
          'Visible mirror base rests on the shelf instead of overlapping its front');
        await page.locator('.r5-target-mirror').click();
        await page.waitForSelector('.room-dialog-overlay');
        await page.evaluate(()=>{for(let i=0;i<100&&document.querySelector('#roomNextButton');i++)document.querySelector('#roomNextButton').click()});
        await page.waitForFunction(()=>room5State.collected.includes('mirror'));
        // E03: the acquired item's APPROVED image must open as a large reveal.
        const reveal=page.locator('.design-pickup-panel');
        await reveal.waitFor();
        const art=reveal.locator('.design-pickup-image');
        assert.match(await art.getAttribute('src'),/images\/background\/room05\/panels\/mirror\.webp$/,'Mirror panel uses approved artwork');
        const size=await art.evaluate(async image=>{
          await image.decode();
          const bounds=image.getBoundingClientRect(),style=getComputedStyle(image);
          return {naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,width:bounds.width,height:bounds.height,background:style.backgroundColor};
        });
        assert(size.naturalWidth>100&&size.naturalHeight>100,'Approved image loads at useful resolution');
        assert(size.width>145&&size.height>120,'Collected panel appears substantially larger than the inventory thumbnail');
        assert.equal(size.background,'rgb(250, 246, 235)','Room 5 reveal uses a paper background');
        await page.screenshot({path:path.join(dir,'mirror-panel-acquired-large.png')});
        await reveal.locator('button').filter({hasText:'閉じる'}).click();
        assert.equal(await reveal.count(),0,'Player can dismiss the large panel reveal');
        assert.equal(await page.locator('.r5-decor-mirror.is-gone').count(),1,'Collected mirror disappears from the room');
        assert.equal(await page.locator('.r5-target-mirror.is-gone').count(),1,'Collected mirror is no longer interactive');
        await page.evaluate(()=>showFifthRoom({introSeen:true}));
        await page.waitForFunction(()=>document.querySelector('#r5Scene')?.classList.contains('has-r5-background'));
        const hana=await page.locator('#r5Hana').boundingBox();
        assert(hana.x>bounds.x+bounds.width*.65,'Hana stands to the right, clear of the mirror');
        assert.equal(await page.locator('#r5Hana').evaluate(el=>getComputedStyle(el).pointerEvents),'auto','Hana remains clickable');
        await page.locator('#r5Hana').click();
        await page.locator('.hana-choice-menu').waitFor();
        // Hints now open a topic chooser before any dialogue. Let the existing
        // anti-accidental-click guard expire before requesting the first hint.
        await page.waitForTimeout(280);
        await page.locator('.hana-choice-menu .hana-choice-button').first().click();
        await page.waitForSelector('.room-dialog-overlay');
        await page.evaluate(()=>{for(let i=0;i<100&&document.querySelector('#roomNextButton');i++)document.querySelector('#roomNextButton').click()});
        assert.equal(await page.locator('.room-dialog-overlay').count(),0,'Hana investigation can be closed');
      }
      if(view==='left'){
        const furniture=await page.locator('.r5-decor-dining').boundingBox();
        assert(furniture.width<bounds.width*.75,'Dining furniture is scaled to the room');
      }
      await page.screenshot({path:path.join(dir,view+'.png')});
      if(view==='right'){
        await page.locator('#r5FridgeUpper').click();
        assert.equal(await scene.getAttribute('data-fridge'),'upper-open');
        await page.waitForFunction(()=>document.querySelector('#r5Scene')?.classList.contains('has-r5-background'));
        await page.screenshot({path:path.join(dir,'right-upper-open.png')});
        await page.locator('#r5FridgeLower').click();
        assert.equal(await scene.getAttribute('data-fridge'),'both-open');
        await page.waitForFunction(()=>document.querySelector('#r5Scene')?.classList.contains('has-r5-background'));
        await page.screenshot({path:path.join(dir,'right-both-open.png')});
        await page.locator('#r5FridgeUpper').click();
        assert.equal(await scene.getAttribute('data-fridge'),'lower-open');
        await page.waitForFunction(()=>document.querySelector('#r5Scene')?.classList.contains('has-r5-background'));
        await page.screenshot({path:path.join(dir,'right-lower-open.png')});
      }
      await page.locator('#r5TurnRight').click();
    }
    await page.evaluate(()=>showFifthRoom({introSeen:true,boardIntroSeen:true,collected:['mirror','fish','squid','butterfly','flower','chair','cannon']}));
    await page.locator('#r5Board').click();
    assert.equal(await page.locator('.r5-counter-slot').count(),8,'Eight counter targets');
    assert.equal(await page.locator('.r5-item-picture').count(),7,'Seven tile assets');
    await page.locator('.r5-item-picture').first().evaluate(async image=>{if(!image.complete)await image.decode();assertImage(image);function assertImage(i){if(!i.naturalWidth)throw Error('Panel image not decoded')}});
    const panel=await page.locator('.r5-board-panel').boundingBox();
    const gameBounds=await page.locator('#game-container').boundingBox();
    assert(panel.x>=gameBounds.x&&panel.y>=gameBounds.y&&panel.x+panel.width<=gameBounds.x+gameBounds.width+1&&panel.y+panel.height<=gameBounds.y+gameBounds.height+1,'Counter board must fit inside the game, including letterboxed screens');
    await page.screenshot({path:path.join(dir,'board-seven-panels.png')});
    assert.deepEqual(errors,[],'No JavaScript errors');
    await ctx.close();
    console.log(spec.name+' Room 05 art and navigation validated');
  }finally{await browser.close()}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
