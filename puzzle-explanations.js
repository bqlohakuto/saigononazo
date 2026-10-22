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
      after:"メールに残った何気ないやりとりが、中学時代の音楽の記憶につながる。",
      authorComment:[
        "謎解きといえば、やっぱり暗号文！",
        "そんなイメージから、最初の謎には言葉の連想を使った仕掛けを取り入れました。",
        "ただ暗号が書かれた文章を読むだけではなく、先輩と主人公のメールのやり取りに隠すことで、謎を解きながら二人の関係性も感じてもらえたらと思っています。",
        "第1の謎ということで、難しさよりも「解けた！」という楽しさを大切にしました。",
        "この謎を通してゲームの遊び方に少しずつ慣れながら、物語の世界に入り込んでもらえていたら嬉しいです。"
      ]
    },
    {
      title:"色と記号の推理", question:"正しい組み合わせを導け",
      focus:"使う記号は〇・△・□・×・＋の5種類で、各記号は一度ずつ登場する。それぞれの色は赤または青。記号・色・位置を同時に推理する。",
      steps:[
        "HITは「記号・色・位置」が全部一致した数。BLOWは「記号・色」は合っているが、位置が違う数。色だけ一致していても数えない。",
        "まずHITとBLOWの合計を見る。この合計は、場所に関係なく「色まで合っている記号」の数になる。",
        "配置する記号と順番を変えず、ある記号の赤・青だけを反転して再判定する。合計が1増えたら新しい色が正解、1減ったら元の色が正解。",
        "色が決まったら、その組み合わせを保って位置を入れ替える。今度はHITの増減を比べ、5 HITを目指す。",
        "通常の謎には固定の解答配置がない。追加の8回チャレンジでも考え方は同じだが、試行回数が限られる。"
      ],
      answer:"正解の並びはプレイごとに変わる。色と位置がすべて一致した「5 HIT」で正解。",
      after:"試行錯誤した結果を記録し、そこから次の仮説を立てる謎。",
      authorComment:[
        "第1の謎が言葉の連想を使ったものだったので、第2の謎では少し違った、論理的に考える謎を作りたいと思いました。",
        "そこで選んだのが「HIT＆BLOW」です。",
        "ただ、そのまま使うのでは面白くないので、色と記号を組み合わせることで、自分なりのアレンジを加えてみました。",
        "一度で正解するのではなく、何度も試して、結果を比べながら少しずつ答えに近づいていく。そんな推理の楽しさを感じてもらえたら嬉しいです。",
        "そして、この謎の試行錯誤する過程は、主人公の恋愛とも少し重ねています。",
        "自分の気持ちに迷ったり、考えたりしながら、それでも少しずつ前に進んでいく。謎を解いたあと、そんな主人公の姿も感じてもらえたらと思っています。"
      ]
    },
    {
      title:"顔文字とモールス", question:"顔に隠された合図を読み、隠された想いを言葉にせよ。",
      focus:"スマートフォンの15通の顔文字と、棚のモールス信号対応表を組み合わせる。暗号を解くだけでなく、その結果を次の指示として使う。",
      steps:[
        "顔文字の点と線をモールス信号として読み、各メッセージをアルファベット一文字に変換する。最初の(-_-)は横線3本＝O。",
        "15通を上から読むと「ONAJIMOJINOAIDA」＝「同じ文字の間」になる。これは10×10文字盤に対する指示。",
        "文字盤の縦・横・斜めを調べ、同じ文字二つのちょうど真ん中に別の一文字がある場所を探す。",
        "たとえば2行2列のイは斜めのラとラに挟まれている。該当する七文字を盤面の上から順に読む。"
      ],
      breakdownTitle:"文字盤の拾い方（上から順）",
      breakdownHeaders:["場所","挟んでいる文字","拾う字"],
      breakdown:[
        ["2行2列","ラ・イ・ラ（斜め）","イ"],
        ["3行7列","ケ・ツ・ケ（縦）","ツ"],
        ["4行4列","ソ・モ・ソ（横）","モ"],
        ["5行9列","ネ・ト・ネ（斜め）","ト"],
        ["6行3列","フ・ナ・フ（縦）","ナ"],
        ["8行7列","マ・リ・マ（斜め）","リ"],
        ["9行4列","ヨ・ニ・ヨ（横）","ニ"]
      ],
      answer:"イツモトナリニ（いつも隣に）",
      after:"暗号そのものの答えが、もう一段階先の解き方を示している。"
    },
    {
      title:"五枚の星座", question:"散らばる星を重ね、夜空にひとつの姿を描け。",
      focus:"まず五枚の透明なパネルを集める。三枚は小謎、二枚は部屋の調査から手に入る。",
      steps:[
        "謎1は色名を英語にし、数字の位置の文字を拾う。SILVERの1文字目＝S、WHITEの4文字目＝T、BLACKの3文字目＝A、GREENの2文字目＝R。答えは「STAR」。",
        "謎2は国旗が示す国名を英語で読む。POLANDの3文字目＝L、SPAINの4文字目＝I、BELGIUMの4文字目＝G、THAILANDの2文字目＝H、ITALYの2文字目＝T。答えは「LIGHT」。",
        "謎3は七色を虹の順（赤・橙・黄・緑・青・藍・紫）に並べる。付いた文字も同時に並び「METEORS」。",
        "小謎から三枚、正面の壁と質問箱の調査から各一枚を入手する。五枚を台に重ね、90度ずつ回転させて星座一覧のおとめ座と照合する。"
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
        "赤い栞がある六冊を見つける。四冊の動かせない本も含め、十冊の題名を五十音順に並べる。たとえば「赤ずきん」と「ウサギとカメ」の間には「一休さん」が入る。",
        "並べた六冊の栞のページを開き、本文に描かれた動物を探す。「オオカミ少年」の答えはオオカミではなく羊、「てぶくろ」はイノシシ。",
        "動物を十二支の字に直し、本棚の左から順に時計型操作盤で選んで扉を進む。固定の四冊は選ぶ順番には含めない。"
      ],
      breakdownTitle:"完成した本棚（左から右）",
      breakdownHeaders:["位置","本の題名","栞の動物"],
      breakdown:[
        ["1","赤ずきん（固定）","—"],
        ["2","一休さん","とら→寅"],
        ["3","ウサギとカメ","うさぎ→卯"],
        ["4","オオカミ少年","ひつじ→未"],
        ["5","かぐや姫（固定）","—"],
        ["6","さるかに合戦","さる→申"],
        ["7","鶴の恩返し（固定）","—"],
        ["8","てぶくろ","いのしし→亥"],
        ["9","ブレーメンの音楽隊","にわとり→酉"],
        ["10","ラプンツェル（固定）","—"]
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
      after:"ハナが用意した最後の謎は、失っていた彼女の名前を自分で思い出すことだった。"
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
      (c.breakdown?pageSection(c.breakdownTitle||"メールと音階の対応",'<table class="pguide-breakdown"><thead><tr>'+(c.breakdownHeaders||["時刻","手がかり","音"]).map(head=>'<th>'+esc(head)+'</th>').join('')+'</tr></thead><tbody>'+c.breakdown.map(row=>'<tr>'+row.map(cell=>'<td>'+esc(cell)+'</td>').join('')+'</tr>').join('')+'</tbody></table>'):'')+
      pageSection("正解",'<p class="pguide-answer">'+esc(c.answer)+'</p>')+
      pageSection("記憶とのつながり",'<p>'+esc(c.after)+'</p>')+
      (c.authorComment?pageSection("作者コメント",'<div class="pguide-author-comment">'+c.authorComment.map(line=>'<p>'+esc(line)+'</p>').join("")+'</div>'):"")+
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