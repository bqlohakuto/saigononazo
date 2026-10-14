# 第4：12星座の花

## 調査結果と採用方針

- 「正式な誕生花」の公的な統一規格はない。月・日別の誕生花と、星座に結び付けた花は別の対応である。
- 既存のシナリオは「12星座それぞれにまつわる花の紹介展示」。そのため月別・日別の誕生花へ置き換えず、花専門店Interfloraが紹介する星座の花を一つの出典として採用する。公的・天文学的な規格、普遍的な誕生花とは表記しない。
- Interfloraと1-800-Flowersではおとめ座の花が異なる（Interfloraはキク、1-800-Flowersはバターカップ）。対応表の混在はせず、Interfloraの表を全12種に統一する。個々の星座の性格や象徴の断定は掲載せず、花の姿を独自に説明する。

## 出典（2026-10-14確認）

- Interflora, “Zodiac Flowers: Discover the Best Flowers for Each Star Sign”, 2026-02-02: https://www.interflora.co.uk/blog/flower-guides/zodiac-flowers
- Interfloraの誕生花と星座の花の区別: https://www.interflora.co.uk/blog/flower-guides/birth-flowers
- 花百花「誕生日に贈りたい！1月から12月の誕生花」: https://hanahyakka.com/Form/Story/tanjou-ka/tanjou-ka-tuki （統一規格がない旨を説明）
- 比較資料: https://www.1800flowers.com/articles/flower-facts/zodiac-sign-flowers
- スイカズラ類の植物情報: https://www.rhs.org.uk/plants/honeysuckle

## 採用対応表

|星座|出典の花|展示名・絵の代表例|
|---|---|---|
|おひつじ座|Honeysuckle|ハニーサックル（スイカズラ類）|
|おうし座|Poppy|ポピー（ヒナゲシを描画）|
|ふたご座|Lavender|ラベンダー|
|かに座|White Rose|白いバラ|
|しし座|Sunflower|ヒマワリ|
|おとめ座|Chrysanthemum|キク|
|てんびん座|Rose|バラ（赤い花を描画）|
|さそり座|Geranium|ゼラニウム（園芸名のPelargonium）|
|いて座|Carnation|カーネーション|
|やぎ座|Pansy|パンジー|
|みずがめ座|Orchid|ラン（コチョウランを描画）|
|うお座|Water Lily|スイレン|

## 素材

- 花の絵は新規のimagegen生成素材。原資料の写真やイラストを転載していない。既存の第4右壁と星座展示を実際に目視し、画風を合わせた。
- `images/exhibits/room04/zodiac-flowers-atlas-coarse.png`（1448×1086、透過、4列×3行、各セル362×362）。原画像の画素を編集・切り抜きせずCSSスプライトで参照。
- 元の生成ファイルも残している。実装用コピーをGitHubへ保存する。
- 生成仕様：16bit〜DS風の太い輪郭と自然な陰影のドット植物図。4列×3行の透過アトラスに、上の対応表順の12種類を各セルに収める。名前・記号・額縁・文字は描き込まない。図は厳密な植物標本ではなく、見た目を紹介するイラストとして扱う。
- 部屋の右壁の花展示と、拡大展示に同じ素材を使用。おとめ座だけを強調しない。画面の常設案内文・枚数表示は復活させない。

- ユーザーの追加指示でドット数を減らし、花1種類あたり約48〜64の論理ドット幅を目標に、同じ12種と配置を粗いドット表現へ編集した。細かな葉脈・陰影を減らし、大きな四角い画素と明瞭な輪郭を使用。元の高精細アトラスは生成元として残し、本編には粗い版のみ配置。
