// Post-game puzzle commentary. Test builds expose the guide from the title screen.
(() => {
  const TEST_MODE = true; // Set to false for the release build.
  const UNLOCK_KEY = "saigononazo-guide-unlocked-v1";
  const CHAPTERS = [
    {
      title:"音楽とメール", question:"会話に隠された、音楽を奏でよ",
      focus:"「会話」はスマートフォンの送受信メール、「音楽」はコンサートのポスターとピアノを指している。",
      steps:[
        "ポスターの曲目から「ドレミのうた」に注目する。ドーナツ＝ド、レモン＝レのように、言葉から音階を連想する。",
        "受信・送信メールを別々に読まず、20:15から20:22まで時刻の古い順に一つの会話として並べる。",
        "それぞれの本文から音を連想させる言葉を一つずつ拾う。最初の「空」は『ドレミのうた』の「ソは青い空」につながる（メールでは夕焼けの空）。",
        "メール一通につき一音。八音を会話の順に並べ、ピアノへ入力する。"
      ],
      breakdown:[
        ["20:15","帰り道に見た空","ソ"],
        ["20:16","トランペット","ラ"],
        ["20:17","ファイト","ファ"],
        ["20:18","みんな","ミ"],
        ["20:19","ドーナツ","ド"],
        ["20:20","レモン","レ"],
        ["20:21","ドーナツ","ド"],
        ["20:22","幸せ","シ"]
      ],
      answer:"ソ・ラ・ファ・ミ・ド・レ・ド・シ",
      after:"メールに残った何気ないやりとりが、中学時代の音楽の記憶につながる。"
    },
    {
      title:"色と記号の推理", question:"正しい組み合わせを導け",
      focus:"一つのブロックは「色」と「記号」の組み合わせ。色か記号のどちらかだけが合っても、同じブロックとは扱わない。",
      steps:[
        "HITは色・記号・位置のすべてが一致している数。BLOWは色と記号は一致するが、位置が違う数。",
        "一度に変える条件を絞り、前の判定との増減を比べる。確定した組み合わせは固定して考える。",
        "残る位置を入れ替えて判定を整理し、すべてをHITにする。8回チャレンジは同じ推理を限られた回数で試す追加モード。"
      ],
      answer:"正解の並びはプレイごとに変わるため、固定の答えはない。5 HITが完成形。",
      after:"試行錯誤した結果を記録し、そこから次の仮説を立てる謎。"
    },
    {
      title:"顔文字とモールス", question:"顔に隠された合図を読み、隠された想いを言葉にせよ。",
      focus:"スマートフォンの15通の顔文字と、棚のモールス信号対応表を組み合わせる。",
      steps:[
        "顔文字の点と線をモールス信号として読み、各メッセージをアルファベット一文字に変換する。",
        "15通を上から読むと「ONAJIMOJINOAIDA」＝「同じ文字の間」になる。",
        "10×10の文字盤で、同じ文字に挟まれた文字を順に拾うと、最後の言葉が現れる。"
      ],
      answer:"イツモトナリニ（いつも隣に）",
      after:"暗号そのものの答えが、もう一段階先の解き方を示している。"
    },
    {
      title:"五枚の星座", question:"散らばる星を重ね、夜空にひとつの姿を描け。",
      focus:"まず五枚の透明なパネルを集める。三枚は小謎、二枚は部屋の調査から手に入る。",
      steps:[
        "謎1は色の英語名から数字番目の文字を読む。SILVERの1文字目などを拾うと「STAR」。",
        "謎2は国旗が表す英語の国名から数字番目の文字を読む。「LIGHT」。",
        "謎3は七色を虹の順（赤・橙・黄・緑・青・藍・紫）に並べると「METEORS」。残りの二枚は正面の壁と質問箱にある。",
        "五枚を台に重ね、各パネルを90度ずつ回して星の配置を合わせる。星座一覧と照合する。"
      ],
      answer:"おとめ座。初期角度からの回転回数は、パネル1〜5の順に2・3・0・1・2回。",
      after:"完成した星の一つ、スピカが回想へのきっかけになる。"
    },
    {
      title:"絵と助数詞", question:"描かれたものを正しく数え、あるべき場所へ導け。",
      focus:"日本語の助数詞は、何を数えるかによって変わる。壁のウサギは「羽」の例。",
      steps:[
        "部屋を探索して七枚の絵のパネルを集める。冷蔵庫は上段と下段、窓際やダイニングも調べる。",
        "鏡＝面、魚＝尾、蝶＝頭、花＝輪、イカ＝杯、椅子＝脚、大砲＝門に合わせて配置する。",
        "すべて正しくはめると、完成したパネルに四桁の数字が現れる。その数字を扉のテンキーに入力する。"
      ],
      answer:"鏡／面・魚／尾・蝶／頭・花／輪・イカ／杯・椅子／脚・大砲／門 → 8194",
      after:"組み合わせると一枚の絵になる、子供の落書きのようなパネルが記憶につながる。"
    },
    {
      title:"六十四の部屋", question:"最後の影が消える時、閉ざされた道は開かれる。",
      focus:"8×8の部屋の床はオセロの盤面。白・黒・緑の床を確かめ、地図を完成させる。",
      steps:[
        "緑の床は駒を置ける場所。白と黒を交互に置き、相手の色を挟むと間の床が裏返る。",
        "左側のレバーで白、右側のレバーで黒を置く。途中で黒が増えても、最後にすべて白になればよい。",
        "初期盤面からの正解ルートの一例は、D1→H4→D2→G5→G6→G3→C8→C2→H2。九手目で最後の黒が消える。"
      ],
      answer:"九手で全64マスを白にする。最後にH2で黒を消すと東側の扉が開く。",
      after:"目先の一手だけでなく、次の一手をどう残すかが鍵になる。"
    },
    {
      title:"書庫と十二支", question:"物語が導くのは、あなたの進む軌跡。",
      focus:"赤い栞のある六冊を集め、動かせない四冊と合わせて本棚を五十音順に完成させる。",
      steps:[
        "六冊の配置は左から、一休さん、ウサギとカメ、オオカミ少年、さるかに合戦、てぶくろ、ブレーメンの音楽隊。固定された四冊は並びの目印。",
        "六冊それぞれの栞のページを開き、本文に登場する動物を確認する。題名に出ている動物とは限らない。",
        "本文の動物を十二支に置き換え、本棚の左から順に時計型操作盤で選んで扉を進む。"
      ],
      answer:"寅 → 卯 → 未 → 申 → 亥 → 酉",
      after:"本の順番と動物の読み替えを、二つ続けて使う謎。"
    },
    {
      title:"最後の謎", question:"私はだーれだ？",
      focus:"七つの部屋で見てきたものと、記録に残った会話を思い返す。",
      steps:[
        "机の紙を裏返し、記録（LOG）をもう一度読む。",
        "これまでの会話や出来事に繰り返し現れた二つの手がかりは「花」と「音」。",
        "最初の部屋を思い出して順番を決め、二文字を人の名前として読む。"
      ],
      answer:"花音（かのん）",
      after:"失った名前を思い出すことが、二人が用意した最後の謎の答え。"
    }
  ];
  const esc = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const enabled = () => TEST_MODE || localStorage.getItem(UNLOCK_KEY) === "1";
  let selected = 0;
  function titleLink(){
    const home = document.querySelector("#game .title-home");
    if(!home || home.querySelector("#puzzleGuideButton") || !enabled()) return;
    const menu = home.querySelector(".title-menu");
    const before = home.querySelector("#settingsButton");
    if(!menu || !before)return;
    const button = document.createElement("button");
    button.type="button";button.id="puzzleGuideButton";button.textContent="謎の解説";
    button.setAttribute("aria-label","謎の解説を見る");
    button.addEventListener("click",()=>openGuide(0));
    menu.insertBefore(button,before);
  }
  function pageSection(label,html){
    return '<section class="pguide-section"><h3>'+esc(label)+'</h3>'+html+'</section>';
  }
  function render(){
    const c=CHAPTERS[selected];
    const nav=CHAPTERS.map((v,i)=>'<button type="button" data-pguide-chapter="'+i+'" class="'+(selected===i?"is-active":"")+'" aria-current="'+(selected===i?"page":"false")+'"><small>第'+(i+1)+'の謎</small><span>'+esc(v.title)+'</span></button>').join("");
    const items=c.steps.map((step,i)=>'<li><b>'+String(i+1).padStart(2,"0")+'</b><span>'+esc(step)+'</span></li>').join("");
    game.innerHTML='<main class="pguide" aria-label="謎の解説"><header class="pguide-top"><h1>謎の解説</h1><button type="button" id="pguideBack">タイトルへ戻る</button></header>'+
      '<p class="pguide-lead">※ このページには全8章の解答と物語のネタバレが含まれます。</p>'+
      '<div class="pguide-body"><nav class="pguide-nav" aria-label="解説する謎を選ぶ">'+nav+'</nav>'+
      '<article class="pguide-article" tabindex="0"><div class="pguide-index">第'+(selected+1)+'の謎 / 全8章</div><h2>'+esc(c.title)+'</h2>'+
      pageSection("問題のおさらい",'<p>'+esc(c.question)+'</p>')+
      pageSection("着眼点",'<p>'+esc(c.focus)+'</p>')+
      pageSection("解き方",'<ol>'+items+'</ol>')+
      (c.breakdown?pageSection("メールと音階の対応",'<table class="pguide-breakdown"><thead><tr><th>時刻</th><th>手がかり</th><th>音</th></tr></thead><tbody>'+c.breakdown.map(row=>'<tr>'+row.map(cell=>'<td>'+esc(cell)+'</td>').join('')+'</tr>').join('')+'</tbody></table>'):'')+
      pageSection("正解",'<p class="pguide-answer">'+esc(c.answer)+'</p>')+
      pageSection("記憶とのつながり",'<p>'+esc(c.after)+'</p>')+
      '<div class="pguide-pager"><button type="button" id="pguidePrev" '+(selected===0?"disabled":"")+'>← 前の謎</button><button type="button" id="pguideNext" '+(selected===CHAPTERS.length-1?"disabled":"")+'>次の謎 →</button></div></article></div></main>';
    game.querySelector("#pguideBack").addEventListener("click",()=>showTitle());
    game.querySelectorAll("[data-pguide-chapter]").forEach(b=>b.addEventListener("click",()=>openGuide(Number(b.dataset.pguideChapter))));
    game.querySelector("#pguidePrev").addEventListener("click",()=>openGuide(selected-1));
    game.querySelector("#pguideNext").addEventListener("click",()=>openGuide(selected+1));
  }
  function openGuide(index){
    if(!enabled())return;
    selected=Math.max(0,Math.min(CHAPTERS.length-1,index));
    Dialogue.stop();
    render();
    game.querySelector(".pguide-article")?.focus({preventScroll:true});
  }
  const observer=new MutationObserver(()=>{
    if(game.querySelector(".late-ending"))try{localStorage.setItem(UNLOCK_KEY,"1")}catch{}
    titleLink();
  });
  observer.observe(game,{childList:true,subtree:true});
  titleLink();
  window.PuzzleGuide={open:openGuide,isTestMode:()=>TEST_MODE,isUnlocked:enabled};
})();