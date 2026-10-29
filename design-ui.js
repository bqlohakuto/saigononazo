// Shared presentation only: puzzle rules and story progression stay in their room modules.
(() => {
  // Resolve the local font before any title action creates paginated dialogue.
  let neutralReadyResolve,fullReadyResolve;
  const neutralReady=new Promise(resolve=>{neutralReadyResolve=resolve});
  const fullReady=new Promise(resolve=>{fullReadyResolve=resolve});
  let titleReady=!document.fonts;
  const fontLoading=document.fonts?document.fonts.load('16px "DotGothic16"').catch(()=>[]):Promise.resolve();
  const titleReadyPromise=Promise.all([fontLoading,neutralReady,fullReady]).then(()=>{titleReady=true});
  document.addEventListener('click',event=>{
    const target=event.target.closest?.('.title-screen button');
    if(titleReady||!target||target.disabled)return;
    event.preventDefault();event.stopImmediatePropagation();
    titleReadyPromise.then(()=>{if(target.isConnected)target.click()});
  },true);
  let config=null,sequence=0,dialogueGroup='',inspectionTarget='',modal=null,portraitVisible=false,pendingUse=null;
  let recordRoom='',recordCategory=localStorage.getItem('saigononazo-record-category')||'all',recordPage=0,expression=0;
  const hooked=new WeakSet(),inputHooked=new WeakSet(),choiceHooked=new WeakSet();
  const roomNames=['第一','第二','第三','第四','第五','第六','第七','第八'];
  const roomLabel=id=>/^room0[1-8]$/.test(id)?roomNames[Number(id.slice(-1))-1]+'の部屋':'オープニング';
  const state=()=>{roomStates.uiDesign||={};const s=roomStates.uiDesign;s.investigated||={};s.hints||={};s.inputs||={};s.visited||=[];return s};
  const button=(label,fn,cls='')=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.className=cls;b.onclick=fn;return b};
  const paragraph=text=>{const p=document.createElement('p');p.textContent=text;return p};
  const fullscreenElement=()=>document.fullscreenElement||document.webkitFullscreenElement;
  const standalone=()=>navigator.standalone===true||matchMedia('(display-mode:standalone)').matches||(!fullscreenElement()&&matchMedia('(display-mode:fullscreen)').matches);
  let roomImageSize=localStorage.getItem('saigononazo-room-image-size')==='large'?'large':'fit',roomImageKey='',lastRoomImage=null,fullscreenBusy=false;
  function displayHelp(failed=false){
    const m=panel('全画面表示');
    m.content.append(paragraph(standalone()?'ホーム画面から起動した表示でプレイ中です。端末を横向きにすると、画面を広く使えます。':failed?'このブラウザでは全画面への切り替えができませんでした。ブラウザで直接開くか、ホーム画面から起動してください。':'このブラウザでは全画面ボタンに対応していません。ホーム画面から起動すると、アドレスバーのない表示でプレイできます。'));
    if(!standalone())m.content.append(paragraph('iPhone・iPad：Safariの共有メニュー →「ホーム画面に追加」。追加したアイコンから開き、端末を横向きにしてください。'),paragraph('Android：ブラウザのメニュー →「ホーム画面に追加」または「アプリをインストール」。'));
  }
  async function toggleFullscreen(){
    if(fullscreenBusy)return;
    if(standalone()){displayHelp();return}
    const root=document.documentElement,active=fullscreenElement(),request=root.requestFullscreen||root.webkitRequestFullscreen,exit=document.exitFullscreen||document.webkitExitFullscreen;
    if(active?!exit:!request){displayHelp();return}
    fullscreenBusy=true;
    try{
      if(active)await exit.call(document);
      else{
        // Request directly within the tap handler; user activation cannot survive a deferred click.
        await request.call(root,{navigationUI:'hide'});
        if(matchMedia('(pointer:coarse)').matches&&screen.orientation?.lock)try{await screen.orientation.lock('landscape')}catch{}
      }
    }catch{displayHelp(true)}finally{fullscreenBusy=false;syncDisplayButtons()}
  }
  function syncDisplayButtons(){
    const active=!!fullscreenElement(),label=active?'全画面を終了':standalone()?'画面の案内':'全画面';
    document.querySelectorAll('[data-display-fullscreen]').forEach(b=>{if(b.textContent!==label)b.textContent=label;b.setAttribute('aria-pressed',String(active));b.disabled=fullscreenBusy});
  }
  function fullscreenButton(cls=''){const b=button('全画面',toggleFullscreen,cls);b.dataset.displayFullscreen='';return b}
  function syncRoomImage(){
    const scene=game.querySelector('.r7-scene'),wrap=scene?.parentElement;
    if(!scene){lastRoomImage=null;return}
    const key=[wrap.clientWidth,wrap.clientHeight,roomImageSize].join(':');
    if(lastRoomImage===scene&&roomImageKey===key)return;
    lastRoomImage=scene;roomImageKey=key;
    if(roomImageSize==='large'){
      const width=Math.min(wrap.clientWidth,wrap.clientHeight*1.5)*1.2;
      scene.style.width=width+'px';scene.style.height=width/1.5+'px';scene.style.maxWidth='none';
    }else{scene.style.removeProperty('width');scene.style.removeProperty('height');scene.style.removeProperty('max-width')}
    wrap.scrollLeft=(wrap.scrollWidth-wrap.clientWidth)/2;wrap.scrollTop=(wrap.scrollHeight-wrap.clientHeight)/2;
  }
  document.addEventListener('fullscreenchange',syncDisplayButtons);
  document.addEventListener('webkitfullscreenchange',syncDisplayButtons);
  if(window.ResizeObserver)new ResizeObserver(syncRoomImage).observe(game);
  else window.addEventListener('resize',syncRoomImage);
  const portraitExpressions=['gentle','happy','thought','surprise','concern','serious'];
  const hanaV2Names=['gentle','happy','thought','surprise','concern','serious','sleepy','neutral','excited'];
  const hanaV2Base='images/characters/hana-current/';
  const pixelPortraitNames={gentle:'neutral',happy:'joy',thought:'thinking',surprise:'surprise',concern:'sadness',serious:'serious',sleepy:'sleepy',neutral:'neutral',excited:'laughter'};
  const hanaV2Ready=new Set();
  // Retain decoded images for the lifetime of the presentation. A load event
  // alone does not mean a new background/frame is ready to paint.
  const hanaImageCache=new Map();
  function loadHanaImage(url){
    if(hanaImageCache.has(url))return hanaImageCache.get(url).ready;
    const image=new Image();
    const entry={image,ready:null};
    entry.ready=new Promise(resolve=>{
      image.onload=async()=>{
        try{if(typeof image.decode==='function')await image.decode();resolve(image)}catch{resolve(null)}
      };
      image.onerror=()=>resolve(null);
    });
    hanaImageCache.set(url,entry);image.src=url;
    return entry.ready;
  }
  const hanaV2Url=name=>{if(name==='full')return 'images/characters/hana-hires/idle/01.webp';const face=pixelPortraitNames[name]||'neutral';return (face==='neutral'?'images/characters/hana-hires/portrait-neutral.webp':hanaV2Base+'portraits/'+face+'.webp')+'?v=20261015-hana-hires-sleep-01'};
  for(const name of ['full',...hanaV2Names]){
    loadHanaImage(hanaV2Url(name)).then(image=>{
      if(image){
        hanaV2Ready.add(name);
        if(name==='full'){game.classList.add('hana-v2-full-ready');syncHud()}
        const portrait=game.querySelector('.hana-portrait');
        if(portrait)setExpression(portrait);
      }
      if(name==='neutral')neutralReadyResolve();
      if(name==='full')fullReadyResolve();
    });
  }
  // Blink only after all retained frames are decoded; failure keeps the still image.
  Promise.all([1,2,3,4].map(frame=>loadHanaImage('images/characters/hana-hires/idle/0'+frame+'.webp')))
    .then(loaded=>{if(loaded.every(Boolean))game.classList.add('hana-idle-ready')});
  const worldExpressions=new Set();
  const worldExpressionUrl=name=>'images/characters/hana-hires/expressions/'+(name==='excited'?'happy':name)+'.webp';
  for(const name of ['happy','thought','surprise','concern','serious','sleepy'])loadHanaImage(worldExpressionUrl(name)).then(image=>{
    if(!image)return;worldExpressions.add(name);
    const portrait=game.querySelector('.hana-portrait');if(portrait)setExpression(portrait);
    syncWorldExpression(!game.querySelector('.room-dialog-overlay')||!!game.querySelector('.memory-scene'));
  });
  // Portrait, full-body sprite and bubble share the displayed expression.

  function syncWorldExpression(clear=false){
    game.classList.remove('has-world-expression');
    game.style.removeProperty('--hana-world-expression');
    const sprite=game.querySelector('#openingHanaSprite');
    if(sprite&&!clear)sprite.dataset.emotion='idle';
    const bubbleNames={happy:'joy',thought:'thinking',surprise:'question',concern:'sweat',serious:'thinking',excited:'laughter',sleepy:'thinking'};
    const name=hanaV2Names[expression]||'gentle';
    const displayed=game.querySelector('.hana-portrait')?.dataset.displayedExpression||name;
    const worldName=displayed==='excited'?'happy':displayed;
    const worldUrl=!clear&&worldExpressions.has(worldName)?worldExpressionUrl(worldName):'images/characters/hana-hires/idle/01.webp';
    if(!clear&&worldExpressions.has(worldName)){game.classList.add('has-world-expression');game.style.setProperty('--hana-world-expression','url("'+worldUrl+'")');}
    if(sprite&&sprite.getAttribute('src')!==worldUrl)sprite.src=worldUrl;
    const bubble=clear?'':bubbleNames[displayed]||'';
    game.querySelectorAll('.hana-object,.room2-hana,.room3-hana,.r4hana,.hana-v2-world').forEach(target=>{
      let image=target.querySelector('.hana-emotion-bubble');
      if(!bubble){image?.remove();return;}
      if(!image){image=document.createElement('img');image.className='hana-emotion-bubble';image.alt='';image.setAttribute('aria-hidden','true');target.append(image);}
      const src='images/pixel-ui/bubbles-side/right/'+bubble+'.png';
      if(image.getAttribute('src')!==src)image.src=src;
    });
  }
  function panel(title){
    if(modal)modal.close();
    const opener=document.activeElement,o=document.createElement('div');o.className='design-overlay';
    const p=document.createElement('section');p.className='design-panel';p.setAttribute('role','dialog');p.setAttribute('aria-modal','true');p.setAttribute('aria-label',title);
    const head=document.createElement('header'),h=document.createElement('h2');h.textContent=title;
    const closeButton=button('閉じる',()=>close());head.append(h,closeButton);p.append(head);
    const content=document.createElement('div');content.className='design-content';p.append(content);o.append(p);game.append(o);
    o.addEventListener('click',e=>{if(e.target===o)close()});
    const siblings=[...game.children].filter(el=>el!==o).map(el=>[el,el.inert]);siblings.forEach(([el])=>el.inert=true);
    Dialogue.suspend();
    function close(){if(!o.isConnected)return;o.remove();siblings.forEach(([el,inert])=>el.inert=inert);document.removeEventListener('keydown',keys,true);modal=null;Dialogue.resume();if(opener?.isConnected&&!opener.closest('[inert]'))opener.focus({preventScroll:true})}
    function keys(e){if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}else if(e.key==='Tab'){const controls=[...p.querySelectorAll('button:not(:disabled),input,select')].filter(el=>!el.closest('[hidden]'));if(!controls.length)return;const i=controls.indexOf(document.activeElement);e.preventDefault();e.stopImmediatePropagation();controls[(i+(e.shiftKey?-1:1)+controls.length)%controls.length].focus()}}
    document.addEventListener('keydown',keys,true);modal={o,p,content,close};closeButton.focus({preventScroll:true});return modal;
  }
  // Measure Japanese text with the same font and preserve every character and explicit line break.
  function splitText(text,maxWidth,font,maxLines=3){
    const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)return [text||''];ctx.font=font;
    const pages=[];let page='',line='',count=1;
    for(const char of Array.from(text||'')){
      const wrap=char==='\n'||(line&&ctx.measureText(line+char).width>maxWidth);
      if(wrap){if(count===maxLines){pages.push(page);page='';count=1}else count++;line=''}
      page+=char;if(char!=='\n')line+=char;
    }
    if(page||!pages.length)pages.push(page);return pages;
  }
  function paginateDialogue(lines,isRead){
    const area=game.querySelector('.room-dialog .dialog-message-area');if(!area)return lines;
    const width=Math.max(100,area.clientWidth);
    const w=game.clientWidth,large=document.documentElement.dataset.gameTextSize==='large';
    const size=large?Math.max(16,Math.min(32,w*.022)):Math.max(11,Math.min(26,w*.018));
    const dialog=area.closest('.room-dialog'),css=getComputedStyle(dialog);
    const fullWidth=dialog.clientWidth-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight);
    const portraitGutter=parseFloat(css.getPropertyValue('--memory-portrait-gutter'))||260;
    return lines.flatMap((line,index)=>{
      const visual=window.MemoryVisuals?.get(currentScene,line);
      const onWindow=visual?.presentation==='dialogue',hasPortrait=onWindow&&!!visual.sprite;
      const lineWidth=onWindow?Math.max(100,fullWidth-(hasPortrait?portraitGutter:0)):width;
      const hasSpeaker=onWindow?!['ト書き','システム'].includes(line.speaker):line.speaker==='ハナ'||line.speaker==='花音';
      const maxLines=Math.max(1,Math.min(3,Math.floor((area.clientHeight-(hasSpeaker?size:0))/(size*1.55))));
      return splitText(line.text,lineWidth,`${size}px "DotGothic16", "Yu Gothic", Meiryo, sans-serif`,maxLines).map((text,uiPage)=>({...line,text,logSource:line,uiPage,sourceIndex:index,uiWasRead:!!isRead?.(line)}));
    });
  }
  function recordTextPages(entries,maxWidth,font,maxLines){
    const pages=[];let page='';
    for(const entry of entries){
      const speaker=entry.kind==='heroine'||entry.kind==='character'?entry.speaker:'';
      // A short turn stays intact. Longer turns repeat the speaker on each page.
      const parts=splitText(entry.text,maxWidth,font,Math.max(1,maxLines-(speaker?1:0)));
      for(const part of parts){
        const block=(speaker?speaker+'\n':'')+part;
        const candidate=page?page+'\n\n'+block:block;
        if(page&&splitText(candidate,maxWidth,font,maxLines).length>1){pages.push(page);page=block}
        else page=candidate;
      }
    }
    if(page||!pages.length)pages.push(page);
    return pages;
  }
  function pageText(content,text,entries){
    const area=document.createElement('p');area.className='design-page';content.append(area);
    const pager=document.createElement('div');pager.className='design-pager';content.append(pager);
    let page=0,pages=[];const count=document.createElement('span');
    const prev=button('前のページ',()=>{page--;draw()}),next=button('次のページ',()=>{page++;draw()});pager.append(prev,count,next);
    function draw(){area.textContent=pages[page]||'';area.scrollTop=0;prev.disabled=page===0;next.disabled=page>=pages.length-1;count.textContent=`${page+1} / ${Math.max(1,pages.length)}`}
    function measure(){
      const css=getComputedStyle(area),width=Math.max(100,area.clientWidth),font=`${css.fontSize} ${css.fontFamily}`;
      const lines=Math.max(entries?2:1,Math.floor(area.clientHeight/parseFloat(css.lineHeight)));
      pages=entries?recordTextPages(entries,width,font,lines):splitText(text,width,font,lines);
      page=Math.min(page,pages.length-1);draw();
    }
    requestAnimationFrame(measure);return area;
  }
  function records(){
    const m=panel('記録');
    const entries=GameLog.list(),visited=new Set([...(state().visited||[]),currentScene,...entries.map(inferRoom)]);
    const rooms=['opening',...roomNames.map((_,i)=>`room0${i+1}`)].filter(id=>visited.has(id));
    if(!rooms.includes(recordRoom))recordRoom=rooms.includes(currentScene)?currentScene:rooms[0];
    let recordOrder=localStorage.getItem('saigononazo-record-order')==='oldest'?'oldest':'newest';

    // G03: a direct room picker avoids having to swipe through every room tab.
    const jump=document.createElement('label');jump.className='design-record-jump';
    jump.append(document.createTextNode('部屋へ'));
    const roomSelect=document.createElement('select');roomSelect.setAttribute('aria-label','記録の部屋へジャンプ');
    rooms.forEach(id=>{const option=document.createElement('option');option.value=id;option.textContent=roomLabel(id);roomSelect.append(option)});
    roomSelect.onchange=()=>{recordRoom=roomSelect.value;recordPage=0;drawList()};
    jump.append(roomSelect);m.p.insertBefore(jump,m.content);

    const tabs=document.createElement('div');tabs.className='design-tabs design-room-tabs';m.p.insertBefore(tabs,m.content);
    const categories=document.createElement('div');categories.className='design-tabs design-record-categories';m.p.insertBefore(categories,m.content);
    rooms.forEach(id=>{const b=button(roomLabel(id),()=>{recordRoom=id;recordPage=0;drawList()});b.dataset.room=id;tabs.append(b)});
    [['all','全部'],['conversation','会話'],['investigation','調査']].forEach(([id,label])=>{
      const b=button(label,()=>{recordCategory=id;localStorage.setItem('saigononazo-record-category',id);recordPage=0;drawList()});
      b.dataset.category=id;categories.append(b)
    });
    const order=button('新しい順',()=>{
      recordOrder=recordOrder==='newest'?'oldest':'newest';
      localStorage.setItem('saigononazo-record-order',recordOrder);
      recordPage=0;drawList()
    },'design-record-order');
    order.setAttribute('aria-label','記録の並び順を切り替える');
    categories.append(order);

    // The page picker remains visible outside the scrolling list, even with many records.
    const footer=document.createElement('div');footer.className='design-pager design-record-pager';m.p.append(footer);
    let rows=[];
    function clue(entry){return !!roomStates.room08?.backSeen&&!!config?.highlightLogEntry?.(entry)}
    function drawList(){
      footer.hidden=false;
      roomSelect.value=recordRoom;
      tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.room===recordRoom)));
      categories.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===recordCategory)));
      order.textContent=recordOrder==='newest'?'新しい順':'古い順';
      order.setAttribute('aria-pressed',String(recordOrder==='oldest'));
      const groups=[];
      entries.filter(e=>inferRoom(e)===recordRoom).forEach(e=>{
        const category=e.type==='investigation'?'investigation':'conversation',last=groups.at(-1),group=e.group||legacyGroup(e.id);
        if(last&&category==='conversation'&&last.category===category&&last.group===group&&!clue(e)&&!last.entries.some(clue))last.entries.push(e);
        else groups.push({category,group,entries:[e]})
      });
      rows=(recordOrder==='newest'?groups.reverse():groups).filter(g=>recordCategory==='all'||g.category===recordCategory);
      m.content.replaceChildren();m.content.scrollTop=0;
      const perPage=game.clientHeight<500?3:6,total=Math.max(1,Math.ceil(rows.length/perPage));
      recordPage=Math.max(0,Math.min(recordPage,total-1));
      if(!rows.length)m.content.append(paragraph('まだ記録がありません。'));
      rows.slice(recordPage*perPage,(recordPage+1)*perPage).forEach((row,i)=>{
        const first=row.entries[0],flag=row.entries.some(clue);
        const description=(first.text||'').replace(/\s+/g,' ').trim().slice(0,48);
        const title=row.category==='investigation'
          ?(first.target?first.target+' — ':'')+description
          :(first.thought?'心の声':first.speaker==='主人公'?'僕':first.speaker==='ト書き'?'情景':first.speaker||'会話')+' — '+description;
        const b=button('',()=>detail(recordPage*perPage+i),'design-record');
        b.classList.toggle('final-clue',flag);
        if(flag)b.append(document.createTextNode('● '));
        const summary=document.createElement('span');summary.className='design-record-summary';
        const kind=document.createElement('small');kind.textContent=row.category==='investigation'?'調査':'会話';
        const excerpt=document.createElement('span');excerpt.textContent=title;
        summary.append(kind,excerpt);b.append(summary);
        m.content.append(b)
      });
      footer.replaceChildren();
      const prev=button('前の一覧',()=>{recordPage--;drawList()});
      prev.disabled=recordPage===0;
      const pageLabel=document.createElement('label');pageLabel.className='design-record-page-select';
      pageLabel.append(document.createTextNode('ページ'));
      const pageSelect=document.createElement('select');pageSelect.setAttribute('aria-label','記録のページを選択');
      for(let i=0;i<total;i++){const option=document.createElement('option');option.value=String(i);option.textContent=`${i+1} / ${total}`;pageSelect.append(option)}
      pageSelect.value=String(recordPage);
      pageSelect.onchange=()=>{recordPage=Number(pageSelect.value);drawList()};
      pageLabel.append(pageSelect);
      const next=button('次の一覧',()=>{recordPage++;drawList()});
      next.disabled=recordPage===total-1;
      footer.append(prev,pageLabel,next)
    }
    function detail(index){
      footer.hidden=true;
      m.content.replaceChildren();m.content.scrollTop=0;
      const row=rows[index],controls=document.createElement('div');controls.className='design-actions';
      const prev=button('前の記録',()=>detail(index-1)),next=button('次の記録',()=>detail(index+1));
      prev.disabled=index===0;next.disabled=index===rows.length-1;
      controls.append(button('一覧に戻る',drawList),prev,next);m.content.append(controls);
      const p=pageText(m.content,'',row.entries);p.classList.toggle('final-clue',row.entries.some(clue))
    }
    drawList();
  }
  function inferRoom(e){if(e.room)return e.room;const n=e.id?.match(/^(?:room|r)([1-8])/);return n?'room0'+n[1]:'opening'}
  function legacyGroup(id){return String(id||'').replace(/_?\d+(?:_\d+)?$/,'')}
  function hints(){
    const m=panel('ヒント');const stages=currentScene==='room01'?firstRoomScenario.hanaHints:[];
    const opened=state().hints[currentScene]||0;
    if(!stages.length){m.content.append(paragraph('これまでに見つけたものを振り返ってみよう。行き詰まったら、ハナに話しかけてみよう。'),button('ハナに話しかける',()=>{m.close();if(!game.querySelector('.room-dialog-overlay,.device-overlay'))config?.onCompanion?.()}));return}
    if(currentScene==='room01'&&!firstRoomState?.questionSeen){m.content.append(paragraph('扉の問題文を調べてから、ヒントを確認できます。'));return}
    for(let i=0;i<opened;i++)m.content.append(button(`ヒント ${i+1} を読み返す`,()=>show(i)));
    if(opened<stages.length){const next=button(`次のヒント（${opened+1}）を開く`,()=>{next.textContent='このヒントを開きますか？ もう一度押して確認';next.onclick=()=>{state().hints[currentScene]=opened+1;saveGame();show(opened)}});m.content.append(next)}
    function show(i){m.content.replaceChildren();m.content.append(button('ヒント一覧に戻る',()=>{m.close();hints()}));pageText(m.content,stages[i].map(l=>(l.speaker==='ハナ'?'ハナ\n':'')+l.text).join('\n\n'))}
  }
  function options(){
    const m=panel('設定'),grid=document.createElement('div');grid.className='design-settings';m.content.append(grid);
    function range(label,key,min,max){const l=document.createElement('label'),out=document.createElement('output'),input=document.createElement('input');input.type='range';input.min=min;input.max=max;input.value=settings[key];out.textContent=settings[key];input.oninput=()=>{settings[key]=Number(input.value);out.textContent=input.value;saveSettings()};l.append(document.createTextNode(label),out,input);grid.append(l)}
    function checkbox(label,key){const l=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=!!settings[key];input.onchange=()=>{settings[key]=input.checked;saveSettings()};l.append(input,document.createTextNode(label));grid.append(l)}
    range('BGM', 'bgmVolume',0,100);range('効果音','seVolume',0,100);range('文字速度（小さいほど速い）','textSpeed',15,100);checkbox('文字を一度に表示','instantText');
    const size=document.createElement('label');size.append(document.createTextNode('文字サイズ'));const select=document.createElement('select');[['medium','標準'],['large','大']].forEach(([value,text])=>{const o=document.createElement('option');o.value=value;o.textContent=text;select.append(o)});select.value=document.documentElement.dataset.gameTextSize||'medium';select.onchange=()=>{document.documentElement.dataset.gameTextSize=select.value;localStorage.setItem('saigononazo-gameplay-ui-v1',JSON.stringify({textSize:select.value}));GameplayUI.setTextSize?.(select.value)};size.append(select);grid.append(size);
    if(currentScene==='room07'){
      const imageSize=document.createElement('label'),imageSelect=document.createElement('select');imageSize.append(document.createTextNode('部屋画像（第七の部屋）'));imageSelect.id='roomImageSize';[['fit','全体を表示'],['large','拡大（120%）']].forEach(([value,text])=>{const o=document.createElement('option');o.value=value;o.textContent=text;imageSelect.append(o)});imageSelect.value=roomImageSize;imageSelect.onchange=()=>{roomImageSize=imageSelect.value;localStorage.setItem('saigononazo-room-image-size',roomImageSize);syncRoomImage()};imageSize.append(imageSelect);grid.append(imageSize);
      const imageNote=paragraph('拡大時は部屋の背景をスワイプして見渡せます。');imageNote.className='design-display-note';m.content.append(imageNote);
    }
    const actions=document.createElement('div');actions.className='design-actions';actions.append(button('セーブ',()=>{m.close();GameplayUI.openDataMenu('save')}),button('ロード',()=>{m.close();GameplayUI.openDataMenu('load')}),button('操作説明',()=>{m.close();help()}),fullscreenButton());m.content.append(actions);syncDisplayButtons();
    m.content.append(button('タイトルへ戻る',confirmReturnToTitle));
  }
  function confirmReturnToTitle(){
    const m=panel('タイトルへ戻る');
    m.content.append(paragraph('タイトルへ戻る方法を選んでください。'));
    m.content.append(paragraph('セーブせずに戻る場合、ここでは新しく保存しません。これまでのオートセーブや手動セーブは残ります。'));
    const actions=document.createElement('div');actions.className='design-actions';
    const leave=save=>{
      if(save)saveGame();
      m.close();
      Dialogue.stop();
      showTitle();
    };
    actions.append(
      button('セーブして戻る',()=>leave(true)),
      button('セーブせず戻る',()=>leave(false)),
      button('キャンセル',()=>{m.close();options()})
    );
    m.content.append(actions);
  }
  const r5Items=[['mirror','鏡','◇'],['fish','魚','魚'],['butterfly','蝶','蝶'],['flower','花','花'],['squid','イカ','イカ'],['chair','椅子','椅子'],['cannon','大砲','大砲']];
  function items(){
    const list=[];
    if(room5State)r5Items.filter(([id])=>room5State.collected?.includes(id)&&!room5State.placed?.[id]).forEach(([id,name,art])=>list.push({id,name:name+'のパネル',art,description:name+'が描かれたパネル。',target:'r5Board'}));
    if(room4State&&!room4State.completed)['wall','box','star','lightPuzzle','meteors'].filter(id=>room4State[id]).forEach((id,i)=>list.push({id:'r4-'+id,name:'ガラスパネル',art:'◇',description:'模様のある透明なガラスパネル。',target:'r4Stand'}));
    if(currentScene==='room07'&&window.Room7LibraryUI)list.push(...Room7LibraryUI.items());
    return list;
  }
  function inventory(){const m=panel('持ち物'),grid=document.createElement('div');grid.className='design-items';m.content.append(grid);const list=items();if(!list.length)m.content.append(paragraph('現在、使える持ち物はありません。'));list.forEach(item=>grid.append(button(item.name,()=>{m.content.replaceChildren();const art=paragraph(item.art);art.className='design-item-art';m.content.append(art,paragraph(item.name),paragraph(item.description),button('一覧に戻る',()=>{m.close();inventory()}),button('使う',()=>{m.close();startUse(item)}))}))) }
  function cancelUse(){pendingUse=null;game.querySelector('.design-use-prompt')?.remove();game.querySelectorAll('.is-use-target').forEach(el=>el.classList.remove('is-use-target'))}
  function startUse(item){
    if(game.querySelector('.room-dialog-overlay'))return;
    if(currentScene==='room07'&&window.Room7LibraryUI){Room7LibraryUI.use(item.id);return}
    const tile=game.querySelector(`[data-tile="${item.id}"]`);if(tile){tile.click();return}
    game.querySelector('.device-overlay .device-close')?.click();cancelUse();pendingUse=item;
    const p=document.createElement('div');p.className='design-use-prompt';const text=paragraph(item.name+'を使う場所を選んでください。');p.append(text,button('キャンセル',cancelUse));game.append(p);document.getElementById(item.target)?.classList.add('is-use-target');p.querySelector('button').focus({preventScroll:true});
  }
  function pickup(item){
    const m=panel('入手');
    let art;
    if(item.image){
      m.p?.classList.add('design-pickup-panel');
      art=document.createElement('img');
      art.className='design-pickup-image';
      art.src=item.image;
      art.alt=item.imageAlt||item.name||'入手したアイテム';
      art.draggable=false;
    }else{
      art=paragraph(item.art||'◇');
      art.className='design-item-art';
    }
    m.content.append(art,paragraph(item.name));
    if(item.description)m.content.append(paragraph(item.description));
    m.content.append(button('閉じる',m.close));
    m.content.addEventListener('click',e=>{if(!e.target.closest('button'))m.close()});
    recordLog({logId:'ui-item-'+currentScene+'-'+item.id,logType:'investigation',speaker:'ト書き',text:item.name+(item.description?'\n'+item.description:'')});
    saveGame();
  }
  function help(){
    const m=panel('操作説明');
    let text='会話パネルを押すと文字をすべて表示し、もう一度押すと次へ進みます。Space / Enter でも送れます。\n\n記録・持ち物・設定は右上から開けます。ヒントはハナとの会話で確認できます。ウィンドウは「閉じる」または Esc で閉じます。';
    if(currentScene!=='opening')text='黄色の輪は未調査、緑の輪は調査済みです。輪のある場所をクリック / タップして調べます。\n\n'+text;
    if(currentScene==='room02')text+='\n\nいろしるパズル：候補を押した順に１〜５へ入ります。同じ候補で取り消し、同じ記号の別の色で入れ替え。入力済みの枠を２つ押すと交換できます。「解答」で判定します。';
    if(game.querySelector('.device-overlay input,.device-overlay textarea,.room input,.late-room input'))text+='\n\n入力欄では解答ボタンを押して送信します。';
    text+='\n\nスマホは横向きでプレイしてください。右上の「全画面」で表示を広げられます。対応していないブラウザでは、ホーム画面からの起動方法を案内します。';
    if(currentScene==='room07')text+='\n\n第七の部屋は設定から画像を拡大でき、背景をスワイプして見渡せます。';
    pageText(m.content,text);
  }
  function investigationRevision(el){const s=roomStates[currentScene]||{};const base=['doorUnlocked','unlocked','completed','memorySeen'].map(k=>String(!!s[k])).join(':');return el?.id==='hanaButton'?base+'|topics:'+window.HanaChoiceUI.getAvailableChoiceIds().join(','):base}
  function syncHud(){
    if(typeof document==='undefined'||!document.documentElement)return;
    const actions=game.querySelector('.gameplay-hud-actions');if(actions&&!actions.dataset.design){actions.dataset.design='true';actions.replaceChildren(button('持ち物',inventory,'gameplay-top-button'),button('記録',records,'gameplay-top-button'),button('設定',options,'gameplay-top-button'),fullscreenButton('gameplay-top-button'))}
    const title=game.querySelector('.title-screen');let titleDisplay=game.querySelector('.design-title-fullscreen');
    if(title&&!titleDisplay){titleDisplay=fullscreenButton('design-title-fullscreen');game.append(titleDisplay)}else if(!title)titleDisplay?.remove();
    syncDisplayButtons();syncRoomImage();
    // Full-body character for the later rooms; disappears while talking or after the final farewell.
    const late=game.querySelector('.late-room');
    const mayShow=['room05','room06','room07','room08'].includes(currentScene);
    if(late&&mayShow){
      let world=late.querySelector('.hana-v2-world');
      const endingGone=currentScene==='room08'&&
        (late.matches('.r8-empty')||roomStates.room08?.ended);
      if(endingGone)world?.remove();
      else if(!world&&hanaV2Ready.has('full')){
        world=document.createElement('div');world.className='hana-v2-world';world.setAttribute('role','img');world.setAttribute('aria-label','ハナ');late.append(world);
      }
    }
    game.querySelectorAll('.object,.late-object,#r5Board,.r7-target').forEach(el=>{const key=currentScene+':'+(el.id||el.dataset.item||el.textContent.trim());const seen=state().investigated[key];el.classList.toggle('is-investigated',(seen===true||seen===investigationRevision(el))&&!(el.id==='hanaButton'&&window.HanaChoiceUI?.hasUnreadChoices()));if(hooked.has(el))return;hooked.add(el);el.addEventListener('click',event=>{if(pendingUse){if(el.id!==pendingUse.target){event.preventDefault();event.stopImmediatePropagation();const p=game.querySelector('.design-use-prompt p');if(p)p.textContent='ここでは使えません。使う場所を選ぶか、キャンセルしてください。';return}const item=pendingUse;cancelUse();setTimeout(()=>game.querySelector(`[data-tile="${item.id}"]`)?.click(),0)}inspectionTarget=el.querySelector('span,strong')?.textContent||el.getAttribute('aria-label')||el.textContent.trim();state().investigated[key]=investigationRevision(el);el.classList.add('is-investigated');saveGame()},{capture:true})});
    game.querySelectorAll('.hana-choice-button,[data-choice]').forEach(el=>{if(choiceHooked.has(el))return;choiceHooked.add(el);const born=performance.now();el.addEventListener('click',e=>{if(performance.now()-born<250){e.preventDefault();e.stopImmediatePropagation()}},{capture:true})});
    game.querySelectorAll('.device-overlay section').forEach(section=>{if(section.matches('.room-exit-menu,.r4-ratio-exhibit,.r5-handdrawn-panel')||section.querySelector('[data-choice]')||section.querySelector('.design-op-button')||!section.querySelector('input,.room2-palette,.r4-panels,.r5-counter-grid,.r6-othello,.room3-letterboard'))return;section.append(button('操作説明',help,'design-op-button'))});
    game.querySelectorAll('.device-close,.inspection-close').forEach(el=>{if(el.textContent==='×')el.textContent='閉じる'});
    game.querySelectorAll('input:not([type=range]):not([type=checkbox])').forEach(el=>{if(inputHooked.has(el))return;inputHooked.add(el);const overlay=el.closest('.device-overlay');if(!overlay)return;const key=currentScene+':'+(overlay.querySelector('h2')?.textContent||overlay.querySelector('section')?.className)+':'+(el.id||el.className||'answer');el.value=state().inputs[key]??el.value;el.addEventListener('input',()=>{state().inputs[key]=el.value;saveGame()})});
    game.querySelectorAll('.room3-answer-submit,.room3-final-submit,.r4-answer,.piano-submit,[id$="Submit"]').forEach(el=>{el.classList.add('design-submit');if(/確認|答える/.test(el.textContent))el.textContent='解答'});
    const overlay=game.querySelector('.room-dialog-overlay');game.classList.toggle('has-dialogue',!!overlay);if(overlay)decorateDialogue(overlay);else{syncWorldExpression(true);window.MemoryVisuals?.sync(null)}
    if(!game.querySelector('.design-orientation')){const o=document.createElement('div');o.className='design-orientation';o.innerHTML='<div><h2>横向きでプレイ</h2><p>端末を横向きにしてください。<br>ゲームの進行は保持されます。</p></div>';game.append(o)}
  }
  function decorateDialogue(overlay){
    if(!overlay?.querySelector('.room-dialog')||overlay.dataset.design)return;overlay.dataset.design='true';
    const p=overlay.querySelector('.room-dialog'),portrait=document.createElement('div');portrait.className='hana-portrait';portrait.setAttribute('role','img');portrait.setAttribute('aria-label','ハナ');p.prepend(portrait);portrait.hidden=!portraitVisible;setExpression(portrait);
    const controls=document.createElement('div');controls.className='design-controls';
    const auto=button('AUTO',()=>Dialogue.toggleAuto()),skip=button('SKIP',()=>p.querySelector('.skip-button')?.click()),hide=button('非表示',()=>{p.classList.add('dialog-hidden');restore.hidden=false;Dialogue.suspend()});auto.dataset.designAuto='';skip.dataset.designSkip='';
    const log=button('LOG',()=>p.querySelector('.log-button')?.click());log.dataset.designLog='';const settingsButton=button('設定',options);controls.append(auto,skip,log,hide,settingsButton);p.append(controls);
    const restore=button('',e=>{} ,'dialogue-restore');restore.setAttribute('aria-label','会話を再表示');restore.hidden=true;restore.onclick=e=>{e.stopPropagation();restore.hidden=true;p.classList.remove('dialog-hidden');Dialogue.resume()};overlay.append(restore);
    p.addEventListener('click',e=>{if(!e.target.closest('button,input'))Dialogue.advance()});syncPlayback();
  }
  function setExpression(p){
    const name=hanaV2Names[expression]||portraitExpressions[0];
    // Keep the last painted expression until the requested one can be painted.
    // Reading the cache here also keeps the decoded idle/portrait images alive.
    const ready=kind=>hanaV2Ready.has(kind)&&hanaImageCache.has(hanaV2Url(kind))&&(!['happy','thought','surprise','concern','serious','sleepy','excited'].includes(kind)||worldExpressions.has(kind==='excited'?'happy':kind));
    const previous=p.dataset.displayedExpression;
    const displayed=ready(name)?name:ready(previous)?previous:'neutral';
    p.classList.add('hana-v2-portrait');
    const background='url("'+hanaV2Url(displayed)+'")';
    if(p.style.backgroundImage!==background)p.style.backgroundImage=background;
    p.style.backgroundSize='contain';
    p.style.backgroundPosition='center bottom';
    p.dataset.expression=name;
    p.dataset.displayedExpression=displayed;
  }
  function displayLine(line,kind){
    const memoryVisual=window.MemoryVisuals?.get(currentScene,line);
    const flashback=!!memoryVisual;
    window.MemoryVisuals?.sync(memoryVisual);
    const overlay=game.querySelector('.room-dialog-overlay');
    if(overlay){
      if(memoryVisual){
        overlay.dataset.memoryStage=memoryVisual.reveal;
        overlay.dataset.memoryPresentation=memoryVisual.presentation||'scene';
      }else{
        delete overlay.dataset.memoryStage;
        delete overlay.dataset.memoryPresentation;
      }
    }
    if(currentScene==='opening')portraitVisible=kind==='heroine'&&!!game.querySelector('.opening[data-hana-visible="true"]');else portraitVisible=!flashback&&kind==='heroine';
    if(line.expression){const choice=hanaV2Names.indexOf(line.expression);expression=choice>=0?choice:0}else if(kind==='heroine'){expression=/眠|ふぁ|スー、スー/.test(line.text)?6:/！|嬉|楽しい|正解/.test(line.text)?1:/え？|えっ|びっくり/.test(line.text)?3:/悲|泣|ごめん|大丈夫/.test(line.text)?4:/考|かな|……？/.test(line.text)?2:0}
    decorateDialogue(game.querySelector('.room-dialog-overlay')||document.createElement('div'));
    const p=game.querySelector('.hana-portrait');if(p){p.hidden=!portraitVisible;p.setAttribute('aria-label',line.speaker==='花音'?'花音':window.HanaIdentity?.getName?.()||'ハナ');setExpression(p)}
    syncWorldExpression(flashback);
    const row=game.querySelector('.message-row'),message=row?.querySelector('.message');
    if(row&&message){const ctx=document.createElement('canvas').getContext('2d');if(ctx){const css=getComputedStyle(message);ctx.font=`${css.fontSize} ${css.fontFamily}`;const available=row.parentElement.clientWidth;row.style.width=Math.min(available,Math.max(...line.text.split('\n').map(t=>ctx.measureText(t).width))+2)+'px'}}
    if(orientation.matches)Dialogue.suspend();
    // Effects are visual captions only. No independent sound record category.
  }
  function syncPlayback(){game.querySelectorAll('[data-design-auto]').forEach(b=>{b.setAttribute('aria-pressed',String(Dialogue.isAutoEnabled()));b.disabled=!!game.querySelector('.room-dialog .auto-button')?.disabled;const label=Dialogue.isAutoEnabled()?'AUTO ON':'AUTO OFF';if(b.textContent!==label)b.textContent=label});game.querySelectorAll('[data-design-log]').forEach(b=>b.setAttribute('aria-pressed',String(!!game.querySelector('.room-dialog.is-log-open'))));game.querySelectorAll('[data-design-skip]').forEach(b=>{const source=game.querySelector('.room-dialog .skip-button');b.disabled=!source||source.disabled;b.setAttribute('aria-pressed',source?.getAttribute('aria-pressed')||'false')})}
  function onInstall(c){cancelUse();config=c;recordRoom=c.sceneId||currentScene;inspectionTarget='';if(!state().visited.includes(recordRoom))state().visited.push(recordRoom);queueMicrotask(()=>{if(typeof document==='undefined'||!document.documentElement)return;syncHud();if(!localStorage.getItem('saigononazo-help-seen')){localStorage.setItem('saigononazo-help-seen','1');if(!game.querySelector('.room-dialog-overlay,.device-overlay'))help()}})}
  function beginDialogue(lines){dialogueGroup=currentScene+':'+Date.now()+':'+(++sequence);portraitVisible=lines.some(l=>l.speaker==='ハナ'||l.speaker==='花音')&&!lines.some(l=>window.MemoryVisuals?.get(currentScene,l));expression=0;window.MemoryVisuals?.prepare(currentScene,lines)}
  function endDialogue(){syncWorldExpression(true);window.MemoryVisuals?.sync(null);dialogueGroup='';game.classList.remove('has-dialogue');game.querySelector('.inspection-focus-background')?.remove()}
  function savePreview(){
    const image=game.querySelector('.room-background,.room-bg');if(image?.getAttribute('src'))return image.getAttribute('src');
    const canvas=document.createElement('canvas');canvas.width=240;canvas.height=135;const ctx=canvas.getContext('2d');if(!ctx)return '';
    ctx.fillStyle='#e8e1d3';ctx.fillRect(0,0,240,135);const frame=game.getBoundingClientRect();
    game.querySelectorAll('.late-object,.r6-cell,.r7-book,.r7-doors button,.r8-table,.r8-paper,.room2-door-art,.room2-desk-art,.room3-door,.room3-bed,.r4-door-art').forEach(el=>{const r=el.getBoundingClientRect(),css=getComputedStyle(el);ctx.fillStyle=css.backgroundColor==='rgba(0, 0, 0, 0)'?'#b6a990':css.backgroundColor;ctx.fillRect((r.x-frame.x)/frame.width*240,(r.y-frame.y)/frame.height*135,r.width/frame.width*240,r.height/frame.height*135)});
    ctx.fillStyle='#faf7ee';ctx.fillRect(0,0,240,22);ctx.font='11px sans-serif';ctx.fillStyle='#35332e';ctx.fillText(roomLabel(currentScene),8,15);return canvas.toDataURL('image/png');
  }
  const orientation=matchMedia('(orientation:portrait) and (pointer:coarse)');orientation.addEventListener('change',()=>{if(orientation.matches)Dialogue.suspend();else if(!modal)Dialogue.resume()});
  document.addEventListener('keydown',e=>{if(modal||orientation.matches)return;if(e.key==='Escape'&&pendingUse){e.preventDefault();cancelUse();return}if(e.target.closest?.('input,textarea,select,button'))return;if((e.key===' '||e.key==='Enter')&&game.querySelector('.room-dialog:not(.dialog-hidden),.opening .dialog:not(.is-log-open)')){e.preventDefault();Dialogue.advance()}});
  document.addEventListener('click',e=>{if(e.target.closest?.('#settingsButton')){e.preventDefault();e.stopImmediatePropagation();options();return}if(e.target.closest?.('#gameplayLogButton')){e.preventDefault();e.stopImmediatePropagation();records()}},{capture:true});
  document.addEventListener('dialogue:autochange',syncPlayback);document.addEventListener('dialogue:skipchange',()=>queueMicrotask(syncPlayback));
  new MutationObserver(syncHud).observe(game,{childList:true,subtree:true});
  window.DesignUI={refreshWorldExpression:()=>syncWorldExpression(false),onInstall,beginDialogue,endDialogue,paginateDialogue,displayLine,savePreview,pickup,records,options,help,get dialogueGroup(){return dialogueGroup},get inspectionTarget(){return inspectionTarget}};
  showSettings=options;
})();


