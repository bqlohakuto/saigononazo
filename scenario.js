// LOG ID は文章から生成せず、並び替えても既存の ID を維持する。
// 文章を分割して表示する場合は、共通処理で各部分の連番を ID の末尾に付ける。
// オープニング
const openingScenario = [
    { logId: "opening_01", logType: "narration", speaker: "主人公", thought: true, text: "眩しい。\n何も見えない。" },
    { logId: "opening_02", logType: "narration", speaker: "ト書き", text: "真っ白な視界が、少しずつ光に慣れていく。" },
    { logId: "opening_03", logType: "narration", speaker: "ト書き", text: "そこは四方を白い壁に囲われた部屋だった。\n天井についた照明が、痛いくらい部屋を照らしている。" },
    { logId: "opening_04", logType: "dialogue", speaker: "ハナ", text: "良かった、気がついたんだね" },
    { logId: "opening_05", logType: "narration", speaker: "ト書き", text: "天井を見上げていると、後ろから声をかけられた。\nはっとして振り向くと、1人の女性がこちらに微笑みかけていた。" },
    { logId: "opening_06", logType: "dialogue", speaker: "主人公", text: "君は……誰？" },
    { logId: "opening_07", logType: "narration", speaker: "ト書き", text: "反射的に問いかける。\n彼女は少し眉を顰めて黙り込んだあと、口を開いた。" },
    { logId: "opening_08", logType: "dialogue", speaker: "ハナ", text: "ごめんね。今は何も話せないんだ。\nどういうことかって思うかもしれないけど……\n自分のことは、わかる？" },
    { logId: "opening_09", logType: "dialogue", speaker: "主人公", text: "自分のこと？" },
    { logId: "opening_10", logType: "narration", speaker: "主人公", thought: true, text: "自分は……名前は？\nどうやってここに？" },
    { logId: "opening_11", logType: "narration", speaker: "ト書き", text: "記憶を辿ろうとしても、ついさっき見た天井の照明以外に何も浮かんでこない。\n頭の中が真っ白になっていた。" },
    { logId: "opening_12", logType: "dialogue", speaker: "主人公", text: "何も……思い出せない" },
    { logId: "opening_13", logType: "dialogue", speaker: "ハナ", text: "何も、思い出せないよね" },
    { logId: "opening_14", logType: "dialogue", speaker: "ハナ", text: "わたしが記憶を取り戻すのを手伝ってあげる！" },
    { logId: "opening_15", logType: "dialogue", speaker: "主人公", text: "記憶を取り戻す？　どうやって？" },
    { logId: "opening_16", logType: "dialogue", speaker: "ハナ", text: "それは、この先の部屋に進めばわかるよ" },
    { logId: "opening_17", logType: "narration", speaker: "ト書き", text: "彼女が指を指す先には、先ほどまでは何もなかったはずの部屋の壁に、一つの扉ができていた。" },
    { logId: "opening_18", logType: "dialogue", speaker: "主人公", text: "いったい、どういうことなんだ？" },
    { logId: "opening_19", logType: "narration", speaker: "ト書き", text: "急な展開に、頭の整理が追いつかない。" },
    { logId: "opening_20", logType: "dialogue", speaker: "ハナ", text: "安心して、大丈夫だよ。\n最後まで一緒にいるからね。\nさあ、扉を開けて？" },
    { logId: "opening_21", logType: "narration", speaker: "ト書き", text: "彼女に背中を押され、僕は扉のドアノブを回した。\n扉はひとりでに開き、部屋の中に吸い込まれるようだった。\n視界が一瞬、まばゆい光に包まれた。" }
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
