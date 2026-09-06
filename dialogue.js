// One active dialogue owns its typing and AUTO timers. Observation screens never do.
const Dialogue=(()=>{
 let autoEnabled=false,active=null;
 const AUTO_DELAY=2000;
 const kindOf=line=>line.speaker==="主人公"||line.thought?"player":line.speaker==="ハナ"?"heroine":line.speaker==="ト書き"?"narration":"system";
 const stop=()=>{if(active)active.dispose()};
 function start({lines,messageArea,nextButton,autoButton,getTextSpeed,onComplete}){
  stop();
  let index=0,typingTimer=null,autoTimer=null,typing=false,disposed=false;
  let message=null,characters=[];
  const clearAuto=()=>{clearTimeout(autoTimer);autoTimer=null};
  const updateAutoButton=()=>{
   autoButton.textContent=autoEnabled?"AUTO ON":"AUTO OFF";
   autoButton.setAttribute("aria-pressed",String(autoEnabled));
   autoButton.title=kindOf(lines[index]||{})==="system"?"この案内は手動で進めます":"会話と地の文を自動で送ります";
  };
  const scheduleAuto=()=>{
   clearAuto();
   if(disposed||typing||!autoEnabled||document.hidden||kindOf(lines[index])==="system")return;
   autoTimer=setTimeout(()=>{
    autoTimer=null;
    if(!disposed&&!typing&&autoEnabled&&!document.hidden)advance();
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
   if(disposed)return;
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
   if(disposed)return;
   autoEnabled=!autoEnabled;updateAutoButton();scheduleAuto();
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
   document.removeEventListener("visibilitychange",visibilityChanged);
   if(active===controller)active=null;
  }
  const controller={advance,dispose};active=controller;
  nextButton.disabled=false;autoButton.disabled=false;
  nextButton.addEventListener("click",advance);
  autoButton.addEventListener("click",toggleAuto);
  document.addEventListener("visibilitychange",visibilityChanged);
  if(!lines.length){dispose();if(onComplete)onComplete();return controller}
  render();nextButton.focus({preventScroll:true});
  return controller;
 }
 return {start,stop};
})();
