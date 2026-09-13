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
    { logId: "opening_12", logType: "dialogue", speaker: "ハナ", displayName: "？？？", text: "よかった、気がついたんだね" },
    { logId: "opening_13", logType: "narration", speaker: "ト書き", text: "天井を見上げていると、不意に後ろから声がした。" },
    { logId: "opening_14", logType: "narration", speaker: "ト書き", text: "はっとして振り向くと、そこには黒髪の美しい女性が、静かに立っていた。" },
    { logId: "opening_15", logType: "dialogue", speaker: "主人公", text: "あなたは……？" },
    { logId: "opening_16", logType: "narration", speaker: "ト書き", text: "反射的に、問いかける。" },
    { logId: "opening_17", logType: "narration", speaker: "ト書き", text: "彼女は少し眉をひそめ、しばらく黙ったあと、ゆっくりと口を開いた。" },
    { logId: "opening_18", logType: "dialogue", speaker: "ハナ", displayName: "？？？", text: "ごめんね。いまは、何も言えないの" },
    { logId: "opening_19", logType: "dialogue", speaker: "ハナ", displayName: "？？？", text: "きみは……自分のこと、わかる？" },
    { logId: "opening_20", logType: "dialogue", speaker: "主人公", text: "自分のこと……？" },
    { logId: "opening_21", logType: "narration", speaker: "ト書き", text: "問いかけるように、自分でもその言葉を繰り返す。" },
    { logId: "opening_22", logType: "narration", speaker: "主人公", thought: true, text: "僕は……" },
    { logId: "opening_23", logType: "narration", speaker: "主人公", thought: true, text: "名前は……？" },
    { logId: "opening_24", logType: "narration", speaker: "主人公", thought: true, text: "どうやって、ここに来たんだ……？" },
    { logId: "opening_25", logType: "dialogue", speaker: "ハナ", displayName: "？？？", text: "混乱してると思うけど、大丈夫" },
    { logId: "opening_26", logType: "dialogue", speaker: "ハナ", displayName: "？？？", text: "君が忘れていることは、きっと思い出せる" },
    { logId: "opening_27", logType: "dialogue", speaker: "ハナ", displayName: "？？？", text: "わたしも、記憶を取り戻すのを手伝うから" },
    { logId: "opening_28", logType: "dialogue", speaker: "主人公", text: "記憶を取り戻す……？　どうやって？" },
    { logId: "opening_29", logType: "dialogue", speaker: "ハナ", displayName: "？？？", text: "それは、この先に進めばわかるよ" },
    { logId: "opening_30", logType: "narration", speaker: "ト書き", text: "彼女は、僕の後ろを指さした。" },
    { logId: "opening_31", logType: "narration", speaker: "ト書き", text: "振り返ると、先ほどまで何もなかったはずの白い壁に、一つの扉が現れていた。" },
    { logId: "opening_32", logType: "narration", speaker: "ト書き", text: "まるで最初からそこにあったかのように。" },
    { logId: "opening_33", logType: "narration", speaker: "ト書き", text: "そして、こちらを誘っているかのように。" },
    { logId: "opening_34", logType: "dialogue", speaker: "主人公", text: "一体、何が起きているんだ……？" },
    { logId: "opening_35", logType: "narration", speaker: "ト書き", text: "突然の出来事に、頭の整理が追いつかない。" },
    { logId: "opening_36", logType: "dialogue", speaker: "ハナ", displayName: "？？？", text: "大丈夫だよ" },
    { logId: "opening_37", logType: "dialogue", speaker: "ハナ", displayName: "？？？", text: "さあ、扉を開けて？" },
    { logId: "opening_38", logType: "narration", speaker: "ト書き", text: "彼女に背中を押され、僕はドアノブへと手を伸ばした。" },
    { logId: "opening_39", logType: "narration", speaker: "ト書き", text: "その瞬間、扉がひとりでに開く。" },
    { logId: "opening_40", logType: "narration", speaker: "ト書き", text: "扉の向こうへ、身体が吸い込まれていくような感覚に襲われた。" },
    { logId: "opening_41", logType: "narration", speaker: "ト書き", text: "視界が、瞬く間にまばゆい光に包まれていく。" },
    { logId: "opening_42", logType: "dialogue", speaker: "ハナ", displayName: "？？？", text: "大丈夫。わたしが一緒にいるから" },
    { logId: "opening_43", logType: "dialogue", speaker: "ハナ", displayName: "？？？", text: "最後の謎が解けるまで……" }
];

// 第一の部屋
// 謎そのものの内容は未決定のため、ここには確定している導入だけを置く。
const firstRoomScenario = {
    introduction: [
        { logId: "room1_introduction_01", logType: "narration", speaker: "システム", text: "ここからゲームのはじまりです。\n画面の気になるところをクリックしてください。" }
    ],
    hanaFirst: [
        { logId: "room1_hana_first_01", logType: "dialogue", speaker: "主人公", text: "あの……えっと……あなたは……" },
        { logId: "room1_hana_first_02", logType: "dialogue", speaker: "ハナ", text: "あ！ ごめんね。なんて呼んだら良いか迷ったよね" },
        { logId: "room1_hana_first_03", logType: "dialogue", speaker: "ハナ", text: "んー……そうだな" },
        { logId: "room1_hana_first_04", logType: "dialogue", speaker: "ハナ", text: "ハナって呼んで！ 名無しの花子さんから取ってハナ！" }
    ],
    hanaBeforeQuestion: [
        { logId: "room1_hana_before_question_01", logType: "dialogue", speaker: "ハナ", text: "あの扉、気になるよね？" },
        { logId: "room1_hana_before_question_02", logType: "narration", speaker: "ト書き", text: "正面の扉を指差した。" }
    ],
    hanaAfterQuestion: [
        { logId: "room1_hana_after_question_01", logType: "dialogue", speaker: "ハナ", text: "『会話に隠された音楽を奏でよ』って書いてあったね。これを解いたら鍵が開くのかな？" },
        { logId: "room1_hana_after_question_02", logType: "dialogue", speaker: "ハナ", text: "会話ってなんだろう？" }
    ],
    hanaMailHint: [
        { logId: "room1_hana_mail_hint_01", logType: "dialogue", speaker: "ハナ", text: "謎は『会話』だから、送信メールも見てみよう。" }
    ],
    phoneIntroduction: [
        { logId: "room1_phone_introduction_01", logType: "investigation", speaker: "主人公", text: "携帯電話だ。" },
        { logId: "room1_phone_introduction_02", logType: "investigation", speaker: "主人公", text: "中をしらべてみよう。" }
    ],
    phoneMail: {
        inbox: [
            { logId: "room1_phone_inbox_01", logType: "investigation", id: "inbox-1", from: "先輩", time: "20:15", subject: "今日の練習お疲れさま！", text: "帰り道の空、夕焼けがきれいだったね。\nお疲れさま！\nトランペット、すごく良くなってたよ。" },
            { logId: "room1_phone_inbox_02", logType: "investigation", id: "inbox-2", from: "先輩", time: "20:17", subject: "Re: 今日の練習お疲れさま！", text: "この調子なら本番も大丈夫！\nファイト！" },
            { logId: "room1_phone_inbox_03", logType: "investigation", id: "inbox-3", from: "先輩", time: "20:18", subject: "Re: 今日の練習お疲れさま！", text: "今度、みんなでドーナツ食べに行こうよ。" },
            { logId: "room1_phone_inbox_04", logType: "investigation", id: "inbox-4", from: "先輩", time: "20:19", subject: "Re: 今日の練習お疲れさま！", text: "いいね！ じゃあ今度探してみよう！\n他にもいろんなお店あるし。" }
        ],
        sent: [
            { logId: "room1_phone_sent_01", logType: "investigation", id: "sent-1", to: "先輩", time: "20:16", subject: "Re: 今日の練習お疲れさま！", text: "えっ、そうですか！？\nありがとうございます！\nもっと上手くなれるように頑張ります！" },
            { logId: "room1_phone_sent_02", logType: "investigation", id: "sent-2", to: "先輩", time: "20:17", subject: "Re: 今日の練習お疲れさま！", text: "はい！ 頑張ります！" },
            { logId: "room1_phone_sent_03", logType: "investigation", id: "sent-3", to: "先輩", time: "20:18", subject: "Re: 今日の練習お疲れさま！", text: "行きたいです！ 楽しみです。\nこの前レモンのドーナツを食べたんですけど、すごくおいしかったので、また食べたいです。" },
            { logId: "room1_phone_sent_04", logType: "investigation", id: "sent-4", to: "先輩", time: "20:21", subject: "Re: 今日の練習お疲れさま！", text: "ありがとうございます！\n練習もみんなで頑張れるし、そんな時間があるなんて幸せです。" }
        ]
    }
};
