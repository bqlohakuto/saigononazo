/* Shared optional inspection UI. Only the existing log/visited UI is persisted. */
(() => {
 const busy=()=>game.querySelector('.room-dialog-overlay,.device-overlay,.design-overlay,.inspection-overlay,.save-slot-overlay,.r6-travel-shade');
 const entries=sceneId=>window.RoomExplorationScenes?.[sceneId]||[];
 function describe(sceneId,id,state){
  if(currentScene!==sceneId||busy())return;
  const item=entries(sceneId).find(entry=>entry.id===id);
  if(!item)return;
  const quiet=sceneId==='room03'&&!state.bedInspected&&item.quiet;
  const source=quiet||item.lines,variant=quiet?'quiet':'first';
  const prefix=`explore_${sceneId}_${id}_${variant}`;
  const readKey=`${id}_${variant}`;
  // Retain the original LOG-based check for saves made before completion flags existed.
  // expandScenario appends _01 to the first sentence of each source line.
  const read=state?.optionalExplorationRead?.[readKey]===true||
   GameLog.has(`${prefix}_${source.length-1}_01`);
  const lines=(read?[['ト書き',item.repeat]]:source).map(([speaker,text],i)=>({
   logId:read?`explore_${sceneId}_${id}_repeat`:`${prefix}_${i}`,
   logType:speaker==='ト書き'?'investigation':'dialogue',speaker,text,
   logRoom:sceneId,logTarget:item.label
  }));
  showRoomDialog(lines,()=>{
   if(read||!state)return;
   // Explicit completion survives changes to pagination, sentence splitting and text.
   state.optionalExplorationRead||={};
   state.optionalExplorationRead[readKey]=true;
   saveGame();
  });
 }
 function mount(sceneId,stage,view,state,{image,imageAspect=1.5,cover=false}={}){
  if(!stage)return;
  stage.querySelector('.ambient-layer')?.remove();
  const layer=document.createElement('div');layer.className='ambient-layer';
  if(cover)layer.classList.add('ambient-cover');
  const origin=stage;
  for(const item of entries(sceneId)){
   if(item.existing||(item.view&&item.view!==view)||(item.when==='awake'&&!state.bedInspected))continue;
   const [x,y,w,h]=item.rect;
   const button=document.createElement('button');
   button.type='button';button.className='object ambient-target';
   button.id=`explore-${sceneId}-${item.id}`;
   button.setAttribute('aria-label',`${item.label}を調べる`);
   const label=document.createElement('span');label.textContent=item.label;button.append(label);
   if(item.asset){
    // New decor has its own visible art, rather than an invisible hotspot
    // on unaltered scenery. Keep the drawing and its interaction aligned.
    button.classList.add('ambient-prop');
    const art=document.createElement('img');
    art.className='ambient-prop-image';art.src=item.asset;art.alt='';art.draggable=false;
    art.setAttribute('aria-hidden','true');
    button.append(art);
   }
   Object.assign(button.style,{left:`${x*100}%`,top:`${y*100}%`,width:`${w*100}%`,height:`${h*100}%`});
   button.addEventListener('click',()=>{
    if(currentScene!==sceneId||!origin.isConnected||busy())return;
    const left=Math.max(0,x-.025),top=Math.max(0,y-.025);
    const crop=item.crop||[left,top,Math.min(1,x+w+.025)-left,Math.min(1,y+h+.025)-top];
    showItemInspection({container:game,item:item.asset?{label:item.label,image:item.asset,imageAspect:item.assetAspect||1.75}:{label:item.label,image,imageAspect,crop},onContinue:()=>{
     if(origin.isConnected)describe(sceneId,item.id,state);
    }});
   });
   layer.append(button);
  }
  if(layer.children.length)stage.append(layer);
 }
 window.RoomExploration={mount,describe};
})();
