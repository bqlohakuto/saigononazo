// Playable late-game implementation for rooms 5-8.
// Confirmed scenario/mechanics are implemented directly.
// Any missing design data is shown in-game as 【未確定】 instead of being silently invented.
(() => {
  const line=(logId,speaker,text,extra={})=>({logId,logType:speaker==="ト書き"?"narration":speaker==="システム"?"narration":"dialogue",speaker,text,...extra});
  const pending=text=>line("pending_"+Math.random().toString(36).slice(2),"システム","【未確定】"+text);
  const setHud=(sceneId,title,objective,onCompanion,highlightLogEntry)=>{
    if(!window.GameplayUI)return;
    GameplayUI.installRoom({
      sceneId,title,objective,onCompanion,highlightLogEntry,
      getHighlights:()=>true,setHighlights:()=>{}
    });
  };
  const transition=(label,next)=>{
    Dialogue.stop();
    game.innerHTML='<div class="late-transition"><div><p>'+label+'</p><span>……</span></div></div>';
    setTimeout(next,650);
  };

  // ---------- Room 5 ----------
  const R5_ITEMS=[
    ["mirror","鏡"],["fish","魚"],["butterfly","蝶"],["flower","花"],
    ["squid","イカ"],["chair","椅子"],["cannon","大砲"]
  ];
  function normalizeR5(saved){
    const s=saved&&typeof saved==="object"?saved:{};
    return {
      collected:Array.isArray(s.collected)?[...new Set(s.collected)]:[],
      puzzleSkipped:!!s.puzzleSkipped,memorySeen:!!s.memorySeen,completed:!!s.completed,
      introSeen:!!s.introSeen
    };
  }
  showFifthRoom=function(savedState){
    Dialogue.stop();currentScene="room05";room5State=normalizeR5(savedState);
    renderR5();
    setHud("room05","第五の部屋",()=>room5State.completed?"第六の部屋へ進む":room5State.collected.length===7?"中央パネルを確認する":"部屋から7つのパネルを集める",()=>showRoomNotice("ハナは部屋の様子を静かに見ている。","r5_hana_watch"));
    saveGame();
    if(!room5State.introSeen){
      room5State.introSeen=true;saveGame();
      showRoomDialog([
        line("r5_intro_01","ト書き","視界が開ける。そこは、どこか生活の気配が残るリビングだった。"),
        line("r5_intro_02","主人公","……この部屋"),
        line("r5_intro_03","ト書き","鏡、冷蔵庫、窓際、花瓶、ダイニングの椅子。部屋のあちこちに気になるものがある。"),
        line("r5_intro_04","ト書き","中央には、八つの位置を持つ絵合わせのパネルが置かれている。")
      ]);
    }
  };
  function renderR5(){
    game.innerHTML='<main class="room late-room r5-full"><header class="room-header"><p class="room-label">第五の部屋</p><p class="room-color-status">同棲していたリビング</p></header>'+
      '<section class="late-stage living"><div class="late-room-note"><strong>探索</strong><span id="r5Progress"></span></div>'+
      '<div class="late-object-grid" id="r5Objects"></div>'+
      '<button class="late-main-action" id="r5Board">中央パネル</button>'+
      (room5State.completed?'<button class="late-next" id="r5Next">第六の部屋へ</button>':'')+
      '</section><p class="explore-status" id="exploreStatus">気になるものを調べてください。</p></main>';
    const box=document.getElementById("r5Objects");
    box.innerHTML=R5_ITEMS.map(([id,name])=>'<button class="late-object '+(room5State.collected.includes(id)?"done":"")+'" data-item="'+id+'">'+name+(room5State.collected.includes(id)?" ✓":"")+'</button>').join("");
    box.querySelectorAll("[data-item]").forEach(b=>b.onclick=()=>r5Collect(b.dataset.item));
    document.getElementById("r5Board").onclick=r5Board;
    document.getElementById("r5Next")?.addEventListener("click",()=>transition("第六の部屋へ",()=>showSixthRoom(roomStates.room06)));
    document.getElementById("r5Progress").textContent="パネル "+room5State.collected.length+" / 7（うさぎ＋羽は基準）";
    setHud("room05","第五の部屋",()=>room5State.completed?"第六の部屋へ進む":room5State.collected.length===7?"中央パネルを確認する":"部屋から7つのパネルを集める",()=>showRoomNotice("ハナは部屋の様子を静かに見ている。","r5_hana_watch"));
  }
  function r5Collect(id){
    if(room5State.collected.includes(id)){showRoomNotice("ここから回収できるものは、もうない。","r5_repeat_"+id);return;}
    const name=R5_ITEMS.find(x=>x[0]===id)?.[1]||id;
    const lines=[];
    if(id==="mirror"){
      lines.push(line("r5_mirror_face","ト書き","姿見には、部屋もハナも、自分の身体も映っている。けれど、自分の顔だけが白く滲んで見えない。"));
    }else if(id==="flower"){
      lines.push(line("r5_final_flower","ト書き","花瓶に花が飾られている。触れると、その姿が一枚のパネルへ変わった。"));
    }else{
      lines.push(line("r5_collect_"+id,"ト書き",name+"に触れると、その姿が縮み、一枚のパネルへ変わった。"));
    }
    lines.push(line("r5_get_"+id,"システム","【"+name+"のパネルを手に入れた】"));
    showRoomDialog(lines,()=>{room5State.collected.push(id);saveGame();renderR5()});
  }
  function r5Board(){
    if(room5State.completed){showRoomNotice("完成した絵が残っている。","r5_board_done");return;}
    if(room5State.collected.length<7){
      showRoomNotice("まだ空いている場所がある。部屋をもう少し調べよう。","r5_board_more");return;
    }
    const o=document.createElement("div");o.className="device-overlay late-overlay";
    o.innerHTML='<section class="late-panel"><button class="device-close" aria-label="閉じる">×</button><h2>助数詞パズル</h2>'+
      '<p>基準：<strong>うさぎ → 羽</strong></p><p>集めた7枚を、ものの「数え方」を手掛かりに正しく配置する。</p>'+
      '<div class="late-pending"><strong>【未確定】</strong><br>現在の確定データでは、7枚すべての最終配置（特に「大砲」の助数詞）が確定していません。<br>プレイ確認を続けるため、この部分だけテスト用に完成扱いにできます。</div>'+
      '<button class="late-main-action" id="r5TestComplete">テスト用：完成扱いで回想へ</button></section>';
    game.appendChild(o);activateDeviceModal(o,"r5Board",o.querySelector("#r5TestComplete"));
    o.querySelector("#r5TestComplete").onclick=()=>{o.remove();room5State.puzzleSkipped=true;saveGame();r5Memory()};
  }
  function r5Memory(){
    showRoomDialog([
      line("r5_memory_blank","ト書き","完成した絵を見つめていると、目の前の紙が白紙になった。"),
      line("r5_memory_fridge","ト書き","冷蔵庫の低い音が聞こえる。"),
      line("r5_memory_dishes","ト書き","食器の触れ合う音が重なる。"),
      line("r5_final_humming","ト書き","その向こうから、楽しそうな鼻歌が聞こえてくる。"),
      pending("第5回想本編の具体的な会話・ト書き。引っ越し直後のダイニングを描くことまでは確定。"),
      line("r5_after_rabbit","ト書き","回想が途切れる。気づくと、手元には同じうさぎの絵が残っていた。"),
      line("r5_after_doubt","主人公","……ハナさんが描いたんですか？")
    ],()=>{
      room5State.memorySeen=true;room5State.completed=true;saveGame();renderR5();
      showRoomNotice("扉の鍵が開いた。","r5_unlocked","narration");
    });
  }

  // ---------- Room 6 ----------
  window.room6State=window.room6State;
  const R6_ROUTE=["D1","H4","D2","G5","G6","G3","C8","C2","H2"];
  function normalizeR6(saved){
    const s=saved&&typeof saved==="object"?saved:{};
    return {
      visited:Array.isArray(s.visited)?[...new Set(s.visited)]:["A8"],current:typeof s.current==="string"?s.current:"A8",
      greenSeen:!!s.greenSeen,interview4:!!s.interview4,mapEvent:!!s.mapEvent,
      othelloKnown:!!s.othelloKnown,moves:Array.isArray(s.moves)?[...s.moves]:[],
      memorySeen:!!s.memorySeen,completed:!!s.completed,introSeen:!!s.introSeen
    };
  }
  window.showSixthRoom=function(savedState){
    Dialogue.stop();currentScene="room06";room6State=normalizeR6(savedState);renderR6();saveGame();
    setHud("room06","第六の部屋",()=>room6State.completed?"第七の部屋へ進む":room6State.othelloKnown?"9手で最後の黒を消す":"部屋を探索し、構造と床の色を確かめる",()=>showRoomNotice("ハナは少し離れたところから探索を見守っている。","r6_hana_watch"));
    if(!room6State.introSeen){
      room6State.introSeen=true;saveGame();
      showRoomDialog([
        line("r6_intro_01","ト書き","白い床の小部屋。いくつもの扉が、隣の部屋へ続いている。"),
        line("r6_intro_02","問題文","最後の影が消える時、閉ざされた道は開かれる。"),
        line("r6_intro_03","ト書き","開始地点はA8。今いる床は白い。")
      ]);
    }
  };
  function renderR6(){
    let cells="";
    for(let r=1;r<=8;r++)for(let c=0;c<8;c++){
      const id=String.fromCharCode(65+c)+r;
      const known=id==="A8"?"white":id==="B8"?"black":room6State.visited.includes(id)?"visited":"unknown";
      const current=id===room6State.current?" current":"";
      cells+='<button class="r6-cell '+known+current+'" data-cell="'+id+'"><span>'+id+'</span></button>';
    }
    game.innerHTML='<main class="room late-room"><header class="room-header"><p class="room-label">第六の部屋</p><p class="room-color-status">オセロの部屋</p></header>'+
      '<section class="late-stage othello"><div class="r6-map" aria-label="探索地図">'+cells+'</div>'+
      '<div class="late-side"><p>訪問 '+room6State.visited.length+' / 64</p>'+
      '<button class="late-sub-action" id="r6Green">【未確定】緑床を確認</button>'+
      (room6State.othelloKnown?'<button class="late-main-action" id="r6Play">オセロを操作する</button>':'')+
      (room6State.completed?'<button class="late-next" id="r6Next">第七の部屋へ</button>':'')+
      '<div class="late-pending"><strong>【未確定】</strong><br>64マスの正式な初期配色と緑床座標が現行データにありません。A8＝白、B8＝黒、探索条件と9手の使用マスは確定済みです。</div></div>'+
      '</section><p class="explore-status" id="exploreStatus">マスをタップして探索してください。</p></main>';
    document.querySelectorAll(".r6-cell").forEach(b=>{b.disabled=!r6Neighbor(room6State.current,b.dataset.cell)&&b.dataset.cell!==room6State.current;b.onclick=()=>r6Visit(b.dataset.cell)});
    document.getElementById("r6Green").onclick=()=>{
      if(room6State.greenSeen){showRoomNotice("緑の床は確認済みだ。","r6_green_repeat");return}
      room6State.greenSeen=true;saveGame();
      showRoomDialog([line("r6_green_pending","システム","【未確定】緑床の正式座標は未確定。テストでは「緑の床を確認した」状態にします。"),line("r6_green_lever","ト書き","緑の床にはレバーがある。")],()=>r6CheckDiscovery());
    };
    document.getElementById("r6Play")?.addEventListener("click",r6OpenMoves);
    document.getElementById("r6Next")?.addEventListener("click",()=>transition("第七の部屋へ",()=>showSeventhRoom(roomStates.room07)));
    setHud("room06","第六の部屋",()=>room6State.completed?"第七の部屋へ進む":room6State.othelloKnown?"9手で最後の黒を消す":"部屋を探索し、構造と床の色を確かめる",()=>showRoomNotice("ハナは少し離れたところから探索を見守っている。","r6_hana_watch"));
  }
  function r6Neighbor(a,b){
    const ax=a.charCodeAt(0)-65,ay=Number(a.slice(1))-1,bx=b.charCodeAt(0)-65,by=Number(b.slice(1))-1;
    return Math.abs(ax-bx)+Math.abs(ay-by)===1;
  }
  function r6Visit(id){
    if(id===room6State.current)return;
    if(!r6Neighbor(room6State.current,id))return;
    room6State.current=id;
    const fresh=!room6State.visited.includes(id);
    if(fresh)room6State.visited.push(id);
    const lines=[];
    if(id==="A7")lines.push(line("r6_a7","主人公","……変化はないですね"),line("r6_a7_h","ハナ","うん。ここはそのままみたい"));
    if(id==="B8")lines.push(line("r6_b8","主人公","……床が黒くなった"),line("r6_b8_h","ハナ","さっきの部屋とは違うね"));
    if(!lines.length)lines.push(line("r6_visit_"+id,"ト書き",id+"の部屋を確認した。"));
    const after=()=>{
      saveGame();
      if(fresh&&room6State.visited.filter(x=>x!=="A8").length>=4&&!room6State.interview4){room6State.interview4=true;saveGame();r6Interview4();return}
      if(fresh&&room6State.visited.filter(x=>x!=="A8").length>=6&&!room6State.mapEvent){room6State.mapEvent=true;saveGame();r6MapEvent();return}
      r6CheckDiscovery();
    };
    showRoomDialog(lines,after);
  }
  function r6Interview4(){
    showRoomDialog([
      line("r6_food_01","主人公","そういえば、ハナさん"),
      line("r6_food_02","ハナ","ん？"),
      line("r6_food_03","主人公","ハナさんが好きなのって、アジの南蛮漬けでしたっけ"),
      line("r6_food_04","ハナ","レンコンだよ"),
      line("r6_food_05","主人公","……"),
      line("r6_food_06","ハナ","……あ"),
      line("r6_food_07","ト書き","一瞬、沈黙する。"),
      line("r6_food_08","主人公","……レンコンでしたか"),
      line("r6_food_09","ハナ","…………うん"),
      line("r6_food_10","ト書き","主人公はそれ以上何も聞かず、再び部屋を調べ始める。")
    ],r6CheckDiscovery);
  }
  function r6MapEvent(){
    showRoomDialog([
      line("r6_map_01","ハナ","……そろそろ、これがあった方がいいかも"),
      line("r6_map_02","主人公","これ？"),
      line("r6_map_03","ト書き","ハナは一枚の地図を差し出す。"),
      line("r6_map_04","主人公","……地図？"),
      line("r6_map_05","ハナ","うん。今まで通った部屋、記録しといたよ"),
      line("r6_map_06","ト書き","これまで通った部屋が、扉のつながりと一緒に描かれている。"),
      line("r6_map_07","主人公","……ちゃんと繋がってる"),
      line("r6_map_08","ハナ","どの部屋から、どこに行けたか分からなくなりそうだったから"),
      line("r6_map_09","主人公","床の色まで書いてあるんですね"),
      line("r6_map_10","ハナ","うん。気づいたことは一緒に書いといた"),
      line("r6_map_11","主人公","……なるほど"),
      line("r6_map_12","主人公","……ハナさん"),
      line("r6_map_13","ハナ","ん？"),
      line("r6_map_14","主人公","この謎、ハナさんが作ったんですか"),
      line("r6_map_15","ハナ","…………"),
      line("r6_map_16","ハナ","……その地図は、わたしが作ったよ"),
      line("r6_map_17","主人公","地図は？"),
      line("r6_map_18","ハナ","うん"),
      line("r6_map_19","主人公","……"),
      line("r6_map_20","ハナ","地図を使って、探索を進めよう"),
      line("r6_map_21","主人公","……そうですね")
    ],r6CheckDiscovery);
  }
  function r6CheckDiscovery(){
    const extremes=["A1","H1","H8"].every(x=>room6State.visited.includes(x));
    const colors=room6State.visited.includes("A8")&&room6State.visited.includes("B8")&&room6State.greenSeen;
    if(extremes&&colors&&!room6State.othelloKnown){
      room6State.othelloKnown=true;saveGame();
      showRoomDialog([
        line("r6_discover_01","主人公","……8×8"),
        line("r6_discover_02","主人公","白と黒……それに緑の床"),
        line("r6_discover_03","主人公","……これ、オセロか？")
      ],renderR6);return;
    }
    renderR6();
  }
  function r6OpenMoves(){
    const o=document.createElement("div");o.className="device-overlay late-overlay";
    o.innerHTML='<section class="late-panel"><button class="device-close" aria-label="閉じる">×</button><h2>オセロ操作・テスト版</h2>'+
      '<div class="late-pending"><strong>【未確定】</strong><br>正式な初期64マス配色が未保存のため、現時点では資料に残る9手の一例を入力して後半演出を確認します。正式版ではオセロルールで盤面状態を判定します。</div>'+
      '<p id="r6Turn"></p><div class="r6-moves">'+R6_ROUTE.map(x=>'<button data-move="'+x+'">'+x+'</button>').join("")+'</div>'+
      '<p id="r6MoveHistory"></p><div class="late-row"><button id="r6Undo">UNDO</button><button id="r6Reset">RESET</button></div></section>';
    game.appendChild(o);activateDeviceModal(o,"r6Play",o.querySelector("[data-move]"));
    const draw=()=>{
      o.querySelector("#r6Turn").textContent="手数 "+room6State.moves.length+" / 9　次："+(room6State.moves.length%2===0?"白":"黒");
      o.querySelector("#r6MoveHistory").textContent=room6State.moves.length?"履歴："+room6State.moves.join(" → "):"履歴：なし";
      o.querySelectorAll("[data-move]").forEach(b=>b.disabled=room6State.moves.includes(b.dataset.move));
    };
    o.querySelectorAll("[data-move]").forEach(b=>b.onclick=()=>{
      room6State.moves.push(b.dataset.move);saveGame();
      if(room6State.moves.length===1){
        showRoomDialog([
          line("r6_first_flip_01","ト書き","白を置く。直後、間にあった黒い床が白へ変わる。"),
          line("r6_first_flip_02","主人公","……ひっくり返った"),
          line("r6_first_flip_03","主人公","オセロと同じ……"),
          line("r6_first_flip_04","主人公","『最後の影が消える時、閉ざされた道は開かれる』……"),
          line("r6_first_flip_05","主人公","……影って、黒のことか"),
          line("r6_first_flip_06","主人公","じゃあ、この黒を全部消せば……")
        ]);
      }
      if(room6State.moves.length===9){
        const ok=R6_ROUTE.every((x,i)=>room6State.moves[i]===x);
        if(ok){o.remove();r6Complete();return}
        showRoomNotice("9手目。テスト用の一例ルートとは一致しなかった。UNDOかRESETでやり直せる。","r6_route_fail");
      }
      draw();
    });
    o.querySelector("#r6Undo").onclick=()=>{room6State.moves.pop();saveGame();draw()};
    o.querySelector("#r6Reset").onclick=()=>{room6State.moves=[];saveGame();draw()};
    draw();
  }
  function r6Complete(){
    showRoomDialog([
      line("r6_complete_01","ト書き","H2に白を置く。最後に残っていた黒い床が、白へと変わる。"),
      line("r6_complete_02","主人公","……消えた"),
      line("r6_complete_03","ト書き","地図の上でも、最後の黒が白へと変わっていく。"),
      line("r6_complete_04","ト書き","その瞬間、地図の中心から淡い光が広がる。"),
      line("r6_complete_05","主人公","……っ"),
      line("r6_final_lavender","ト書き","光の中に、ほのかなラベンダーのアロマの香りが重なる。"),
      pending("第6回想の導入から『散歩』へ至る詳細な会話。"),
      line("r6_final_signal","ト書き","外へ出ると、交差点から信号の音が聞こえていた。"),
      line("r6_memory_01","主人公","……ごめん。"),
      line("r6_memory_02","彼女","それは違う。"),
      line("r6_memory_03","ト書き","彼女が主人公を見る。"),
      line("r6_memory_04","彼女","謝ってほしかったんじゃないよ。"),
      line("r6_memory_05","主人公","……ありがとう"),
      line("r6_memory_06","ト書き","彼女は少し笑って、"),
      line("r6_memory_07","彼女","うん、いいよ。"),
      line("r6_complete_06","ト書き","回想が終わる。主人公が目を開ける。"),
      line("r6_complete_07","ト書き","H2の東側の壁。そこに、先ほどまではなかった扉が現れている。"),
      line("r6_complete_08","主人公","……扉"),
      line("r6_complete_09","ハナ","開いたね")
    ],()=>{room6State.memorySeen=true;room6State.completed=true;saveGame();renderR6()});
  }

  // ---------- Room 7 ----------
  const R7_BOOKS=[
    {id:"ikkyu",title:"一休さん",animals:"虎",zodiac:"寅"},
    {id:"rabbit",title:"ウサギとカメ",animals:"うさぎ、かめ",zodiac:"卯"},
    {id:"wolf",title:"オオカミ少年",animals:"オオカミ、羊",zodiac:"未"},
    {id:"monkey",title:"さるかに合戦",animals:"猿、かに",zodiac:"申"},
    {id:"pigs",title:"三匹の子豚",animals:"豚、オオカミ",zodiac:"亥"},
    {id:"bremen",title:"ブレーメンの音楽隊",animals:"ロバ、犬、猫、鶏",zodiac:"酉"}
  ];
  const R7_ZODIAC=["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
  const R7_DOORS=["寅","卯","未","申","亥","酉"];
  function normalizeR7(saved){
    const s=saved&&typeof saved==="object"?saved:{};
    return {order:Array.isArray(s.order)?[...s.order]:[],booksSolved:!!s.booksSolved,doorIndex:Number.isInteger(s.doorIndex)?s.doorIndex:0,completed:!!s.completed,introSeen:!!s.introSeen};
  }
  window.showSeventhRoom=function(savedState){
    Dialogue.stop();currentScene="room07";room7State=normalizeR7(savedState);renderR7();saveGame();
    setHud("room07","第七の部屋",()=>room7State.completed?"第八の部屋へ":room7State.booksSolved?"正しい十二支の扉を順に選ぶ":"6冊を五十音順に並べる",()=>showRoomNotice("ハナは十二の扉を見回している。","r7_hana_watch"));
    if(!room7State.introSeen){
      room7State.introSeen=true;saveGame();
      showRoomDialog([
        line("r7_intro_01","ト書き","十二角形の部屋。十二の壁それぞれに、干支を示す扉がある。"),
        line("r7_intro_02","問題文","物語が導くのは、あなたの進む軌跡。"),
        line("r7_final_pressed_flower","ト書き","中央の机には六冊の絵本がバラバラに置かれ、どの本にも押し花の栞が挟まっている。")
      ]);
    }
  };
  function renderR7(){
    const bookButtons=R7_BOOKS.map(b=>'<button class="r7-book" data-book="'+b.id+'" '+(room7State.order.includes(b.id)?"disabled":"")+'><strong>'+b.title+'</strong><small>栞のページ：'+b.animals+'</small></button>').join("");
    game.innerHTML='<main class="room late-room"><header class="room-header"><p class="room-label">第七の部屋</p><p class="room-color-status">十二支の部屋</p></header>'+
      '<section class="late-stage zodiac"><div class="r7-books"><h3>机の上の6冊</h3>'+bookButtons+
      '<p class="r7-order">並び：<span id="r7OrderText"></span></p><button class="late-sub-action" id="r7OrderReset">並べ直す</button></div>'+
      '<div class="r7-doors '+(room7State.booksSolved?"active":"")+'"><h3>十二の扉</h3>'+R7_ZODIAC.map(z=>'<button data-zodiac="'+z+'" '+(!room7State.booksSolved?"disabled":"")+'>'+z+'</button>').join("")+'<p>正解進行 '+room7State.doorIndex+' / 6</p></div>'+
      (room7State.completed?'<button class="late-next" id="r7Next">第八の部屋へ</button>':'')+
      '</section><p class="explore-status" id="exploreStatus">絵本の栞ページに登場する動物を確認してください。</p></main>';
    document.querySelectorAll("[data-book]").forEach(b=>b.onclick=()=>r7AddBook(b.dataset.book));
    document.getElementById("r7OrderReset").onclick=()=>{room7State.order=[];room7State.booksSolved=false;room7State.doorIndex=0;saveGame();renderR7()};
    document.querySelectorAll("[data-zodiac]").forEach(b=>b.onclick=()=>r7Door(b.dataset.zodiac));
    document.getElementById("r7Next")?.addEventListener("click",()=>transition("第八の部屋へ",()=>showEighthRoom(roomStates.room08)));
    document.getElementById("r7OrderText").textContent=room7State.order.map(id=>R7_BOOKS.find(b=>b.id===id)?.title).join(" → ")||"未選択";
    setHud("room07","第七の部屋",()=>room7State.completed?"第八の部屋へ":room7State.booksSolved?"正しい十二支の扉を順に選ぶ":"6冊を五十音順に並べる",()=>showRoomNotice("ハナは十二の扉を見回している。","r7_hana_watch"));
  }
  function r7AddBook(id){
    room7State.order.push(id);saveGame();
    if(id==="bremen")recordLog(line("r7_final_bremen","ト書き","『ブレーメンの音楽隊』。栞のページにはロバ、犬、猫、鶏が登場している。"));
    if(room7State.order.length===6){
      const correct=R7_BOOKS.every((b,i)=>room7State.order[i]===b.id);
      if(correct){
        room7State.booksSolved=true;saveGame();
        showRoomDialog([
          line("r7_books_ok_01","ト書き","六冊が五十音順に並んだ。"),
          line("r7_books_ok_02","主人公","十二支にいる動物だけ拾うと……"),
          line("r7_books_ok_03","主人公","寅、卯、未、申、亥、酉"),
          line("r7_books_ok_04","主人公","『進む軌跡』……この順番で扉を選ぶってことか")
        ],renderR7);return;
      }
      showRoomNotice("並びは違うようだ。","r7_books_wrong");room7State.order=[];saveGame();
    }
    renderR7();
  }
  function r7Door(z){
    if(z!==R7_DOORS[room7State.doorIndex])return; // wrong doors deliberately do not react.
    const isLast=room7State.doorIndex===R7_DOORS.length-1;
    room7State.doorIndex++;saveGame();
    if(!isLast){
      showRoomDialog([
        line("r7_door_"+z+"_01","ト書き",z+"の扉が開く。"),
        line("r7_door_"+z+"_02","ト書き","主人公は扉の外から中を覗き込む。少しすると、扉は閉じた。"),
        pending(z+"の扉の先に見える具体的な短い記憶・情景。")
      ],renderR7);return;
    }
    showRoomDialog([
      line("r7_last_01","ト書き","酉の扉が開く。"),
      line("r7_last_02","主人公","……"),
      line("r7_last_03","ト書き","いつものように中を覗こうとした、その瞬間。"),
      line("r7_last_04","主人公","え――"),
      line("r7_last_05","ト書き","身体が扉の向こうへ引かれる。"),
      line("r7_last_06","ハナ","……！"),
      line("r7_last_07","ト書き","視界が大きく揺れ、そのまま主人公は部屋の中へ吸い込まれていく。")
    ],r7Memory);
  }
  function r7Memory(){
    showRoomDialog([
      line("r7_mem_01","ト書き","リアル脱出ゲームに参加した帰り道。"),
      line("r7_mem_02","主人公","今日の最後の謎、面白かったな"),
      line("r7_mem_03","彼女","どれ？"),
      line("r7_mem_04","主人公","最初は関係なさそうだったヒントが、最後に全部つながるやつ"),
      line("r7_mem_05","彼女","ああ、あれね"),
      line("r7_mem_06","主人公","気づいた瞬間、ちょっと鳥肌立った"),
      line("r7_mem_07","彼女","分かる。でも、私ならもう少し前から仕込むかな"),
      line("r7_mem_08","主人公","仕込む？"),
      line("r7_mem_09","彼女","うん。最後に急に答えが出るんじゃなくて、最初から見えてたものが、最後になって意味を変える感じ"),
      line("r7_mem_10","主人公","……作る側の感想なんだ"),
      line("r7_mem_11","彼女","だって、作る方も面白そうじゃない？"),
      line("r7_mem_12","主人公","解く方が楽しいけどな"),
      line("r7_mem_13","彼女","私は両方やりたい"),
      line("r7_mem_14","ト書き","二人は帰り道、ドーナツを食べながら歩く。"),
      line("r7_mem_15","彼女","次の休み、どうする？"),
      line("r7_mem_16","主人公","水族館とか？"),
      line("r7_mem_17","彼女","いいね。久しぶりに行きたい"),
      line("r7_mem_18","主人公","そのあと寿司食べたいな"),
      line("r7_mem_19","彼女","水族館のあとに？"),
      line("r7_mem_20","主人公","魚見てると食べたくなる"),
      line("r7_mem_21","彼女","なんかかわいそう"),
      line("r7_mem_22","主人公","食べないの？"),
      line("r7_mem_23","彼女","食べるけど"),
      line("r7_mem_24","主人公","食べるんじゃん"),
      line("r7_mem_25","彼女","それとこれは別"),
      line("r7_mem_26","ト書き","彼女は少し先を歩いている。ふいに振り返った。"),
      line("r7_mem_27","彼女","ねえ、次の休みさ――"),
      line("r7_mem_28","ト書き","その瞬間。主人公の視線が、彼女のさらに後ろへ向く。トラックが近づいてくる。速度が落ちない。"),
      line("r7_mem_29","主人公","……え"),
      line("r7_mem_30","彼女","？"),
      line("r7_mem_31","主人公","■■！"),
      line("r7_mem_32","ト書き","主人公は彼女の名前を叫び、走り出す。"),
      line("r7_mem_33","彼女","え――"),
      line("r7_mem_34","ト書き","主人公は必死に手を伸ばす。彼女を庇うように、その身体を押し出そうとする。"),
      line("r7_mem_35","ト書き","次の瞬間。視界が、赤く染まる。"),
      line("r7_mem_36","ト書き","音が遠のく。彼女の姿も、街の景色も、すべて赤の向こうに滲んでいく。"),
      line("r7_mem_37","ト書き","――そこで、記憶が途切れる。")
    ],()=>{room7State.completed=true;saveGame();renderR7()});
  }

  // ---------- Room 8 ----------
  const R8_CLUES=[
    ["第1","世界に一つだけの花","ピアノ"],
    ["第2","トランペット","花丸"],
    ["第3","着信音","桜並木"],
    ["第4","12星座の花","アナウンス音"],
    ["第5","鼻歌","花"],
    ["第6","ラベンダーのアロマ","信号の音"],
    ["第7","ブレーメンの音楽隊","押し花の栞"]
  ];
  function normalizeR8(saved){
    const s=saved&&typeof saved==="object"?saved:{};
    return {introSeen:!!s.introSeen,puzzleReady:!!s.puzzleReady,backSeen:!!s.backSeen,solved:!!s.solved,finalTalkSeen:!!s.finalTalkSeen,ended:!!s.ended};
  }
  window.showEighthRoom=function(savedState){
    Dialogue.stop();currentScene="room08";room8State=normalizeR8(savedState);saveGame();
    if(room8State.ended){r8EndScreen();return}
    if(room8State.solved&&room8State.finalTalkSeen){r8AfterSolved();return}
    if(room8State.solved&&!room8State.finalTalkSeen){r8PuzzleRoom();setTimeout(r8SolvedDialogue,80);return}
    if(room8State.puzzleReady){r8PuzzleRoom();return}
    r8Living();
    setHud("room08","第八の部屋",()=>"花音との最後の時間",()=>{});
    if(!room8State.introSeen){room8State.introSeen=true;saveGame();setTimeout(r8Intro,80)}
  };
  function r8Living(){
    game.innerHTML='<main class="room late-room r8-living"><header class="room-header"><p class="room-label">第八の部屋</p><p class="room-color-status">リビング</p></header><section class="late-stage living final-living"><div class="r8-table"><span>ダイニングテーブル</span><span>ハナが椅子に座っている</span></div></section></main>';
  }
  function r8Intro(){
    showRoomDialog([
      line("r8_001","主人公","……ここ……"),
      line("r8_002","ト書き","ハナは主人公を見る。少しだけ笑って、向かいの椅子を指す。"),
      line("r8_003","ハナ","ねえ、座って？"),
      line("r8_004","ト書き","主人公はしばらくハナを見つめ、それからゆっくりと椅子に腰を下ろす。"),
      line("r8_005","ハナ","ねえ"),
      line("r8_006","主人公","……はい"),
      line("r8_007","ハナ","ここまでの謎解き、どうだった？"),
      line("r8_008","主人公","難しかった、かな。全部忘れてたから"),
      line("r8_009","主人公","でも、思い出したよ"),
      line("r8_010","主人公","……あの謎は全部、君が作った謎だった"),
      line("r8_011","ト書き","ハナは微笑んだ。"),
      line("r8_012","ハナ","うん、そうだよ"),
      line("r8_013","ハナ","私が作った謎"),
      line("r8_014","ハナ","楽しかったでしょ？"),
      line("r8_015","主人公","……"),
      line("r8_016","ハナ","私は楽しかったよ？"),
      line("r8_017","ハナ","やっぱり、君が謎を解けた時の顔、好きだなあ"),
      pending("ここで花音が『二人で謎を解いた思い出』を話す具体的な会話全文。"),
      line("r8_018","主人公","……ねえ"),
      line("r8_019","ハナ","ん？"),
      line("r8_020","主人公","聞きたいことがある"),
      line("r8_021","主人公","……あの日のこと"),
      line("r8_022","主人公","事故のこと、ちゃんと話してほしい"),
      line("r8_023","ハナ","……そうだね"),
      line("r8_024","ハナ","ちゃんと話さないとね"),
      line("r8_025","ハナ","……あの日からね"),
      line("r8_026","ハナ","もう、君と一緒に過ごすことはできないの"),
      line("r8_027","ハナ","一緒に散歩に行くことも"),
      line("r8_028","ハナ","くだらないことで喧嘩して、また仲直りすることも"),
      line("r8_029","ハナ","一緒に謎を解くことも"),
      line("r8_030","ト書き","ハナは少し笑おうとする。でも、うまく笑えない。"),
      line("r8_031","ハナ","……君が謎を解けた時の顔を、見ることもできない"),
      line("r8_032","ト書き","主人公は彼女の名前を呼ぼうとする。けれど、出てこない。"),
      line("r8_033","主人公","……っ"),
      line("r8_034","ト書き","喉まで出かかっているのに。確かに知っているはずなのに。どうしても、その名前だけが思い出せない。"),
      line("r8_035","ト書き","その時。主人公は、ふと違和感に気づく。さっきまでそこにあったはずの家具が、一つなくなっている。"),
      line("r8_036","主人公","……あれ"),
      line("r8_037","ト書き","テレビがない。棚もない。いつの間にか、部屋の中のものが少しずつ減っている。"),
      line("r8_038","主人公","……部屋が……"),
      line("r8_039","ト書き","さらにもう一つ。音もなく、家具が消える。"),
      line("r8_040","主人公","……これ、どういうこと？"),
      line("r8_041","ト書き","彼女は消えていく部屋を見回す。少しだけ寂しそうに笑う。"),
      line("r8_042","ハナ","……もう、時間がないみたい"),
      line("r8_043","ハナ","だから、最後のお願い！"),
      line("r8_044","主人公","……"),
      line("r8_045","ハナ","最後の謎を解いて"),
      line("r8_046","ト書き","その言葉を言い終えた瞬間。部屋の景色が、一気に消えていく。"),
      line("r8_047","ト書き","テレビも。棚も。椅子も。最後に残ったのは、一つの机だけ。"),
      line("r8_048","主人公","……！"),
      line("r8_049","ト書き","そこに、もう彼女の姿はなかった。机の上には、一枚の紙が置かれている。")
    ],()=>{room8State.puzzleReady=true;saveGame();r8PuzzleRoom()});
  }
  function r8PuzzleRoom(){
    game.innerHTML='<main class="room late-room r8-empty"><header class="room-header"><p class="room-label">第八の部屋</p><p class="room-color-status">何もない部屋</p></header><section class="late-stage empty"><button class="r8-paper" id="r8Paper">一枚の紙</button></section><p class="explore-status" id="exploreStatus">机の上の紙を調べる。</p></main>';
    document.getElementById("r8Paper").onclick=r8Paper;
    setHud("room08","最後の謎",()=>"彼女の名前を思い出す",()=>{},r8IsFinalClue);
    if(room8State.backSeen)r8ArmLogHint();
  }
  function r8Paper(){
    const o=document.createElement("div");o.className="device-overlay late-overlay";
    o.innerHTML='<section class="late-panel r8-puzzle"><button class="device-close" aria-label="閉じる">×</button><h2>最後の謎</h2>'+
      '<div class="r8-paper-face"><p class="r8-question">私はだーれだ？</p><p>ヒント！<br>君のことが一番好きな人だよ</p></div>'+
      '<button class="late-sub-action" id="r8Back">紙の裏を見る</button>'+
      '<div id="r8BackText" class="r8-back '+(room8State.backSeen?"show":"")+'"><strong>【未確定：紙の裏の完成文面】</strong><p>ここまでの思い出を、もう一度振り返ってみて。</p><p>どの思い出にも、同じ二つが隠れているよ。</p><p>順番に迷ったら、一番最初の思い出を思い出して。</p></div>'+
      '<label class="r8-answer">答え<input id="r8Answer" type="text" autocomplete="off" maxlength="12"></label><button class="late-main-action" id="r8Submit">答える</button><p id="r8Feedback"></p></section>';
    game.appendChild(o);activateDeviceModal(o,"r8Paper",o.querySelector("#r8Back"));
    o.querySelector("#r8Back").onclick=()=>{room8State.backSeen=true;saveGame();o.querySelector("#r8BackText").classList.add("show");r8ArmLogHint()};
    o.querySelector("#r8Submit").onclick=()=>{
      const value=o.querySelector("#r8Answer").value.trim();
      if(!["花音","かのん","カノン"].includes(value)){o.querySelector("#r8Feedback").textContent="……違う気がする。";return}
      o.remove();room8State.solved=true;saveGame();r8SolvedDialogue();
    };
  }
  const R8_FINAL_LOG_IDS=[
    "room1_poster_03","room1_piano","room2_final_hanamaru","room2_memory_003",
    "room3_final_ringtone","room3_flashback_34","r4f01","r4_final_zodiac_flowers",
    "r5_final_humming","r5_final_flower","r6_final_signal","r6_final_lavender",
    "r7_final_bremen","r7_final_pressed_flower"
  ];
  function r8IsFinalClue(entry){
    const id=entry?.id||"";
    return R8_FINAL_LOG_IDS.some(prefix=>id.startsWith(prefix));
  }
  function r8ArmLogHint(){
    const btn=document.getElementById("gameplayLogButton");
    if(!btn)return;
    btn.classList.add("late-log-pulse");
    btn.title="過去のLOGに変化がある";
  }
  function r8SolvedDialogue(){
    showRoomDialog([
      line("r8_solve_01","主人公","……花音"),
      line("r8_solve_02","ト書き","少しの沈黙。そして――"),
      line("r8_solve_03","花音","正解！",{logKind:"heroine"}),
      line("r8_solve_04","花音","ちゃんと解けたね？",{logKind:"heroine"}),
      line("r8_solve_05","主人公","花音……"),
      line("r8_solve_06","主人公","花音……俺――"),
      line("r8_solve_07","花音","そんなに呼ばなくても、聞こえてるよ",{logKind:"heroine"}),
      line("r8_solve_08","主人公","……思い出した"),
      line("r8_solve_09","主人公","全部、思い出したよ"),
      line("r8_solve_10","主人公","花音と出会ったことも、一緒に過ごしたことも"),
      line("r8_solve_11","主人公","喧嘩したことも、仲直りしたことも"),
      line("r8_solve_12","主人公","一緒に謎を解いたことも……全部"),
      line("r8_solve_13","主人公","……ずっと、ありがとう"),
      line("r8_solve_14","主人公","俺、花音と一緒にいられてよかった"),
      line("r8_solve_15","主人公","本当に……大好きだった"),
      line("r8_solve_16","花音","……うん",{logKind:"heroine"}),
      line("r8_solve_17","花音","私もだよ",{logKind:"heroine"}),
      line("r8_solve_18","花音","君と一緒にいられて、すっごく楽しかった",{logKind:"heroine"}),
      line("r8_solve_19","花音","何でもない日も、喧嘩した日も、謎を解いてた時も",{logKind:"heroine"}),
      line("r8_solve_20","花音","全部、大事な思い出",{logKind:"heroine"}),
      line("r8_solve_21","花音","……君のこと、大好きだよ",{logKind:"heroine"}),
      line("r8_solve_22","ト書き","花音は今にも泣き出しそうな顔で、それでも必死に笑顔を作る。"),
      line("r8_solve_23","花音","じゃあ！",{logKind:"heroine"}),
      line("r8_solve_24","花音","最後の謎も解けたし、出口に行かないとね！",{logKind:"heroine"}),
      line("r8_solve_25","花音","脱出成功、おめでとう！",{logKind:"heroine"}),
      line("r8_solve_26","主人公","……行けない"),
      line("r8_solve_27","花音","え？",{logKind:"heroine"}),
      line("r8_solve_28","主人公","花音を置いて、俺一人でなんて行けない"),
      line("r8_solve_29","主人公","やっと思い出したのに"),
      line("r8_solve_30","主人公","やっと、また名前を呼べたのに……"),
      line("r8_solve_31","ト書き","主人公は花音の手を強く握る。"),
      line("r8_solve_32","花音","……一緒には行けないよ",{logKind:"heroine"}),
      line("r8_solve_33","主人公","……"),
      line("r8_solve_34","花音","でも、ずっと一緒にいるよ",{logKind:"heroine"}),
      line("r8_solve_35","花音","……君がそんな顔してたら、私も安心できないよ",{logKind:"heroine"}),
      line("r8_solve_36","花音","笑ってよ",{logKind:"heroine"}),
      line("r8_solve_37","主人公","……花音だって、泣いてるじゃん"),
      line("r8_solve_38","花音","……ほんとだ",{logKind:"heroine"}),
      line("r8_solve_39","ト書き","二人の頬を、涙が静かに伝っていく。"),
      line("r8_solve_40","主人公","……俺、行くよ"),
      line("r8_solve_41","花音","……うん",{logKind:"heroine"}),
      line("r8_solve_42","主人公","でも、これで終わりにはしない"),
      line("r8_solve_43","主人公","最後の謎が解けても、俺たちの謎解きはこれからも続けよう"),
      line("r8_solve_44","主人公","花音が作った謎を、今度は俺がみんなに届ける"),
      line("r8_solve_45","主人公","だから、これが最後じゃない"),
      line("r8_solve_46","主人公","これからも一緒に、謎解きを続けよう"),
      line("r8_solve_47","花音","……うん",{logKind:"heroine"}),
      line("r8_solve_48","花音","楽しみだね",{logKind:"heroine"})
    ],()=>{room8State.finalTalkSeen=true;saveGame();r8AfterSolved()});
  }
  function r8AfterSolved(){
    game.innerHTML='<main class="room late-room r8-exit"><header class="room-header"><p class="room-label">第八の部屋</p><p class="room-color-status">出口</p></header><section class="late-stage empty"><button class="r8-final-door" id="r8FinalDoor">最後の扉を開く</button></section></main>';
    document.getElementById("r8FinalDoor").onclick=()=>{
      showRoomDialog([
        line("r8_end_01","ト書き","主人公は最後の扉を開いた。"),
        line("r8_end_02","ト書き","扉の向こうへ進み、振り返る。花音の姿は光に包まれていく。"),
        line("r8_end_03","花音","じゃあね、"+(playerName||"主人公"),{logKind:"heroine"}),
        line("r8_end_04","主人公","……花音"),
        line("r8_end_05","ト書き","花音の姿は、光の中へ消えていった。")
      ],()=>{room8State.ended=true;saveGame();r8EndScreen()});
    };
    setHud("room08","第八の部屋",()=>"最後の扉を開く",()=>{});
  }
  function r8EndScreen(){
    Dialogue.stop();
    game.innerHTML='<div class="late-ending"><p>最後の謎が解けるまで</p><h1>END</h1><p>脱出成功</p><button id="r8Title">タイトルへ</button></div>';
    document.getElementById("r8Title").onclick=()=>showTitle();
  }
})();