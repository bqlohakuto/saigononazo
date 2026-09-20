// openingScenario / firstRoomScenario に収録するシナリオ本文の実装上の正本はこのファイル。
// SCENARIO.md は読みやすい原稿ビューとして、この内容に同期する。
// LOG ID は文章から生成せず、並び替えても既存の ID を維持する。
// 文章を分割して表示する場合は、共通処理で各部分の連番を ID の末尾に付ける。
// オープニング
const openingScenario = [
    { logId: "opening_01", logType: "narration", speaker: "ト書き", text: "目の前が赤く染まり、耳障りな音が頭の奥で鳴り響く。" },
    { logId: "opening_02", logType: "narration", speaker: "ト書き", text: "視界は、ゆっくりと暗闇に沈んでいく。" },
    { logId: "opening_03", logType: "narration", speaker: "ト書き", text: "……どれだけの時間が過ぎただろうか。" },
    { logId: "opening_04", logType: "narration", speaker: "ト書き", text: "瞼が重い。" },
    { logId: "opening_05", logType: "narration", speaker: "ト書き", text: "閉じた瞼の向こうに、強い光を感じる。" },
    { logId: "opening_06", logType: "narration", speaker: "ト書き", text: "ゆっくりと瞼を開ける。" },
    { logId: "opening_07", logType: "narration", speaker: "ト書き", text: "真っ白だった視界が、少しずつ輪郭を取り戻していく。" },
    { logId: "opening_08", logType: "narration", speaker: "ト書き", text: "目に映ったのは、ただ真っ白な壁だけだった。" },
    { logId: "opening_09", logType: "narration", speaker: "ト書き", text: "天井の照明が、痛いほど白く部屋を照らしている。" },
    { logId: "opening_10", logType: "narration", speaker: "主人公", thought: true, text: "ここは……？" },
    { logId: "opening_11", logType: "narration", speaker: "ト書き", text: "左右を見渡しても、目に映るのは同じような白い壁ばかりだ。" },
    { logId: "opening_13", logType: "narration", speaker: "ト書き", text: "天井を見上げていると、不意に後ろから声がした。" },
    { logId: "opening_12", logType: "dialogue", speaker: "ハナ", text: "よかった、気がついたんだね" },
    { logId: "opening_14", logType: "narration", speaker: "ト書き", text: "はっとして振り向くと、そこには黒髪の美しい女性が、静かに立っていた。" },
    { logId: "opening_15", logType: "dialogue", speaker: "主人公", text: "あなたは……？" },
    { logId: "opening_16", logType: "narration", speaker: "ト書き", text: "反射的に、問いかける。" },
    { logId: "opening_17", logType: "narration", speaker: "ト書き", text: "彼女は少し眉をひそめ、しばらく黙ったあと、ゆっくりと口を開いた。" },
    { logId: "opening_18", logType: "dialogue", speaker: "ハナ", text: "ごめんね。いまは、何も言えないの" },
    { logId: "opening_19", logType: "dialogue", speaker: "ハナ", text: "きみは……自分のこと、わかる？" },
    { logId: "opening_20", logType: "dialogue", speaker: "主人公", text: "自分のこと……？" },
    { logId: "opening_21", logType: "narration", speaker: "ト書き", text: "問いかけるように、自分でもその言葉を繰り返す。" },
    { logId: "opening_22", logType: "narration", speaker: "主人公", thought: true, text: "僕は……" },
    { logId: "opening_23", logType: "narration", speaker: "主人公", thought: true, text: "名前は……？" },
    { logId: "opening_24", logType: "narration", speaker: "主人公", thought: true, text: "どうやって、ここに来たんだ……？" },
    { logId: "opening_24_response", logType: "dialogue", speaker: "ハナ", text: "わからない……よね" },
    { logId: "opening_25", logType: "dialogue", speaker: "ハナ", text: "混乱してると思うけど、大丈夫" },
    { logId: "opening_26", logType: "dialogue", speaker: "ハナ", text: "君が忘れていることは、きっと思い出せる" },
    { logId: "opening_27", logType: "dialogue", speaker: "ハナ", text: "わたしも、記憶を取り戻すのを手伝うから" },
    { logId: "opening_28", logType: "dialogue", speaker: "主人公", text: "記憶を取り戻す……？　どうやって？" },
    { logId: "opening_29", logType: "dialogue", speaker: "ハナ", text: "それは、この先に進めばわかるよ" },
    { logId: "opening_30", logType: "narration", speaker: "ト書き", text: "彼女は、僕の後ろを指さした。" },
    { logId: "opening_31", logType: "narration", speaker: "ト書き", text: "振り返ると、先ほどまで何もなかったはずの白い壁に、一つの扉が現れていた。" },
    { logId: "opening_32", logType: "narration", speaker: "ト書き", text: "まるで最初からそこにあったかのように。" },
    { logId: "opening_33", logType: "narration", speaker: "ト書き", text: "そして、こちらを誘っているかのように。" },
    { logId: "opening_34", logType: "dialogue", speaker: "主人公", text: "一体、何が起きているんだ……？" },
    { logId: "opening_35", logType: "narration", speaker: "ト書き", text: "突然の出来事に、頭の整理が追いつかない。" },
    { logId: "opening_36", logType: "dialogue", speaker: "ハナ", text: "大丈夫だよ" },
    { logId: "opening_37", logType: "dialogue", speaker: "ハナ", text: "さあ、扉を開けて？" },
    { logId: "opening_38", logType: "narration", speaker: "ト書き", text: "彼女に背中を押され、僕はドアノブへと手を伸ばした。" },
    { logId: "opening_39", logType: "narration", speaker: "ト書き", text: "その瞬間、扉がひとりでに開く。" },
    { logId: "opening_40", logType: "narration", speaker: "ト書き", text: "扉の向こうへ、身体が吸い込まれていくような感覚に襲われた。" },
    { logId: "opening_41", logType: "narration", speaker: "ト書き", text: "視界が、瞬く間にまばゆい光に包まれていく。" },
    { logId: "opening_42", logType: "dialogue", speaker: "ハナ", text: "大丈夫。わたしが一緒にいるから" },
    { logId: "opening_43", logType: "dialogue", speaker: "ハナ", text: "最後の謎が解けるまで……" }
];

// 第一の部屋。調査・会話・回想もここを正本とし、script.js には進行だけを持たせる。
// アップロード原稿の重複する導入は hanaFirst に統合。吹奏楽音源の再生タイミングは script.js で管理する。
const firstRoomScenario = {
    melody: ["ソ", "ラ", "ファ", "ミ", "ド", "レ", "ド", "シ"],
    hanaFirst: [
        { logId: "room1_hana_first_01", logType: "dialogue", speaker: "主人公", text: "あの……結局、あなたは一体……？" },
        { logId: "room1_hana_first_02", logType: "dialogue", speaker: "ハナ", text: "ごめんね。何も話せなくて" },
        { logId: "room1_hana_first_03", logType: "dialogue", speaker: "ハナ", text: "そうだ。名前も言わなかったら、なんて呼べばいいかわからないよね" },
        { logId: "room1_hana_first_04", logType: "dialogue", speaker: "ハナ", text: "ずっと『あなた』って呼ばれるのも、なんか嫌だから……ハナって呼んで！" },
        { logId: "room1_hana_first_05", logType: "dialogue", speaker: "主人公", text: "ハナさん……ですか？" },
        { logId: "room1_hana_first_06", logType: "dialogue", speaker: "ハナ", text: "そう！　ハナ！" },
        { logId: "room1_hana_first_07", logType: "dialogue", speaker: "ハナ", text: "名前がわからない人って、花子さんって呼んだりするでしょ？" },
        { logId: "room1_hana_first_08", logType: "dialogue", speaker: "主人公", text: "本当の名前じゃ、ないんですか？" },
        { logId: "room1_hana_first_09", logType: "dialogue", speaker: "ハナ", text: "まだ言えないからね！" },
        { logId: "room1_hana_first_10", logType: "dialogue", speaker: "主人公", text: "わかりました……えっと、ハナさん" },
        { logId: "room1_hana_first_11", logType: "dialogue", speaker: "ハナ", text: "ハナ……さん……か。ちょっと固いけど、はじめは仕方ないか" },
        { logId: "room1_hana_first_12", logType: "dialogue", speaker: "ハナ", text: "私のことはまだ話せないけど、この部屋のことなら答えられることもあるよ" },
        { logId: "room1_hana_first_13", logType: "dialogue", speaker: "ハナ", text: "気になることがあったら、また聞いてね" }
    ],
    hanaAbout: [
        { logId: "room1_hana_about_01", logType: "dialogue", speaker: "主人公", text: "あの、ハナさん" },
        { logId: "room1_hana_about_02", logType: "dialogue", speaker: "ハナ", text: "なに？" },
        { logId: "room1_hana_about_03", logType: "dialogue", speaker: "主人公", text: "やっぱり、あなたのことは何も教えてもらえないんですか？" },
        { logId: "room1_hana_about_04", logType: "dialogue", speaker: "ハナ", text: "うーん……今は、まだね" },
        { logId: "room1_hana_about_05", logType: "dialogue", speaker: "主人公", text: "今は？" },
        { logId: "room1_hana_about_06", logType: "dialogue", speaker: "ハナ", text: "そのうち、わかるよ" },
        { logId: "room1_hana_about_07", logType: "dialogue", speaker: "主人公", text: "……ずいぶん曖昧ですね" },
        { logId: "room1_hana_about_08", logType: "dialogue", speaker: "ハナ", text: "そういう役目なの" },
        { logId: "room1_hana_about_09", logType: "dialogue", speaker: "主人公", text: "役目……？" },
        { logId: "room1_hana_about_10", logType: "dialogue", speaker: "ハナ", text: "それも、まだ秘密！" },
        { logId: "room1_hana_about_11", logType: "dialogue", speaker: "主人公", text: "……わかりました" },
        { logId: "room1_hana_about_12", logType: "dialogue", speaker: "ハナ", text: "ごめんね。でも、必要なときが来たらちゃんと話すから" }
    ],
    hanaRoom: [
        { logId: "room1_hana_room_01", logType: "dialogue", speaker: "主人公", text: "この部屋って……一体" },
        { logId: "room1_hana_room_02", logType: "dialogue", speaker: "ハナ", text: "何か、見覚えのあるものはない？" },
        { logId: "room1_hana_room_03", logType: "dialogue", speaker: "主人公", text: "見覚えのあるものですか？……ない、ですね……" },
        { logId: "room1_hana_room_04", logType: "dialogue", speaker: "ハナ", text: "この部屋は、君の記憶でできているの" },
        { logId: "room1_hana_room_05", logType: "dialogue", speaker: "ハナ", text: "君が忘れているだけで、きっとどこかに記憶を取り戻す手がかりがあるよ" }
    ],
    hanaFirstPuzzle: [
        { logId: "room1_hana_first_puzzle_01", logType: "dialogue", speaker: "主人公", text: "最初の謎って言ってましたけど、謎ってなんですか？" },
        { logId: "room1_hana_before_question_01", logType: "dialogue", speaker: "ハナ", text: "まずは部屋を調べてみようか。何か気になるものはない？" }
    ],
    hanaPoster: [
        { logId: "room1_hana_poster_01", logType: "dialogue", speaker: "ハナ", text: "♪〜〜♪" },
        { logId: "room1_hana_poster_02", logType: "narration", speaker: "主人公", thought: true, text: "声をかけたが、気づかずに歌っている。もう一度声をかけた" },
        { logId: "room1_hana_poster_03", logType: "dialogue", speaker: "主人公", text: "ハナさん？" },
        { logId: "room1_hana_poster_04", logType: "dialogue", speaker: "ハナ", text: "わっ、ごめん！　聞いてた？" },
        { logId: "room1_hana_poster_05", logType: "dialogue", speaker: "ハナ", text: "ちょっと恥ずかしいな……懐かしくなっちゃって" },
        { logId: "room1_hana_poster_06", logType: "dialogue", speaker: "主人公", text: "音楽って、ポスターに書かれている曲名のことでしょうか？" },
        { logId: "room1_hana_poster_07", logType: "dialogue", speaker: "ハナ", text: "うーん……そうかもしれないね" },
        { logId: "room1_hana_poster_08", logType: "dialogue", speaker: "ハナ", text: "でも、曲名がこんなにたくさんあると、どれなのか迷うね" }
    ],
    hanaPhone: [
        { logId: "room1_hana_phone_01", logType: "dialogue", speaker: "主人公", text: "『会話』って、メールのことなんでしょうか？" },
        { logId: "room1_hana_phone_02", logType: "dialogue", speaker: "ハナ", text: "わたしも、メールのことだと思うな" },
        { logId: "room1_hana_phone_03", logType: "dialogue", speaker: "主人公", text: "じゃあ……『会話に隠された音楽』って、メールの中に音楽が隠されてるってこと……？" }
    ],
    hanaPiano: [
        { logId: "room1_hana_piano_01", logType: "dialogue", speaker: "主人公", text: "ハナさんはピアノ、弾けますか？" },
        { logId: "room1_hana_piano_02", logType: "dialogue", speaker: "ハナ", text: "少しならね" },
        { logId: "room1_hana_piano_03", logType: "dialogue", speaker: "主人公", text: "『音楽を奏でよ』って、ピアノで演奏するってことですよね" },
        { logId: "room1_hana_piano_04", logType: "dialogue", speaker: "ハナ", text: "うん。でも、弾くのは君だと思うよ" },
        { logId: "room1_hana_piano_05", logType: "dialogue", speaker: "主人公", text: "やっぱり、僕が……" },
        { logId: "room1_hana_piano_06", logType: "dialogue", speaker: "ハナ", text: "たぶんね。あとは、何を弾けばいいか…かな" }
    ],
    // ヒント1: 扉を確認後。2: ポスターとメールを確認後。3〜4: プレイヤーが次のヒントを希望したとき。
    hanaHints: [
        [
            { logId: "room1_hana_after_question_01", logType: "dialogue", speaker: "主人公", text: "『会話に隠された、音楽を奏でよ』……" },
            { logId: "room1_hana_after_question_02", logType: "dialogue", speaker: "ハナ", text: "会話……会話するもの……それから、音楽……演奏……？" },
            { logId: "room1_hana_hint1_03", logType: "narration", speaker: "主人公", thought: true, text: "ハナさんも考えているようだ……" }
        ],
        [
            { logId: "room1_hana_hint2_01", logType: "dialogue", speaker: "ハナ", text: "『会話に隠された音楽』かぁ……" },
            { logId: "room1_hana_hint2_02", logType: "dialogue", speaker: "ハナ", text: "メールと、ポスターの演奏曲……何かつながってるのかな？" },
            { logId: "room1_hana_hint2_03", logType: "dialogue", speaker: "ハナ", text: "ドーナツ……食べたいな" }
        ],
        [
            { logId: "room1_hana_hint3_01", logType: "dialogue", speaker: "ハナ", text: "ピアノで演奏するのは、8音みたいだね" },
            { logId: "room1_hana_hint3_02", logType: "dialogue", speaker: "ハナ", text: "メール1通で1音……なのかな？" },
            { logId: "room1_hana_mail_hint_01", logType: "dialogue", speaker: "ハナ", text: "受信したメールだけじゃ、数が合わないみたいだけど……" }
        ],
        [
            { logId: "room1_hana_hint4_01", logType: "dialogue", speaker: "ハナ", text: "曲名を、もう一度よく見てみたら？" },
            { logId: "room1_hana_hint4_02", logType: "dialogue", speaker: "ハナ", text: "ほら、“音”がそのまま名前になってるような曲が、一つあるよね" },
            { logId: "room1_hana_hint4_03", logType: "dialogue", speaker: "主人公", text: "ドレミのうた？" },
            { logId: "room1_hana_hint4_04", logType: "dialogue", speaker: "ハナ", text: "そう。メールの会話の中に、それっぽいものは出てこなかった？" }
        ]
    ],
    doorIntroduction: [
        { logId: "room1_door_first_01", logType: "investigation", speaker: "ト書き", text: "扉を調べた。" },
        { logId: "room1_door_wooden", logType: "investigation", speaker: "ト書き", text: "木製の扉だ。" },
        { logId: "room1_door_first_02", logType: "investigation", speaker: "ト書き", text: "ドアノブを回してみた。" },
        { logId: "room1_door_locked_dialogue", logType: "dialogue", speaker: "主人公", text: "……開かない" },
        { logId: "room1_door_lock_thought", logType: "investigation", speaker: "ト書き", text: "鍵がかかっているのだろうか。" },
        { logId: "room1_door_question_noticed", logType: "investigation", speaker: "ト書き", text: "よく見ると、扉には文字が刻まれている。" }
    ],
    doorQuestion: [
        { logId: "room1_door_question_01", logType: "investigation", speaker: "問題文", text: "会話に隠された、音楽を奏でよ" },
        { logId: "room1_door_question_02", logType: "dialogue", speaker: "主人公", text: "……これが、最初の謎？" },
        { logId: "room1_door_question_03", logType: "dialogue", speaker: "主人公", text: "会話に隠された、音楽……？" }
    ],
    doorRepeat: [
        { logId: "room1_door_repeat_01", logType: "investigation", speaker: "ト書き", text: "扉には文字が刻まれている。" },
        { logId: "room1_door_repeat_02", logType: "investigation", speaker: "問題文", text: "会話に隠された、音楽を奏でよ" }
    ],
    poster: [
        { logId: "room1_poster_checked", logType: "investigation", speaker: "ト書き", text: "ポスターを調べた。" },
        { logId: "room1_poster_01", logType: "investigation", speaker: "主人公", thought: true, text: "〇〇市立第三中学校、吹奏楽部……第28回サマーコンサート" },
        { logId: "room1_poster_02", logType: "investigation", speaker: "主人公", thought: true, text: "8月13日、日曜日。18時30分開演……" },
        { logId: "room1_poster_03", logType: "investigation", speaker: "主人公", thought: true, text: "演奏曲は、青春アミーゴ、宙船、水戸黄門のテーマ、きよしのズンドコ節、アンパンマンのマーチ、ドレミのうた……など" },
        { logId: "room1_poster_04", logType: "narration", speaker: "主人公", thought: true, text: "なぜだか、懐かしい感じがする" },
        { logId: "room1_poster_05", logType: "narration", speaker: "主人公", thought: true, text: "この中のどれかを演奏しないといけないのか……？" }
    ],
    phoneIntroduction: [
        { logId: "room1_phone_introduction_01", logType: "investigation", speaker: "ト書き", text: "机の上に携帯電話が置かれている。" },
        { logId: "room1_phone_introduction_02", logType: "investigation", speaker: "ト書き", text: "画面を開くと、メールボックスが表示された。" }
    ],
    phoneAfterAllMail: [
        { logId: "room1_phone_all_mail_01", logType: "narration", speaker: "主人公", thought: true, text: "吹奏楽部の先輩と後輩のやり取りみたいだな" },
        { logId: "room1_phone_all_mail_02", logType: "narration", speaker: "主人公", thought: true, text: "特に、おかしなところはなさそうだけど……" }
    ],
    phoneMail: {
        inbox: [
            { logId: "room1_phone_inbox_01", logType: "investigation", id: "inbox-1", from: "先輩", time: "20:15", subject: "今日の練習お疲れさま！", text: "帰り道に見た空、夕焼けがすごくきれいだったね。\n\n今日も練習お疲れさま！" },
            { logId: "room1_phone_inbox_02", logType: "investigation", id: "inbox-2", from: "先輩", time: "20:17", subject: "Re.Re. 今日の練習お疲れさま！", text: "この調子なら本番も大丈夫！\n\nファイト！" },
            { logId: "room1_phone_inbox_03", logType: "investigation", id: "inbox-3", from: "先輩", time: "20:19", subject: "Re.Re.Re.Re. 今日の練習お疲れさま！", text: "そうだ！\n\n本番が終わったら、一緒にドーナツ食べに行かない？\n\n駅の近くに新しいお店ができたんだって。" },
            { logId: "room1_phone_inbox_04", logType: "investigation", id: "inbox-4", from: "先輩", time: "20:21", subject: "Re.Re.Re.Re.Re.Re. 今日の練習お疲れさま！", text: "じゃあ決まり！\n\nドーナツ食べながら、本番の打ち上げしよう！" }
        ],
        sent: [
            { logId: "room1_phone_sent_01", logType: "investigation", id: "sent-1", to: "先輩", time: "20:16", subject: "Re. 今日の練習お疲れさま！", text: "お疲れさまです！\n\nありがとうございます。\n\nトランペット、もっと上手くなれるように頑張ります！" },
            { logId: "room1_phone_sent_02", logType: "investigation", id: "sent-2", to: "先輩", time: "20:18", subject: "Re.Re.Re. 今日の練習お疲れさま！", text: "はい！\n\nみんなと一緒なら、最後まで頑張れそうです。" },
            { logId: "room1_phone_sent_03", logType: "investigation", id: "sent-3", to: "先輩", time: "20:20", subject: "Re.Re.Re.Re.Re. 今日の練習お疲れさま！", text: "行きたいです！\n\nこの前レモン味を食べたんですけど、すごくおいしかったです。" },
            { logId: "room1_phone_sent_04", logType: "investigation", id: "sent-4", to: "先輩", time: "20:22", subject: "Re.Re.Re.Re.Re.Re.Re. 今日の練習お疲れさま！", text: "ありがとうございます！\n\n先輩たちと一緒に演奏できて、本当に幸せです。\n\n本番も頑張ります！" }
        ]
    },
    pianoIntroduction: [
        { logId: "room1_piano_introduction_01", logType: "investigation", speaker: "ト書き", text: "鍵盤を指で押してみる。" },
        { logId: "room1_piano_introduction_02", logType: "investigation", speaker: "ト書き", text: "澄んだ音が、部屋に響いた。" },
        { logId: "room1_piano_introduction_03", logType: "narration", speaker: "主人公", thought: true, text: "ドレミの場所くらいならわかるけど……" },
        { logId: "room1_piano_introduction_04", logType: "narration", speaker: "主人公", thought: true, text: "ピアノで演奏なんて、できるかな？" }
    ],
    pianoIncorrect: [
        { logId: "room1_piano_incorrect", logType: "investigation", speaker: "ト書き", text: "何も起こらない。" },
        { logId: "room1_piano_incorrect_02", logType: "investigation", speaker: "ト書き", text: "どうやら、違ったようだ。" }
    ],
    pianoCorrect: [
        { logId: "room1_piano_correct", logType: "investigation", speaker: "ト書き", text: "ソ・ラ・ファ・ミ・ド・レ・ド・シ♪" },
        { logId: "room1_piano_correct_02", logType: "narration", speaker: "ト書き", text: "ピアノの音が止まる。" },
        { logId: "room1_piano_correct_03", logType: "narration", speaker: "ト書き", text: "その直後――" },
        { logId: "room1_piano_correct_04", logType: "narration", speaker: "ト書き", text: "どこからか、音楽が聴こえてきた。" },
        { logId: "room1_piano_correct_05", logType: "dialogue", speaker: "主人公", text: "この曲は……" },
        { logId: "room1_piano_correct_06", logType: "narration", speaker: "ト書き", text: "視界が、ゆっくりと揺らぐ。" },
        { logId: "room1_piano_correct_07", logType: "narration", speaker: "ト書き", text: "懐かしい音に引かれるように、意識が遠のいていく。" }
    ],
    memory: [
        { logId: "room1_memory_music_room_01", logType: "narration", speaker: "ト書き", text: "放課後の音楽室。" },
        { logId: "room1_memory_music_room_02", logType: "narration", speaker: "ト書き", text: "いくつもの楽器の音が重なり、部屋いっぱいに響いている。" },
        { logId: "room1_memory_music_room_03", logType: "narration", speaker: "ト書き", text: "指揮に合わせて、トランペットを構える。" },
        { logId: "room1_memory_music_room_04", logType: "narration", speaker: "ト書き", text: "息を吸い込み、音を出す。" },
        { logId: "room1_memory_music_room_05", logType: "narration", speaker: "ト書き", text: "少しだけ音が揺れた。" },
        { logId: "room1_memory_music_room_06", logType: "narration", speaker: "ト書き", text: "隣から聞こえる先輩たちの演奏は、ずっと安定している。" },
        { logId: "room1_memory_music_room_07", logType: "narration", speaker: "主人公", thought: true, text: "やっぱり、まだまだだな……" },
        { logId: "room1_memory_music_room_08", logType: "narration", speaker: "ト書き", text: "もう一度、譜面に目を戻す。" },
        { logId: "room1_memory_music_room_09", logType: "narration", speaker: "ト書き", text: "何度か同じ場所を繰り返し、ようやく音が揃ってきたころ――。" },
        { logId: "room1_memory_music_room_10", logType: "dialogue", speaker: "顧問", text: "はい、今日はここまで！　パートリーダーは、このあと私のところに来るように" },
        { logId: "room1_memory_music_room_11", logType: "dialogue", speaker: "部長", text: "ありがとうございました！" },
        { logId: "room1_memory_music_room_12", logType: "dialogue", speaker: "部員全員", text: "ありがとうございました！" },
        { logId: "room1_memory_music_room_13", logType: "narration", speaker: "ト書き", text: "顧問が楽譜をまとめ、席を立つ。" },
        { logId: "room1_memory_music_room_14", logType: "narration", speaker: "ト書き", text: "張りつめていた空気がほどけ、部員たちがそれぞれ楽器を片づけ始めた。" },
        { logId: "room1_memory_music_room_15", logType: "narration", speaker: "ト書き", text: "ケースにトランペットをしまっていると、後ろから声をかけられる。" },
        { logId: "room1_memory_music_room_16", logType: "dialogue", speaker: "先輩", text: "今日、すごく良くなってたじゃん！" },
        { logId: "room1_memory_music_room_17", logType: "dialogue", speaker: "主人公", text: "え……本当ですか？" },
        { logId: "room1_memory_music_room_18", logType: "dialogue", speaker: "先輩", text: "うん。だいぶ安定してきてた！" },
        { logId: "room1_memory_music_room_19", logType: "dialogue", speaker: "先輩", text: "先生も褒めてたよ。あとは、もう少しロングトーンの練習を増やそうって" },
        { logId: "room1_memory_music_room_20", logType: "dialogue", speaker: "主人公", text: "ありがとうございます。やっぱり、ロングトーンが大事ですよね" },
        { logId: "room1_memory_music_room_21", logType: "dialogue", speaker: "先輩", text: "本番までまだ時間があるから、焦らずやっていこうね" },
        { logId: "room1_memory_bus_01", logType: "narration", speaker: "ト書き", text: "――バス停までの帰り道。" },
        { logId: "room1_memory_bus_02", logType: "dialogue", speaker: "先輩", text: "この前食べたドーナツ、おいしかったな〜" },
        { logId: "room1_memory_bus_03", logType: "dialogue", speaker: "主人公", text: "そうですね。先輩、かなり食べてませんでした？" },
        { logId: "room1_memory_bus_04", logType: "dialogue", speaker: "先輩", text: "ドーナツってさ、真ん中に穴開いてるじゃん？" },
        { logId: "room1_memory_bus_05", logType: "dialogue", speaker: "主人公", text: "えっ？　まあ、はい。開いてないのもありますけど……" },
        { logId: "room1_memory_bus_06", logType: "dialogue", speaker: "先輩", text: "穴が開いてる分、ヘルシーだと思うんだよね！" },
        { logId: "room1_memory_bus_07", logType: "dialogue", speaker: "主人公", text: "穴が開いてないものと比べたら、そうですかね？" },
        { logId: "room1_memory_bus_08", logType: "narration", speaker: "主人公", thought: true, text: "でも、4つくらい食べてたような……" },
        { logId: "room1_memory_bus_09", logType: "dialogue", speaker: "先輩", text: "だからさ〜、穴が開いてる食べ物って、カロリー低いと思うんだよね！" },
        { logId: "room1_memory_bus_10", logType: "dialogue", speaker: "主人公", text: "……何の話ですか？" },
        { logId: "room1_memory_bus_11", logType: "dialogue", speaker: "先輩", text: "イカリングとか、オニオンリングとか！" },
        { logId: "room1_memory_bus_12", logType: "dialogue", speaker: "主人公", text: "揚げ物ですね……" },
        { logId: "room1_memory_bus_13", logType: "dialogue", speaker: "先輩", text: "あとは〜、れんこんとか！　いっぱい穴開いてるし！" },
        { logId: "room1_memory_bus_14", logType: "dialogue", speaker: "主人公", text: "……どういう理屈ですか……" },
        { logId: "room1_memory_bus_15", logType: "dialogue", speaker: "先輩", text: "わたし、れんこん好きなんだよね〜" },
        { logId: "room1_memory_bus_16", logType: "narration", speaker: "主人公", thought: true, text: "すごい。話が止まらない" },
        { logId: "room1_memory_bus_17", logType: "dialogue", speaker: "先輩", text: "れんこんの南蛮漬けが好きなんだよね！" },
        { logId: "room1_memory_bus_18", logType: "narration", speaker: "主人公", thought: true, text: "話が変わりすぎてすごい" },
        { logId: "room1_memory_bus_19", logType: "dialogue", speaker: "主人公", text: "れんこんの南蛮漬けですか。食べたことないですね" },
        { logId: "room1_memory_bus_20", logType: "dialogue", speaker: "主人公", text: "あ、先輩。バスが来ましたよ" },
        { logId: "room1_memory_bus_21", logType: "narration", speaker: "ト書き", text: "先輩が乗るバスが来た。" },
        { logId: "room1_memory_bus_22", logType: "narration", speaker: "ト書き", text: "僕が乗るバスとは、反対方向へ向かうバスだ。" },
        { logId: "room1_memory_bus_23", logType: "dialogue", speaker: "先輩", text: "えっ！？　食べたことないの？" },
        { logId: "room1_memory_bus_24", logType: "dialogue", speaker: "先輩", text: "じゃあ今度、作ってあげるね！　次は――" },
        { logId: "room1_memory_bus_25", logType: "narration", speaker: "ト書き", text: "先輩はバスに乗り込んでも、扉が閉まる直前まで話し続けていた。" },
        { logId: "room1_memory_bus_26", logType: "dialogue", speaker: "主人公", text: "えっ？" },
        { logId: "room1_memory_bus_27", logType: "narration", speaker: "ト書き", text: "最後に何と言ったのかは、聞き取れなかった。" },
        { logId: "room1_memory_bus_28", logType: "narration", speaker: "ト書き", text: "窓越しに大きく手を振る先輩に、僕も小さく手を振り返した。" },
        { logId: "room1_memory_bus_29", logType: "narration", speaker: "ト書き", text: "――視界が揺らぐ。" },
        { logId: "room1_memory_bus_30", logType: "narration", speaker: "ト書き", text: "遠ざかっていくバスの音も、先輩の姿も、少しずつぼやけていく。" }
    ],
    afterMemory: [
        { logId: "room1_after_memory_01", logType: "narration", speaker: "ト書き", text: "気がつくと、視界は元の部屋に戻っていた。" },
        { logId: "room1_memory_03", logType: "dialogue", speaker: "主人公", text: "今のは……僕の記憶？" },
        { logId: "room1_after_memory_unlock_sound", logType: "narration", speaker: "ト書き", text: "ガチャッ。" },
        { logId: "room1_after_memory_04", logType: "narration", speaker: "ト書き", text: "扉のほうから、小さな音がした。" },
        { logId: "room1_after_memory_05", logType: "narration", speaker: "ト書き", text: "どうやら、扉の鍵が外れた音のようだ。" },
        { logId: "room1_after_memory_06", logType: "dialogue", speaker: "ハナ", text: "すごい！　謎が解けたね！" },
        { logId: "room1_after_memory_07", logType: "dialogue", speaker: "主人公", text: "そうみたいですね" },
        { logId: "room1_after_memory_08", logType: "dialogue", speaker: "主人公", text: "いま、ピアノを弾いたら……昔の記憶のようなものが見えたんです" },
        { logId: "room1_after_memory_09", logType: "dialogue", speaker: "ハナ", text: "やっぱり、この部屋には君の記憶が残っているみたいだね" },
        { logId: "room1_after_memory_10", logType: "dialogue", speaker: "主人公", text: "でも、なんだかよくわからない記憶だったんですよね" },
        { logId: "room1_after_memory_11", logType: "dialogue", speaker: "ハナ", text: "……そうなんだ" },
        { logId: "room1_after_memory_12", logType: "dialogue", speaker: "主人公", text: "この先にも僕の記憶があるんでしょうか" },
        { logId: "room1_after_memory_13", logType: "dialogue", speaker: "ハナ", text: "きっと、そうだね。大事な記憶も思い出せるよ" },
        { logId: "room1_after_memory_14", logType: "dialogue", speaker: "ハナ", text: "じゃあ次の部屋に行こうか" }
    ],
    unlockedDoor: [
        { logId: "room1_door_open_checked", logType: "investigation", speaker: "ト書き", text: "扉の鍵は開いている。" },
        { logId: "room1_door_open_02", logType: "investigation", speaker: "ト書き", text: "このまま先へ進めそうだ。" }
    ],
    nextRoom: [
        { logId: "room1_next_room_01", logType: "narration", speaker: "ト書き", text: "僕はドアノブに手を伸ばした。" },
        { logId: "room1_next_room_02", logType: "narration", speaker: "ト書き", text: "開けようとすると、また扉はひとりでに開いた。" },
        { logId: "room1_next_room_03", logType: "narration", speaker: "ト書き", text: "扉の向こうへ、身体が吸い込まれていくような感覚に襲われる。" },
        { logId: "room1_next_room_04", logType: "narration", speaker: "ト書き", text: "視界が、まばゆい光に包まれていく。" }
    ],
    keepExploring: [
        { logId: "room1_keep_exploring_01", logType: "narration", speaker: "主人公", thought: true, text: "まだ何か調べられるかもしれない" }
    ]
};
