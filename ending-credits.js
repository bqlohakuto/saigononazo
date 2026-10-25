(function(global){
  "use strict";
  // Only approved credits. Each role intentionally has its own card.
  const CREDITS=[
    ["PLANNING","八上白兎"],
    ["STORY / SCENARIO","八上白兎"],
    ["PUZZLE DESIGN","八上白兎"],
    ["GAME DESIGN","八上白兎"],
    ["VISUAL DESIGN","八上白兎"],
    ["GRAPHIC PRODUCTION","ChatGPT"],
    ["UI DESIGN","八上白兎"],
    ["BACKGROUND MUSIC","Gemini"],
    ["SOUND EFFECTS","効果音ラボ"]
  ];
  const DURATION=166.243208;
  let active=null;
  // Absolute song-time cues, scaled only if a different decoded duration is reported.
  // Credits: 0-132; final title: 135; deletion: 144; rewrite: 147;
  // long final-title hold: 148-156; thanks and piano tail: 158-end.
  function frameAt(seconds,duration=DURATION){
    const t=seconds*DURATION/duration;
    const opacity=(local,length)=>Math.max(0,Math.min(1,local/1.1,(length-local)/1.5));
    if(t<132){
      const slot=132/CREDITS.length,index=Math.min(CREDITS.length-1,Math.floor(t/slot));
      const local=t-index*slot,[role,name]=CREDITS[index];
      return {kind:"credit",index,role,name:Array.from(name).slice(0,Math.max(0,Math.floor((local-1.4)/.26))).join(""),opacity:opacity(local,slot)};
    }
    if(t<135)return {kind:"gap",role:"",name:"",opacity:0};
    if(t<158){
      const original="最後の謎が解けるまで",stem="最後の謎が解け";
      let name=original;
      if(t>=144&&t<147)name=Array.from(original).slice(0,original.length-Math.min(3,Math.floor((t-144)/.48))).join("");
      if(t>=147)name=stem+Array.from("ても").slice(0,Math.min(2,Math.floor((t-147)/.48)+1)).join("");
      return {kind:"title",role:"",name,opacity:opacity(t-135,23)};
    }
    return {kind:"thanks",role:"",name:"THANKS FOR PLAYING.",opacity:opacity(t-158,DURATION-158)};
  }
  function start(host,onComplete){
    if(active)active();
    const stage=document.createElement("section");
    stage.className="ending-credits";stage.setAttribute("aria-label","エンドロール");
    stage.innerHTML='<div class="ending-card"><p class="ending-role"></p><h1 class="ending-name"></h1></div><div class="ending-audio-prompt" hidden><p role="status"></p><button type="button" data-retry>楽曲を再生</button><button type="button" data-silent>音声なしで続ける</button></div>';
    host.replaceChildren(stage);
    const card=stage.querySelector(".ending-card"),role=stage.querySelector(".ending-role"),name=stage.querySelector(".ending-name"),prompt=stage.querySelector(".ending-audio-prompt"),status=prompt.querySelector("p"),retry=prompt.querySelector("[data-retry]"),silent=prompt.querySelector("[data-silent]");
    const track=GameAudio.createEndingTrack();
    track.hidden=true;stage.append(track);
    let ready=false;
    let raf=0,dead=false,started=false,silentMode=false,elapsed=0,last=0,ended=false,attempt=0,lastProgress=performance.now(),lastTime=0;
    const duration=()=>Number.isFinite(track.duration)&&track.duration>0?track.duration:DURATION;
    function render(t){
      const f=frameAt(t,duration());
      stage.dataset.phase=f.kind;stage.dataset.credit=String(f.index??"");
      card.className="ending-card"+(f.kind==="title"?" is-title":f.kind==="thanks"?" is-title is-thanks":"");
      card.style.opacity=String(f.opacity);
      // Do not replace nodes: stable layout and no repeatedly announced typing.
      role.textContent=f.role;name.textContent=f.name;
    }
    function cleanup(){
      if(dead)return;dead=true;attempt++;
      cancelAnimationFrame(raf);clearTimeout(fadeTimer);clearTimeout(loadTimer);
      document.removeEventListener("visibilitychange",visibility);
      global.removeEventListener("pagehide",pagehide);
      GameAudio.releaseEndingTrack(track);
      if(active===cleanup)active=null;
    }
    function complete(){cleanup();onComplete();}
    function ask(message){
      if(dead||silentMode||document.hidden)return;
      attempt++;clearTimeout(loadTimer);track.pause();status.textContent=message;prompt.hidden=false;retry.disabled=false;retry.textContent="楽曲を再生・再開";
      retry.focus();
    }
    async function play(){
      if(dead||document.hidden)return;
      ready=true;
      const token=++attempt;retry.disabled=true;
      status.textContent="楽曲を読み込んでいます…";prompt.hidden=false;
      clearTimeout(loadTimer);
      loadTimer=setTimeout(()=>{if(token===attempt)ask("楽曲の読み込みに時間がかかっています。再試行できます。");},15000);
      try{
        // Called directly from a retry gesture when autoplay has been blocked.
        if(track.error){track.load();track.currentTime=lastTime;}
        await track.play();
        if(dead||token!==attempt)return;
        clearTimeout(loadTimer);prompt.hidden=true;started=true;lastProgress=performance.now();last=0;
      }catch(_){if(!dead&&token===attempt){clearTimeout(loadTimer);ask("楽曲を再生するには、下のボタンを押してください。");}}
    }
    function tick(now){
      if(dead)return;
      if(!stage.isConnected){cleanup();return;}
      if(!document.hidden&&prompt.hidden&&started){
        if(silentMode){if(last)elapsed+=(now-last)/1000;render(elapsed);if(elapsed>=duration()){complete();return;}}
        else{
          const t=track.currentTime;
          render(t);
          if(t>lastTime+.01){lastTime=t;lastProgress=now;}
          if(ended){render(duration());complete();return;}
          if(now-lastProgress>15000)ask("再生が一時停止しました。続きから再開できます。");
        }
      }
      last=document.hidden?0:now;raf=requestAnimationFrame(tick);
    }
    function visibility(){
      last=0;
      if(document.hidden)track.pause();
      else if(ready&&!silentMode&&prompt.hidden)play();
    }
    function pagehide(){track.pause();last=0;}
    track.addEventListener("ended",()=>{ended=true;});
    track.addEventListener("error",()=>ask("楽曲を読み込めませんでした。再試行するか、音声なしで続けられます。"));
    retry.onclick=()=>{clearTimeout(fadeTimer);play();};
    silent.onclick=()=>{clearTimeout(fadeTimer);attempt++;clearTimeout(loadTimer);track.pause();silentMode=true;elapsed=lastTime;started=true;prompt.hidden=true;last=0;};
    document.addEventListener("visibilitychange",visibility);
    global.addEventListener("pagehide",pagehide);
    GameAudio.fadeForEnding(1600);
    let loadTimer;
    const fadeTimer=setTimeout(()=>{if(!dead){ready=true;play();}},1600);
    active=cleanup;render(0);raf=requestAnimationFrame(tick);
  }
  // The screen corners are measured against epilogue-bedroom-v4.webp (1672 x 941).
  // Move the whole photograph and its screen overlay together on the fixed canvas.
  function fromEpilogue(host,onComplete){
    if(active)active();
    const stage=document.createElement("section");
    stage.className="ending-pc-transition";
    stage.setAttribute("aria-label","ノートPCの画面へ");
    stage.innerHTML='<div class="ending-pc-camera"><img src="images/background/room08/epilogue-bedroom-v4.webp" alt=""><div class="ending-pc-screen"><span>最後の謎が解けるまで</span></div></div><div class="ending-pc-black"></div>';
    host.replaceChildren(stage);
    const camera=stage.querySelector(".ending-pc-camera"),screen=stage.querySelector(".ending-pc-screen"),title=screen.querySelector("span"),black=stage.querySelector(".ending-pc-black");
    const reduced=global.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let raf=0,dead=false,elapsed=0,last=0;
    function cleanup(){dead=true;cancelAnimationFrame(raf);document.removeEventListener("visibilitychange",pause);if(active===cleanup)active=null;}
    function pause(){last=0;}
    const clamp=x=>Math.min(1,Math.max(0,x));
    function tick(now){
      if(dead)return;
      if(!stage.isConnected){cleanup();return;}
      if(!document.hidden){
        if(last)elapsed+=(now-last)/1000;
        const zoom=clamp((elapsed-2.4)/5);
        const ease=zoom*zoom*(3-2*zoom);
        camera.style.transform=reduced?"none":"translate("+(72*ease)+"px,"+(106*ease)+"px) scale("+(1+4.2*ease)+")";
        screen.style.opacity=String(clamp(elapsed/1.3));
        title.style.opacity=String(clamp((elapsed-.5)/1.2)*(1-clamp((elapsed-6.2)/.8)));
        black.style.opacity=String(clamp((elapsed-6.6)/.8));
        if(elapsed>=7.5){cleanup();start(host,onComplete);return;}
        last=now;
      }else last=0;
      raf=requestAnimationFrame(tick);
    }
    document.addEventListener("visibilitychange",pause);
    active=cleanup;raf=requestAnimationFrame(tick);
  }
  global.EndingCredits={start,fromEpilogue,frameAt};
})(window);
