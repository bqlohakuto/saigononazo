// Shared presentation only: puzzle rules and story progression stay in their room modules.
(() => {
  let config=null,sequence=0,dialogueGroup='',inspectionTarget='',modal=null,portraitVisible=false,pendingUse=null;
  let recordRoom='',recordCategory=localStorage.getItem('saigononazo-record-category')||'all',recordPage=0,expression=0;
  const hooked=new WeakSet(),inputHooked=new WeakSet(),choiceHooked=new WeakSet();
  const roomNames=['第一','第二','第三','第四','第五','第六','第七','第八'];
  const roomLabel=id=>/^room0[1-8]$/.test(id)?roomNames[Number(id.slice(-1))-1]+'の部屋':'オープニング';
  const state=()=>{roomStates.uiDesign||={};const s=roomStates.uiDesign;s.investigated||={};s.hints||={};s.inputs||={};s.visited||=[];return s};
  const button=(label,fn,cls='')=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.className=cls;b.onclick=fn;return b};
  const paragraph=text=>{const p=document.createElement('p');p.textContent=text;return p};
  const portraitExpressions=['gentle','happy','thought','surprise','concern','serious'];
  function panel(title){
    if(modal)modal.close();
    const opener=document.activeElement,o=document.createElement('div');o.className='design-overlay';
    const p=document.createElement('section');p.className='design-panel';p.setAttribute('role','dialog');p.setAttribute('aria-modal','true');p.setAttribute('aria-label',title);
    const head=document.createElement('header'),h=document.createElement('h2');h.textContent=title;
    const closeButton=button('閉じる',()=>close());head.append(h,closeButton);p.append(head);
    const content=document.createElement('div');content.className='design-content';p.append(content);o.append(p);game.append(o);
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
    const width=Math.max(120,area.getBoundingClientRect().width*.70);
    const w=game.getBoundingClientRect().width,large=document.documentElement.dataset.gameTextSize==='large';
    const size=large?Math.max(18,Math.min(32,w*.022)):Math.max(15,Math.min(26,w*.018));
    return lines.flatMap((line,index)=>splitText(line.text,width,`${size}px "Yu Gothic", Meiryo, sans-serif`,Math.max(1,Math.min(3,Math.floor((area.clientHeight-(line.speaker==='ハナ'||line.speaker==='花音'?size:0))/(size*1.55))))).map((text,uiPage)=>({...line,text,logSource:line,uiPage,sourceIndex:index,uiWasRead:!!isRead?.(line)})));
  }
  function pageText(content,text){
    const area=document.createElement('p');area.className='design-page';content.append(area);
    const pager=document.createElement('div');pager.className='design-pager';content.append(pager);
    let page=0,pages=[];const count=document.createElement('span');
    const prev=button('前のページ',()=>{page--;draw()}),next=button('次のページ',()=>{page++;draw()});pager.append(prev,count,next);
    function draw(){area.textContent=pages[page]||'';prev.disabled=page===0;next.disabled=page>=pages.length-1;count.textContent=`${page+1} / ${Math.max(1,pages.length)}`}
    function measure(){const css=getComputedStyle(area),rect=area.getBoundingClientRect();pages=splitText(text,Math.max(100,rect.width),`${css.fontSize} ${css.fontFamily}`,Math.max(1,Math.floor(rect.height/parseFloat(css.lineHeight))));page=Math.min(page,pages.length-1);draw()}
    requestAnimationFrame(measure);return area;
  }
  function records(){
    const m=panel('記録');if(!recordRoom)recordRoom=currentScene;
    const tabs=document.createElement('div');tabs.className='design-tabs';m.p.insertBefore(tabs,m.content);
    const categories=document.createElement('div');categories.className='design-tabs';m.p.insertBefore(categories,m.content);
    const entries=GameLog.list(),visited=new Set([...(state().visited||[]),currentScene,...entries.map(inferRoom)]);
    const rooms=['opening',...roomNames.map((_,i)=>`room0${i+1}`)].filter(id=>visited.has(id));
    rooms.forEach(id=>{const b=button(roomLabel(id),()=>{recordRoom=id;recordPage=0;drawList()});b.dataset.room=id;tabs.append(b)});
    [['all','全部'],['conversation','会話'],['investigation','調査']].forEach(([id,label])=>{const b=button(label,()=>{recordCategory=id;localStorage.setItem('saigononazo-record-category',id);recordPage=0;drawList()});b.dataset.category=id;categories.append(b)});
    let rows=[];
    function clue(entry){return !!roomStates.room08?.backSeen&&!!config?.highlightLogEntry?.(entry)}
    function drawList(){
      tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.room===recordRoom)));
      categories.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===recordCategory)));
      // Rebuild when the room tab changes, retaining chronological text within each conversation.
      const groups=[];entries.filter(e=>inferRoom(e)===recordRoom).forEach(e=>{const category=e.type==='investigation'?'investigation':'conversation',last=groups.at(-1),group=e.group||legacyGroup(e.id);if(last&&category==='conversation'&&last.category===category&&last.group===group)last.entries.push(e);else groups.push({category,group,entries:[e]})});
      rows=groups.reverse().filter(g=>recordCategory==='all'||g.category===recordCategory);m.content.replaceChildren();
      const perPage=game.clientHeight<500?3:6,total=Math.max(1,Math.ceil(rows.length/perPage));recordPage=Math.min(recordPage,total-1);
      if(!rows.length)m.content.append(paragraph('まだ記録がありません。'));
      rows.slice(recordPage*perPage,(recordPage+1)*perPage).forEach((row,i)=>{const first=row.entries[0],flag=row.entries.some(clue);const title=(row.category==='investigation'?(first.target?first.target+' — ':'調査 — '):'')+first.text.slice(0,42);const b=button((flag?'● ':'')+title,()=>detail(recordPage*perPage+i),'design-record');b.classList.toggle('final-clue',flag);m.content.append(b)});
      const nav=document.createElement('div');nav.className='design-pager';const prev=button('前の一覧',()=>{recordPage--;drawList()}),next=button('次の一覧',()=>{recordPage++;drawList()});prev.disabled=recordPage===0;next.disabled=recordPage===total-1;nav.append(prev,paragraph(`${recordPage+1} / ${total}`),next);m.content.append(nav);
    }
    function detail(index){m.content.replaceChildren();const row=rows[index];const controls=document.createElement('div');controls.className='design-actions';const prev=button('前の記録',()=>detail(index-1)),next=button('次の記録',()=>detail(index+1));prev.disabled=index===0;next.disabled=index===rows.length-1;controls.append(button('一覧に戻る',drawList),prev,next);m.content.append(controls);const text=row.entries.map(e=>(e.kind==='heroine'||e.kind==='character'?e.speaker+'\n':'')+e.text).join('\n\n');const p=pageText(m.content,text);p.classList.toggle('final-clue',row.entries.some(clue))}
    drawList();
  }
  function inferRoom(e){if(e.room)return e.room;const n=e.id?.match(/^(?:room|r)([1-8])/);return n?'room0'+n[1]:'opening'}
  function legacyGroup(id){return String(id||'').replace(/_?\d+(?:_\d+)?$/,'')}
  function hints(){
    const m=panel('ヒント');const stages=currentScene==='room01'?firstRoomScenario.hanaHints:[];
    const opened=state().hints[currentScene]||0;
    if(!stages.length){m.content.append(paragraph('この部屋の段階ヒントは未確定です。現状の会話と調査内容を使って進められます。'),button('ハナに話しかける',()=>{m.close();if(!game.querySelector('.room-dialog-overlay,.device-overlay'))config?.onCompanion?.()}));return}
    if(currentScene==='room01'&&!firstRoomState?.questionSeen){m.content.append(paragraph('扉の問題文を調べてから、ヒントを確認できます。'));return}
    for(let i=0;i<opened;i++)m.content.append(button(`ヒント ${i+1} を読み返す`,()=>show(i)));
    if(opened<stages.length){const next=button(`次のヒント（${opened+1}）を開く`,()=>{next.textContent='このヒントを開きますか？ もう一度押して確認';next.onclick=()=>{state().hints[currentScene]=opened+1;saveGame();show(opened)}});m.content.append(next)}
    function show(i){m.content.replaceChildren();m.content.append(button('ヒント一覧に戻る',()=>{m.close();hints()}));pageText(m.content,stages[i].map(l=>(l.speaker==='ハナ'?'ハナ\n':'')+l.text).join('\n\n'))}
  }
  function options(){
    const m=panel('設定'),grid=document.createElement('div');grid.className='design-settings';m.content.append(grid);
    function range(label,key,min,max){const l=document.createElement('label'),out=document.createElement('output'),input=document.createElement('input');input.type='range';input.min=min;input.max=max;input.value=settings[key];out.textContent=settings[key];input.oninput=()=>{settings[key]=Number(input.value);out.textContent=input.value;saveSettings()};l.append(document.createTextNode(label),out,input);grid.append(l)}
    function checkbox(label,key){const l=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=!!settings[key];input.onchange=()=>{settings[key]=input.checked;saveSettings()};l.append(input,document.createTextNode(label));grid.append(l)}
    range('BGM', 'bgmVolume',0,100);range('効果音','seVolume',0,100);range('文字速度（小さいほど速い）','textSpeed',15,100);checkbox('文字を一度に表示','instantText');checkbox('音の情景描写を表示','soundCaptions');
    const size=document.createElement('label');size.append(document.createTextNode('文字サイズ'));const select=document.createElement('select');[['medium','標準'],['large','大']].forEach(([value,text])=>{const o=document.createElement('option');o.value=value;o.textContent=text;select.append(o)});select.value=document.documentElement.dataset.gameTextSize||'medium';select.onchange=()=>{document.documentElement.dataset.gameTextSize=select.value;localStorage.setItem('saigononazo-gameplay-ui-v1',JSON.stringify({textSize:select.value}));GameplayUI.setTextSize?.(select.value)};size.append(select);grid.append(size);
    const actions=document.createElement('div');actions.className='design-actions';actions.append(button('セーブ',()=>{m.close();GameplayUI.openDataMenu('save')}),button('ロード',()=>{m.close();GameplayUI.openDataMenu('load')}),button('操作説明',()=>{m.close();help()}),button('全画面 / ウィンドウ',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.getElementById('game-container').requestFullscreen()}catch{}}));m.content.append(actions);
    const title=button('タイトルへ戻る',()=>{title.textContent='セーブしてタイトルへ戻りますか？';title.onclick=()=>{saveGame();m.close();Dialogue.stop();showTitle()}});m.content.append(title);
  }
  const r5Items=[['mirror','鏡','◇'],['fish','魚','魚'],['butterfly','蝶','蝶'],['flower','花','花'],['squid','イカ','イカ'],['chair','椅子','椅子'],['cannon','大砲','大砲']];
  function items(){
    const list=[];
    if(room5State)r5Items.filter(([id])=>room5State.collected?.includes(id)&&!room5State.placed?.[id]).forEach(([id,name,art])=>list.push({id,name:name+'のパネル',art,description:name+'が描かれたパネル。',target:'r5Board'}));
    if(room4State&&!room4State.completed)['wall','box','star','lightPuzzle','meteors'].filter(id=>room4State[id]).forEach((id,i)=>list.push({id:'r4-'+id,name:'ガラスパネル',art:'◇',description:'模様のある透明なガラスパネル。',target:'r4Stand'}));
    return list;
  }
  function inventory(){const m=panel('持ち物'),grid=document.createElement('div');grid.className='design-items';m.content.append(grid);const list=items();if(!list.length)m.content.append(paragraph('現在、使える持ち物はありません。'));list.forEach(item=>grid.append(button(item.name,()=>{m.content.replaceChildren();const art=paragraph(item.art);art.className='design-item-art';m.content.append(art,paragraph(item.name),paragraph(item.description),button('一覧に戻る',()=>{m.close();inventory()}),button('使う',()=>{m.close();startUse(item)}))}))) }
  function cancelUse(){pendingUse=null;game.querySelector('.design-use-prompt')?.remove();game.querySelectorAll('.is-use-target').forEach(el=>el.classList.remove('is-use-target'))}
  function startUse(item){
    if(game.querySelector('.room-dialog-overlay'))return;
    const tile=game.querySelector(`[data-tile="${item.id}"]`);if(tile){tile.click();return}
    game.querySelector('.device-overlay .device-close')?.click();cancelUse();pendingUse=item;
    const p=document.createElement('div');p.className='design-use-prompt';const text=paragraph(item.name+'を使う場所を選んでください。');p.append(text,button('キャンセル',cancelUse));game.append(p);document.getElementById(item.target)?.classList.add('is-use-target');p.querySelector('button').focus({preventScroll:true});
  }
  function pickup(item){const m=panel('入手'),art=paragraph(item.art||'◇');art.className='design-item-art';m.content.append(art,paragraph(item.name),paragraph(item.description));m.content.append(button('受け取る',m.close));m.content.addEventListener('click',e=>{if(!e.target.closest('button'))m.close()});recordLog({logId:'ui-item-'+currentScene+'-'+item.id,logType:'investigation',speaker:'ト書き',text:item.name+'\n'+item.description});saveGame()}
  function help(){const m=panel('操作説明');pageText(m.content,'黄色の輪は未調査、緑の輪は調査済みです。輪のある場所をクリック / タップして調べます。\n\n会話パネルを押すと文字をすべて表示し、もう一度押すと次へ進みます。Space / Enter でも送れます。\n\n記録・持ち物・ヒント・設定は右上から開けます。ウィンドウは「閉じる」または Esc で閉じます。\n\nいろしるパズル：候補を押した順に１〜５へ入ります。同じ候補で取り消し、同じ記号の別の色で入れ替え。入力済みの枠を２つ押すと交換できます。「解答」で判定します。\n\nスマホは横向きでプレイしてください。入力欄では解答ボタンを押して送信します。')}
  function investigationRevision(){const s=roomStates[currentScene]||{};return ['doorUnlocked','unlocked','completed','memorySeen'].map(k=>String(!!s[k])).join(':')}
  function syncHud(){
    const actions=game.querySelector('.gameplay-hud-actions');if(actions&&!actions.dataset.design){actions.dataset.design='true';actions.replaceChildren(button('持ち物',inventory,'gameplay-top-button'),button('記録',records,'gameplay-top-button'),button('ヒント',hints,'gameplay-top-button'),button('設定',options,'gameplay-top-button'))}
    game.querySelectorAll('.object,.late-object,#r5Board').forEach(el=>{const key=currentScene+':'+(el.id||el.dataset.item||el.textContent.trim());const seen=state().investigated[key];el.classList.toggle('is-investigated',seen===true||seen===investigationRevision());if(hooked.has(el))return;hooked.add(el);el.addEventListener('click',event=>{if(pendingUse){if(el.id!==pendingUse.target){event.preventDefault();event.stopImmediatePropagation();const p=game.querySelector('.design-use-prompt p');if(p)p.textContent='ここでは使えません。使う場所を選ぶか、キャンセルしてください。';return}const item=pendingUse;cancelUse();setTimeout(()=>game.querySelector(`[data-tile="${item.id}"]`)?.click(),0)}inspectionTarget=el.querySelector('span,strong')?.textContent||el.getAttribute('aria-label')||el.textContent.trim();state().investigated[key]=investigationRevision();el.classList.add('is-investigated');saveGame()},{capture:true})});
    game.querySelectorAll('.hana-choice-button,[data-choice]').forEach(el=>{if(choiceHooked.has(el))return;choiceHooked.add(el);const born=performance.now();el.addEventListener('click',e=>{if(performance.now()-born<250){e.preventDefault();e.stopImmediatePropagation()}},{capture:true})});
    game.querySelectorAll('.device-overlay section').forEach(section=>{if(section.querySelector('.design-op-button')||!section.querySelector('input,.room2-palette,.r4-panels,.r5-counter-grid,.r6-othello,.room3-letterboard'))return;section.append(button('操作説明',help,'design-op-button'))});
    game.querySelectorAll('.device-close,.inspection-close').forEach(el=>{if(el.textContent==='×')el.textContent='閉じる'});
    game.querySelectorAll('input:not([type=range]):not([type=checkbox])').forEach(el=>{if(inputHooked.has(el))return;inputHooked.add(el);const overlay=el.closest('.device-overlay');if(!overlay)return;const key=currentScene+':'+(overlay.querySelector('h2')?.textContent||overlay.querySelector('section')?.className)+':'+(el.id||el.className||'answer');el.value=state().inputs[key]??el.value;el.addEventListener('input',()=>{state().inputs[key]=el.value;saveGame()})});
    game.querySelectorAll('.room3-answer-submit,.room3-final-submit,.r4-answer,.piano-submit,[id$="Submit"]').forEach(el=>{el.classList.add('design-submit');if(/確認|答える/.test(el.textContent))el.textContent='解答'});
    const overlay=game.querySelector('.room-dialog-overlay');game.classList.toggle('has-dialogue',!!overlay);if(overlay)decorateDialogue(overlay);
    if(!game.querySelector('.design-orientation')){const o=document.createElement('div');o.className='design-orientation';o.innerHTML='<div><h2>横向きでプレイ</h2><p>端末を横向きにしてください。<br>ゲームの進行は保持されます。</p></div>';game.append(o)}
  }
  function decorateDialogue(overlay){
    if(!overlay?.querySelector('.room-dialog')||overlay.dataset.design)return;overlay.dataset.design='true';
    const p=overlay.querySelector('.room-dialog'),portrait=document.createElement('div');portrait.className='hana-portrait';portrait.setAttribute('role','img');portrait.setAttribute('aria-label','ハナ');overlay.prepend(portrait);portrait.hidden=!portraitVisible;setExpression(portrait);
    const controls=document.createElement('div');controls.className='design-controls';
    const auto=button('AUTO',()=>Dialogue.toggleAuto()),skip=button('SKIP',()=>p.querySelector('.skip-button')?.click()),hide=button('非表示',()=>{p.classList.add('dialog-hidden');restore.hidden=false;Dialogue.suspend()});auto.dataset.designAuto='';skip.dataset.designSkip='';
    controls.append(button('記録',records),auto,skip,hide);p.append(controls);
    const restore=button('',e=>{} ,'dialogue-restore');restore.setAttribute('aria-label','会話を再表示');restore.hidden=true;restore.onclick=e=>{e.stopPropagation();restore.hidden=true;p.classList.remove('dialog-hidden');Dialogue.resume()};overlay.append(restore);
    p.addEventListener('click',e=>{if(!e.target.closest('button,input'))Dialogue.advance()});syncPlayback();
  }
  function setExpression(p){p.style.backgroundPosition=`${(expression%3)*50}% ${Math.floor(expression/3)*100}%`;p.dataset.expression=portraitExpressions[expression]}
  function displayLine(line,kind){
    const id=line.logId||'',flashback=/memory|flashback|^r[4-7]f\d|^r[4-7]_memory/.test(id);
    if(flashback)portraitVisible=false;else if(kind==='heroine'&&currentScene!=='opening')portraitVisible=true;
    if(line.expression)expression=Math.max(0,portraitExpressions.indexOf(line.expression));else if(kind==='heroine'){expression=/！|嬉|楽しい|正解/.test(line.text)?1:/え？|えっ|びっくり/.test(line.text)?3:/悲|泣|ごめん|大丈夫/.test(line.text)?4:/考|かな|……？/.test(line.text)?2:0}
    decorateDialogue(game.querySelector('.room-dialog-overlay')||document.createElement('div'));
    const p=game.querySelector('.hana-portrait');if(p){p.hidden=!portraitVisible;setExpression(p)}
    if(orientation.matches)Dialogue.suspend();
    // Effects are visual captions only. No independent sound record category.
  }
  function syncPlayback(){game.querySelectorAll('[data-design-auto]').forEach(b=>b.setAttribute('aria-pressed',String(Dialogue.isAutoEnabled())));game.querySelectorAll('[data-design-skip]').forEach(b=>{const source=game.querySelector('.room-dialog .skip-button');b.disabled=!source||source.disabled;b.setAttribute('aria-pressed',source?.getAttribute('aria-pressed')||'false')})}
  function onInstall(c){cancelUse();config=c;recordRoom=c.sceneId||currentScene;inspectionTarget='';if(!state().visited.includes(recordRoom))state().visited.push(recordRoom);queueMicrotask(()=>{syncHud();if(!localStorage.getItem('saigononazo-help-seen')){localStorage.setItem('saigononazo-help-seen','1');if(!game.querySelector('.room-dialog-overlay,.device-overlay'))help()}})}
  function beginDialogue(lines){dialogueGroup=currentScene+':'+Date.now()+':'+(++sequence);portraitVisible=lines.some(l=>l.speaker==='ハナ')&&!lines.some(l=>/memory|flashback/.test(l.logId||''));expression=0}
  function endDialogue(){dialogueGroup='';game.classList.remove('has-dialogue')}
  function savePreview(){
    const image=game.querySelector('.room-background,.room-bg');if(image?.getAttribute('src'))return image.getAttribute('src');
    const canvas=document.createElement('canvas');canvas.width=240;canvas.height=135;const ctx=canvas.getContext('2d');if(!ctx)return '';
    ctx.fillStyle='#e8e1d3';ctx.fillRect(0,0,240,135);const frame=game.getBoundingClientRect();
    game.querySelectorAll('.late-object,.r6-cell,.r7-book,.r7-doors button,.r8-table,.r8-paper,.room2-door-art,.room2-desk-art,.room3-door,.room3-bed,.r4-door-art').forEach(el=>{const r=el.getBoundingClientRect(),css=getComputedStyle(el);ctx.fillStyle=css.backgroundColor==='rgba(0, 0, 0, 0)'?'#b6a990':css.backgroundColor;ctx.fillRect((r.x-frame.x)/frame.width*240,(r.y-frame.y)/frame.height*135,r.width/frame.width*240,r.height/frame.height*135)});
    ctx.fillStyle='#faf7ee';ctx.fillRect(0,0,240,22);ctx.font='11px sans-serif';ctx.fillStyle='#35332e';ctx.fillText(roomLabel(currentScene),8,15);return canvas.toDataURL('image/png');
  }
  let captionTimer;
  document.addEventListener('game:sound',e=>{if(!settings.soundCaptions)return;const text={tinnitus:'耳鳴りが響く。',memoryMelody:'ピアノの旋律が響く。',memoryBand:'演奏の音が聞こえてくる。'}[e.detail?.id];if(!text)return;let caption=game.querySelector('.design-sound-caption');if(!caption){caption=paragraph('');caption.className='design-sound-caption';game.append(caption)}caption.textContent=text;caption.hidden=false;clearTimeout(captionTimer);captionTimer=setTimeout(()=>caption.hidden=true,3000)});
  const orientation=matchMedia('(orientation:portrait) and (pointer:coarse)');orientation.addEventListener('change',()=>{if(orientation.matches)Dialogue.suspend();else if(!modal)Dialogue.resume()});
  document.addEventListener('keydown',e=>{if(modal||orientation.matches)return;if(e.key==='Escape'&&pendingUse){e.preventDefault();cancelUse();return}if(e.target.closest?.('input,textarea,select'))return;if((e.key===' '||e.key==='Enter')&&game.querySelector('.room-dialog:not(.dialog-hidden),.opening .dialog:not(.is-log-open)')){e.preventDefault();Dialogue.advance()}});
  document.addEventListener('click',e=>{if(e.target.closest?.('#gameplayLogButton,.room-dialog .log-button')){e.preventDefault();e.stopImmediatePropagation();records()}},{capture:true});
  document.addEventListener('dialogue:autochange',syncPlayback);document.addEventListener('dialogue:skipchange',()=>queueMicrotask(syncPlayback));
  new MutationObserver(syncHud).observe(game,{childList:true,subtree:true});
  window.DesignUI={onInstall,beginDialogue,endDialogue,paginateDialogue,displayLine,savePreview,pickup,records,options,help,get dialogueGroup(){return dialogueGroup},get inspectionTarget(){return inspectionTarget}};
  showSettings=options;
})();
