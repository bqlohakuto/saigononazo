# 第4：12星座の解説展示

## 表示

- おひつじ・おうし・ふたご・かに・しし・おとめ・てんびん・さそり・いて・やぎ・みずがめ・うおの12星座。白鳥座は含めない。
- 星座ごとに名称・ラテン名・星座図・短い形の解説を同じ形式で表示。おとめ座だけの色・大きさ・初期選択・正解ラベルは設けない。
- 星座一覧の調査会話終了後に展示を開く。クリックで拡大、一覧へ戻る、Escで閉じる。既存の調査文・正解後の台詞・謎判定は維持。
- 星の図は星の赤経・赤緯から局所の心射図法で平面へ投影し、東を左・北を上として、縦横比を保って正規化。141個の星。星座ごとに表示倍率は異なる。星座線は伝統的な線の一例であり、星座のIAU境界そのものではない。

## 出典・ライセンス

- 星の位置・等級: HYG 4.1 / David Nash (astronexus)。https://github.com/astronexus/HYG-Database/blob/main/hyg/CURRENT/hygdata_v41.csv
- HYG README: https://github.com/astronexus/HYG-Database/blob/main/hyg/README.md — CC BY-SA 4.0。
- 星座線: Stellarium team, Western sky culture。https://github.com/Stellarium/stellarium-skycultures/blob/master/western/index.json
- Stellarium western description: https://github.com/Stellarium/stellarium-skycultures/blob/master/western/description.md — Text and data: CC BY-SA。イラスト素材は使用していない。
- 名前とラテン名: 国立天文台の星座名一覧 https://www.nao.ac.jp/new-info/constellation.html 、IAU constellation list https://www.iau.org/IAU/IAU/Astronomy-FAQs/Constellations.aspx
- 日本語解説は名称の意味と、採用した星座線をもとに独自に記述。占星術の誕生日区間・観測季節・正解への誘導は付加しない。
- `room4-zodiac.js` の R4_ZODIAC 配列に含まれる派生星図データは CC BY-SA 4.0。クレジットと原資料へのリンクは展示内「図の出典」から読める。これらのデータ以外のゲームコード・文章の権利とは分離する。https://creativecommons.org/licenses/by-sa/4.0/

## 次の作業

- ガラスパネル5枚の星配置と実投影はまだ従来の仮表示。展示内おとめ座データを基準に各パネルへ分割し、既存正解角度との一致を作る。今回の展示だけを理由にパズル条件を変えない。
- 花・世界の月・流れ星の展示は次工程。
