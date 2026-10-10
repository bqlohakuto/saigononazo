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
    ["mirror","鏡","面","姿見"],["fish","魚","尾","冷蔵庫"],["butterfly","蝶","頭","窓際"],
    ["flower","花","輪","花瓶"],["squid","イカ","杯","冷蔵庫"],["chair","椅子","脚","ダイニング"],
    ["cannon","大砲","門","テレビ台"]
  ];
  const R5_COUNTERS=[
    ["feather","羽","うさぎ"],["face","面","鏡"],["tail","尾","魚"],["head","頭","蝶"],
    ["ring","輪","花"],["cup","杯","イカ"],["leg","脚","椅子"],["gate","門","大砲"]
  ];
  const R5_TARGET={mirror:"面",fish:"尾",butterfly:"頭",flower:"輪",squid:"杯",chair:"脚",cannon:"門"};

  function normalizeR5(saved){
    const s=saved&&typeof saved==="object"?saved:{};
    const legacySkipped=(!!s.puzzleSkipped||"mirrorPlaced" in s||"mirrorCollected" in s)&&!s.codeRevealed&&!s.doorUnlocked;
    return {
      collected:Array.isArray(s.collected)?[...new Set(s.collected.filter(id=>R5_ITEMS.some(x=>x[0]===id)))]:[],
      placed:s.placed&&typeof s.placed==="object"&&!Array.isArray(s.placed)?{...s.placed}:{},
      boardIntroSeen:!!s.boardIntroSeen,
      butterflyHintSeen:!!s.butterflyHintSeen,
      codeRevealed:legacySkipped?false:!!s.codeRevealed,
      doorUnlocked:legacySkipped?false:!!s.doorUnlocked,
      memorySeen:legacySkipped?false:!!s.memorySeen,
      completed:legacySkipped?false:!!s.completed,
      introSeen:!!s.introSeen
    };
  }

  function r5PlacedCount(){return Object.keys(room5State.placed||{}).length}
  function r5Objective(){
    if(room5State.completed)return "第六の部屋へ進む";
    if(room5State.doorUnlocked)return "中央パネルの羽の生えたウサギを調べる";
    if(room5State.codeRevealed)return "扉のテンキーに4桁の数字を入力する";
    if(room5State.collected.length===7)return "7枚のパネルを正しい数え方へ配置する";
    return "部屋から7つのパネルを集める";
  }

  showFifthRoom=function(savedState){
    Dialogue.stop();currentScene="room05";room5State=normalizeR5(savedState);
    renderR5();saveGame();
    if(!room5State.introSeen){
      room5State.introSeen=true;saveGame();
      showRoomDialog([
        pending("第5入室時の最終セリフ・ト書きは未確定。現在は確定している部屋構成からプレイを開始します。"),
        line("r5_intro_room","ト書き","同棲を始めた二人のアパートを模した、まだ少し殺風景なリビング。中央のダイニングテーブルには、大きなパネルが置かれている。")
      ]);
    }
  };

  function renderR5(){
    const keypadButton=room5State.codeRevealed&&!room5State.doorUnlocked?'<button class="late-main-action r5-door-keypad" id="r5Keypad">扉の4桁テンキー</button>':'';
    const rabbitButton=room5State.doorUnlocked&&!room5State.memorySeen?'<button class="late-main-action r5-rabbit-memory" id="r5Rabbit">羽の生えたウサギを調べる</button>':'';
    game.innerHTML='<main class="room late-room r5-full"><header class="room-header"><p class="room-label">第五の部屋</p><p class="room-color-status">同棲を始めたアパートのリビング</p></header>'+
      '<section class="late-stage living"><div class="late-room-note"><strong>探索</strong><span id="r5Progress"></span></div>'+
      '<div class="late-object-grid" id="r5Objects"></div>'+
      '<div class="r5-actions"><button class="late-main-action" id="r5Board">中央パネル</button>'+keypadButton+rabbitButton+'</div>'+
      (room5State.completed?'<button class="late-next" id="r5Next">第六の部屋へ</button>':'')+
      '</section><p class="explore-status" id="exploreStatus">気になるものを調べてください。</p></main>';
    const box=document.getElementById("r5Objects");
    box.innerHTML=R5_ITEMS.map(([id,name,,where])=>'<button class="late-object '+(room5State.collected.includes(id)?"done":"")+'" data-item="'+id+'" '+(room5State.collected.includes(id)?"disabled":"")+'><small>'+where+'</small><strong>'+name+'</strong>'+(room5State.collected.includes(id)?" ✓":"")+'</button>').join("");
    box.querySelectorAll("[data-item]").forEach(b=>b.onclick=()=>r5Collect(b.dataset.item));
    document.getElementById("r5Board").onclick=r5Board;
    document.getElementById("r5Keypad")?.addEventListener("click",r5Keypad);
    document.getElementById("r5Rabbit")?.addEventListener("click",r5RabbitMemoryStart);
    document.getElementById("r5Next")?.addEventListener("click",()=>transition("第六の部屋へ",()=>showSixthRoom(roomStates.room06)));
    const placed=r5PlacedCount();
    document.getElementById("r5Progress").textContent=room5State.completed?"記憶を取り戻した":room5State.doorUnlocked?"扉解錠済み":room5State.codeRevealed?"暗証番号 8194":room5State.collected.length<7?"パネル "+room5State.collected.length+" / 7":"配置 "+placed+" / 7";
    setHud("room05","第五の部屋",r5Objective,()=>showRoomNotice("ハナは、主人公が部屋を調べる様子を静かに見ている。","r5_hana_watch"));
  }

  function r5Collect(id){
    if(room5State.collected.includes(id)){showRoomNotice("ここから回収できるものは、もうない。","r5_repeat_"+id);return}
    const item=R5_ITEMS.find(x=>x[0]===id);if(!item)return;
    const [,name]=item;
    const first=room5State.collected.length===0;
    let lines=[];
    if(id==="mirror"){
      lines=[
        line("r5_mirror_01","ト書き","部屋の隅に置かれた姿見を調べる。"),
        line("r5_mirror_02","主人公","……鏡ですね。"),
        line("r5_mirror_03","ト書き","鏡の中には、部屋の様子が映っている。中央のダイニングテーブル。窓際。少し離れた場所にいるハナさん。そして――自分。"),
        line("r5_mirror_04","主人公","……？"),
        line("r5_mirror_05","ト書き","もう一度、鏡を見る。身体は映っている。服も、手も、髪も。なのに。顔だけが、ぼんやりと白く滲んでいる。"),
        line("r5_mirror_06","主人公","顔が……映ってない。"),
        line("r5_mirror_07","ハナ","え？"),
        line("r5_mirror_08","ト書き","ハナが隣から鏡を覗き込む。ハナの姿は、普通に映っている。"),
        line("r5_mirror_09","主人公","ハナさんは映ってますね。"),
        line("r5_mirror_10","ハナ","ほんとだ。"),
        line("r5_mirror_11","主人公","……どういうことなんでしょう。"),
        line("r5_mirror_12","ト書き","鏡面へ手を伸ばす。指先が触れた瞬間――。周囲の音が消えた。鏡面に、水面のような波紋が広がる。姿見の輪郭が淡く光る。厚みが失われていき――すうっと縮んでいく。"),
        line("r5_mirror_13","ト書き","やがて、手の中に一枚のパネルだけが残った。"),
        line("r5_mirror_14","主人公","……鏡が。"),
        line("r5_mirror_15","ハナ","パネルになったね。"),
        line("r5_get_mirror","システム","【鏡のパネルを手に入れた】"),
        line("r5_mirror_16","主人公","これを、あのテーブルに使うんでしょうか。"),
        line("r5_mirror_17","ハナ","たぶんね。")
      ];
    }else if(id==="fish"){
      lines=[
        line("r5_fish_01","ト書き","冷蔵庫を開ける。飲み物や調味料、いくつかの食材が入っている。棚の奥に、魚とイカが置かれていた。"),
        line("r5_fish_02","主人公","……魚とイカ。"),
        line("r5_fish_03","ト書き","魚に触れる。輪郭が淡く光り、一枚のパネルへ変化した。"),
        line("r5_get_fish","システム","【魚のパネルを手に入れた】")
      ];
    }else if(id==="squid"){
      lines=[
        line("r5_squid_01","ト書き","冷蔵庫の中のイカに触れる。輪郭が淡く光り、一枚のパネルへ変化した。"),
        line("r5_get_squid","システム","【イカのパネルを手に入れた】")
      ];
    }else if(id==="butterfly"){
      lines=[
        line("r5_butterfly_01","ト書き","窓際を調べる。カーテンのそばに、一匹の蝶が止まっている。近づいても、逃げる様子はない。"),
        line("r5_butterfly_02","主人公","……蝶。"),
        line("r5_butterfly_03","ト書き","そっと触れる。蝶の輪郭が淡く光り、そのまま一枚のパネルへ変化した。"),
        line("r5_get_butterfly","システム","【蝶のパネルを手に入れた】")
      ];
    }else if(id==="flower"){
      lines=[
        line("r5_flower_01","ト書き","窓際の花瓶を調べる。一輪の花が生けられている。"),
        line("r5_final_flower","ト書き","花に触れる。一瞬だけ光を帯び、薄い一枚のパネルへ姿を変えた。"),
        line("r5_get_flower","システム","【花のパネルを手に入れた】"),
        line("r5_flower_02","ト書き","花瓶だけが、その場に残った。")
      ];
    }else if(id==="chair"){
      lines=[
        line("r5_chair_01","ト書き","ダイニングテーブルの椅子を調べる。"),
        line("r5_chair_02","主人公","これも……でしょうか。"),
        line("r5_chair_03","ト書き","背もたれに触れる。椅子全体の輪郭が光り、みるみる厚みを失っていく。大きかった椅子は、手の中に収まる一枚のパネルへ変わった。"),
        line("r5_get_chair","システム","【椅子のパネルを手に入れた】"),
        line("r5_chair_04","ト書き","椅子が一脚なくなり、テーブルの周りが少しだけ寂しくなった。")
      ];
    }else if(id==="cannon"){
      lines=[
        line("r5_cannon_01","ト書き","テレビ台の前を調べる。小さな大砲の模型が置かれている。"),
        line("r5_cannon_02","主人公","……大砲？"),
        line("r5_cannon_03","ト書き","リビングには少し似つかわしくない。模型に触れる。淡い光とともに、その姿が一枚のパネルへ変わった。"),
        line("r5_get_cannon","システム","【大砲のパネルを手に入れた】")
      ];
    }
    if(first&&id!=="mirror"){
      lines.unshift(line("r5_first_transform","ト書き","手で触れる。一瞬、周囲の音が消える。対象の輪郭が淡く光り、厚みが失われていく。立体だった物体が、手の中に収まる一枚のパネルへ変化する。"));
    }
    showRoomDialog(lines,()=>{
      room5State.collected.push(id);saveGame();renderR5();
      window.DesignUI?.pickup({id,name:item[1]+"のパネル",art:item[1],description:item[1]+"が描かれたパネル。"});
      if(room5State.collected.length===7)showRoomNotice("7枚すべてのパネルが集まった。中央パネルを確認しよう。","r5_all_collected","narration");
    });
  }

  function r5Board(){
    if(room5State.completed){showRoomNotice("完成したパネルが残っている。","r5_board_done");return}
    if(!room5State.boardIntroSeen&&room5State.collected.length===7){
      room5State.boardIntroSeen=true;saveGame();
      showRoomDialog([
        line("r5_board_intro_01","主人公","これで、全部集まりましたね。"),
        line("r5_board_intro_02","ト書き","手に入れた七枚のパネルを並べる。鏡。魚。蝶。花。イカ。椅子。大砲。"),
        line("r5_board_intro_03","主人公","……ウサギに羽。"),
        line("r5_board_intro_04","ト書き","改めて、完成している絵を見る。"),
        line("r5_board_intro_05","主人公","一羽……。"),
        line("r5_board_intro_06","ハナ","何か分かった？"),
        line("r5_board_intro_07","主人公","たぶん、この絵が見本なんだと思います。"),
        line("r5_board_intro_08","ト書き","七つの丸枠を見る。"),
        line("r5_board_intro_09","主人公","数え方を合わせればいいんですね。")
      ],r5Board);
      return;
    }
    const o=document.createElement("div");o.className="device-overlay late-overlay";
    const available=R5_ITEMS.filter(([id])=>room5State.collected.includes(id)&&!room5State.placed[id]);
    const slots=R5_COUNTERS.map(([slot,counter,item])=>{
      if(slot==="feather")return '<button class="r5-counter-slot fixed" disabled><span class="counter">羽</span><strong>うさぎ</strong><small>一羽</small></button>';
      const placedId=Object.keys(room5State.placed).find(id=>room5State.placed[id]===counter);
      const placedItem=placedId?R5_ITEMS.find(x=>x[0]===placedId)?.[1]:"";
      return '<button class="r5-counter-slot '+(placedId?"filled":"")+'" data-counter="'+counter+'" '+(placedId?"disabled":"")+'><span class="counter">'+counter+'</span><strong>'+(placedItem||"？")+'</strong><small>'+(placedId?"正解":"ここへ配置")+'</small></button>';
    }).join("");
    const inventory=available.length?available.map(([id,name])=>'<button class="r5-inventory-tile" data-tile="'+id+'">'+name+'</button>').join(""):'<p class="r5-empty-inventory">配置できるパネルはありません。</p>';
    o.innerHTML='<section class="late-panel r5-board-panel"><button class="device-close" aria-label="閉じる">×</button><h2>中央パネル</h2>'+
      '<p class="r5-problem">描かれたものを正しく数え、あるべき場所へ導け。</p>'+
      '<div class="r5-art-note">【未確定：助数詞側の正式な絵素材】現在は「羽・面・尾・頭・輪・杯・脚・門」を文字で仮表示しています。</div>'+
      '<div class="r5-counter-grid">'+slots+'</div>'+
      '<h3>手に入れたパネル</h3><div class="r5-inventory">'+inventory+'</div>'+
      '<p class="r5-board-feedback" id="r5BoardFeedback"></p>'+
      (room5State.codeRevealed?'<div class="r5-code-reveal"><small>完成した線が示した数字</small><strong>8194</strong></div>':'')+
      '</section>';
    game.appendChild(o);
    activateDeviceModal(o,"r5Board",o.querySelector(".r5-inventory-tile")||o.querySelector(".device-close"));
    let selected=null;
    const feedback=o.querySelector("#r5BoardFeedback");
    const tiles=[...o.querySelectorAll("[data-tile]")];
    const slotsEls=[...o.querySelectorAll("[data-counter]")];
    tiles.forEach(b=>b.onclick=()=>{
      selected=b.dataset.tile;
      tiles.forEach(x=>x.classList.toggle("selected",x===b));
      const name=R5_ITEMS.find(x=>x[0]===selected)?.[1]||selected;
      feedback.textContent=name+"のパネルを選んだ。置く場所を選ぼう。";
    });
    slotsEls.forEach(b=>b.onclick=()=>{
      if(!selected){feedback.textContent="先に、置くパネルを選ぼう。";return}
      const counter=b.dataset.counter;
      const expected=R5_TARGET[selected];
      if(counter!==expected){
        feedback.textContent="違いますね。";
        showRoomNotice("違いますね。","r5_wrong_"+selected+"_"+counter,"dialogue","主人公");
        return;
      }
      const before=r5PlacedCount();
      const placedId=selected;
      const butterflyLast=placedId==="butterfly"&&before===6;
      room5State.placed[placedId]=counter;saveGame();
      const isFirst=before===0;
      selected=null;
      if(butterflyLast){
        o.remove();
        showRoomDialog([
          line("r5_butterfly_hint_06","ト書き","蝶のパネルを置く。正解。"),
          line("r5_butterfly_hint_07","主人公","……本当に一頭なんですね。"),
          line("r5_butterfly_hint_08","ハナ","覚えたね。")
        ],r5CompleteBoard);
        return;
      }
      if(isFirst){
        o.remove();
        showRoomDialog([
          line("r5_place_first_01","ト書き","パネルが淡く光る。丸枠へ吸い込まれるように重なり、二つの絵が一つの合体絵へ切り替わる。"),
          line("r5_place_first_02","主人公","……合ってる。"),
          line("r5_place_first_03","ハナ","みたいだね。")
        ],()=>{if(r5PlacedCount()===7)r5CompleteBoard();else{renderR5();r5ButterflyHintIfNeeded()}});
        return;
      }
      if(r5PlacedCount()===7){o.remove();r5CompleteBoard();return}
      o.remove();renderR5();r5ButterflyHintIfNeeded();
    });
  }

  function r5ButterflyHintIfNeeded(){
    if(room5State.butterflyHintSeen||r5PlacedCount()!==6||room5State.placed.butterfly)return;
    const remaining=R5_ITEMS.filter(([id])=>room5State.collected.includes(id)&&!room5State.placed[id]);
    if(remaining.length!==1||remaining[0][0]!=="butterfly")return;
    room5State.butterflyHintSeen=true;saveGame();
    showRoomDialog([
      line("r5_butterfly_hint_01","主人公","……残っているのは、これだけ。"),
      line("r5_butterfly_hint_02","ト書き","蝶のパネルを見る。"),
      line("r5_butterfly_hint_03","主人公","蝶って……一頭って数えるんでしょうか。"),
      line("r5_butterfly_hint_04","ト書き","少し迷う。"),
      line("r5_butterfly_hint_05","主人公","試してみます。")
    ]);
  }

  function r5CompleteBoard(){
    room5State.codeRevealed=true;saveGame();
    showRoomDialog([
      line("r5_board_complete_01","ト書き","――カチッ。"),
      line("r5_board_complete_02","ト書き","八つの完成した絵が、一斉に淡く光る。"),
      line("r5_board_complete_03","主人公","……？"),
      line("r5_board_complete_04","ト書き","それぞれの絵に仕込まれていた細い線が浮かび上がる。線は中央へ伸びていき――"),
      line("r5_board_complete_05","システム","8194"),
      line("r5_board_complete_06","主人公","……8194。"),
      line("r5_board_complete_07","ト書き","正面の扉へ細い光の筋が走る。何もなかった扉の表面がゆっくりと変化し、四桁のテンキーが浮かび上がる。"),
      line("r5_board_complete_08","主人公","入力しろ、ということですね。"),
      line("r5_board_complete_09","ハナ","そうみたい。"),
      pending("8194を作る線・模様の正確なビジュアル配置は未確定。現在は数字を直接表示しています。")
    ],renderR5);
  }

  function r5Keypad(){
    if(!room5State.codeRevealed||room5State.doorUnlocked)return;
    const o=document.createElement("div");o.className="device-overlay late-overlay";
    o.innerHTML='<section class="late-panel r5-keypad-panel"><button class="device-close" aria-label="閉じる">×</button><h2>扉のテンキー</h2>'+
      '<div class="r5-keypad-display" id="r5KeypadDisplay">----</div><div class="r5-keypad-grid">'+
      [1,2,3,4,5,6,7,8,9].map(n=>'<button data-digit="'+n+'">'+n+'</button>').join("")+
      '<button data-key="clear">C</button><button data-digit="0">0</button><button data-key="enter">決定</button></div><p id="r5KeypadFeedback"></p></section>';
    game.appendChild(o);activateDeviceModal(o,"r5Keypad",o.querySelector('[data-digit="1"]'));
    let value="";
    const display=o.querySelector("#r5KeypadDisplay"),fb=o.querySelector("#r5KeypadFeedback");
    const draw=()=>display.textContent=(value+"----").slice(0,4);
    o.querySelectorAll("[data-digit]").forEach(b=>b.onclick=()=>{if(value.length<4){value+=b.dataset.digit;draw()}});
    o.querySelector('[data-key="clear"]').onclick=()=>{value="";fb.textContent="";draw()};
    o.querySelector('[data-key="enter"]').onclick=()=>{
      if(value!=="8194"){fb.textContent="……違う。";value="";draw();return}
      o.remove();room5State.doorUnlocked=true;saveGame();
      showRoomDialog([
        line("r5_keypad_ok_01","ト書き","――ピッ。"),
        line("r5_keypad_ok_02","ト書き","――カチッ。"),
        line("r5_keypad_ok_03","ト書き","扉のロックが外れる。")
      ],renderR5);
    };
    draw();
  }

  function r5RabbitMemoryStart(){
    if(!room5State.doorUnlocked||room5State.memorySeen)return;
    showRoomDialog([
      line("r5_rabbit_01","主人公","……。"),
      line("r5_rabbit_02","ト書き","なぜだろう。この絵を見ていると、妙に胸の奥がざわつく。"),
      line("r5_rabbit_03","主人公","この絵……。"),
      line("r5_rabbit_04","ト書き","そっと手を伸ばす。指先が触れる。その瞬間――。"),
      line("r5_memory_paper","ト書き","紙を擦るような音。目の前にあったウサギの絵が、ゆっくりと白い紙へと変わっていく。"),
      line("r5_memory_fridge","ト書き","遠くで低い機械音。――ブゥン……。冷蔵庫の音。"),
      line("r5_memory_dishes","ト書き","続いて、食器の触れ合う小さな音。"),
      line("r5_final_humming","ト書き","そして。「ふん、ふふーん♪」聞き覚えのある女性の鼻歌。"),
      line("r5_memory_light","ト書き","視界が明るくなり、同棲時代の記憶へ入っていく。")
    ],r5Memory);
  }

  const R5_MEMORY_LINES=[
    line("r5m001","ト書き","気がつくと、俺はダイニングテーブルの前に座っていた。まだ段ボールの残る部屋。壁際には、開封されたばかりの家具。床には、片付け途中の荷物がいくつも置かれている。引っ越してきて、まだそれほど経っていない頃だ。"),
    line("r5m002","ト書き","俺の目の前には、一枚の紙が置かれていた。そこには――妙に耳の長い、謎の生き物が描かれている。"),
    line("r5m003","主人公","……これ、何？"),
    line("r5m004","ト書き","向かいに座っていた彼女が、きょとんとした顔をする。"),
    line("r5m005","彼女","ウサギ。"),
    line("r5m006","主人公","…………。"),
    line("r5m007","彼女","なに、その間。"),
    line("r5m008","主人公","いや……ウサギなんだ。"),
    line("r5m009","彼女","どう見てもウサギでしょ！"),
    line("r5m010","主人公","耳が四本ない？"),
    line("r5m011","彼女","下の二本は足！"),
    line("r5m012","主人公","なるほど……。"),
    line("r5m013","彼女","その『なるほど』絶対納得してないでしょ。"),
    line("r5m014","ト書き","俺はもう一度、紙を見る。言われてみれば、ウサギに――。"),
    line("r5m015","主人公","……見えなくもない、かな。"),
    line("r5m016","彼女","ほら！"),
    line("r5m017","主人公","ギリギリね。"),
    line("r5m018","彼女","もういい！"),
    line("r5m019","ト書き","彼女は紙を取り返そうと手を伸ばす。俺は少しだけ紙を持ち上げて、それを避けた。"),
    line("r5m020","主人公","で、なんで急にウサギ？"),
    line("r5m021","彼女","問題。"),
    line("r5m022","主人公","問題？"),
    line("r5m023","彼女","そう。"),
    line("r5m024","ト書き","彼女は楽しそうに笑う。"),
    line("r5m025","彼女","私が作った初めての謎解きなの！！"),
    line("r5m026","主人公","自分で作ったの？"),
    line("r5m027","彼女","そう！ ねえ、解いてみて。"),
    line("r5m028","主人公","……謎解きか。"),
    line("r5m029","彼女","自信作なんだ～"),
    line("r5m030","主人公","……これ一枚だけ？"),
    line("r5m031","彼女","そうだよ、ちゃんと問題文読んでね！"),
    line("r5m032","主人公","解く方専門だと思ってた。"),
    line("r5m033","彼女","作る方も好きだよ！"),
    line("r5m034","ト書き","彼女はテーブルの横に置かれていたノートを取る。開かれたページには、数字、矢印、丸や四角。途中で消された文章。意味の分からない図。そして、その隅には別の謎の生き物が描かれていた。"),
    line("r5m035","主人公","……これは？"),
    line("r5m036","彼女","カニ。"),
    line("r5m037","主人公","…………。"),
    line("r5m038","彼女","その間やめて！"),
    line("r5m039","ト書き","俺は思わず笑った。"),
    line("r5m040","彼女","笑ったなー？"),
    line("r5m041","主人公","いや、だって……。"),
    line("r5m042","彼女","じゃあ自分で描いてみてよ！"),
    line("r5m043","主人公","……いいですよ"),
    line("r5m044","ト書き","俺は謎の生物の横にカニの絵を描いた。絵を描くのは好きだ。"),
    line("r5m045","彼女","ずるい。"),
    line("r5m046","ト書き","俺の描いたカニを見た彼女は、ほほを膨らませながらノートを閉じる。"),
    line("r5m047","主人公","でも、意外だな。"),
    line("r5m048","彼女","何が？"),
    line("r5m049","主人公","謎解きが好きなのは知ってたけど、作るのも好きだったんだ。"),
    line("r5m050","彼女","あー。"),
    line("r5m051","ト書き","少しだけ考えてから、彼女は言った。"),
    line("r5m052","彼女","作る方が楽しいかも。"),
    line("r5m053","主人公","そうだったの？"),
    line("r5m054","彼女","だって。"),
    line("r5m055","ト書き","彼女は、さっきまで怒っていたのが嘘みたいに笑う。"),
    line("r5m056","彼女","解いた人が『あっ！』ってなる瞬間、見られるじゃん。"),
    line("r5m057","主人公","……それが楽しいの？"),
    line("r5m058","彼女","うん。"),
    line("r5m059","彼女","自分だけ分かってて、相手が悩んでるの見るのも楽しいし。"),
    line("r5m060","主人公","性格悪いな。"),
    line("r5m061","彼女","そこは言わなくていいの。"),
    line("r5m062","主人公","でも、作るの難しくなかった？"),
    line("r5m063","彼女","難しいよ。"),
    line("r5m064","主人公","頑張ったんだ。"),
    line("r5m065","彼女","楽しいから。"),
    line("r5m066","主人公","……先輩らしいな。"),
    line("r5m067","彼女","また先輩って言った。"),
    line("r5m068","主人公","あ。"),
    line("r5m069","彼女","もう一緒に住んでるんだからさ。"),
    line("r5m070","主人公","つい、癖でさ……。"),
    line("r5m071","彼女","やっと、敬語は無くなってきたのに、いつまで先輩って呼ぶの？"),
    line("r5m072","主人公","……。"),
    line("r5m073","彼女","名前で呼んでくれてもいいのに。"),
    line("r5m074","主人公","それは……。"),
    line("r5m075","彼女","ほら、また困ってる。"),
    line("r5m076","主人公","急に言われても無理で、無理だよ。"),
    line("r5m077","彼女","別に急じゃないけど。"),
    line("r5m078","主人公","……そのうち。"),
    line("r5m079","彼女","はいはい。"),
    line("r5m080","ト書き","彼女は少し呆れたように笑う。それから、テーブルの上の紙を指で軽く叩いた。"),
    line("r5m081","彼女","じゃ、まずこれ。"),
    line("r5m082","主人公","今から？"),
    line("r5m083","彼女","当然。"),
    line("r5m084","主人公","お腹すいてない？"),
    line("r5m085","彼女","先に食べるね。"),
    line("r5m086","主人公","え。"),
    line("r5m087","彼女","冷める前に解いてね。"),
    line("r5m088","主人公","解けるまで食べれないの？？"),
    line("r5m089","彼女","頑張れ。"),
    line("r5m090","主人公","怒らせたかな……。"),
    line("r5m091","ト書き","彼女は声を上げて笑った。その笑い声を聞きながら、俺はもう一度、紙を見る。下手なウサギ。意味の分からない数字。妙に楽しそうな彼女。"),
    line("r5m092","ト書き","――こんな人だったんだ。知っているつもりだった。長い間、一緒にいた。それでも。一緒に暮らして初めて知ることが、まだこんなにあった。"),

    line("r5m100","ト書き","一緒に暮らし始めてから、分かったことがある。まず――。朝が、弱い。"),
    line("r5m101","ト書き","目覚ましの音で目を覚ます。隣を見る。彼女はいない。リビングへ向かうと、ソファで彼女が丸くなって眠っていた。"),
    line("r5m102","主人公","何してるの？"),
    line("r5m103","彼女","……起きてる。"),
    line("r5m104","主人公","寝てるじゃん。"),
    line("r5m105","彼女","起きたよ……。"),
    line("r5m106","主人公","じゃあなんでソファで寝てるの？"),
    line("r5m107","彼女","ベッドからは……起きた。"),
    line("r5m108","主人公","そういう問題？"),
    line("r5m109","彼女","あと五分……。"),
    line("r5m110","主人公","それ、ベッドで言うやつだから。"),

    line("r5m120","ト書き","料理は、意外と得意だった。ただし――。"),
    line("r5m121","主人公","今、何入れた？"),
    line("r5m122","彼女","醤油。"),
    line("r5m123","主人公","どのくらい？"),
    line("r5m124","彼女","これくらい。"),
    line("r5m125","主人公","“これくらい”って。"),
    line("r5m126","彼女","見たら分かるでしょ。"),
    line("r5m127","主人公","分からないから聞いてるんだけど。"),
    line("r5m128","ト書き","彼女は鍋を一度味見する。"),
    line("r5m129","彼女","……ちょっと薄い。"),
    line("r5m130","ト書き","さらに醤油を入れる。"),
    line("r5m131","主人公","計らないの？"),
    line("r5m132","彼女","料理なんて感覚だよ。"),
    line("r5m133","主人公","レシピは？"),
    line("r5m134","彼女","見た。"),
    line("r5m135","主人公","過去形なんだ。"),
    line("r5m136","彼女","大体覚えたから。"),
    line("r5m137","主人公","怖いな……。"),
    line("r5m138","彼女","でも美味しいでしょ？"),
    line("r5m139","主人公","……美味しい。"),
    line("r5m140","彼女","ほら。"),
    line("r5m141","ト書き","悔しいけど、美味しい。"),

    line("r5m150","ト書き","新しく買った家電が届いた日。箱を開けた彼女は、説明書を横に置いた。"),
    line("r5m151","主人公","読まないの？"),
    line("r5m152","彼女","大丈夫。"),
    line("r5m153","主人公","何が？"),
    line("r5m154","彼女","こういうのは触れば分かるから。"),
    line("r5m155","ト書き","数分後。"),
    line("r5m156","彼女","……ねえ。"),
    line("r5m157","主人公","何？"),
    line("r5m158","彼女","これ、どうやるの？"),
    line("r5m159","主人公","説明書。"),
    line("r5m160","彼女","どこ？"),
    line("r5m161","主人公","さっき自分で横に置いたでしょ。"),
    line("r5m162","彼女","あった。"),
    line("r5m163","主人公","最初から読めばいいのに。"),
    line("r5m164","彼女","説明書って長いじゃん。"),
    line("r5m165","主人公","必要だから長いんだよ。"),
    line("r5m166","彼女","じゃあ読んで。"),
    line("r5m167","主人公","俺が？"),
    line("r5m168","彼女","得意でしょ？"),
    line("r5m169","主人公","そういう問題じゃ……。"),
    line("r5m170","ト書き","気がつけば、俺が設定をしていた。彼女は隣で楽しそうに画面を覗き込んでいる。"),
    line("r5m171","主人公","自分でも覚えてよ。"),
    line("r5m172","彼女","次から覚える。"),
    line("r5m173","主人公","絶対覚えないやつ。"),
    line("r5m174","彼女","失礼だなー。"),

    line("r5m180","ト書き","予定のない休日。昼過ぎ。俺はソファで本を読んでいた。"),
    line("r5m181","彼女","ねえ。"),
    line("r5m182","主人公","ん？"),
    line("r5m183","彼女","出かけよ。"),
    line("r5m184","主人公","どこに？"),
    line("r5m185","彼女","まだ決めてない。"),
    line("r5m186","主人公","じゃあなんで出かけるの。"),
    line("r5m187","彼女","天気いいから。"),
    line("r5m188","主人公","理由それだけ？"),
    line("r5m189","彼女","十分でしょ。"),
    line("r5m190","主人公","どこ行く？"),
    line("r5m191","彼女","外に出てから考える。"),
    line("r5m192","主人公","行き当たりばったりだな。"),
    line("r5m193","彼女","楽しいよ？"),
    line("r5m194","主人公","……まあ、いいけど。"),
    line("r5m195","彼女","やった。"),
    line("r5m196","ト書き","結局その日は、近所を歩いただけだった。入ったことのない店に寄って。知らない道を通って。公園で缶ジュースを飲んだ。"),
    line("r5m197","彼女","今日楽しかったね。"),
    line("r5m198","ト書き","何をしたわけでもない。それでも彼女は満足そうだった。"),

    line("r5m200","ト書き","そして。彼女は、妙なところによく気がついた。仕事から帰った夜。"),
    line("r5m201","主人公","ただいま。"),
    line("r5m202","彼女","おかえり。"),
    line("r5m203","ト書き","いつも通りのつもりだった。靴を脱いで、鞄を置いて、部屋に入る。"),
    line("r5m204","彼女","今日さ。"),
    line("r5m205","主人公","ん？"),
    line("r5m206","彼女","ご飯食べたら散歩しよ。"),
    line("r5m207","主人公","今日？"),
    line("r5m208","彼女","うん。"),
    line("r5m209","主人公","なんで？"),
    line("r5m210","彼女","なんとなく。"),
    line("r5m211","主人公","昼も出かけたんじゃなかった？"),
    line("r5m212","彼女","いいじゃん。"),
    line("r5m213","主人公","まあ……いいけど。"),
    line("r5m214","ト書き","夕食を終えて、二人で外へ出た。彼女は何も聞かなかった。仕事で何があったのか。どうして疲れているのか。何も聞かずに、隣を歩いている。"),
    line("r5m215","主人公","……俺、そんなに分かりやすかった？"),
    line("r5m216","彼女","何が？"),
    line("r5m217","主人公","今日。"),
    line("r5m218","彼女","別に。"),
    line("r5m219","主人公","じゃあなんで散歩？"),
    line("r5m220","ト書き","彼女は少しだけ笑った。"),
    line("r5m221","彼女","毎日見てるから。"),
    line("r5m222","主人公","……それだけ？"),
    line("r5m223","彼女","それだけ。"),
    line("r5m224","ト書き","それ以上は何も言わなかった。でも、その日は少しだけ楽になっていた。"),
    line("r5m225","ト書き","一緒に暮らすまで知らなかった。朝が弱いこと。料理は全部感覚でやること。説明書を読まないこと。予定がなくても外へ出たがること。そして、俺が何も言わなくても気づくこと。"),
    line("r5m226","ト書き","知っているつもりだった。だけど――。彼女のことを知るのは、まだ途中だった。"),

    line("r5m230","ト書き","それからしばらくして。彼女の作る謎は、少しずつ凝ったものになっていった。ある日の夜。夕食を終えると、彼女が棚から大きめの台紙を取り出した。"),
    line("r5m231","主人公","また作ったの？"),
    line("r5m232","彼女","新作！"),
    line("r5m233","主人公","今日はずいぶん本格的だな。"),
    line("r5m234","彼女","今回は頑張ったよ。"),
    line("r5m235","ト書き","テーブルの上には、八枚のカード。うさぎ、鏡、魚、蝶、花、イカ、椅子、大砲。どれも彼女が描いたものらしい。"),
    line("r5m236","主人公","……このウサギ、まだ使うんだ。"),
    line("r5m237","彼女","お気に入りだから。"),
    line("r5m238","主人公","そうなんだ……。"),
    line("r5m239","彼女","その顔やめて。"),
    line("r5m240","ト書き","台紙にも、いくつかの絵が描かれている。中央には短い問題文。"),
    line("r5m241","システム","描かれたものを正しく数え、あるべき場所へ導け。"),
    line("r5m242","主人公","数え方、か。"),
    line("r5m243","彼女","それ以上はノーヒント。"),
    line("r5m244","主人公","まだ聞いてないよ。"),
    line("r5m245","彼女","聞きそうだったから。"),
    line("r5m246","ト書き","カードを一枚ずつ眺める。数え方。描かれた絵。台紙にある別の絵。しばらく考えて――。"),
    line("r5m247","主人公","……なるほど。"),
    line("r5m248","ト書き","一枚を置く。続けてもう一枚。少しずつ、置くべき場所が分かってくる。彼女は向かい側から、黙ってこちらを見ていた。"),
    line("r5m249","主人公","……その顔やめて。"),
    line("r5m250","彼女","何も言ってないよ。"),
    line("r5m251","主人公","俺が悩んでるの楽しんでるでしょ。"),
    line("r5m252","彼女","ちょっとだけ。"),
    line("r5m253","主人公","やっぱり。"),
    line("r5m254","ト書き","最後に残ったカードを見る。蝶。"),
    line("r5m255","主人公","……蝶って、こう数えるんだ。"),
    line("r5m256","彼女","私も作るまで知らなかった。"),
    line("r5m257","主人公","知らなかったんだ。"),
    line("r5m258","彼女","調べた。"),
    line("r5m259","主人公","そこまでして作ったの？"),
    line("r5m260","彼女","楽しいから。"),
    line("r5m261","ト書き","最後の一枚を置く。すると、今まで意味のなかった模様が一つにつながった。"),
    line("r5m262","主人公","……あ。"),
    line("r5m263","彼女","！"),
    line("r5m264","主人公","これ、数字になってる。"),
    line("r5m265","彼女","正解！"),
    line("r5m266","主人公","結構すごいな、これ。"),
    line("r5m267","彼女","でしょ！"),
    line("r5m268","主人公","作るの大変だったんじゃない？"),
    line("r5m269","彼女","大変だったよ。"),
    line("r5m270","主人公","何回か失敗した？"),
    line("r5m271","彼女","……いっぱい。"),
    line("r5m272","主人公","だろうね。"),
    line("r5m273","彼女","でも。"),
    line("r5m274","ト書き","彼女は嬉しそうに笑う。"),
    line("r5m275","彼女","今、『あっ』ってなったでしょ？"),
    line("r5m276","主人公","なった。"),
    line("r5m277","彼女","じゃあ成功。"),
    line("r5m278","主人公","やっぱりそれが見たいんだ。"),
    line("r5m279","彼女","うん。"),
    line("r5m280","ト書き","しばらく完成した謎を眺めたあと、彼女は部屋を見回した。"),
    line("r5m281","彼女","次はさ。"),
    line("r5m282","主人公","まだ作るの？"),
    line("r5m283","彼女","紙だけじゃなくて、もっと大きいの作りたい。"),
    line("r5m284","主人公","大きいの？"),
    line("r5m285","彼女","この部屋全部使ったり。"),
    line("r5m286","主人公","部屋全部？"),
    line("r5m287","彼女","棚にヒント隠したり、物を調べたら問題が出たり。"),
    line("r5m288","主人公","脱出ゲームみたいな？"),
    line("r5m289","彼女","そう！"),
    line("r5m290","ト書き","目を輝かせる。"),
    line("r5m291","彼女","全部自分で作れたら絶対楽しいよ。"),
    line("r5m292","主人公","で、解くのは？"),
    line("r5m293","彼女","君。"),
    line("r5m294","主人公","やっぱり。"),
    line("r5m295","彼女","一番最初に解かせてあげる。"),
    line("r5m296","主人公","実験台じゃなくて？"),
    line("r5m297","彼女","テストプレイヤー。"),
    line("r5m298","主人公","言い方変えただけじゃん。"),
    line("r5m299","ト書き","彼女は楽しそうに笑った。彼女が謎を作る。俺がそれを解く。"),
    line("r5m300","ト書き","それが僕たちの日常だった。")
  ];

  function r5Memory(){
    showRoomDialog(R5_MEMORY_LINES,()=>{
      showRoomDialog([
        line("r5_after_01","ト書き","視界が、ゆっくりと元の部屋へ戻っていく。冷蔵庫の音も。食器の音も。彼女の笑い声も。少しずつ遠ざかっていく。"),
        line("r5_after_02","ト書き","気がつくと、俺はまたダイニングテーブルの前に立っていた。"),
        line("r5_after_03","ト書き","手元を見る。そこには――記憶の中で彼女が描いていたものと、まったく同じウサギの絵。妙に長い耳。少し崩れた輪郭。見間違えるはずがない。"),
        line("r5_after_04","主人公","……ハナさん。"),
        line("r5_after_05","ハナ","ん？"),
        line("r5_after_06","主人公","この絵って、ハナさんが描いたんですか？"),
        pending("この質問に対してハナがどこまで答えるかの最終台詞は未確定。ここでは明確な答えを避け、第6へ疑念を持ち越します。")
      ],()=>{
        room5State.memorySeen=true;room5State.completed=true;saveGame();renderR5();
      });
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
        pending("第6の部屋導入の具体的なト書き。A8開始・白床・壁文は確定。"),
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
        pending("第7の部屋導入の具体的なト書き。12角形・十二支の扉・机上の6冊は確定。"),
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