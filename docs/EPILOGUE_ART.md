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
