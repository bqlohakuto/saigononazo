// Puzzle answers unlock after the epilogue; author preview keeps them accessible for QA.
(() => {
  const TEST_MODE = window.GameBuild?.preview === true;
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
        "そして、この謎で試行錯誤する過程は、主人公の恋愛とも少し重ねています。",
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
      after:"暗号そのものの答えが、もう一段階先の解き方を示している。",
      authorComment:[
        "実は、この謎にはどうしても入れたかった思い出があります。",
        "私が謎解きゲームを作るきっかけになった人が、モールス信号の「トンツー」を「トントーン」と言い間違えたことがあって、そのときはもう大爆笑でした（笑）。",
        "その出来事がずっと印象に残っていて、いつかゲームの中に入れたいと思っていたので、今回はモールス信号を題材に選びました。",
        "ただ、モールス信号を解くだけでは終わらせたくなかったので、暗号を解くと次の謎の解き方がわかる、二段階の仕掛けにしています。",
        "そして、最後にたどり着く「いつも隣に」という言葉は、この章の告白の場面へとつながっています。",
        "何気ない言い間違いから生まれた笑いが、こうして一つの謎になりました。",
        "私にとって大切な思い出が詰まった謎なので、皆さんにも楽しんでもらえていたら嬉しいです。"
      ]
    },
    {
      title:"五枚の星座", question:"散らばる星を重ね、夜空にひとつの姿を描け。",
      focus:"まず五枚の透明なパネルを集める。三枚は小謎、二枚は部屋の調査から手に入る。",
      steps:[
        "謎1は色名を英語にし、数字の位置の文字を拾う。SILVERの1文字目＝S、WHITEの4文字目＝T、BLACKの3文字目＝A、GREENの2文字目＝R。答えは「STAR」。",
        "謎2は、色見本とパーセントが示す国旗を展示から探す。紋章も含めた国旗全体の色の割合を使う。白と赤が各50%＝POLAND。SPAINは赤52.0%、黄45.6%に加え、紋章の白・黒・青・ピンク・緑も含む。黒・黄・赤が各33.3%＝BELGIUM、赤・白・青が各33.3%＝THAILAND、緑・白・赤が各33.3%＝ITALY。英語国名の3・4・4・2・2文字目を順に拾うと「LIGHT」。",
        "謎3は七色を虹の順（赤・橙・黄・緑・青・藍・紫）に並べる。付いた文字も同時に並び「METEORS」。",
        "小謎から三枚、正面の壁と質問箱の調査から各一枚を入手する。五枚を台に重ね、90度ずつ回転させて星座一覧のおとめ座と照合する。"
      ],
      answer:"おとめ座。初期角度からの回転回数は、パネル1〜5の順に2・3・0・1・2回。",
      after:"完成した星の一つ、スピカが回想へのきっかけになる。",
      authorComment:[
        "第4の謎では、以前から作ってみたかった星座を題材にしてみました。",
        "今回は一つの問題を解いて終わりではなく、いくつかの小謎を解きながら、少しずつガラスパネルを集めていく構成にしています。",
        "特にこだわったのは、集めたパネルを重ねることで、バラバラだった星が一つの星座として浮かび上がる仕掛けです。",
        "それまで解いてきた小謎が、最後に一つの大きな答えにつながる。「全部つながった！」という達成感を味わってもらえたら嬉しいです。",
        "ちなみに、今回は先に星座の謎を考えていて、そこから回想の舞台をプラネタリウムに決めました。",
        "謎を解いて見つけた星座が、二人のデートの記憶へとつながっていく。そんな流れも楽しんでもらえたらと思っています。"
      ]
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
      after:"組み合わせると一枚の絵になる、子供の落書きのようなパネルが記憶につながる。",
      authorComment:[
        "第5の謎では、これまでの暗号や推理とは少し違った、知識を使う謎を作ってみました。",
        "題材に選んだのは、物の「数え方」です。",
        "蝶を「一頭」、大砲を「一門」と数えるなど、日本語には意外な助数詞がたくさんあります。",
        "「そんな数え方があるんだ！」と、謎を解きながら新しい発見を楽しんでもらえたら嬉しいです。",
        "ただ知識を問うだけでは面白くないので、絵のパネルを正しい場所にはめ込むと、一つの絵が完成する仕掛けにしてみました。",
        "そして、この謎では二人で謎を楽しむ関係性も大切にしています。",
        "一緒に考えて、意外な答えに驚いて、ときには笑い合う。",
        "そんな何気ない時間も、二人にとっては大切な思い出だったんじゃないかなと思います。",
        "謎解きの楽しさと一緒に、二人の温かい日常も感じてもらえたら嬉しいです。"
      ]
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
      after:"目先の一手だけでなく、次の一手をどう残すかが鍵になる。",
      authorComment:[
        "第6の謎では、これまでよりもずっと大規模な仕掛けを作ってみたいと思いました。",
        "そこで考えたのが、64部屋そのものをオセロの盤面にしてしまうという謎です。",
        "普通のオセロとは違って、自分自身が盤面の中を移動しながら仕掛けを解いていく。そんな少し変わった体験を楽しんでもらえたらと思っています。",
        "そして、特にこだわったのは最後の一手です。",
        "盤面に残っていた黒が一気に白へと変わり、すべての部屋が白になる瞬間。その爽快感を味わってほしくて、この仕掛けを考えました。",
        "実は、この黒から白への変化には、物語としての意味も込めています。",
        "第6の回想で描かれるのは、二人のすれ違いと仲直り。",
        "お互いの気持ちがうまく伝わらず、すれ違ってしまった二人が、もう一度向き合っていく。",
        "最後に黒がすべて白に変わるのは、そんな二人の仲直りを表現したかったからです。",
        "大きな謎を解き切った達成感と一緒に、二人の関係が少しずつ修復されていく温かさも感じてもらえたら嬉しいです。"
      ]
    },
    {
      title:"書庫と十二支", question:"散らばった記憶を辿り、忘れてはならないものを見つけ出せ",
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
      after:"本の順番と動物の読み替えを、二つ続けて使う謎。",
      authorComment:[
        "第7の謎では、以前から使ってみたかった「十二支」を題材にしてみました。",
        "ただ十二支を並べるだけでは面白くないので、誰もが知っている童話と組み合わせた謎にしています。",
        "普段は物語として楽しんでいる童話も、謎解きという視点で読んでみると、また違って見えるんじゃないかと思いました。",
        "本を集めて、正しく並べて、物語の中から手がかりを探す。そんな一つひとつの発見を楽しんでもらえたら嬉しいです。",
        "そして、今回の謎では、本に描かれた動物を順番に十二支へ置き換え、操作盤を動かす仕掛けにしています。",
        "これは単に扉を開くためだけではなく、主人公が失っていた記憶を取り戻していく過程と重ねたかったからです。",
        "ここまでの謎を解きながら少しずつ取り戻してきた思い出が、第7の謎をきっかけに、一つの大きな真実へとつながっていく。",
        "この章は、物語が大きく動き出す転換点として作りました。",
        "謎を解き終えたあと、これまで歩いてきた部屋や、そこで見てきた二人の思い出を、もう一度振り返ってもらえたら嬉しいです。"
      ]
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
      after:"ハナが用意した最後の謎は、失っていた彼女の名前を自分で思い出すことだった。",
      authorComment:[
        "最後の謎では、複雑な暗号や難しい仕掛けではなく、「名前」そのものを答えにしたいと思いました。",
        "これまでの部屋で見てきたものや、何気ない会話の中に散りばめられた手がかり。それらすべてが最後の一つの答えにつながっていく、そんな謎にしたかったんです。",
        "最後だからこそ、難しさよりも物語としての意味を大切にしました。",
        "ハナが自分の正体を明かさなかったのも、主人公自身の力で大切な記憶を取り戻してほしかったからです。",
        "忘れてしまったことを思い出すのは、必ずしも幸せなことばかりではありません。",
        "それでも、二人で過ごした時間を一つずつ思い出すことが、主人公にとって別れを受け入れるための大切な時間になったのだと思います。",
        "そして、この物語で一番伝えたかったのは、大切な人との思い出は、別れによって消えてしまうわけではないということです。",
        "花音が大好きだった謎解きを、今度は主人公が作って誰かに届けていく。",
        "彼女が残したものを受け継ぐことで、二人の思い出はこれからも続いていく。そんな結末にしたいと思いました。",
        "実は、この部分には私自身の想いも少し重ねています。",
        "私が謎解きゲームを作るようになったのも、ある人との出会いや、そこで生まれた思い出がきっかけでした。",
        "誰かと過ごした時間や、何気なく笑い合った出来事が、こうして新しい何かを生み出すこともあるんだと思います。",
        "だからこそ、このゲームを作ること自体にも、私にとって特別な意味があります。",
        "最後まで謎を解き、二人の物語を見届けてくれて、本当にありがとうございました。",
        "この物語が、皆さんの心にも少しでも残ってくれたら嬉しいです。"
      ]
    }
  ];
  const esc = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  // Release mode reveals the spoiler guide only after the completed epilogue.
  // Also accept a finished save created before the local unlock flag existed.
  const completedSave = () => {
    try {
      const completed=typeof readSavedGame==="function"?readSavedGame()?.rooms?.room08:null;
      return completed?.ended===true && completed.epilogueSeen===true;
    } catch (_) {
      return false;
    }
  };
  const enabled = () => TEST_MODE || localStorage.getItem(UNLOCK_KEY) === "1" || completedSave();
  function markCleared(){
    if(!completedSave())return false;
    try{localStorage.setItem(UNLOCK_KEY,"1")}catch{return false}
    return true;
  }
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
    if(game.querySelector(".ending-credits"))markCleared();
    titleLink();
  });
  observer.observe(game,{childList:true,subtree:true});
  titleLink();
  window.PuzzleGuide={open:openGuide,isTestMode:()=>TEST_MODE,isUnlocked:enabled,markCleared};
})();
