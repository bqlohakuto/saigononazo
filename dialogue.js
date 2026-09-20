// One active dialogue owns its typing and AUTO timers. Observation screens never do.
const Dialogue=(()=>{
 let autoEnabled=false,active=null;
 const AUTO_DELAY=2000;
 const SKIP_DELAY=80;
 const kindOf=line=>line.speaker==="主人公"||line.thought?"player":line.speaker==="ハナ"?"heroine":line.speaker==="ト書き"?"narration":line.logType==="dialogue"?"character":"system";
 const emitAutoChange=()=>{
  if(typeof document?.dispatchEvent==="function"&&typeof CustomEvent==="function")document.dispatchEvent(new CustomEvent("dialogue:autochange",{detail:{enabled:autoEnabled}}));
 };
 const emitSkipChange=(enabled,available)=>{
  if(typeof document?.dispatchEvent==="function"&&typeof CustomEvent==="function")document.dispatchEvent(new CustomEvent("dialogue:skipchange",{detail:{enabled,available}}));
 };
 const stop=()=>{if(active)active.dispose()};
 function start({lines,messageArea,nextButton,autoButton,skipButton,logButton,logArea,dialog,startIndex=0,getTextSpeed,isRead,onDisplay,onComplete}){
  stop();
  let index=Number.isInteger(startIndex)?Math.max(0,Math.min(startIndex,lines.length-1)):0;
  let typingTimer=null,autoTimer=null,skipTimer=null,typing=false,disposed=false,logOpen=false,messageScrollTop=0,skipEnabled=false,currentWasRead=false;
  const hasLog=!!(logButton&&logArea&&dialog);
  let message=null,characters=[];
  const clearAuto=()=>{clearTimeout(autoTimer);autoTimer=null};
  const clearSkip=()=>{clearTimeout(skipTimer);skipTimer=null};
  const updateAutoButton=()=>{
   autoButton.textContent=autoEnabled?"AUTO ON":"AUTO OFF";
   autoButton.setAttribute("aria-pressed",String(autoEnabled));
   autoButton.title=kindOf(lines[index]||{})==="system"?"この案内は手動で進めます":"会話と地の文を自動で送ります";
  };
  const updateSkipButton=()=>{
   if(!skipButton)return;
   const available=!disposed&&!logOpen&&currentWasRead;
   skipButton.textContent=skipEnabled?"SKIP ON":"SKIP";
   skipButton.setAttribute("aria-pressed",String(skipEnabled));
   skipButton.disabled=!available;
   skipButton.title=available?"表示済みのテキストをスキップします":"このテキストはまだ表示していません";
   emitSkipChange(skipEnabled,available);
  };
  const scheduleAuto=()=>{
   clearAuto();
   if(disposed||logOpen||typing||!autoEnabled||document.hidden||kindOf(lines[index])==="system")return;
   autoTimer=setTimeout(()=>{
    autoTimer=null;
    if(!disposed&&!logOpen&&!typing&&autoEnabled&&!document.hidden)advance();
   },AUTO_DELAY);
  };
  const scheduleSkip=()=>{
   clearSkip();
   if(disposed||logOpen||typing||!skipEnabled||!currentWasRead||document.hidden)return;
   skipTimer=setTimeout(()=>{
    skipTimer=null;
    if(!disposed&&!logOpen&&!typing&&skipEnabled&&currentWasRead&&!document.hidden)advance();
   },SKIP_DELAY);
  };
  const finishTyping=()=>{
   clearInterval(typingTimer);typingTimer=null;
   if(disposed)return;
   message.textContent=characters.join("");
   typing=false;
   if(skipEnabled)scheduleSkip();else scheduleAuto();
  };
  function render(){
   clearAuto();clearSkip();clearInterval(typingTimer);typingTimer=null;
   const line=lines[index],kind=kindOf(line);
   currentWasRead=typeof isRead==="function"&&isRead(line)===true;
   if(skipEnabled&&!currentWasRead)skipEnabled=false;
   const row=document.createElement("div");
   row.className=`message-row ${kind}${kind==="player"&&line.thought?" thought":""}`;
   row.setAttribute("aria-label",kind==="player"?(line.thought?"主人公の心の声":"主人公のセリフ"):kind==="heroine"?"ハナのセリフ":kind==="character"?`${line.speaker}のセリフ`:kind==="narration"?"地の文":line.speaker||"案内");
   if(kind==="character"||kind==="player"){
    const label=document.createElement("span");label.className="message-speaker";label.textContent=kind==="player"?(line.thought?"心の声":"主人公"):line.speaker;row.appendChild(label);
   }
   message=document.createElement("div");message.className=`message ${kind}${kind==="player"&&line.thought?" thought":""}`;
   row.appendChild(message);messageArea.replaceChildren(row);messageArea.scrollTop=0;
   characters=Array.from(line.text);typing=true;
   updateAutoButton();updateSkipButton();
   if(onDisplay)onDisplay(line,index);
   if(skipEnabled&&currentWasRead){message.textContent=characters.join("");typing=false;scheduleSkip();return}
   let count=0;
   const speed=Number(getTextSpeed());
   typingTimer=setInterval(()=>{
    if(disposed)return;
    count++;
    message.textContent=characters.slice(0,count).join("");
    if(count>=characters.length)finishTyping();
   },Number.isFinite(speed)?Math.max(15,Math.min(100,speed)):45);
  }
  function advance(){
   if(disposed||logOpen)return;
   clearAuto();
   if(typing){finishTyping();return}
   index++;
   if(index>=lines.length){
    dispose();nextButton.disabled=true;autoButton.disabled=true;
    if(onComplete)onComplete();
    return;
   }
   render();
  }
  function manualAdvance(){
   if(skipEnabled){skipEnabled=false;clearSkip();updateSkipButton()}
   advance();
  }
  function toggleAuto(){
   if(disposed||logOpen)return autoEnabled;
   autoEnabled=!autoEnabled;
   if(autoEnabled&&skipEnabled){skipEnabled=false;clearSkip();updateSkipButton()}
   updateAutoButton();scheduleAuto();emitAutoChange();
   return autoEnabled;
  }
  function toggleSkip(){
   if(disposed||logOpen||!currentWasRead)return skipEnabled;
   skipEnabled=!skipEnabled;
   if(skipEnabled&&autoEnabled){autoEnabled=false;clearAuto();updateAutoButton();emitAutoChange()}
   updateSkipButton();
   if(skipEnabled){if(typing)finishTyping();else scheduleSkip()}else clearSkip();
   return skipEnabled;
  }
  function appendLogEntry(entry){
   const kind=entry.kind||kindOf(entry),row=document.createElement("div"),text=document.createElement("div");
   row.className=`message-row ${kind}${kind==="player"&&entry.thought?" thought":""}`;
   row.setAttribute("aria-label",kind==="player"?(entry.thought?"主人公の心の声":"主人公のセリフ"):kind==="heroine"?"ハナのセリフ":kind==="character"?`${entry.speaker}のセリフ`:kind==="narration"?"地の文":entry.speaker||"案内");
   if(kind==="character"||kind==="player"){
    const label=document.createElement("span");label.className="message-speaker";label.textContent=kind==="player"?(entry.thought?"心の声":"主人公"):entry.speaker;row.appendChild(label);
   }
   text.className=`message ${kind}${kind==="player"&&entry.thought?" thought":""}`;
   text.textContent=entry.text;
   if(entry.color)text.style.color=entry.color;
   row.appendChild(text);logArea.appendChild(row);
  }
  function openLog(){
   if(disposed||logOpen||!hasLog)return;
   logOpen=true;
   clearAuto();clearSkip();
   // Completing the current line is safe; setting logOpen first prevents AUTO from advancing it.
   if(typing)finishTyping();
   messageScrollTop=messageArea.scrollTop;
   const entries=GameLog.list(),current=GameLog.entryFor(lines[index]);
   logArea.replaceChildren();
   entries.forEach(appendLogEntry);
   if(current&&entries[entries.length-1]?.id!==current.id){
    // A repeated line stays unique in the saved chronology; this is only a current-line preview.
    const caption=document.createElement("p");
    caption.className="log-current-caption";caption.textContent="現在のテキスト";
    logArea.appendChild(caption);appendLogEntry(current);
   }
   nextButton.disabled=true;autoButton.disabled=true;updateSkipButton();
   messageArea.hidden=true;logArea.hidden=false;
   dialog.classList.add("is-log-open");
   logButton.setAttribute("aria-pressed","true");
   logButton.setAttribute("aria-expanded","true");
   logButton.title="LOGを閉じる";
   logArea.scrollTop=logArea.scrollHeight;
  }
  function closeLog(){
   if(disposed||!logOpen)return;
   logOpen=false;
   dialog.classList.remove("is-log-open");
   logArea.hidden=true;messageArea.hidden=false;
   messageArea.scrollTop=messageScrollTop;
   logButton.setAttribute("aria-pressed","false");
   logButton.setAttribute("aria-expanded","false");
   logButton.title="過去のテキストを確認する";
   nextButton.disabled=false;autoButton.disabled=false;updateSkipButton();
   logButton.focus({preventScroll:true});
   if(skipEnabled)scheduleSkip();else scheduleAuto();
  }
  function toggleLog(event){
   event?.stopPropagation();
   if(logOpen)closeLog();else openLog();
  }
  function logKeyDown(event){
   if(logOpen&&event.key==="Escape"){
    event.preventDefault();event.stopPropagation();closeLog();
   }
  }
  function visibilityChanged(){
   clearAuto();clearSkip();
   if(!document.hidden){if(skipEnabled)scheduleSkip();else scheduleAuto()}
  }
  function dispose(){
   if(disposed)return;
   disposed=true;clearInterval(typingTimer);clearAuto();clearSkip();skipEnabled=false;
   nextButton.removeEventListener("click",manualAdvance);
   autoButton.removeEventListener("click",toggleAuto);
   if(skipButton){skipButton.removeEventListener("click",toggleSkip);skipButton.disabled=true;skipButton.setAttribute("aria-pressed","false")}
   if(hasLog){
    logButton.removeEventListener("click",toggleLog);
    dialog.removeEventListener("keydown",logKeyDown);
    dialog.classList.remove("is-log-open");
    logArea.hidden=true;messageArea.hidden=false;
    if(logOpen)messageArea.scrollTop=messageScrollTop;
    logOpen=false;
    logButton.setAttribute("aria-pressed","false");
    logButton.setAttribute("aria-expanded","false");
    logButton.title="過去のテキストを確認する";
    logButton.disabled=true;
   }
   document.removeEventListener("visibilitychange",visibilityChanged);
   emitSkipChange(false,false);
   if(active===controller)active=null;
  }
  const controller={advance:manualAdvance,dispose,toggleAuto,toggleSkip};active=controller;
  nextButton.disabled=false;autoButton.disabled=false;
  nextButton.addEventListener("click",manualAdvance);
  autoButton.addEventListener("click",toggleAuto);
  if(skipButton){skipButton.disabled=true;skipButton.setAttribute("aria-pressed","false");skipButton.addEventListener("click",toggleSkip)}
  if(hasLog){
   logArea.hidden=true;logButton.disabled=false;
   logButton.setAttribute("aria-pressed","false");
   logButton.setAttribute("aria-expanded","false");
   logButton.title="過去のテキストを確認する";
   logButton.addEventListener("click",toggleLog);
   dialog.addEventListener("keydown",logKeyDown);
  }
  document.addEventListener("visibilitychange",visibilityChanged);
  emitAutoChange();
  if(!lines.length){dispose();if(onComplete)onComplete();return controller}
  render();nextButton.focus({preventScroll:true});
  return controller;
 }
 function toggleAutoState(){
  if(active?.toggleAuto)return active.toggleAuto();
  autoEnabled=!autoEnabled;emitAutoChange();return autoEnabled;
 }
 return {start,stop,toggleAuto:toggleAutoState,isAutoEnabled:()=>autoEnabled};
})();
