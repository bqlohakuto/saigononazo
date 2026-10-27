// Room 8 illustrations follow authored story IDs, rather than wrapped pages.
// The scene and its line remain authoritative; these are presentation only.
(function(){
  const root='images/background/room08/dialogue/';
  const frames=Object.freeze({
    overview:'overview-white.webp',
    white:'pov-white.webp',
    brown:'pov-brown.webp',
    smile:'pov-smile.webp',
    pout:'pov-pout.webp',
    serious:'pov-serious.webp',
    fading:'pov-fading.webp',
    request:'pov-request.webp',
    reunion:'pov-reunion.webp',
    warm:'close-warm.webp',
    fragile:'close-fragile.webp',
    surprised:'close-surprised.webp',
    holding:'hold-warm.webp',
    tears:'hold-tears.webp',
    farewell:'farewell.webp'
  });
  const introRules=[
    ['r8_entry_01','overview'],
    ['r8_reunion_19','white'],
    ['r8_reunion_21','brown'],
    ['r8_011','smile'],
    ['r8_memories_04','pout'],
    ['r8_memories_05','smile'],
    ['r8_memories_09','pout'],
    ['r8_memories_10','smile'],
    ['r8_memories_20','brown'],
    ['r8_020','serious'],
    ['r8_memory_truth_09','brown'],
    ['r8_memory_truth_10','serious'],
    ['r8_memory_truth_12','brown'],
    ['r8_memory_truth_13','serious'],
    ['r8_memory_truth_15','brown'],
    ['r8_032','serious'],
    ['r8_037','fading'],
    ['r8_043','request'],
    ['r8_stand_01','reunion'],
    ['r8_047',null]
  ];
  const solvedRules=[
    ['r8_solve_01',null],
    ['r8_return_02','reunion'],
    ['r8_return_04','warm'],
    ['r8_solve_22','fragile'],
    ['r8_solve_27','surprised'],
    ['r8_solve_31','holding'],
    ['r8_solve_37','tears']
  ];
  const indexOf=(lines,id)=>lines.findIndex(line=>line.logId===id);
  function select(lines,index,rules){
    let key=null;
    for(const [id,next] of rules){
      const at=indexOf(lines,id);
      if(at>=0&&index>=at)key=next;
    }
    return key;
  }
  function intro(lines,index){
    const seated=indexOf(lines,'r8_reunion_19');
    const hair=indexOf(lines,'r8_reunion_21');
    const light=indexOf(lines,'r8_stand_03');
    const disappear=indexOf(lines,'r8_046');
    const gone=indexOf(lines,'r8_047');
    return {
      key:select(lines,index,introRules),
      hidePortrait:seated>=0&&index>=seated,
      glow:gone>=0&&index>=gone?'none':disappear>=0&&index>=disappear?'white':light>=0&&index>=light?'soft':'none',
      duration:hair>=0&&index===hair?1800:300
    };
  }
  function solved(lines,index){
    return {key:select(lines,index,solvedRules),hidePortrait:true,glow:'none',duration:300};
  }
  function ending(lines,index){
    const turn=indexOf(lines,'r8_end_02');
    const light=indexOf(lines,'r8_end_02_light');
    const gone=indexOf(lines,'r8_end_05');
    return {
      key:turn>=0&&index>=turn?'farewell':null,
      hidePortrait:true,
      glow:gone>=0&&index>=gone?'white':light>=0&&index>=light?'soft':'none',
      duration:500
    };
  }

  // Keep only a small number of upcoming decoded images alive on mobile.
  const preloadCache=new Map();
  const upcoming={
    overview:['white','brown'], white:['brown','smile'], brown:['smile','pout'],
    smile:['pout','serious'], serious:['fading','request'], fading:['request','reunion'],
    request:['reunion','warm'], reunion:['warm','fragile'], warm:['fragile','surprised'],
    fragile:['surprised','holding'], surprised:['holding','tears'], holding:['tears','farewell']
  };
  function prefetch(keys){
    for(const key of keys){
      if(!frames[key]||preloadCache.has(key))continue;
      const image=new Image();
      image.decoding='async';
      image.src=root+frames[key];
      if(image.decode)image.decode().catch(()=>{});
      preloadCache.set(key,image);
      while(preloadCache.size>6)preloadCache.delete(preloadCache.keys().next().value);
    }
  }
  function apply(stage,state,immediate=false){
    if(!stage||!state)return;
    const gameRoot=stage.closest('#game');
    const dialog=gameRoot?.querySelector('.room-dialog-overlay');
    if(dialog){
      if(state.hidePortrait)dialog.dataset.r8Pov='true';
      else delete dialog.dataset.r8Pov;
    }
    const key=state.key;
    stage.dataset.r8Visual=key||'none';
    let layer=stage.querySelector('.r8-story-art');
    if(!key||!frames[key]){
      if(layer){layer._r8Sequence=(layer._r8Sequence||0)+1;layer.remove()}
      return;
    }
    if(!layer){
      layer=document.createElement('div');
      layer.className='r8-story-art';
      layer.setAttribute('aria-hidden','true');
      stage.appendChild(layer);
    }
    layer.dataset.glow=state.glow||'none';
    if(layer.dataset.requested===key)return;
    layer.dataset.requested=key;
    const sequence=layer._r8Sequence=(layer._r8Sequence||0)+1;
    const img=document.createElement('img');
    img.className='r8-story-frame';
    img.alt='';
    img.decoding='async';
    img.style.setProperty('--r8-art-duration',(immediate?0:(state.duration||300))+'ms');
    img.onload=()=>{
      const reveal=()=>{
        if(!layer.isConnected||layer._r8Sequence!==sequence){img.remove();return}
        const previous=[...layer.querySelectorAll('.r8-story-frame.is-visible')];
        const show=()=>{
          if(!layer.isConnected||layer._r8Sequence!==sequence){img.remove();return}
          // Keep the old opaque frame underneath throughout the crossfade so
          // a slow load never exposes the unrelated pixel-room background.
          img.classList.add('is-visible');
          setTimeout(()=>previous.forEach(old=>old.remove()),Math.max(0,immediate?0:(state.duration||300))+100);
        };
        if(immediate||previous.length===0)show();
        else requestAnimationFrame(()=>requestAnimationFrame(show));
      };
      if(img.decode)img.decode().then(reveal,reveal);else reveal();
    };
    img.onerror=()=>{
      // Keep the previous frame, and permit a retry on the next story line.
      if(layer._r8Sequence===sequence)delete layer.dataset.requested;
      img.remove();
    };
    layer.appendChild(img);
    img.src=root+frames[key];
    prefetch(upcoming[key]||[]);
  }
  window.Room8Visuals={frames,intro,solved,ending,apply,prefetch};
})();
