// One active dialogue owns its typing and AUTO timers. Observation screens never do.
const Dialogue=(()=>{
 let autoEnabled=false,active=null;
 const AUTO_DELAY=2000;
 const kindOf=line=>line.speaker==="主人公"||line.thought?"player":line.speaker==="ハナ"?"heroine":line.speaker==="ト書き"?"narration":"system";
 const stop=()=>{if(active)active.dispose()};
 function start({lines,messageArea,nextButton,autoButton,logButton,logArea,dialog,startIndex=0,getTextSpeed,onDisplay,onComplete}){
  stop();
  let index=Number.isInteger(startIndex)?Math.max(0,Math.min(startIndex,lines.length-1)):0;
  let typingTimer=null,autoTimer=null,typing=false,disposed=false,logOpen=false,messageScrollTop=0;
  const hasLog=!!(logButton&&logArea&&dialog);
  let message=null,characters=[];
  const clearAuto=()=>{clearTimeout(autoTimer);autoTimer=null};
  const updateAutoButton=()=>{
   autoButton.textContent=autoEnabled?"AUTO ON":"AUTO OFF";
   autoButton.setAttribute("aria-pressed",String(autoEnabled));
   autoButton.title=kindOf(lines[index]||{})==="system"?"この案内は手動で進めます":"会話と地の文を自動で送ります";
  };
  const scheduleAuto=()=>{
   clearAuto();
   if(disposed||logOpen||typing||!autoEnabled||document.hidden||kindOf(lines[index])==="system")return;
   autoTimer=setTimeout(()=>{
    autoTimer=null;
    if(!disposed&&!logOpen&&!typing&&autoEnabled&&!document.hidden)advance();
   },AUTO_DELAY);
  };
  const finishTyping=()=>{
   clearInterval(typingTimer);typingTimer=null;
   if(disposed)return;
   message.textContent=characters.join("");
   typing=false;
   scheduleAuto();
  };
  function render(){
   clearAuto();clearInterval(typingTimer);typingTimer=null;
   const line=lines[index],kind=kindOf(line);
   const row=document.createElement("div");
   row.className=`message-row ${kind}`;
   row.setAttribute("aria-label",kind==="player"?(line.thought?"主人公の心の声":"主人公のセリフ"):kind==="heroine"?"ハナのセリフ":kind==="narration"?"地の文":line.speaker||"案内");
   message=document.createElement("div");message.className=`message ${kind}`;
   row.appendChild(message);messageArea.replaceChildren(row);messageArea.scrollTop=0;
   characters=Array.from(line.text);typing=true;
   updateAutoButton();
   if(onDisplay)onDisplay(line,index);
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
  function toggleAuto(){
   if(disposed||logOpen)return;
   autoEnabled=!autoEnabled;updateAutoButton();scheduleAuto();
  }
  function appendLogEntry(entry){
   const kind=entry.kind||kindOf(entry),row=document.createElement("div"),text=document.createElement("div");
   row.className=`message-row ${kind}`;
   text.className=`message ${kind}`;
   text.textContent=entry.text;
   if(entry.color)text.style.color=entry.color;
   row.appendChild(text);logArea.appendChild(row);
  }
  function openLog(){
   if(disposed||logOpen||!hasLog)return;
   logOpen=true;
   clearAuto();
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
   nextButton.disabled=true;autoButton.disabled=true;
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
   nextButton.disabled=false;autoButton.disabled=false;
   logButton.focus({preventScroll:true});
   scheduleAuto();
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
   clearAuto();
   if(!document.hidden)scheduleAuto();
  }
  function dispose(){
   if(disposed)return;
   disposed=true;clearInterval(typingTimer);clearAuto();
   nextButton.removeEventListener("click",advance);
   autoButton.removeEventListener("click",toggleAuto);
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
   if(active===controller)active=null;
  }
  const controller={advance,dispose};active=controller;
  nextButton.disabled=false;autoButton.disabled=false;
  nextButton.addEventListener("click",advance);
  autoButton.addEventListener("click",toggleAuto);
  if(hasLog){
   logArea.hidden=true;logButton.disabled=false;
   logButton.setAttribute("aria-pressed","false");
   logButton.setAttribute("aria-expanded","false");
   logButton.title="過去のテキストを確認する";
   logButton.addEventListener("click",toggleLog);
   dialog.addEventListener("keydown",logKeyDown);
  }
  document.addEventListener("visibilitychange",visibilityChanged);
  if(!lines.length){dispose();if(onComplete)onComplete();return controller}
  render();nextButton.focus({preventScroll:true});
  return controller;
 }
 return {start,stop};
})();
