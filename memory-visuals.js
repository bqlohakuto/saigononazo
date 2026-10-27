// Presentation is keyed by authored LOG IDs so paging, AUTO and reload do not change presence.
(() => {
  const revealByRoom = Object.freeze({room01:'concealed',room02:'concealed',room03:'concealed',room04:'concealed',room05:'revealed',room06:'expressive',room07:'expressive'});
  const scenes = [{"key":"r2visit","room":"room02","background":"images/background/memories/room01/music-room.png","sprite":"images/characters/memories/room02/girl-blazer.png","layout":"standing","prop":null,"ids":["room2_memory_001","room2_memory_002","room2_memory_003","room2_memory_004","room2_memory_005","room2_memory_006","room2_memory_007","room2_memory_008","room2_memory_009","room2_memory_010","room2_memory_011","room2_memory_012","room2_memory_013","room2_memory_014"]},{"key":"r2leader","room":"room02","background":"images/background/memories/room02/high-school-music-room.png","sprite":"images/characters/memories/room02/girl-blazer.png","layout":"standing","prop":null,"ids":["room2_memory_015","room2_memory_016","room2_memory_017","room2_memory_018","room2_memory_019","room2_memory_020","room2_memory_021","room2_memory_022","room2_memory_023","room2_memory_024","room2_memory_025","room2_memory_026","room2_memory_027","room2_memory_028","room2_memory_029","room2_memory_030","room2_memory_031","room2_memory_032","room2_memory_033","room2_memory_034","room2_memory_035","room2_memory_036","room2_memory_037","room2_memory_038","room2_memory_039","room2_memory_040","room2_memory_041","room2_memory_042","room2_memory_043","room2_memory_044","room2_memory_045","room2_memory_046","room2_memory_047","room2_memory_048","room2_memory_049","room2_memory_050","room2_memory_051","room2_memory_052"]},{"key":"r2flower","room":"room02","background":"images/background/memories/room02/high-school-music-room.png","sprite":"images/characters/memories/room02/girl-blazer.png","layout":"standing","prop":null,"ids":["room2_memory_053","room2_memory_053_flower_01","room2_memory_053_flower_02"]},{"key":"r2paper","room":"room02","background":"images/background/memories/room02/music-room-paperwork.png","sprite":"images/characters/memories/room02/girl-blazer-seated.png","layout":"desk","prop":null,"ids":["room2_memory_054","room2_memory_055","room2_memory_056","room2_memory_057","room2_memory_058","room2_memory_059","room2_memory_060","room2_memory_061","room2_memory_062","room2_memory_063","room2_memory_064","room2_memory_065","room2_memory_066","room2_memory_067","room2_memory_068","room2_memory_069","room2_memory_070","room2_memory_071","room2_memory_072","room2_memory_073","room2_memory_074","room2_memory_075","room2_memory_076","room2_memory_077","room2_memory_078","room2_memory_079","room2_memory_080","room2_memory_081","room2_memory_082","room2_memory_083","room2_memory_084","room2_memory_085","room2_memory_086","room2_memory_087","room2_memory_088","room2_memory_089","room2_memory_090","room2_final_hanamaru","room2_memory_091","room2_memory_092","room2_memory_093","room2_memory_094","room2_memory_095","room2_memory_096"]},{"key":"r3phone","room":"room03","background":"images/background/memories/room03/student-apartment.png","sprite":null,"layout":"standing","prop":null,"ids":["room3_flashback_01","room3_flashback_02","room3_flashback_03","room3_flashback_04","room3_final_ringtone","room3_flashback_04_call","room3_flashback_05","room3_flashback_06","room3_flashback_07","room3_flashback_08","room3_flashback_09","room3_flashback_10","room3_flashback_11","room3_flashback_12","room3_flashback_13","room3_flashback_14","room3_flashback_15","room3_flashback_16","room3_flashback_17","room3_flashback_18","room3_flashback_19","room3_flashback_20","room3_flashback_21","room3_flashback_22","room3_flashback_23","room3_flashback_24","room3_flashback_25","room3_flashback_26","room3_flashback_27","room3_flashback_28","room3_flashback_29","room3_flashback_30","room3_flashback_31","room3_flashback_32"]},{"key":"r3wait","room":"room03","background":"images/background/memories/room03/cherry-riverside-night.png","sprite":null,"layout":"standing","prop":null,"ids":["room3_flashback_33","room3_flashback_34","room3_flashback_35"]},{"key":"r3meet","room":"room03","background":"images/background/memories/room03/cherry-riverside-night.png","sprite":"images/characters/memories/room03/girl-spring.png","layout":"standing","prop":null,"ids":["room3_flashback_36","room3_flashback_37","room3_flashback_38","room3_flashback_39","room3_flashback_40","room3_flashback_41","room3_flashback_42","room3_flashback_43","room3_flashback_44","room3_flashback_45","room3_flashback_46","room3_flashback_47","room3_flashback_48","room3_flashback_49","room3_flashback_50","room3_flashback_51","room3_flashback_52","room3_flashback_53","room3_flashback_54","room3_flashback_55","room3_flashback_56","room3_flashback_57","room3_flashback_58"]},{"key":"r3confess","room":"room03","background":"images/background/memories/room03/cherry-riverside-night.png","sprite":"images/characters/memories/room03/girl-spring.png","layout":"standing","prop":null,"ids":["room3_flashback_59","room3_flashback_60","room3_flashback_61","room3_flashback_62","room3_flashback_63","room3_flashback_64","room3_flashback_65","room3_flashback_66","room3_flashback_67","room3_flashback_68","room3_flashback_69","room3_flashback_70"]},{"key":"r3hands","room":"room03","background":"images/cg/memories/room03/right-hand-warmth-v4.png","sprite":null,"layout":"cg","prop":null,"ids":["room3_flashback_71"]},{"key":"r3fade","room":"room03","background":"images/background/memories/room03/cherry-riverside-night.png","sprite":null,"layout":"fade","prop":null,"ids":["room3_flashback_72"]},{"key":"r4show","room":"room04","background":"images/background/memories/room04/planetarium-dome.png","sprite":null,"layout":"standing","prop":null,"ids":["r4f01","r4f02","r4f03"]},{"key":"r4look","room":"room04","background":"images/cg/memories/room04/looking-at-stars.png","sprite":null,"layout":"cg","prop":null,"ids":["r4f04","r4f05"]},{"key":"r4guide","room":"room04","background":"images/background/memories/room04/planetarium-dome.png","sprite":null,"layout":"standing","prop":null,"ids":["r4f06","r4f07"]},{"key":"r4quiet","room":"room04","background":"images/cg/memories/room04/quiet-hand.png","sprite":null,"layout":"cg","prop":null,"ids":["r4f08","r4f09","r4f10"]},{"key":"r4front","room":"room04","background":"images/background/memories/room04/planetarium-dome.png","sprite":null,"layout":"standing","prop":null,"ids":["r4f11"]},{"key":"r4hall","room":"room04","background":"images/background/memories/room04/planetarium-corridor.png","sprite":"images/characters/memories/room03/girl-spring.png","layout":"standing","prop":null,"ids":["r4f12","r4f13","r4f14","r4f15","r4f16","r4f17","r4f18","r4f19","r4f20","r4f21","r4f22","r4f23","r4f24","r4f25","r4f26","r4f27","r4f28","r4f29","r4f30","r4f31","r4f32","r4f33","r4f34","r4f35","r4f36","r4f37","r4f38","r4f39","r4f40","r4f41","r4f42","r4f43","r4f44","r4f45","r4f46","r4f47","r4f48","r4f49"]},{"key":"r4missing","room":"room04","background":"images/background/memories/room04/planetarium-corridor.png","sprite":null,"layout":"fade","prop":null,"ids":["r4f50","r4f51","r4f52","r4f53","r4f54","r4f55","r4f56","r4f57","r4f58"]},{"key":"r5intro","room":"room05","background":"images/background/memories/room05/dining-moving-in.png","sprite":null,"layout":"standing","prop":null,"ids":["r5_memory_paper","r5_memory_fridge","r5_memory_dishes","r5_final_humming","r5_memory_light"]},{"key":"r5first","room":"room05","background":"images/background/memories/room05/dining-moving-in.png","sprite":"images/characters/memories/room05/girl-seated-pen.png","layout":"dining","prop":"rabbit","ids":["r5m001","r5m002","r5m003","r5m004","r5m005","r5m006","r5m007","r5m008","r5m009","r5m010","r5m011","r5m012","r5m013","r5m014","r5m015","r5m016","r5m017","r5m018","r5m019"]},{"key":"r5notebook","room":"room05","background":"images/background/memories/room05/dining-moving-in.png","sprite":"images/characters/memories/room05/girl-seated-pout.png","layout":"dining","prop":"notebook","ids":["r5m020","r5m021","r5m022","r5m023","r5m024","r5m025","r5m026","r5m027","r5m028","r5m029","r5m030","r5m031","r5m032","r5m033","r5m034","r5m035","r5m036","r5m037","r5m038","r5m039","r5m040","r5m041","r5m042","r5m043","r5m044","r5m045","r5m046","r5m047","r5m048","r5m049","r5m050","r5m051","r5m052","r5m053","r5m054","r5m055","r5m056","r5m057","r5m058","r5m059","r5m060","r5m061","r5m062","r5m063","r5m064","r5m065","r5m066","r5m067","r5m068","r5m069","r5m070","r5m071","r5m072","r5m073","r5m074","r5m075","r5m076","r5m077","r5m078","r5m079","r5m080","r5m081","r5m082","r5m083","r5m084","r5m085","r5m086","r5m087","r5m088","r5m089","r5m090","r5m091"]},{"key":"r5morning","room":"room05","background":"images/background/memories/room05/living-morning.png","sprite":"images/characters/memories/room05/girl-drowsy.png","layout":"sofa","prop":null,"ids":["r5m101","r5m102","r5m103","r5m104","r5m105","r5m106","r5m107","r5m108","r5m109","r5m110"]},{"key":"r5cooking","room":"room05","background":"images/background/memories/room05/kitchen-evening.png","sprite":"images/characters/memories/room05/girl-cooking.png","layout":"cooking","prop":null,"ids":["r5m120","r5m121","r5m122","r5m123","r5m124","r5m125","r5m126","r5m127","r5m128","r5m129","r5m130","r5m131","r5m132","r5m133","r5m134","r5m135","r5m136","r5m137","r5m138","r5m139","r5m140","r5m141"]},{"key":"r5appliance","room":"room05","background":"images/background/memories/room05/living-morning.png","sprite":"images/characters/memories/room05/girl-home.png","layout":"standing","prop":"manual","ids":["r5m150","r5m151","r5m152","r5m153","r5m154","r5m155","r5m156","r5m157","r5m158","r5m159","r5m160","r5m161","r5m162","r5m163","r5m164","r5m165","r5m166","r5m167","r5m168","r5m169","r5m170","r5m171","r5m172","r5m173","r5m174"]},{"key":"r5holiday","room":"room05","background":"images/background/memories/room05/living-morning.png","sprite":"images/characters/memories/room05/girl-home.png","layout":"standing","prop":null,"ids":["r5m180","r5m181","r5m182","r5m183","r5m184","r5m185","r5m186","r5m187","r5m188","r5m189","r5m190","r5m191","r5m192","r5m193","r5m194","r5m195"]},{"key":"r5park","room":"room05","background":"images/background/memories/room05/neighborhood-park.png","sprite":"images/characters/memories/shared/girl-cardigan-walk.png","layout":"standing","prop":null,"ids":["r5m196","r5m197","r5m198"]},{"key":"r5homeNight","room":"room05","background":"images/background/memories/room05/dining-night.png","sprite":"images/characters/memories/room05/girl-home.png","layout":"standing","prop":null,"ids":["r5m200","r5m201","r5m202","r5m203","r5m204","r5m205","r5m206","r5m207","r5m208","r5m209","r5m210","r5m211","r5m212","r5m213"]},{"key":"r5walk","room":"room05","background":"images/background/memories/shared/residential-night.png","sprite":"images/characters/memories/shared/girl-cardigan-walk.png","layout":"standing","prop":null,"ids":["r5m214","r5m215","r5m216","r5m217","r5m218","r5m219","r5m220","r5m221","r5m222","r5m223","r5m224"]},{"key":"r5days","room":"room05","background":"images/background/memories/room05/living-morning.png","sprite":null,"layout":"standing","prop":null,"ids":["r5m092","r5m100","r5m225","r5m226"]},{"key":"r5cards","room":"room05","background":"images/background/memories/room05/dining-night.png","sprite":"images/characters/memories/room05/girl-seated-pen.png","layout":"dining","prop":"cards","ids":["r5m230","r5m231","r5m232","r5m233","r5m234","r5m235","r5m236","r5m237","r5m238","r5m239","r5m240","r5m241","r5m242","r5m243","r5m244","r5m245","r5m246","r5m247","r5m248","r5m249","r5m250","r5m251","r5m252","r5m253","r5m254","r5m255","r5m256","r5m257","r5m258","r5m259","r5m260","r5m261","r5m262","r5m263","r5m264","r5m265","r5m266","r5m267","r5m268","r5m269","r5m270","r5m271","r5m272","r5m273","r5m274","r5m275","r5m276","r5m277","r5m278","r5m279","r5m280","r5m281","r5m282","r5m283","r5m284","r5m285","r5m286","r5m287","r5m288","r5m289","r5m290","r5m291","r5m292","r5m293","r5m294","r5m295","r5m296","r5m297","r5m298","r5m299","r5m300"]},{"key":"r6return","room":"room06","background":"images/background/memories/room05/dining-night.png","sprite":"images/characters/memories/room05/girl-home.png","layout":"standing","prop":"notebook","ids":["r6_memory_full_001","r6_memory_full_002","r6_memory_full_003","r6_memory_full_004","r6_memory_full_005","r6_memory_full_006","r6_memory_full_007","r6_memory_full_008","r6_memory_full_009","r6_memory_full_010","r6_memory_full_011","r6_memory_full_012","r6_memory_full_013","r6_memory_full_014","r6_memory_full_015","r6_memory_full_016","r6_memory_full_017"]},{"key":"r6question","room":"room06","background":"images/background/memories/room05/dining-night.png","sprite":"images/characters/memories/room06/girl-home-worried.png","layout":"standing","prop":null,"ids":["r6_memory_full_018","r6_memory_full_019","r6_memory_full_020","r6_memory_full_021","r6_memory_full_022","r6_memory_full_023","r6_memory_full_024","r6_memory_full_025","r6_memory_full_026","r6_memory_full_027","r6_memory_full_028","r6_memory_full_029","r6_memory_full_030"]},{"key":"r6puzzle","room":"room06","background":"images/background/memories/room05/dining-night.png","sprite":"images/characters/memories/room05/girl-seated-pen.png","layout":"dining","prop":null,"ids":["r6_memory_full_031","r6_memory_full_032","r6_memory_full_033","r6_memory_full_034","r6_memory_full_035","r6_memory_full_036","r6_memory_full_037","r6_memory_full_038","r6_memory_full_039","r6_memory_full_040","r6_memory_full_041","r6_memory_full_042","r6_memory_full_043","r6_memory_full_044","r6_memory_full_045","r6_memory_full_046","r6_memory_full_047","r6_memory_full_048","r6_memory_full_049","r6_memory_full_050"]},{"key":"r6walk","room":"room06","background":"images/background/memories/shared/residential-night.png","sprite":"images/characters/memories/shared/girl-cardigan-walk.png","layout":"standing","prop":null,"ids":["r6_memory_full_051","r6_final_signal","r6_memory_full_052","r6_memory_full_053","r6_memory_full_054","r6_memory_full_055","r6_memory_full_056","r6_memory_full_057","r6_memory_full_058","r6_memory_full_059","r6_memory_full_060","r6_memory_full_061","r6_memory_full_062","r6_memory_full_063","r6_memory_full_064"]},{"key":"r6thanks","room":"room06","background":"images/background/memories/shared/residential-night.png","sprite":"images/characters/memories/shared/girl-cardigan-walk.png","layout":"standing","prop":null,"ids":["r6_memory_01","r6_memory_02","r6_memory_03","r6_memory_04","r6_memory_05","r6_memory_06","r6_memory_07"]},{"key":"r6continue","room":"room06","background":"images/background/memories/shared/residential-night.png","sprite":"images/characters/memories/shared/girl-cardigan-walk.png","layout":"standing","prop":null,"ids":["r6_memory_full_072","r6_memory_full_073","r6_memory_full_074","r6_memory_full_075","r6_memory_full_076","r6_memory_full_077","r6_memory_full_078","r6_memory_full_079","r6_memory_full_080","r6_memory_full_081","r6_memory_full_082","r6_memory_full_083","r6_memory_full_084","r6_memory_full_085","r6_memory_full_086"]},{"key":"r7walk","room":"room07","background":"images/background/memories/room07/walk-after-game.png","sprite":"images/characters/memories/room07/girl-denim-donut.png","layout":"standing","prop":null,"ids":["r7_mem_01","r7_mem_02","r7_mem_03","r7_mem_04","r7_mem_05","r7_mem_06","r7_mem_07","r7_mem_08","r7_mem_09","r7_mem_10","r7_mem_11","r7_mem_12","r7_mem_13"]},{"key":"r7donut","room":"room07","background":"images/background/memories/room07/walk-after-game.png","sprite":"images/characters/memories/room07/girl-denim-donut.png","layout":"standing","prop":null,"ids":["r7_mem_14","r7_mem_15","r7_mem_16","r7_mem_17","r7_mem_18","r7_mem_19","r7_mem_20","r7_mem_21","r7_mem_22","r7_mem_23","r7_mem_24","r7_mem_25"]},{"key":"r7turn","room":"room07","background":"images/cg/memories/room07/turning-back.png","sprite":null,"layout":"cg","prop":null,"ids":["r7_mem_26","r7_mem_27","r7_mem_28","r7_mem_29","r7_mem_30"]},{"key":"r7reach","room":"room07","background":"images/cg/memories/room07/reaching-out.png","sprite":null,"layout":"cg","prop":null,"ids":["r7_mem_31","r7_mem_32","r7_mem_33","r7_mem_34"]},{"key":"r7red","room":"room07","background":"images/cg/memories/room07/reaching-out.png","sprite":null,"layout":"red","prop":null,"ids":["r7_mem_35","r7_mem_36","r7_mem_37"]}];
  // The tiger door revisits the earlier, concealed-face period of her life.
  scenes.push({key:'r7tiger',room:'room07',reveal:'concealed',
    background:'images/background/memories/room01/walk-home.png',
    sprite:'images/characters/memories/room03/girl-spring.png',layout:'standing',prop:null,
    ids:Array.from({length:20},(_,i)=>'r7_mem_tiger_'+String(i+1).padStart(2,'0'))});
  // The senior is on the phone, so she is not physically present in this memory.
  scenes.push({key:'r7rabbit',room:'room07',reveal:'concealed',
    background:'images/background/memories/room02/music-room-paperwork.png',
    sprite:null,layout:'standing',prop:null,
    ids:Array.from({length:18},(_,i)=>'r7_mem_rabbit_'+String(i+1).padStart(2,'0'))});
  const byId = new Map();
  for (const scene of scenes) for (const id of scene.ids) byId.set(scene.room+':'+id,scene);
  function original(sceneId, line) {
    let id=String(line?.logSource?.logId||line?.logId||'').replace(/^room0([123])_/, 'room$1_');
    while (id) {
      if (byId.has(sceneId+':'+id)) return {id,scene:byId.get(sceneId+':'+id)};
      const next=id.replace(/_\d+$/, '');
      if(next===id)break;
      id=next;
    }
    return null;
  }
  function get(sceneId,line) {
    const raw=String(line?.logSource?.logId||line?.logId||'');
    if(sceneId==='room01'){
      const beat=raw.match(/^room0?1_memory_(music_room|bus)_(\d{2})(?:_\d+)*$/);
      if(!beat)return null;
      const outdoors=beat[1]==='bus', n=Number(beat[2]);
      const location=outdoors?'walk-home':'music-room';
      const visual={sceneId,reveal:revealByRoom[sceneId],logId:raw,location,layout:'standing',background:'images/background/memories/room01/'+location+'.png'};
      // Once present, she stays through narration and thoughts until she boards the bus.
      if(outdoors?n>=2&&n<=24:n>=16)visual.sprite='images/characters/memories/room01/girl-approved.png';
      return visual;
    }
    const match=original(sceneId,line);
    if(!match)return null;
    const {id,scene}=match;
    const visual={sceneId,reveal:scene.reveal||revealByRoom[sceneId],logId:id,location:scene.key,layout:scene.layout,background:scene.background,prop:scene.prop};
    let sprite=scene.sprite;
    const number=Number(id.match(/(?:memory_|flashback_|^r5m|^r4f)(\d+)/)?.[1]);
    if(scene.key==='r2visit'&&number<3 || scene.key==='r2leader'&&number<21 || scene.key==='r2flower'&&id==='room2_memory_053')sprite=null;
    if(id==='room2_memory_014')sprite=null;
    if(scene.key==='r2paper'&&number===96)visual.effect='white';
    if(scene.key==='r5first'&&number<4 || scene.key==='r5cooking'&&number===120 || scene.key==='r5holiday'&&number===180)sprite=null;
    if(scene.key==='r5notebook'&&!(number>=37&&number<=46))sprite='images/characters/memories/room05/girl-seated-pen.png';
    if(id==='r5m018'||id==='r5m019')sprite='images/characters/memories/room05/girl-seated-pout.png';
    // These thoughts remain in the current conversation; they are not new locations.
    if(id==='r5m092'){visual.background='images/background/memories/room05/dining-moving-in.png';visual.layout='dining';sprite='images/characters/memories/room05/girl-seated-pen.png'}
    if(id==='r5m225'||id==='r5m226'){visual.background='images/background/memories/shared/residential-night.png';sprite='images/characters/memories/shared/girl-cardigan-walk.png'}
    if(scene.key==='r6return'&&Number(id.match(/full_(\d+)/)?.[1])<5 || id==='r6_memory_full_018')sprite=null;
    if(scene.key==='r7walk'&&Number(id.match(/mem_(\d+)/)?.[1])<3)sprite=null;
    if(id==='r6_memory_full_086'||id==='r4f58'||id==='room3_flashback_72'){sprite=null;visual.effect='white'}
    if(scene.layout==='fade'&&id!=='r4f58'&&id!=='room3_flashback_72'){
      visual.layout='standing';
      if(sceneId==='room04')sprite='images/characters/memories/room03/girl-spring.png';
    }
    if(scene.layout==='red'){visual.effect='red';visual.layout='cg'}
    if(sprite)visual.sprite=sprite;
    if(sceneId==='room05')visual.presentation='dialogue';
    return visual;
  }
  const prepared=new Set();
  function prepare(sceneId,lines){
    for(const line of lines){
      const v=get(sceneId,line);
      for(const path of [v?.background,v?.sprite,...propPaths(v?.prop)]){
        if(!path||prepared.has(path))continue;
        prepared.add(path);const im=new Image();im.src=path;
      }
    }
  }
  function propPaths(prop){
    if(prop==='rabbit')return ['images/background/room05/combinations/rabbit-feather.png'];
    if(prop==='cards')return ['images/background/room05/combinations/rabbit-feather.png',...['mirror','fish','butterfly','flower','squid','chair','cannon'].map(n=>'images/items/memories/cards/'+n+'.webp')];
    return [];
  }
  function picture(cls,path){const im=document.createElement('img');im.className=cls;im.alt='';im.draggable=false;if(path)im.src=path;return im}
  function sync(visual){
    const root=document.getElementById('game');if(!root)return;
    let stage=root.querySelector('.memory-scene');
    if(!visual){
      delete root.dataset.memoryStage;stage?.remove();
      root.querySelectorAll('.memory-window-portrait').forEach(el=>el.remove());
      root.querySelector('.room-dialog')?.classList.remove('has-memory-portrait');return;
    }
    root.dataset.memoryStage=visual.reveal;
    if(!visual.background){stage?.remove();return}
    if(!stage){
      stage=document.createElement('div');stage.className='memory-scene';stage.setAttribute('aria-hidden','true');
      stage.append(picture('memory-background'),picture('memory-girl'),picture('memory-foreground'));
      const prop=document.createElement('div');prop.className='memory-prop';stage.append(prop);
      const effect=document.createElement('div');effect.className='memory-effect';stage.append(effect);root.append(stage);
    }
    stage.dataset.location=visual.location;stage.dataset.layout=visual.layout||'standing';stage.dataset.effect=visual.effect||'';stage.dataset.presentation=visual.presentation||'scene';
    const bg=stage.querySelector('.memory-background');if(bg.getAttribute('src')!==visual.background)bg.src=visual.background;
    let sprite=root.querySelector('.memory-girl');
    if(!sprite){sprite=picture('memory-girl');stage.append(sprite);}
    if(visual.sprite&&sprite.getAttribute('src')!==visual.sprite)sprite.src=visual.sprite;sprite.hidden=!visual.sprite;
    const dialog=root.querySelector('.room-dialog');
    let portrait=dialog?.querySelector('.memory-window-portrait');
    const onWindow=visual.presentation==='dialogue'&&!!dialog;
    if(onWindow){
      if(!portrait){portrait=document.createElement('div');portrait.className='memory-window-portrait';portrait.setAttribute('aria-hidden','true');dialog.append(portrait);}
      if(sprite.parentElement!==portrait)portrait.append(sprite);
      portrait.hidden=!visual.sprite;
    }else{
      if(sprite.parentElement!==stage)stage.append(sprite);
      portrait?.remove();
    }
    dialog?.classList.toggle('has-memory-portrait',onWindow&&!!visual.sprite);
    const foreground=stage.querySelector('.memory-foreground');
    foreground.hidden=onWindow||!['dining','desk','sofa','cooking'].includes(visual.layout);
    if(!foreground.hidden&&foreground.getAttribute('src')!==visual.background)foreground.src=visual.background;
    const prop=stage.querySelector('.memory-prop');
    if(prop.dataset.kind!==(visual.prop||'')){
      prop.replaceChildren();prop.dataset.kind=visual.prop||'';
      for(const path of propPaths(visual.prop))prop.append(picture('memory-prop-image',path));
      if(visual.prop==='notebook'){const book=document.createElement('div');book.className='memory-notebook';book.append(document.createElement('i'),document.createElement('i'));prop.append(book)}
      if(visual.prop==='manual'){const box=document.createElement('div');box.className='memory-appliance-box';box.append(document.createElement('i'));prop.append(box)}
    }
    prop.hidden=!visual.prop;
  }
  window.MemoryVisuals=Object.freeze({get,prepare,sync,revealByRoom});
})();
