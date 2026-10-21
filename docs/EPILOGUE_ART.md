# エピローグ不足画像の補完（2026-10-21）

最新 main c62a4a6 を確認。旧 IMAGE_ASSET_LIST の未着手欄には実装済み・廃止仕様が混在するため制作根拠にはしない。

確認した不足は、late-game.js の r8Epilogue が文字と単色背景で表現していた病室と二人の部屋。既存回想27点は作り直さない。

- images/background/room08/epilogue-hospital.webp: 仰向けの主人公視点、白い天井。
- images/background/room08/epilogue-home.webp: 既存第8の部屋と同じ住居、昼の光、パソコンと書きためたノート。

内蔵 image_gen 使用。参照は room08_dissolve_01_full.png。公開第8の画面をCloud Browserで確認後に生成。原画は1672×941、可逆WebP（画素変更なし）。自宅の初稿はノートが会話欄に隠れるため不採用とし、上方配置した修正版を使用。

## 制作プロンプト要旨
病室: illustration-story / 16:9 / first-person lying in hospital bed looking upward at white ceiling / subtle seams and simple rectangular light / pale curtain edge / match reference crisp pixel clusters and stepped shading / no people, text, UI.
自宅: same apartment and pixel style / ordinary daylight / seated first-person table view / laptop and open puzzle notebook / preserve curtains, cabinets, door / no people, UI or new decorations.
修正: preserve room and style; place laptop and entire notebook above dialogue overlay, lower 30% empty tabletop; add faint illegible pencil sketches and crossed-out lines.

## 検証
room8-flow.test.cjs および late-game-flow.test.cjs 成功（保存復帰・最終謎・扉・エピローグ・END）。画像単体を目視確認。公開反映後のエピローグ画面確認は未完了。

## ユーザー修正：寝室の机
退院後はリビングではなく寝室の机にフォーカスする指示に従い、epilogue-bedroom.webpへ差し替え。パソコンとノートを主役とし、ベッドは背景の端のみ。内蔵image_genで既存画像を編集。従来のリビング版は使用しない。
プロンプト: Bedroom, close focus on personal writing desk, laptop and used puzzle notebook fully visible above dialogue area, peripheral bed edge, preserve pixel-art style, no living-room furniture or people.

## 追加修正：壁向き・ノート2冊
机の奥辺を壁に接する構図にし、開いたノートと閉じたノートを1冊ずつ配置。epilogue-bedroom-v2.webpへ差し替え。パソコンと2冊のノートは会話欄より上に収めた。内蔵image_genで寝室版を編集し、目視確認済み。
プロンプト: desk rear edge flush against wall, seated first-person facing wall; exactly one open puzzle notebook and one closed notebook, preserve laptop and pixel-art style, all props visible above dialogue overlay.

## 追加修正：壁への密着・表紙・うさぎ
机の奥辺と壁の接点を明確にし、閉じたノートに手書きの「謎解きネタ帳」、開いたノートの見開きに不器用な鉛筆描きのうさぎを追加。epilogue-bedroom-v3.webpへ差し替え。内蔵image_genでv2を編集。表記6文字と机・壁の接点を目視確認済み。
プロンプト: preserve bedroom, laptop, notebook placement, daylight and pixel style; desk rear edge touching wall with thin contact shadow and no gap; closed notebook exact handwritten text「謎解きネタ帳」; open spread one clumsy pencil rabbit with uneven ears and awkward body; props remain above dialogue region.

## 追加修正：謎解きノート・文字と図形
表紙の手書きタイトルを「謎解きノート」に変更。見開きにはうさぎを残し、「メモ」「順番？」「ここを変える」、丸・三角・四角、矢印、小さな格子、書き直し跡を追加。epilogue-bedroom-v4.webpへ差し替え。内蔵image_genでv3を編集。表紙の6文字・うさぎ・余白のメモを目視確認し、可逆WebP変換の画素一致を確認。
プロンプト: edit only notebook markings; cover exact handwritten「謎解きノート」; keep clumsy rabbit and add small handwritten notes, circle/triangle/square, arrows, grid, question marks and crossed-out trials; preserve all room geometry, laptop, notebooks, light and pixel style.
