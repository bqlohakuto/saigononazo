/* Key items are inspected manually, independently of dialogue AUTO. */
(function(){
 let inspectionSequence=0;

 window.showItemInspection=function({container,item,onContinue,onClose}){
  if(!container||!item)throw new TypeError("An inspection container and item are required.");

  const opener=document.activeElement;
  const room=container.querySelector(".room");
  const wasInert=room?.inert||false;
  if(room)room.inert=true;
  const frames=item.frames?.length?item.frames:[item];
  let frameIndex=0;
  const overlay=document.createElement("div");
  overlay.className="inspection-overlay";

  const panel=document.createElement("section");
  panel.className="inspection-panel";
  panel.setAttribute("role","dialog");
  panel.setAttribute("aria-modal","true");

  const title=document.createElement("h2");
  title.className="inspection-title";
  title.id=`inspection-title-${++inspectionSequence}`;
  title.textContent=item.label;
  panel.setAttribute("aria-labelledby",title.id);

  const closeButton=document.createElement("button");
  closeButton.type="button";
  closeButton.className="inspection-close";
  closeButton.setAttribute("aria-label","閉じる");
  closeButton.textContent="×";

  const artButton=document.createElement("button");
  artButton.type="button";
  artButton.className="inspection-art-button";
  artButton.setAttribute("aria-label",`${item.label}を確認して次へ`);

  let image;
  if(frames[0].image){
   image=document.createElement("img");
   image.className="inspection-image";
   image.src=frames[0].image;
   image.alt=frames[0].label;
   title.textContent=frames[0].label;
   image.draggable=false;
   artButton.append(image);
  }else{
   const placeholder=document.createElement("div");
   placeholder.className="inspection-placeholder";
   if(item.id==="piano")placeholder.classList.add("piano-preview");
   if(item.id==="poster")placeholder.classList.add("poster-preview");
   placeholder.setAttribute("aria-hidden","true");
   artButton.append(placeholder);
  }

  const help=document.createElement("p");
  help.className="inspection-help";
  help.textContent="画像をクリックして次へ進む";
  panel.append(title,closeButton,artButton,help);
  overlay.append(panel);

  let finished=false;
  const observer=new MutationObserver(()=>{
   if(!overlay.isConnected)finish("destroy");
  });

  function restoreOpener(){
   if(opener instanceof HTMLElement&&opener.isConnected&&!opener.matches(":disabled")&&!opener.closest("[hidden], [inert]")){
    opener.focus({preventScroll:true});
   }
  }

  function finish(action){
   if(finished)return;
   finished=true;
   observer.disconnect();
   closeButton.removeEventListener("click",close);
   artButton.removeEventListener("click",proceed);
   document.removeEventListener("keydown",onKeyDown,true);
   document.removeEventListener("focusin",onFocusIn,true);
   overlay.remove();
   if(room)room.inert=wasInert;
   if(action==="continue"){
    restoreOpener();
    if(typeof onContinue==="function")onContinue();
   }else if(action==="close"){
    if(typeof onClose==="function")onClose();
    restoreOpener();
   }
  }

  function close(event){
   event?.stopPropagation();
   finish("close");
  }
  function proceed(event){
   event.stopPropagation();
   if(frameIndex+1<frames.length){
    const frame=frames[++frameIndex];
    image.src=frame.image;
    image.alt=frame.label;
    title.textContent=frame.label;
    return;
   }
   finish("continue");
  }

  function onKeyDown(event){
   if(event.key==="Escape"){
    event.preventDefault();
    event.stopImmediatePropagation();
    close();
   }else if(event.key==="Tab"){
    event.preventDefault();
    event.stopImmediatePropagation();
    // There are exactly two controls; keep both directions inside the dialog.
    if(document.activeElement===artButton)closeButton.focus();
    else if(document.activeElement===closeButton)artButton.focus();
    else (event.shiftKey?artButton:closeButton).focus();
   }
  }

  function onFocusIn(event){
   if(!finished&&!panel.contains(event.target))artButton.focus({preventScroll:true});
  }

  closeButton.addEventListener("click",close);
  artButton.addEventListener("click",proceed);
  container.append(overlay);
  document.addEventListener("keydown",onKeyDown,true);
  document.addEventListener("focusin",onFocusIn,true);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  artButton.focus({preventScroll:true});

  return {close,destroy:()=>finish("destroy")};
 };
})();
